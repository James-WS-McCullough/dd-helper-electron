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
      <div class="flex-[2] flex items-center justify-center min-h-0">
        <Transition name="portrait-focus" mode="out-in">
          <div
            v-if="displayStore.focusedPortrait"
            :key="displayStore.focusedPortrait.path"
            class="bg-gray-900/80 rounded-lg p-3 backdrop-blur-sm flex flex-col items-center max-w-full max-h-full"
          >
            <img
              :src="`media://${displayStore.focusedPortrait.path}`"
              :alt="displayStore.focusedPortrait.displayName"
              class="max-h-[50vh] max-w-[90vw] w-auto object-contain rounded"
            />
            <p class="text-white text-center text-6xl font-semibold mt-3">{{ cleanDisplayName(displayStore.focusedPortrait.displayName) }}</p>
          </div>
        </Transition>
      </div>

      <!-- Other Portraits (Small Row at Bottom) - Takes ~1/3 of screen -->
      <div class="flex-1 flex items-end justify-center gap-3 min-h-0">
        <TransitionGroup name="portrait-list" tag="div" class="flex items-end justify-center gap-3 h-full">
          <div
            v-for="portrait in otherPortraits"
            :key="portrait.path"
            class="bg-gray-900/80 rounded-lg p-3 backdrop-blur-sm h-full flex flex-col items-center justify-end portrait-card"
          >
            <img
              :src="`media://${portrait.path}`"
              :alt="portrait.displayName"
              class="max-h-[calc(100%-4rem)] w-auto object-contain rounded"
            />
            <p class="text-white text-center text-4xl font-semibold mt-2 h-16 flex items-center">{{ cleanDisplayName(portrait.displayName) }}</p>
          </div>
        </TransitionGroup>
      </div>
    </div>

    <!-- Audio Elements -->
    <!-- Background Music (current and fading out) -->
    <audio
      v-for="music in allBackgroundMusic"
      :key="music.path"
      :ref="(el) => setMusicRef(music.path, el)"
      :src="`media://${music.path}`"
      loop
    />

    <!-- Background Sounds (active + fading out) -->
    <audio
      v-for="sound in [...displayStore.displayState.backgroundSounds, ...fadingOutBackgroundSounds]"
      :key="sound.id"
      :ref="(el) => setAudioRef(`backgroundSound-${sound.id}`, el)"
      :src="`media://${sound.path}`"
      loop
    />

    <audio
      v-for="effect in displayStore.displayState.soundEffects"
      :key="effect.id"
      :ref="(el) => setEffectRef(`soundEffect-${effect.id}`, el)"
      :src="`media://${effect.path}`"
      @ended="displayStore.clearSoundEffect(String(effect.id))"
    />

    <!-- Placeholder when nothing is displayed -->
    <div
      v-if="!displayStore.hasBackground && !displayStore.hasEvent && !displayStore.hasPortraits && showPlaceholder"
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
import { onMounted, onUnmounted, computed, ref, watch } from 'vue'
import { useDisplayStore } from '../stores'
import type { DisplayState, MediaItem } from '../types'

const displayStore = useDisplayStore()

// Placeholder visibility (hide after 10 seconds)
const showPlaceholder = ref(true)

// Audio element refs
const musicRefs = new Map<string, HTMLAudioElement>()
const audioRefs = new Map<string, HTMLAudioElement>()
const effectRefs = new Map<string, HTMLAudioElement>()
const fadingAudioElements = new Set<HTMLAudioElement>()

// Local state for audio items that are fading out (keep them mounted)
const fadingOutBackgroundMusic = ref<any>(null)
const fadingOutBackgroundSounds = ref<any[]>([])

// Combined list of all background music (current + fading out)
const allBackgroundMusic = computed<MediaItem[]>(() => {
  const result: MediaItem[] = []
  if (displayStore.displayState.backgroundMusic) {
    result.push(displayStore.displayState.backgroundMusic)
  }
  if (fadingOutBackgroundMusic.value) {
    result.push(fadingOutBackgroundMusic.value)
  }
  return result
})

// Fade constants
const FADE_DURATION = 1500 // 1.5 seconds
const FADE_INTERVAL = 50 // Update every 50ms

// Track which music/sounds are being faded in
const fadingInPaths = new Set<string>()

