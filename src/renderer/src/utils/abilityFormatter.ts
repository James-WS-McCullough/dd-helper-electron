/**
 * Ability Formatter Utilities
 *
 * Utilities for formatting D&D ability scores and parsing dice notations in text
 */

import { findDiceNotations } from './diceRoller'

/**
 * Calculate ability modifier from ability score
 * Formula: floor((score - 10) / 2)
 */
export function calculateModifier(score: number): number {
  return Math.floor((score - 10) / 2)
}

/**
 * Format modifier as a signed string
 * e.g., 14 -> "+2", 8 -> "-1", 10 -> "+0"
 */
export function formatModifier(modifier: number): string {
  return modifier >= 0 ? `+${modifier}` : `${modifier}`
}

/**
 * Format ability score with modifier
 * e.g., 14 -> "14 (+2)"
 */
export function formatAbilityScore(score: number): string {
  const modifier = calculateModifier(score)
  return `${score} (${formatModifier(modifier)})`
}

/**
 * Parsed segment of ability text
 */
export interface TextSegment {
  type: 'text' | 'dice'
  content: string
  notation?: string
}

/**
 * Parse ability text and split into text and dice segments
 * Returns array of segments that can be rendered with dice buttons
 */
export function parseAbilityText(text: string): TextSegment[] {
  const diceMatches = findDiceNotations(text)
  const segments: TextSegment[] = []

  if (diceMatches.length === 0) {
    return [{ type: 'text', content: text }]
  }

  let lastIndex = 0

  for (const match of diceMatches) {
    // Add text before the dice notation
    if (match.startIndex > lastIndex) {
      segments.push({
        type: 'text',
        content: text.substring(lastIndex, match.startIndex)
      })
    }

    // Add the dice notation
    segments.push({
      type: 'dice',
      content: match.notation,
      notation: match.notation
    })

    lastIndex = match.endIndex
  }

  // Add remaining text after last dice notation
  if (lastIndex < text.length) {
    segments.push({
      type: 'text',
      content: text.substring(lastIndex)
    })
  }

  return segments
}

/**
 * Get abbreviated ability name
 */
export function getAbilityAbbreviation(ability: string): string {
  const abbreviations: Record<string, string> = {
    strength: 'STR',
    dexterity: 'DEX',
    constitution: 'CON',
    intelligence: 'INT',
    wisdom: 'WIS',
    charisma: 'CHA'
  }
  return abbreviations[ability.toLowerCase()] || ability.substring(0, 3).toUpperCase()
}

/**
 * Format challenge rating with XP
 */
export function formatChallengeRating(cr: string): { cr: string; xp: number } {
  const xpByCR: Record<string, number> = {
    '0': 10,
    '1/8': 25,
    '1/4': 50,
    '1/2': 100,
    '1': 200,
    '2': 450,
    '3': 700,
    '4': 1100,
    '5': 1800,
    '6': 2300,
    '7': 2900,
    '8': 3900,
    '9': 5000,
    '10': 5900,
    '11': 7200,
    '12': 8400,
    '13': 10000,
    '14': 11500,
    '15': 13000,
    '16': 15000,
    '17': 18000,
    '18': 20000,
    '19': 22000,
    '20': 25000,
    '21': 33000,
    '22': 41000,
    '23': 50000,
    '24': 62000,
    '25': 75000,
    '26': 90000,
    '27': 105000,
    '28': 120000,
    '29': 135000,
    '30': 155000
  }

  return {
    cr,
    xp: xpByCR[cr] || 0
  }
}

/**
 * Format speed object to readable string
 */
export function formatSpeed(speed: {
  walk?: number
  fly?: number
  swim?: number
  climb?: number
  burrow?: number
}): string {
  const parts: string[] = []

  if (speed.walk) {
    parts.push(`${speed.walk} ft.`)
  }

  if (speed.fly) {
    parts.push(`fly ${speed.fly} ft.`)
  }

  if (speed.swim) {
    parts.push(`swim ${speed.swim} ft.`)
  }

  if (speed.climb) {
    parts.push(`climb ${speed.climb} ft.`)
  }

  if (speed.burrow) {
    parts.push(`burrow ${speed.burrow} ft.`)
  }

  return parts.join(', ') || '0 ft.'
}

/**
 * Format senses object to readable string
 */
export function formatSenses(senses: {
  darkvision?: number
  blindsight?: number
  tremorsense?: number
  truesight?: number
  passivePerception?: number
}): string {
  const parts: string[] = []

  if (senses.darkvision) {
    parts.push(`darkvision ${senses.darkvision} ft.`)
  }

  if (senses.blindsight) {
    parts.push(`blindsight ${senses.blindsight} ft.`)
  }

  if (senses.tremorsense) {
    parts.push(`tremorsense ${senses.tremorsense} ft.`)
  }

  if (senses.truesight) {
    parts.push(`truesight ${senses.truesight} ft.`)
  }

  if (senses.passivePerception) {
    parts.push(`passive Perception ${senses.passivePerception}`)
  }

  return parts.join(', ') || '-'
}

/**
 * Get skill ability mapping
 */
export function getSkillAbility(skill: string): string {
  const skillAbilities: Record<string, string> = {
    acrobatics: 'dexterity',
    'animal handling': 'wisdom',
    arcana: 'intelligence',
    athletics: 'strength',
    deception: 'charisma',
    history: 'intelligence',
    insight: 'wisdom',
    intimidation: 'charisma',
    investigation: 'intelligence',
    medicine: 'wisdom',
    nature: 'intelligence',
    perception: 'wisdom',
    performance: 'charisma',
    persuasion: 'charisma',
    religion: 'intelligence',
    'sleight of hand': 'dexterity',
    stealth: 'dexterity',
    survival: 'wisdom'
  }
  return skillAbilities[skill.toLowerCase()] || 'strength'
}
