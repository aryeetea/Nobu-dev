// Nobu2D.tsx
// Immersive 2D character component using Live2D
'use client'

import { useEffect, useRef } from 'react'

// You need to provide a Cubism 4 model JSON file and assets.
// See: https://github.com/RaSan147/pixi-live2d-display

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
      const PIXI = await import('pixi.js') as unknown as PixiModule
      const { Live2DModel } = (await import('pixi-live2d-display-lipsyncpatch/cubism4')) as Live2DModule
      app = new PIXI.Application({
        view: undefined,
        width,
        height,
        backgroundAlpha: 0,
      })
      if (!canvasRef.current) return
      canvasRef.current.innerHTML = ''
      canvasRef.current.appendChild(app.view)
      const model = await Live2DModel.from('/models/Alexia/Alexia.model3.json')
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
