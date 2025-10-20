/**
 * Initiative Store
 *
 * Manages combat initiative tracking and turn order
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { InitiativeData, Combatant } from '../types'
import { useDirectoryStore } from './directory'

export const useInitiativeStore = defineStore('initiative', () => {
  // State
  const initiativeData = ref<InitiativeData>({
    combatants: [],
    currentTurn: 0,
    round: 1,
    isActive: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  })

  const isSaving = ref(false)
  const isLoading = ref(false)
  const lastError = ref<string | null>(null)

  // Getters
  const combatants = computed(() => initiativeData.value.combatants)
  const currentTurn = computed(() => initiativeData.value.currentTurn)
  const round = computed(() => initiativeData.value.round)
  const isActive = computed(() => initiativeData.value.isActive)
  const combatantCount = computed(() => initiativeData.value.combatants.length)
  const currentCombatant = computed(() => {
    if (
      initiativeData.value.currentTurn >= 0 &&
      initiativeData.value.currentTurn < initiativeData.value.combatants.length
    ) {
      return initiativeData.value.combatants[initiativeData.value.currentTurn]
    }
    return null
  })

  // Actions

  /**
   * Initialize initiative by loading saved data
   */
  async function initialize(): Promise<void> {
    const directoryStore = useDirectoryStore()
    if (!directoryStore.currentDirectory) {
      return
    }

    await loadInitiative()
  }

  /**
   * Start combat initiative
   */
  function startCombat(): void {
    if (initiativeData.value.combatants.length === 0) {
      return
    }

    initiativeData.value.isActive = true
    initiativeData.value.currentTurn = 0
    initiativeData.value.round = 1
    initiativeData.value.updatedAt = new Date().toISOString()
  }

  /**
   * End combat initiative
   */
  function endCombat(): void {
    initiativeData.value.isActive = false
    initiativeData.value.updatedAt = new Date().toISOString()
  }

  /**
   * Add a combatant to initiative
   */
  function addCombatant(combatant: Combatant): void {
    initiativeData.value.combatants.push(combatant)
    sortCombatants()
    initiativeData.value.updatedAt = new Date().toISOString()
  }

  /**
   * Remove a combatant from initiative
   */
  function removeCombatant(id: string): void {
    const index = initiativeData.value.combatants.findIndex((c) => c.id === id)
    if (index !== -1) {
      initiativeData.value.combatants.splice(index, 1)

      // Adjust current turn if needed
      if (initiativeData.value.currentTurn >= index && initiativeData.value.currentTurn > 0) {
        initiativeData.value.currentTurn--
      }

      initiativeData.value.updatedAt = new Date().toISOString()
    }
  }

  /**
   * Update a combatant's data
   */
  function updateCombatant(id: string, updates: Partial<Combatant>): void {
    const index = initiativeData.value.combatants.findIndex((c) => c.id === id)
    if (index !== -1) {
      initiativeData.value.combatants[index] = {
        ...initiativeData.value.combatants[index],
        ...updates
      }

      // Resort if initiative changed
      if (updates.initiative !== undefined) {
        sortCombatants()
      }

      initiativeData.value.updatedAt = new Date().toISOString()
    }
  }

  /**
   * Sort combatants by initiative (highest first)
   */
  function sortCombatants(): void {
    initiativeData.value.combatants.sort((a, b) => b.initiative - a.initiative)
  }

  /**
   * Advance to next turn
   */
  function nextTurn(): void {
    if (initiativeData.value.combatants.length === 0) {
      return
    }

    initiativeData.value.currentTurn++

    if (initiativeData.value.currentTurn >= initiativeData.value.combatants.length) {
      initiativeData.value.currentTurn = 0
      initiativeData.value.round++
    }

    initiativeData.value.updatedAt = new Date().toISOString()
  }

  /**
   * Go back to previous turn
   */
  function previousTurn(): void {
    if (initiativeData.value.combatants.length === 0) {
      return
    }

    initiativeData.value.currentTurn--

    if (initiativeData.value.currentTurn < 0) {
      initiativeData.value.currentTurn = initiativeData.value.combatants.length - 1
      if (initiativeData.value.round > 1) {
        initiativeData.value.round--
      }
    }

    initiativeData.value.updatedAt = new Date().toISOString()
  }

  /**
   * Set current turn directly
   */
  function setTurn(turnIndex: number): void {
    if (turnIndex >= 0 && turnIndex < initiativeData.value.combatants.length) {
      initiativeData.value.currentTurn = turnIndex
      initiativeData.value.updatedAt = new Date().toISOString()
    }
  }

  /**
   * Save initiative data to file
   */
  async function saveInitiative(): Promise<boolean> {
    const directoryStore = useDirectoryStore()
    if (!directoryStore.currentDirectory) {
      lastError.value = 'No directory selected'
      return false
    }

    isSaving.value = true
    lastError.value = null

    try {
      initiativeData.value.updatedAt = new Date().toISOString()
      const result = await window.electronAPI.saveInitiativeData(
        directoryStore.currentDirectory,
        initiativeData.value
      )
      return result.success
    } catch (error) {
      console.error('Failed to save initiative:', error)
      lastError.value = error instanceof Error ? error.message : 'Unknown error'
      return false
    } finally {
      isSaving.value = false
    }
  }

  /**
   * Load initiative data from file
   */
  async function loadInitiative(): Promise<boolean> {
    const directoryStore = useDirectoryStore()
    if (!directoryStore.currentDirectory) {
      lastError.value = 'No directory selected'
      return false
    }

    isLoading.value = true
    lastError.value = null

    try {
      const loadedData = await window.electronAPI.loadInitiativeData(
        directoryStore.currentDirectory
      )

      if (loadedData) {
        initiativeData.value = loadedData
        return true
      } else {
        // No saved data, use default
        return false
      }
    } catch (error) {
      console.error('Failed to load initiative:', error)
      lastError.value = error instanceof Error ? error.message : 'Unknown error'
      return false
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Clear all initiative data
   */
  function clearInitiative(): void {
    initiativeData.value = {
      combatants: [],
      currentTurn: 0,
      round: 1,
      isActive: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  }

  return {
    // State
    initiativeData,
    isSaving,
    isLoading,
    lastError,

    // Getters
    combatants,
    currentTurn,
    round,
    isActive,
    combatantCount,
    currentCombatant,

    // Actions
    initialize,
    startCombat,
    endCombat,
    addCombatant,
    removeCombatant,
    updateCombatant,
    sortCombatants,
    nextTurn,
    previousTurn,
    setTurn,
    saveInitiative,
    loadInitiative,
    clearInitiative
  }
})
