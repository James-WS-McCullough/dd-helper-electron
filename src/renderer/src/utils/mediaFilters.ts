/**
 * Media Filtering Utilities
 *
 * Functions for filtering media files by type
 */

import type { MediaFile } from '../types'

/**
 * Filter media tree to only include visual media (images and videos)
 */
export function filterVisualMedia(node: MediaFile): MediaFile | null {
  if (node.type === 'file') {
    return node.mediaType === 'image' || node.mediaType === 'video' ? node : null
  }

  const filteredChildren = node.children
    ?.map((child) => filterVisualMedia(child))
    .filter((child): child is MediaFile => child !== null)

  if (!filteredChildren || filteredChildren.length === 0) {
    return null
  }

  return { ...node, children: filteredChildren }
}

/**
 * Filter media tree to only include audio files
 */
export function filterAudioMedia(node: MediaFile): MediaFile | null {
  if (node.type === 'file') {
    return node.mediaType === 'audio' ? node : null
  }

  const filteredChildren = node.children
    ?.map((child) => filterAudioMedia(child))
    .filter((child): child is MediaFile => child !== null)

  if (!filteredChildren || filteredChildren.length === 0) {
    return null
  }

  return { ...node, children: filteredChildren }
}

/**
 * Get all files from a media tree (flattened list)
 */
export function flattenMediaFiles(node: MediaFile): MediaFile[] {
  if (node.type === 'file') {
    return [node]
  }

  if (!node.children || node.children.length === 0) {
    return []
  }

  return node.children.flatMap((child) => flattenMediaFiles(child))
}

/**
 * Get all visual media files (images and videos) as a flat list
 */
export function getAllVisualMedia(node: MediaFile | null): MediaFile[] {
  if (!node) return []
  const filtered = filterVisualMedia(node)
  return filtered ? flattenMediaFiles(filtered) : []
}

/**
 * Get all audio files as a flat list
 */
export function getAllAudioMedia(node: MediaFile | null): MediaFile[] {
  if (!node) return []
  const filtered = filterAudioMedia(node)
  return filtered ? flattenMediaFiles(filtered) : []
}