// Function to set music ref (by path)
function setMusicRef(path: string, el: any) {
  if (el && el instanceof HTMLAudioElement) {
    const isNew = !musicRefs.has(path)
    musicRefs.set(path, el)

    // Start playback if this is a new element
    if (isNew) {
      // Check if this should fade in (it's the current music, not fading out)
      if (displayStore.displayState.backgroundMusic?.path === path && fadingInPaths.has(path)) {
        el.volume = 0
        el.play().catch(err => console.error('Failed to play music:', err))
      } else if (fadingOutBackgroundMusic.value?.path !== path) {
        // Normal playback for existing/old music
        const targetVolume = displayStore.displayState.backgroundMusic?.volume ?? 1
        el.volume = targetVolume
        el.play().catch(err => console.error('Failed to play music:', err))
      }
    }
  } else {
    musicRefs.delete(path)
  }
}

// Function to set audio ref for looping sounds
function setAudioRef(id: string, el: any) {
  if (el && el instanceof HTMLAudioElement) {
    const isNew = !audioRefs.has(id)
    audioRefs.set(id, el)

    // Start playback if this is a new element
    if (isNew) {
      // Find the sound in the state to get its volume
      const soundId = id.replace('backgroundSound-', '')
      const sound = displayStore.displayState.backgroundSounds.find(s => String(s.id) === soundId)
      if (sound) {
        el.volume = sound.volume ?? 1
        el.play().catch(err => console.error('Failed to play sound:', err))
      }
    }
  } else {
    audioRefs.delete(id)
  }
}

// Function to set audio ref for sound effects
function setEffectRef(id: string, el: any) {
  if (el && el instanceof HTMLAudioElement) {
    const isNew = !effectRefs.has(id)
    effectRefs.set(id, el)

    // Start playback if this is a new element
    if (isNew) {
      // Find the effect in the state to get its volume
      const effectId = id.replace('soundEffect-', '')
      const effect = displayStore.displayState.soundEffects.find(e => String(e.id) === effectId)
      if (effect) {
        el.volume = effect.volume ?? 1
        el.play().catch(err => console.error('Failed to play effect:', err))
      }
    }
  } else {
    effectRefs.delete(id)
  }
}

// Fade out an audio element
async function fadeOutAudio(audioElement: HTMLAudioElement): Promise<void> {
  if (fadingAudioElements.has(audioElement)) return
  fadingAudioElements.add(audioElement)

  const startVolume = audioElement.volume
  const steps = FADE_DURATION / FADE_INTERVAL
  const volumeDecrement = startVolume / steps

  return new Promise((resolve) => {
    const fadeInterval = setInterval(() => {
      if (audioElement.volume > volumeDecrement) {
        audioElement.volume = Math.max(0, audioElement.volume - volumeDecrement)
      } else {
        audioElement.volume = 0
        audioElement.pause()
        clearInterval(fadeInterval)
        fadingAudioElements.delete(audioElement)
        resolve()
      }
    }, FADE_INTERVAL)
  })
}

// Fade in an audio element
async function fadeInAudio(audioElement: HTMLAudioElement, targetVolume: number): Promise<void> {
  if (fadingAudioElements.has(audioElement)) return
  fadingAudioElements.add(audioElement)

  audioElement.volume = 0
  const steps = FADE_DURATION / FADE_INTERVAL
  const volumeIncrement = targetVolume / steps

  return new Promise((resolve) => {
    const fadeInterval = setInterval(() => {
      if (audioElement.volume < targetVolume - volumeIncrement) {
        audioElement.volume = Math.min(targetVolume, audioElement.volume + volumeIncrement)
      } else {
        audioElement.volume = targetVolume
        clearInterval(fadeInterval)
        fadingAudioElements.delete(audioElement)
        resolve()
      }
    }, FADE_INTERVAL)
  })
}

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

// Handle volume change from IPC
function handleVolumeChange(
  _event: any,
  audioType: 'backgroundMusic' | 'backgroundSound',
  audioId: string | null,
  volume: number
) {
  if (audioType === 'backgroundMusic') {
    // Update volume for current music (if it exists)
    const currentMusic = displayStore.displayState.backgroundMusic
    if (currentMusic) {
      const audioElement = musicRefs.get(currentMusic.path)
      if (audioElement) {
        audioElement.volume = volume
      }
    }
  } else if (audioType === 'backgroundSound' && audioId) {
    const audioElement = audioRefs.get(`backgroundSound-${audioId}`)
    if (audioElement) {
      audioElement.volume = volume
    }
  }
}

