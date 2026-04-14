// components/NobuCharacter.tsx
'use client'

import { useEffect, useRef, useState } from 'react'

type Character = 'female' | 'male'
type LoadStatus = 'idle' | 'loading' | 'success' | 'fail'

type Props = {
  character: Character
  isSpeaking: boolean
  isListening: boolean
  shouldLoad?: boolean
}

type Oml2dInstance = {
  onLoad: (fn: (status: 'loading' | 'success' | 'fail') => void | Promise<void>) => void
  clearTips: () => void
  stopTipsIdle: () => void
  statusBarClearEvents: () => void
}

type Oml2dGlobal = {
  loadOml2d: (options: Record<string, unknown>) => Oml2dInstance
}

declare global {
  interface Window {
    OML2D?: Oml2dGlobal
  }
}

const MODEL_PATHS: Record<Character, string> = {
  female: '/models/Alexia/Alexia.model3.json',
  male: '/models/ASUKA/Asuka.model3.json',
}

const OML2D_SCRIPT_ID = 'nobu-oml2d-runtime'
const OML2D_SCRIPT_SRC = '/vendor/oh-my-live2d.min.js'

const CHARACTER_COPY: Record<Character, string> = {
  female: 'Female Nobu',
  male: 'Male Nobu',
}

function isSmallScreen() {
  return window.matchMedia('(max-width: 760px)').matches
}

function loadOml2dRuntime() {
  if (window.OML2D?.loadOml2d) {
    return Promise.resolve(window.OML2D)
  }

  const existingScript = document.getElementById(OML2D_SCRIPT_ID) as HTMLScriptElement | null

  if (existingScript?.dataset.loaded === 'true' && window.OML2D?.loadOml2d) {
    return Promise.resolve(window.OML2D)
  }

  return new Promise<Oml2dGlobal>((resolve, reject) => {
    const script = existingScript ?? document.createElement('script')

    script.id = OML2D_SCRIPT_ID
    script.src = OML2D_SCRIPT_SRC
    script.async = true

    script.onload = () => {
      script.dataset.loaded = 'true'
      if (window.OML2D?.loadOml2d) {
        resolve(window.OML2D)
      } else {
        reject(new Error('The Live2D runtime loaded, but OML2D was not available.'))
      }
    }

    script.onerror = () => {
      reject(new Error('The Live2D runtime script could not be loaded.'))
    }

    if (!existingScript) {
      document.head.appendChild(script)
    }
  })
}

