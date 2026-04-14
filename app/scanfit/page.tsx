'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import {
  createScanFitFeedback,
  loadScanFitHistory,
  saveScanFitHistory,
  type OutfitSignal,
  type ScanFitLook,
  type ScanFitVerdict,
} from '../lib/scanfit'
import { loadNobuSettings, vibeOptions, type NobuVibeId } from '../lib/nobu-settings'
import { useSession } from 'next-auth/react'

function createLookId() {
  return `look-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

async function readImage(file: File) {
  const bitmap = await createImageBitmap(file)
  const canvas = document.createElement('canvas')
  const maxSize = 720
  const scale = Math.min(maxSize / bitmap.width, maxSize / bitmap.height, 1)
  canvas.width = Math.max(1, Math.round(bitmap.width * scale))
  canvas.height = Math.max(1, Math.round(bitmap.height * scale))

  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) {
    throw new Error('Unable to read outfit photo.')
  }

  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height).data
  let brightness = 0
  let saturation = 0
  let minLight = 255
  let maxLight = 0
  const sampleStep = 24

  for (let index = 0; index < imageData.length; index += sampleStep * 4) {
    const red = imageData[index]
    const green = imageData[index + 1]
    const blue = imageData[index + 2]
    const light = (red + green + blue) / 3
    const max = Math.max(red, green, blue)
    const min = Math.min(red, green, blue)

    brightness += light
    saturation += max - min
    minLight = Math.min(minLight, light)
    maxLight = Math.max(maxLight, light)
  }

  const samples = Math.ceil(imageData.length / (sampleStep * 4))
  const signal: OutfitSignal = {
    brightness: brightness / samples,
    contrast: maxLight - minLight,
    saturation: saturation / samples,
  }

  return {
    imageDataUrl: canvas.toDataURL('image/jpeg', 0.78),
    signal,
  }
}

export default function ScanFitPage() {
  const { data: session, status: authStatus } = useSession()
  const [vibe, setVibe] = useState<NobuVibeId>('fashionExpert')
  const [occasion, setOccasion] = useState('')
  const [notes, setNotes] = useState('')
  const [imageDataUrl, setImageDataUrl] = useState<string | undefined>()
  const [signal, setSignal] = useState<OutfitSignal | null>(null)
  const [feedback, setFeedback] = useState('')
  const [history, setHistory] = useState<ScanFitLook[]>([])
  const [isReadingPhoto, setIsReadingPhoto] = useState(false)

  useEffect(() => {
    if (authStatus !== 'loading' && !session) {
      window.location.replace('/login')
    }
  }, [authStatus, session])

  useEffect(() => {
    const settings = loadNobuSettings()
    setVibe(settings.vibe === 'chill' ? 'fashionExpert' : settings.vibe)
    setHistory(loadScanFitHistory())
  }, [])

  const selectedMode = useMemo(
    () => vibeOptions.find((option) => option.id === vibe),
    [vibe]
  )

  if (authStatus !== 'loading' && !session) {
    return null
  }

  async function handlePhoto(file?: File) {
    if (!file) return
    setIsReadingPhoto(true)
    try {
      const nextImage = await readImage(file)
      setImageDataUrl(nextImage.imageDataUrl)
      setSignal(nextImage.signal)
      setFeedback('')
    } finally {
      setIsReadingPhoto(false)
    }
  }

  function checkOutfit() {
    setFeedback(createScanFitFeedback({ vibe, occasion, notes, signal }))
  }

  function saveLook(verdict: ScanFitVerdict) {
    if (!feedback) return

    const nextLook: ScanFitLook = {
      id: createLookId(),
      createdAt: new Date().toISOString(),
      verdict,
      occasion: occasion.trim() || 'Everyday',
      notes: notes.trim(),
      feedback,
      imageDataUrl,
    }
    const nextHistory = [nextLook, ...history].slice(0, 12)
    setHistory(nextHistory)
    saveScanFitHistory(nextHistory)
  }

  return (
    <main className="scanfit-shell">
      <style>{`
        * { box-sizing: border-box; }
        body { background: #0d0014; }
        .scanfit-shell { min-height: 100vh; background: linear-gradient(145deg, #0d0014, #1a0030 68%, #050008); color: #fff; font-family: Arial, Helvetica, sans-serif; padding: 24px; }
        .scanfit-wrap { width: min(1120px, 100%); margin: 0 auto; display: grid; gap: 24px; }
        .scanfit-nav { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
        .back-link { color: rgba(255,255,255,0.66); text-decoration: none; font-size: 14px; }
        .scanfit-hero { display: grid; gap: 12px; padding: 44px 0 12px; }
        .eyebrow { color: #ffd580; font-size: 12px; font-weight: 800; text-transform: uppercase; }
        .scanfit-title { max-width: 760px; font-size: clamp(42px, 8vw, 92px); line-height: 0.92; letter-spacing: 0; }
        .scanfit-copy { max-width: 620px; color: rgba(255,255,255,0.66); font-size: 16px; line-height: 1.6; }
        .scanfit-grid { display: grid; grid-template-columns: minmax(0, 1.05fr) minmax(320px, 0.95fr); gap: 20px; align-items: start; }
        .panel { border: 1px solid rgba(196,181,253,0.16); border-radius: 8px; background: rgba(255,255,255,0.045); padding: 18px; display: grid; gap: 16px; }
        .photo-drop { min-height: 440px; border: 1.5px dashed rgba(196,181,253,0.26); border-radius: 8px; display: grid; place-items: center; overflow: hidden; background: rgba(13,0,20,0.45); }
        .photo-drop img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .empty-photo { display: grid; justify-items: center; gap: 10px; padding: 28px; text-align: center; color: rgba(255,255,255,0.62); }
        .camera-label, .action-btn, .ghost-btn { border: 0; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 800; padding: 12px 14px; }
        .camera-label, .action-btn { background: #7c3aed; color: #fff; }
        .camera-label input { display: none; }
        .ghost-btn { border: 1px solid rgba(255,255,255,0.14); background: rgba(255,255,255,0.06); color: #fff; }
        .field { display: grid; gap: 8px; }
        .field label { color: rgba(255,255,255,0.56); font-size: 12px; font-weight: 800; text-transform: uppercase; }
        .field input, .field textarea, .field select { width: 100%; border: 1px solid rgba(196,181,253,0.16); border-radius: 8px; background: rgba(0,0,0,0.22); color: #fff; font: inherit; padding: 12px; outline: 0; }
        .field textarea { min-height: 104px; resize: vertical; }
        .field input::placeholder, .field textarea::placeholder { color: rgba(255,255,255,0.32); }
        .feedback { border-left: 3px solid #ffd580; padding: 14px; background: rgba(255,213,128,0.08); color: rgba(255,255,255,0.82); line-height: 1.65; }
        .save-row { display: flex; flex-wrap: wrap; gap: 10px; }
        .history-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; }
        .look-card { border: 1px solid rgba(196,181,253,0.14); border-radius: 8px; background: rgba(255,255,255,0.04); overflow: hidden; }
        .look-card img { width: 100%; aspect-ratio: 1; object-fit: cover; display: block; background: rgba(0,0,0,0.22); }
        .look-body { display: grid; gap: 8px; padding: 12px; }
        .look-verdict { color: #ffd580; font-size: 12px; font-weight: 800; text-transform: uppercase; }
        .look-text { color: rgba(255,255,255,0.62); font-size: 12px; line-height: 1.45; display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical; overflow: hidden; }
        .fine-print { color: rgba(255,255,255,0.42); font-size: 12px; line-height: 1.5; }
        @media (max-width: 860px) { .scanfit-grid, .history-grid { grid-template-columns: 1fr; } .photo-drop { min-height: 320px; } }
      `}</style>

      <div className="scanfit-wrap">
        <nav className="scanfit-nav">
          <Link className="back-link" href="/">
            Back to Nobu
          </Link>
          <Link className="back-link" href="/settings">
            Talk mode
          </Link>
        </nav>

        <header className="scanfit-hero">
          <p className="eyebrow">ScanFit by Nobu</p>
          <h1 className="scanfit-title">Honest outfit feedback, saved to your style memory.</h1>
          <p className="scanfit-copy">
            Show Nobu a look, add the occasion, and get a first-pass read you can save as a hit or miss.
          </p>
        </header>

        <section className="scanfit-grid">
          <div className="panel">
            <div className="photo-drop">
              {imageDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img alt="Selected outfit" src={imageDataUrl} />
              ) : (
                <div className="empty-photo">
                  <strong>Start with a mirror photo or outfit screenshot.</strong>
                  <span className="fine-print">
                    This first version reads basic image color signals and your notes. Body measurement scanning comes later.
                  </span>
                </div>
              )}
            </div>
            <label className="camera-label">
              {isReadingPhoto ? 'Reading photo...' : 'Take or choose photo'}
              <input
                accept="image/*"
                capture="environment"
                disabled={isReadingPhoto}
                onChange={(event) => handlePhoto(event.target.files?.[0])}
                type="file"
              />
            </label>
          </div>

          <div className="panel">
            <div className="field">
              <label htmlFor="scanfit-mode">Talk mode</label>
              <select
                id="scanfit-mode"
                onChange={(event) => setVibe(event.target.value as NobuVibeId)}
                value={vibe}
              >
                {vibeOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
              {selectedMode && <span className="fine-print">{selectedMode.description}</span>}
            </div>

            <div className="field">
              <label htmlFor="occasion">Occasion</label>
              <input
                id="occasion"
                onChange={(event) => setOccasion(event.target.value)}
                placeholder="Dinner, school, date night, interview..."
                value={occasion}
              />
            </div>

            <div className="field">
              <label htmlFor="notes">Outfit notes</label>
              <textarea
                id="notes"
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Black jacket, wide jeans, white sneakers. I want it to feel casual but put together."
                value={notes}
              />
            </div>

            <button className="action-btn" onClick={checkOutfit} type="button">
              Check this look
            </button>

            {feedback && (
              <>
                <p className="feedback">{feedback}</p>
                <div className="save-row">
                  <button className="action-btn" onClick={() => saveLook('hit')} type="button">
                    Save as hit
                  </button>
                  <button className="ghost-btn" onClick={() => saveLook('miss')} type="button">
                    Save as miss
                  </button>
                </div>
              </>
            )}
          </div>
        </section>

        {history.length > 0 && (
          <section className="panel">
            <div>
              <p className="eyebrow">Look History</p>
              <p className="fine-print">Saved privately on this device for now.</p>
            </div>
            <div className="history-grid">
              {history.map((look) => (
                <article className="look-card" key={look.id}>
                  {look.imageDataUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img alt={`${look.verdict} outfit`} src={look.imageDataUrl} />
                  ) : null}
                  <div className="look-body">
                    <span className="look-verdict">{look.verdict}</span>
                    <strong>{look.occasion}</strong>
                    <p className="look-text">{look.feedback}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  )
}
