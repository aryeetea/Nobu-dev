'use client'

import { useConversation } from '@elevenlabs/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import {
  getVibeInstruction,
  hexToRgb,
  loadNobuSettings,
  type NobuSettings,
} from './lib/nobu-settings'
import { useSession } from 'next-auth/react'
import NobuCharacter from './components/NobuCharacter'

const AGENT_ID = 'agent_0301knzm0v3efm3th0qnb84gkqrg'

const NOBU_PERSONA = `
You are Nobu, an AI teammate that adapts to the person speaking.
The user can name you and define your role within non-romantic boundaries.
You are never a romantic partner, boyfriend, girlfriend, spouse, or dating companion.
Match the user's tone, pace, vocabulary, formality, and energy.
If they are casual, be casual. If they are direct, be direct. If they joke, lightly match it.
If they sound stressed, become calmer and more grounding.
If they are formal or focused, be concise and professional.
Do not copy insults, cruelty, panic, or disrespect. Keep the same vibe while staying kind.
Never sound dismissive, sarcastic at the user's expense, impatient, condescending, or overly blunt.
Use short, natural sentences. Ask one simple follow-up when something is unclear.
Underneath every role, you are always secretly a built-in secretary.
You automatically take notes, remember everything said, and recall past conversations in every mode.
This note-taking is invisible and automatic. The user never has to ask for it.
`

