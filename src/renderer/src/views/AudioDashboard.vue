<template>
  <AppLayout>
    <div class="flex h-full">
      <!-- Media Tree Browser (Left Side) -->
      <div class="w-80 border-r border-gray-700 bg-gray-800 flex flex-col">
        <div class="p-4 border-b border-gray-700">
          <h2 class="text-lg font-semibold text-white">Audio Files</h2>
          <p class="text-sm text-gray-400">Browse by folder</p>
        </div>

        <div class="flex-1 overflow-y-auto p-4">
          <div v-if="directoryStore.isScanning" class="flex items-center justify-center h-32">
            <div class="text-center">
              <div class="animate-spin h-8 w-8 border-2 border-blue-400 border-t-transparent rounded-full mx-auto mb-2"></div>
              <p class="text-gray-400">Scanning directory...</p>
            </div>
          </div>

          <div v-else-if="filteredMediaTree" class="space-y-1">
            <MediaTreeNode
              :node="filteredMediaTree"
              :depth="0"
              @select-media="handleMediaSelect"
            />
          </div>

          <div v-else class="text-center py-8 text-gray-400">
            <p>No audio files found</p>
          </div>
        </div>
      </div>

      <!-- Audio List Display (Right Side) -->
      <div class="flex-1 flex flex-col overflow-hidden">
        <!-- Header with Display State -->
        <div class="p-4 border-b border-gray-700 bg-gray-800">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h2 class="text-lg font-semibold text-white">Audio Library</h2>
              <p class="text-sm text-gray-400">
                {{ allAudioMedia.length }} audio file{{ allAudioMedia.length !== 1 ? 's' : '' }}
              </p>
            </div>
            <button
              v-if="hasActiveAudio"
              @click="clearAllAudio"
              class="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium transition-colors"
            >
              Clear All Audio
            </button>
          </div>

          <!-- Active Audio Display -->
          <div v-if="hasActiveAudio" class="space-y-2">
            <!-- Background Music -->
            <div v-if="displayStore.hasBackgroundMusic" class="bg-pink-500/20 border border-pink-500/50 rounded-lg p-3">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <span class="text-2xl">🎵</span>
                  <div>
                    <p class="text-sm font-medium text-pink-200">Background Music</p>
                    <p class="text-xs text-pink-300">{{ displayStore.displayState.backgroundMusic ? getGMDisplayNameFromPath(displayStore.displayState.backgroundMusic.path, displayStore.displayState.backgroundMusic.displayName) : '' }}</p>
                  </div>
                </div>
                <button
                  @click="displayStore.clearBackgroundMusic()"
                  class="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-xs transition-colors"
                >
                  Stop
                </button>
              </div>
            </div>

            <!-- Background Sounds -->
            <div v-if="displayStore.backgroundSoundCount > 0" class="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-3">
              <div class="flex items-center justify-between mb-2">
                <div class="flex items-center gap-2">
                  <span class="text-xl">🔊</span>
                  <p class="text-sm font-medium text-yellow-200">Background Sounds ({{ displayStore.backgroundSoundCount }})</p>
                </div>
                <button
                  @click="displayStore.clearAllBackgroundSounds()"
                  class="px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-xs transition-colors"
                >
                  Clear All
                </button>
              </div>
              <div class="space-y-1">
                <div
                  v-for="sound in displayStore.displayState.backgroundSounds"
                  :key="sound.id"
                  class="flex items-center justify-between bg-gray-800/50 rounded px-2 py-1"
                >
                  <p class="text-xs text-yellow-100">{{ getGMDisplayNameFromPath(sound.path, sound.displayName) }}</p>
                  <button
                    @click="displayStore.clearBackgroundSound(String(sound.id))"
                    class="text-xs text-red-400 hover:text-red-300"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>

            <!-- Sound Effects -->
            <div v-if="displayStore.soundEffectCount > 0" class="bg-orange-500/20 border border-orange-500/50 rounded-lg p-3">
              <div class="flex items-center gap-2">
                <span class="text-xl">💥</span>
                <p class="text-sm font-medium text-orange-200">
                  Active Sound Effects ({{ displayStore.soundEffectCount }})
                </p>
              </div>
              <p class="text-xs text-orange-300 mt-1">Sound effects play once and auto-remove</p>
            </div>
          </div>
        </div>

        <!-- Audio List -->
        <div class="flex-1 overflow-y-auto p-4 bg-gray-900">
          <div v-if="allAudioMedia.length > 0" class="space-y-2">
            <div
              v-for="audio in allAudioMedia"
              :key="audio.path"
              @click="handleMediaSelect(audio)"
              class="group flex items-center gap-4 p-4 bg-gray-800 hover:bg-gray-750 rounded-lg cursor-pointer transition-colors border border-gray-700 hover:border-blue-500"
            >
              <!-- Icon -->
              <div class="flex-shrink-0 w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center text-2xl">
                🎵
              </div>

              <!-- Info -->
              <div class="flex-1 min-w-0">
                <p class="text-white font-medium truncate">{{ getGMDisplayName(audio) }}</p>
                <div class="flex items-center gap-2 mt-1">
                  <span class="text-xs px-2 py-0.5 rounded" :class="getBadgeClass(audio.mediaSubtype)">
                    {{ audio.mediaSubtype }}
                  </span>
                  <span class="text-xs text-gray-400 truncate">{{ getFileName(audio.path) }}</span>
                </div>
              </div>

              <!-- Play Button -->
              <div class="flex-shrink-0">
                <div class="w-10 h-10 bg-blue-600 group-hover:bg-blue-500 rounded-full flex items-center justify-center transition-colors">
                  <span class="text-white text-xl">▶</span>
                </div>
              </div>
            </div>
          </div>

          <div v-else class="flex items-center justify-center h-full">
            <div class="text-center text-gray-500">
              <p class="text-xl mb-2">🎵</p>
              <p>No audio files found in the selected directory</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import AppLayout from '../components/AppLayout.vue'
