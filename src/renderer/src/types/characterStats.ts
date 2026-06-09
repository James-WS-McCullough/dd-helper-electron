/**
 * Character Stats Types
 *
 * Type definitions for D&D 5e NPC/Monster stat blocks
 */

export interface AbilityScores {
  strength: number
  dexterity: number
  constitution: number
  intelligence: number
  wisdom: number
  charisma: number
}

export interface CharacterSpeed {
  walk?: number
  fly?: number
  swim?: number
  climb?: number
  burrow?: number
}

export interface CharacterSenses {
  darkvision?: number
  blindsight?: number
  tremorsense?: number
  truesight?: number
  passivePerception?: number
}

export type AbilityType = 'action' | 'bonus_action' | 'reaction' | 'trait' | 'legendary'

export interface CharacterAbility {
  id: string
  name: string
  type: AbilityType
  description: string  // Contains dice notation like "2d6+3 damage"
  recharge?: string    // e.g., "Recharge 5-6"
}

export type SkillProficiency = 'proficient' | 'expertise'

export interface CharacterStats {
  id: string
  name: string
  type?: string                    // e.g., "Medium humanoid (elf)"
  alignment?: string               // e.g., "Neutral Evil"
  challengeRating?: string         // e.g., "1/4", "5"

  abilityScores: AbilityScores

  armorClass: number
  acDescription?: string           // e.g., "natural armor", "studded leather"
  maxHitPoints: number
  currentHitPoints?: number
  hitDice?: string                 // e.g., "4d8+8"

  speed: CharacterSpeed

  proficiencyBonus?: number
  savingThrows?: { [ability: string]: boolean }
  skills?: { [skill: string]: SkillProficiency }

  damageVulnerabilities?: string[]
  damageResistances?: string[]
  damageImmunities?: string[]
  conditionImmunities?: string[]

  senses?: CharacterSenses
  languages?: string[]

  abilities: CharacterAbility[]    // Actions, traits, reactions with dice expressions
  portraitPath?: string            // Link to portrait image
  tags?: string[]                  // Custom tags for filtering

  createdAt: string
  updatedAt: string
}

export interface CharacterStatsFileInfo {
  filename: string
  path: string
  name: string
  type?: string
  challengeRating?: string
  maxHitPoints: number
  armorClass: number
  portraitPath?: string
  tags?: string[]
  lastModified: Date
}