export default function NobuCharacter({
  character,
  isSpeaking,
  isListening,
  shouldLoad = true,
}: Props) {
  const hostRef = useRef<HTMLDivElement>(null)
  const instanceRef = useRef<Oml2dInstance | null>(null)
  const [loadStatus, setLoadStatus] = useState<LoadStatus>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (!shouldLoad || !hostRef.current) {
      return
    }

    let cancelled = false
    const host = hostRef.current
    const smallScreen = isSmallScreen()

    async function loadCharacter() {
      setLoadStatus('loading')
      setErrorMessage('')
      host.replaceChildren()

      try {
        const { loadOml2d } = await loadOml2dRuntime()

        if (cancelled || !hostRef.current) return

        const stageWidth = smallScreen ? 'min(92vw, 390px)' : 'min(54vw, 560px)'
        const stageHeight = smallScreen ? '72vh' : '82vh'
        const leftOffset = smallScreen
          ? 'calc(50% - min(92vw, 390px) / 2)'
          : 'calc(50% - min(54vw, 560px) / 2)'

        const instance = loadOml2d({
          parentElement: hostRef.current,
          mobileDisplay: true,
          primaryColor: '#7c3aed',
          sayHello: false,
          transitionTime: 250,
          initialStatus: 'active',
          stageStyle: {
            bottom: smallScreen ? '8vh' : '0',
            height: stageHeight,
            left: leftOffset,
            pointerEvents: 'none',
            position: 'absolute',
            right: 'auto',
            width: stageWidth,
            zIndex: '2',
          },
          statusBar: {
            disable: true,
          },
          menus: {
            disable: true,
          },
          tips: {
            style: { display: 'none' },
            mobileStyle: { display: 'none' },
            idleTips: {
              message: [],
              wordTheDay: false,
            },
            welcomeTips: {
              message: {
                daybreak: '',
                morning: '',
                noon: '',
                afternoon: '',
                dusk: '',
                night: '',
                lateNight: '',
                weeHours: '',
              },
            },
            copyTips: {
              message: [],
            },
          },
          models: [
            {
              name: CHARACTER_COPY[character],
              path: MODEL_PATHS[character],
              scale: smallScreen ? 0.075 : 0.09,
              mobileScale: 0.075,
              position: smallScreen ? [0, 70] : [0, 70],
              mobilePosition: [0, 80],
              motionPreloadStrategy: 'NONE',
              stageStyle: {
                bottom: smallScreen ? '8vh' : '0',
                height: stageHeight,
                left: leftOffset,
                pointerEvents: 'none',
                position: 'absolute',
                right: 'auto',
                width: stageWidth,
                zIndex: '2',
              },
              mobileStageStyle: {
                bottom: '8vh',
                height: stageHeight,
                left: leftOffset,
                pointerEvents: 'none',
                position: 'absolute',
                right: 'auto',
                width: stageWidth,
                zIndex: '2',
              },
            },
          ],
        }) as Oml2dInstance

        instanceRef.current = instance
        instance.onLoad((status) => {
          if (cancelled) return
          setLoadStatus(status)
          if (status === 'fail') {
            setErrorMessage(`${CHARACTER_COPY[character]} could not load.`)
          }
          if (status === 'success') {
            instance.clearTips()
            instance.stopTipsIdle()
            instance.statusBarClearEvents()
          }
        })
      } catch (error) {
        if (cancelled) return
        console.error('Unable to load Nobu Live2D character:', error)
        setLoadStatus('fail')
        setErrorMessage(
          error instanceof Error
            ? error.message
            : `${CHARACTER_COPY[character]} could not load.`
        )
      }
    }

    loadCharacter()

    return () => {
      cancelled = true
      instanceRef.current?.clearTips()
      instanceRef.current?.stopTipsIdle()
      instanceRef.current?.statusBarClearEvents()
      instanceRef.current = null
      host.replaceChildren()
    }
  }, [character, shouldLoad])

  return (
    <div
      aria-busy={loadStatus === 'loading'}
      aria-label={`${CHARACTER_COPY[character]} Live2D character`}
      className={[
        'nobu-live2d',
        isListening ? 'is-listening' : '',
        isSpeaking ? 'is-speaking' : '',
      ].join(' ')}
    >
      <style>{`
        .nobu-live2d {
          bottom: 0;
          height: 90vh;
          left: 0;
          pointer-events: none;
          position: absolute;
          width: 100vw;
          z-index: 2;
        }

        .nobu-live2d-host {
          bottom: 0;
          height: 100%;
          left: 0;
          position: absolute;
          width: 100%;
        }

        .nobu-live2d.is-listening {
          filter: drop-shadow(0 0 18px rgba(124, 58, 237, 0.3));
        }

        .nobu-live2d.is-speaking {
          filter: drop-shadow(0 0 24px rgba(255, 213, 128, 0.22));
        }

        .nobu-live2d-message {
          bottom: 17vh;
          color: rgba(255,255,255,0.64);
          font-size: 12px;
          font-weight: 600;
          left: 50%;
          letter-spacing: 0;
          position: absolute;
          text-align: center;
          transform: translateX(-50%);
          z-index: 3;
        }

        .nobu-live2d-message.error {
          color: #ffd580;
          width: min(420px, calc(100vw - 32px));
        }

        @media (max-width: 760px) {
          .nobu-live2d {
            height: 84vh;
          }

          .nobu-live2d-message {
            bottom: 18vh;
          }
        }
      `}</style>

      <div className="nobu-live2d-host" ref={hostRef} />

      {shouldLoad && loadStatus === 'loading' && (
        <div className="nobu-live2d-message">Loading {CHARACTER_COPY[character]}</div>
      )}

      {loadStatus === 'fail' && (
        <div className="nobu-live2d-message error">
          {errorMessage || `${CHARACTER_COPY[character]} could not load.`}
        </div>
      )}
    </div>
  )
}
