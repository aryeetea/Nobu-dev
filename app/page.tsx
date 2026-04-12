'use client'

import {
  Conversation,
  type Conversation as ElevenLabsConversation,
} from '@elevenlabs/client'
import Script from 'next/script'
import { useEffect, useRef, useState } from 'react'

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

type ElevenLabsWidgetElement = HTMLElement & {
  open?: () => void | Promise<void>
  start?: () => void | Promise<void>
  startSession?: () => void | Promise<void>
  toggle?: () => void | Promise<void>
}

const widgetButtonSelectors = [
  'button',
  '[role="button"]',
  '[aria-label*="start" i]',
  '[aria-label*="call" i]',
  '[aria-label*="talk" i]',
  '[aria-label*="conversation" i]',
  '[aria-label*="microphone" i]',
]

function dispatchUserClick(element: Element) {
  element.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, composed: true }))
  element.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, composed: true }))
  element.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, composed: true }))
  element.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }))
}

async function openElevenLabsWidget() {
  const widget = document.querySelector<ElevenLabsWidgetElement>('elevenlabs-convai')
  if (!widget) return false

  for (const method of ['startSession', 'start'] as const) {
    if (typeof widget[method] === 'function') {
      await widget[method]()
      return true
    }
  }

  for (const method of ['open', 'toggle'] as const) {
    if (typeof widget[method] === 'function') {
      await widget[method]()
    }
  }

  const clickable = widget.shadowRoot?.querySelector(widgetButtonSelectors.join(', '))
  if (clickable) {
    dispatchUserClick(clickable)
    return true
  }

  return false
}

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const conversationRef = useRef<ElevenLabsConversation | null>(null)
  const [introVisible, setIntroVisible] = useState(true)
  const [introExiting, setIntroExiting] = useState(false)
  const [callStatus, setCallStatus] = useState<'idle' | 'connecting' | 'connected'>('idle')

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

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    let t = 0
    const amplitude = 3
    let animFrame: number

    function drawWave() {
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height)
      ctx!.beginPath()
      ctx!.strokeStyle = 'rgba(196,181,253,0.7)'
      ctx!.lineWidth = 1.5
      for (let x = 0; x < canvas!.width; x++) {
        const y = canvas!.height / 2
          + Math.sin((x / canvas!.width) * Math.PI * 1.5 + t) * amplitude
          + Math.sin((x / canvas!.width) * Math.PI * 2.5 + t * 1.3) * (amplitude * 0.4)
        if (x === 0) ctx!.moveTo(x, y)
        else ctx!.lineTo(x, y)
      }
      ctx!.stroke()
      t += 0.025
      animFrame = requestAnimationFrame(drawWave)
    }

    drawWave()
    return () => cancelAnimationFrame(animFrame)
  }, [])

  useEffect(() => {
    return () => {
      conversationRef.current?.endSession()
    }
  }, [])

  async function handleMeetNobu() {
    if (callStatus === 'connecting') {
      await openElevenLabsWidget()
      return
    }

    if (callStatus === 'connected' || conversationRef.current?.isOpen()) {
      await conversationRef.current?.endSession()
      conversationRef.current = null
      setCallStatus('idle')
      return
    }

    setCallStatus('connecting')

    try {
      conversationRef.current = await Conversation.startSession({
        agentId: AGENT_ID,
        connectionType: 'websocket',
        overrides: {
          agent: {
            firstMessage: 'Hey, I’m Nobu. I’m here with you. What should we work through first?',
            prompt: {
              prompt: NOBU_PERSONA,
            },
          },
          tts: {
            stability: 0.72,
            similarityBoost: 0.82,
            speed: 0.94,
          },
        },
        onConnect: () => {
          setCallStatus('connected')
        },
        onDisconnect: () => {
          conversationRef.current = null
          setCallStatus('idle')
        },
        onError: (message) => {
          console.error('ElevenLabs conversation error:', message)
          conversationRef.current = null
          setCallStatus('idle')
        },
      })
    } catch (error) {
      console.error('Unable to start ElevenLabs conversation:', error)
      setCallStatus('idle')
      await openElevenLabsWidget()
    }
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
        .universe { width: 100%; min-height: 100vh; background: #0d0014; display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative; overflow: hidden; }
        .stars-bg { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; z-index: 0; }
        .orb-system { position: relative; z-index: 2; width: 320px; height: 320px; display: flex; align-items: center; justify-content: center; pointer-events: none; }
        .atmo { position: absolute; width: 260px; height: 260px; border-radius: 50%; background: radial-gradient(circle at 50% 50%, transparent 38%, rgba(167,139,250,0.08) 60%, rgba(124,58,237,0.15) 75%, transparent 100%); animation: breathe 4s ease-in-out infinite; }
        .orb { width: 200px; height: 200px; border-radius: 50%; background: radial-gradient(circle at 32% 30%, #c4b5fd 0%, #7c3aed 40%, #4c1d95 70%, #2e1065 100%); border: 2.5px solid rgba(196,181,253,0.4); position: relative; z-index: 3; animation: float 5s ease-in-out infinite; overflow: hidden; }
        .orb-shine { position: absolute; top: 20px; left: 24px; width: 55px; height: 34px; border-radius: 50%; background: rgba(255,255,255,0.28); transform: rotate(-35deg); filter: blur(2px); }
        .orb-shine2 { position: absolute; top: 36px; left: 40px; width: 20px; height: 12px; border-radius: 50%; background: rgba(255,255,255,0.18); transform: rotate(-35deg); }
        .orb-glow { position: absolute; bottom: 30px; right: 28px; width: 40px; height: 40px; border-radius: 50%; background: rgba(219,39,119,0.25); filter: blur(8px); }
        .ring-wrap { position: absolute; width: 290px; height: 290px; z-index: 2; }
        .ring { position: absolute; top: 50%; left: 50%; width: 290px; height: 60px; margin-left: -145px; margin-top: -30px; border-radius: 50%; border: 1.5px solid rgba(196,181,253,0.25); transform: rotateX(75deg); }
        .ring-inner { position: absolute; top: 50%; left: 50%; width: 240px; height: 46px; margin-left: -120px; margin-top: -23px; border-radius: 50%; border: 1px solid rgba(219,39,119,0.2); transform: rotateX(75deg); }
        .wave-ring { position: absolute; border-radius: 50%; border: 1.5px solid rgba(167,139,250,0.3); animation: wave-out 3s ease-out infinite; opacity: 0; }
        .wave-ring:nth-child(1) { width: 210px; height: 210px; animation-delay: 0s; }
        .wave-ring:nth-child(2) { width: 240px; height: 240px; animation-delay: 0.6s; }
        .wave-ring:nth-child(3) { width: 270px; height: 270px; animation-delay: 1.2s; }
        .particle { position: absolute; border-radius: 50%; animation: orbit linear infinite; top: 50%; left: 50%; }
        .canvas-wrap { position: absolute; bottom: 80px; left: 0; right: 0; display: flex; justify-content: center; pointer-events: none; z-index: 1; }
        .status { display: flex; align-items: center; gap: 7px; margin-top: 24px; position: relative; z-index: 5; }
        .s-dot { width: 7px; height: 7px; border-radius: 50%; background: #34d399; animation: blink 2s infinite; }
        .s-text { font-size: 13px; font-weight: 500; color: rgba(255,255,255,0.6); }
        .meet-btn { margin-top: 20px; background: #7c3aed; color: #fff; border: 1.5px solid rgba(196,181,253,0.4); border-radius: 999px; padding: 13px 32px; font-size: 14px; font-weight: 500; cursor: pointer; position: relative; z-index: 6; pointer-events: auto; }
        .meet-btn.connected { background: #db2777; border-color: rgba(249,168,212,0.5); }
        .meet-btn:disabled { cursor: wait; opacity: 0.72; }
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

      <div className="universe">
        <svg className="stars-bg" viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg">
          <circle cx="80" cy="60" r="1" fill="white" opacity="0.6"><animate attributeName="opacity" values="0.6;0.1;0.6" dur="3s" repeatCount="indefinite"/></circle>
          <circle cx="640" cy="40" r="1.2" fill="white" opacity="0.5"><animate attributeName="opacity" values="0.5;0.1;0.5" dur="2.5s" repeatCount="indefinite"/></circle>
          <circle cx="160" cy="180" r="0.8" fill="white" opacity="0.4"><animate attributeName="opacity" values="0.4;0.1;0.4" dur="4s" repeatCount="indefinite"/></circle>
          <circle cx="720" cy="150" r="1" fill="white" opacity="0.7"><animate attributeName="opacity" values="0.7;0.2;0.7" dur="2s" repeatCount="indefinite"/></circle>
          <circle cx="400" cy="30" r="0.8" fill="white" opacity="0.5"><animate attributeName="opacity" values="0.5;0.1;0.5" dur="3.5s" repeatCount="indefinite"/></circle>
          <circle cx="700" cy="300" r="1" fill="white" opacity="0.4"><animate attributeName="opacity" values="0.4;0.1;0.4" dur="2.8s" repeatCount="indefinite"/></circle>
          <circle cx="60" cy="350" r="0.8" fill="white" opacity="0.6"><animate attributeName="opacity" values="0.6;0.1;0.6" dur="3.2s" repeatCount="indefinite"/></circle>
          <circle cx="200" cy="450" r="0.8" fill="#c4b5fd" opacity="0.5"><animate attributeName="opacity" values="0.5;0.1;0.5" dur="2.3s" repeatCount="indefinite"/></circle>
          <circle cx="560" cy="470" r="1" fill="#f9a8d4" opacity="0.4"><animate attributeName="opacity" values="0.4;0.1;0.4" dur="3.7s" repeatCount="indefinite"/></circle>
        </svg>

        <div className="orb-system">
          <div className="wave-ring"></div>
          <div className="wave-ring"></div>
          <div className="wave-ring"></div>
          <div className="atmo"></div>
          <div className="ring-wrap">
            <div className="ring"></div>
            <div className="ring-inner"></div>
          </div>
          <div className="orb">
            <div className="orb-shine"></div>
            <div className="orb-shine2"></div>
            <div className="orb-glow"></div>
          </div>
          <div className="particle" style={{width:'5px',height:'5px',background:'#f9a8d4',animationDuration:'8s',boxShadow:'0 0 4px #f9a8d4'}}></div>
          <div className="particle" style={{width:'4px',height:'4px',background:'#6ee7b7',animationDuration:'12s',animationDelay:'-3s',boxShadow:'0 0 4px #6ee7b7'}}></div>
          <div className="particle" style={{width:'3px',height:'3px',background:'#c4b5fd',animationDuration:'10s',animationDelay:'-6s',boxShadow:'0 0 3px #c4b5fd'}}></div>
        </div>

        <div className="status">
          <div className="s-dot"></div>
          <span className="s-text">Nobu is here</span>
        </div>

        <button
          className={`meet-btn ${callStatus === 'connected' ? 'connected' : ''}`}
          disabled={callStatus === 'connecting'}
          onClick={handleMeetNobu}
        >
          {callStatus === 'connecting'
            ? 'Connecting...'
            : callStatus === 'connected'
              ? 'End call'
              : 'Meet your Nobu →'}
        </button>

        <div className="canvas-wrap">
          <canvas ref={canvasRef} width={260} height={40}></canvas>
        </div>
      </div>

      <div className="elevenlabs-widget-shell">
        <elevenlabs-convai agent-id={AGENT_ID}></elevenlabs-convai>
      </div>

      <Script
        src="https://unpkg.com/@elevenlabs/convai-widget-embed"
        strategy="afterInteractive"
      />
    </>
  )
}
