<template>
  <AppLayout>
    <div class="flex flex-col h-full">
      <!-- Header -->
      <div class="p-4 border-b border-gray-700 bg-gray-800">
        <h2 class="text-lg font-semibold text-white">Gallery</h2>
        <div class="flex items-center justify-between">
          <p class="text-sm text-gray-400">
            {{ currentFolderPath || 'Root' }}
          </p>
          <p class="text-sm text-gray-400">
            {{ currentItems.files.length }} image{{ currentItems.files.length !== 1 ? 's' : '' }} · {{ currentItems.folders.length }} folder{{ currentItems.folders.length !== 1 ? 's' : '' }}
          </p>
        </div>
      </div>

      <!-- Image Grid -->
      <div class="flex-1 overflow-y-auto p-6 bg-gray-900">
        <div v-if="directoryStore.isScanning" class="flex items-center justify-center h-full">
          <div class="text-center">
            <div class="animate-spin h-12 w-12 border-2 border-blue-400 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p class="text-gray-400">Scanning directory...</p>
          </div>
        </div>

        <div v-else-if="currentItems.folders.length > 0 || currentItems.files.length > 0 || currentFolderPath" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          <!-- Back Button -->
          <div
            v-if="currentFolderPath"
            @click="navigateUp"
            class="group relative aspect-square bg-gray-800 rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-purple-500 transition-all flex items-center justify-center"
          >
            <div class="text-center">
              <span class="text-6xl">⬆️</span>
              <p class="text-white text-sm font-medium mt-2">Back</p>
            </div>
          </div>

          <!-- Folders -->
          <div
            v-for="folder in currentItems.folders"
            :key="folder.path"
            @click="navigateInto(folder)"
            class="group relative aspect-square bg-gray-800 rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-yellow-500 transition-all flex items-center justify-center"
          >
            <div class="text-center px-2">
              <span class="text-6xl">📁</span>
              <p class="text-white text-sm font-medium mt-2 truncate">{{ folder.displayName }}</p>
            </div>
          </div>

          <!-- Images and Videos -->
          <div
            v-for="media in currentItems.files"
            :key="media.path"
            @click="handleMediaSelect(media)"
            class="group relative aspect-square bg-gray-800 rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all"
          >
              <!-- Image/Video Thumbnail -->
              <img
                v-if="media.mediaType === 'image'"
                :src="`media://${media.path}`"
                :alt="media.displayName"
                class="w-full h-full object-cover"
                loading="lazy"
              />
              <video
                v-else-if="media.mediaType === 'video'"
                :src="`media://${media.path}`"
                class="w-full h-full object-cover"
                muted
              />

              <!-- Overlay -->
              <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <div class="absolute bottom-0 left-0 right-0 p-3">
                  <p class="text-white text-sm font-medium truncate">{{ media.displayName }}</p>
                  <div class="flex items-center gap-2 mt-1">
                    <span class="text-xs px-2 py-0.5 rounded" :class="getBadgeClass(media.mediaSubtype)">
                      {{ media.mediaSubtype }}
                    </span>
                    <span class="text-xs text-gray-300">
                      {{ media.mediaType === 'video' ? '🎬' : '🖼️' }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Play icon for videos -->
              <div v-if="media.mediaType === 'video'" class="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div class="bg-black/50 rounded-full p-4">
                  <span class="text-4xl">▶️</span>
                </div>
              </div>
            </div>
          </div>

        <div v-else class="flex items-center justify-center h-full">
          <div class="text-center text-gray-500">
            <p class="text-xl mb-2">📷</p>
            <p>No images or videos found in the selected directory</p>
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
import { filterVisualMedia } from '../utils/mediaFilters'
import type { MediaFile, MediaSubtype } from '../types'

const directoryStore = useDirectoryStore()
const displayStore = useDisplayStore()

// Current folder path (relative to root, empty string = root)
const currentFolderPath = ref<string>('')

const filteredMediaTree = computed(() => {
  if (!directoryStore.mediaTree) return null
  return filterVisualMedia(directoryStore.mediaTree)
})

// Get the current folder node based on currentFolderPath
const currentFolderNode = computed<MediaFile | null>(() => {
  if (!filteredMediaTree.value) return null
  if (!currentFolderPath.value) return filteredMediaTree.value

  // Navigate to the current folder
  const pathParts = currentFolderPath.value.split('/').filter(p => p)
  let node = filteredMediaTree.value

  for (const part of pathParts) {
    const child = node.children?.find(c => c.displayName === part)
    if (!child || child.type !== 'folder') return null
    node = child
  }

  return node
})

// Get immediate children (folders and files) of current folder
const currentItems = computed<{ folders: MediaFile[], files: MediaFile[] }>(() => {
  const node = currentFolderNode.value
  if (!node || !node.children) {
    return { folders: [], files: [] }
  }

  const folders = node.children.filter(c => c.type === 'folder')
  const files = node.children.filter(c => c.type === 'file')

  return { folders, files }
})

function navigateInto(folder: MediaFile) {
  if (folder.type !== 'folder') return

  if (currentFolderPath.value) {
    currentFolderPath.value = `${currentFolderPath.value}/${folder.displayName}`
  } else {
    currentFolderPath.value = folder.displayName
  }
}

function navigateUp() {
  const parts = currentFolderPath.value.split('/').filter(p => p)
  parts.pop() // Remove last part
  currentFolderPath.value = parts.join('/')
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
</script>
