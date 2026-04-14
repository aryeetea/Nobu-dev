// components/NobuCharacter.tsx
'use client'

import { useEffect, useRef } from 'react'

const CUBISM_CORE_SRC = '/live2d/live2dcubismcore.min.js'

const MODEL_PATHS = {
  female: '/models/Alexia/Alexia.model3.json',
  male: '/models/ASUKA/Asuka.model3.json',
}

type Props = {
  character: 'female' | 'male'
  isSpeaking: boolean
  isListening: boolean
  shouldLoad?: boolean
}

type PixiApplication = {
  view: Node
  screen: {
    width: number
    height: number
  }
  stage: {
    addChild: (child: unknown) => void
  }
  destroy: (removeView?: boolean, options?: { children?: boolean }) => void
}

type PixiModule = {
  Application: new (options: Record<string, unknown>) => PixiApplication
}

type NobuLive2DModel = {
  anchor: {
    set: (x: number, y?: number) => void
  }
  x: number
  y: number
  scale: {
    set: (value: number) => void
  }
  motion: (name: string) => void
  internalModel: {
    coreModel: {
      setParameterValueById: (id: string, value: number) => void
    }
  }
}

type Live2DModule = {
  Live2DModel: {
    from: (path: string) => Promise<NobuLive2DModel>
  }
}

type IdleDeadline = {
  didTimeout: boolean
  timeRemaining: () => number
}

type IdleWindow = Window & {
  requestIdleCallback?: (callback: (deadline: IdleDeadline) => void, options?: { timeout?: number }) => number
  cancelIdleCallback?: (handle: number) => void
}

let cubismCoreLoadPromise: Promise<void> | null = null

function loadCubismCore() {
  if (cubismCoreLoadPromise) return cubismCoreLoadPromise

  cubismCoreLoadPromise = new Promise((resolve, reject) => {
    if ((window as { Live2DCubismCore?: unknown }).Live2DCubismCore) {
      resolve()
      return
    }

    const existingScript = document.querySelector<HTMLScriptElement>(
      `script[src="${CUBISM_CORE_SRC}"]`
    )

    if (existingScript?.dataset.loaded === 'true') {
      resolve()
      return
    }

    const script = existingScript ?? document.createElement('script')
    script.src = CUBISM_CORE_SRC
    script.async = true
    script.onload = () => {
      script.dataset.loaded = 'true'
      resolve()
    }
    script.onerror = () => {
      cubismCoreLoadPromise = null
      reject(new Error('Unable to load Live2D Cubism Core.'))
    }

    if (!existingScript) {
      document.head.appendChild(script)
    }
  })

  return cubismCoreLoadPromise
}

export default function NobuCharacter({ character, isSpeaking, isListening, shouldLoad = false }: Props) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const modelRef = useRef<NobuLive2DModel | null>(null)
  const appRef = useRef<PixiApplication | null>(null)
  const hasLoadedRef = useRef(false)
  const shouldLoadRef = useRef(shouldLoad)

  useEffect(() => {
    shouldLoadRef.current = shouldLoad
  }, [shouldLoad])

  useEffect(() => {
    let idleTimer: ReturnType<typeof setInterval> | undefined
    let observer: IntersectionObserver | undefined
    let idleHandle: number | undefined
    let fallbackTimer: ReturnType<typeof setTimeout> | undefined
    let cancelled = false

    async function loadModel() {
      if (hasLoadedRef.current) return
      hasLoadedRef.current = true

      try {
        await loadCubismCore()
        if (cancelled || !canvasRef.current) return

        const PIXI = await import('pixi.js') as unknown as PixiModule
        const { Live2DModel } = (await import('@guansss/pixi-live2d-display/cubism4')) as Live2DModule
        if (cancelled || !canvasRef.current) return

        canvasRef.current.innerHTML = ''
        const app = new PIXI.Application({
          width: window.innerWidth,
          height: window.innerHeight,
          transparent: true,
          backgroundAlpha: 0,
          resizeTo: window,
        })
        appRef.current = app
        canvasRef.current.appendChild(app.view)
        const model = await Live2DModel.from(MODEL_PATHS[character])
        if (cancelled) {
          app.destroy(true, { children: true })
          return
        }

        model.anchor.set(0.5, 1)
        model.x = app.screen.width / 2
        model.y = app.screen.height * 0.95
        model.scale.set(Math.min(app.screen.width / 1200, app.screen.height / 1800))
        app.stage.addChild(model)
        modelRef.current = model
        // Idle motion
        model.motion('Idle')
        idleTimer = setInterval(() => {
          model.motion('Idle')
        }, 12000)
      } catch (error) {
        hasLoadedRef.current = false
        console.error('Unable to load Nobu Live2D model:', error)
      }
    }

    function loadWhenIdle() {
      if (shouldLoadRef.current) {
        loadModel()
        return
      }

      const idleWindow = window as IdleWindow
      if (idleWindow.requestIdleCallback) {
        idleHandle = idleWindow.requestIdleCallback(() => loadModel(), { timeout: 2500 })
        return
      }

      fallbackTimer = setTimeout(loadModel, 900)
    }

    if (!shouldLoad) {
      return () => {
        cancelled = true
      }
    }

    if ('IntersectionObserver' in window && canvasRef.current) {
      observer = new IntersectionObserver((entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          observer?.disconnect()
          loadWhenIdle()
        }
      }, { rootMargin: '160px' })
      observer.observe(canvasRef.current)
    } else {
      loadWhenIdle()
    }

    return () => {
      cancelled = true
      observer?.disconnect()
      if (idleHandle !== undefined) {
        ;(window as IdleWindow).cancelIdleCallback?.(idleHandle)
      }
      if (fallbackTimer) clearTimeout(fallbackTimer)
      if (idleTimer) clearInterval(idleTimer)
      if (appRef.current) appRef.current.destroy(true, { children: true })
      appRef.current = null
      modelRef.current = null
      hasLoadedRef.current = false
    }
  }, [character, shouldLoad])

  // Animate mouth and listening
  useEffect(() => {
    const model = modelRef.current
    if (!model) return
    // Speaking: open mouth
    model.internalModel.coreModel.setParameterValueById('ParamMouthOpenY', isSpeaking ? 1 : 0)
    // Listening: animate head/eyes
    if (isListening) {
      model.internalModel.coreModel.setParameterValueById('ParamAngleY', Math.random() * 30 - 15)
      model.internalModel.coreModel.setParameterValueById('ParamEyeBallX', Math.random() * 0.6 - 0.3)
    } else {
      model.internalModel.coreModel.setParameterValueById('ParamAngleY', 0)
      model.internalModel.coreModel.setParameterValueById('ParamEyeBallX', 0)
    }
  }, [isSpeaking, isListening])

  return (
    <div
      ref={canvasRef}
      style={{ width: '100vw', height: '90vh', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', position: 'absolute', top: 0, left: 0, zIndex: 2 }}
    />
  )
}
