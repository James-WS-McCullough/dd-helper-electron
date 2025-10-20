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

      <div class="p-4 border-t border-gray-700">
        <button
          @click="openDisplayWindow"
          class="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition-colors"
        >
          <span class="text-xl">📺</span>
          <span>Display Window</span>
        </button>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="flex-1 flex flex-col overflow-hidden">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDirectoryStore, useDisplayStore } from '../stores'

const directoryStore = useDirectoryStore()
const displayStore = useDisplayStore()

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

async function openDisplayWindow() {
  await displayStore.openDisplayWindow()
}
</script>
