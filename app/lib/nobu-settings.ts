export type NobuVoiceId = 'eXpIbVcVbLo8ZJQDlDnl' | '5kMbtRSEKIkRZSdXxrZg'
export type NobuVibeId = 'chill' | 'sharp' | 'playful' | 'professional'

export type NobuSettings = {
  name: string
  voiceId: NobuVoiceId
  vibe: NobuVibeId
  color: string
  hasCompletedOnboarding: boolean
  hasUsedRename: boolean
}

export const NOBU_SETTINGS_KEY = 'nobuSettings'
export const NOBU_NAME_KEY = 'nobuName'

export const DEFAULT_NOBU_SETTINGS: NobuSettings = {
  name: 'Nobu',
  voiceId: 'eXpIbVcVbLo8ZJQDlDnl',
  vibe: 'chill',
  color: '#7c3aed',
  hasCompletedOnboarding: false,
  hasUsedRename: false,
}

export const voiceOptions = [
  {
    id: 'female',
    label: 'Female',
    description: 'Siren: clear, warm, quietly magnetic.',
    voiceId: 'eXpIbVcVbLo8ZJQDlDnl' as const,
  },
  {
    id: 'male',
    label: 'Male',
    description: 'Jason: grounded, natural, easy to trust.',
    voiceId: '5kMbtRSEKIkRZSdXxrZg' as const,
  },
]

export const vibeOptions = [
  { id: 'chill' as const, label: 'Chill & supportive' },
  { id: 'sharp' as const, label: 'Sharp & direct' },
  { id: 'playful' as const, label: 'Playful & fun' },
  { id: 'professional' as const, label: 'Professional & focused' },
]

export const colorOptions = [
  { label: 'Purple', value: '#7c3aed' },
  { label: 'Blue', value: '#2563eb' },
  { label: 'Pink', value: '#db2777' },
  { label: 'Green', value: '#059669' },
  { label: 'Orange', value: '#ea580c' },
  { label: 'Red', value: '#dc2626' },
  { label: 'Gold', value: '#d97706' },
  { label: 'Teal', value: '#0891b2' },
]

export function getVoiceOption(voiceId: NobuVoiceId | string) {
  return voiceOptions.find((option) => option.voiceId === voiceId) ?? voiceOptions[0]
}

export function getVibeInstruction(vibe: NobuVibeId) {
  switch (vibe) {
    case 'sharp':
      return 'The user chose Sharp & direct. Be concise, candid, and useful without being harsh.'
    case 'playful':
      return 'The user chose Playful & fun. Keep things light, energetic, and witty when appropriate.'
    case 'professional':
      return 'The user chose Professional & focused. Be structured, efficient, and polished.'
    case 'chill':
    default:
      return 'The user chose Chill & supportive. Be calm, warm, and steady.'
  }
}

export function loadNobuSettings(): NobuSettings {
  if (typeof window === 'undefined') return DEFAULT_NOBU_SETTINGS

  try {
    const saved = window.localStorage.getItem(NOBU_SETTINGS_KEY)
    const legacyName = window.localStorage.getItem(NOBU_NAME_KEY)?.trim()
    const parsed = saved ? JSON.parse(saved) as Partial<NobuSettings> & { voice?: string } : {}
    const migratedVoiceId =
      parsed.voiceId
      ?? voiceOptions.find((option) => option.id === parsed.voice)?.voiceId
      ?? DEFAULT_NOBU_SETTINGS.voiceId
    const settings = {
      ...DEFAULT_NOBU_SETTINGS,
      ...parsed,
      name: parsed.name?.trim() || legacyName || DEFAULT_NOBU_SETTINGS.name,
      voiceId: migratedVoiceId,
    }

    return settings
  } catch {
    return DEFAULT_NOBU_SETTINGS
  }
}

export function saveNobuSettings(settings: NobuSettings) {
  window.localStorage.setItem(NOBU_SETTINGS_KEY, JSON.stringify(settings))
  window.localStorage.setItem(NOBU_NAME_KEY, settings.name)
  window.dispatchEvent(new CustomEvent('nobu-settings-change', { detail: settings }))
}

export function hexToRgb(hex: string) {
  const normalized = hex.replace('#', '')
  const value = Number.parseInt(normalized, 16)

  if (Number.isNaN(value)) return '124, 58, 237'

  return [
    (value >> 16) & 255,
    (value >> 8) & 255,
    value & 255,
  ].join(', ')
}
