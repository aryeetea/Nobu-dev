'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import {
  DEFAULT_SCANFIT_PROFILE,
  createInfluencerRecommendation,
  createScanFitFeedback,
  createSizeRecommendation,
  loadBodyLog,
  loadFashionAlerts,
  loadScanFitHistory,
  loadScanFitProfile,
  saveBodyLog,
  saveFashionAlerts,
  saveScanFitHistory,
  saveScanFitProfile,
  type BodyLogEntry,
  type FashionAlert,
  type OutfitSignal,
  type ScanFitLook,
  type ScanFitProfile,
  type ScanFitVerdict,
} from '../lib/scanfit'
import { loadNobuSettings, vibeOptions, type NobuVibeId } from '../lib/nobu-settings'
import { useSession } from 'next-auth/react'

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

async function readImage(file: File) {
  const bitmap = await createImageBitmap(file)
  const canvas = document.createElement('canvas')
  const maxSize = 720
  const scale = Math.min(maxSize / bitmap.width, maxSize / bitmap.height, 1)
  canvas.width = Math.max(1, Math.round(bitmap.width * scale))
  canvas.height = Math.max(1, Math.round(bitmap.height * scale))

  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) throw new Error('Unable to read outfit photo.')

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
  const [profile, setProfile] = useState<ScanFitProfile>(DEFAULT_SCANFIT_PROFILE)
  const [alerts, setAlerts] = useState<FashionAlert[]>([])
  const [bodyLog, setBodyLog] = useState<BodyLogEntry[]>([])
  const [history, setHistory] = useState<ScanFitLook[]>([])
  const [occasion, setOccasion] = useState('')
  const [notes, setNotes] = useState('')
  const [brand, setBrand] = useState('')
  const [itemType, setItemType] = useState('')
  const [influencer, setInfluencer] = useState('')
  const [influencerLook, setInfluencerLook] = useState('')
  const [imageDataUrl, setImageDataUrl] = useState<string | undefined>()
  const [signal, setSignal] = useState<OutfitSignal | null>(null)
  const [feedback, setFeedback] = useState('')
  const [sizeAdvice, setSizeAdvice] = useState('')
  const [influencerAdvice, setInfluencerAdvice] = useState('')
  const [isReadingPhoto, setIsReadingPhoto] = useState(false)

  useEffect(() => {
    if (authStatus !== 'loading' && !session) {
      window.location.replace('/login')
    }
  }, [authStatus, session])

  useEffect(() => {
    const settings = loadNobuSettings()
    setVibe(settings.vibe === 'chill' ? 'fashionExpert' : settings.vibe)
    setProfile(loadScanFitProfile())
    setAlerts(loadFashionAlerts())
    setBodyLog(loadBodyLog())
    setHistory(loadScanFitHistory())
  }, [])

  const selectedMode = useMemo(
    () => vibeOptions.find((option) => option.id === vibe),
    [vibe]
  )

  if (authStatus !== 'loading' && !session) return null

  function updateProfile(update: Partial<ScanFitProfile>) {
    const nextProfile = { ...profile, ...update }
    setProfile(nextProfile)
    saveScanFitProfile(nextProfile)
  }

  function updateAlerts(nextAlerts: FashionAlert[]) {
    setAlerts(nextAlerts)
    saveFashionAlerts(nextAlerts)
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
    setFeedback(createScanFitFeedback({ vibe, occasion, notes, signal, profile }))
  }

  function saveLook(verdict: ScanFitVerdict) {
    if (!feedback) return

    const nextLook: ScanFitLook = {
      id: createId('look'),
      createdAt: new Date().toISOString(),
      verdict,
      occasion: occasion.trim() || 'Everyday',
      notes: notes.trim(),
      feedback,
      rating: verdict === 'hit' ? 8 : 4,
      privacy: 'private',
      tags: [occasion.trim(), itemType.trim()].filter(Boolean),
      imageDataUrl,
    }
    const nextHistory = [nextLook, ...history].slice(0, 12)
    setHistory(nextHistory)
    saveScanFitHistory(nextHistory)
  }

  function addBodyLog() {
    if (!profile.chest && !profile.waist && !profile.hips) return

    const nextEntry: BodyLogEntry = {
      id: createId('body'),
      createdAt: new Date().toISOString(),
      weight: '',
      chest: profile.chest,
      waist: profile.waist,
      hips: profile.hips,
      notes: profile.styleGoals || 'Manual measurement check-in',
    }
    const nextBodyLog = [nextEntry, ...bodyLog].slice(0, 24)
    setBodyLog(nextBodyLog)
    saveBodyLog(nextBodyLog)
  }

  return (
    <main className="scanfit-shell">
      <style>{`
        * { box-sizing: border-box; }
        body { background: #0d0014; }
        .scanfit-shell { min-height: 100vh; background: linear-gradient(145deg, #0d0014, #1a0030 68%, #050008); color: #fff; font-family: Arial, Helvetica, sans-serif; padding: 24px; }
        .scanfit-wrap { width: min(1180px, 100%); margin: 0 auto; display: grid; gap: 24px; }
        .scanfit-nav { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
        .back-link { color: rgba(255,255,255,0.66); text-decoration: none; font-size: 14px; }
        .scanfit-hero { display: grid; gap: 12px; padding: 44px 0 12px; }
        .eyebrow { color: #ffd580; font-size: 12px; font-weight: 800; text-transform: uppercase; }
        .scanfit-title { max-width: 820px; font-size: clamp(42px, 8vw, 88px); line-height: 0.94; letter-spacing: 0; }
        .scanfit-copy { max-width: 680px; color: rgba(255,255,255,0.66); font-size: 16px; line-height: 1.6; }
        .scanfit-grid, .wide-grid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(320px, 0.82fr); gap: 20px; align-items: start; }
        .triple-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; }
        .panel { border: 1px solid rgba(196,181,253,0.16); border-radius: 8px; background: rgba(255,255,255,0.045); padding: 18px; display: grid; gap: 16px; }
        .panel-title { display: grid; gap: 5px; }
        .photo-drop { min-height: 380px; border: 1.5px dashed rgba(196,181,253,0.26); border-radius: 8px; display: grid; place-items: center; overflow: hidden; background: rgba(13,0,20,0.45); }
        .photo-drop img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .empty-photo { display: grid; justify-items: center; gap: 10px; padding: 28px; text-align: center; color: rgba(255,255,255,0.62); }
        .camera-label, .action-btn, .ghost-btn { border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 800; padding: 12px 14px; text-align: center; }
        .camera-label, .action-btn { border: 0; background: #7c3aed; color: #fff; }
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
        .measurement-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; }
        .profile-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
        .alert-toggle { border: 1px solid rgba(196,181,253,0.14); border-radius: 8px; background: rgba(255,255,255,0.04); color: #fff; cursor: pointer; padding: 12px; text-align: left; }
        .alert-toggle.active { border-color: rgba(124,58,237,0.72); background: rgba(124,58,237,0.16); }
        .mini-list { display: grid; gap: 8px; }
        .mini-item { border: 1px solid rgba(196,181,253,0.12); border-radius: 8px; background: rgba(0,0,0,0.16); padding: 10px; color: rgba(255,255,255,0.68); font-size: 12px; line-height: 1.45; }
        @media (max-width: 900px) { .scanfit-grid, .wide-grid, .triple-grid, .history-grid, .measurement-grid, .profile-grid { grid-template-columns: 1fr; } .photo-drop { min-height: 300px; } }
      `}</style>

      <div className="scanfit-wrap">
        <nav className="scanfit-nav">
          <Link className="back-link" href="/">Back to Nobu</Link>
          <Link className="back-link" href="/settings">Talk mode</Link>
        </nav>

        <header className="scanfit-hero">
          <p className="eyebrow">ScanFit by Nobu</p>
          <h1 className="scanfit-title">Style, sizing, shopping, and look memory.</h1>
          <p className="scanfit-copy">
            ScanFit is private inside Nobu. Add your style profile, check outfits, save what works, track manual measurements, and recreate looks without body scanning.
          </p>
        </header>

        <section className="panel">
          <div className="panel-title">
            <p className="eyebrow">Style Profile</p>
            <p className="fine-print">Manual details only. Nobu uses this for size and styling guidance.</p>
          </div>
          <div className="measurement-grid">
            {[
              ['height', 'Height'],
              ['chest', 'Chest'],
              ['waist', 'Waist'],
              ['hips', 'Hips'],
              ['inseam', 'Inseam'],
              ['usualTop', 'Usual top'],
              ['usualBottom', 'Usual bottom'],
              ['shoeSize', 'Shoe size'],
            ].map(([key, label]) => (
              <div className="field" key={key}>
                <label htmlFor={key}>{label}</label>
                <input
                  id={key}
                  onChange={(event) => updateProfile({ [key]: event.target.value })}
                  value={profile[key as keyof ScanFitProfile]}
                />
              </div>
            ))}
          </div>
          <div className="profile-grid">
            <div className="field">
              <label htmlFor="favoriteBrands">Favorite brands</label>
              <textarea
                id="favoriteBrands"
                onChange={(event) => updateProfile({ favoriteBrands: event.target.value })}
                placeholder="Zara, Nike, Aritzia, Uniqlo..."
                value={profile.favoriteBrands}
              />
            </div>
            <div className="field">
              <label htmlFor="styleGoals">Style goals</label>
              <textarea
                id="styleGoals"
                onChange={(event) => updateProfile({ styleGoals: event.target.value })}
                placeholder="Clean streetwear, softer outfits, more polished work looks..."
                value={profile.styleGoals}
              />
            </div>
            <div className="field">
              <label htmlFor="avoid">Avoid</label>
              <textarea
                id="avoid"
                onChange={(event) => updateProfile({ avoid: event.target.value })}
                placeholder="Scratchy fabrics, low-rise jeans, oversized shoulders..."
                value={profile.avoid}
              />
            </div>
            <div className="field">
              <label htmlFor="language">Language</label>
              <input
                id="language"
                onChange={(event) => updateProfile({ language: event.target.value })}
                placeholder="English, Spanish, French..."
                value={profile.language}
              />
            </div>
          </div>
          <button className="ghost-btn" onClick={addBodyLog} type="button">
            Save measurement check-in
          </button>
        </section>

        <section className="scanfit-grid">
          <div className="panel">
            <div className="panel-title">
              <p className="eyebrow">Outfit Check</p>
              <p className="fine-print">Photo support is for outfit context, not body scanning.</p>
            </div>
            <div className="photo-drop">
              {imageDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img alt="Selected outfit" src={imageDataUrl} />
              ) : (
                <div className="empty-photo">
                  <strong>Start with a mirror photo, outfit screenshot, or notes.</strong>
                  <span className="fine-print">Nobu will not estimate measurements from the image.</span>
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
                placeholder="Black jacket, wide jeans, white sneakers. I want it casual but put together."
                value={notes}
              />
            </div>
            <p className="fine-print">Looks stay private on this device. No public sharing, no community feed.</p>
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

        <section className="triple-grid">
          <div className="panel">
            <div className="panel-title">
              <p className="eyebrow">Smart Sizing</p>
              <p className="fine-print">Uses your manual profile and brand notes.</p>
            </div>
            <div className="field">
              <label htmlFor="brand">Brand</label>
              <input id="brand" onChange={(event) => setBrand(event.target.value)} value={brand} />
            </div>
            <div className="field">
              <label htmlFor="itemType">Item</label>
              <input
                id="itemType"
                onChange={(event) => setItemType(event.target.value)}
                placeholder="Jeans, blazer, sneakers..."
                value={itemType}
              />
            </div>
            <button
              className="action-btn"
              onClick={() => setSizeAdvice(createSizeRecommendation(profile, brand, itemType))}
              type="button"
            >
              Recommend size
            </button>
            {sizeAdvice && <p className="feedback">{sizeAdvice}</p>}
          </div>

          <div className="panel">
            <div className="panel-title">
              <p className="eyebrow">Influencer Mode</p>
              <p className="fine-print">Recreate the vibe, adjusted to your profile.</p>
            </div>
            <div className="field">
              <label htmlFor="influencer">Creator</label>
              <input
                id="influencer"
                onChange={(event) => setInfluencer(event.target.value)}
                placeholder="Creator name"
                value={influencer}
              />
            </div>
            <div className="field">
              <label htmlFor="influencerLook">Look details</label>
              <textarea
                id="influencerLook"
                onChange={(event) => setInfluencerLook(event.target.value)}
                placeholder="Oversized leather jacket, cargos, silver hoops..."
                value={influencerLook}
              />
            </div>
            <button
              className="action-btn"
              onClick={() => setInfluencerAdvice(createInfluencerRecommendation(profile, influencer, influencerLook))}
              type="button"
            >
              Recreate it
            </button>
            {influencerAdvice && <p className="feedback">{influencerAdvice}</p>}
          </div>

          <div className="panel">
            <div className="panel-title">
              <p className="eyebrow">Style Reminders</p>
              <p className="fine-print">Saved preferences for future Nobu nudges.</p>
            </div>
            <div className="mini-list">
              {alerts.map((alert) => (
                <button
                  className={`alert-toggle ${alert.enabled ? 'active' : ''}`}
                  key={alert.id}
                  onClick={() => updateAlerts(alerts.map((item) => (
                    item.id === alert.id ? { ...item, enabled: !item.enabled } : item
                  )))}
                  type="button"
                >
                  {alert.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="wide-grid">
          <div className="panel">
            <div className="panel-title">
              <p className="eyebrow">Look History</p>
              <p className="fine-print">Hits and misses help Nobu learn your style. Stored privately on this device for now.</p>
            </div>
            {history.length > 0 ? (
              <div className="history-grid">
                {history.map((look) => (
                  <article className="look-card" key={look.id}>
                    {look.imageDataUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img alt={`${look.verdict} outfit`} src={look.imageDataUrl} />
                    ) : null}
                    <div className="look-body">
                      <span className="look-verdict">{look.verdict} / {look.privacy}</span>
                      <strong>{look.occasion}</strong>
                      <p className="look-text">{look.feedback}</p>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p className="fine-print">No saved looks yet.</p>
            )}
          </div>

          <div className="panel">
            <div className="panel-title">
              <p className="eyebrow">Body Change Tracking</p>
              <p className="fine-print">Manual check-ins only. No body scanning.</p>
            </div>
            <div className="mini-list">
              {bodyLog.length > 0 ? bodyLog.map((entry) => (
                <div className="mini-item" key={entry.id}>
                  <strong>{new Date(entry.createdAt).toLocaleDateString()}</strong>
                  <p>Chest {entry.chest || '-'} / Waist {entry.waist || '-'} / Hips {entry.hips || '-'}</p>
                  <p>{entry.notes}</p>
                </div>
              )) : (
                <p className="fine-print">Save a measurement check-in from your style profile.</p>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
