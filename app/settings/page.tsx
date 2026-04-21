'use client'

import Link from 'next/link'
import { type CSSProperties, useEffect, useState } from 'react'
import {
  NOBU_ASSISTANT_NAME,
  characterOptions,
  colorOptions,
  getVoiceIdForCharacter,
  getVoiceOption,
  hexToRgb,
  loadNobuSettings,
  saveNobuSettings,
  vibeOptions,
  type NobuSettings,
  type NobuVibeId,
} from '../lib/nobu-settings'
import { useSession } from 'next-auth/react'
import { live2dModels } from '../lib/live2d-models'

export default function SettingsPage() {
  const { data: session, status: authStatus } = useSession()
  const [settings, setSettings] = useState<NobuSettings>(loadNobuSettings)
  const orbStyle = {
    '--nobu-color': settings.color,
    '--nobu-rgb': hexToRgb(settings.color),
  } as CSSProperties

  useEffect(() => {
    if (authStatus !== 'loading' && !session) {
      window.location.replace('/login')
    }
  }, [authStatus, session])

  if (authStatus !== 'loading' && !session) {
    return null
  }

  function updateSettings(update: Partial<NobuSettings>) {
    const nextSettings = { ...settings, ...update }
    setSettings(nextSettings)
    saveNobuSettings(nextSettings)
  }

  function updateCharacter(character: NobuSettings['character']) {
    updateSettings({
      character,
      voiceId: getVoiceIdForCharacter(character),
    })
  }

  const currentModel = live2dModels[settings.character]
  const pairedVoice = getVoiceOption(settings.voiceId)

  return (
    <main className="settings-shell" style={orbStyle}>
      <style>{`
        .settings-shell { min-height: 100vh; background: #000; color: #fff; font-family: Arial, Helvetica, sans-serif; padding: 28px; }
        .settings-wrap { width: min(920px, 100%); margin: 0 auto; display: grid; gap: 22px; }
        .settings-nav { display: flex; align-items: center; justify-content: space-between; }
        .back-link { color: rgba(255,255,255,0.64); text-decoration: none; font-size: 14px; }
        .settings-title { font-size: 46px; line-height: 1.05; font-weight: 600; margin: 42px 0 12px; }
        .settings-subtitle { max-width: 560px; color: rgba(255,255,255,0.56); line-height: 1.7; }
        .settings-panel { border: 1.5px solid rgba(255,255,255,0.12); border-radius: 8px; background: rgba(255,255,255,0.045); padding: 24px; display: grid; gap: 20px; }
        .setting-row { display: grid; gap: 12px; }
        .setting-label { color: rgba(255,255,255,0.52); font-size: 12px; font-weight: 700; text-transform: uppercase; }
        .name-lock { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; font-size: 26px; font-weight: 600; }
        .lock-icon { color: rgba(255,255,255,0.7); }
        .muted { color: rgba(255,255,255,0.52); font-size: 14px; line-height: 1.6; }
        .option-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
        .option-card { border: 1.5px solid rgba(255,255,255,0.12); border-radius: 8px; background: rgba(255,255,255,0.04); color: #fff; cursor: pointer; min-height: 88px; padding: 18px; text-align: left; }
        .option-card.selected { border-color: rgba(var(--nobu-rgb),0.75); background: rgba(var(--nobu-rgb),0.13); }
        .info-card { border: 1.5px solid rgba(255,255,255,0.12); border-radius: 8px; background: rgba(255,255,255,0.04); padding: 18px; }
        .inventory-grid { display: grid; gap: 12px; grid-template-columns: repeat(3, minmax(0, 1fr)); }
        .pill-row { display: flex; flex-wrap: wrap; gap: 8px; }
        .pill { border: 1px solid rgba(255,255,255,0.12); border-radius: 999px; color: rgba(255,255,255,0.72); font-size: 12px; padding: 7px 10px; }
        .color-row { display: grid; grid-template-columns: repeat(8, 1fr); gap: 10px; }
        .color-btn { aspect-ratio: 1; border: 1.5px solid rgba(255,255,255,0.12); border-radius: 8px; cursor: pointer; box-shadow: 0 0 20px var(--swatch); background: radial-gradient(circle at 32% 30%, #fff, var(--swatch) 42%, #050505); }
        .color-btn.selected { border-color: #fff; }
        .preview-orb { width: 112px; height: 112px; border-radius: 999px; background: radial-gradient(circle at 32% 30%, #fff 0%, var(--nobu-color) 42%, #17051f 100%); border: 2px solid rgba(var(--nobu-rgb),0.5); box-shadow: 0 0 54px rgba(var(--nobu-rgb),0.52); }
        @media (max-width: 760px) { .option-grid, .color-row, .inventory-grid { grid-template-columns: 1fr 1fr; } .settings-title { font-size: 38px; } }
        @media (max-width: 520px) { .inventory-grid { grid-template-columns: 1fr; } }
      `}</style>

      <div className="settings-wrap">
        <nav className="settings-nav">
          <Link className="back-link" href="/">
            Back to Nobu
          </Link>
          <div className="preview-orb" />
        </nav>

        <header>
          <h1 className="settings-title">Settings</h1>
          <p className="settings-subtitle">
            Shape how Nobu talks, remembers, and helps. ScanFit is always available when you ask for outfit, sizing, or shopping advice.
          </p>
        </header>

        <section className="settings-panel">
          <div className="setting-row">
            <div className="setting-label">Name</div>
            <div className="name-lock">
              <svg aria-hidden="true" className="lock-icon" fill="none" height="24" viewBox="0 0 24 24" width="24">
                <path
                  d="M7.5 10V7.5a4.5 4.5 0 0 1 9 0V10"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeWidth="1.8"
                />
                <path
                  d="M6.5 10h11A1.5 1.5 0 0 1 19 11.5v7A1.5 1.5 0 0 1 17.5 20h-11A1.5 1.5 0 0 1 5 18.5v-7A1.5 1.5 0 0 1 6.5 10Z"
                  stroke="currentColor"
                  strokeLinejoin="round"
                  strokeWidth="1.8"
                />
              </svg>
              <span>{NOBU_ASSISTANT_NAME}</span>
            </div>

            <p className="muted">The assistant is always Nobu for every account.</p>
          </div>

          <div className="setting-row">
            <div className="setting-label">Character</div>
            <div className="option-grid">
              {characterOptions.map((option) => (
                <button
                  className={`option-card ${settings.character === option.id ? 'selected' : ''}`}
                  key={option.id}
                  onClick={() => updateCharacter(option.id)}
                >
                  <strong>{option.label}</strong>
                  <p className="muted">{option.description}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="setting-row">
            <div className="setting-label">Voice Pairing</div>
            <div className="info-card">
              <strong>{pairedVoice.label} Nobu voice</strong>
              <p className="muted">
                {pairedVoice.description} Voice is locked to the selected character so Alexia stays feminine and Asuka stays masculine.
              </p>
            </div>
          </div>

          <div className="setting-row">
            <div className="setting-label">Current Model Library</div>
            <div className="inventory-grid">
              <div className="info-card">
                <strong>{currentModel.label}</strong>
                <p className="muted">{currentModel.path}</p>
              </div>
              <div className="info-card">
                <strong>{currentModel.expressions.length} expressions</strong>
                <p className="muted">Used for mood, reactions, and creator-provided style changes.</p>
              </div>
              <div className="info-card">
                <strong>{currentModel.motions.length} motions</strong>
                <p className="muted">Available through the model control button in the room.</p>
              </div>
            </div>

            <div className="info-card">
              <strong>Creator toggles</strong>
              <div className="pill-row" style={{ marginTop: 12 }}>
                {currentModel.toggles.length > 0 ? (
                  currentModel.toggles.map((toggle) => (
                    <span className="pill" key={toggle.parameterId}>{toggle.label}</span>
                  ))
                ) : (
                  <span className="pill">No toggles found</span>
                )}
              </div>
            </div>
          </div>

          <div className="setting-row">
            <div className="setting-label">Talk Mode</div>
            <div className="option-grid">
              {vibeOptions.map((option) => (
                <button
                  className={`option-card ${settings.vibe === option.id ? 'selected' : ''}`}
                  key={option.id}
                  onClick={() => updateSettings({ vibe: option.id as NobuVibeId })}
                >
                  <strong>{option.label}</strong>
                  <p className="muted">{option.description}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="setting-row">
            <div className="setting-label">Color</div>
            <div className="color-row">
              {colorOptions.map((option) => (
                <button
                  aria-label={option.label}
                  className={`color-btn ${settings.color === option.value ? 'selected' : ''}`}
                  key={option.value}
                  onClick={() => updateSettings({ color: option.value })}
                  style={{ '--swatch': option.value } as CSSProperties}
                />
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
