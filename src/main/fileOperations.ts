/**
 * File Operations Module
 *
 * Handles file system operations including directory scanning,
 * data persistence, and caching
 */

import { app } from 'electron'
import { promises as fs } from 'fs'
import { join, basename, extname } from 'path'
import type {
  MediaFile,
  MediaType,
  MediaSubtype,
  PartyData,
  Encounter,
  EncounterFileInfo,
  InitiativeData,
  Battlemap,
  BattlemapFileInfo
} from '../renderer/src/types'

// Lazy initialization for user data paths
let userDataPath: string | null = null
let settingsPath: string | null = null
let cachedDirectory: string | null = null

/**
 * Initialize paths for user data
 */
function initializePaths(): void {
  if (!userDataPath) {
    userDataPath = app.getPath('userData')
    settingsPath = join(userDataPath, 'settings.json')
  }
}

/**
 * Check if a directory exists
 */
export async function directoryExists(dirPath: string): Promise<boolean> {
  try {
    const stats = await fs.stat(dirPath)
    return stats.isDirectory()
  } catch {
    return false
  }
}

/**
 * Load cached directory from settings
 */
export async function loadCachedDirectory(): Promise<string | null> {
  try {
    initializePaths()
    const settingsData = await fs.readFile(settingsPath!, 'utf8')
    const settings = JSON.parse(settingsData)
    if (settings.lastDirectory && (await directoryExists(settings.lastDirectory))) {
      cachedDirectory = settings.lastDirectory
      return cachedDirectory
    }
  } catch (error) {
    console.log('No cached directory found or invalid settings file')
  }
  return null
}

/**
 * Save directory to cache
 */
export async function saveCachedDirectory(directory: string): Promise<void> {
  try {
    initializePaths()
    cachedDirectory = directory
    const settings = { lastDirectory: directory }
    await fs.writeFile(settingsPath!, JSON.stringify(settings, null, 2))
  } catch (error) {
    console.error('Error saving directory to cache:', error)
  }
}

/**
 * Get cached directory
 */
export function getCachedDirectory(): string | null {
  return cachedDirectory
}

/**
 * Scan directory and return media file tree
 */
export async function scanDirectory(directoryPath: string): Promise<MediaFile> {
  const mediaExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.mp4', '.webm', '.mp3', '.wav', '.ogg']

  async function scanDir(dirPath: string): Promise<MediaFile> {
    const items = await fs.readdir(dirPath, { withFileTypes: true })
    const result: MediaFile = {
      name: basename(dirPath),
      path: dirPath,
      type: 'folder',
      mediaType: 'other',
      mediaSubtype: 'default',
      displayName: basename(dirPath),
      children: []
    }

    for (const item of items) {
      const itemPath = join(dirPath, item.name)

      if (item.isDirectory()) {
        const subDir = await scanDir(itemPath)
        result.children!.push(subDir)
      } else if (item.isFile()) {
        const ext = extname(item.name).toLowerCase()
        const fileName = basename(item.name, ext)

        // Determine media type and subtype
        let mediaType: MediaType = 'other'
        let mediaSubtype: MediaSubtype = 'default'

        if (mediaExtensions.includes(ext)) {
          if (['.jpg', '.jpeg', '.png', '.gif'].includes(ext)) {
            mediaType = 'image'
            mediaSubtype = fileName.toLowerCase().endsWith('_location') ? 'background' : 'portrait'
          } else if (['.mp4', '.webm'].includes(ext)) {
            mediaType = 'video'
            mediaSubtype = fileName.toLowerCase().endsWith('_location') ? 'background' : 'event'
          } else if (['.mp3', '.wav', '.ogg'].includes(ext)) {
            mediaType = 'audio'
            if (fileName.toLowerCase().endsWith('_loop')) {
              mediaSubtype = 'loop'
            } else if (fileName.toLowerCase().endsWith('_music')) {
              mediaSubtype = 'music'
            } else {
              mediaSubtype = 'sound'
            }
          }
        }

        result.children!.push({
          name: item.name,
          path: itemPath,
          type: 'file',
          mediaType,
          mediaSubtype,
          displayName: fileName.startsWith('_')
            ? '???'
            : fileName.replace(/_location$|_loop$|_music$/, '')
        })
      }
    }

    return result
  }

  return await scanDir(directoryPath)
}

