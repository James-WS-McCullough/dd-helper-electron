<template>
  <AppLayout>
    <div class="flex h-full">
      <!-- Audio List Display (Full Width) -->
      <div class="flex-1 flex flex-col overflow-hidden">
        <!-- Header with Display State -->
        <div class="p-4 border-b border-gray-700 bg-gray-800">
          <div class="mb-4">
            <h2 class="text-lg font-semibold text-white">Audio Library</h2>
            <p class="text-sm text-gray-400">
              {{ currentFolderAudioCount }} audio file{{ currentFolderAudioCount !== 1 ? 's' : '' }} in current folder
            </p>
          </div>

          <!-- Folder Navigation Bar -->
          <div v-if="!directoryStore.isScanning" class="bg-gray-900 rounded-lg p-3">
            <div class="flex flex-wrap items-center gap-2">
              <!-- Back Button -->
              <button
                v-if="!isInRoot"
                @click="navigateUp"
                class="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              >
                <span>←</span>
                <span>Back</span>
              </button>

              <!-- Subfolder Chips -->
              <button
                v-for="folder in currentSubfolders"
                :key="folder.path"
                @click="navigateToFolder(folder)"
                class="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              >
                <span>📁</span>
                <span>{{ folder.displayName }}</span>
              </button>

              <!-- Empty State -->
              <div v-if="currentSubfolders.length === 0 && isInRoot" class="text-sm text-gray-400">
                No subfolders
              </div>
            </div>
          </div>
        </div>

        <!-- Audio List -->
        <div class="flex-1 overflow-y-auto p-4 bg-gray-900">
          <div v-if="currentFolderAudio.length > 0" class="space-y-2">
            <div
              v-for="audio in currentFolderAudio"
              :key="audio.path"
              data-testid="audio-item"
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
              <p>No audio files in this folder</p>
              <p v-if="currentSubfolders.length > 0" class="text-sm mt-2">Select a folder above to explore</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import AppLayout from '../components/AppLayout.vue'
import { useDirectoryStore, useDisplayStore } from '../stores'
import { filterAudioMedia } from '../utils/mediaFilters'
import { getGMDisplayName } from '../utils/displayNames'
import type { MediaFile, MediaSubtype } from '../types'

const directoryStore = useDirectoryStore()
const displayStore = useDisplayStore()

// Current folder navigation state
const currentFolderPath = ref<string | null>(null)

// Get the filtered audio tree
const filteredMediaTree = computed(() => {
  if (!directoryStore.mediaTree) return null
  return filterAudioMedia(directoryStore.mediaTree)
})

// Get the current folder object
const currentFolder = computed<MediaFile | null>(() => {
  if (!filteredMediaTree.value) return null

  // If no path selected, return root
  if (!currentFolderPath.value) {
    return filteredMediaTree.value
  }

  // Find folder by path
  return findFolderByPath(filteredMediaTree.value, currentFolderPath.value)
})

// Check if we're in the root
const isInRoot = computed(() => {
  return !currentFolderPath.value
})

// Get subfolders in current folder
const currentSubfolders = computed<MediaFile[]>(() => {
  if (!currentFolder.value || !currentFolder.value.children) return []

  // Since we're already in a filtered audio tree, any folder here contains audio
  return currentFolder.value.children.filter(
    (child) => child.type === 'folder'
  )
})

// Get audio files in current folder (not recursive)
const currentFolderAudio = computed<MediaFile[]>(() => {
  if (!currentFolder.value || !currentFolder.value.children) return []

  // Files in the filtered tree are already audio files
  return currentFolder.value.children.filter(
    (child) => child.type === 'file'
  )
})

// Count of audio files in current folder
const currentFolderAudioCount = computed(() => {
  return currentFolderAudio.value.length
})

// Helper function to find folder by path
function findFolderByPath(node: MediaFile, targetPath: string): MediaFile | null {
  if (node.path === targetPath) return node

  if (node.children) {
    for (const child of node.children) {
      if (child.type === 'folder') {
        const found = findFolderByPath(child, targetPath)
        if (found) return found
      }
    }
  }

  return null
}

// Navigate to a folder
function navigateToFolder(folder: MediaFile) {
  currentFolderPath.value = folder.path
}

// Navigate up one level
function navigateUp() {
  if (!currentFolderPath.value) return

  // Get parent path by removing last segment
  const segments = currentFolderPath.value.split('/')
  segments.pop()

  if (segments.length === 0) {
    // Go to root
    currentFolderPath.value = null
  } else {
    currentFolderPath.value = segments.join('/')
  }
}

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
