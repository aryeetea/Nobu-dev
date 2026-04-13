// Nobu2D.tsx
// Immersive 2D character component using Live2D (pixi-live2d-display)
import { useEffect, useRef } from 'react'

// You need to provide a Live2D model JSON file and assets (e.g., public/live2d/nobu/model.json)
// See: https://github.com/guansss/pixi-live2d-display

export default function Nobu2D({ expression, width = 320, height = 480 }: { expression?: string; width?: number; height?: number }) {
  const canvasRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let app: any, model: any
    let PIXI: any
    let Live2DModel: any
    let destroyed = false

    async function loadModel() {
      PIXI = (await import('pixi.js')).default
      Live2DModel = (await import('pixi-live2d-display')).Live2DModel
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
      model = await Live2DModel.from('/live2d/nobu/model.json')
      model.scale.set(0.5)
      model.x = width / 2
      model.y = height * 0.9
      app.stage.addChild(model)
      if (expression) {
        model.expression(expression)
      }
    }
    loadModel()
    return () => {
      destroyed = true
      if (app) app.destroy(true, { children: true })
    }
  }, [expression, width, height])

  return <div ref={canvasRef} style={{ width, height, margin: '0 auto', background: 'transparent' }} />
}
