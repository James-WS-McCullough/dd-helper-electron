/**
 * Custom Protocol Handler
 *
 * Registers a custom 'media://' protocol to serve local files
 * securely to the renderer process, bypassing file:// restrictions
 */

import { protocol } from 'electron'
import { readFile } from 'fs/promises'
import { normalize } from 'path'
import { existsSync } from 'fs'

/**
 * Register the custom media:// protocol
 * This allows the renderer to access local media files securely
 */
export function registerMediaProtocol(): void {
  protocol.registerFileProtocol('media', (request, callback) => {
    // Remove the protocol prefix to get the actual file path
    const url = request.url.substring('media://'.length)

    try {
      // Decode URI components (handles spaces and special characters)
      const decodedPath = decodeURIComponent(url)

      // Normalize the path to prevent directory traversal attacks
      const normalizedPath = normalize(decodedPath)

      // Check if file exists
      if (!existsSync(normalizedPath)) {
        console.error(`Media file not found: ${normalizedPath}`)
        callback({ error: -6 }) // FILE_NOT_FOUND
        return
      }

      callback({ path: normalizedPath })
    } catch (error) {
      console.error('Error serving media file:', error)
      callback({ error: -2 }) // FAILED
    }
  })
}

/**
 * Register the custom media:// protocol with buffer support
 * Alternative implementation using buffer for more control
 */
export function registerMediaProtocolWithBuffer(): void {
  protocol.registerBufferProtocol('media', async (request, callback) => {
    const url = request.url.substring('media://'.length)

    try {
      const decodedPath = decodeURIComponent(url)
      const normalizedPath = normalize(decodedPath)

      if (!existsSync(normalizedPath)) {
        console.error(`Media file not found: ${normalizedPath}`)
        callback({ error: -6 })
        return
      }

      const data = await readFile(normalizedPath)

      // Determine MIME type based on extension
      const ext = normalizedPath.toLowerCase().split('.').pop()
      const mimeTypes: Record<string, string> = {
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        png: 'image/png',
        gif: 'image/gif',
        webp: 'image/webp',
        svg: 'image/svg+xml',
        mp4: 'video/mp4',
        webm: 'video/webm',
        ogg: 'video/ogg',
        mp3: 'audio/mpeg',
        wav: 'audio/wav',
        m4a: 'audio/mp4'
      }

      const mimeType = mimeTypes[ext || ''] || 'application/octet-stream'

      callback({
        mimeType,
        data
      })
    } catch (error) {
      console.error('Error serving media file:', error)
      callback({ error: -2 })
    }
  })
}
