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
  getBattlemapFiles
} from './fileOperations'

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
      const displayWindow = getDisplayWindow()
      if (displayWindow) {
        displayWindow.webContents.send('display-battlemap', battlemapData)
        console.log('Battlemap sent to display window')
        return { success: true }
      }
      return { success: false, error: 'Display window not available' }
    } catch (error: any) {
      console.error('Error displaying battlemap:', error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('hide-battlemap', async () => {
    try {
      const displayWindow = getDisplayWindow()
      if (displayWindow) {
        displayWindow.webContents.send('hide-battlemap')
        console.log('Battlemap hidden from display')
        return { success: true }
      }
      return { success: false, error: 'Display window not available' }
    } catch (error: any) {
      console.error('Error hiding battlemap:', error)
      return { success: false, error: error.message }
    }
  })
}
