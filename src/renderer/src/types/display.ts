/**
 * Display Window Types
 *
 * Type definitions for the display window state and media layers
 */

import type { MediaItem } from './media'
import type { Battlemap } from './battlemap'

export interface DisplayState {
  portraits: MediaItem[]
  focusedPortraitPath: string | null
  background: MediaItem | null
  event: MediaItem | null
  backgroundSounds: MediaItem[]
  backgroundMusic: MediaItem | null
  soundEffects: MediaItem[]
}

export type DisplayElement =
  | 'portraits'
  | 'background'
  | 'event'
  | 'backgroundSound'
  | 'backgroundMusic'
  | 'soundEffect'
  | 'all'

export interface DisplayLayerConfig {
  showPortraits: boolean
  showBackground: boolean
  showEvent: boolean
  playAudio: boolean
}

export interface PortraitDisplayOptions {
  count: number
  scaleMode: 'auto' | 'manual'
  customScale?: number
}

export interface EventVideoState {
  isPlaying: boolean
  currentTime: number
  duration: number
  path: string
}

export interface DisplayWindowState {
  displayState: DisplayState
  currentBattlemap: Battlemap | null
  previousState: DisplayState | null
  eventVideo: EventVideoState | null
}
