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
  const isInitialized = ref(false)

  // Getters
  const members = computed(() => partyData.value.members || [])
  const memberCount = computed(() => (partyData.value.members || []).length)
  const hasMembers = computed(() => (partyData.value.members || []).length > 0)

  // Actions

  /**
   * Initialize party data by loading from file
   */
  let initPromise: Promise<void> | null = null

  async function initialize(): Promise<void> {
    // Prevent concurrent initializations — reuse in-flight promise
    if (initPromise) {
      return initPromise
    }

    const directoryStore = useDirectoryStore()
    if (!directoryStore.currentDirectory) {
      return
    }

    initPromise = loadPartyData().then(() => {
      isInitialized.value = true
      initPromise = null
    })
    return initPromise
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
      console.error('[PartyStore] Save failed: no directory selected')
      lastError.value = 'No directory selected'
      return false
    }

    isSaving.value = true
    lastError.value = null

    try {
      const filePath = `${directoryStore.currentDirectory}/party.json`
      // Build a clean PartyData object to avoid serializing a corrupted reactive state
      const currentMembers = Array.isArray(partyData.value.members)
        ? partyData.value.members
        : Array.isArray(partyData.value)
          ? [...(partyData.value as unknown as PartyMember[])]
          : []

      const plainData: PartyData = {
        name: partyData.value.name || 'My Party',
        members: JSON.parse(JSON.stringify(currentMembers)),
        createdAt: partyData.value.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      console.log(`[PartyStore] Saving ${plainData.members.length} members to ${filePath}`)
      const success = await window.electronAPI.savePartyData(filePath, plainData)
      console.log(`[PartyStore] Save result: ${success}`)
      return success
    } catch (error) {
      console.error('[PartyStore] Failed to save party data:', error)
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
      console.warn('[PartyStore] Load skipped: no directory selected')
      lastError.value = 'No directory selected'
      return false
    }

    isLoading.value = true
    lastError.value = null

    try {
      const filePath = `${directoryStore.currentDirectory}/party.json`
      console.log(`[PartyStore] Loading from ${filePath}`)
      const loadedData = await window.electronAPI.loadPartyData(filePath)
      console.log(`[PartyStore] Loaded data:`, loadedData ? `${loadedData.members?.length ?? 0} members` : 'null (file not found)')

      if (loadedData) {
        // Handle legacy format: bare array of members instead of PartyData object
        let rawMembers: any[]
        if (Array.isArray(loadedData)) {
          console.warn(`[PartyStore] Legacy format detected: bare array with ${loadedData.length} members`)
          rawMembers = loadedData
        } else {
          rawMembers = Array.isArray(loadedData.members) ? loadedData.members : []
        }

        // Migrate legacy members that lack abilityScores (old schema had maxHp/currentHp instead)
        const migratedMembers: PartyMember[] = rawMembers.map((m: any) => ({
          id: m.id || crypto.randomUUID(),
          name: m.name || 'Unknown',
          class: m.class || 'Fighter',
          level: m.level || 1,
          ac: m.ac || 10,
          abilityScores: m.abilityScores || {
            strength: 10, dexterity: 10, constitution: 10,
            intelligence: 10, wisdom: 10, charisma: 10
          },
          proficiencyBonus: m.proficiencyBonus || Math.ceil((m.level || 1) / 4) + 1,
          savingThrowProficiencies: m.savingThrowProficiencies || {},
          skillProficiencies: m.skillProficiencies || {},
          ...(m.portraitPath && { portraitPath: m.portraitPath }),
          ...(m.notes && { notes: m.notes })
        }))

        partyData.value = {
          name: (!Array.isArray(loadedData) && loadedData.name) || 'My Party',
          members: migratedMembers,
          createdAt: (!Array.isArray(loadedData) && loadedData.createdAt) || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }

        // Re-save in correct format if migration happened
        if (Array.isArray(loadedData) || rawMembers.some((m: any) => !m.abilityScores)) {
          console.log('[PartyStore] Re-saving migrated data')
          await savePartyData()
        }
        return true
      } else {
        // No file exists yet - only reset if store has no members
        // (avoids overwriting in-memory data that hasn't been saved yet)
        if (!partyData.value.members.length) {
          partyData.value = {
            name: 'My Party',
            members: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        }
        return false
      }
    } catch (error) {
      console.error('[PartyStore] Failed to load party data:', error)
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

  /**
   * Create a default new party member
   */
  function createDefaultMember(name: string): PartyMember {
    return {
      id: crypto.randomUUID(),
      name,
      class: 'Fighter',
      level: 1,
      ac: 10,
      abilityScores: {
        strength: 10,
        dexterity: 10,
        constitution: 10,
        intelligence: 10,
        wisdom: 10,
        charisma: 10
      },
      proficiencyBonus: 2,
      savingThrowProficiencies: {},
      skillProficiencies: {}
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
    clearParty,
    createDefaultMember
  }
})
