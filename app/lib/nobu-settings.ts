export type NobuVoiceId = 'eXpIbVcVbLo8ZJQDlDnl' | '5kMbtRSEKIkRZSdXxrZg'
export type NobuVibeId =
  | 'genz'
  | 'fashionExpert'
  | 'hypeCoach'
  | 'chill'
  | 'minimalist'
  | 'playful'

export type NobuSettings = {
  name: string
  character: 'female' | 'male'
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
  character: 'female',
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

export const characterOptions = [
  {
    id: 'female' as const,
    label: 'Female Nobu',
    description: 'Alexia: expressive, soft, and bright on screen.',
  },
  {
    id: 'male' as const,
    label: 'Male Nobu',
    description: 'Asuka: calm, sharp, and grounded on screen.',
  },
]

export const vibeOptions = [
  {
    id: 'genz' as const,
    label: 'Gen-Z Mode',
    description: 'Slangy, hype, funny, and brutally honest.',
  },
  {
    id: 'fashionExpert' as const,
    label: 'Fashion Expert',
    description: 'Polished stylist advice with proportion, fit, and color notes.',
  },
  {
    id: 'hypeCoach' as const,
    label: 'Hype Coach',
    description: 'Motivational and confidence-first, but still honest.',
  },
  {
    id: 'chill' as const,
    label: 'Chill Friend',
    description: 'Relaxed, casual, and easy to talk to.',
  },
  {
    id: 'minimalist' as const,
    label: 'Minimalist',
    description: 'Short, direct answers with no extra fluff.',
  },
  {
    id: 'playful' as const,
    label: 'Playful',
    description: 'Fun, expressive, and a little dramatic.',
  },
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
    case 'genz':
      return 'The user chose Gen-Z Mode. Be slangy, current, funny, and brutally honest without being cruel.'
    case 'fashionExpert':
      return 'The user chose Fashion Expert Mode. Give polished stylist advice about fit, proportion, color, silhouette, occasion, and shopping choices.'
    case 'hypeCoach':
      return 'The user chose Hype Coach Mode. Be motivational, confidence-building, and energetic while staying honest.'
    case 'minimalist':
      return 'The user chose Minimalist Mode. Keep answers short, direct, and practical.'
    case 'playful':
      return 'The user chose Playful Mode. Be fun, expressive, witty, and a little dramatic when appropriate.'
    case 'chill':
    default:
      return 'The user chose Chill Friend Mode. Be relaxed, casual, warm, and easy to talk to.'
  }
}

function migrateVibe(vibe: unknown): NobuVibeId {
  if (
    vibe === 'genz' ||
    vibe === 'fashionExpert' ||
    vibe === 'hypeCoach' ||
    vibe === 'chill' ||
    vibe === 'minimalist' ||
    vibe === 'playful'
  ) {
    return vibe
  }

  if (vibe === 'sharp') return 'minimalist'
  if (vibe === 'professional') return 'fashionExpert'

  return DEFAULT_NOBU_SETTINGS.vibe
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
    const migratedCharacter =
      parsed.character === 'male' || parsed.character === 'female'
        ? parsed.character
        : migratedVoiceId === '5kMbtRSEKIkRZSdXxrZg'
          ? 'male'
          : DEFAULT_NOBU_SETTINGS.character
    const settings = {
      ...DEFAULT_NOBU_SETTINGS,
      ...parsed,
      character: migratedCharacter,
      name: parsed.name?.trim() || legacyName || DEFAULT_NOBU_SETTINGS.name,
      vibe: migrateVibe(parsed.vibe),
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
