/**
 * Party Types
 *
 * Type definitions for D&D party members and party data.
 * Focused on base stat blocks for auto-rolling initiative, saving throws,
 * and tracking passive perception / AC.
 */

import type { AbilityScores, SkillProficiency } from './characterStats'

export interface PartyMember {
  id: string
  name: string
  class: string
  level: number
  ac: number
  abilityScores: AbilityScores
  proficiencyBonus: number
  savingThrowProficiencies: { [ability: string]: boolean }
  skillProficiencies?: { [skill: string]: SkillProficiency }
  portraitPath?: string
  notes?: string
}

export interface PartyData {
  name: string
  members: PartyMember[]
  createdAt?: string
  updatedAt?: string
}

export interface PartyFileInfo {
  filename: string
  path: string
  name: string
  memberCount: number
  lastModified: Date
}
