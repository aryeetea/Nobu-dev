import { live2dModels, type Live2DCharacterId, type Live2DMotionOption } from './live2d-models'

export type NobuEmotion =
  | 'neutral'
  | 'happy'
  | 'laughing'
  | 'sad'
  | 'crying'
  | 'angry'
  | 'confused'
  | 'surprised'
  | 'thinking'
  | 'blush'
  | 'dizzy'
  | 'fashion'
  | 'cool'
  | 'encouraging'

export type NobuVisualState = {
  emotion: NobuEmotion
  expressionIndex: number | null
  motion: Live2DMotionOption | null
  toggles: Record<string, boolean>
}

export const nobuEmotionNames: NobuEmotion[] = [
  'neutral',
  'happy',
  'laughing',
  'sad',
  'crying',
  'angry',
  'confused',
  'surprised',
  'thinking',
  'blush',
  'dizzy',
  'fashion',
  'cool',
  'encouraging',
]

const emotionKeywords: Array<{ emotion: NobuEmotion; patterns: RegExp[] }> = [
  {
    emotion: 'crying',
    patterns: [/\b(crying|sobbing|tears|heartbroken|devastated)\b/i],
  },
  {
    emotion: 'sad',
    patterns: [/\b(sad|sorry|hurt|lonely|grief|upset|rough|hard day)\b/i],
  },
  {
    emotion: 'angry',
    patterns: [/\b(angry|mad|annoyed|frustrated|unfair|rage|furious)\b/i],
  },
  {
    emotion: 'laughing',
    patterns: [/\b(haha|ahah|lol|lmao|funny|cracking up|that is hilarious)\b/i],
  },
  {
    emotion: 'happy',
    patterns: [/\b(happy|glad|love that|amazing|great|yay|perfect|excited)\b/i],
  },
  {
    emotion: 'encouraging',
    patterns: [/\b(proud|you got this|good job|keep going|i believe|we can do this)\b/i],
  },
  {
    emotion: 'dizzy',
    patterns: [/\b(overwhelmed|dizzy|chaotic|too much|spiraling|stressed)\b/i],
  },
  {
    emotion: 'confused',
    patterns: [/\b(confused|not sure|hmm|maybe|question|what do you mean|unclear)\b/i],
  },
  {
    emotion: 'surprised',
    patterns: [/\b(wow|wait|surprised|shocked|no way|really)\b/i],
  },
  {
    emotion: 'blush',
    patterns: [/\b(cute|sweet|shy|blush|adorable)\b/i],
  },
  {
    emotion: 'fashion',
    patterns: [/\b(outfit|fit|style|fashion|clothes|sizing|jacket|pants|dress|shoes|wardrobe)\b/i],
  },
  {
    emotion: 'thinking',
    patterns: [/\b(think|let me see|consider|plan|strategy|idea)\b/i],
  },
  {
    emotion: 'cool',
    patterns: [/\b(cool|clean|fire|sharp|sleek|polished)\b/i],
  },
]

export function normalizeNobuEmotion(value: unknown): NobuEmotion {
  if (typeof value !== 'string') return 'neutral'

  const normalized = value.trim().toLowerCase().replace(/[\s_-]+/g, '-')
  const exact = nobuEmotionNames.find((emotion) => emotion === normalized)
  if (exact) return exact

  if (normalized.includes('laugh')) return 'laughing'
  if (normalized.includes('cry') || normalized.includes('sob')) return 'crying'
  if (normalized.includes('sad')) return 'sad'
  if (normalized.includes('mad') || normalized.includes('angry')) return 'angry'
  if (normalized.includes('confus') || normalized.includes('question')) return 'confused'
  if (normalized.includes('surpris') || normalized.includes('shock')) return 'surprised'
  if (normalized.includes('fashion') || normalized.includes('style') || normalized.includes('outfit')) return 'fashion'
  if (normalized.includes('encourag') || normalized.includes('proud')) return 'encouraging'
  if (normalized.includes('happy') || normalized.includes('joy')) return 'happy'

  return 'neutral'
}

export function inferNobuEmotionFromText(text: string): NobuEmotion {
  const trimmed = text.trim()
  if (!trimmed) return 'neutral'

  for (const entry of emotionKeywords) {
    if (entry.patterns.some((pattern) => pattern.test(trimmed))) {
      return entry.emotion
    }
  }

  return 'neutral'
}

export function getNobuVisualState(
  character: Live2DCharacterId,
  emotion: NobuEmotion,
): NobuVisualState {
  if (character === 'female') {
    return getAlexiaVisualState(emotion)
  }

  return getAsukaVisualState(emotion)
}

function getAlexiaVisualState(emotion: NobuEmotion): NobuVisualState {
  const defaultMotion = live2dModels.female.motions[0] ?? null

  switch (emotion) {
    case 'happy':
      return visual(emotion, 2, defaultMotion, { Param54: true })
    case 'laughing':
      return visual(emotion, 9, defaultMotion, { Param54: true, Param55: true })
    case 'sad':
      return visual(emotion, 10, null, { Param59: true })
    case 'crying':
      return visual(emotion, 10, null, { Param59: true })
    case 'angry':
      return visual(emotion, 7, null, { Param57: true })
    case 'confused':
      return visual(emotion, 8, null, { Param43: true })
    case 'surprised':
      return visual(emotion, 9, defaultMotion, { Param55: true })
    case 'thinking':
      return visual(emotion, 8, null, { Param43: true })
    case 'blush':
      return visual(emotion, 4, null, { Param58: true })
    case 'dizzy':
      return visual(emotion, 5, null, { Param56: true, Param44: true })
    case 'fashion':
      return visual(emotion, 3, defaultMotion, { Param16: true })
    case 'cool':
      return visual(emotion, 3, defaultMotion, { Param11: true })
    case 'encouraging':
      return visual(emotion, 2, defaultMotion, { Param54: true })
    case 'neutral':
    default:
      return visual('neutral', null, null, {})
  }
}

function getAsukaVisualState(emotion: NobuEmotion): NobuVisualState {
  const handWave = live2dModels.male.motions.find((motion) => motion.label === 'Hand Wave') ?? null
  const cry = live2dModels.male.motions.find((motion) => motion.label === 'Cry') ?? null
  const preview = live2dModels.male.motions.find((motion) => motion.label === 'Model Preview') ?? null

  switch (emotion) {
    case 'happy':
    case 'laughing':
    case 'encouraging':
      return visual(emotion, 1, handWave, { ParamCheek: true })
    case 'sad':
    case 'crying':
      return visual(emotion, 0, cry, {})
    case 'surprised':
      return visual(emotion, 2, preview, { ParamCheek: true })
    case 'fashion':
    case 'cool':
      return visual(emotion, 3, preview, { ParamCheek: true })
    case 'blush':
      return visual(emotion, 1, null, { ParamCheek: true })
    case 'angry':
    case 'confused':
    case 'thinking':
    case 'dizzy':
      return visual(emotion, 0, null, {})
    case 'neutral':
    default:
      return visual('neutral', null, null, {})
  }
}

function visual(
  emotion: NobuEmotion,
  expressionIndex: number | null,
  motion: Live2DMotionOption | null,
  toggles: Record<string, boolean>,
): NobuVisualState {
  return {
    emotion,
    expressionIndex,
    motion,
    toggles,
  }
}
