<template>
  <transition name="slide-up">
    <div
      v-if="hasActiveDisplay"
      class="fixed bottom-0 left-0 right-0 bg-gray-800/95 backdrop-blur-lg border-t border-gray-700 shadow-2xl z-50"
    >
      <div class="flex items-center gap-4 p-3 overflow-x-auto">
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
              <p class="text-gray-300 text-xs truncate">{{ displayStore.displayState.background?.displayName }}</p>
            </div>
          </div>
        </div>

        <!-- Portraits Display -->
        <div
          v-for="portrait in displayStore.displayState.portraits"
          :key="portrait.path"
          class="flex-shrink-0 relative group"
        >
          <div class="relative w-32 h-20 bg-gray-900 rounded-lg overflow-hidden">
            <img
              :src="`media://${portrait.path}`"
              :alt="portrait.displayName"
              class="w-full h-full object-cover"
            />
            <div class="absolute top-1 right-1">
              <button
                @click="displayStore.clearPortrait(portrait.path)"
                class="p-1 bg-red-600 hover:bg-red-700 rounded-full text-white text-xs transition-colors"
              >
                ✕
              </button>
            </div>
            <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
              <p class="text-white text-xs font-medium truncate">Portrait</p>
              <p class="text-gray-300 text-xs truncate">{{ portrait.displayName }}</p>
            </div>
          </div>
        </div>

        <!-- Clear All Button -->
        <div v-if="hasActiveDisplay" class="flex-shrink-0 ml-auto">
          <button
            @click="displayStore.clearAll()"
            class="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium transition-colors"
          >
            Clear All Display
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useDisplayStore } from '../stores'

const displayStore = useDisplayStore()

// Initialize the display store to listen for updates
onMounted(() => {
  displayStore.initialize()
})

// Check if there's any active display content
const hasActiveDisplay = computed(() => {
  return displayStore.hasBackground || displayStore.hasPortraits
})
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
</style>
