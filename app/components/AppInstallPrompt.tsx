'use client'

import { useEffect, useState } from 'react'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

type NavigatorWithStandalone = Navigator & {
  standalone?: boolean
}

function isStandaloneApp() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as NavigatorWithStandalone).standalone === true
  )
}

export default function AppInstallPrompt() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(
    () => typeof window !== 'undefined' && isStandaloneApp()
  )

  useEffect(() => {
    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault()
      setInstallPrompt(event as BeforeInstallPromptEvent)
    }

    function handleAppInstalled() {
      setIsInstalled(true)
      setInstallPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  if (!installPrompt || isInstalled) return null

  async function installApp() {
    if (!installPrompt) return

    await installPrompt.prompt()
    const choice = await installPrompt.userChoice
    if (choice.outcome === 'accepted') {
      setIsInstalled(true)
    }
    setInstallPrompt(null)
  }

  return (
    <div className="app-install">
      <div>
        <strong>Keep Nobu close</strong>
        <span>Install the app for faster repeat launches.</span>
      </div>
      <button onClick={installApp} type="button">
        Install
      </button>
      <style>{`
        .app-install {
          position: fixed;
          right: 18px;
          bottom: 18px;
          z-index: 60;
          display: flex;
          align-items: center;
          gap: 14px;
          max-width: min(360px, calc(100vw - 36px));
          padding: 12px;
          border: 1px solid rgba(196, 181, 253, 0.22);
          border-radius: 8px;
          background: rgba(13, 0, 20, 0.82);
          color: #fff;
          box-shadow: 0 18px 44px rgba(0, 0, 0, 0.34);
          backdrop-filter: blur(14px);
        }

        .app-install div {
          display: grid;
          gap: 3px;
          min-width: 0;
        }

        .app-install strong {
          font-size: 13px;
          font-weight: 700;
          line-height: 1.1;
        }

        .app-install span {
          color: rgba(255, 255, 255, 0.62);
          font-size: 12px;
          line-height: 1.35;
        }

        .app-install button {
          flex: 0 0 auto;
          border: 0;
          border-radius: 8px;
          background: #7c3aed;
          color: #fff;
          cursor: pointer;
          font-size: 12px;
          font-weight: 700;
          padding: 9px 12px;
        }

        @media (max-width: 520px) {
          .app-install {
            right: 12px;
            bottom: 12px;
            max-width: calc(100vw - 24px);
          }
        }
      `}</style>
    </div>
  )
}
