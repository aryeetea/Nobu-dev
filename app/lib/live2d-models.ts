export type Live2DCharacterId = 'female' | 'male'

export type Live2DExpressionOption = {
  id: string
  index: number
  label: string
}

export type Live2DMotionOption = {
  group: string
  index: number
  label: string
}

export type Live2DToggleOption = {
  parameterId: string
  label: string
}

export type Live2DModelCredit = {
  modelName: string
  creator: string
  source: string
  licenseNote: string
}

export type Live2DModelDefinition = {
  id: Live2DCharacterId
  label: string
  path: string
  credit: Live2DModelCredit
  expressions: Live2DExpressionOption[]
  motions: Live2DMotionOption[]
  toggles: Live2DToggleOption[]
}

export const live2dModels: Record<Live2DCharacterId, Live2DModelDefinition> = {
  female: {
    id: 'female',
    label: 'Alexia',
    path: '/models/Alexia/Alexia.model3.json',
    credit: {
      modelName: 'Alexia',
      creator: 'Creator credit needed',
      source: 'Source link needed',
      licenseNote: 'Confirm the creator license before App Store submission.',
    },
    expressions: [
      { id: 'bbt', index: 0, label: 'BBT' },
      { id: 'dyj', index: 1, label: 'DYJ' },
      { id: 'h', index: 2, label: 'Happy' },
      { id: 'k', index: 3, label: 'Cool' },
      { id: 'lh', index: 4, label: 'Blush' },
      { id: 'lzx', index: 5, label: 'Dizzy' },
      { id: 'mj', index: 6, label: 'Sunglasses' },
      { id: 'sq', index: 7, label: 'Angry' },
      { id: 'wh', index: 8, label: 'Question' },
      { id: 'xxy', index: 9, label: 'Star Eyes' },
      { id: 'y', index: 10, label: 'Cry' },
      { id: 'yf', index: 11, label: 'Outfit' },
      { id: 'yfmz', index: 12, label: 'Outfit Hat' },
      { id: 'yjys1', index: 13, label: 'Eye Color 1' },
      { id: 'yjys2', index: 14, label: 'Eye Color 2' },
      { id: 'zs1', index: 15, label: 'Pose 1' },
    ],
    motions: [
      { group: '', index: 0, label: 'Default Motion' },
    ],
    toggles: [
      { parameterId: 'Param11', label: 'Sunglasses' },
      { parameterId: 'Param64', label: 'Glasses' },
      { parameterId: 'Param16', label: 'Outfit' },
      { parameterId: 'Param17', label: 'Outfit with hat' },
      { parameterId: 'Param43', label: 'Question mark' },
      { parameterId: 'Param44', label: 'Sweat' },
      { parameterId: 'Param54', label: 'Grin' },
      { parameterId: 'Param55', label: 'Star eyes' },
      { parameterId: 'Param56', label: 'Dizzy' },
      { parameterId: 'Param57', label: 'Angry' },
      { parameterId: 'Param58', label: 'Blush' },
      { parameterId: 'Param59', label: 'Cry' },
      { parameterId: 'Param61', label: 'Pose 1' },
      { parameterId: 'Param62', label: 'Eye color 1' },
      { parameterId: 'Param63', label: 'Eye color 2' },
    ],
  },
  male: {
    id: 'male',
    label: 'Asuka',
    path: '/models/ASUKA/Asuka.model3.json',
    credit: {
      modelName: 'Asuka',
      creator: 'Creator credit needed',
      source: 'Source link needed',
      licenseNote: 'Confirm the creator license before App Store submission.',
    },
    expressions: [
      { id: 'gloom', index: 0, label: 'Gloom' },
      { id: 'happy-sparkle', index: 1, label: 'Happy Sparkle' },
      { id: 'star-eyes-toggle', index: 2, label: 'Star Eyes' },
      { id: 'coat-toggle', index: 3, label: 'Coat Toggle' },
    ],
    motions: [
      { group: 'ANIMATIONS', index: 0, label: 'Hand Wave' },
      { group: 'ANIMATIONS', index: 1, label: 'Cry' },
      { group: 'Preview', index: 0, label: 'Model Preview' },
    ],
    toggles: [
      { parameterId: 'ParamCheek', label: 'Cheek' },
      { parameterId: 'Param46', label: 'X' },
    ],
  },
}

export const live2dModelCredits = Object.values(live2dModels).map((model) => model.credit)
