/**
 * Initiative Tracking Types
 *
 * Type definitions for combat initiative and turn order
 */

import type { PartyMember } from './party'
import type { Enemy, Disposition } from './encounter'
import type { CharacterStats } from './characterStats'

export type CombatantType = 'player' | 'enemy' | 'note'

export interface Combatant {
  id: string
  name: string
  type: CombatantType
  initiative: number
  hp: number
  maxHp: number
  ac: number
  portraitPath?: string
  notes?: string
  stats?: CharacterStats
  disposition?: Disposition
  tags?: string[]
  deathSaves?: DeathSaves
  // Reference to original data
  originalData?: PartyMember | Enemy
}

export interface DeathSaves {
  successes: number
  failures: number
}

export interface InitiativeData {
  combatants: Combatant[]
  currentTurn: number
  round: number
  isActive: boolean
  encounterName?: string
  createdAt?: string
  updatedAt?: string
}

export interface TurnOrder {
  combatants: Combatant[]
  currentIndex: number
  round: number
}