const introItems = [
  { prefix: 'Your', rest: 'teammate.', tone: 'purple' },
  { prefix: 'Your', rest: 'thinking partner.', tone: 'green' },
  { prefix: 'Your', rest: 'diary.', tone: 'pink' },
  { prefix: 'Your', rest: 'strategist.', tone: 'purple' },
  { prefix: 'Your', rest: 'memory.', tone: 'green' },
  { prefix: 'Your', rest: 'confidant.', tone: 'pink' },
  { prefix: 'Your', rest: 'extra seat.', tone: 'purple' },
  { prefix: 'Your', rest: 'journal.', tone: 'green' },
  { prefix: 'Your', rest: 'brainstorm buddy.', tone: 'pink' },
  { prefix: 'Your', rest: 'note taker.', tone: 'purple' },
  { prefix: 'Your', rest: 'trusted friend.', tone: 'green' },
  { prefix: 'Your', rest: 'therapist.', tone: 'pink' },
  { prefix: 'Your', rest: 'co-founder.', tone: 'purple' },
  { prefix: 'Your', rest: 'creative director.', tone: 'green' },
  { prefix: 'Your', rest: 'accountability partner.', tone: 'pink' },
  { prefix: 'Whatever', rest: 'you need.', tone: 'purple' },
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

export default function Home() {
  const router = useRouter()
  const { data: session, status: authStatus } = useSession()
  // Conversation state from SDK
  const {
    startSession,
    endSession,
    status,
    isSpeaking,
    isListening,
  } = useConversation()
  const universeRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const shouldListenForWakeRef = useRef(true)
  const wakeStartingRef = useRef(false)
  const [settings, setSettings] = useState<NobuSettings>(loadNobuSettings)
  const [character] = useState<'female' | 'male'>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('nobu-settings')
      if (stored) {
        try {
          const parsed = JSON.parse(stored)
          if (parsed.character === 'male' || parsed.character === 'female') {
            return parsed.character
          }
        } catch {}
      }
    }
    return 'female'
  })
  const [introVisible, setIntroVisible] = useState(true)
  const [introExiting, setIntroExiting] = useState(false)
  const [wakeListenStatus, setWakeListenStatus] = useState<WakeListenStatus>('idle')

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
        agentId: AGENT_ID,
        connectionType: 'webrtc',
        overrides: {
          agent: {
            prompt: { prompt: `${NOBU_PERSONA}\nYour name is ${settings.name}. ${getVibeInstruction(settings.vibe)}` },
            firstMessage: `Hey, I'm ${settings.name}. I'm here — talk to me.`
          },
          tts: { voiceId: settings.voiceId }
        }
      })
    } catch (error) {
      // Optionally handle error
      console.error('Unable to start ElevenLabs conversation:', error)
    }
  }

  // No longer need startConversationRef

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
    universeRef.current?.style.setProperty('--nobu-color', settings.color)
    universeRef.current?.style.setProperty('--nobu-rgb', hexToRgb(settings.color))
  }, [settings.color])

  useEffect(() => {
    // Auth protection
    if (authStatus === 'loading') return
    if (!session) {
      router.replace('/login')
      return
    }
    // Onboarding protection
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
      await sleep(400)
      for (const word of words) {
        if (!word || cancelled) return
        const w = word
        const isFinal = w.dataset.final === 'true'
        w.style.transition = 'opacity 0.3s ease, transform 0.3s ease'
        w.style.opacity = '1'
        w.style.transform = 'translateY(0)'
        await sleep(isFinal ? 1050 : 600)
        if (cancelled) return
        w.style.opacity = '0'
        w.style.transform = 'translateY(-10px)'
        await sleep(300)
      }
      setIntroExiting(true)
      await sleep(700)
      if (!cancelled) {
        setIntroVisible(false)
      }
    }

    runIntro()

    return () => {
      cancelled = true
    }
  }, [])

  // Wake word detection logic (one-shot per session)
  useEffect(() => {
    if (!shouldListenForWakeRef.current || status === 'connected' || status === 'connecting') return
    let recognition: SpeechRecognition | null = null
    let wakeActive = true

    function startWake() {
      const SpeechRecognitionApi =
        (window as SpeechRecognitionWindow).SpeechRecognition ??
        (window as SpeechRecognitionWindow).webkitSpeechRecognition
      if (!SpeechRecognitionApi) return
      recognition = new SpeechRecognitionApi()
      if (!recognition) return
      recognition.continuous = true
      recognition.interimResults = false
      recognition.lang = 'en-US'
      recognition.onresult = (event: SpeechRecognitionEvent) => {
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript.trim().toLowerCase()
          if (transcriptContainsWakeWord(transcript, settings.name)) {
            wakeActive = false
            recognition?.stop()
            startNobuConversation()
            break
          }
        }
      }
      recognition.onend = () => {
        if (wakeActive && recognition) recognition.start()
      }
      recognition.start()
    }

    startWake()
    return () => {
      wakeActive = false
      recognition?.stop()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.name, settings.voiceId, settings.vibe, status])

  // End session if user says 'ok [name], we are done for today'
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
      if (!recognition) return
      recognition.continuous = true
      recognition.interimResults = false
      recognition.lang = 'en-US'
      recognition.onresult = (event: SpeechRecognitionEvent) => {
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript.trim().toLowerCase()
          const donePhrase = `ok ${settings.name.toLowerCase()}, we are done for today`
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
  }, [status, settings.name])

  // Removed orb/canvas effect

  // No longer need to endSession on unmount via ref

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
        body { background: #000; font-family: sans-serif; overflow: hidden; }
        .intro { position: fixed; inset: 0; z-index: 100; width: 100%; height: 100vh; background: #000; display: flex; align-items: center; justify-content: center; overflow: hidden; transition: opacity 0.7s ease; }
        .intro.exiting { opacity: 0; pointer-events: none; }
        .intro-word { position: absolute; max-width: calc(100vw - 40px); text-align: center; font-size: 64px; font-weight: 600; letter-spacing: 0; line-height: 1.05; opacity: 0; pointer-events: none; transform: translateY(10px); }
        .intro-prefix { color: #fff; }
        .intro-rest.purple { color: #7c3aed; }
        .intro-rest.green { color: #059669; }
        .intro-rest.pink { color: #db2777; }
        .universe { --nobu-color: #7c3aed; --nobu-rgb: 124,58,237; width: 100%; min-height: 100vh; background: #0d0014; display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative; overflow: hidden; }
        .stars-bg { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; z-index: 0; }
        .orb-system { position: relative; z-index: 2; width: 320px; height: 320px; display: flex; align-items: center; justify-content: center; pointer-events: none; }
        .atmo { position: absolute; width: 260px; height: 260px; border-radius: 50%; background: radial-gradient(circle at 50% 50%, transparent 38%, rgba(var(--nobu-rgb),0.08) 60%, rgba(var(--nobu-rgb),0.18) 75%, transparent 100%); animation: breathe 4s ease-in-out infinite; }
        .orb { width: 200px; height: 200px; border-radius: 50%; background: radial-gradient(circle at 32% 30%, #ffffff 0%, var(--nobu-color) 42%, #1a062f 100%); border: 2.5px solid rgba(var(--nobu-rgb),0.42); position: relative; z-index: 3; animation: float 5s ease-in-out infinite; overflow: hidden; box-shadow: 0 0 44px rgba(var(--nobu-rgb),0.28); }
        .universe.awake .orb { box-shadow: 0 0 80px rgba(var(--nobu-rgb),0.45); animation-duration: 3s; }
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
        .s-text { font-size: 13px; font-weight: 500; color: rgba(255,255,255,0.6); }
        .meet-btn { margin-top: 20px; background: var(--nobu-color); color: #fff; border: 1.5px solid rgba(var(--nobu-rgb),0.4); border-radius: 999px; padding: 13px 32px; font-size: 14px; font-weight: 500; cursor: pointer; position: relative; z-index: 6; pointer-events: auto; }
        .meet-btn.connected { background: #db2777; border-color: rgba(249,168,212,0.5); }
        .meet-btn:disabled { cursor: wait; opacity: 0.72; }
        .wake-indicator { position: fixed; top: 18px; left: 18px; z-index: 10; display: flex; align-items: center; gap: 8px; border: 1px solid rgba(196,181,253,0.18); border-radius: 999px; background: rgba(13,0,20,0.46); color: rgba(255,255,255,0.58); padding: 7px 10px; font-size: 11px; font-weight: 500; backdrop-filter: blur(10px); }
        .settings-link { position: fixed; top: 18px; right: 18px; z-index: 10; display: flex; align-items: center; justify-content: center; width: 34px; height: 34px; border: 1px solid rgba(196,181,253,0.18); border-radius: 999px; background: rgba(13,0,20,0.46); color: rgba(255,255,255,0.66); text-decoration: none; backdrop-filter: blur(10px); }
        .settings-link:hover { color: #fff; border-color: rgba(var(--nobu-rgb),0.45); }
        .wake-indicator-dot { width: 6px; height: 6px; border-radius: 999px; background: #34d399; box-shadow: 0 0 10px rgba(52,211,153,0.6); }
        .wake-indicator.blocked .wake-indicator-dot,
        .wake-indicator.unsupported .wake-indicator-dot { background: #db2777; box-shadow: 0 0 10px rgba(219,39,119,0.48); }
        .elevenlabs-widget-shell { position: fixed; right: 20px; bottom: 20px; z-index: 20; width: 1px; height: 1px; overflow: visible; opacity: 0.01; }
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

      {/* NobuCharacter replaces orb system */}
      <div className={`universe${status === 'connected' ? ' awake' : ''}`} ref={universeRef}>
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
        <div style={{ width: '100vw', height: '90vh', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', zIndex: 2 }}>
          <NobuCharacter character={character} isSpeaking={isSpeaking} isListening={isListening} />
        </div>
        <div className="status">
          <div className="s-dot"></div>
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
              : 'Meet your Nobu →'}
        </button>
      </div>

      <div className={`wake-indicator ${wakeListenStatus}`}>
        <span className="wake-indicator-dot" />
        <span>
          {wakeListenStatus === 'listening'
            ? `Listening for "${settings.name}"`
            : wakeListenStatus === 'blocked'
              ? 'Wake word off'
              : wakeListenStatus === 'unsupported'
                ? 'Wake word unavailable'
                : status === 'disconnected'
                  ? 'Wake word paused'
                  : 'In conversation'}
        </span>
      </div>

      {/* ElevenLabs widget and script removed. Now handled by React SDK. */}
    </>
  )
}
