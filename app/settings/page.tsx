'use client'

import Link from 'next/link'
import { type CSSProperties, useEffect, useState } from 'react'
import {
  colorOptions,
  hexToRgb,
  loadNobuSettings,
  saveNobuSettings,
  vibeOptions,
  voiceOptions,
  type NobuSettings,
  type NobuVibeId,
} from '../lib/nobu-settings'
import { useSession } from 'next-auth/react'

export default function SettingsPage() {
  const { data: session, status: authStatus } = useSession()
  const [settings, setSettings] = useState<NobuSettings>(loadNobuSettings)
  const [isRenaming, setIsRenaming] = useState(false)
  const [nextName, setNextName] = useState(settings.name)
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

  function saveRename() {
    const trimmedName = nextName.trim()
    if (!trimmedName || settings.hasUsedRename) return
    const confirmed = window.confirm('Are you sure? This is the last time you can rename your Nobu.')

    if (!confirmed) return

    updateSettings({
      hasUsedRename: true,
      name: trimmedName,
    })
    setIsRenaming(false)
  }

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
        .settings-input { width: min(420px, 100%); border: 0; border-bottom: 1.5px solid rgba(var(--nobu-rgb),0.7); background: transparent; color: #fff; font-size: 24px; outline: 0; padding: 10px 0; }
        .muted { color: rgba(255,255,255,0.52); font-size: 14px; line-height: 1.6; }
        .action-btn { border: 1.5px solid rgba(var(--nobu-rgb),0.5); border-radius: 999px; background: var(--nobu-color); color: #fff; cursor: pointer; font-size: 14px; font-weight: 600; padding: 11px 22px; width: fit-content; }
        .ghost-btn { border: 1.5px solid rgba(255,255,255,0.14); border-radius: 999px; background: rgba(255,255,255,0.06); color: #fff; cursor: pointer; font-size: 14px; padding: 11px 18px; width: fit-content; }
        .option-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
        .option-card { border: 1.5px solid rgba(255,255,255,0.12); border-radius: 8px; background: rgba(255,255,255,0.04); color: #fff; cursor: pointer; min-height: 88px; padding: 18px; text-align: left; }
        .option-card.selected { border-color: rgba(var(--nobu-rgb),0.75); background: rgba(var(--nobu-rgb),0.13); }
        .color-row { display: grid; grid-template-columns: repeat(8, 1fr); gap: 10px; }
        .color-btn { aspect-ratio: 1; border: 1.5px solid rgba(255,255,255,0.12); border-radius: 8px; cursor: pointer; box-shadow: 0 0 20px var(--swatch); background: radial-gradient(circle at 32% 30%, #fff, var(--swatch) 42%, #050505); }
        .color-btn.selected { border-color: #fff; }
        .preview-orb { width: 112px; height: 112px; border-radius: 999px; background: radial-gradient(circle at 32% 30%, #fff 0%, var(--nobu-color) 42%, #17051f 100%); border: 2px solid rgba(var(--nobu-rgb),0.5); box-shadow: 0 0 54px rgba(var(--nobu-rgb),0.52); }
        @media (max-width: 760px) { .option-grid, .color-row { grid-template-columns: 1fr 1fr; } .settings-title { font-size: 38px; } }
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
            Shape how Nobu shows up. The name is protected, but voice, vibe, and color can shift with you.
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
              <span>{settings.name}</span>
            </div>

            {!settings.hasUsedRename ? (
              <>
                <p className="muted">You have 1 rename available</p>
                {isRenaming ? (
                  <>
                    <input
                      className="settings-input"
                      onChange={(event) => setNextName(event.target.value)}
                      value={nextName}
                    />
                    <button className="action-btn" onClick={saveRename}>
                      Save permanent name
                    </button>
                  </>
                ) : (
                  <button className="ghost-btn" onClick={() => setIsRenaming(true)}>
                    Rename
                  </button>
                )}
              </>
            ) : (
              <p className="muted">Your Nobu&apos;s name is permanent</p>
            )}
          </div>

          <div className="setting-row">
            <div className="setting-label">Voice</div>
            <div className="option-grid">
              {voiceOptions.map((option) => (
                <button
                  className={`option-card ${settings.voiceId === option.voiceId ? 'selected' : ''}`}
                  key={option.id}
                  onClick={() => updateSettings({ voiceId: option.voiceId })}
                >
                  <strong>{option.label}</strong>
                  <p className="muted">{option.description}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="setting-row">
            <div className="setting-label">Vibe</div>
            <div className="option-grid">
              {vibeOptions.map((option) => (
                <button
                  className={`option-card ${settings.vibe === option.id ? 'selected' : ''}`}
                  key={option.id}
                  onClick={() => updateSettings({ vibe: option.id as NobuVibeId })}
                >
                  <strong>{option.label}</strong>
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
