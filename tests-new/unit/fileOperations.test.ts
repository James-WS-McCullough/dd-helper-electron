import { promises as fs } from 'fs'
import { app } from 'electron'

jest.mock('fs')
jest.mock('electron')

// Import after mocks
import {
  directoryExists,
  scanDirectory,
  savePartyData,
  loadPartyData,
  saveBattlemapData,
  loadBattlemapData
} from '../../src/main/fileOperations'

describe('File Operations', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(app.getPath as jest.Mock).mockReturnValue('/test/user/data')
  })

  describe('directoryExists', () => {
    it('should return true for existing directory', async () => {
      (fs.stat as jest.Mock).mockResolvedValue({
        isDirectory: () => true
      })

      const result = await directoryExists('/test/path')
      expect(result).toBe(true)
    })

    it('should return false for non-existent path', async () => {
      (fs.stat as jest.Mock).mockRejectedValue(new Error('ENOENT'))

      const result = await directoryExists('/nonexistent')
      expect(result).toBe(false)
    })

    it('should return false for files (not directories)', async () => {
      (fs.stat as jest.Mock).mockResolvedValue({
        isDirectory: () => false
      })

      const result = await directoryExists('/test/file.txt')
      expect(result).toBe(false)
    })
  })

  describe('scanDirectory', () => {
    it('should scan and categorize media files', async () => {
      (fs.readdir as jest.Mock).mockResolvedValue([
        {
          name: 'portrait.jpg',
          isDirectory: () => false,
          isFile: () => true
        },
        {
          name: 'background_location.png',
          isDirectory: () => false,
          isFile: () => true
        },
        {
          name: 'music_loop.mp3',
          isDirectory: () => false,
          isFile: () => true
        },
        {
          name: 'subfolder',
          isDirectory: () => true,
          isFile: () => false
        }
      ])

      // Mock subdirectory scan
      ;(fs.readdir as jest.Mock).mockResolvedValueOnce([
        {
          name: 'portrait.jpg',
          isDirectory: () => false,
          isFile: () => true
        },
        {
          name: 'background_location.png',
          isDirectory: () => false,
          isFile: () => true
        },
        {
          name: 'music_loop.mp3',
          isDirectory: () => false,
          isFile: () => true
        },
        {
          name: 'subfolder',
          isDirectory: () => true,
          isFile: () => false
        }
      ]).mockResolvedValueOnce([])

      const result = await scanDirectory('/test/media')

      expect(result).toHaveProperty('type', 'folder')
      expect(result).toHaveProperty('children')
      expect(result.children).toHaveLength(4)

      const portrait = result.children?.find((c) => c.name === 'portrait.jpg')
      expect(portrait).toHaveProperty('mediaType', 'image')
      expect(portrait).toHaveProperty('mediaSubtype', 'portrait')

      const background = result.children?.find((c) => c.name === 'background_location.png')
      expect(background).toHaveProperty('mediaSubtype', 'background')

      const music = result.children?.find((c) => c.name === 'music_loop.mp3')
      expect(music).toHaveProperty('mediaType', 'audio')
      expect(music).toHaveProperty('mediaSubtype', 'loop')
    })

    it('should hide files starting with underscore', async () => {
      (fs.readdir as jest.Mock).mockResolvedValue([
        {
          name: '_hidden.jpg',
          isDirectory: () => false,
          isFile: () => true
        }
      ])

      const result = await scanDirectory('/test/media')

      const hiddenFile = result.children?.find((c) => c.name === '_hidden.jpg')
      expect(hiddenFile?.displayName).toBe('???')
    })
  })

  describe('Party Data Operations', () => {
    it('should save party data', async () => {
      (fs.writeFile as jest.Mock).mockResolvedValue(undefined)

      const partyData = {
        name: 'Test Party',
        members: [],
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01'
      }

      const result = await savePartyData('/test/party.json', partyData)

      expect(result).toBe(true)
      expect(fs.writeFile).toHaveBeenCalledWith(
        '/test/party.json',
        expect.stringContaining('Test Party')
      )
    })

    it('should load party data', async () => {
      const partyData = {
        name: 'Test Party',
        members: [],
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01'
      }

      ;(fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify(partyData))

      const result = await loadPartyData('/test/party.json')

      expect(result).toEqual(partyData)
    })

    it('should return null for non-existent party file', async () => {
      const error: any = new Error('File not found')
      error.code = 'ENOENT'
      ;(fs.readFile as jest.Mock).mockRejectedValue(error)

      const result = await loadPartyData('/test/nonexistent.json')

      expect(result).toBeNull()
    })
  })

  describe('Battlemap Data Operations', () => {
    it('should save battlemap with default filename', async () => {
      (fs.writeFile as jest.Mock).mockResolvedValue(undefined)

      const battlemapData = {
        gridWidth: 10,
        gridHeight: 10,
        backgroundImage: '/test/bg.jpg',
        tokens: {}
      }

      const result = await saveBattlemapData('/test/dir', battlemapData)

      expect(result.success).toBe(true)
      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('default_battlemap.json'),
        expect.any(String)
      )
    })

    it('should save battlemap with custom filename', async () => {
      (fs.writeFile as jest.Mock).mockResolvedValue(undefined)

      const battlemapData = {
        gridWidth: 10,
        gridHeight: 10,
        backgroundImage: '/test/bg.jpg',
        tokens: {}
      }

      const result = await saveBattlemapData('/test/dir', battlemapData, 'custom_battlemap.json')

      expect(result.success).toBe(true)
      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('custom_battlemap.json'),
        expect.any(String)
      )
    })

    it('should load battlemap from specific file', async () => {
      const battlemapData = {
        gridWidth: 10,
        gridHeight: 10,
        backgroundImage: '/test/bg.jpg',
        tokens: {}
      }

      ;(fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify(battlemapData))

      const result = await loadBattlemapData('/test/battlemap.json')

      expect(result).toEqual(battlemapData)
    })

    it('should try legacy filename when loading from directory', async () => {
      const battlemapData = {
        gridWidth: 10,
        gridHeight: 10,
        backgroundImage: '/test/bg.jpg',
        tokens: {}
      }

      ;(fs.access as jest.Mock).mockResolvedValue(undefined)
      ;(fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify(battlemapData))

      const result = await loadBattlemapData('/test/dir')

      expect(result).toEqual(battlemapData)
      expect(fs.access).toHaveBeenCalled()
    })

    it('should fallback to default filename if legacy not found', async () => {
      const battlemapData = {
        gridWidth: 10,
        gridHeight: 10,
        backgroundImage: '/test/bg.jpg',
        tokens: {}
      }

      ;(fs.access as jest.Mock).mockRejectedValue(new Error('Not found'))
      ;(fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify(battlemapData))

      const result = await loadBattlemapData('/test/dir')

      expect(result).toEqual(battlemapData)
    })
  })
})
