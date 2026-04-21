'use client'

import { useConversation } from '@elevenlabs/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { type CSSProperties, useEffect, useRef, useState } from 'react'
import {
  DEFAULT_NOBU_SETTINGS,
  NOBU_ASSISTANT_NAME,
  getVibeInstruction,
  hexToRgb,
  loadNobuSettings,
  type NobuSettings,
} from './lib/nobu-settings'
import { useSession } from 'next-auth/react'
import { NOBU_ELEVENLABS_AGENT_ID } from './lib/nobu-env'

const NOBU_PERSONA = `
You are Nobu, a personal voice AI assistant.
You help with memory, notes, planning, organization, reflection, shopping, style, and everyday decisions.
You are personal-first, but you can also support school, business, creative work, and team projects when asked.
ScanFit is one of your built-in capabilities, not your whole identity.
When the user asks about fashion, outfits, sizing, shopping, measurements, influencer or creator looks, or body changes, switch into ScanFit support.
In ScanFit support, give honest outfit feedback, smart sizing guidance, look-history suggestions, styling ideas for events or moods, and shopping advice.
Be direct about what works and what does not, but never shame the user's body, identity, budget, or taste.
Do not claim exact body measurements unless the user provides them or a future scan feature supplies them.
You are not a romantic partner, boyfriend, girlfriend, spouse, or dating companion.
Match the user's tone, pace, vocabulary, formality, and energy.
If they are casual, be casual. If they are direct, be direct. If they joke, lightly match it.
If they sound stressed, become calmer and more grounding.
If they are formal or focused, be concise and professional.
Do not copy insults, cruelty, panic, or disrespect. Keep the same vibe while staying kind.
Never sound dismissive, sarcastic at the user's expense, impatient, condescending, or overly blunt.
Use short, natural sentences. Ask one simple follow-up when something is unclear.
Use short, natural spoken responses. Ask one simple follow-up when needed.
Underneath every role, you are always a quiet personal assistant.
You help capture notes, remember important details, and recall past context in every mode.
This support is natural and unobtrusive. The user should not have to manage it manually.
`

const introItems = [
  { prefix: 'Your', rest: 'Nobu.', tone: 'green', final: true },
]

type WakeListenStatus = 'idle' | 'listening' | 'blocked' | 'unsupported'

type SpeechRecognitionAlternative = {
  transcript: string
}

type SpeechRecognitionResult = {
  readonly isFinal: boolean
  readonly length: number
  [index: number]: SpeechRecognitionAlternative
}

type SpeechRecognitionResultList = {
  readonly length: number
  [index: number]: SpeechRecognitionResult
}

type SpeechRecognitionEvent = Event & {
  resultIndex: number
  results: SpeechRecognitionResultList
}

type SpeechRecognitionErrorEvent = Event & {
  error: string
}

type SpeechRecognition = EventTarget & {
  continuous: boolean
  interimResults: boolean
  lang: string
  maxAlternatives: number
  onend: (() => void) | null
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  abort: () => void
  start: () => void
  stop: () => void
}

type SpeechRecognitionConstructor = {
  new (): SpeechRecognition
}

type SpeechRecognitionWindow = Window & {
  SpeechRecognition?: SpeechRecognitionConstructor
  webkitSpeechRecognition?: SpeechRecognitionConstructor
}

function transcriptContainsWakeWord(transcript: string, wakeWord: string) {
  const escapedWakeWord = wakeWord.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  if (!escapedWakeWord) return false

  return new RegExp(`(^|[^\\p{L}\\p{N}])${escapedWakeWord}([^\\p{L}\\p{N}]|$)`, 'iu')
    .test(transcript)
}

function transcriptContainsWakeName(transcript: string) {
  return transcriptContainsWakeWord(transcript, NOBU_ASSISTANT_NAME)
}

function getSpeechTranscript(event: SpeechRecognitionEvent, index: number) {
  const result = event.results[index]
  const alternative = result?.[0]

  return alternative?.transcript?.trim().toLowerCase() ?? ''
}

