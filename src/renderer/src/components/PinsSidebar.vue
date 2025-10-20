<template>
  <div class="w-64 bg-gray-800 border-l border-gray-700 flex flex-col h-full">
    <!-- Header -->
    <div class="p-4 border-b border-gray-700">
      <h3 class="text-lg font-semibold text-white">Quick Pins</h3>
      <p class="text-xs text-gray-400 mt-1">{{ pinsStore.pinnedItems.length }} pinned</p>
    </div>

    <!-- Pinned Items List -->
    <div class="flex-1 overflow-y-auto p-2">
      <div v-if="pinsStore.pinnedItems.length === 0" class="flex items-center justify-center h-full">
        <div class="text-center text-gray-500 px-4">
          <p class="text-3xl mb-2">📌</p>
          <p class="text-sm">No pinned items</p>
          <p class="text-xs mt-1">Pin items for quick access</p>
        </div>
      </div>

      <div v-else class="space-y-1">
        <!-- Image Pins Section -->
        <div v-if="pinsStore.imagePins.length > 0">
          <div class="px-2 py-1 text-xs font-semibold text-gray-400 uppercase">Images</div>
          <div
            v-for="pin in pinsStore.imagePins"
            :key="pin.id"
            class="group relative bg-gray-900 hover:bg-gray-750 rounded-lg overflow-hidden cursor-pointer transition-colors"
          >
            <div class="flex items-center gap-2 p-2" @click="handleTriggerPin(pin)">
              <!-- Thumbnail/Icon -->
              <div class="flex-shrink-0 w-12 h-12 rounded overflow-hidden" :class="pin.type === 'folder' ? 'flex items-center justify-center' : ''" :style="pin.type === 'folder' ? '' : 'background: #1f2937'">
                <!-- Image Thumbnail -->
                <img
                  v-if="pin.type === 'image'"
                  :src="`media://${pin.path}`"
                  :alt="pin.displayName"
                  class="w-full h-full object-cover"
                />
                <!-- Video Thumbnail -->
                <video
                  v-else-if="pin.type === 'video'"
                  :src="`media://${pin.path}`"
                  class="w-full h-full object-cover"
                  muted
                />
                <!-- Folder Icon -->
                <div v-else class="w-full h-full flex items-center justify-center text-2xl" :class="getIconBackground(pin)">
                  {{ getIcon(pin) }}
                </div>
              </div>

              <!-- Info -->
              <div class="flex-1 min-w-0">
                <p class="text-white text-sm font-medium truncate">{{ pin.displayName }}</p>
                <span class="text-xs px-1.5 py-0.5 rounded" :class="getBadgeClass(pin)">
                  {{ pin.type }}
                </span>
              </div>
            </div>

            <!-- Remove Button -->
            <button
              @click.stop="pinsStore.removePin(pin.id)"
              class="absolute top-1 right-1 p-1 bg-red-600 hover:bg-red-700 rounded opacity-0 group-hover:opacity-100 transition-opacity"
              title="Unpin"
            >
              <span class="text-white text-xs">✕</span>
            </button>
          </div>
        </div>

        <!-- Audio Pins Section -->
        <div v-if="pinsStore.audioPins.length > 0" class="mt-4">
          <div class="px-2 py-1 text-xs font-semibold text-gray-400 uppercase">Audio</div>
          <div
            v-for="pin in pinsStore.audioPins"
            :key="pin.id"
            class="group relative bg-gray-900 hover:bg-gray-750 rounded-lg p-2 cursor-pointer transition-colors"
          >
            <div class="flex items-center gap-2" @click="handleTriggerPin(pin)">
              <!-- Icon -->
              <div class="flex-shrink-0 w-8 h-8 rounded flex items-center justify-center text-lg" :class="getIconBackground(pin)">
                {{ getIcon(pin) }}
              </div>

              <!-- Info -->
              <div class="flex-1 min-w-0">
                <p class="text-white text-sm font-medium truncate">{{ pin.displayName }}</p>
                <span class="text-xs px-1.5 py-0.5 rounded" :class="getBadgeClass(pin)">
                  {{ pin.type }}
                </span>
              </div>
            </div>

            <!-- Remove Button -->
            <button
              @click.stop="pinsStore.removePin(pin.id)"
              class="absolute top-1 right-1 p-1 bg-red-600 hover:bg-red-700 rounded opacity-0 group-hover:opacity-100 transition-opacity"
              title="Unpin"
            >
              <span class="text-white text-xs">✕</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { usePinsStore, useDisplayStore } from '../stores'
import { useRouter } from 'vue-router'
import type { PinnedItem } from '../stores/pins'

const pinsStore = usePinsStore()
const displayStore = useDisplayStore()
const router = useRouter()

function getIcon(pin: PinnedItem): string {
  if (pin.type === 'folder') return '📁'
  if (pin.type === 'audio') return '🎵'
  if (pin.type === 'image') return '🖼️'
  if (pin.type === 'video') return '🎬'
  return '📄'
}

function getIconBackground(pin: PinnedItem): string {
  if (pin.type === 'folder') return 'bg-blue-900/30'
  if (pin.type === 'audio') return 'bg-pink-900/30'
  if (pin.type === 'image') return 'bg-green-900/30'
  if (pin.type === 'video') return 'bg-purple-900/30'
  return 'bg-gray-700'
}

function getBadgeClass(pin: PinnedItem): string {
  if (pin.type === 'folder') return 'bg-blue-500/30 text-blue-200'
  if (pin.type === 'audio') return 'bg-pink-500/30 text-pink-200'
  if (pin.type === 'image') return 'bg-green-500/30 text-green-200'
  if (pin.type === 'video') return 'bg-purple-500/30 text-purple-200'
  return 'bg-gray-500/30 text-gray-200'
}

async function handleTriggerPin(pin: PinnedItem) {
  if (pin.type === 'folder') {
    // Navigate to the appropriate view and folder
    const route = pin.category === 'images' ? '/images' : '/audio'
    await router.push({
      path: route,
      query: { folder: pin.path }
    })
  } else {
    // Trigger the media item (play/display)
    await displayStore.displayMedia(
      pin.path,
      pin.mediaType || pin.type,
      pin.mediaSubtype || 'default',
      pin.displayName
    )
  }
}
</script>
