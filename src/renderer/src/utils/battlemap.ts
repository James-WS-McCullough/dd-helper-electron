/**
 * Battlemap Utilities
 *
 * Grid math helpers for movement radius, distance and token keys.
 * Mirrors the legacy battlemap behaviour (D&D 5e: 5ft per grid cell).
 */

import type { BattlemapToken } from '../types'

export const FEET_PER_CELL = 5
export const DEFAULT_MOVEMENT_SPEED = 30

/** Excel-style alphabetic label: 0→A, 25→Z, 26→AA, … */
export function indexToLetter(index: number): string {
  let i = index + 1
  let out = ''
  while (i > 0) {
    const r = (i - 1) % 26
    out = String.fromCharCode(65 + r) + out
    i = Math.floor((i - 1) / 26)
  }
  return out
}

/**
 * Auto-label matching tokens (same name) by insertion order: A, B, C…
 * Returns a map of token key → suffix letter. Tokens whose name is unique on
 * the map get an empty string (no suffix). Ordering is by each token's `seq`
 * (stable across moves), falling back to object insertion order.
 */
export function computeTokenLabels(
  tokens: Record<string, BattlemapToken>
): Record<string, string> {
  const groups: Record<string, Array<{ key: string; sort: number }>> = {}
  let order = 0
  for (const [key, token] of Object.entries(tokens)) {
    const base = token.name || ''
    if (!groups[base]) groups[base] = []
    groups[base].push({ key, sort: token.seq ?? order })
    order++
  }

  const labels: Record<string, string> = {}
  for (const base of Object.keys(groups)) {
    const arr = groups[base]
    if (arr.length < 2) {
      labels[arr[0].key] = ''
      continue
    }
    arr.sort((a, b) => a.sort - b.sort)
    arr.forEach((item, i) => {
      labels[item.key] = indexToLetter(i)
    })
  }
  return labels
}

/** Append a label suffix to a name when present */
export function withLabel(name: string, label: string): string {
  return label ? `${name} ${label}` : name
}

/** Composite key used to store tokens by grid position */
export function tokenKey(x: number, y: number): string {
  return `${x}-${y}`
}

/** Parse a "x-y" token key back into coordinates */
export function parseTokenKey(key: string): { x: number; y: number } {
  const [x, y] = key.split('-').map(Number)
  return { x, y }
}

/** Manhattan (grid) distance between two cells */
export function manhattanDistance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.abs(x1 - x2) + Math.abs(y1 - y2)
}

/** Euclidean (straight-line) distance between two cell centers, in cells */
export function euclideanDistance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.hypot(x1 - x2, y1 - y2)
}

/**
 * Whether a cell falls within a circular movement radius of a center cell.
 * Uses Euclidean distance with a half-cell tolerance so cells that are mostly
 * inside the circle are included, giving a rounder fill than a strict test.
 */
export function isWithinRadius(
  x: number,
  y: number,
  centerX: number,
  centerY: number,
  radius: number
): boolean {
  return euclideanDistance(x, y, centerX, centerY) <= radius + 0.5
}

/** Convert a movement speed in feet to a radius measured in grid cells */
export function radiusFromSpeed(movementSpeed: number): number {
  return Math.max(0, Math.floor(movementSpeed / FEET_PER_CELL))
}

/**
 * Build the set of "x-y" keys within a circular movement radius of a center
 * cell, clamped to the grid bounds. Excludes the center cell itself.
 */
export function cellsInRadius(
  centerX: number,
  centerY: number,
  radius: number,
  gridWidth: number,
  gridHeight: number
): Set<string> {
  const cells = new Set<string>()
  for (let y = 0; y < gridHeight; y++) {
    for (let x = 0; x < gridWidth; x++) {
      if (x === centerX && y === centerY) continue
      if (isWithinRadius(x, y, centerX, centerY, radius)) {
        cells.add(tokenKey(x, y))
      }
    }
  }
  return cells
}
