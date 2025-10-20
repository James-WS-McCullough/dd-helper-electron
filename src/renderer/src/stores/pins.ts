/**
 * Pins Store
 *
 * Manages pinned items (favorites) for quick access
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useDirectoryStore } from './directory'

export interface PinnedItem {
  id: string // unique identifier (path or preset id)
  type: 'image' | 'video' | 'audio' | 'folder' | 'preset' | 'preset-images' | 'preset-audio'
  category: 'images' | 'audio' | 'presets' // which dashboard it belongs to
  path: string
  displayName: string
  mediaType?: string
  mediaSubtype?: string
  displayState?: any // For presets, stores the DisplayState
}

export const usePinsStore = defineStore('pins', () => {
  const pinnedItems = ref<PinnedItem[]>([])

  // Load pins from localStorage on initialization
  function loadPins() {
    try {
      const stored = localStorage.getItem('dd-helper-pins')
      if (stored) {
        pinnedItems.value = JSON.parse(stored)
      }
    } catch (error) {
      console.error('Failed to load pins:', error)
    }
  }

  // Save pins to localStorage
  function savePins() {
    try {
      localStorage.setItem('dd-helper-pins', JSON.stringify(pinnedItems.value))
    } catch (error) {
      console.error('Failed to save pins:', error)
    }
  }

  // Check if an item is pinned
  function isPinned(path: string): boolean {
    return pinnedItems.value.some(item => item.id === path)
  }

  // Add a pin
  function addPin(item: PinnedItem) {
    if (isPinned(item.id)) return
    pinnedItems.value.push(item)
    savePins()
  }

  // Remove a pin
  function removePin(id: string) {
    pinnedItems.value = pinnedItems.value.filter(item => item.id !== id)
    savePins()
  }

  // Toggle pin state
  function togglePin(item: PinnedItem) {
    if (isPinned(item.id)) {
      removePin(item.id)
    } else {
      addPin(item)
    }
  }

  // Rename a pin
  function renamePin(id: string, newName: string) {
    const pin = pinnedItems.value.find(item => item.id === id)
    if (pin) {
      pin.displayName = newName
      savePins()
    }
  }

  // Save pin board to file
  async function savePinBoard(boardName: string): Promise<void> {
    const directoryStore = useDirectoryStore()
    if (!directoryStore.currentDirectory) return

    // Serialize to plain JSON to remove Vue reactivity proxies
    const plainPins = JSON.parse(JSON.stringify(pinnedItems.value))

    await window.electronAPI.savePinBoard(
      directoryStore.currentDirectory,
      boardName,
      plainPins
    )
  }

  // Load pin board from file
  async function loadPinBoard(boardName: string): Promise<void> {
    const directoryStore = useDirectoryStore()
    if (!directoryStore.currentDirectory) return

    const pins = await window.electronAPI.loadPinBoard(
      directoryStore.currentDirectory,
      boardName
    )

    if (pins) {
      pinnedItems.value = pins
      savePins()
    }
  }

  // Get available pin boards
  async function getAvailablePinBoards(): Promise<string[]> {
    const directoryStore = useDirectoryStore()
    if (!directoryStore.currentDirectory) return []

    return await window.electronAPI.getAvailablePinBoards(
      directoryStore.currentDirectory
    )
  }

  // Get pins by category
  const imagePins = computed(() =>
    pinnedItems.value.filter(item => item.category === 'images')
  )

  const audioPins = computed(() =>
    pinnedItems.value.filter(item => item.category === 'audio')
  )

  const presetPins = computed(() =>
    pinnedItems.value.filter(item => item.category === 'presets')
  )

  // Initialize on first use
  loadPins()

  return {
    pinnedItems,
    imagePins,
    audioPins,
    presetPins,
    isPinned,
    addPin,
    removePin,
    togglePin,
    renamePin,
    loadPins,
    savePinBoard,
    loadPinBoard,
    getAvailablePinBoards
  }
})
