<template>
  <transition name="slide-up">
    <div
      v-if="hasActiveDisplay"
      class="relative z-50 flex-shrink-0"
    >
      <div class="bg-gray-800/95 backdrop-blur-lg border-t border-gray-700 shadow-2xl">
        <div class="flex items-center gap-4 p-3 overflow-x-auto overflow-y-visible">
        <!-- Background Display -->
        <div
          v-if="displayStore.hasBackground"
          class="flex-shrink-0 relative group"
        >
          <div class="relative w-32 h-20 bg-gray-900 rounded-lg overflow-hidden">
            <img
              v-if="displayStore.displayState.background?.type === 'image'"
              :src="`media://${displayStore.displayState.background.path}`"
              alt="Background"
              class="w-full h-full object-cover"
            />
            <video
              v-else-if="displayStore.displayState.background?.type === 'video'"
              :src="`media://${displayStore.displayState.background.path}`"
              class="w-full h-full object-cover"
              muted
            />
            <div class="absolute top-1 right-1">
              <button
                @click="displayStore.clearBackground()"
                class="p-1 bg-red-600 hover:bg-red-700 rounded-full text-white text-xs transition-colors"
              >
                ✕
              </button>
            </div>
            <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
              <p class="text-white text-xs font-medium truncate">Background</p>
              <p class="text-gray-300 text-xs truncate">{{ displayStore.displayState.background ? getGMDisplayNameFromPath(displayStore.displayState.background.path, displayStore.displayState.background.displayName) : '' }}</p>
            </div>
          </div>
        </div>

        <!-- Portraits Display -->
        <div
          v-for="portrait in displayStore.displayState.portraits"
          :key="portrait.path"
          class="flex-shrink-0 relative group"
        >
          <div class="relative w-32 h-20 bg-gray-900 rounded-lg overflow-hidden" :class="{ 'ring-2 ring-blue-500': isFocused(portrait.path) }">
            <img
              :src="`media://${portrait.path}`"
              :alt="portrait.displayName"
              class="w-full h-full object-cover"
            />
            <div class="absolute top-1 left-1 right-1 flex items-center justify-between gap-1">
              <button
                @click="handleFocusToggle(portrait.path)"
                class="p-1 rounded-full text-white text-xs transition-colors"
                :class="isFocused(portrait.path) ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-700 hover:bg-gray-600'"
                :title="isFocused(portrait.path) ? 'Focused' : 'Focus this portrait'"
              >
                👁️
              </button>
              <button
                @click="displayStore.clearPortrait(portrait.path)"
                class="p-1 bg-red-600 hover:bg-red-700 rounded-full text-white text-xs transition-colors"
              >
                ✕
              </button>
            </div>
            <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
              <p class="text-white text-xs font-medium truncate">Portrait</p>
              <p class="text-gray-300 text-xs truncate">{{ getGMDisplayNameFromPath(portrait.path, portrait.displayName) }}</p>
            </div>
          </div>
        </div>

        <!-- Background Music -->
        <div
          v-if="displayStore.hasBackgroundMusic"
          class="flex-shrink-0 relative group"
          ref="backgroundMusicCard"
        >
          <div
            @click="toggleVolumeControl('backgroundMusic')"
            class="audio-card-clickable relative w-32 h-20 bg-pink-900/50 rounded-lg overflow-hidden flex items-center justify-center border border-pink-500/50 cursor-pointer hover:bg-pink-900/70 transition-colors"
          >
            <span class="text-4xl">🎵</span>
            <div class="absolute top-1 right-1">
              <button
                @click.stop="displayStore.clearBackgroundMusic()"
                class="p-1 bg-red-600 hover:bg-red-700 rounded-full text-white text-xs transition-colors"
              >
                ✕
              </button>
            </div>
            <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
              <p class="text-pink-200 text-xs font-medium truncate">Music</p>
              <p class="text-pink-300 text-xs truncate">{{ displayStore.displayState.backgroundMusic ? getGMDisplayNameFromPath(displayStore.displayState.backgroundMusic.path, displayStore.displayState.backgroundMusic.displayName) : '' }}</p>
            </div>
          </div>
        </div>

        <!-- Background Sounds -->
        <div
          v-for="sound in displayStore.displayState.backgroundSounds"
          :key="sound.id"
          class="flex-shrink-0 relative group"
          :ref="(el) => setSoundCardRef(`backgroundSound-${sound.id}`, el)"
        >
          <div
            @click="toggleVolumeControl(`backgroundSound-${sound.id}`)"
            class="audio-card-clickable relative w-32 h-20 bg-yellow-900/50 rounded-lg overflow-hidden flex items-center justify-center border border-yellow-500/50 cursor-pointer hover:bg-yellow-900/70 transition-colors"
          >
            <span class="text-4xl">🔊</span>
            <div class="absolute top-1 right-1">
              <button
                @click.stop="displayStore.clearBackgroundSound(String(sound.id))"
                class="p-1 bg-red-600 hover:bg-red-700 rounded-full text-white text-xs transition-colors"
              >
                ✕
              </button>
            </div>
            <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
              <p class="text-yellow-200 text-xs font-medium truncate">Loop</p>
              <p class="text-yellow-300 text-xs truncate">{{ getGMDisplayNameFromPath(sound.path, sound.displayName) }}</p>
            </div>
          </div>
        </div>

        <!-- Sound Effects Count (if any active) -->
        <div
          v-if="displayStore.soundEffectCount > 0"
          class="flex-shrink-0 relative group"
        >
          <div class="relative w-32 h-20 bg-orange-900/50 rounded-lg overflow-hidden flex flex-col items-center justify-center border border-orange-500/50">
            <span class="text-3xl">💥</span>
            <p class="text-orange-200 text-xs font-medium mt-1">{{ displayStore.soundEffectCount }} SFX</p>
          </div>
        </div>

        <!-- Menu Button -->
        <div v-if="hasActiveDisplay" class="flex-shrink-0 ml-auto">
          <button
            ref="menuButton"
            @click="toggleMenu"
            class="p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            title="Display Options"
          >
            <span class="text-2xl">☰</span>
          </button>
        </div>
        </div>
      </div>
    </div>
  </transition>

  <!-- Popup Menus (Outside scrolling container) -->
  <Teleport to="body">
    <!-- Display Options Menu -->
    <div
      v-if="showMenu && menuPosition"
      :style="{ left: menuPosition.x + 'px', top: menuPosition.y + 'px' }"
      class="display-options-menu fixed bg-gray-900 border-2 border-gray-700 rounded-lg shadow-2xl p-2 z-[10000] w-64"
      @click.stop
    >
      <div class="space-y-1">
        <!-- Clear All -->
        <button
          @click="clearAllContent(); closeMenu()"
          class="w-full text-left px-4 py-2 rounded-lg text-white hover:bg-red-600/20 transition-colors flex items-center gap-3"
        >
          <span class="text-xl">🗑️</span>
          <span>Clear All</span>
        </button>

        <!-- Clear All Portraits -->
        <button
          @click="clearAllPortraits(); closeMenu()"
          class="w-full text-left px-4 py-2 rounded-lg text-white hover:bg-red-600/20 transition-colors flex items-center gap-3"
        >
          <span class="text-xl">👤</span>
          <span>Clear All Portraits</span>
        </button>

        <!-- Clear All Images -->
        <button
          @click="clearAllImages(); closeMenu()"
          class="w-full text-left px-4 py-2 rounded-lg text-white hover:bg-red-600/20 transition-colors flex items-center gap-3"
        >
          <span class="text-xl">🖼️</span>
          <span>Clear All Images</span>
        </button>

        <!-- Clear All Audio -->
        <button
          @click="clearAllAudio(); closeMenu()"
          class="w-full text-left px-4 py-2 rounded-lg text-white hover:bg-red-600/20 transition-colors flex items-center gap-3"
        >
          <span class="text-xl">🎵</span>
          <span>Clear All Audio</span>
        </button>

        <div class="border-t border-gray-700 my-2"></div>

        <!-- Pin as Preset -->
        <button
          @click="pinAsPreset(); closeMenu()"
          class="w-full text-left px-4 py-2 rounded-lg text-white hover:bg-blue-600/20 transition-colors flex items-center gap-3"
        >
          <span class="text-xl">📌</span>
          <span>Pin as Preset</span>
        </button>

        <!-- Pin Images as Preset -->
        <button
          @click="pinImagesAsPreset(); closeMenu()"
          class="w-full text-left px-4 py-2 rounded-lg text-white hover:bg-blue-600/20 transition-colors flex items-center gap-3"
        >
          <span class="text-xl">🖼️</span>
          <span>Pin Images as Preset</span>
        </button>

        <!-- Pin Audio as Preset -->
        <button
          @click="pinAudioAsPreset(); closeMenu()"
          class="w-full text-left px-4 py-2 rounded-lg text-white hover:bg-blue-600/20 transition-colors flex items-center gap-3"
        >
          <span class="text-xl">🎵</span>
          <span>Pin Audio as Preset</span>
        </button>
      </div>
    </div>

    <!-- Background Music Volume Control -->
    <div
      v-if="volumeControlId === 'backgroundMusic' && volumeControlPosition"
      :style="{ left: volumeControlPosition.x + 'px', top: volumeControlPosition.y + 'px' }"
      class="volume-control-popup fixed bg-gray-900 border-2 border-gray-700 rounded-lg shadow-2xl p-4 z-[10000] w-56"
      @click.stop
    >
      <div class="flex items-center gap-3 mb-2">
        <span class="text-sm text-gray-400">🔇</span>
        <input
          type="range"
          min="0"
          max="100"
          :value="getVolume(displayStore.displayState.backgroundMusic) * 100"
          @input="updateVolume('backgroundMusic', $event)"
          class="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer volume-slider"
        />
        <span class="text-sm text-gray-400">🔊</span>
      </div>
      <p class="text-center text-sm text-white font-medium">{{ Math.round(getVolume(displayStore.displayState.backgroundMusic) * 100) }}%</p>
    </div>

    <!-- Background Sound Volume Controls -->
    <div
      v-for="sound in displayStore.displayState.backgroundSounds"
      :key="`vol-${sound.id}`"
    >
      <div
        v-if="volumeControlId === `backgroundSound-${sound.id}` && volumeControlPosition"
        :style="{ left: volumeControlPosition.x + 'px', top: volumeControlPosition.y + 'px' }"
        class="volume-control-popup fixed bg-gray-900 border-2 border-gray-700 rounded-lg shadow-2xl p-4 z-[10000] w-56"
        @click.stop
      >
        <div class="flex items-center gap-3 mb-2">
          <span class="text-sm text-gray-400">🔇</span>
          <input
            type="range"
            min="0"
            max="100"
            :value="getVolume(sound) * 100"
            @input="updateVolume(`backgroundSound-${sound.id}`, $event)"
            class="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer volume-slider"
          />
          <span class="text-sm text-gray-400">🔊</span>
        </div>
        <p class="text-center text-sm text-white font-medium">{{ Math.round(getVolume(sound) * 100) }}%</p>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useDisplayStore, usePinsStore } from '../stores'
