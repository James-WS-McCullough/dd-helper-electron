/**
 * Battlemap Types
 *
 * Type definitions for tactical battlemaps with grid and tokens
 */

export type BattlemapTokenType = 'player' | 'character' | 'enemy'

export interface BattlemapToken {
  name: string
  x: number
  y: number
  portrait?: string
  hidden?: boolean
  color?: string
  /** Classification used for styling and movement defaults */
  type?: BattlemapTokenType
  /** Movement speed in feet (defaults to 30 when unset) */
  movementSpeed?: number
  /** For "???" secret tokens: reveal the real name to players on the display */
  nameRevealed?: boolean
  /** Monotonic insertion order, used to auto-label matching tokens (A, B, C…) */
  seq?: number
}

export interface BattlemapZoom {
  scale: number
  centerX: number
  centerY: number
  lastMovedToken?: {
    x: number
    y: number
    name?: string
  }
}

export interface MovementRadius {
  active: boolean
  centerX: number
  centerY: number
  /** Radius measured in grid cells */
  radius: number
  /** Name of the token whose radius is shown */
  tokenName?: string
  /** Movement speed in feet the radius was derived from */
  movementSpeed?: number
  /** True when shown automatically during move mode (cleared on cancel/move) */
  isAutomatic?: boolean
}

export interface Battlemap {
  gridWidth: number
  gridHeight: number
  backgroundImage: string
  tokens: Record<string, BattlemapToken>  // Key: "x-y"
  zoom?: BattlemapZoom
  movementRadius?: MovementRadius
  name?: string
  /** Fog of war: "x-y" keys of tiles hidden from players (dark for the DM, black on the display) */
  hiddenTiles?: string[]
  /** Cached aspect ratio (width / height) of the background image */
  imageAspectRatio?: number
  createdAt?: string
  updatedAt?: string
}

export interface BattlemapFileInfo {
  filename: string
  path: string
  name: string
  gridWidth: number
  gridHeight: number
  backgroundImage: string
  tokenCount: number
  lastModified: Date
}

export interface GridCell {
  x: number
  y: number
  token?: BattlemapToken
  inMovementRange?: boolean
  isCenter?: boolean
}

export interface BattlemapDisplayOptions {
  showGrid: boolean
  showTokenNames: boolean
  showMovementRadius: boolean
  cellSize: number
  gap: number
}
