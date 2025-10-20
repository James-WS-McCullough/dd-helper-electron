/**
 * Pins Store
 *
 * Manages pinned items (favorites) for quick access
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface PinnedItem {
  id: string // unique identifier (path)
  type: 'image' | 'video' | 'audio' | 'folder'
  category: 'images' | 'audio' // which dashboard it belongs to
  path: string
  displayName: string
  mediaType?: string
  mediaSubtype?: string
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

  // Get pins by category
  const imagePins = computed(() =>
    pinnedItems.value.filter(item => item.category === 'images')
  )

  const audioPins = computed(() =>
    pinnedItems.value.filter(item => item.category === 'audio')
  )

  // Initialize on first use
  loadPins()

  return {
    pinnedItems,
    imagePins,
    audioPins,
    isPinned,
    addPin,
    removePin,
    togglePin,
    loadPins
  }
})
