// components/NobuCharacter.tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import { live2dModels } from '../lib/live2d-models'

type Character = 'female' | 'male'
type LoadStatus = 'idle' | 'loading' | 'success' | 'fail'
export type NobuRoomAction = 'center' | 'desk' | 'chair' | 'bed' | 'shelf'

type MotionRequest = {
  group: string
  id: number
  index: number
}

type Props = {
  character: Character
  expressionIndex?: number | null
  isSpeaking: boolean
  isListening: boolean
  motionRequest?: MotionRequest | null
  shouldLoad?: boolean
  toggles?: Record<string, boolean>
}

type PixiApp = {
  destroy: (removeView?: boolean, options?: { baseTexture?: boolean; children?: boolean; texture?: boolean }) => void
  renderer: {
    resize: (width: number, height: number) => void
  }
  screen: {
    height: number
    width: number
  }
  stage: {
    addChild: (child: Live2DModelInstance) => void
  }
  ticker: {
    add: (fn: () => void) => void
    remove: (fn: () => void) => void
  }
  view: HTMLCanvasElement
}

type PixiModule = {
  Application: new (options: Record<string, unknown>) => PixiApp
  Ticker?: unknown
}

type Live2DModelInstance = {
  anchor?: {
    set: (x: number, y?: number) => void
  }
  destroy?: () => void
  expression: (id?: number | string) => Promise<boolean>
  height: number
  internalModel?: {
    coreModel?: {
      getParameterValueById?: (parameterId: string) => number
      setParameterValueById?: (parameterId: string, value: number, weight?: number) => void
    }
  }
  motion: (group: string, index?: number, priority?: number) => Promise<boolean>
  rotation: number
  scale: {
    set: (x: number, y?: number) => void
  }
  width: number
  x: number
  y: number
}

type Live2DModule = {
  Live2DModel: {
    from: (path: string, options?: Record<string, unknown>) => Promise<Live2DModelInstance>
    registerTicker?: (ticker: unknown) => void
  }
  MotionPriority?: {
    FORCE?: number
    NORMAL?: number
  }
  cubism4Ready?: () => Promise<void>
}

declare global {
  interface Window {
    Live2DCubismCore?: unknown
    PIXI?: unknown
  }
}

const CUBISM_CORE_SCRIPT_ID = 'nobu-cubism4-core'
const CUBISM_CORE_SCRIPT_SRC = '/live2d/live2dcubismcore.min.js'

const CHARACTER_COPY: Record<Character, string> = {
  female: 'Alexia',
  male: 'Asuka',
}

function isSmallScreen() {
  return window.matchMedia('(max-width: 760px)').matches
}

function loadCubismCore() {
  if (window.Live2DCubismCore) {
    return Promise.resolve()
  }

  const existingScript = document.getElementById(CUBISM_CORE_SCRIPT_ID) as HTMLScriptElement | null

  if (existingScript?.dataset.loaded === 'true' && window.Live2DCubismCore) {
    return Promise.resolve()
  }

  return new Promise<void>((resolve, reject) => {
    const script = existingScript ?? document.createElement('script')

    script.id = CUBISM_CORE_SCRIPT_ID
    script.src = CUBISM_CORE_SCRIPT_SRC
    script.async = true

    script.onload = () => {
      script.dataset.loaded = 'true'
      if (window.Live2DCubismCore) {
        resolve()
      } else {
        reject(new Error('Cubism 4 core loaded, but Live2DCubismCore was not available.'))
      }
    }

    script.onerror = () => {
      reject(new Error('Cubism 4 core script could not be loaded.'))
    }

    if (!existingScript) {
      document.head.appendChild(script)
    }
  })
}

function resizeApp(app: PixiApp, host: HTMLElement) {
  const rect = host.getBoundingClientRect()
  app.renderer.resize(Math.max(1, Math.floor(rect.width)), Math.max(1, Math.floor(rect.height)))
}

function waitForNextFrame() {
  return new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve())
  })
}

function placeModel(model: Live2DModelInstance, app: PixiApp) {
  const smallScreen = isSmallScreen()
  const screenWidth = app.screen.width
  const screenHeight = app.screen.height
  const targetHeight = screenHeight * (smallScreen ? 0.78 : 0.76)
  const targetWidth = screenWidth * (smallScreen ? 0.88 : 0.38)

  model.anchor?.set(0.5, 1)
  model.rotation = 0
  model.scale.set(1)

  const rawWidth = Math.max(1, model.width)
  const rawHeight = Math.max(1, model.height)
  const computedScale = Math.min(targetHeight / rawHeight, targetWidth / rawWidth)
  const scale = Math.max(0.03, Math.min(computedScale, smallScreen ? 0.78 : 0.56))

  model.scale.set(scale)
  model.x = screenWidth / 2
  model.y = screenHeight * (smallScreen ? 0.94 : 0.98)
}

function applyToggles(model: Live2DModelInstance | null, toggles: Record<string, boolean>) {
  const coreModel = model?.internalModel?.coreModel
  if (!coreModel?.setParameterValueById) return

  for (const [parameterId, enabled] of Object.entries(toggles)) {
    coreModel.setParameterValueById(parameterId, enabled ? 1 : 0, 1)
  }
}