/**
 * Save party data to file
 */
export async function savePartyData(filePath: string, partyData: PartyData): Promise<boolean> {
  try {
    await fs.writeFile(filePath, JSON.stringify(partyData, null, 2))
    return true
  } catch (error) {
    console.error('Error saving party data:', error)
    throw error
  }
}

/**
 * Load party data from file
 */
export async function loadPartyData(filePath: string): Promise<PartyData | null> {
  try {
    const data = await fs.readFile(filePath, 'utf8')
    return JSON.parse(data)
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return null
    }
    console.error('Error loading party data:', error)
    throw error
  }
}

/**
 * Save encounter data to file
 */
export async function saveEncounterData(
  filePath: string,
  encounterData: Encounter
): Promise<boolean> {
  try {
    await fs.writeFile(filePath, JSON.stringify(encounterData, null, 2))
    return true
  } catch (error) {
    console.error('Error saving encounter data:', error)
    throw error
  }
}

/**
 * Load encounter data from file
 */
export async function loadEncounterData(filePath: string): Promise<Encounter | null> {
  try {
    const data = await fs.readFile(filePath, 'utf8')
    return JSON.parse(data)
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return null
    }
    console.error('Error loading encounter data:', error)
    throw error
  }
}

/**
 * Get list of encounter files in directory
 */
export async function getEncounterFiles(directoryPath: string): Promise<EncounterFileInfo[]> {
  try {
    const items = await fs.readdir(directoryPath, { withFileTypes: true })
    const encounterFiles: EncounterFileInfo[] = []

    for (const item of items) {
      if (item.isFile() && item.name.endsWith('_encounter.json')) {
        const filePath = join(directoryPath, item.name)
        try {
          const fileContent = await fs.readFile(filePath, 'utf8')
          const encounterData = JSON.parse(fileContent)

          if (encounterData.name !== undefined && Array.isArray(encounterData.enemies)) {
            const stats = await fs.stat(filePath)
            encounterFiles.push({
              filename: item.name,
              path: filePath,
              name: encounterData.name,
              enemyCount: encounterData.enemies.length,
              lastModified: stats.mtime
            })
          }
        } catch (error) {
          console.log(`Skipping invalid encounter file: ${item.name}`)
        }
      }
    }

    encounterFiles.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime())
    return encounterFiles
  } catch (error) {
    console.error('Error getting encounter files:', error)
    return []
  }
}

/**
 * Save initiative data
 */
