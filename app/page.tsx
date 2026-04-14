'use client'

import { useConversation } from '@elevenlabs/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  DEFAULT_NOBU_SETTINGS,
  getVibeInstruction,
  hexToRgb,
  loadNobuSettings,
  type NobuSettings,
} from './lib/nobu-settings'
import { useSession } from 'next-auth/react'
import NobuCharacter, { type NobuRoomAction } from './components/NobuCharacter'
import NobuModelControls from './components/NobuModelControls'
import NobuRoom from './components/NobuRoom'
import type { Live2DMotionOption } from './lib/live2d-models'
import {
  getNobuVisualState,
  inferNobuEmotionFromText,
  normalizeNobuEmotion,
  type NobuEmotion,
} from './lib/nobu-emotions'

const AGENT_ID = 'agent_0301knzm0v3efm3th0qnb84gkqrg'

const NOBU_PERSONA = `
You are Nobu, a personal voice AI assistant that adapts to the person speaking.
The user can name you and define your role within non-romantic boundaries.
You help with memory, notes, planning, organization, reflection, decisions, creative work, school, business, shopping, style, and team projects when asked.
You are personal-first: support the user's life, work, ideas, style, body confidence, and relationships without assuming they are using you for a team.
ScanFit is one of your built-in capabilities, not your whole identity.
When the user asks about fashion, outfits, sizing, shopping, measurements, influencer looks, or body changes, switch into ScanFit support.
In ScanFit support, give honest outfit feedback, smart sizing guidance, look-history suggestions, styling ideas for events or moods, and shopping advice.
Be direct about what works and what does not, but never shame the user's body, identity, budget, or taste.
Do not claim exact body measurements unless the user provides them or a future scan feature supplies them.
You are never a romantic partner, boyfriend, girlfriend, spouse, or dating companion.
Match the user's tone, pace, vocabulary, formality, and energy.
If they are casual, be casual. If they are direct, be direct. If they joke, lightly match it.
If they sound stressed, become calmer and more grounding.
If they are formal or focused, be concise and professional.
Do not copy insults, cruelty, panic, or disrespect. Keep the same vibe while staying kind.
Never sound dismissive, sarcastic at the user's expense, impatient, condescending, or overly blunt.
Use short, natural sentences. Ask one simple follow-up when something is unclear.
Underneath every role, you are always a quiet personal assistant.
You help capture notes, remember important details, and recall past context in every mode.
This support is natural and unobtrusive. The user should not have to manage it manually.
Your voice, mood, and visible character emotion must match.
When your emotional tone changes, call the client tool set_visual_emotion before or during your response.
Use only one of these visual emotions: neutral, happy, laughing, sad, crying, angry, confused, surprised, thinking, blush, dizzy, fashion, cool, encouraging.
Never laugh while setting a sad or crying visual emotion, and never sound sad while setting a happy or laughing visual emotion.
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

function transcriptContainsWakeName(transcript: string, name: string) {
  const wakeNames = Array.from(new Set([name.trim(), 'Nobu']))

  return wakeNames.some((wakeName) => transcriptContainsWakeWord(transcript, wakeName))
}

export default function Home() {
  const router = useRouter()
  const { data: session, status: authStatus } = useSession()
  const stageRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const shouldListenForWakeRef = useRef(true)
  const wakeStartingRef = useRef(false)
  const lastVisualEmotionRef = useRef<NobuEmotion>('neutral')
  const lastExplicitVisualEmotionAtRef = useRef(0)
  const [settings, setSettings] = useState<NobuSettings>(DEFAULT_NOBU_SETTINGS)
  const [character, setCharacter] = useState<'female' | 'male'>('female')
  const [autoExpressionIndex, setAutoExpressionIndex] = useState<number | null>(null)
  const [motionRequest, setMotionRequest] = useState<
    { group: string; id: number; index: number } | null
  >(null)
  const [modelToggles, setModelToggles] = useState<Record<string, boolean>>({})
  const [autoModelToggles, setAutoModelToggles] = useState<Record<string, boolean>>({})
  const [roomAction, setRoomAction] = useState<NobuRoomAction>('center')
  const [introVisible, setIntroVisible] = useState(true)
  const [introExiting, setIntroExiting] = useState(false)
  const [wakeListenStatus, setWakeListenStatus] = useState<WakeListenStatus>('idle')
  const activeModelToggles = {
    ...autoModelToggles,
    ...modelToggles,
  }

  const triggerMotion = useCallback((motion: Live2DMotionOption) => {
    setMotionRequest((current) => ({
      group: motion.group,
      id: (current?.id ?? 0) + 1,
      index: motion.index,
    }))
  }, [])

  const applyVisualEmotion = useCallback((emotion: NobuEmotion, options?: { explicit?: boolean }) => {
    const visualState = getNobuVisualState(character, emotion)
    const previousEmotion = lastVisualEmotionRef.current

    if (options?.explicit) {
      lastExplicitVisualEmotionAtRef.current = Date.now()
    }

    lastVisualEmotionRef.current = visualState.emotion
    setAutoExpressionIndex(visualState.expressionIndex)
    setAutoModelToggles(visualState.toggles)

    if (visualState.motion && visualState.emotion !== previousEmotion) {
      triggerMotion(visualState.motion)
    }
  }, [character, triggerMotion])

  // Conversation state from SDK
  const {
    startSession,
    endSession,
    status,
    isSpeaking,
    isListening,
  } = useConversation({
    onMessage: ({ message, role }) => {
      if (role !== 'agent') return
      if (Date.now() - lastExplicitVisualEmotionAtRef.current < 2500) return
      applyVisualEmotion(inferNobuEmotionFromText(message))
    },
  })

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

  function selectMotion(motion: Live2DMotionOption) {
    triggerMotion(motion)
  }

  function changeModelToggle(parameterId: string, enabled: boolean) {
    setModelToggles((current) => ({
      ...current,
      [parameterId]: enabled,
    }))
  }

  async function startNobuConversation() {
    stopWakeListening()
    try {
      await startSession({
        agentId: AGENT_ID,
        connectionType: 'webrtc',
        clientTools: {
          set_visual_emotion: ({ emotion }: { emotion?: unknown }) => {
            const visualEmotion = normalizeNobuEmotion(emotion)
            applyVisualEmotion(visualEmotion, { explicit: true })
            return `Nobu visual emotion set to ${visualEmotion}.`
          },
        },
        overrides: {
          agent: {
            prompt: { prompt: `${NOBU_PERSONA}\nYour name is ${settings.name}. ${getVibeInstruction(settings.vibe)}` },
            firstMessage: `Hey, I'm ${settings.name}. I'm here — talk to me.`
          },
          tts: { voiceId: settings.voiceId }
        },
      })
    } catch (error) {
      // Optionally handle error
      console.error('Unable to start ElevenLabs conversation:', error)
    }
  }

  // No longer need startConversationRef

  useEffect(() => {
    function syncSettings() {
      const nextSettings = loadNobuSettings()
      setSettings(nextSettings)
      setCharacter(nextSettings.character)
      setAutoExpressionIndex(null)
      setModelToggles({})
      setAutoModelToggles({})
      setRoomAction('center')
      lastVisualEmotionRef.current = 'neutral'
      lastExplicitVisualEmotionAtRef.current = 0
    }

    syncSettings()
    window.addEventListener('nobu-settings-change', syncSettings)

    return () => {
      window.removeEventListener('nobu-settings-change', syncSettings)
    }
  }, [])

  useEffect(() => {
    stageRef.current?.style.setProperty('--nobu-color', settings.color)
    stageRef.current?.style.setProperty('--nobu-rgb', hexToRgb(settings.color))
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
          if (transcriptContainsWakeName(transcript, settings.name)) {
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
          const nobuDonePhrase = 'ok nobu, we are done for today'
          if (transcript.includes(donePhrase) || transcript.includes(nobuDonePhrase)) {
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

  // Removed legacy visual effect

  // No longer need to endSession on unmount via ref

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { background: #000; min-height: 100%; overflow: hidden; }
        body { font-family: sans-serif; }
        .intro { position: fixed; inset: 0; z-index: 100; width: 100%; height: 100vh; background: #000; display: flex; align-items: center; justify-content: center; overflow: hidden; transition: opacity 0.7s ease; }
        .intro.exiting { opacity: 0; pointer-events: none; }
        .intro-word { position: absolute; max-width: calc(100vw - 40px); text-align: center; font-size: 64px; font-weight: 600; letter-spacing: 0; line-height: 1.05; opacity: 0; pointer-events: none; transform: translateY(10px); }
        .intro-prefix { color: #fff; }
        .intro-rest.teal { color: #0f766e; }
        .intro-rest.green { color: #059669; }
        .intro-rest.pink { color: #db2777; }
        .nobu-stage { width: 100%; min-height: 100dvh; background: #eaf6ff; display: flex; flex-direction: column; align-items: center; justify-content: center; isolation: isolate; position: relative; overflow: hidden; padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left); }
        .character-stage { inset: 0; pointer-events: none; position: absolute; z-index: 20; }
        .status { bottom: calc(18px + env(safe-area-inset-bottom)); display: flex; align-items: center; gap: 7px; left: 50%; position: fixed; transform: translateX(-50%); z-index: 55; }
        .s-dot { width: 7px; height: 7px; border-radius: 50%; background: #34d399; animation: blink 2s infinite; }
        .s-text { font-size: 13px; font-weight: 800; color: rgba(43,66,84,0.72); text-transform: lowercase; }
        .wake-indicator { position: fixed; top: calc(14px + env(safe-area-inset-top)); left: 14px; z-index: 70; display: flex; align-items: center; gap: 8px; border: 1px solid rgba(43,66,84,0.14); border-radius: 999px; background: rgba(255,255,255,0.66); color: rgba(43,66,84,0.66); padding: 8px 11px; font-size: 11px; font-weight: 800; backdrop-filter: blur(12px); }
        .settings-link { position: fixed; top: calc(14px + env(safe-area-inset-top)); right: 14px; z-index: 70; display: flex; align-items: center; justify-content: center; width: 38px; height: 38px; border: 1px solid rgba(43,66,84,0.14); border-radius: 999px; background: rgba(255,255,255,0.66); color: rgba(43,66,84,0.72); text-decoration: none; backdrop-filter: blur(12px); }
        .settings-link:hover { color: #fff; border-color: rgba(var(--nobu-rgb),0.45); }
        .wake-indicator-dot { width: 6px; height: 6px; border-radius: 999px; background: #34d399; box-shadow: 0 0 10px rgba(52,211,153,0.6); }
        .wake-indicator.blocked .wake-indicator-dot,
        .wake-indicator.unsupported .wake-indicator-dot { background: #db2777; box-shadow: 0 0 10px rgba(219,39,119,0.48); }
        .elevenlabs-widget-shell { position: fixed; right: 20px; bottom: 20px; z-index: 20; width: 1px; height: 1px; overflow: visible; opacity: 0.01; }
        @keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }
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

      {/* NobuCharacter in the room environment */}
      <div className={`nobu-stage${status === 'connected' ? ' awake' : ''}`} ref={stageRef}>
        <NobuRoom character={character} onRoomAction={setRoomAction} />
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
        <div className="character-stage">
          <NobuCharacter
            character={character}
            expressionIndex={autoExpressionIndex}
            isListening={isListening}
            isSpeaking={isSpeaking}
            motionRequest={motionRequest}
            roomAction={roomAction}
            shouldLoad
            toggles={activeModelToggles}
          />
        </div>
        <NobuModelControls
          character={character}
          onMotionSelect={selectMotion}
          onToggleChange={changeModelToggle}
          toggles={modelToggles}
        />
        <div className="status">
          <div className="s-dot"></div>
          <span className="s-text">Nobu is here</span>
        </div>
      </div>

      <div className={`wake-indicator ${wakeListenStatus}`}>
        <span className="wake-indicator-dot" />
        <span>
          {wakeListenStatus === 'listening'
            ? `Listening for "${settings.name}" or "Nobu"`
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