import { getGMDisplayNameFromPath } from '../utils/displayNames'
import type { MediaItem } from '../types'

const displayStore = useDisplayStore()
const pinsStore = usePinsStore()

// Volume control state
const volumeControlId = ref<string | null>(null)
const volumeControlPosition = ref<{ x: number; y: number } | null>(null)

// Menu state
const showMenu = ref(false)
const menuPosition = ref<{ x: number; y: number } | null>(null)
const menuButton = ref<HTMLElement | null>(null)

// Card refs
const backgroundMusicCard = ref<HTMLElement | null>(null)
const soundCardRefs = new Map<string, HTMLElement>()

// Close volume control and menu when clicking outside
function handleClickOutside(event: MouseEvent) {
  const target = event.target as HTMLElement

  // Close volume control if clicking outside
  if (volumeControlId.value) {
    if (!target.closest('.volume-control-popup') && !target.closest('.audio-card-clickable')) {
      volumeControlId.value = null
      volumeControlPosition.value = null
    }
  }

  // Close menu if clicking outside
  if (showMenu.value) {
    const clickedInsideMenu = target.closest('.display-options-menu')
    const clickedInsideButton = menuButton.value?.contains(target)
    if (!clickedInsideMenu && !clickedInsideButton) {
      showMenu.value = false
      menuPosition.value = null
    }
  }
}

