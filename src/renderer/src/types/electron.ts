/**
 * Electron API Types
 *
 * Complete type definitions for the IPC communication bridge
 */

import type { MediaFile } from './media'
import type { DisplayState } from './display'
import type { PartyData } from './party'
import type { Encounter, EncounterFileInfo } from './encounter'
import type { InitiativeData } from './initiative'
import type { Battlemap, BattlemapFileInfo } from './battlemap'

export interface ElectronAPI {
  // ============================================
  // DIRECTORY MANAGEMENT
  // ============================================

  /**
   * Open native directory selection dialog
   * @returns Selected directory path or null if canceled
   */
  selectDirectory: () => Promise<string | null>

  /**
   * Get the cached directory from previous session
   * @returns Cached directory path or null
   */
  getCachedDirectory: () => Promise<string | null>

  /**
   * Scan directory and return media file tree
   * @param directoryPath - Path to scan
   * @returns Media file tree structure
   */
  scanDirectory: (directoryPath: string) => Promise<MediaFile>

  // ============================================
  // WINDOW MANAGEMENT
  // ============================================

  /**
   * Open the display window
   * @returns Success status
   */
  openDisplayWindow: () => Promise<boolean>

  /**
   * Load the dashboard in main window
   * @returns Success status
   */
  loadDashboard: () => Promise<boolean>

  // ============================================
  // DISPLAY MEDIA CONTROL
  // ============================================

  /**
   * Display media on the display window
   * @param mediaPath - Path to media file
   * @param mediaType - Type of media (image, video, audio)
   * @param mediaSubtype - Subtype (portrait, background, event, etc.)
   * @param displayName - Display name for the media
   * @returns Success status
   */
  displayMedia: (
    mediaPath: string,
    mediaType: string,
    mediaSubtype: string,
    displayName: string
  ) => Promise<boolean>

  /**
   * Clear specific display element or all content
   * @param elementType - Type of element to clear
   * @param elementPath - Optional path for specific element
   * @returns Success status
   */
  clearDisplayElement: (
    elementType: string,
    elementPath?: string
  ) => Promise<boolean>

  /**
   * Get current display state
   * @returns Current display state
   */
  getDisplayState: () => Promise<DisplayState>

  /**
   * Set the focused portrait
   * @param portraitPath - Path to portrait to focus, or null to clear focus
   * @returns Success status
   */
  setFocusedPortrait: (portraitPath: string | null) => Promise<boolean>

  // ============================================
  // PARTY DATA MANAGEMENT
  // ============================================

  /**
   * Save party data to file
   * @param filePath - Path to save file
   * @param partyData - Party data to save
   * @returns Success status
   */
  savePartyData: (filePath: string, partyData: PartyData) => Promise<boolean>

  /**
   * Load party data from file
   * @param filePath - Path to load from
   * @returns Party data or null
   */
  loadPartyData: (filePath: string) => Promise<PartyData | null>

  // ============================================
  // ENCOUNTER MANAGEMENT
  // ============================================

  /**
   * Save encounter data to file
   * @param filePath - Path to save file
   * @param encounterData - Encounter data to save
   * @returns Success status
   */
  saveEncounterData: (
    filePath: string,
    encounterData: Encounter
  ) => Promise<boolean>

  /**
   * Load encounter data from file
   * @param filePath - Path to load from
   * @returns Encounter data or null
   */
  loadEncounterData: (filePath: string) => Promise<Encounter | null>

  /**
   * Open file dialog to select encounter file
   * @param directoryPath - Directory to start in
   * @returns Selected file path or null
   */
  selectEncounterFile: (directoryPath: string) => Promise<string | null>

  /**
   * Get list of encounter files in directory
   * @param directoryPath - Directory to scan
   * @returns List of encounter files
   */
  getEncounterFiles: (directoryPath: string) => Promise<EncounterFileInfo[]>

  // ============================================
  // INITIATIVE TRACKING
  // ============================================

  /**
   * Save initiative data
   * @param directoryPath - Directory to save in
   * @param initiativeData - Initiative data to save
   * @returns Operation result
   */
  saveInitiativeData: (
    directoryPath: string,
    initiativeData: InitiativeData
  ) => Promise<{ success: boolean; error?: string }>

  /**
   * Load initiative data
   * @param directoryPath - Directory to load from
   * @returns Initiative data or null
   */
  loadInitiativeData: (directoryPath: string) => Promise<InitiativeData | null>

  // ============================================
  // BATTLEMAP MANAGEMENT
  // ============================================

  /**
   * Save battlemap data
   * @param directoryPath - Directory to save in
   * @param battlemapData - Battlemap data to save
   * @param fileName - Optional custom filename
   * @returns Operation result
   */
  saveBattlemapData: (
    directoryPath: string,
    battlemapData: Battlemap,
    fileName?: string
  ) => Promise<{ success: boolean; error?: string }>

  /**
   * Load battlemap data
   * @param pathToLoad - File path or directory path
   * @returns Battlemap data or null
   */
  loadBattlemapData: (pathToLoad: string) => Promise<Battlemap | null>

  /**
   * Get list of battlemap files in directory
   * @param directoryPath - Directory to scan
   * @returns List of battlemap files
   */
  getBattlemapFiles: (directoryPath: string) => Promise<BattlemapFileInfo[]>

  /**
   * Display battlemap on display window
   * @param battlemapData - Battlemap to display
   * @returns Operation result
   */
  displayBattlemap: (
    battlemapData: Battlemap
  ) => Promise<{ success: boolean; error?: string }>

  /**
   * Hide battlemap from display
   * @returns Operation result
   */
  hideBattlemap: () => Promise<{ success: boolean; error?: string }>

  // ============================================
  // EVENT LISTENERS
  // ============================================

  /**
   * Listen for display state updates
   * @param callback - Callback function
   */
  onUpdateDisplay: (callback: (event: any, state: DisplayState) => void) => void

  /**
   * Listen for display state updates (alternative channel)
   * @param callback - Callback function
   */
  onDisplayStateUpdated: (callback: (event: any, state: DisplayState) => void) => void

  /**
   * Listen for battlemap display events
   * @param callback - Callback function
   */
  onDisplayBattlemap: (callback: (event: any, data: Battlemap) => void) => void

  /**
   * Listen for battlemap hide events
   * @param callback - Callback function
   */
  onHideBattlemap: (callback: (event: any) => void) => void

  /**
   * Remove all display listeners
   */
  removeDisplayListeners: () => void
}

// Extend Window interface globally
declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
