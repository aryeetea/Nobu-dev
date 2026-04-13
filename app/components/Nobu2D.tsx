// Nobu2D.tsx
// Immersive 2D character component using Live2D
'use client'

import { useEffect, useRef } from 'react'

// You need to provide a Live2D model JSON file and assets (e.g., public/live2d/nobu/model.json)
// See: https://github.com/guansss/pixi-live2d-display

type PixiApp = {
  view: Node
  stage: {
    addChild: (child: unknown) => void
  }
  destroy: (removeView?: boolean, options?: { children?: boolean }) => void
}

type PixiModule = {
  Application: new (options: Record<string, unknown>) => PixiApp
}

type Live2DModelInstance = {
  scale: {
    set: (value: number) => void
  }
  x: number
  y: number
  expression?: (name: string) => void
}

type Live2DModule = {
  Live2DModel: {
    from: (path: string) => Promise<Live2DModelInstance>
  }
}

export default function Nobu2D({ expression, width = 320, height = 480 }: { expression?: string; width?: number; height?: number }) {
  const canvasRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let app: PixiApp | undefined

    async function loadModel() {
      const PIXI = (await import('pixi.js')).default as PixiModule
      const { Live2DModel } = (await import('@guansss/pixi-live2d-display')) as Live2DModule
      app = new PIXI.Application({
        view: undefined,
        width,
        height,
        transparent: true,
        backgroundAlpha: 0,
      })
      if (!canvasRef.current) return
      canvasRef.current.innerHTML = ''
      canvasRef.current.appendChild(app.view)
      const model = await Live2DModel.from('/live2d/nobu/model.json')
      model.scale.set(0.5)
      model.x = width / 2
      model.y = height * 0.9
      app.stage.addChild(model)
      if (expression) {
        model.expression?.(expression)
      }
    }
    loadModel()
    return () => {
      if (app) app.destroy(true, { children: true })
    }
  }, [expression, width, height])

  return <div ref={canvasRef} style={{ width, height, margin: '0 auto', background: 'transparent' }} />
}