// Initialize the display store to listen for updates
onMounted(() => {
  displayStore.initialize()
  document.addEventListener('click', handleClickOutside)
})

// Clean up event listener
onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

// Check if there's any active display content (visual or audio)
const hasActiveDisplay = computed(() => {
  return (
    displayStore.hasBackground ||
    displayStore.hasPortraits ||
    displayStore.hasBackgroundMusic ||
    displayStore.backgroundSoundCount > 0 ||
    displayStore.soundEffectCount > 0
  )
})

// Check if a portrait is focused
function isFocused(portraitPath: string): boolean {
  return displayStore.displayState.focusedPortraitPath === portraitPath
}

// Handle focus toggle
async function handleFocusToggle(portraitPath: string): Promise<void> {
  // If already focused, clear the focus; otherwise set it
  if (isFocused(portraitPath)) {
    await displayStore.setFocusedPortrait(null)
  } else {
    await displayStore.setFocusedPortrait(portraitPath)
  }
}

// Clear all display content (visual and audio)
async function clearAllContent(): Promise<void> {
  await Promise.all([
    displayStore.clearAll(),
    displayStore.clearBackgroundMusic(),
    displayStore.clearAllBackgroundSounds(),
    displayStore.clearAllSoundEffects()
  ])
}

// Clear all portraits
async function clearAllPortraits(): Promise<void> {
  await displayStore.clearAllPortraits()
}