export async function saveInitiativeData(
  directoryPath: string,
  initiativeData: InitiativeData
): Promise<{ success: boolean; error?: string }> {
  try {
    const filePath = join(directoryPath, 'initiative.json')
    await fs.writeFile(filePath, JSON.stringify(initiativeData, null, 2))
    console.log('Initiative data saved to:', filePath)
    return { success: true }
  } catch (error: any) {
    console.error('Error saving initiative data:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Load initiative data
 */
export async function loadInitiativeData(directoryPath: string): Promise<InitiativeData | null> {
  try {
    const filePath = join(directoryPath, 'initiative.json')
    const data = await fs.readFile(filePath, 'utf8')
    return JSON.parse(data)
  } catch (error) {
    console.error('Error loading initiative data:', error)
    return null
  }
}

/**
 * Save battlemap data
 */
export async function saveBattlemapData(
  directoryPath: string,
  battlemapData: Battlemap,
  fileName?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const defaultFileName = 'default_battlemap.json'
    const actualFileName = fileName || defaultFileName
    const filePath = join(directoryPath, actualFileName)
    await fs.writeFile(filePath, JSON.stringify(battlemapData, null, 2))
    console.log('Battlemap data saved to:', filePath)
    return { success: true }
  } catch (error: any) {
    console.error('Error saving battlemap data:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Load battlemap data
 */
export async function loadBattlemapData(pathToLoad: string): Promise<Battlemap | null> {
  try {
    let filePath: string

    if (pathToLoad.endsWith('.json')) {
      filePath = pathToLoad
      console.log('Loading specific battlemap file:', filePath)
    } else {
      filePath = join(pathToLoad, 'battlemap.json')
      console.log('Trying legacy battlemap file:', filePath)

      try {
        await fs.access(filePath)
        console.log('Legacy file found')
      } catch {
        filePath = join(pathToLoad, 'default_battlemap.json')
        console.log('Legacy file not found, trying default:', filePath)
      }
    }

    const data = await fs.readFile(filePath, 'utf8')
    console.log('Battlemap data loaded successfully')
    return JSON.parse(data)
  } catch (error) {
    console.error('Error loading battlemap data:', error)
    return null
  }
}

/**
 * Get list of battlemap files in directory
 */
export async function getBattlemapFiles(directoryPath: string): Promise<BattlemapFileInfo[]> {
  try {
    const items = await fs.readdir(directoryPath, { withFileTypes: true })
    const battlemapFiles: BattlemapFileInfo[] = []

    for (const item of items) {
      if (item.isFile() && item.name.endsWith('_battlemap.json')) {
        const filePath = join(directoryPath, item.name)
        try {
          const fileContent = await fs.readFile(filePath, 'utf8')
          const battlemapData = JSON.parse(fileContent)

          if (
            battlemapData.gridWidth !== undefined &&
            battlemapData.gridHeight !== undefined
          ) {
            const tokenCount = battlemapData.tokens ? Object.keys(battlemapData.tokens).length : 0
            const stats = await fs.stat(filePath)

            battlemapFiles.push({
              filename: item.name,
              path: filePath,
              name: item.name.replace('_battlemap.json', ''),
              gridWidth: battlemapData.gridWidth,
              gridHeight: battlemapData.gridHeight,
              backgroundImage: battlemapData.backgroundImage,
              tokenCount,
              lastModified: stats.mtime
            })
          }
        } catch (error) {
          console.log(`Skipping invalid battlemap file: ${item.name}`)
        }
      }
    }

    battlemapFiles.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime())
    return battlemapFiles
  } catch (error) {
    console.error('Error getting battlemap files:', error)
    return []
  }
}

/**
 * Save pin board to JSON file
 */
export async function savePinBoard(
  directoryPath: string,
  boardName: string,
  pins: any[]
): Promise<boolean> {
  try {
    // Sanitize board name
    const sanitizedName = boardName.replace(/[^a-z0-9_-]/gi, '_')
    const fileName = `pinboard_${sanitizedName}.json`
    const filePath = join(directoryPath, fileName)

    const data = {
      name: boardName,
      pins,
      savedAt: new Date().toISOString()
    }

    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8')
    console.log(`Pin board saved: ${filePath}`)
    return true
  } catch (error) {
    console.error('Error saving pin board:', error)
    return false
  }
}

/**
 * Load pin board from JSON file
 */
export async function loadPinBoard(
  directoryPath: string,
  boardName: string
): Promise<any[] | null> {
  try {
    // Sanitize board name
    const sanitizedName = boardName.replace(/[^a-z0-9_-]/gi, '_')
    const fileName = `pinboard_${sanitizedName}.json`
    const filePath = join(directoryPath, fileName)

    const content = await fs.readFile(filePath, 'utf-8')
    const data = JSON.parse(content)
    return data.pins || []
  } catch (error) {
    console.error('Error loading pin board:', error)
    return null
  }
}

/**
 * Get list of available pin boards in directory
 */
export async function getAvailablePinBoards(directoryPath: string): Promise<string[]> {
  try {
    const files = await fs.readdir(directoryPath)
    const pinBoards: string[] = []

    for (const file of files) {
      if (file.startsWith('pinboard_') && file.endsWith('.json')) {
        try {
          const filePath = join(directoryPath, file)
          const content = await fs.readFile(filePath, 'utf-8')
          const data = JSON.parse(content)
          if (data.name) {
            pinBoards.push(data.name)
          }
        } catch (error) {
          console.log(`Skipping invalid pin board file: ${file}`)
        }
      }
    }

    return pinBoards.sort()
  } catch (error) {
    console.error('Error getting pin boards:', error)
    return []
  }
}
