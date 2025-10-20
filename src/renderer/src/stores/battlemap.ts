/**
 * Battlemap Store
 *
 * Manages tactical battlemap data including tokens, zoom, and movement
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Battlemap, BattlemapToken, BattlemapFileInfo, MovementRadius } from '../types'
import { useDirectoryStore } from './directory'

export const useBattlemapStore = defineStore('battlemap', () => {
  // State
  const currentBattlemap = ref<Battlemap | null>(null)
  const battlemapFiles = ref<BattlemapFileInfo[]>([])
  const isDisplayed = ref(false)
  const isSaving = ref(false)
  const isLoading = ref(false)
  const lastError = ref<string | null>(null)

  // Getters
  const hasBattlemap = computed(() => currentBattlemap.value !== null)
  const tokens = computed(() => currentBattlemap.value?.tokens || {})
  const tokenCount = computed(() => Object.keys(tokens.value).length)
  const gridWidth = computed(() => currentBattlemap.value?.gridWidth || 0)
  const gridHeight = computed(() => currentBattlemap.value?.gridHeight || 0)
  const backgroundImage = computed(() => currentBattlemap.value?.backgroundImage || '')
  const movementRadius = computed(() => currentBattlemap.value?.movementRadius)
  const zoom = computed(() => currentBattlemap.value?.zoom)

  // Actions

  /**
   * Initialize battlemap store by loading available battlemaps
   */
  async function initialize(): Promise<void> {
    const directoryStore = useDirectoryStore()
    if (!directoryStore.currentDirectory) {
      return
    }

    await Promise.all([refreshBattlemapList(), loadBattlemap()])
  }

  /**
   * Create a new battlemap
   */
  function createBattlemap(
    gridWidth: number,
    gridHeight: number,
    backgroundImage: string,
    name?: string
  ): void {
    currentBattlemap.value = {
      gridWidth,
      gridHeight,
      backgroundImage,
      tokens: {},
      name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  }

  /**
   * Add or update a token on the battlemap
   */
  function setToken(x: number, y: number, token: BattlemapToken): void {
    if (!currentBattlemap.value) {
      return
    }

    const key = `${x}-${y}`
    currentBattlemap.value.tokens[key] = token
    currentBattlemap.value.updatedAt = new Date().toISOString()
  }

  /**
   * Remove a token from the battlemap
   */
  function removeToken(x: number, y: number): void {
    if (!currentBattlemap.value) {
      return
    }

    const key = `${x}-${y}`
    delete currentBattlemap.value.tokens[key]
    currentBattlemap.value.updatedAt = new Date().toISOString()
  }

  /**
   * Move a token from one position to another
   */
  function moveToken(fromX: number, fromY: number, toX: number, toY: number): void {
    if (!currentBattlemap.value) {
      return
    }

    const fromKey = `${fromX}-${fromY}`
    const toKey = `${toX}-${toY}`
    const token = currentBattlemap.value.tokens[fromKey]

    if (token) {
      // Update token coordinates
      token.x = toX
      token.y = toY

      // Move token to new position
      currentBattlemap.value.tokens[toKey] = token
      delete currentBattlemap.value.tokens[fromKey]

      currentBattlemap.value.updatedAt = new Date().toISOString()
    }
  }

  /**
   * Update token data
   */
  function updateToken(x: number, y: number, updates: Partial<BattlemapToken>): void {
    if (!currentBattlemap.value) {
      return
    }

    const key = `${x}-${y}`
    const token = currentBattlemap.value.tokens[key]

    if (token) {
      currentBattlemap.value.tokens[key] = {
        ...token,
        ...updates
      }
      currentBattlemap.value.updatedAt = new Date().toISOString()
    }
  }

  /**
   * Set movement radius for display
   */
  function setMovementRadius(radius: MovementRadius): void {
    if (!currentBattlemap.value) {
      return
    }

    currentBattlemap.value.movementRadius = radius
    currentBattlemap.value.updatedAt = new Date().toISOString()
  }

  /**
   * Clear movement radius
   */
  function clearMovementRadius(): void {
    if (!currentBattlemap.value) {
      return
    }

    currentBattlemap.value.movementRadius = undefined
    currentBattlemap.value.updatedAt = new Date().toISOString()
  }

  /**
   * Set zoom level and position
   */
  function setZoom(scale: number, centerX: number, centerY: number): void {
    if (!currentBattlemap.value) {
      return
    }

    currentBattlemap.value.zoom = {
      scale,
      centerX,
      centerY
    }
    currentBattlemap.value.updatedAt = new Date().toISOString()
  }

  /**
   * Reset zoom to default
   */
  function resetZoom(): void {
    if (!currentBattlemap.value) {
      return
    }

    currentBattlemap.value.zoom = undefined
    currentBattlemap.value.updatedAt = new Date().toISOString()
  }

  /**
   * Save battlemap to file
   */
  async function saveBattlemap(customFileName?: string): Promise<boolean> {
    const directoryStore = useDirectoryStore()
    if (!directoryStore.currentDirectory || !currentBattlemap.value) {
      lastError.value = 'No directory selected or no battlemap to save'
      return false
    }

    isSaving.value = true
    lastError.value = null

    try {
      const fileName = customFileName || 'default_battlemap.json'
      currentBattlemap.value.updatedAt = new Date().toISOString()

      const result = await window.electronAPI.saveBattlemapData(
        directoryStore.currentDirectory,
        currentBattlemap.value,
        fileName
      )

      if (result.success) {
        await refreshBattlemapList()
      }

      return result.success
    } catch (error) {
      console.error('Failed to save battlemap:', error)
      lastError.value = error instanceof Error ? error.message : 'Unknown error'
      return false
    } finally {
      isSaving.value = false
    }
  }

  /**
   * Load battlemap from file or directory
   */
  async function loadBattlemap(pathToLoad?: string): Promise<boolean> {
    const directoryStore = useDirectoryStore()
    const loadPath = pathToLoad || directoryStore.currentDirectory

    if (!loadPath) {
      lastError.value = 'No path provided'
      return false
    }

    isLoading.value = true
    lastError.value = null

    try {
      const loadedBattlemap = await window.electronAPI.loadBattlemapData(loadPath)

      if (loadedBattlemap) {
        currentBattlemap.value = loadedBattlemap
        return true
      } else {
        // No saved battlemap
        return false
      }
    } catch (error) {
      console.error('Failed to load battlemap:', error)
      lastError.value = error instanceof Error ? error.message : 'Unknown error'
      return false
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Refresh list of battlemap files in current directory
   */
  async function refreshBattlemapList(): Promise<void> {
    const directoryStore = useDirectoryStore()
    if (!directoryStore.currentDirectory) {
      battlemapFiles.value = []
      return
    }

    try {
      battlemapFiles.value = await window.electronAPI.getBattlemapFiles(
        directoryStore.currentDirectory
      )
    } catch (error) {
      console.error('Failed to refresh battlemap list:', error)
      battlemapFiles.value = []
    }
  }

  /**
   * Display battlemap on the display window
   */
  async function displayBattlemap(): Promise<boolean> {
    if (!currentBattlemap.value) {
      lastError.value = 'No battlemap to display'
      return false
    }

    try {
      const result = await window.electronAPI.displayBattlemap(currentBattlemap.value)

      if (result.success) {
        isDisplayed.value = true
      } else {
        lastError.value = result.error || 'Failed to display battlemap'
      }

      return result.success
    } catch (error) {
      console.error('Failed to display battlemap:', error)
      lastError.value = error instanceof Error ? error.message : 'Unknown error'
      return false
    }
  }

  /**
   * Hide battlemap from display window
   */
  async function hideBattlemap(): Promise<boolean> {
    try {
      const result = await window.electronAPI.hideBattlemap()

      if (result.success) {
        isDisplayed.value = false
      } else {
        lastError.value = result.error || 'Failed to hide battlemap'
      }

      return result.success
    } catch (error) {
      console.error('Failed to hide battlemap:', error)
      lastError.value = error instanceof Error ? error.message : 'Unknown error'
      return false
    }
  }

  /**
   * Clear current battlemap
   */
  function clearBattlemap(): void {
    currentBattlemap.value = null
    isDisplayed.value = false
  }

  return {
    // State
    currentBattlemap,
    battlemapFiles,
    isDisplayed,
    isSaving,
    isLoading,
    lastError,

    // Getters
    hasBattlemap,
    tokens,
    tokenCount,
    gridWidth,
    gridHeight,
    backgroundImage,
    movementRadius,
    zoom,

    // Actions
    initialize,
    createBattlemap,
    setToken,
    removeToken,
    moveToken,
    updateToken,
    setMovementRadius,
    clearMovementRadius,
    setZoom,
    resetZoom,
    saveBattlemap,
    loadBattlemap,
    refreshBattlemapList,
    displayBattlemap,
    hideBattlemap,
    clearBattlemap
  }
})