export default function NobuCharacter({
  character,
  expressionIndex = null,
  isSpeaking,
  isListening,
  motionRequest = null,
  shouldLoad = true,
  toggles = {},
}: Props) {
  const appRef = useRef<PixiApp | null>(null)
  const hostRef = useRef<HTMLDivElement>(null)
  const modelRef = useRef<Live2DModelInstance | null>(null)
  const togglesRef = useRef(toggles)
  const [loadStatus, setLoadStatus] = useState<LoadStatus>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    togglesRef.current = toggles
    applyToggles(modelRef.current, toggles)
  }, [toggles])

  useEffect(() => {
    if (!shouldLoad || !hostRef.current) {
      return
    }

    let cancelled = false
    let resizeObserver: ResizeObserver | null = null
    let applyToggleFrame: (() => void) | null = null
    const host = hostRef.current

    async function loadCharacter() {
      setLoadStatus('loading')
      setErrorMessage('')
      host.replaceChildren()

      try {
        await loadCubismCore()

        const PIXI = await import('pixi.js') as unknown as PixiModule
        window.PIXI = PIXI

        const { Live2DModel, cubism4Ready } =
          await import('@guansss/pixi-live2d-display/cubism4') as Live2DModule

        Live2DModel.registerTicker?.(PIXI.Ticker)
        await cubism4Ready?.()

        if (cancelled || !hostRef.current) return

        const app = new PIXI.Application({
          antialias: true,
          autoDensity: true,
          backgroundAlpha: 0,
          height: Math.max(1, host.clientHeight),
          resolution: Math.min(window.devicePixelRatio || 1, 2),
          transparent: true,
          width: Math.max(1, host.clientWidth),
        })

        appRef.current = app
        host.replaceChildren(app.view)

        const model = await Live2DModel.from(live2dModels[character].path, {
          autoInteract: false,
          motionPreload: 'NONE',
        })

        if (cancelled) {
          model.destroy?.()
          app.destroy(true, { baseTexture: true, children: true, texture: true })
          return
        }

        modelRef.current = model
        app.stage.addChild(model)
        resizeApp(app, host)
        await waitForNextFrame()
        if (cancelled) return
        placeModel(model, app)
        applyToggles(model, togglesRef.current)

        applyToggleFrame = () => {
          applyToggles(modelRef.current, togglesRef.current)
        }
        app.ticker.add(applyToggleFrame)

        resizeObserver = new ResizeObserver(() => {
          if (!appRef.current || !modelRef.current) return
          resizeApp(appRef.current, host)
          placeModel(modelRef.current, appRef.current)
        })
        resizeObserver.observe(host)

        setLoadStatus('success')
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
      resizeObserver?.disconnect()
      if (applyToggleFrame && appRef.current) {
        appRef.current.ticker.remove(applyToggleFrame)
      }
      modelRef.current?.destroy?.()
      appRef.current?.destroy(true, { baseTexture: true, children: true, texture: true })
      modelRef.current = null
      appRef.current = null
      host.replaceChildren()
    }
  }, [character, shouldLoad])

  useEffect(() => {
    if (loadStatus !== 'success' || !modelRef.current) return

    if (expressionIndex === null) {
      if (isSpeaking) {
        void modelRef.current.expression()
      }
      return
    }

    void modelRef.current.expression(expressionIndex)
  }, [expressionIndex, isSpeaking, loadStatus])

  useEffect(() => {
    if (loadStatus !== 'success' || !modelRef.current || !motionRequest) return

    void import('@guansss/pixi-live2d-display/cubism4')
      .then((module) => {
        const live2d = module as unknown as Live2DModule
        return modelRef.current?.motion(
          motionRequest.group,
          motionRequest.index,
          live2d.MotionPriority?.FORCE ?? live2d.MotionPriority?.NORMAL ?? 3
        )
      })
      .catch((error) => {
        console.warn('Unable to play Nobu Live2D motion:', error)
      })
  }, [loadStatus, motionRequest])

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
          height: 100dvh;
          left: 0;
          pointer-events: none;
          position: absolute;
          width: 100vw;
          z-index: 2;
        }

        .nobu-live2d-host {
          height: 100%;
          left: 0;
          position: absolute;
          top: 0;
          width: 100%;
        }

        .nobu-live2d-host canvas {
          display: block;
          height: 100% !important;
          width: 100% !important;
        }

        .nobu-live2d.is-listening {
          filter: drop-shadow(0 0 18px rgba(232, 93, 155, 0.28));
        }

        .nobu-live2d.is-speaking {
          filter: drop-shadow(0 0 24px rgba(255, 213, 128, 0.22));
        }

        .nobu-live2d-message {
          bottom: 17vh;
          color: rgba(43,66,84,0.64);
          font-size: 12px;
          font-weight: 700;
          left: 50%;
          letter-spacing: 0;
          position: absolute;
          text-align: center;
          transform: translateX(-50%);
          z-index: 3;
        }

        .nobu-live2d-message.error {
          color: #e85d9b;
          width: min(420px, calc(100vw - 32px));
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
