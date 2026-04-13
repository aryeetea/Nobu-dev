// components/NobuCharacter.tsx
'use client'

import { useEffect, useRef } from 'react'

const MODEL_PATHS = {
  female: '/models/alexia/Alexia.model3.json',
  male: '/models/asuka/Asuka.model3.json',
}

type Props = {
  character: 'female' | 'male'
  isSpeaking: boolean
  isListening: boolean
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

export default function NobuCharacter({ character, isSpeaking, isListening }: Props) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const modelRef = useRef<NobuLive2DModel | null>(null)
  const appRef = useRef<PixiApplication | null>(null)

  // Inject live2dcubismcore.min.js into document.head on mount
  useEffect(() => {
    if (document.querySelector('script[src="/live2d/live2dcubismcore.min.js"]')) return
    const script = document.createElement('script')
    script.src = '/live2d/live2dcubismcore.min.js'
    document.head.appendChild(script)
  }, [])

  useEffect(() => {
    let idleTimer: ReturnType<typeof setInterval> | undefined
    async function loadModel() {
      if (!canvasRef.current) return
      const PIXI = (await import('pixi.js')).default as PixiModule
      const { Live2DModel } = (await import('pixi-live2d-display')) as Live2DModule
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
    }
    loadModel()
    return () => {
      if (idleTimer) clearInterval(idleTimer)
      if (appRef.current) appRef.current.destroy(true, { children: true })
    }
  }, [character])

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
