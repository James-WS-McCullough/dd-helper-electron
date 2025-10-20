/**
 * Preload Script
 *
 * Exposes safe IPC communication methods to the renderer process
 * Uses contextBridge to maintain security with context isolation
 */

import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron'
import type { ElectronAPI } from '../renderer/src/types/electron'

// Implementation of the ElectronAPI interface
const electronAPI: ElectronAPI = {
  // ============================================
  // DIRECTORY MANAGEMENT
  // ============================================

  selectDirectory: () => ipcRenderer.invoke('select-directory'),

  getCachedDirectory: () => ipcRenderer.invoke('get-cached-directory'),

  scanDirectory: (directoryPath: string) =>
    ipcRenderer.invoke('scan-directory', directoryPath),

  // ============================================
  // WINDOW MANAGEMENT
  // ============================================

  openDisplayWindow: () => ipcRenderer.invoke('open-display-window'),

  loadDashboard: () => ipcRenderer.invoke('load-dashboard'),

  // ============================================
  // DISPLAY MEDIA CONTROL
  // ============================================

  displayMedia: (
    mediaPath: string,
    mediaType: string,
    mediaSubtype: string,
    displayName: string
  ) => ipcRenderer.invoke('display-media', mediaPath, mediaType, mediaSubtype, displayName),

  clearDisplayElement: (elementType: string, elementPath?: string) =>
    ipcRenderer.invoke('clear-display-element', elementType, elementPath),

  getDisplayState: () => ipcRenderer.invoke('get-display-state'),

  // ============================================
  // PARTY DATA MANAGEMENT
  // ============================================

  savePartyData: (filePath: string, partyData) =>
    ipcRenderer.invoke('save-party-data', filePath, partyData),

  loadPartyData: (filePath: string) => ipcRenderer.invoke('load-party-data', filePath),

  // ============================================
  // ENCOUNTER MANAGEMENT
  // ============================================

  saveEncounterData: (filePath: string, encounterData) =>
    ipcRenderer.invoke('save-encounter-data', filePath, encounterData),

  loadEncounterData: (filePath: string) => ipcRenderer.invoke('load-encounter-data', filePath),

  selectEncounterFile: (directoryPath: string) =>
    ipcRenderer.invoke('select-encounter-file', directoryPath),

  getEncounterFiles: (directoryPath: string) =>
    ipcRenderer.invoke('get-encounter-files', directoryPath),

  // ============================================
  // INITIATIVE TRACKING
  // ============================================

  saveInitiativeData: (directoryPath: string, initiativeData) =>
    ipcRenderer.invoke('save-initiative-data', directoryPath, initiativeData),

  loadInitiativeData: (directoryPath: string) =>
    ipcRenderer.invoke('load-initiative-data', directoryPath),

  // ============================================
  // BATTLEMAP MANAGEMENT
  // ============================================

  saveBattlemapData: (directoryPath: string, battlemapData, fileName?) =>
    ipcRenderer.invoke('save-battlemap-data', directoryPath, battlemapData, fileName),

  loadBattlemapData: (pathToLoad: string) =>
    ipcRenderer.invoke('load-battlemap-data', pathToLoad),

  getBattlemapFiles: (directoryPath: string) =>
    ipcRenderer.invoke('get-battlemap-files', directoryPath),

  displayBattlemap: (battlemapData) => ipcRenderer.invoke('display-battlemap', battlemapData),

  hideBattlemap: () => ipcRenderer.invoke('hide-battlemap'),

  // ============================================
  // EVENT LISTENERS
  // ============================================

  onUpdateDisplay: (callback: (event: IpcRendererEvent, state: any) => void) => {
    ipcRenderer.on('update-display', callback)
  },

  onDisplayStateUpdated: (callback: (event: IpcRendererEvent, state: any) => void) => {
    ipcRenderer.on('display-state-updated', callback)
  },

  onDisplayBattlemap: (callback: (event: IpcRendererEvent, data: any) => void) => {
    ipcRenderer.on('display-battlemap', callback)
  },

  onHideBattlemap: (callback: (event: IpcRendererEvent) => void) => {
    ipcRenderer.on('hide-battlemap', callback)
  },

  removeDisplayListeners: () => {
    ipcRenderer.removeAllListeners('update-display')
    ipcRenderer.removeAllListeners('display-state-updated')
    ipcRenderer.removeAllListeners('display-battlemap')
    ipcRenderer.removeAllListeners('hide-battlemap')
  }
}

// Use contextBridge to safely expose the API to the renderer process
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electronAPI', electronAPI)
  } catch (error) {
    console.error('Failed to expose electronAPI:', error)
  }
} else {
  // Fallback for when context isolation is disabled (not recommended)
  // @ts-ignore
  window.electronAPI = electronAPI
}
