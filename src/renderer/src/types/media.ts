/**
 * Media Types
 *
 * Type definitions for media files and directory structure
 */

export type MediaType = 'image' | 'video' | 'audio' | 'other'

export type MediaSubtype =
  | 'portrait'      // Character portraits
  | 'background'    // Background images/videos (ends with _location)
  | 'event'         // Event videos
  | 'loop'          // Looping audio (ends with _loop)
  | 'music'         // Background music (ends with _music)
  | 'sound'         // Sound effects
  | 'default'       // Other/unclassified

export interface MediaFile {
  name: string
  path: string
  type: 'file' | 'folder'
  mediaType: MediaType
  mediaSubtype: MediaSubtype
  displayName: string
  children?: MediaFile[]
}

export interface MediaItem {
  path: string
  type: MediaType
  subtype: MediaSubtype
  displayName: string
  id?: number  // For sound effects and background sounds (Date.now())
}

export interface MediaExtensions {
  images: string[]
  videos: string[]
  audio: string[]
}

export const MEDIA_EXTENSIONS: MediaExtensions = {
  images: ['.jpg', '.jpeg', '.png', '.gif'],
  videos: ['.mp4', '.webm'],
  audio: ['.mp3', '.wav', '.ogg']
}
