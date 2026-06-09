/**
 * IPC Handlers Module
 *
 * Registers all IPC communication handlers for the main process
 */

import { ipcMain, dialog } from 'electron'
import { homedir } from 'os'
import type { DisplayState, Battlemap, MediaType, MediaSubtype, MediaItem } from '../renderer/src/types'
import { getMainWindow, getDisplayWindow, hasDisplayWindow, openDisplayWindow } from './windows'
import {
  scanDirectory,
  getCachedDirectory,
  saveCachedDirectory,
  savePartyData,
  loadPartyData,
  saveEncounterData,
  loadEncounterData,
  getEncounterFiles,
  saveInitiativeData,
  loadInitiativeData,
  saveBattlemapData,
  loadBattlemapData,
  getBattlemapFiles,
  savePinBoard,
  loadPinBoard,
  getAvailablePinBoards,
  loadNotes,
  saveNote,
  deleteNote,
  saveCharacterStats,
  loadCharacterStats,
  deleteCharacterStats,
  getCharacterStatsFiles,
  getCharacterByPortrait
} from './fileOperations'
import type { CharacterStats } from '../renderer/src/types'

// Display state management
let displayState: DisplayState = {
  portraits: [],
  focusedPortraitPath: null,
  background: null,
  event: null,
  backgroundSounds: [],
  backgroundMusic: null,
  soundEffects: []
}

// Currently displayed battlemap (null = none). Persisted here so a display
// window that opens or reloads after "Show on Display" can fetch it on mount.
let currentBattlemap: Battlemap | null = null

/**
 * Register all IPC handlers
 */
