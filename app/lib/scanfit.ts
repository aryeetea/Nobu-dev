import type { NobuVibeId } from './nobu-settings'

export const SCANFIT_HISTORY_KEY = 'nobuScanFitLooks'
export const SCANFIT_PROFILE_KEY = 'nobuScanFitProfile'
export const SCANFIT_ALERTS_KEY = 'nobuScanFitAlerts'
export const SCANFIT_BODY_LOG_KEY = 'nobuScanFitBodyLog'

export type ScanFitVerdict = 'hit' | 'miss'
export type PrivacyLevel = 'private'

export type ScanFitLook = {
  id: string
  createdAt: string
  verdict: ScanFitVerdict
  occasion: string
  notes: string
  feedback: string
  rating: number
  privacy: PrivacyLevel
  tags: string[]
  imageDataUrl?: string
}

export type ScanFitProfile = {
  height: string
  chest: string
  waist: string
  hips: string
  inseam: string
  usualTop: string
  usualBottom: string
  shoeSize: string
  favoriteBrands: string
  styleGoals: string
  avoid: string
  language: string
}

export type FashionAlert = {
  id: string
  label: string
  enabled: boolean
}

export type BodyLogEntry = {
  id: string
  createdAt: string
  weight: string
  chest: string
  waist: string
  hips: string
  notes: string
}

export type OutfitSignal = {
  brightness: number
  contrast: number
  saturation: number
}

type FeedbackInput = {
  vibe: NobuVibeId
  occasion: string
  notes: string
  signal?: OutfitSignal | null
  profile?: ScanFitProfile
}

export const DEFAULT_SCANFIT_PROFILE: ScanFitProfile = {
  height: '',
  chest: '',
  waist: '',
  hips: '',
  inseam: '',
  usualTop: '',
  usualBottom: '',
  shoeSize: '',
  favoriteBrands: '',
  styleGoals: '',
  avoid: '',
  language: 'English',
}

export const DEFAULT_FASHION_ALERTS: FashionAlert[] = [
  { id: 'sales', label: 'Sales in my size', enabled: true },
  { id: 'creatorLooks', label: 'Creator looks worth recreating', enabled: true },
  { id: 'weather', label: 'Weather-ready outfit ideas', enabled: false },
  { id: 'events', label: 'Event outfit reminders', enabled: false },
]

function getSignalRead(signal?: OutfitSignal | null) {
  if (!signal) {
    return 'I need your outfit notes for the real critique in this first ScanFit version.'
  }

  const lightRead =
    signal.brightness > 172
      ? 'The photo reads bright, so lighter pieces may be carrying the look.'
      : signal.brightness < 82
        ? 'The photo reads dark, so contrast and shape matter more here.'
        : 'The photo has a balanced light range.'
  const contrastRead =
    signal.contrast > 58
      ? 'The contrast is strong, which can make the outfit feel more intentional.'
      : 'The contrast is soft, so fit and texture need to do more of the work.'
  const colorRead =
    signal.saturation > 92
      ? 'The colors have energy, so keep the accessories controlled.'
      : 'The colors are muted, which works best when the silhouette is sharp.'

  return `${lightRead} ${contrastRead} ${colorRead}`
}

function getOccasionRead(occasion: string) {
  const cleanOccasion = occasion.trim()
  if (!cleanOccasion) return 'Tell me the occasion next time and I can be more exact.'

  return `For ${cleanOccasion}, the look should feel intentional before it feels loud.`
}

function getNotesRead(notes: string) {
  const cleanNotes = notes.trim()
  if (!cleanNotes) {
    return 'Add what you are wearing, what feels off, or what you want people to notice.'
  }

  return `Based on your notes: ${cleanNotes}`
}

function getProfileRead(profile?: ScanFitProfile) {
  if (!profile) return ''

  const details = [
    profile.usualTop && `usual top: ${profile.usualTop}`,
    profile.usualBottom && `usual bottom: ${profile.usualBottom}`,
    profile.shoeSize && `shoe size: ${profile.shoeSize}`,
    profile.favoriteBrands && `brands: ${profile.favoriteBrands}`,
    profile.styleGoals && `goal: ${profile.styleGoals}`,
    profile.avoid && `avoid: ${profile.avoid}`,
  ].filter(Boolean)

  if (details.length === 0) return ''

  return `I am using your style profile (${details.join('; ')}).`
}

export function createSizeRecommendation(profile: ScanFitProfile, brand: string, itemType: string) {
  const cleanBrand = brand.trim() || 'this brand'
  const cleanType = itemType.trim().toLowerCase()
  const waist = Number.parseFloat(profile.waist)
  const hips = Number.parseFloat(profile.hips)
  const chest = Number.parseFloat(profile.chest)
  const usualTop = profile.usualTop.trim()
  const usualBottom = profile.usualBottom.trim()

  if (!usualTop && !usualBottom && !waist && !hips && !chest) {
    return 'Add your usual sizes or manual measurements first, then I can give a better size recommendation.'
  }

  if (cleanType.includes('jean') || cleanType.includes('pant') || cleanType.includes('skirt')) {
    const base = usualBottom || (waist ? `${Math.round(waist)} waist` : 'your usual bottom size')
    const fitNote = hips && waist && hips - waist > 10
      ? 'Check the hip measurement first and consider tailoring the waist.'
      : 'Check the waist and rise before buying.'

    return `For ${cleanBrand}, start with ${base}. ${fitNote} If reviews say the item runs small, size up once and tailor down if needed.`
  }

  if (cleanType.includes('shoe') || cleanType.includes('sneaker') || cleanType.includes('boot')) {
    return `For ${cleanBrand}, start with ${profile.shoeSize || 'your usual shoe size'}. If the toe box looks narrow, go up half a size.`
  }

  const base = usualTop || (chest ? `${Math.round(chest)} chest` : 'your usual top size')
  return `For ${cleanBrand}, start with ${base}. If you want a sharper silhouette, prioritize shoulder fit and tailor the waist.`
}

