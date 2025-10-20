/**
 * Encounter Types
 *
 * Type definitions for combat encounters and enemies
 */

export interface Enemy {
  name: string
  hp: number
  maxHp: number
  ac: number
  initiative?: number
  portraitPath?: string
  notes?: string
}

export interface Encounter {
  name: string
  enemies: Enemy[]
  description?: string
  difficulty?: 'easy' | 'medium' | 'hard' | 'deadly'
  createdAt?: string
  updatedAt?: string
}

export interface EncounterFileInfo {
  filename: string
  path: string
  name: string
  enemyCount: number
  lastModified: Date
}