// Clear all images (backgrounds and events)
async function clearAllImages(): Promise<void> {
  await displayStore.clearAllImages()
}

// Clear all audio
async function clearAllAudio(): Promise<void> {
  await Promise.all([
    displayStore.clearBackgroundMusic(),
    displayStore.clearAllBackgroundSounds(),
    displayStore.clearAllSoundEffects()
  ])
}

// Toggle menu
function toggleMenu(): void {
  if (showMenu.value) {
    closeMenu()
  } else {
    showMenu.value = true
    if (menuButton.value) {
      menuPosition.value = calculateMenuPosition(menuButton.value)
    }
  }
}

// Close menu
function closeMenu(): void {
  showMenu.value = false
  menuPosition.value = null
}

// Calculate position for menu
function calculateMenuPosition(buttonEl: HTMLElement): { x: number; y: number } | null {
  const rect = buttonEl.getBoundingClientRect()
  const menuWidth = 256 // w-64 = 16rem = 256px
  const menuHeight = 400 // approximate height
  const margin = 12

  // Position above the button by default
  let x = rect.left + (rect.width / 2) - (menuWidth / 2)
  let y = rect.top - menuHeight - margin

  // Prevent going off the left edge
  if (x < margin) {
    x = margin
  }

  // Prevent going off the right edge
  const maxX = window.innerWidth - menuWidth - margin
  if (x > maxX) {
    x = maxX
  }

  // Prevent going off the top edge
  if (y < margin) {
    y = rect.bottom + margin // Show below instead
  }

  return { x, y }
}

// Generate preset name from current state
function generatePresetName(): string {
  const items: string[] = []

  if (displayStore.displayState.background) {
    items.push(getGMDisplayNameFromPath(displayStore.displayState.background.path, displayStore.displayState.background.displayName))
  }

  if (displayStore.displayState.portraits.length > 0) {
    const portraitNames = displayStore.displayState.portraits
      .slice(0, 2)
      .map(p => getGMDisplayNameFromPath(p.path, p.displayName))
    items.push(...portraitNames)
  }

  if (displayStore.displayState.backgroundMusic) {
    items.push(getGMDisplayNameFromPath(displayStore.displayState.backgroundMusic.path, displayStore.displayState.backgroundMusic.displayName))
  }

  if (items.length === 0) {
    return 'Empty Preset'
  }

  const name = items.slice(0, 3).join(', ')
  return items.length > 3 ? `${name}...` : name
}

// Pin current state as preset
function pinAsPreset(): void {
  const preset = {
    id: `preset-${Date.now()}`,
    type: 'preset' as const,
    category: 'presets' as const,
    path: '', // Not used for presets
    displayName: generatePresetName(),
    displayState: JSON.parse(JSON.stringify(displayStore.displayState))
  }
  pinsStore.addPin(preset)
}

