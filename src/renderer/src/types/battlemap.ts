/**
 * Battlemap Types
 *
 * Type definitions for tactical battlemaps with grid and tokens
 */

export interface BattlemapToken {
  name: string
  x: number
  y: number
  portrait?: string
  hidden?: boolean
  color?: string
}

export interface BattlemapZoom {
  scale: number
  centerX: number
  centerY: number
  lastMovedToken?: {
    x: number
    y: number
  }
}

export interface MovementRadius {
  active: boolean
  centerX: number
  centerY: number
  radius: number
}

export interface Battlemap {
  gridWidth: number
  gridHeight: number
  backgroundImage: string
  tokens: Record<string, BattlemapToken>  // Key: "x-y"
  zoom?: BattlemapZoom
  movementRadius?: MovementRadius
  name?: string
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
