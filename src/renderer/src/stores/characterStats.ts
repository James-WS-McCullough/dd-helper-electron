/**
 * Character Stats Store
 *
 * Manages D&D 5e character/NPC stat blocks
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { CharacterStats, CharacterStatsFileInfo } from '../types'
import { useDirectoryStore } from './directory'

export const useCharacterStatsStore = defineStore('characterStats', () => {
  // State
  const characters = ref<CharacterStats[]>([])
  const characterFiles = ref<CharacterStatsFileInfo[]>([])
  const currentCharacterId = ref<string | null>(null)
  const isLoading = ref(false)
  const isSaving = ref(false)
  const isGenerating = ref(false)
  const lastError = ref<string | null>(null)

  // Getters
  const currentCharacter = computed(() =>
    characters.value.find((c) => c.id === currentCharacterId.value) || null
  )

  const hasCharacters = computed(() => characters.value.length > 0)

  const characterCount = computed(() => characters.value.length)

  /**
   * Map of portrait paths to character stats for quick lookup
   */
  const portraitToCharacterMap = computed(() => {
    const map = new Map<string, CharacterStats>()
    for (const character of characters.value) {
      if (character.portraitPath) {
        map.set(character.portraitPath, character)
      }
    }
    return map
  })

  /**
   * Get characters filtered by tag
   */
  function getCharactersByTag(tag: string): CharacterStats[] {
    return characters.value.filter((c) => c.tags?.includes(tag))
  }

  /**
   * Get character by portrait path
   */
  function getCharacterByPortrait(portraitPath: string): CharacterStats | null {
    return portraitToCharacterMap.value.get(portraitPath) || null
  }

  // Actions

  /**
   * Initialize store by loading all character files
   */
  async function initialize(): Promise<void> {
    const directoryStore = useDirectoryStore()
    if (!directoryStore.currentDirectory) {
      return
    }

    await loadAllCharacters()
  }

  /**
   * Load all character stats from the current directory
   */
  async function loadAllCharacters(): Promise<void> {
    const directoryStore = useDirectoryStore()
    if (!directoryStore.currentDirectory) {
      lastError.value = 'No directory selected'
      return
    }

    isLoading.value = true
    lastError.value = null

    try {
      // Get list of character files
      console.log('Loading characters from directory:', directoryStore.currentDirectory)
      characterFiles.value = await window.electronAPI.getCharacterStatsFiles(
        directoryStore.currentDirectory
      )
      console.log('Found character files:', characterFiles.value.length, characterFiles.value.map(f => f.filename))

      // Load each character
      const loadedCharacters: CharacterStats[] = []
      for (const file of characterFiles.value) {
        try {
          const stats = await window.electronAPI.loadCharacterStats(file.path)
          if (stats) {
            loadedCharacters.push(stats)
          }
        } catch (error) {
          console.error(`Failed to load character from ${file.path}:`, error)
        }
      }

      characters.value = loadedCharacters
    } catch (error) {
      console.error('Failed to load characters:', error)
      lastError.value = error instanceof Error ? error.message : 'Unknown error'
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Refresh the list of character files
   */
  async function refreshCharacterList(): Promise<void> {
    const directoryStore = useDirectoryStore()
    if (!directoryStore.currentDirectory) {
      characterFiles.value = []
      return
    }

    try {
      characterFiles.value = await window.electronAPI.getCharacterStatsFiles(
        directoryStore.currentDirectory
      )
    } catch (error) {
      console.error('Failed to refresh character list:', error)
      characterFiles.value = []
    }
  }

  /**
   * Load a specific character by file path
   */
  async function loadCharacter(filePath: string): Promise<CharacterStats | null> {
    isLoading.value = true
    lastError.value = null

    try {
      const stats = await window.electronAPI.loadCharacterStats(filePath)

      if (stats) {
        // Check if character already exists in array
        const index = characters.value.findIndex((c) => c.id === stats.id)
        if (index >= 0) {
          characters.value[index] = stats
        } else {
          characters.value.push(stats)
        }
        return stats
      }

      return null
    } catch (error) {
      console.error('Failed to load character:', error)
      lastError.value = error instanceof Error ? error.message : 'Unknown error'
      return null
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Save a character to file
   */
  async function saveCharacter(stats: CharacterStats, fileName?: string): Promise<boolean> {
    const directoryStore = useDirectoryStore()
    if (!directoryStore.currentDirectory) {
      lastError.value = 'No directory selected'
      return false
    }

    isSaving.value = true
    lastError.value = null

    try {
      // Deep clone to strip Vue reactive proxy before sending over IPC
      const plainStats = JSON.parse(JSON.stringify(stats))
      console.log('Saving character to directory:', directoryStore.currentDirectory, 'name:', plainStats.name)
      const result = await window.electronAPI.saveCharacterStats(
        directoryStore.currentDirectory,
        plainStats,
        fileName
      )
      console.log('Save result:', result)

      if (result.success) {
        // Update local state
        const index = characters.value.findIndex((c) => c.id === stats.id)
        if (index >= 0) {
          characters.value[index] = stats
        } else {
          characters.value.push(stats)
        }

        await refreshCharacterList()
        return true
      } else {
        lastError.value = result.error || 'Failed to save character'
        return false
      }
    } catch (error) {
      console.error('Failed to save character:', error)
      lastError.value = error instanceof Error ? error.message : 'Unknown error'
      return false
    } finally {
      isSaving.value = false
    }
  }

  /**
   * Delete a character
   */
  async function deleteCharacter(characterId: string): Promise<boolean> {
    const character = characters.value.find((c) => c.id === characterId)
    if (!character) {
      lastError.value = 'Character not found'
      return false
    }

    const file = characterFiles.value.find((f) => f.name === character.name)
    if (!file) {
      lastError.value = 'Character file not found'
      return false
    }

    try {
      const success = await window.electronAPI.deleteCharacterStats(file.path)

      if (success) {
        characters.value = characters.value.filter((c) => c.id !== characterId)
        if (currentCharacterId.value === characterId) {
          currentCharacterId.value = null
        }
        await refreshCharacterList()
        return true
      }

      lastError.value = 'Failed to delete character file'
      return false
    } catch (error) {
      console.error('Failed to delete character:', error)
      lastError.value = error instanceof Error ? error.message : 'Unknown error'
      return false
    }
  }

  /**
   * Create a new character with default values
   */
  function createNewCharacter(name: string): CharacterStats {
    const now = new Date().toISOString()
    const newCharacter: CharacterStats = {
      id: crypto.randomUUID(),
      name,
      type: 'Medium humanoid',
      alignment: 'Neutral',
      abilityScores: {
        strength: 10,
        dexterity: 10,
        constitution: 10,
        intelligence: 10,
        wisdom: 10,
        charisma: 10
      },
      armorClass: 10,
      maxHitPoints: 10,
      currentHitPoints: 10,
      speed: { walk: 30 },
      abilities: [],
      createdAt: now,
      updatedAt: now
    }

    characters.value.push(newCharacter)
    currentCharacterId.value = newCharacter.id

    return newCharacter
  }

  /**
   * Update a character locally (without saving)
   */
  function updateCharacter(characterId: string, updates: Partial<CharacterStats>): void {
    const index = characters.value.findIndex((c) => c.id === characterId)
    if (index >= 0) {
      characters.value[index] = {
        ...characters.value[index],
        ...updates,
        updatedAt: new Date().toISOString()
      }
    }
  }

  /**
   * Set the current character
   */
  function setCurrentCharacter(characterId: string | null): void {
    currentCharacterId.value = characterId
  }

  /**
   * Generate a character using Claude AI
   */
  async function generateFromAI(
    description: string,
    characterType?: string
  ): Promise<CharacterStats | null> {
    isGenerating.value = true
    lastError.value = null

    try {
      const result = await window.electronAPI.generateCharacterStats(description, characterType)

      if (result.success && result.stats) {
        // Add to local state but don't save yet
        characters.value.push(result.stats)
        currentCharacterId.value = result.stats.id
        return result.stats
      } else {
        lastError.value = result.error || 'Failed to generate character'
        return null
      }
    } catch (error) {
      console.error('Failed to generate character:', error)
      lastError.value = error instanceof Error ? error.message : 'Unknown error'
      return null
    } finally {
      isGenerating.value = false
    }
  }

  /**
   * Link a portrait to a character
   */
  function linkPortrait(characterId: string, portraitPath: string): void {
    const character = characters.value.find((c) => c.id === characterId)
    if (character) {
      character.portraitPath = portraitPath
      character.updatedAt = new Date().toISOString()
    }
  }

  /**
   * Unlink portrait from a character
   */
  function unlinkPortrait(characterId: string): void {
    const character = characters.value.find((c) => c.id === characterId)
    if (character) {
      character.portraitPath = undefined
      character.updatedAt = new Date().toISOString()
    }
  }

  /**
   * Update character HP
   */
  function updateHP(characterId: string, newHP: number): void {
    const character = characters.value.find((c) => c.id === characterId)
    if (character) {
      character.currentHitPoints = Math.max(0, Math.min(newHP, character.maxHitPoints))
      character.updatedAt = new Date().toISOString()
    }
  }

  /**
   * Clear all characters (reset store)
   */
  function clearCharacters(): void {
    characters.value = []
    characterFiles.value = []
    currentCharacterId.value = null
    lastError.value = null
  }

  return {
    // State
    characters,
    characterFiles,
    currentCharacterId,
    isLoading,
    isSaving,
    isGenerating,
    lastError,

    // Getters
    currentCharacter,
    hasCharacters,
    characterCount,
    portraitToCharacterMap,

    // Query functions
    getCharactersByTag,
    getCharacterByPortrait,

    // Actions
    initialize,
    loadAllCharacters,
    refreshCharacterList,
    loadCharacter,
    saveCharacter,
    deleteCharacter,
    createNewCharacter,
    updateCharacter,
    setCurrentCharacter,
    generateFromAI,
    linkPortrait,
    unlinkPortrait,
    updateHP,
    clearCharacters
  }
})