// Pin images only as preset
function pinImagesAsPreset(): void {
  const name = generatePresetName()
  const preset = {
    id: `preset-images-${Date.now()}`,
    type: 'preset-images' as const,
    category: 'presets' as const,
    path: '',
    displayName: `Images: ${name}`,
    displayState: {
      background: displayStore.displayState.background,
      event: displayStore.displayState.event,
      portraits: displayStore.displayState.portraits,
      focusedPortraitPath: displayStore.displayState.focusedPortraitPath,
      backgroundMusic: null,
      backgroundSounds: [],
      soundEffects: []
    }
  }
  pinsStore.addPin(preset)
}

// Pin audio only as preset
function pinAudioAsPreset(): void {
  const name = generatePresetName()
  const preset = {
    id: `preset-audio-${Date.now()}`,
    type: 'preset-audio' as const,
    category: 'presets' as const,
    path: '',
    displayName: `Audio: ${name}`,
    displayState: {
      background: null,
      event: null,
      portraits: [],
      focusedPortraitPath: null,
      backgroundMusic: displayStore.displayState.backgroundMusic,
      backgroundSounds: displayStore.displayState.backgroundSounds,
      soundEffects: displayStore.displayState.soundEffects
    }
  }
  pinsStore.addPin(preset)
}

// Set sound card ref
function setSoundCardRef(id: string, el: any) {
  if (el && el instanceof HTMLElement) {
    soundCardRefs.set(id, el)
  } else {
    soundCardRefs.delete(id)
  }
}

// Calculate position for volume control
function calculateVolumeControlPosition(cardEl: HTMLElement | null): { x: number; y: number } | null {
  if (!cardEl) return null

  const rect = cardEl.getBoundingClientRect()
  const tooltipWidth = 224 // 56 * 4 = w-56
  const tooltipHeight = 80 // approximate height
  const margin = 12

  // Center the tooltip above the card
  let x = rect.left + (rect.width / 2) - (tooltipWidth / 2)
  let y = rect.top - tooltipHeight - margin

  // Prevent going off the left edge
  if (x < margin) {
    x = margin
  }

  // Prevent going off the right edge
  const maxX = window.innerWidth - tooltipWidth - margin
  if (x > maxX) {
    x = maxX
  }

  // Prevent going off the top edge
  if (y < margin) {
    y = rect.bottom + margin // Show below instead
  }

  return { x, y }
}

// Toggle volume control popup
function toggleVolumeControl(id: string): void {
  if (volumeControlId.value === id) {
    volumeControlId.value = null
    volumeControlPosition.value = null
  } else {
    volumeControlId.value = id

    // Calculate position based on which card was clicked
    let cardEl: HTMLElement | null = null
    if (id === 'backgroundMusic') {
      cardEl = backgroundMusicCard.value
    } else if (id.startsWith('backgroundSound-')) {
      cardEl = soundCardRefs.get(id) || null
    }

    volumeControlPosition.value = calculateVolumeControlPosition(cardEl)
  }
}

// Get volume of a media item (default to 1.0 if not set)
function getVolume(item: MediaItem | null): number {
  if (!item) return 1
  return item.volume !== undefined ? item.volume : 1
}

// Update volume for an audio item
async function updateVolume(id: string, event: Event): Promise<void> {
  const target = event.target as HTMLInputElement
  const volume = parseInt(target.value) / 100

  // Update volume via IPC
  if (id === 'backgroundMusic') {
    await displayStore.setAudioVolume('backgroundMusic', null, volume)
  } else if (id.startsWith('backgroundSound-')) {
    const soundId = id.replace('backgroundSound-', '')
    await displayStore.setAudioVolume('backgroundSound', soundId, volume)
  }
}
</script>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.3s ease-out;
}

.slide-up-enter-from {
  transform: translateY(100%);
}

.slide-up-leave-to {
  transform: translateY(100%);
}

/* Volume slider styling */
.volume-slider::-webkit-slider-thumb {
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #3b82f6;
  cursor: pointer;
  transition: background 0.2s;
}

.volume-slider::-webkit-slider-thumb:hover {
  background: #2563eb;
}

.volume-slider::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #3b82f6;
  cursor: pointer;
  border: none;
  transition: background 0.2s;
}

.volume-slider::-moz-range-thumb:hover {
  background: #2563eb;
}
</style>