// Watch for background music changes (cross-fade or fade-out)
watch(
  () => displayStore.displayState.backgroundMusic,
  async (newMusic, oldMusic) => {
    if (oldMusic && !newMusic) {
      // Music is being removed - fade it out
      fadingOutBackgroundMusic.value = oldMusic
      await new Promise(resolve => setTimeout(resolve, 50))

      const oldAudioElement = musicRefs.get(oldMusic.path)
      if (oldAudioElement) {
        await fadeOutAudio(oldAudioElement)
      }
      fadingOutBackgroundMusic.value = null
    } else if (oldMusic && newMusic && oldMusic.path !== newMusic.path) {
      // Music is changing - cross-fade
      // Mark new music for fade-in (so it starts at volume 0)
      fadingInPaths.add(newMusic.path)

      // Set the old music as "fading out" so both elements stay mounted
      fadingOutBackgroundMusic.value = oldMusic

      await new Promise(resolve => setTimeout(resolve, 100))

      // Get references to both audio elements
      const oldAudioElement = musicRefs.get(oldMusic.path)
      const newAudioElement = musicRefs.get(newMusic.path)

      // Start fade out of old music and fade in of new music in parallel
      const fadeOutPromise = oldAudioElement
        ? fadeOutAudio(oldAudioElement)
        : Promise.resolve()

      const fadeInPromise = (async () => {
        if (newAudioElement) {
          const targetVolume = newMusic.volume ?? 1
          await fadeInAudio(newAudioElement, targetVolume)
        }
      })()

      // Wait for both fades to complete
      await Promise.all([fadeOutPromise, fadeInPromise])

      // Clean up fading out state
      fadingOutBackgroundMusic.value = null
      fadingInPaths.delete(newMusic.path)
    } else if (!oldMusic && newMusic) {
      // First music being added - mark for fade-in
      fadingInPaths.add(newMusic.path)

      await new Promise(resolve => setTimeout(resolve, 100))

      const newAudioElement = musicRefs.get(newMusic.path)
      if (newAudioElement) {
        const targetVolume = newMusic.volume ?? 1
        await fadeInAudio(newAudioElement, targetVolume)
      }

      fadingInPaths.delete(newMusic.path)
    }
  }
)

// Watch for background sounds removal (fade-out)
watch(
  () => displayStore.displayState.backgroundSounds,
  async (newSounds, oldSounds) => {
    if (!oldSounds) return

    // Find sounds that were removed
    const removedSounds = oldSounds.filter(
      oldSound => !newSounds.some(newSound => newSound.id === oldSound.id)
    )

    if (removedSounds.length > 0) {
      // Add to fading out list
      fadingOutBackgroundSounds.value = [...fadingOutBackgroundSounds.value, ...removedSounds]

      await new Promise(resolve => setTimeout(resolve, 100))

      // Fade out each removed sound
      const fadePromises = removedSounds.map(async sound => {
        const audioElement = audioRefs.get(`backgroundSound-${sound.id}`)
        if (audioElement) {
          await fadeOutAudio(audioElement)
        }
        // Remove from fading out list
        fadingOutBackgroundSounds.value = fadingOutBackgroundSounds.value.filter(
          s => s.id !== sound.id
        )
      })

      await Promise.all(fadePromises)
    }
  },
  { deep: true }
)

// Listen for display updates from the main process
onMounted(() => {
  // Set up listener for direct updates to this display window
  window.electronAPI.onUpdateDisplay((_event, state: DisplayState) => {
    displayStore.displayState = state
  })

  // Listen for volume changes
  window.electronAPI.onSetAudioVolume(handleVolumeChange)

  // Initialize the store to get current state
  displayStore.initialize()

  // Hide placeholder text after 10 seconds
  setTimeout(() => {
    showPlaceholder.value = false
  }, 10000)
})

onUnmounted(() => {
  // Clean up listeners when component is destroyed
  window.electronAPI.removeDisplayListeners()
})
</script>

<style scoped>
/* Focused Portrait Transitions */
.portrait-focus-enter-active,
.portrait-focus-leave-active {
  transition: all 0.6s ease;
}

.portrait-focus-enter-from {
  opacity: 0;
  transform: translateY(30vh) scale(0.5);
}

.portrait-focus-leave-to {
  opacity: 0;
  transform: translateY(30vh) scale(0.5);
}

/* Unfocused Portrait List Transitions */
.portrait-list-enter-active,
.portrait-list-leave-active {
  transition: all 0.5s ease;
}

.portrait-list-enter-from {
  opacity: 0;
  transform: scale(0.8);
}

.portrait-list-leave-to {
  opacity: 0;
  transform: scale(0.8);
}

/* Move transition for repositioning */
.portrait-list-move {
  transition: transform 0.5s ease;
}

/* Ensure leaving items are taken out of layout flow */
.portrait-list-leave-active {
  position: absolute;
}
</style>
