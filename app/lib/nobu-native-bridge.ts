import { registerPlugin } from '@capacitor/core'

import type { Live2DCharacterId } from './live2d-models'
import type { NobuRoomAction } from '../components/NobuCharacter'

export type NobuVisionKind = 'outfit' | 'room' | 'note' | 'object'

export type NobuVisionRequest = {
  kind: NobuVisionKind
  prompt?: string
}

export type NobuVisionResult = {
  emotion?: string
  motionGroup?: string
  motionIndex?: number
  reply: string
  summary: string
}

export type NobuNativeLive2DPlugin = {
  setCharacter(options: { character: Live2DCharacterId }): Promise<void>
  setExpression(options: { expressionId: string }): Promise<void>
  playMotion(options: { group: string; index: number }): Promise<void>
  setSpeaking(options: { speaking: boolean }): Promise<void>
  setListening(options: { listening: boolean }): Promise<void>
  setRoomAction(options: { action: NobuRoomAction }): Promise<void>
}

export type NobuNativeVisionPlugin = {
  captureAndAnalyze(options: NobuVisionRequest): Promise<NobuVisionResult>
}

export const NobuNativeLive2D = registerPlugin<NobuNativeLive2DPlugin>('NobuNativeLive2D')
export const NobuNativeVision = registerPlugin<NobuNativeVisionPlugin>('NobuNativeVision')
