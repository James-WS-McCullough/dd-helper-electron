/**
 * Encounter Types
 *
 * Type definitions for combat encounters and enemies
 */

import type { CharacterStats } from './characterStats'

export type Disposition = 'hostile' | 'friendly' | 'neutral'

export interface Enemy {
  name: string
  maxHp: number
  ac: number
  initiative?: number
  portraitPath?: string
  notes?: string
  stats?: CharacterStats
  disposition?: Disposition
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