export function registerIpcHandlers(): void {
  // ============================================
  // DIRECTORY MANAGEMENT
  // ============================================

  ipcMain.handle('select-directory', async () => {
    const mainWindow = getMainWindow()
    if (!mainWindow) return null

    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory'],
      defaultPath: getCachedDirectory() || homedir()
    })

    if (!result.canceled && result.filePaths.length > 0) {
      const selectedPath = result.filePaths[0]
      await saveCachedDirectory(selectedPath)
      return selectedPath
    }
    return null
  })

  ipcMain.handle('get-cached-directory', async () => {
    return getCachedDirectory()
  })

  ipcMain.handle('scan-directory', async (_event, directoryPath: string) => {
    try {
      return await scanDirectory(directoryPath)
    } catch (error) {
      console.error('Error scanning directory:', error)
      throw error
    }
  })

  // ============================================
  // WINDOW MANAGEMENT
  // ============================================

  ipcMain.handle('open-display-window', () => {
    return openDisplayWindow()
  })

  ipcMain.handle('load-dashboard', () => {
    const mainWindow = getMainWindow()
    if (mainWindow) {
      // TODO: Implement dashboard navigation once Vue router is set up
      // For now, just return true
      return true
    }
    return false
  })

  // ============================================
  // DISPLAY MEDIA CONTROL
  // ============================================

  ipcMain.handle(
    'display-media',
    (_event, mediaPath: string, mediaType: string, mediaSubtype: string, displayName: string) => {
      const displayWindow = getDisplayWindow()
      if (!hasDisplayWindow() || !displayWindow) {
        return false
      }

      const mediaData: MediaItem = {
        path: mediaPath,
        type: mediaType as MediaType,
        subtype: mediaSubtype as MediaSubtype,
        displayName: displayName
      }

      // Update display state based on media type
      if (mediaType === 'image' && mediaSubtype === 'portrait') {
        displayState.portraits = displayState.portraits.filter((p) => p.path !== mediaPath)
        displayState.portraits.push(mediaData)
        // Only set focus if there are no other portraits (first portrait)
        if (displayState.portraits.length === 1) {
          displayState.focusedPortraitPath = mediaPath
        }
      } else if (
        (mediaType === 'image' || mediaType === 'video') &&
        mediaSubtype === 'background'
      ) {
        displayState.background = mediaData
      } else if (mediaType === 'video' && mediaSubtype === 'event') {
        displayState.event = mediaData
      } else if (mediaType === 'audio' && mediaSubtype === 'sound') {
        displayState.soundEffects.push({ ...mediaData, id: Date.now() })
      } else if (mediaType === 'audio' && mediaSubtype === 'loop') {
        displayState.backgroundSounds.push({ ...mediaData, id: Date.now() })
      } else if (mediaType === 'audio' && mediaSubtype === 'music') {
        displayState.backgroundMusic = mediaData
      }

      displayWindow.webContents.send('update-display', displayState)

      const mainWindow = getMainWindow()
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('display-state-updated', displayState)
      }

      return true
    }
  )

  ipcMain.handle('clear-display-element', (_event, elementType: string, elementPath?: string) => {
    if (elementType === 'portraits') {
      if (elementPath) {
        displayState.portraits = displayState.portraits.filter((p) => p.path !== elementPath)
        // Clear focus if removing the focused portrait
        if (displayState.focusedPortraitPath === elementPath) {
          // Set focus to the first remaining portrait, or null if none
          displayState.focusedPortraitPath = displayState.portraits.length > 0 ? displayState.portraits[0].path : null
        }
      } else {
        displayState.portraits = []
        displayState.focusedPortraitPath = null
      }
    } else if (elementType === 'background') {
      displayState.background = null
    } else if (elementType === 'event') {
      displayState.event = null
    } else if (elementType === 'backgroundSound') {
      if (elementPath) {
        const idToRemove = parseInt(elementPath, 10)
        displayState.backgroundSounds = displayState.backgroundSounds.filter(
          (s) => s.id !== idToRemove
        )
      } else {
        displayState.backgroundSounds = []
      }
    } else if (elementType === 'backgroundMusic') {
      displayState.backgroundMusic = null
    } else if (elementType === 'soundEffect') {
      if (elementPath) {
        const idToRemove = parseInt(elementPath, 10)
        displayState.soundEffects = displayState.soundEffects.filter((s) => s.id !== idToRemove)
      } else {
        displayState.soundEffects = []
      }
    } else if (elementType === 'all') {
      displayState = {
        portraits: [],
        focusedPortraitPath: null,
        background: null,
        event: null,
        backgroundSounds: [],
        backgroundMusic: null,
        soundEffects: []
      }
    }

    const displayWindow = getDisplayWindow()
    if (hasDisplayWindow() && displayWindow) {
      displayWindow.webContents.send('update-display', displayState)
    }

    const mainWindow = getMainWindow()
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('display-state-updated', displayState)
    }

    return true
  })

  ipcMain.handle('get-display-state', () => {
    return displayState
  })

  ipcMain.handle('set-focused-portrait', (_event, portraitPath: string | null) => {
    // Verify the portrait exists if a path is provided
    if (portraitPath !== null) {
      const portraitExists = displayState.portraits.some((p) => p.path === portraitPath)
      if (!portraitExists) {
        console.warn(`Portrait with path ${portraitPath} not found in display state`)
        return false
      }
    }

    displayState.focusedPortraitPath = portraitPath

    const displayWindow = getDisplayWindow()
    if (hasDisplayWindow() && displayWindow) {
      displayWindow.webContents.send('update-display', displayState)
    }

    const mainWindow = getMainWindow()
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('display-state-updated', displayState)
    }

    return true
  })

  ipcMain.handle(
    'set-audio-volume',
    (
      _event,
      audioType: 'backgroundMusic' | 'backgroundSound',
      audioId: string | null,
      volume: number
    ) => {
      // Update volume in display state
      if (audioType === 'backgroundMusic' && displayState.backgroundMusic) {
        displayState.backgroundMusic.volume = volume
      } else if (audioType === 'backgroundSound' && audioId) {
        const sound = displayState.backgroundSounds.find((s) => String(s.id) === audioId)
        if (sound) {
          sound.volume = volume
        }
      }

      // Send update to display window to actually change the audio volume
      const displayWindow = getDisplayWindow()
      if (hasDisplayWindow() && displayWindow) {
        displayWindow.webContents.send('set-audio-volume', audioType, audioId, volume)
      }

      // Update main window with new state
      const mainWindow = getMainWindow()
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('display-state-updated', displayState)
      }

      return true
    }
  )

  // ============================================
  // PIN BOARD MANAGEMENT
  // ============================================

  ipcMain.handle('save-pin-board', async (_event, directoryPath: string, boardName: string, pins: any[]) => {
    return await savePinBoard(directoryPath, boardName, pins)
  })

  ipcMain.handle('load-pin-board', async (_event, directoryPath: string, boardName: string) => {
    return await loadPinBoard(directoryPath, boardName)
  })

  ipcMain.handle('get-available-pin-boards', async (_event, directoryPath: string) => {
    return await getAvailablePinBoards(directoryPath)
  })

  // ============================================
  // NOTES MANAGEMENT
  // ============================================

  ipcMain.handle('load-notes', async (_event, directoryPath: string) => {
    return await loadNotes(directoryPath)
  })

  ipcMain.handle('save-note', async (_event, directoryPath: string, note: any) => {
    return await saveNote(directoryPath, note)
  })

  ipcMain.handle('delete-note', async (_event, directoryPath: string, noteId: string) => {
    return await deleteNote(directoryPath, noteId)
  })

  // ============================================
  // PARTY DATA MANAGEMENT
  // ============================================

  ipcMain.handle('save-party-data', async (_event, filePath: string, partyData) => {
    return await savePartyData(filePath, partyData)
  })

  ipcMain.handle('load-party-data', async (_event, filePath: string) => {
    return await loadPartyData(filePath)
  })

  // ============================================
  // ENCOUNTER MANAGEMENT
  // ============================================

  ipcMain.handle('save-encounter-data', async (_event, filePath: string, encounterData) => {
    return await saveEncounterData(filePath, encounterData)
  })

  ipcMain.handle('load-encounter-data', async (_event, filePath: string) => {
    return await loadEncounterData(filePath)
  })

  ipcMain.handle('select-encounter-file', async (_event, directoryPath: string) => {
    const mainWindow = getMainWindow()
    if (!mainWindow) return null

    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      defaultPath: directoryPath,
      filters: [
        { name: 'Encounter Files', extensions: ['json'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    })

    if (!result.canceled && result.filePaths.length > 0) {
      return result.filePaths[0]
    }
    return null
  })

  ipcMain.handle('get-encounter-files', async (_event, directoryPath: string) => {
    return await getEncounterFiles(directoryPath)
  })

  // ============================================
  // INITIATIVE TRACKING
  // ============================================

  ipcMain.handle('save-initiative-data', async (_event, directoryPath: string, initiativeData) => {
    return await saveInitiativeData(directoryPath, initiativeData)
  })

  ipcMain.handle('load-initiative-data', async (_event, directoryPath: string) => {
    return await loadInitiativeData(directoryPath)
  })

  // ============================================
  // BATTLEMAP MANAGEMENT
  // ============================================

  ipcMain.handle(
    'save-battlemap-data',
    async (_event, directoryPath: string, battlemapData: Battlemap, fileName?: string) => {
      return await saveBattlemapData(directoryPath, battlemapData, fileName)
    }
  )

  ipcMain.handle('load-battlemap-data', async (_event, pathToLoad: string) => {
    return await loadBattlemapData(pathToLoad)
  })

  ipcMain.handle('get-battlemap-files', async (_event, directoryPath: string) => {
    return await getBattlemapFiles(directoryPath)
  })

  ipcMain.handle('display-battlemap', async (_event, battlemapData: Battlemap) => {
    try {
      // Persist so a display window that is opened/reloaded later can fetch it
      currentBattlemap = battlemapData

      // Open the display window if it isn't already; it will fetch the
      // battlemap via get-battlemap-state once it has loaded.
      if (!hasDisplayWindow()) {
        openDisplayWindow()
        return { success: true }
      }

      const displayWindow = getDisplayWindow()
      if (displayWindow) {
        displayWindow.webContents.send('display-battlemap', battlemapData)
      }
      return { success: true }
    } catch (error: any) {
      console.error('Error displaying battlemap:', error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('hide-battlemap', async () => {
    try {
      currentBattlemap = null
      const displayWindow = getDisplayWindow()
      if (hasDisplayWindow() && displayWindow) {
        displayWindow.webContents.send('hide-battlemap')
        console.log('Battlemap hidden from display')
      }
      return { success: true }
    } catch (error: any) {
      console.error('Error hiding battlemap:', error)
      return { success: false, error: error.message }
    }
  })

  // Lets a freshly opened/reloaded display window pick up the active battlemap
  ipcMain.handle('get-battlemap-state', () => {
    return currentBattlemap
  })

  // ============================================
  // CHARACTER STATS MANAGEMENT
  // ============================================

  ipcMain.handle(
    'save-character-stats',
    async (_event, directoryPath: string, stats: CharacterStats, fileName?: string) => {
      return await saveCharacterStats(directoryPath, stats, fileName)
    }
  )

  ipcMain.handle('load-character-stats', async (_event, filePath: string) => {
    return await loadCharacterStats(filePath)
  })

  ipcMain.handle('delete-character-stats', async (_event, filePath: string) => {
    return await deleteCharacterStats(filePath)
  })

  ipcMain.handle('get-character-stats-files', async (_event, directoryPath: string) => {
    return await getCharacterStatsFiles(directoryPath)
  })

  ipcMain.handle(
    'get-character-by-portrait',
    async (_event, directoryPath: string, portraitPath: string) => {
      return await getCharacterByPortrait(directoryPath, portraitPath)
    }
  )

  ipcMain.handle(
    'generate-character-stats',
    async (_event, description: string, characterType?: string) => {
      const apiKey = process.env.ANTHROPIC_API_KEY
      if (!apiKey) {
        return {
          success: false,
          error: 'ANTHROPIC_API_KEY environment variable not set'
        }
      }

      try {
        const systemPrompt = `You are a D&D 5e stat block generator. Generate complete stat blocks in JSON format.
Return ONLY valid JSON with no additional text or markdown formatting.

The JSON must match this TypeScript interface:
{
  "name": string,
  "type": string (e.g., "Medium humanoid (elf)"),
  "alignment": string (e.g., "Neutral Evil"),
  "challengeRating": string (e.g., "1/4", "5"),
  "abilityScores": {
    "strength": number,
    "dexterity": number,
    "constitution": number,
    "intelligence": number,
    "wisdom": number,
    "charisma": number
  },
  "armorClass": number,
  "acDescription": string (optional, e.g., "natural armor"),
  "maxHitPoints": number,
  "hitDice": string (e.g., "4d8+8"),
  "speed": { "walk": number, "fly": number (optional), "swim": number (optional) },
  "proficiencyBonus": number,
  "savingThrows": { [ability]: true } (optional),
  "skills": { [skill]: "proficient" | "expertise" } (optional),
  "damageVulnerabilities": string[] (optional),
  "damageResistances": string[] (optional),
  "damageImmunities": string[] (optional),
  "conditionImmunities": string[] (optional),
  "senses": { "darkvision": number, "passivePerception": number } (optional),
  "languages": string[],
  "abilities": [
    {
      "id": string (uuid),
      "name": string,
      "type": "action" | "bonus_action" | "reaction" | "trait" | "legendary",
      "description": string (include dice notation like "2d6+3 slashing damage"),
      "recharge": string (optional, e.g., "Recharge 5-6")
    }
  ],
  "tags": string[] (relevant tags like "undead", "boss", "spellcaster")
}`

        const userPrompt = characterType
          ? `Create a ${characterType} stat block for: ${description}`
          : `Create a D&D 5e stat block for: ${description}`

        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 4096,
            messages: [
              {
                role: 'user',
                content: userPrompt
              },
              {
                role: 'assistant',
                content: '{'
              }
            ],
            system: systemPrompt
          })
        })

        if (!response.ok) {
          const errorText = await response.text()
          console.error('Claude API error:', errorText)
          return {
            success: false,
            error: `API error: ${response.status} ${response.statusText}`
          }
        }

        const data = await response.json()
        const content = data.content?.[0]?.text

        if (!content) {
          return {
            success: false,
            error: 'No content in API response'
          }
        }

        // Parse the JSON response (prepend '{' from assistant prefill)
        const fullJson = '{' + content
        const lastBrace = fullJson.lastIndexOf('}')
        const jsonStr = lastBrace !== -1 ? fullJson.substring(0, lastBrace + 1) : fullJson

        let stats: any
        try {
          stats = JSON.parse(jsonStr)
        } catch (parseError) {
          console.error('Failed to parse Claude response as JSON:', jsonStr)
          return {
            success: false,
            error: 'Failed to parse generated stats as JSON'
          }
        }

        // Add required fields
        const { randomUUID } = await import('crypto')
        stats.id = randomUUID()
        stats.createdAt = new Date().toISOString()
        stats.updatedAt = new Date().toISOString()

        // Ensure abilities have IDs
        if (stats.abilities) {
          stats.abilities = stats.abilities.map((ability: any) => ({
            ...ability,
            id: ability.id || randomUUID()
          }))
        }

        return {
          success: true,
          stats
        }
      } catch (error: any) {
        console.error('Error generating character stats:', error)
        return {
          success: false,
          error: error.message
        }
      }
    }
  )
}
