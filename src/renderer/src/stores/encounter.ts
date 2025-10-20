/**
 * Encounter Store
 *
 * Manages combat encounter data and enemy information
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Encounter, Enemy, EncounterFileInfo } from '../types'
import { useDirectoryStore } from './directory'

export const useEncounterStore = defineStore('encounter', () => {
  // State
  const currentEncounter = ref<Encounter | null>(null)
  const encounterFiles = ref<EncounterFileInfo[]>([])
  const isSaving = ref(false)
  const isLoading = ref(false)
  const lastError = ref<string | null>(null)

  // Getters
  const hasEncounter = computed(() => currentEncounter.value !== null)
  const enemies = computed(() => currentEncounter.value?.enemies || [])
  const enemyCount = computed(() => currentEncounter.value?.enemies.length || 0)
  const encounterName = computed(() => currentEncounter.value?.name || '')
  const encounterDifficulty = computed(() => currentEncounter.value?.difficulty || 'medium')

  // Actions

  /**
   * Initialize encounter store by loading available encounters
   */
  async function initialize(): Promise<void> {
    const directoryStore = useDirectoryStore()
    if (!directoryStore.currentDirectory) {
      return
    }

    await refreshEncounterList()
  }

  /**
   * Create a new encounter
   */
  function createEncounter(
    name: string,
    difficulty?: 'easy' | 'medium' | 'hard' | 'deadly'
  ): void {
    currentEncounter.value = {
      name,
      enemies: [],
      difficulty: difficulty || 'medium',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  }

  /**
   * Add an enemy to the current encounter
   */
  function addEnemy(enemy: Enemy): void {
    if (!currentEncounter.value) {
      return
    }

    currentEncounter.value.enemies.push(enemy)
    currentEncounter.value.updatedAt = new Date().toISOString()
  }

  /**
   * Update an existing enemy
   */
  function updateEnemy(index: number, updates: Partial<Enemy>): void {
    if (!currentEncounter.value || index < 0 || index >= currentEncounter.value.enemies.length) {
      return
    }

    currentEncounter.value.enemies[index] = {
      ...currentEncounter.value.enemies[index],
      ...updates
    }
    currentEncounter.value.updatedAt = new Date().toISOString()
  }

  /**
   * Remove an enemy from the encounter
   */
  function removeEnemy(index: number): void {
    if (!currentEncounter.value || index < 0 || index >= currentEncounter.value.enemies.length) {
      return
    }

    currentEncounter.value.enemies.splice(index, 1)
    currentEncounter.value.updatedAt = new Date().toISOString()
  }

  /**
   * Update encounter metadata
   */
  function updateEncounter(updates: Partial<Encounter>): void {
    if (!currentEncounter.value) {
      return
    }

    currentEncounter.value = {
      ...currentEncounter.value,
      ...updates,
      updatedAt: new Date().toISOString()
    }
  }

  /**
   * Save encounter to file
   */
  async function saveEncounter(customFileName?: string): Promise<boolean> {
    const directoryStore = useDirectoryStore()
    if (!directoryStore.currentDirectory || !currentEncounter.value) {
      lastError.value = 'No directory selected or no encounter to save'
      return false
    }

    isSaving.value = true
    lastError.value = null

    try {
      const fileName =
        customFileName ||
        `${currentEncounter.value.name.replace(/\s+/g, '_').toLowerCase()}_encounter.json`
      const filePath = `${directoryStore.currentDirectory}/${fileName}`
      currentEncounter.value.updatedAt = new Date().toISOString()

      const success = await window.electronAPI.saveEncounterData(filePath, currentEncounter.value)

      if (success) {
        await refreshEncounterList()
      }

      return success
    } catch (error) {
      console.error('Failed to save encounter:', error)
      lastError.value = error instanceof Error ? error.message : 'Unknown error'
      return false
    } finally {
      isSaving.value = false
    }
  }

  /**
   * Load encounter from file
   */
  async function loadEncounter(filePath: string): Promise<boolean> {
    isLoading.value = true
    lastError.value = null

    try {
      const loadedEncounter = await window.electronAPI.loadEncounterData(filePath)

      if (loadedEncounter) {
        currentEncounter.value = loadedEncounter
        return true
      } else {
        lastError.value = 'Encounter file not found'
        return false
      }
    } catch (error) {
      console.error('Failed to load encounter:', error)
      lastError.value = error instanceof Error ? error.message : 'Unknown error'
      return false
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Select and load encounter file via dialog
   */
  async function selectAndLoadEncounter(): Promise<boolean> {
    const directoryStore = useDirectoryStore()
    if (!directoryStore.currentDirectory) {
      lastError.value = 'No directory selected'
      return false
    }

    try {
      const filePath = await window.electronAPI.selectEncounterFile(
        directoryStore.currentDirectory
      )

      if (filePath) {
        return await loadEncounter(filePath)
      }

      return false
    } catch (error) {
      console.error('Failed to select encounter file:', error)
      lastError.value = error instanceof Error ? error.message : 'Unknown error'
      return false
    }
  }

  /**
   * Refresh list of encounter files in current directory
   */
  async function refreshEncounterList(): Promise<void> {
    const directoryStore = useDirectoryStore()
    if (!directoryStore.currentDirectory) {
      encounterFiles.value = []
      return
    }

    try {
      encounterFiles.value = await window.electronAPI.getEncounterFiles(
        directoryStore.currentDirectory
      )
    } catch (error) {
      console.error('Failed to refresh encounter list:', error)
      encounterFiles.value = []
    }
  }

  /**
   * Clear current encounter
   */
  function clearEncounter(): void {
    currentEncounter.value = null
  }

  return {
    // State
    currentEncounter,
    encounterFiles,
    isSaving,
    isLoading,
    lastError,

    // Getters
    hasEncounter,
    enemies,
    enemyCount,
    encounterName,
    encounterDifficulty,

    // Actions
    initialize,
    createEncounter,
    addEnemy,
    updateEnemy,
    removeEnemy,
    updateEncounter,
    saveEncounter,
    loadEncounter,
    selectAndLoadEncounter,
    refreshEncounterList,
    clearEncounter
  }
})
