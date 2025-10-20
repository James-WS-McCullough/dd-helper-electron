/**
 * Tests for Custom Protocol Handler
 *
 * Tests the media:// protocol registration and file serving
 */

import { protocol } from 'electron'
import { existsSync } from 'fs'
import { readFile } from 'fs/promises'

// Mock electron
jest.mock('electron', () => ({
  protocol: {
    registerFileProtocol: jest.fn(),
    registerBufferProtocol: jest.fn()
  }
}))

// Mock fs modules
jest.mock('fs', () => ({
  existsSync: jest.fn()
}))

jest.mock('fs/promises', () => ({
  readFile: jest.fn()
}))

describe('Media Protocol Handler', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('registerMediaProtocol', () => {
    it('should register the media:// protocol', () => {
      const { registerMediaProtocol } = require('../../src/main/protocol')

      registerMediaProtocol()

      expect(protocol.registerFileProtocol).toHaveBeenCalledWith(
        'media',
        expect.any(Function)
      )
    })

    it('should handle valid file paths', () => {
      const { registerMediaProtocol } = require('../../src/main/protocol')
      ;(existsSync as jest.Mock).mockReturnValue(true)

      registerMediaProtocol()

      const handler = (protocol.registerFileProtocol as jest.Mock).mock.calls[0][1]
      const callback = jest.fn()

      const request = { url: 'media:///Users/test/image.jpg' }
      handler(request, callback)

      expect(callback).toHaveBeenCalledWith({
        path: '/Users/test/image.jpg'
      })
    })

    it('should handle URL-encoded paths with spaces', () => {
      const { registerMediaProtocol } = require('../../src/main/protocol')
      ;(existsSync as jest.Mock).mockReturnValue(true)

      registerMediaProtocol()

      const handler = (protocol.registerFileProtocol as jest.Mock).mock.calls[0][1]
      const callback = jest.fn()

      const request = { url: 'media:///Users/test/my%20folder/image.jpg' }
      handler(request, callback)

      expect(callback).toHaveBeenCalledWith({
        path: '/Users/test/my folder/image.jpg'
      })
    })

    it('should return error for non-existent files', () => {
      const { registerMediaProtocol } = require('../../src/main/protocol')
      ;(existsSync as jest.Mock).mockReturnValue(false)

      registerMediaProtocol()

      const handler = (protocol.registerFileProtocol as jest.Mock).mock.calls[0][1]
      const callback = jest.fn()

      const request = { url: 'media:///Users/test/nonexistent.jpg' }
      handler(request, callback)

      expect(callback).toHaveBeenCalledWith({ error: -6 }) // FILE_NOT_FOUND
    })

    it('should handle errors gracefully', () => {
      const { registerMediaProtocol } = require('../../src/main/protocol')
      ;(existsSync as jest.Mock).mockImplementation(() => {
        throw new Error('File system error')
      })

      registerMediaProtocol()

      const handler = (protocol.registerFileProtocol as jest.Mock).mock.calls[0][1]
      const callback = jest.fn()

      const request = { url: 'media:///Users/test/image.jpg' }
      handler(request, callback)

      expect(callback).toHaveBeenCalledWith({ error: -2 }) // FAILED
    })
  })

  describe('registerMediaProtocolWithBuffer', () => {
    it('should register the media:// protocol with buffer support', () => {
      const { registerMediaProtocolWithBuffer } = require('../../src/main/protocol')

      registerMediaProtocolWithBuffer()

      expect(protocol.registerBufferProtocol).toHaveBeenCalledWith(
        'media',
        expect.any(Function)
      )
    })

    it('should serve image files with correct MIME type', async () => {
      const { registerMediaProtocolWithBuffer } = require('../../src/main/protocol')
      const mockBuffer = Buffer.from('fake image data')
      ;(existsSync as jest.Mock).mockReturnValue(true)
      ;(readFile as jest.Mock).mockResolvedValue(mockBuffer)

      registerMediaProtocolWithBuffer()

      const handler = (protocol.registerBufferProtocol as jest.Mock).mock.calls[0][1]
      const callback = jest.fn()

      const request = { url: 'media:///Users/test/image.jpg' }
      await handler(request, callback)

      expect(callback).toHaveBeenCalledWith({
        mimeType: 'image/jpeg',
        data: mockBuffer
      })
    })

    it('should serve PNG files with correct MIME type', async () => {
      const { registerMediaProtocolWithBuffer } = require('../../src/main/protocol')
      const mockBuffer = Buffer.from('fake png data')
      ;(existsSync as jest.Mock).mockReturnValue(true)
      ;(readFile as jest.Mock).mockResolvedValue(mockBuffer)

      registerMediaProtocolWithBuffer()

      const handler = (protocol.registerBufferProtocol as jest.Mock).mock.calls[0][1]
      const callback = jest.fn()

      const request = { url: 'media:///Users/test/image.png' }
      await handler(request, callback)

      expect(callback).toHaveBeenCalledWith({
        mimeType: 'image/png',
        data: mockBuffer
      })
    })

    it('should serve video files with correct MIME type', async () => {
      const { registerMediaProtocolWithBuffer } = require('../../src/main/protocol')
      const mockBuffer = Buffer.from('fake video data')
      ;(existsSync as jest.Mock).mockReturnValue(true)
      ;(readFile as jest.Mock).mockResolvedValue(mockBuffer)

      registerMediaProtocolWithBuffer()

      const handler = (protocol.registerBufferProtocol as jest.Mock).mock.calls[0][1]
      const callback = jest.fn()

      const request = { url: 'media:///Users/test/video.mp4' }
      await handler(request, callback)

      expect(callback).toHaveBeenCalledWith({
        mimeType: 'video/mp4',
        data: mockBuffer
      })
    })

    it('should serve audio files with correct MIME type', async () => {
      const { registerMediaProtocolWithBuffer } = require('../../src/main/protocol')
      const mockBuffer = Buffer.from('fake audio data')
      ;(existsSync as jest.Mock).mockReturnValue(true)
      ;(readFile as jest.Mock).mockResolvedValue(mockBuffer)

      registerMediaProtocolWithBuffer()

      const handler = (protocol.registerBufferProtocol as jest.Mock).mock.calls[0][1]
      const callback = jest.fn()

      const request = { url: 'media:///Users/test/audio.mp3' }
      await handler(request, callback)

      expect(callback).toHaveBeenCalledWith({
        mimeType: 'audio/mpeg',
        data: mockBuffer
      })
    })

    it('should use default MIME type for unknown extensions', async () => {
      const { registerMediaProtocolWithBuffer } = require('../../src/main/protocol')
      const mockBuffer = Buffer.from('fake data')
      ;(existsSync as jest.Mock).mockReturnValue(true)
      ;(readFile as jest.Mock).mockResolvedValue(mockBuffer)

      registerMediaProtocolWithBuffer()

      const handler = (protocol.registerBufferProtocol as jest.Mock).mock.calls[0][1]
      const callback = jest.fn()

      const request = { url: 'media:///Users/test/file.unknown' }
      await handler(request, callback)

      expect(callback).toHaveBeenCalledWith({
        mimeType: 'application/octet-stream',
        data: mockBuffer
      })
    })

    it('should return error for non-existent files', async () => {
      const { registerMediaProtocolWithBuffer } = require('../../src/main/protocol')
      ;(existsSync as jest.Mock).mockReturnValue(false)

      registerMediaProtocolWithBuffer()

      const handler = (protocol.registerBufferProtocol as jest.Mock).mock.calls[0][1]
      const callback = jest.fn()

      const request = { url: 'media:///Users/test/nonexistent.jpg' }
      await handler(request, callback)

      expect(callback).toHaveBeenCalledWith({ error: -6 }) // FILE_NOT_FOUND
    })

    it('should handle read errors gracefully', async () => {
      const { registerMediaProtocolWithBuffer } = require('../../src/main/protocol')
      ;(existsSync as jest.Mock).mockReturnValue(true)
      ;(readFile as jest.Mock).mockRejectedValue(new Error('Read error'))

      registerMediaProtocolWithBuffer()

      const handler = (protocol.registerBufferProtocol as jest.Mock).mock.calls[0][1]
      const callback = jest.fn()

      const request = { url: 'media:///Users/test/image.jpg' }
      await handler(request, callback)

      expect(callback).toHaveBeenCalledWith({ error: -2 }) // FAILED
    })
  })
})
