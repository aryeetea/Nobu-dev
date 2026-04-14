// components/NobuCharacter.tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import { live2dModels } from '../lib/live2d-models'

type Character = 'female' | 'male'
type LoadStatus = 'idle' | 'loading' | 'success' | 'fail'
export type NobuRoomAction = 'center' | 'desk' | 'chair' | 'bed' | 'window' | 'lights'

type MotionRequest = {
  group: string
  id: number
  index: number
}

type ModelPlacement = {
  pacingRange: number
  x: number
  y: number
}

type Props = {
  character: Character
  expressionIndex?: number | null
  isSpeaking: boolean
  isListening: boolean
  motionRequest?: MotionRequest | null
  roomAction?: NobuRoomAction
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
    maxFPS: number
    minFPS: number
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
  CubismRenderer_WebGL?: {
    prototype?: CubismRendererPrototype
  }
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

type CubismModelLike = {
  getDrawableBlendMode?: (index: number) => unknown
  getDrawableCount?: () => number
  getDrawableCulling?: (index: number) => boolean
  getDrawableDynamicFlagIsVisible?: (index: number) => boolean
  getDrawableInvertedMaskBit?: (index: number) => boolean
  getDrawableOpacity?: (index: number) => number
  getDrawableRenderOrders?: () => ArrayLike<number> | undefined
  getDrawableTextureIndices?: (index: number) => number
  getDrawableTextureIndex?: (index: number) => number
  getDrawableVertexCount?: (index: number) => number
  getDrawableVertexIndexCount?: (index: number) => number
  getDrawableVertexIndices?: (index: number) => unknown
  getDrawableVertexUvs?: (index: number) => unknown
  getDrawableVertices?: (index: number) => unknown
  getMultiplyColor?: (index: number) => unknown
  getScreenColor?: (index: number) => unknown
}

type CubismRendererInstance = {
  _clippingManager?: {
    getClippingContextListForDraw?: () => unknown[]
    setupClippingContext?: (model: CubismModelLike, renderer: CubismRendererInstance) => void
  } | null
  _sortedDrawableIndexList?: Array<number | undefined>
  _textures?: Record<number, unknown>
  drawMesh: (...args: unknown[]) => void
  getModel: () => CubismModelLike
  preDraw: () => void
  setClippingContextBufferForDraw: (clip: unknown) => void
  setIsCulling: (isCulling: boolean) => void
}

type CubismRendererPrototype = {
  doDrawModel?: (this: CubismRendererInstance) => void
}

declare global {
  interface Window {
    Live2DCubismCore?: unknown
    PIXI?: unknown
  }
}

const CUBISM_CORE_SCRIPT_ID = 'nobu-cubism4-core'
const CUBISM_CORE_SCRIPT_SRC = '/live2d/live2dcubismcore.min.js'
const ACTIVE_FPS = 30
const IDLE_FPS = 20
const patchedRendererPrototypes = new WeakSet<CubismRendererPrototype>()

const CHARACTER_COPY: Record<Character, string> = {
  female: 'Alexia',
  male: 'Asuka',
}

function isSmallScreen() {
  return window.matchMedia('(max-width: 760px)').matches
}

function getRenderResolution() {
  const deviceResolution = window.devicePixelRatio || 1
  return Math.min(deviceResolution, isSmallScreen() ? 1.5 : 2)
}

function configureTicker(app: PixiApp, active: boolean) {
  app.ticker.minFPS = 0
  app.ticker.maxFPS = active ? ACTIVE_FPS : IDLE_FPS
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

function patchCubismRenderer(live2d: Live2DModule) {
  const prototype = live2d.CubismRenderer_WebGL?.prototype
  if (!prototype || patchedRendererPrototypes.has(prototype)) return

  prototype.doDrawModel = function doDrawModel() {
    this.preDraw()

    const model = this.getModel()
    const drawableCount = model.getDrawableCount?.() ?? 0
    const renderOrder = model.getDrawableRenderOrders?.()

    if (!drawableCount || !renderOrder) return

    if (this._clippingManager) {
      this._clippingManager.setupClippingContext?.(model, this)
    }

    const sortedDrawableIndexList =
      this._sortedDrawableIndexList ?? Array.from<number | undefined>({ length: drawableCount })

    sortedDrawableIndexList.length = drawableCount
    sortedDrawableIndexList.fill(undefined)
    this._sortedDrawableIndexList = sortedDrawableIndexList

    for (let i = 0; i < drawableCount; ++i) {
      const order = renderOrder[i]
      if (!Number.isInteger(order) || order < 0 || order >= drawableCount) continue
      sortedDrawableIndexList[order] = i
    }

    const clippingContexts =
      this._clippingManager?.getClippingContextListForDraw?.() ?? []

    for (let i = 0; i < drawableCount; ++i) {
      const drawableIndex = sortedDrawableIndexList[i]
      if (
        typeof drawableIndex !== 'number' ||
        !Number.isInteger(drawableIndex) ||
        drawableIndex < 0 ||
        drawableIndex >= drawableCount
      ) {
        continue
      }

      if (!model.getDrawableDynamicFlagIsVisible?.(drawableIndex)) continue

      const textureIndex =
        model.getDrawableTextureIndex?.(drawableIndex) ??
        model.getDrawableTextureIndices?.(drawableIndex)
      if (
        typeof textureIndex !== 'number' ||
        !Number.isInteger(textureIndex) ||
        textureIndex < 0 ||
        (this._textures && this._textures[textureIndex] == null)
      ) {
        continue
      }

      this.setClippingContextBufferForDraw(clippingContexts[drawableIndex] ?? null)
      this.setIsCulling(Boolean(model.getDrawableCulling?.(drawableIndex)))
      this.drawMesh(
        textureIndex,
        model.getDrawableVertexIndexCount?.(drawableIndex),
        model.getDrawableVertexCount?.(drawableIndex),
        model.getDrawableVertexIndices?.(drawableIndex),
        model.getDrawableVertices?.(drawableIndex),
        model.getDrawableVertexUvs?.(drawableIndex),
        model.getMultiplyColor?.(drawableIndex),
        model.getScreenColor?.(drawableIndex),
        model.getDrawableOpacity?.(drawableIndex),
        model.getDrawableBlendMode?.(drawableIndex),
        model.getDrawableInvertedMaskBit?.(drawableIndex),
      )
    }
  }

  patchedRendererPrototypes.add(prototype)
}

function getRoomPlacement(action: NobuRoomAction, smallScreen: boolean) {
  if (smallScreen) {
    switch (action) {
      case 'bed':
        return { x: 0.34, y: 0.95, width: 0.68, height: 0.68 }
      case 'desk':
        return { x: 0.62, y: 0.94, width: 0.68, height: 0.7 }
      case 'chair':
        return { x: 0.48, y: 0.94, width: 0.7, height: 0.72 }
      case 'window':
        return { x: 0.52, y: 0.94, width: 0.7, height: 0.72 }
      case 'lights':
      case 'center':
      default:
        return { x: 0.5, y: 0.94, width: 0.88, height: 0.78 }
    }
  }

  switch (action) {
    case 'bed':
      return { x: 0.28, y: 0.98, width: 0.32, height: 0.68 }
    case 'desk':
      return { x: 0.58, y: 0.98, width: 0.34, height: 0.7 }
    case 'chair':
      return { x: 0.42, y: 0.98, width: 0.34, height: 0.7 }
    case 'window':
      return { x: 0.5, y: 0.98, width: 0.34, height: 0.7 }
    case 'lights':
    case 'center':
    default:
      return { x: 0.5, y: 0.98, width: 0.38, height: 0.76 }
  }
}

function placeModel(
  model: Live2DModelInstance,
  app: PixiApp,
  roomAction: NobuRoomAction,
): ModelPlacement {
  const smallScreen = isSmallScreen()
  const screenWidth = app.screen.width
  const screenHeight = app.screen.height
  const placement = getRoomPlacement(roomAction, smallScreen)
  const targetHeight = screenHeight * placement.height
  const targetWidth = screenWidth * placement.width

  model.anchor?.set(0.5, 1)
  model.rotation = 0
  model.scale.set(1)

  const rawWidth = Math.max(1, model.width)
  const rawHeight = Math.max(1, model.height)
  const computedScale = Math.min(targetHeight / rawHeight, targetWidth / rawWidth)
  const scale = Math.max(0.03, Math.min(computedScale, smallScreen ? 0.78 : 0.56))

  model.scale.set(scale)
  model.x = screenWidth * placement.x
  model.y = screenHeight * placement.y

  return {
    pacingRange: screenWidth * (smallScreen ? 0.018 : roomAction === 'center' ? 0.04 : 0.02),
    x: model.x,
    y: model.y,
  }
}

function paceModel(
  model: Live2DModelInstance | null,
  basePlacement: ModelPlacement | null,
  roomAction: NobuRoomAction,
) {
  if (!model || !basePlacement) return

  const phase = performance.now() / 1000
  const pacingStrength =
    roomAction === 'bed' || roomAction === 'chair' || roomAction === 'lights' ? 0.35 : 1

  model.x = basePlacement.x + Math.sin(phase * 0.72) * basePlacement.pacingRange * pacingStrength
  model.y = basePlacement.y + Math.sin(phase * 1.44) * 3
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
  roomAction = 'center',
  shouldLoad = true,
  toggles = {},
}: Props) {
  const appRef = useRef<PixiApp | null>(null)
  const basePlacementRef = useRef<ModelPlacement | null>(null)
  const hostRef = useRef<HTMLDivElement>(null)
  const modelRef = useRef<Live2DModelInstance | null>(null)
  const roomActionRef = useRef<NobuRoomAction>(roomAction)
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
    let pacingFrame: (() => void) | null = null
    const host = hostRef.current

    async function loadCharacter() {
      setLoadStatus('loading')
      setErrorMessage('')
      host.replaceChildren()

      try {
        await loadCubismCore()

        const PIXI = await import('pixi.js') as unknown as PixiModule
        window.PIXI = PIXI

        const live2d =
          await import('pixi-live2d-display-lipsyncpatch/cubism4') as Live2DModule
        const { Live2DModel, cubism4Ready } = live2d

        patchCubismRenderer(live2d)
        Live2DModel.registerTicker?.(PIXI.Ticker)
        await cubism4Ready?.()

        if (cancelled || !hostRef.current) return

        const app = new PIXI.Application({
          antialias: !isSmallScreen(),
          autoDensity: true,
          backgroundAlpha: 0,
          height: Math.max(1, host.clientHeight),
          powerPreference: 'low-power',
          resolution: getRenderResolution(),
          width: Math.max(1, host.clientWidth),
        })

        appRef.current = app
        configureTicker(app, false)
        host.replaceChildren(app.view)

        const model = await Live2DModel.from(live2dModels[character].path, {
          autoFocus: false,
          autoHitTest: false,
          motionPreload: 'NONE',
        })

        if (cancelled) {
          app.destroy(true, { baseTexture: true, children: true, texture: true })
          return
        }

        modelRef.current = model
        app.stage.addChild(model)
        resizeApp(app, host)
        await waitForNextFrame()
        if (cancelled) return
        basePlacementRef.current = placeModel(model, app, roomActionRef.current)
        applyToggles(model, togglesRef.current)

        pacingFrame = () => {
          paceModel(modelRef.current, basePlacementRef.current, roomActionRef.current)
        }
        app.ticker.add(pacingFrame)

        resizeObserver = new ResizeObserver(() => {
          if (!appRef.current || !modelRef.current) return
          resizeApp(appRef.current, host)
          basePlacementRef.current = placeModel(
            modelRef.current,
            appRef.current,
            roomActionRef.current,
          )
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
      if (pacingFrame && appRef.current) {
        appRef.current.ticker.remove(pacingFrame)
      }
      appRef.current?.destroy(true, { baseTexture: true, children: true, texture: true })
      modelRef.current = null
      appRef.current = null
      basePlacementRef.current = null
      host.replaceChildren()
    }
  }, [character, shouldLoad])

  useEffect(() => {
    roomActionRef.current = roomAction
    if (loadStatus !== 'success' || !modelRef.current || !appRef.current) return
    basePlacementRef.current = placeModel(modelRef.current, appRef.current, roomAction)
  }, [loadStatus, roomAction])

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

    void import('pixi-live2d-display-lipsyncpatch/cubism4')
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

  useEffect(() => {
    if (!appRef.current) return
    configureTicker(appRef.current, isSpeaking || isListening)
  }, [isListening, isSpeaking])

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