export default function Home() {
  const router = useRouter()
  const { data: session, status: authStatus } = useSession()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const shouldListenForWakeRef = useRef(true)
  const wakeStartingRef = useRef(false)
  const [settings, setSettings] = useState<NobuSettings>(DEFAULT_NOBU_SETTINGS)
  const [introVisible, setIntroVisible] = useState(true)
  const [introExiting, setIntroExiting] = useState(false)
  const [wakeListenStatus, setWakeListenStatus] = useState<WakeListenStatus>('idle')
  const orbStyle = {
    '--nobu-color': settings.color,
    '--nobu-rgb': hexToRgb(settings.color),
  } as CSSProperties

  const {
    startSession,
    endSession,
    status,
    isSpeaking,
    isListening,
  } = useConversation()

  function stopWakeListening() {
    shouldListenForWakeRef.current = false
    recognitionRef.current?.abort()
    setWakeListenStatus('idle')
  }

  function startWakeListening() {
    if (!recognitionRef.current || wakeStartingRef.current || status !== 'disconnected') {
      return
    }
    shouldListenForWakeRef.current = true
    wakeStartingRef.current = true
    try {
      recognitionRef.current.start()
      setWakeListenStatus('listening')
    } catch {
      wakeStartingRef.current = false
    }
  }

  async function startNobuConversation() {
    stopWakeListening()
    try {
      await startSession({
        agentId: NOBU_ELEVENLABS_AGENT_ID,
        connectionType: 'webrtc',
        overrides: {
          agent: {
            prompt: { prompt: `${NOBU_PERSONA}\nYour name is ${NOBU_ASSISTANT_NAME}. ${getVibeInstruction(settings.vibe)}` },
            firstMessage: `Hey, I'm ${NOBU_ASSISTANT_NAME}. I'm here — talk to me.`
          },
          tts: { voiceId: settings.voiceId }
        },
      })
    } catch (error) {
      console.error('Unable to start ElevenLabs conversation:', error)
      startWakeListening()
    }
  }

  useEffect(() => {
    function syncSettings() {
      setSettings(loadNobuSettings())
    }

    syncSettings()
    window.addEventListener('nobu-settings-change', syncSettings)

    return () => {
      window.removeEventListener('nobu-settings-change', syncSettings)
    }
  }, [])

  useEffect(() => {
    if (authStatus === 'loading') return
    if (!session) {
      router.replace('/login')
      return
    }

    const hasCompleted = loadNobuSettings().hasCompletedOnboarding
    if (!hasCompleted) {
      router.replace('/onboarding')
    }
  }, [session, authStatus, router])

  useEffect(() => {
    const words = Array.from(document.querySelectorAll<HTMLElement>('.intro-word'))

    let cancelled = false
    const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

    async function runIntro() {
      await sleep(150)
      for (const word of words) {
        if (!word || cancelled) return
        const w = word
        const isFinal = w.dataset.final === 'true'
        w.style.transition = 'opacity 0.22s ease, transform 0.22s ease'
        w.style.opacity = '1'
        w.style.transform = 'translateY(0)'
        await sleep(isFinal ? 600 : 450)
        if (cancelled) return
        w.style.opacity = '0'
        w.style.transform = 'translateY(-10px)'
        await sleep(220)
      }
      setIntroExiting(true)
      await sleep(260)
      if (!cancelled) {
        setIntroVisible(false)
      }
    }

    runIntro()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!shouldListenForWakeRef.current || status === 'connected' || status === 'connecting') return
    let recognition: SpeechRecognition | null = null
    let wakeActive = true

    function startWake() {
      const SpeechRecognitionApi =
        (window as SpeechRecognitionWindow).SpeechRecognition ??
        (window as SpeechRecognitionWindow).webkitSpeechRecognition
      if (!SpeechRecognitionApi) {
        setWakeListenStatus('unsupported')
        return
      }
      recognition = new SpeechRecognitionApi()
      recognitionRef.current = recognition
      recognition.continuous = true
      recognition.interimResults = false
      recognition.lang = 'en-US'
      recognition.maxAlternatives = 1
      recognition.onerror = (event) => {
        wakeStartingRef.current = false
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          shouldListenForWakeRef.current = false
          setWakeListenStatus('blocked')
          return
        }
        setWakeListenStatus('idle')
      }
      recognition.onresult = (event: SpeechRecognitionEvent) => {
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript = getSpeechTranscript(event, i)
          if (!transcript) continue
          if (transcriptContainsWakeName(transcript)) {
            wakeActive = false
            recognition?.stop()
            startNobuConversation()
            break
          }
        }
      }
      recognition.onend = () => {
        wakeStartingRef.current = false
        if (wakeActive && recognition && shouldListenForWakeRef.current) recognition.start()
      }
      recognition.start()
      setWakeListenStatus('listening')
    }

    startWake()
    return () => {
      wakeActive = false
      recognition?.stop()
      if (recognitionRef.current === recognition) {
        recognitionRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.voiceId, settings.vibe, status])

  useEffect(() => {
    if (status !== 'connected') return
    let recognition: SpeechRecognition | null = null
    let endActive = true

    function startEndListener() {
      const SpeechRecognitionApi =
        (window as SpeechRecognitionWindow).SpeechRecognition ??
        (window as SpeechRecognitionWindow).webkitSpeechRecognition
      if (!SpeechRecognitionApi) return
      recognition = new SpeechRecognitionApi()
      recognition.continuous = true
      recognition.interimResults = false
      recognition.lang = 'en-US'
      recognition.onresult = (event: SpeechRecognitionEvent) => {
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript = getSpeechTranscript(event, i)
          if (!transcript) continue
          const donePhrase = `ok ${NOBU_ASSISTANT_NAME.toLowerCase()}, we are done for today`
          if (transcript.includes(donePhrase)) {
            endActive = false
            recognition?.stop()
            endSession()
            startWakeListening()
            break
          }
        }
      }
      recognition.onend = () => {
        if (endActive && recognition) recognition.start()
      }
      recognition.start()
    }

    startEndListener()
    return () => {
      endActive = false
      recognition?.stop()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const canvasElement = canvas
    const context = ctx
    let t = 0
    const amplitude = 3
    let animFrame: number

    function drawWave() {
      context.clearRect(0, 0, canvasElement.width, canvasElement.height)
      context.beginPath()
      context.strokeStyle = 'rgba(196,181,253,0.7)'
      context.lineWidth = 1.5
      for (let x = 0; x < canvasElement.width; x += 1) {
        const y = canvasElement.height / 2
          + Math.sin((x / canvasElement.width) * Math.PI * 1.5 + t) * amplitude
          + Math.sin((x / canvasElement.width) * Math.PI * 2.5 + t * 1.3) * (amplitude * 0.4)
        if (x === 0) context.moveTo(x, y)
        else context.lineTo(x, y)
      }
      context.stroke()
      t += 0.025
      animFrame = requestAnimationFrame(drawWave)
    }

    drawWave()
    return () => cancelAnimationFrame(animFrame)
  }, [])

  async function handleMeetNobu() {
    if (status === 'connecting') return
    if (status === 'connected') {
      await endSession()
      startWakeListening()
      return
    }
    await startNobuConversation()
  }

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { background: #f6fbff; min-height: 100%; overflow: hidden; }
        body { font-family: sans-serif; }
        .intro { position: fixed; inset: 0; z-index: 100; width: 100%; height: 100vh; background: #000; display: flex; align-items: center; justify-content: center; overflow: hidden; transition: opacity 0.7s ease; }
        .intro.exiting { opacity: 0; pointer-events: none; }
        .intro-word { position: absolute; max-width: calc(100vw - 40px); text-align: center; font-size: 64px; font-weight: 600; letter-spacing: 0; line-height: 1.05; opacity: 0; pointer-events: none; transform: translateY(10px); }
        .intro-prefix { color: #fff; }
        .intro-rest.green { color: #059669; }
        .universe { width: 100%; min-height: 100dvh; background: linear-gradient(180deg, #f8fcff 0%, #e6f4f1 46%, #eef1ff 100%); display: flex; flex-direction: column; align-items: center; justify-content: center; isolation: isolate; overflow: hidden; padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left); position: relative; }
        .universe::before { background: linear-gradient(90deg, rgba(33, 87, 88, 0.08) 1px, transparent 1px), linear-gradient(180deg, rgba(33, 87, 88, 0.06) 1px, transparent 1px); background-size: 42px 42px; content: ""; inset: 0; mask-image: linear-gradient(180deg, transparent 0%, #000 18%, #000 72%, transparent 100%); opacity: 0.62; pointer-events: none; position: absolute; z-index: 0; }
        .universe::after { background: radial-gradient(circle at 50% 36%, rgba(255,255,255,0.96), rgba(255,255,255,0.32) 24%, transparent 48%), linear-gradient(115deg, transparent 0%, rgba(var(--nobu-rgb),0.08) 42%, transparent 68%); content: ""; inset: 0; pointer-events: none; position: absolute; z-index: 0; }
        .stars-bg { position: absolute; inset: 0; width: 100%; height: 100%; mix-blend-mode: multiply; opacity: 0.46; pointer-events: none; z-index: 1; }
        .orb-system { position: relative; z-index: 2; width: 320px; height: 320px; display: flex; align-items: center; justify-content: center; pointer-events: none; }
        .atmo { position: absolute; width: 260px; height: 260px; border-radius: 50%; background: radial-gradient(circle at 50% 50%, transparent 38%, rgba(var(--nobu-rgb),0.08) 60%, rgba(var(--nobu-rgb),0.18) 75%, transparent 100%); animation: breathe 4s ease-in-out infinite; }
        .orb { width: 200px; height: 200px; border-radius: 50%; background: radial-gradient(circle at 32% 30%, #ffffff 0%, var(--nobu-color) 42%, #1a062f 100%); border: 2.5px solid rgba(var(--nobu-rgb),0.42); position: relative; z-index: 3; animation: float 5s ease-in-out infinite; box-shadow: 0 0 44px rgba(var(--nobu-rgb),0.28); overflow: hidden; }
        .universe.awake .orb { animation-duration: 3s; box-shadow: 0 0 80px rgba(var(--nobu-rgb),0.45); }
        .orb-speaking { animation-duration: 1.8s; box-shadow: 0 0 96px rgba(var(--nobu-rgb),0.58); }
        .orb-listening { box-shadow: 0 0 72px rgba(52,211,153,0.36), 0 0 44px rgba(var(--nobu-rgb),0.3); }
        .orb-shine { position: absolute; top: 20px; left: 24px; width: 55px; height: 34px; border-radius: 50%; background: rgba(255,255,255,0.28); transform: rotate(-35deg); filter: blur(2px); }
        .orb-shine2 { position: absolute; top: 36px; left: 40px; width: 20px; height: 12px; border-radius: 50%; background: rgba(255,255,255,0.18); transform: rotate(-35deg); }
        .orb-glow { position: absolute; bottom: 30px; right: 28px; width: 40px; height: 40px; border-radius: 50%; background: rgba(var(--nobu-rgb),0.32); filter: blur(8px); }
        .ring-wrap { position: absolute; width: 290px; height: 290px; z-index: 2; }
        .ring { position: absolute; top: 50%; left: 50%; width: 290px; height: 60px; margin-left: -145px; margin-top: -30px; border-radius: 50%; border: 1.5px solid rgba(var(--nobu-rgb),0.28); transform: rotateX(75deg); }
        .ring-inner { position: absolute; top: 50%; left: 50%; width: 240px; height: 46px; margin-left: -120px; margin-top: -23px; border-radius: 50%; border: 1px solid rgba(var(--nobu-rgb),0.24); transform: rotateX(75deg); }
        .wave-ring { position: absolute; border-radius: 50%; border: 1.5px solid rgba(var(--nobu-rgb),0.3); animation: wave-out 3s ease-out infinite; opacity: 0; }
        .wave-ring:nth-child(1) { width: 210px; height: 210px; animation-delay: 0s; }
        .wave-ring:nth-child(2) { width: 240px; height: 240px; animation-delay: 0.6s; }
        .wave-ring:nth-child(3) { width: 270px; height: 270px; animation-delay: 1.2s; }
        .particle { position: absolute; border-radius: 50%; animation: orbit linear infinite; top: 50%; left: 50%; }
        .canvas-wrap { position: absolute; bottom: 80px; left: 0; right: 0; display: flex; justify-content: center; pointer-events: none; z-index: 1; }
        .status { display: flex; align-items: center; gap: 7px; margin-top: 24px; position: relative; z-index: 5; }
        .s-dot { width: 7px; height: 7px; border-radius: 50%; background: #34d399; animation: blink 2s infinite; }
        .s-text { font-size: 13px; font-weight: 500; color: rgba(27,51,63,0.68); }
        .meet-btn { margin-top: 20px; background: var(--nobu-color); color: #fff; border: 1.5px solid rgba(var(--nobu-rgb),0.4); border-radius: 999px; cursor: pointer; font-size: 14px; font-weight: 500; min-height: 46px; min-width: 150px; padding: 13px 32px; position: relative; z-index: 6; pointer-events: auto; }
        .meet-btn.connected { background: #db2777; border-color: rgba(249,168,212,0.5); }
        .meet-btn:disabled { cursor: wait; opacity: 0.72; }
        .wake-indicator { position: fixed; top: 18px; left: 18px; z-index: 10; display: flex; align-items: center; gap: 8px; border: 1px solid rgba(27,51,63,0.12); border-radius: 999px; background: rgba(255,255,255,0.58); color: rgba(27,51,63,0.68); padding: 7px 10px; font-size: 11px; font-weight: 500; backdrop-filter: blur(10px); }
        .settings-link { position: fixed; top: 18px; right: 18px; z-index: 10; display: flex; align-items: center; justify-content: center; width: 34px; height: 34px; border: 1px solid rgba(27,51,63,0.12); border-radius: 999px; background: rgba(255,255,255,0.58); color: rgba(27,51,63,0.72); text-decoration: none; backdrop-filter: blur(10px); }
        .settings-link:hover { color: #122630; border-color: rgba(var(--nobu-rgb),0.45); }
        .wake-indicator-dot { width: 6px; height: 6px; border-radius: 999px; background: #34d399; box-shadow: 0 0 10px rgba(52,211,153,0.6); flex: 0 0 auto; }
        .wake-indicator.blocked .wake-indicator-dot,
        .wake-indicator.unsupported .wake-indicator-dot { background: #db2777; box-shadow: 0 0 10px rgba(219,39,119,0.48); }
        @media (max-width: 520px) {
          .intro-word { font-size: 48px; }
          .orb-system { width: 280px; height: 280px; }
          .orb { width: 178px; height: 178px; }
          .atmo { width: 232px; height: 232px; }
          .ring { width: 256px; margin-left: -128px; }
          .ring-inner { width: 212px; margin-left: -106px; }
          .wave-ring:nth-child(1) { width: 190px; height: 190px; }
          .wave-ring:nth-child(2) { width: 220px; height: 220px; }
          .wave-ring:nth-child(3) { width: 250px; height: 250px; }
          .wake-indicator { max-width: calc(100vw - 76px); }
        }
        @keyframes float { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-14px); } }
        @keyframes breathe { 0%,100% { transform: scale(1); } 50% { transform: scale(1.06); } }
        @keyframes wave-out { 0% { transform: scale(0.9); opacity: 0.6; } 100% { transform: scale(1.6); opacity: 0; } }
        @keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }
        @keyframes orbit { from { transform: rotate(0deg) translateX(130px) rotate(0deg); } to { transform: rotate(360deg) translateX(130px) rotate(-360deg); } }
      `}</style>

      {introVisible && (
        <div className={`intro ${introExiting ? 'exiting' : ''}`}>
          {introItems.map((item) => (
            <div
              className="intro-word"
              data-final={item.final ? 'true' : undefined}
              key={`${item.prefix} ${item.rest}`}
            >
              <span className="intro-prefix">{item.prefix} </span>
              <span className={`intro-rest ${item.tone}`}>{item.rest}</span>
            </div>
          ))}
        </div>
      )}

      <div className={`universe${status === 'connected' ? ' awake' : ''}`} style={orbStyle}>
        <Link aria-label="Open Nobu settings" className="settings-link" href="/settings">
          <svg aria-hidden="true" fill="none" height="17" viewBox="0 0 24 24" width="17">
            <path
              d="M12 15.5A3.5 3.5 0 1 0 12 8a3.5 3.5 0 0 0 0 7.5Z"
              stroke="currentColor"
              strokeWidth="1.8"
            />
            <path
              d="M19.4 13.5a7.6 7.6 0 0 0 0-3l2-1.5-2-3.4-2.4 1a7.8 7.8 0 0 0-2.6-1.5L14 2.5h-4l-.4 2.6A7.8 7.8 0 0 0 7 6.6l-2.4-1-2 3.4 2 1.5a7.6 7.6 0 0 0 0 3l-2 1.5 2 3.4 2.4-1a7.8 7.8 0 0 0 2.6 1.5l.4 2.6h4l.4-2.6a7.8 7.8 0 0 0 2.6-1.5l2.4 1 2-3.4-2-1.5Z"
              stroke="currentColor"
              strokeLinejoin="round"
              strokeWidth="1.8"
            />
          </svg>
        </Link>

        <svg className="stars-bg" viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg">
          <circle cx="80" cy="60" r="1" fill="white" opacity="0.6"><animate attributeName="opacity" values="0.6;0.1;0.6" dur="3s" repeatCount="indefinite"/></circle>
          <circle cx="640" cy="40" r="1.2" fill="white" opacity="0.5"><animate attributeName="opacity" values="0.5;0.1;0.5" dur="2.5s" repeatCount="indefinite"/></circle>
          <circle cx="160" cy="180" r="0.8" fill="white" opacity="0.4"><animate attributeName="opacity" values="0.4;0.1;0.4" dur="4s" repeatCount="indefinite"/></circle>
          <circle cx="720" cy="150" r="1" fill="white" opacity="0.7"><animate attributeName="opacity" values="0.7;0.2;0.7" dur="2s" repeatCount="indefinite"/></circle>
          <circle cx="400" cy="30" r="0.8" fill="white" opacity="0.5"><animate attributeName="opacity" values="0.5;0.1;0.5" dur="3.5s" repeatCount="indefinite"/></circle>
          <circle cx="700" cy="300" r="1" fill="white" opacity="0.4"><animate attributeName="opacity" values="0.4;0.1;0.4" dur="2.8s" repeatCount="indefinite"/></circle>
          <circle cx="60" cy="350" r="0.8" fill="white" opacity="0.6"><animate attributeName="opacity" values="0.6;0.1;0.6" dur="3.2s" repeatCount="indefinite"/></circle>
          <circle cx="200" cy="450" r="0.8" fill="var(--nobu-color)" opacity="0.5"><animate attributeName="opacity" values="0.5;0.1;0.5" dur="2.3s" repeatCount="indefinite"/></circle>
          <circle cx="560" cy="470" r="1" fill="var(--nobu-color)" opacity="0.4"><animate attributeName="opacity" values="0.4;0.1;0.4" dur="3.7s" repeatCount="indefinite"/></circle>
        </svg>

        <div className="orb-system">
          <div className="wave-ring" />
          <div className="wave-ring" />
          <div className="wave-ring" />
          <div className="atmo" />
          <div className="ring-wrap">
            <div className="ring" />
            <div className="ring-inner" />
          </div>
          <div className={`orb${isSpeaking ? ' orb-speaking' : isListening ? ' orb-listening' : ''}`}>
            <div className="orb-shine" />
            <div className="orb-shine2" />
            <div className="orb-glow" />
          </div>
          <div className="particle" style={{width:'5px',height:'5px',background:'var(--nobu-color)',animationDuration:'8s',boxShadow:'0 0 4px var(--nobu-color)'}} />
          <div className="particle" style={{width:'4px',height:'4px',background:'var(--nobu-color)',animationDuration:'12s',animationDelay:'-3s',boxShadow:'0 0 4px var(--nobu-color)'}} />
          <div className="particle" style={{width:'3px',height:'3px',background:'var(--nobu-color)',animationDuration:'10s',animationDelay:'-6s',boxShadow:'0 0 3px var(--nobu-color)'}} />
        </div>

        <div className="status">
          <div className="s-dot" />
          <span className="s-text">Nobu is here</span>
        </div>

        <button
          className={`meet-btn ${status === 'connected' ? 'connected' : ''}`}
          disabled={status === 'connecting'}
          onClick={handleMeetNobu}
        >
          {status === 'connecting'
            ? 'Connecting...'
            : status === 'connected'
              ? 'End call'
              : 'Meet your Nobu'}
        </button>

        <div className="canvas-wrap">
          <canvas ref={canvasRef} width={260} height={40} />
        </div>
      </div>

      <div className={`wake-indicator ${wakeListenStatus}`}>
        <span className="wake-indicator-dot" />
        <span>
          {wakeListenStatus === 'listening'
            ? `Listening for "${NOBU_ASSISTANT_NAME}"`
            : wakeListenStatus === 'blocked'
              ? 'Wake word off'
              : wakeListenStatus === 'unsupported'
                ? 'Wake word unavailable'
                : status === 'disconnected'
                  ? 'Wake word paused'
                  : 'In conversation'}
        </span>
      </div>
    </>
  )
}
