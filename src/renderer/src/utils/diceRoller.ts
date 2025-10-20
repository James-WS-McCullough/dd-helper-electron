/**
 * Dice notation parser and roller
 * Supports formats like: d20, 3d6, 2d20+5, 1d4-2, d6+3
 */

export interface DiceRoll {
  notation: string
  rolls: number[]
  modifier: number
  total: number
}

/**
 * Parse dice notation string (e.g., "3d6+2", "d20", "d6+3")
 * Returns null if invalid format
 */
export function parseDiceNotation(notation: string): {
  count: number
  sides: number
  modifier: number
} | null {
  const pattern = /^(\d*)d(\d+)([+-]\d+)?$/i
  const match = notation.trim().match(pattern)

  if (!match) return null

  const count = match[1] ? parseInt(match[1], 10) : 1 // Default to 1 if not specified
  const sides = parseInt(match[2], 10)
  const modifier = match[3] ? parseInt(match[3], 10) : 0

  // Validate reasonable values
  if (count < 1 || count > 100) return null
  if (sides < 2 || sides > 1000) return null

  return { count, sides, modifier }
}

/**
 * Roll dice based on notation
 */
export function rollDice(notation: string): DiceRoll | null {
  const parsed = parseDiceNotation(notation)
  if (!parsed) return null

  const { count, sides, modifier } = parsed
  const rolls: number[] = []

  for (let i = 0; i < count; i++) {
    rolls.push(Math.floor(Math.random() * sides) + 1)
  }

  const total = rolls.reduce((sum, roll) => sum + roll, 0) + modifier

  return {
    notation,
    rolls,
    modifier,
    total
  }
}

/**
 * Find all dice notation patterns in text
 * Returns array of {notation, startIndex, endIndex}
 */
export function findDiceNotations(text: string): Array<{
  notation: string
  startIndex: number
  endIndex: number
}> {
  const pattern = /\b(\d*d\d+(?:[+-]\d+)?)\b/gi
  const matches: Array<{ notation: string; startIndex: number; endIndex: number }> = []
  let match: RegExpExecArray | null

  while ((match = pattern.exec(text)) !== null) {
    matches.push({
      notation: match[1],
      startIndex: match.index,
      endIndex: match.index + match[1].length
    })
  }

  return matches
}
