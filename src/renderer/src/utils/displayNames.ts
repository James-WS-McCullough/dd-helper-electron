/**
 * Display Name Utilities
 *
 * Helper functions for displaying media names in different contexts
 */

import type { MediaFile } from '../types'

/**
 * Get a GM-friendly display name that shows hidden file names
 *
 * For files starting with underscore (hidden from players):
 * - Players see: "???"
 * - GM sees: "??? secret npc portrait" (with underscores replaced by spaces and suffixes removed)
 *
 * This allows GMs to identify which hidden portrait they're selecting
 * while keeping the player display showing just "???"
 */
export function getGMDisplayName(media: MediaFile): string {
  // If the display name is "???", this is a hidden file
  if (media.displayName === '???') {
    // Extract the actual filename from the path
    const fileName = media.path.split('/').pop() || media.displayName

    // Remove the file extension
    const nameWithoutExtension = fileName.replace(/\.[^.]+$/, '')

    // Remove the leading underscore
    const nameWithoutUnderscore = nameWithoutExtension.replace(/^_/, '')

    // Remove any suffix like _location, _loop, _music (same as normal files)
    let cleanName = nameWithoutUnderscore.replace(/_location$|_loop$|_music$/, '')

    // Replace all remaining underscores with spaces
    cleanName = cleanName.replace(/_/g, ' ')

    return `??? ${cleanName}`
  }

  // For normal files, also clean up underscores
  // Replace underscores with spaces for better readability
  return media.displayName.replace(/_/g, ' ')
}

/**
 * Get the player-facing display name (always returns displayName as-is)
 * This is what players see on the display window
 */
export function getPlayerDisplayName(media: MediaFile): string {
  return media.displayName
}

/**
 * Get a GM-friendly display name from path and displayName
 * Useful when you only have these two properties (e.g., from displayState)
 */
export function getGMDisplayNameFromPath(path: string, displayName: string): string {
  // If the display name is "???", this is a hidden file
  if (displayName === '???') {
    // Extract the actual filename from the path
    const fileName = path.split('/').pop() || displayName

    // Remove the file extension
    const nameWithoutExtension = fileName.replace(/\.[^.]+$/, '')

    // Remove the leading underscore
    const nameWithoutUnderscore = nameWithoutExtension.replace(/^_/, '')

    // Remove any suffix like _location, _loop, _music (same as normal files)
    let cleanName = nameWithoutUnderscore.replace(/_location$|_loop$|_music$/, '')

    // Replace all remaining underscores with spaces
    cleanName = cleanName.replace(/_/g, ' ')

    return `??? ${cleanName}`
  }

  // For normal files, also clean up underscores
  // Replace underscores with spaces for better readability
  return displayName.replace(/_/g, ' ')
}
