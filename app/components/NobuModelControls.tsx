'use client'

import { useState } from 'react'
import { live2dModels, type Live2DCharacterId, type Live2DMotionOption } from '../lib/live2d-models'

type Props = {
  character: Live2DCharacterId
  onExpressionSelect: (index: number | null) => void
  onMotionSelect: (motion: Live2DMotionOption) => void
  onToggleChange: (parameterId: string, enabled: boolean) => void
  selectedExpressionIndex: number | null
  toggles: Record<string, boolean>
}

export default function NobuModelControls({
  character,
  onExpressionSelect,
  onMotionSelect,
  onToggleChange,
  selectedExpressionIndex,
  toggles,
}: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const model = live2dModels[character]

  return (
    <div className={`model-controls ${isOpen ? 'open' : ''}`}>
      <style>{`
        .model-controls {
          bottom: calc(54px + env(safe-area-inset-bottom));
          left: 12px;
          position: fixed;
          right: 12px;
          z-index: 12;
        }

        .model-controls-toggle {
          align-items: center;
          background: rgba(255,255,255,0.72);
          border: 1px solid rgba(43,66,84,0.14);
          border-radius: 999px;
          color: rgba(43,66,84,0.74);
          cursor: pointer;
          display: flex;
          font-size: 12px;
          font-weight: 800;
          gap: 8px;
          height: 38px;
          justify-content: center;
          letter-spacing: 0;
          margin-left: auto;
          padding: 0 14px;
          width: fit-content;
          backdrop-filter: blur(14px);
        }

        .model-controls-toggle::before {
          background: #e85d9b;
          border-radius: 999px;
          content: "";
          height: 7px;
          width: 7px;
        }

        .model-controls-panel {
          background: rgba(255,255,255,0.82);
          border: 1px solid rgba(43,66,84,0.12);
          border-radius: 8px;
          box-shadow: 0 20px 60px rgba(43,66,84,0.18);
          color: #2b4254;
          display: none;
          gap: 12px;
          margin-top: 10px;
          max-height: min(48dvh, 420px);
          overflow: auto;
          padding: 12px;
          backdrop-filter: blur(18px);
        }

        .model-controls.open .model-controls-panel {
          display: grid;
        }

        .model-controls-section {
          display: grid;
          gap: 8px;
        }

        .model-controls-title {
          color: rgba(43,66,84,0.56);
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 0;
          text-transform: uppercase;
        }

        .model-controls-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .model-control-btn {
          background: rgba(43,66,84,0.06);
          border: 1px solid rgba(43,66,84,0.1);
          border-radius: 999px;
          color: rgba(43,66,84,0.78);
          cursor: pointer;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0;
          min-height: 34px;
          padding: 8px 11px;
        }

        .model-control-btn.active {
          background: rgba(232,93,155,0.16);
          border-color: rgba(232,93,155,0.46);
          color: #2b4254;
        }

        @media (min-width: 761px) {
          .model-controls {
            bottom: 18px;
            left: auto;
            max-width: 420px;
            right: 18px;
          }
        }
      `}</style>

      <button
        aria-expanded={isOpen}
        className="model-controls-toggle"
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        {model.label}
      </button>

      <div className="model-controls-panel">
        <section className="model-controls-section">
          <div className="model-controls-title">Expressions</div>
          <div className="model-controls-grid">
            <button
              className={`model-control-btn ${selectedExpressionIndex === null ? 'active' : ''}`}
              onClick={() => onExpressionSelect(null)}
              type="button"
            >
              Voice Auto
            </button>
            {model.expressions.map((expression) => (
              <button
                className={`model-control-btn ${selectedExpressionIndex === expression.index ? 'active' : ''}`}
                key={expression.id}
                onClick={() => onExpressionSelect(expression.index)}
                type="button"
              >
                {expression.label}
              </button>
            ))}
          </div>
        </section>

        <section className="model-controls-section">
          <div className="model-controls-title">Motions</div>
          <div className="model-controls-grid">
            {model.motions.map((motion) => (
              <button
                className="model-control-btn"
                key={`${motion.group}-${motion.index}`}
                onClick={() => onMotionSelect(motion)}
                type="button"
              >
                {motion.label}
              </button>
            ))}
          </div>
        </section>

        <section className="model-controls-section">
          <div className="model-controls-title">Creator Toggles</div>
          <div className="model-controls-grid">
            {model.toggles.map((toggle) => (
              <button
                className={`model-control-btn ${toggles[toggle.parameterId] ? 'active' : ''}`}
                key={toggle.parameterId}
                onClick={() => onToggleChange(toggle.parameterId, !toggles[toggle.parameterId])}
                type="button"
              >
                {toggle.label}
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