export function createInfluencerRecommendation(profile: ScanFitProfile, influencer: string, look: string) {
  const name = influencer.trim() || 'that creator'
  const lookDescription = look.trim() || 'the outfit'
  const sizeAnchor = profile.usualTop || profile.usualBottom
    ? `Start from your saved sizes: top ${profile.usualTop || 'unknown'}, bottom ${profile.usualBottom || 'unknown'}.`
    : 'Add your usual top and bottom sizes to make this more accurate.'
  const brandNote = profile.favoriteBrands.trim()
    ? `Search your preferred brands first: ${profile.favoriteBrands}.`
    : 'Choose brands you already know fit you before trying a new label.'

  return `To recreate ${name}'s look, copy the silhouette before copying exact pieces: ${lookDescription}. ${sizeAnchor} ${brandNote} Keep one hero item and replace anything that fights your proportions or comfort. Honest advice, but always with warmth and encouragement.`
}

export function createScanFitFeedback({ vibe, occasion, notes, signal, profile }: FeedbackInput) {
  const signalRead = getSignalRead(signal)
  const occasionRead = getOccasionRead(occasion)
  const notesRead = getNotesRead(notes)
  const profileRead = getProfileRead(profile)

  // Nobu is always honest, warm, and friendly, regardless of style.
  switch (vibe) {
    case 'genz':
      return `Quick read (with love): the fit needs one clear main character. ${signalRead} ${occasionRead} ${notesRead} ${profileRead} If one piece is fighting for attention, swap it for something cleaner and let the strongest item carry. Always honest, always rooting for you.`
    case 'fashionExpert':
      return `My stylist read (with kindness): ${signalRead} ${occasionRead} ${notesRead} ${profileRead} Check three things before saving it as a hit: shoulder line, waist balance, and shoe weight. If any one feels off, simplify the lower half first. Honest advice, but always with warmth.`
    case 'hypeCoach':
      return `You can make this work! ${signalRead} ${occasionRead} ${notesRead} ${profileRead} Keep the piece that gives you confidence, then clean up the part that feels uncertain. Strong outfit, sharper edit. Honest, but always supportive.`
    case 'minimalist':
      return `${signalRead} ${occasionRead} ${notesRead} ${profileRead} Fix one thing: balance the silhouette, then save it. Direct, but always with care.`
    case 'playful':
      return `ScanFit verdict loading: potential is present! ${signalRead} ${occasionRead} ${notesRead} ${profileRead} The outfit needs a cleaner story. Pick the hero piece, calm the backup dancers, and let the look land. Honest, but always with a smile.`
    case 'chill':
    default:
      return `Here is the honest read (with warmth): ${signalRead} ${occasionRead} ${notesRead} ${profileRead} I would keep what feels most like you, then adjust either the pants or shoes first. Small change, better balance. Always honest, always kind.`
  }
}

function loadJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback

  try {
    const saved = window.localStorage.getItem(key)
    return saved ? JSON.parse(saved) as T : fallback
  } catch {
    return fallback
  }
}

export function loadScanFitHistory() {
  return loadJson<ScanFitLook[]>(SCANFIT_HISTORY_KEY, [])
}

export function saveScanFitHistory(history: ScanFitLook[]) {
  window.localStorage.setItem(SCANFIT_HISTORY_KEY, JSON.stringify(history.slice(0, 12)))
}

export function loadScanFitProfile() {
  return {
    ...DEFAULT_SCANFIT_PROFILE,
    ...loadJson<Partial<ScanFitProfile>>(SCANFIT_PROFILE_KEY, {}),
  }
}

export function saveScanFitProfile(profile: ScanFitProfile) {
  window.localStorage.setItem(SCANFIT_PROFILE_KEY, JSON.stringify(profile))
}

export function loadFashionAlerts() {
  const savedAlerts = loadJson<FashionAlert[]>(SCANFIT_ALERTS_KEY, DEFAULT_FASHION_ALERTS)

  return DEFAULT_FASHION_ALERTS.map((alert) => (
    savedAlerts.find((savedAlert) => savedAlert.id === alert.id) ?? alert
  ))
}

export function saveFashionAlerts(alerts: FashionAlert[]) {
  window.localStorage.setItem(SCANFIT_ALERTS_KEY, JSON.stringify(alerts))
}

export function loadBodyLog() {
  return loadJson<BodyLogEntry[]>(SCANFIT_BODY_LOG_KEY, [])
}

export function saveBodyLog(entries: BodyLogEntry[]) {
  window.localStorage.setItem(SCANFIT_BODY_LOG_KEY, JSON.stringify(entries.slice(0, 24)))
}
