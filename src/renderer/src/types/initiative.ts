/**
 * Initiative Tracking Types
 *
 * Type definitions for combat initiative and turn order
 */

import type { PartyMember } from './party'
import type { Enemy } from './encounter'

export type CombatantType = 'player' | 'enemy'

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
  // Reference to original data
  originalData?: PartyMember | Enemy
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
