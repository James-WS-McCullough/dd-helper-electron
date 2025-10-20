<template>
  <AppLayout>
    <div class="flex h-full">
      <!-- Media Tree Browser (Left Side) -->
      <div class="w-80 border-r border-gray-700 bg-gray-800 flex flex-col">
        <div class="p-4 border-b border-gray-700">
          <h2 class="text-lg font-semibold text-white">Images & Videos</h2>
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
            <p>No images or videos found</p>
          </div>
        </div>
      </div>

      <!-- Image Grid Display (Right Side) -->
      <div class="flex-1 flex flex-col overflow-hidden">
        <!-- Header -->
        <div class="p-4 border-b border-gray-700 bg-gray-800">
          <h2 class="text-lg font-semibold text-white">Gallery</h2>
          <p class="text-sm text-gray-400">
            {{ allVisualMedia.length }} image{{ allVisualMedia.length !== 1 ? 's' : '' }} and video{{ allVisualMedia.length !== 1 ? 's' : '' }}
          </p>
        </div>

        <!-- Image Grid -->
        <div class="flex-1 overflow-y-auto p-6 bg-gray-900">
          <div v-if="allVisualMedia.length > 0" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            <div
              v-for="media in allVisualMedia"
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
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import AppLayout from '../components/AppLayout.vue'
import MediaTreeNode from '../components/MediaTreeNode.vue'
import { useDirectoryStore, useDisplayStore } from '../stores'
import { filterVisualMedia, getAllVisualMedia } from '../utils/mediaFilters'
import type { MediaFile, MediaSubtype } from '../types'

const directoryStore = useDirectoryStore()
const displayStore = useDisplayStore()

const filteredMediaTree = computed(() => {
  if (!directoryStore.mediaTree) return null
  return filterVisualMedia(directoryStore.mediaTree)
})

const allVisualMedia = computed(() => {
  return getAllVisualMedia(directoryStore.mediaTree)
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
