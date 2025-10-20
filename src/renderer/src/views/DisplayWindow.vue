<template>
  <div class="min-h-screen bg-black relative overflow-hidden">
    <!-- Background Layer -->
    <div v-if="displayStore.hasBackground" class="absolute inset-0 z-0">
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
        autoplay
        muted
        loop
      />
    </div>

    <!-- Event Video Layer -->
    <div
      v-if="displayStore.hasEvent"
      class="absolute inset-0 z-10 bg-black flex items-center justify-center"
    >
      <video
        :src="`media://${displayStore.displayState.event?.path}`"
        class="max-w-full max-h-full"
        autoplay
        @ended="displayStore.clearEvent()"
      />
    </div>

    <!-- Portraits Layer -->
    <div v-if="displayStore.hasPortraits && !displayStore.hasEvent" class="absolute inset-0 z-20 flex flex-col p-8 gap-4">
      <!-- Focused Portrait (Large, Centered) - Takes 2/3 of screen -->
      <div v-if="displayStore.focusedPortrait" class="flex-[2] flex items-center justify-center min-h-0">
        <div class="bg-gray-900/80 rounded-lg p-3 backdrop-blur-sm flex flex-col items-center max-w-full max-h-full">
          <img
            :src="`media://${displayStore.focusedPortrait.path}`"
            :alt="displayStore.focusedPortrait.displayName"
            class="max-h-[50vh] max-w-[90vw] w-auto object-contain rounded"
          />
          <p class="text-white text-center text-6xl font-semibold mt-3">{{ cleanDisplayName(displayStore.focusedPortrait.displayName) }}</p>
        </div>
      </div>

      <!-- Other Portraits (Small Row at Bottom) - Takes ~1/3 of screen -->
      <div v-if="otherPortraits.length > 0" class="flex-1 flex items-end justify-center gap-3 min-h-0">
        <div
          v-for="(portrait, index) in otherPortraits"
          :key="index"
          class="bg-gray-900/80 rounded-lg p-3 backdrop-blur-sm h-full flex flex-col items-center justify-end"
        >
          <img
            :src="`media://${portrait.path}`"
            :alt="portrait.displayName"
            class="max-h-[calc(100%-4rem)] w-auto object-contain rounded"
          />
          <p class="text-white text-center text-4xl font-semibold mt-2 h-16 flex items-center">{{ cleanDisplayName(portrait.displayName) }}</p>
        </div>
      </div>
    </div>

    <!-- Audio Elements -->
    <audio
      v-if="displayStore.hasBackgroundMusic"
      :src="`media://${displayStore.displayState.backgroundMusic?.path}`"
      autoplay
      loop
    />

    <audio
      v-for="sound in displayStore.displayState.backgroundSounds"
      :key="sound.id"
      :src="`media://${sound.path}`"
      autoplay
      loop
    />

    <audio
      v-for="effect in displayStore.displayState.soundEffects"
      :key="effect.id"
      :src="`media://${effect.path}`"
      autoplay
      @ended="displayStore.clearSoundEffect(String(effect.id))"
    />

    <!-- Placeholder when nothing is displayed -->
    <div
      v-if="!displayStore.hasBackground && !displayStore.hasEvent && !displayStore.hasPortraits"
      class="absolute inset-0 flex items-center justify-center z-0"
    >
      <div class="text-center text-gray-600">
        <p class="text-9xl mb-4">🎲</p>
        <p class="text-5xl font-semibold">D&D Helper Display</p>
        <p class="text-3xl mt-2">Waiting for content...</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, computed } from 'vue'
import { useDisplayStore } from '../stores'
import type { DisplayState } from '../types'

const displayStore = useDisplayStore()

// Get portraits that are not focused
const otherPortraits = computed(() => {
  if (!displayStore.displayState.focusedPortraitPath) {
    return displayStore.displayState.portraits
  }
  return displayStore.displayState.portraits.filter(
    p => p.path !== displayStore.displayState.focusedPortraitPath
  )
})

// Clean display name by replacing underscores with spaces
function cleanDisplayName(displayName: string): string {
  return displayName.replace(/_/g, ' ')
}

// Listen for display updates from the main process
onMounted(() => {
  // Set up listener for direct updates to this display window
  window.electronAPI.onUpdateDisplay((_event, state: DisplayState) => {
    displayStore.displayState = state
  })

  // Initialize the store to get current state
  displayStore.initialize()
})

onUnmounted(() => {
  // Clean up listeners when component is destroyed
  window.electronAPI.removeDisplayListeners()
})
</script>
