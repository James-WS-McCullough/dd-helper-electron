/**
 * Display Store
 *
 * Manages display window state including media layers and playback
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { DisplayState, DisplayElement } from '../types'

export const useDisplayStore = defineStore('display', () => {
  // State
  const displayState = ref<DisplayState>({
    portraits: [],
    focusedPortraitPath: null,
    background: null,
    event: null,
    backgroundSounds: [],
    backgroundMusic: null,
    soundEffects: []
  })

  const displayWindowOpen = ref(false)

  // Getters
  const hasPortraits = computed(() => displayState.value.portraits.length > 0)
  const hasBackground = computed(() => displayState.value.background !== null)
  const hasEvent = computed(() => displayState.value.event !== null)
  const hasBackgroundMusic = computed(() => displayState.value.backgroundMusic !== null)
  const backgroundSoundCount = computed(() => displayState.value.backgroundSounds.length)
  const soundEffectCount = computed(() => displayState.value.soundEffects.length)
  const focusedPortrait = computed(() => {
    if (!displayState.value.focusedPortraitPath) return null
    return displayState.value.portraits.find(p => p.path === displayState.value.focusedPortraitPath) || null
  })

  // Actions

  /**
   * Initialize store by fetching current display state
   */
  async function initialize(): Promise<void> {
    try {
      const state = await window.electronAPI.getDisplayState()
      displayState.value = state

      // Set up listeners for display state updates
      window.electronAPI.onDisplayStateUpdated((_event, state) => {
        displayState.value = state
      })
    } catch (error) {
      console.error('Failed to initialize display store:', error)
    }
  }

  /**
   * Open the display window
   */
  async function openDisplayWindow(): Promise<boolean> {
    try {
      const success = await window.electronAPI.openDisplayWindow()
      if (success) {
        displayWindowOpen.value = true
      }
      return success
    } catch (error) {
      console.error('Failed to open display window:', error)
      return false
    }
  }

  /**
   * Display media on the display window
   */
  async function displayMedia(
    mediaPath: string,
    mediaType: string,
    mediaSubtype: string,
    displayName: string
  ): Promise<boolean> {
    try {
      return await window.electronAPI.displayMedia(mediaPath, mediaType, mediaSubtype, displayName)
    } catch (error) {
      console.error('Failed to display media:', error)
      return false
    }
  }

  /**
   * Clear a specific display element
   */
  async function clearElement(elementType: DisplayElement, elementPath?: string): Promise<boolean> {
    try {
      return await window.electronAPI.clearDisplayElement(elementType, elementPath)
    } catch (error) {
      console.error('Failed to clear display element:', error)
      return false
    }
  }

  /**
   * Clear all portraits
   */
  async function clearAllPortraits(): Promise<boolean> {
    return await clearElement('portraits')
  }

  /**
   * Clear specific portrait
   */
  async function clearPortrait(portraitPath: string): Promise<boolean> {
    return await clearElement('portraits', portraitPath)
  }

  /**
   * Clear background
   */
  async function clearBackground(): Promise<boolean> {
    return await clearElement('background')
  }

  /**
   * Clear event
   */
  async function clearEvent(): Promise<boolean> {
    return await clearElement('event')
  }

  /**
   * Clear background music
   */
  async function clearBackgroundMusic(): Promise<boolean> {
    return await clearElement('backgroundMusic')
  }

  /**
   * Clear specific background sound
   */
  async function clearBackgroundSound(soundId: string): Promise<boolean> {
    return await clearElement('backgroundSound', soundId)
  }

  /**
   * Clear all background sounds
   */
  async function clearAllBackgroundSounds(): Promise<boolean> {
    return await clearElement('backgroundSound')
  }

  /**
   * Clear specific sound effect
   */
  async function clearSoundEffect(effectId: string): Promise<boolean> {
    return await clearElement('soundEffect', effectId)
  }

  /**
   * Clear all sound effects
   */
  async function clearAllSoundEffects(): Promise<boolean> {
    return await clearElement('soundEffect')
  }

  /**
   * Clear all display content
   */
  async function clearAll(): Promise<boolean> {
    return await clearElement('all')
  }

  /**
   * Set the focused portrait
   */
  async function setFocusedPortrait(portraitPath: string | null): Promise<boolean> {
    try {
      return await window.electronAPI.setFocusedPortrait(portraitPath)
    } catch (error) {
      console.error('Failed to set focused portrait:', error)
      return false
    }
  }

  /**
   * Set audio volume for a specific audio item
   */
  async function setAudioVolume(
    audioType: 'backgroundMusic' | 'backgroundSound',
    audioId: string | null,
    volume: number
  ): Promise<boolean> {
    try {
      return await window.electronAPI.setAudioVolume(audioType, audioId, volume)
    } catch (error) {
      console.error('Failed to set audio volume:', error)
      return false
    }
  }

  /**
   * Clean up listeners when store is destroyed
   */
  function dispose(): void {
    window.electronAPI.removeDisplayListeners()
  }

  return {
    // State
    displayState,
    displayWindowOpen,

    // Getters
    hasPortraits,
    hasBackground,
    hasEvent,
    hasBackgroundMusic,
    backgroundSoundCount,
    soundEffectCount,
    focusedPortrait,

    // Actions
    initialize,
    openDisplayWindow,
    displayMedia,
    clearElement,
    clearAllPortraits,
    clearPortrait,
    clearBackground,
    clearEvent,
    clearBackgroundMusic,
    clearBackgroundSound,
    clearAllBackgroundSounds,
    clearSoundEffect,
    clearAllSoundEffects,
    clearAll,
    setFocusedPortrait,
    setAudioVolume,
    dispose
  }
})
