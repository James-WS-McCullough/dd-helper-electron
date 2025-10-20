<template>
  <div class="flex h-screen bg-gray-900">
    <!-- Sidebar Navigation -->
    <aside class="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
      <div class="p-4 border-b border-gray-700">
        <h1 class="text-xl font-bold text-white">🎲 D&D Helper</h1>
        <p class="text-xs text-gray-400 mt-1">{{ directoryName || 'No directory selected' }}</p>
      </div>

      <nav class="flex-1 p-4 space-y-2 overflow-y-auto">
        <router-link
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
          :class="{ 'bg-blue-600 text-white': $route.path === item.path }"
        >
          <span class="text-xl">{{ item.icon }}</span>
          <span class="font-medium">{{ item.label }}</span>
        </router-link>
      </nav>
    </aside>

    <!-- Main Content with Pins Sidebar -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <div class="flex-1 flex overflow-hidden">
        <main class="flex-1 flex flex-col overflow-hidden">
          <slot />
        </main>

        <!-- Pins Sidebar (only show when there are pinned items) -->
        <PinsSidebar v-if="pinsStore.pinnedItems.length > 0" />
      </div>

      <!-- Global Display Status Bar -->
      <DisplayStatusBar />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDirectoryStore, usePinsStore } from '../stores'
import DisplayStatusBar from './DisplayStatusBar.vue'
import PinsSidebar from './PinsSidebar.vue'

const directoryStore = useDirectoryStore()
const pinsStore = usePinsStore()

const directoryName = computed(() => {
  if (directoryStore.currentDirectory) {
    const parts = directoryStore.currentDirectory.split('/')
    return parts[parts.length - 1]
  }
  return null
})

const navItems = [
  { path: '/images', icon: '🖼️', label: 'Images' },
  { path: '/audio', icon: '🎵', label: 'Audio' },
  { path: '/party', icon: '👥', label: 'Party' },
  { path: '/encounters', icon: '⚔️', label: 'Encounters' },
  { path: '/initiative', icon: '🎯', label: 'Initiative' },
  { path: '/battlemap', icon: '🗺️', label: 'Battlemap' }
]
</script>
