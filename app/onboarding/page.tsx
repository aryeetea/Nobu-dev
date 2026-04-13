'use client'

import { useRouter } from 'next/navigation'
import { type CSSProperties, useState } from 'react'
import {
  colorOptions,
  DEFAULT_NOBU_SETTINGS,
  hexToRgb,
  saveNobuSettings,
  vibeOptions,
  voiceOptions,
  type NobuSettings,
  type NobuVibeId,
  type NobuVoiceId,
} from '../lib/nobu-settings'
import { useSession } from 'next-auth/react'

export default function OnboardingPage() {
  const router = useRouter()
  const { data: session, status: authStatus } = useSession()
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [voiceId, setVoiceId] = useState<NobuVoiceId>('eXpIbVcVbLo8ZJQDlDnl')
  const [vibe, setVibe] = useState<NobuVibeId>('chill')
  const [color, setColor] = useState('#7c3aed')
  const orbStyle = {
    '--nobu-color': color,
    '--nobu-rgb': hexToRgb(color),
  } as CSSProperties

  function completeOnboarding() {
    const settings: NobuSettings = {
      ...DEFAULT_NOBU_SETTINGS,
      color,
      hasCompletedOnboarding: true,
      hasUsedRename: false,
      name: name.trim(),
      vibe,
      voiceId,
    }

    saveNobuSettings(settings)
    router.replace('/')
  }

  // Auth protection
  if (authStatus !== 'loading' && !session) {
    if (typeof window !== 'undefined') router.replace('/login')
    return null
  }

  return (
    <main className="onboarding-shell" style={orbStyle}>
      <style>{`
        .onboarding-shell { min-height: 100vh; background: #000; color: #fff; display: flex; align-items: center; justify-content: center; overflow: hidden; padding: 28px; font-family: Arial, Helvetica, sans-serif; }
        .step-indicator { position: fixed; top: 22px; left: 50%; transform: translateX(-50%); z-index: 5; display: flex; gap: 8px; }
        .step-dot { width: 28px; height: 3px; border-radius: 999px; background: rgba(255,255,255,0.16); transition: background 180ms ease, width 180ms ease; }
        .step-dot.active { width: 44px; background: var(--nobu-color); box-shadow: 0 0 18px rgba(var(--nobu-rgb),0.62); }
        .onboarding-step { width: min(920px, 100%); display: grid; justify-items: center; gap: 26px; animation: step-in 380ms ease both; text-align: center; }
        .onboarding-title { font-size: 46px; line-height: 1.05; font-weight: 600; letter-spacing: 0; }
        .onboarding-copy { max-width: 560px; color: rgba(255,255,255,0.56); font-size: 14px; line-height: 1.7; }
        .name-input { width: min(520px, 100%); border: 0; border-bottom: 1.5px solid rgba(var(--nobu-rgb),0.7); background: transparent; color: #fff; font-size: 30px; outline: 0; padding: 16px; text-align: center; }
        .name-input::placeholder { color: rgba(255,255,255,0.24); }
        .primary-btn { border: 1.5px solid rgba(var(--nobu-rgb),0.5); border-radius: 999px; background: var(--nobu-color); color: #fff; cursor: pointer; font-size: 14px; font-weight: 600; padding: 13px 32px; }
        .choice-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; width: min(680px, 100%); }
        .vibe-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; width: min(760px, 100%); }
        .choice-card { border: 1.5px solid rgba(255,255,255,0.12); border-radius: 8px; background: rgba(255,255,255,0.045); color: #fff; cursor: pointer; min-height: 150px; padding: 22px; text-align: left; transition: border-color 180ms ease, transform 180ms ease, background 180ms ease; }
        .choice-card:hover, .choice-card.selected { border-color: rgba(var(--nobu-rgb),0.72); background: rgba(var(--nobu-rgb),0.13); transform: translateY(-2px); }
        .choice-card h2 { font-size: 24px; margin-bottom: 10px; }
        .choice-card p { color: rgba(255,255,255,0.56); font-size: 13px; line-height: 1.6; }
        .color-layout { display: grid; grid-template-columns: 240px minmax(0, 1fr); align-items: center; gap: 38px; width: min(780px, 100%); }
        .preview-orb { position: relative; width: 210px; height: 210px; border-radius: 999px; background: radial-gradient(circle at 32% 30%, #fff 0%, var(--nobu-color) 42%, #17051f 100%); border: 2px solid rgba(var(--nobu-rgb),0.5); box-shadow: 0 0 76px rgba(var(--nobu-rgb),0.52); overflow: hidden; }
        .preview-orb::before { content: ""; position: absolute; top: 24px; left: 28px; width: 58px; height: 34px; border-radius: 999px; background: rgba(255,255,255,0.28); filter: blur(2px); transform: rotate(-35deg); }
        .preview-orb::after { content: ""; position: absolute; inset: -34px; border: 1.5px solid rgba(var(--nobu-rgb),0.28); border-radius: 999px; }
        .color-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
        .color-btn { aspect-ratio: 1; border: 1.5px solid rgba(255,255,255,0.12); border-radius: 8px; cursor: pointer; box-shadow: 0 0 24px var(--swatch); background: radial-gradient(circle at 32% 30%, #fff, var(--swatch) 42%, #050505); }
        .color-btn.selected { border-color: #fff; }
        @keyframes step-in { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @media (max-width: 760px) { .choice-grid, .vibe-grid, .color-layout { grid-template-columns: 1fr; } .onboarding-title { font-size: 38px; } .color-layout { justify-items: center; } }
      `}</style>

      <div aria-label={`Step ${step + 1} of 4`} className="step-indicator">
        {[0, 1, 2, 3].map((item) => (
          <span className={`step-dot ${step === item ? 'active' : ''}`} key={item} />
        ))}
      </div>

      {step === 0 && (
        <section className="onboarding-step">
          <h1 className="onboarding-title">What will you call me?</h1>
          <input
            autoFocus
            className="name-input"
            onChange={(event) => setName(event.target.value)}
            placeholder="Give me a name..."
            value={name}
          />
          <p className="onboarding-copy">
            This name becomes your wake word. You get one free rename later. After that, it is locked.
          </p>
          {name.trim() && (
            <button className="primary-btn" onClick={() => setStep(1)}>
              Continue
            </button>
          )}
        </section>
      )}

      {step === 1 && (
        <section className="onboarding-step">
          <h1 className="onboarding-title">How should I sound?</h1>
          <div className="choice-grid">
            {voiceOptions.map((option) => (
              <button
                className={`choice-card ${voiceId === option.voiceId ? 'selected' : ''}`}
                key={option.id}
                onClick={() => setVoiceId(option.voiceId)}
              >
                <h2>{option.label}</h2>
                <p>{option.description}</p>
              </button>
            ))}
          </div>
          <button className="primary-btn" onClick={() => setStep(2)}>
            Continue
          </button>
        </section>
      )}

      {step === 2 && (
        <section className="onboarding-step">
          <h1 className="onboarding-title">What kind of presence should I have?</h1>
          <div className="vibe-grid">
            {vibeOptions.map((option) => (
              <button
                className={`choice-card ${vibe === option.id ? 'selected' : ''}`}
                key={option.id}
                onClick={() => setVibe(option.id)}
              >
                <h2>{option.label}</h2>
              </button>
            ))}
          </div>
          <button className="primary-btn" onClick={() => setStep(3)}>
            Continue
          </button>
        </section>
      )}

      {step === 3 && (
        <section className="onboarding-step">
          <h1 className="onboarding-title">Pick my color.</h1>
          <div className="color-layout">
            <div className="preview-orb" />
            <div className="color-grid">
              {colorOptions.map((option) => (
                <button
                  aria-label={option.label}
                  className={`color-btn ${color === option.value ? 'selected' : ''}`}
                  key={option.value}
                  onClick={() => setColor(option.value)}
                  onMouseEnter={() => setColor(option.value)}
                  style={{ '--swatch': option.value } as CSSProperties}
                />
              ))}
            </div>
          </div>
          <button className="primary-btn" onClick={completeOnboarding}>
            Meet {name.trim()}
          </button>
        </section>
      )}
    </main>
  )
}
