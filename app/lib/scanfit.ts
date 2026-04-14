import type { NobuVibeId } from './nobu-settings'

export const SCANFIT_HISTORY_KEY = 'nobuScanFitLooks'

export type ScanFitVerdict = 'hit' | 'miss'

export type ScanFitLook = {
  id: string
  createdAt: string
  verdict: ScanFitVerdict
  occasion: string
  notes: string
  feedback: string
  imageDataUrl?: string
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
}

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

export function createScanFitFeedback({ vibe, occasion, notes, signal }: FeedbackInput) {
  const signalRead = getSignalRead(signal)
  const occasionRead = getOccasionRead(occasion)
  const notesRead = getNotesRead(notes)

  switch (vibe) {
    case 'genz':
      return `Quick read: the fit needs one clear main character. ${signalRead} ${occasionRead} ${notesRead} If one piece is fighting for attention, swap it for something cleaner and let the strongest item carry.`
    case 'fashionExpert':
      return `My stylist read: ${signalRead} ${occasionRead} ${notesRead} Check three things before saving it as a hit: shoulder line, waist balance, and shoe weight. If any one feels off, simplify the lower half first.`
    case 'hypeCoach':
      return `You can make this work. ${signalRead} ${occasionRead} ${notesRead} Keep the piece that gives you confidence, then clean up the part that feels uncertain. Strong outfit, sharper edit.`
    case 'minimalist':
      return `${signalRead} ${occasionRead} ${notesRead} Fix one thing: balance the silhouette, then save it.`
    case 'playful':
      return `ScanFit verdict loading: potential is present. ${signalRead} ${occasionRead} ${notesRead} The outfit needs a cleaner story. Pick the hero piece, calm the backup dancers, and let the look land.`
    case 'chill':
    default:
      return `Here is the honest read: ${signalRead} ${occasionRead} ${notesRead} I would keep what feels most like you, then adjust either the pants or shoes first. Small change, better balance.`
  }
}

export function loadScanFitHistory() {
  if (typeof window === 'undefined') return []

  try {
    const saved = window.localStorage.getItem(SCANFIT_HISTORY_KEY)
    return saved ? JSON.parse(saved) as ScanFitLook[] : []
  } catch {
    return []
  }
}

export function saveScanFitHistory(history: ScanFitLook[]) {
  window.localStorage.setItem(SCANFIT_HISTORY_KEY, JSON.stringify(history.slice(0, 12)))
}
