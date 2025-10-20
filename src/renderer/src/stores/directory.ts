/**
 * Directory Store
 *
 * Manages media directory selection, caching, and scanning
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { MediaFile } from '../types'

export const useDirectoryStore = defineStore('directory', () => {
  // State
  const currentDirectory = ref<string | null>(null)
  const mediaTree = ref<MediaFile | null>(null)
  const isScanning = ref(false)
  const scanError = ref<string | null>(null)

  // Navigation state (persists across route changes)
  const currentImagesFolderPath = ref<string>('')
  const currentAudioFolderPath = ref<string>('')

  // Getters
  const hasDirectory = computed(() => currentDirectory.value !== null)
  const hasMediaTree = computed(() => mediaTree.value !== null)

  // Actions

  /**
   * Initialize store by loading cached directory
   */
  async function initialize(): Promise<void> {
    try {
      const cachedDir = await window.electronAPI.getCachedDirectory()
      if (cachedDir) {
        currentDirectory.value = cachedDir
        await scanCurrentDirectory()
      }
    } catch (error) {
      console.error('Failed to initialize directory store:', error)
    }
  }

  /**
   * Open directory selection dialog
   */
  async function selectDirectory(): Promise<boolean> {
    try {
      const selectedPath = await window.electronAPI.selectDirectory()
      if (selectedPath) {
        currentDirectory.value = selectedPath
        await scanCurrentDirectory()
        return true
      }
      return false
    } catch (error) {
      console.error('Failed to select directory:', error)
      scanError.value = error instanceof Error ? error.message : 'Unknown error'
      return false
    }
  }

  /**
   * Scan the current directory for media files
   */
  async function scanCurrentDirectory(): Promise<void> {
    if (!currentDirectory.value) {
      return
    }

    isScanning.value = true
    scanError.value = null

    try {
      mediaTree.value = await window.electronAPI.scanDirectory(currentDirectory.value)
    } catch (error) {
      console.error('Failed to scan directory:', error)
      scanError.value = error instanceof Error ? error.message : 'Unknown error'
      mediaTree.value = null
    } finally {
      isScanning.value = false
    }
  }

  /**
   * Clear the current directory and media tree
   */
  function clearDirectory(): void {
    currentDirectory.value = null
    mediaTree.value = null
    scanError.value = null
  }

  /**
   * Set the current folder path for images tab
   */
  function setImagesFolderPath(path: string): void {
    currentImagesFolderPath.value = path
  }

  /**
   * Set the current folder path for audio tab
   */
  function setAudioFolderPath(path: string): void {
    currentAudioFolderPath.value = path
  }

  return {
    // State
    currentDirectory,
    mediaTree,
    isScanning,
    scanError,
    currentImagesFolderPath,
    currentAudioFolderPath,

    // Getters
    hasDirectory,
    hasMediaTree,

    // Actions
    initialize,
    selectDirectory,
    scanCurrentDirectory,
    clearDirectory,
    setImagesFolderPath,
    setAudioFolderPath
  }
})