import MediaTreeNode from '../components/MediaTreeNode.vue'
import { useDirectoryStore, useDisplayStore } from '../stores'
import { filterAudioMedia, getAllAudioMedia } from '../utils/mediaFilters'
import { getGMDisplayName, getGMDisplayNameFromPath } from '../utils/displayNames'
import type { MediaFile, MediaSubtype } from '../types'

const directoryStore = useDirectoryStore()
const displayStore = useDisplayStore()

const filteredMediaTree = computed(() => {
  if (!directoryStore.mediaTree) return null
  return filterAudioMedia(directoryStore.mediaTree)
})

const allAudioMedia = computed(() => {
  return getAllAudioMedia(directoryStore.mediaTree)
})

const hasActiveAudio = computed(() => {
  return (
    displayStore.hasBackgroundMusic ||
    displayStore.backgroundSoundCount > 0 ||
    displayStore.soundEffectCount > 0
  )
})

async function handleMediaSelect(media: MediaFile) {
  if (media.type === 'file') {
    await displayStore.displayMedia(
      media.path,
      media.mediaType,
      media.mediaSubtype,
      media.displayName
    )
  }
}

async function clearAllAudio() {
  await Promise.all([
    displayStore.clearBackgroundMusic(),
    displayStore.clearAllBackgroundSounds(),
    displayStore.clearAllSoundEffects()
  ])
}

function getBadgeClass(subtype: MediaSubtype): string {
  const classes: Record<MediaSubtype, string> = {
    portrait: 'bg-blue-500/30 text-blue-200',
    background: 'bg-green-500/30 text-green-200',
    event: 'bg-purple-500/30 text-purple-200',
    loop: 'bg-yellow-500/30 text-yellow-200',
    music: 'bg-pink-500/30 text-pink-200',
    sound: 'bg-orange-500/30 text-orange-200',
    default: 'bg-gray-500/30 text-gray-200'
  }

  return classes[subtype] || classes.default
}

function getFileName(path: string): string {
  return path.split('/').pop() || path
}
</script>
