/**
 * Party Store
 *
 * Manages party member data and persistence
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { PartyData, PartyMember } from '../types'
import { useDirectoryStore } from './directory'

export const usePartyStore = defineStore('party', () => {
  // State
  const partyData = ref<PartyData>({
    name: 'My Party',
    members: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  })

  const isSaving = ref(false)
  const isLoading = ref(false)
  const lastError = ref<string | null>(null)

  // Getters
  const members = computed(() => partyData.value.members)
  const memberCount = computed(() => partyData.value.members.length)
  const hasMembers = computed(() => partyData.value.members.length > 0)

  // Actions

  /**
   * Initialize party data by loading from file
   */
  async function initialize(): Promise<void> {
    const directoryStore = useDirectoryStore()
    if (!directoryStore.currentDirectory) {
      return
    }

    await loadPartyData()
  }

  /**
   * Add a new party member
   */
  function addMember(member: PartyMember): void {
    partyData.value.members.push(member)
    partyData.value.updatedAt = new Date().toISOString()
  }

  /**
   * Update an existing party member
   */
  function updateMember(id: string, updates: Partial<PartyMember>): void {
    const index = partyData.value.members.findIndex((m) => m.id === id)
    if (index !== -1) {
      partyData.value.members[index] = {
        ...partyData.value.members[index],
        ...updates
      }
      partyData.value.updatedAt = new Date().toISOString()
    }
  }

  /**
   * Remove a party member
   */
  function removeMember(id: string): void {
    partyData.value.members = partyData.value.members.filter((m) => m.id !== id)
    partyData.value.updatedAt = new Date().toISOString()
  }

  /**
   * Get a party member by ID
   */
  function getMemberById(id: string): PartyMember | undefined {
    return partyData.value.members.find((m) => m.id === id)
  }

  /**
   * Save party data to file
   */
  async function savePartyData(): Promise<boolean> {
    const directoryStore = useDirectoryStore()
    if (!directoryStore.currentDirectory) {
      lastError.value = 'No directory selected'
      return false
    }

    isSaving.value = true
    lastError.value = null

    try {
      const filePath = `${directoryStore.currentDirectory}/party.json`
      partyData.value.updatedAt = new Date().toISOString()
      const success = await window.electronAPI.savePartyData(filePath, partyData.value)
      return success
    } catch (error) {
      console.error('Failed to save party data:', error)
      lastError.value = error instanceof Error ? error.message : 'Unknown error'
      return false
    } finally {
      isSaving.value = false
    }
  }

  /**
   * Load party data from file
   */
  async function loadPartyData(): Promise<boolean> {
    const directoryStore = useDirectoryStore()
    if (!directoryStore.currentDirectory) {
      lastError.value = 'No directory selected'
      return false
    }

    isLoading.value = true
    lastError.value = null

    try {
      const filePath = `${directoryStore.currentDirectory}/party.json`
      const loadedData = await window.electronAPI.loadPartyData(filePath)

      if (loadedData) {
        partyData.value = loadedData
        return true
      } else {
        // No file exists, use default empty party
        partyData.value = {
          name: 'My Party',
          members: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
        return false
      }
    } catch (error) {
      console.error('Failed to load party data:', error)
      lastError.value = error instanceof Error ? error.message : 'Unknown error'
      return false
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Clear all party data
   */
  function clearParty(): void {
    partyData.value = {
      name: 'My Party',
      members: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  }

  return {
    // State
    partyData,
    isSaving,
    isLoading,
    lastError,

    // Getters
    members,
    memberCount,
    hasMembers,

    // Actions
    initialize,
    addMember,
    updateMember,
    removeMember,
    getMemberById,
    savePartyData,
    loadPartyData,
    clearParty
  }
})
