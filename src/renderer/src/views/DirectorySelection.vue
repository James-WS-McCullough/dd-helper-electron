<template>
  <div class="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-purple-900 flex items-center justify-center px-4">
    <div class="max-w-2xl w-full">
      <div class="text-center mb-8">
        <h1 class="text-6xl font-bold text-white mb-4">🎲 D&D Helper</h1>
        <p class="text-xl text-purple-200">
          Select your campaign directory to get started
        </p>
      </div>

      <div class="bg-white/10 backdrop-blur-lg rounded-xl p-8 border border-white/20 shadow-2xl">
        <div class="space-y-6">
          <!-- Directory Selection -->
          <div>
            <button
              @click="handleSelectDirectory"
              :disabled="isLoading"
              class="w-full flex items-center justify-center gap-3 px-6 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-semibold text-lg transition-colors"
            >
              <span class="text-2xl">📁</span>
              <span v-if="isLoading">Loading...</span>
              <span v-else-if="directoryStore.currentDirectory">Change Directory</span>
              <span v-else>Select Campaign Directory</span>
            </button>
          </div>

          <!-- Current Directory Display -->
          <div v-if="directoryStore.currentDirectory" class="bg-green-500/20 border border-green-500/50 rounded-lg p-4">
            <h3 class="text-sm font-semibold text-green-300 mb-2">Selected Directory:</h3>
            <p class="text-green-100 font-mono text-sm break-all">
              {{ directoryStore.currentDirectory }}
            </p>
          </div>

          <!-- Error Display -->
          <div v-if="directoryStore.scanError" class="bg-red-500/20 border border-red-500/50 rounded-lg p-4">
            <h3 class="text-sm font-semibold text-red-300 mb-2">Error:</h3>
            <p class="text-red-100 text-sm">{{ directoryStore.scanError }}</p>
          </div>

          <!-- Scanning Status -->
          <div v-if="directoryStore.isScanning" class="bg-blue-500/20 border border-blue-500/50 rounded-lg p-4">
            <div class="flex items-center gap-3">
              <div class="animate-spin h-5 w-5 border-2 border-blue-400 border-t-transparent rounded-full"></div>
              <span class="text-blue-200">Scanning directory for media files...</span>
            </div>
          </div>

          <!-- Continue Button -->
          <div v-if="directoryStore.hasDirectory && !directoryStore.isScanning">
            <button
              @click="handleContinueToDashboard"
              :disabled="isNavigating"
              class="w-full flex items-center justify-center gap-3 px-6 py-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-semibold text-lg transition-colors"
            >
              <span class="text-2xl">✓</span>
              <span v-if="isNavigating">Opening Display...</span>
              <span v-else>Continue to Dashboard</span>
            </button>
          </div>

          <!-- Info Box -->
          <div class="bg-purple-500/20 border border-purple-500/50 rounded-lg p-4 mt-6">
            <h3 class="text-sm font-semibold text-purple-300 mb-2">📝 About D&D Helper</h3>
            <p class="text-purple-200 text-sm leading-relaxed">
              This app helps you manage your D&D campaigns with media organization,
              party tracking, encounter management, and a tactical battlemap.
              Select a directory containing your campaign media to begin.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useDirectoryStore, useDisplayStore } from '../stores'

const router = useRouter()
const directoryStore = useDirectoryStore()
const displayStore = useDisplayStore()
const isLoading = ref(false)
const isNavigating = ref(false)

async function handleSelectDirectory() {
  isLoading.value = true
  try {
    await directoryStore.selectDirectory()
  } finally {
    isLoading.value = false
  }
}

async function handleContinueToDashboard() {
  isNavigating.value = true
  try {
    // Open the display window first
    await displayStore.openDisplayWindow()

    // Then navigate to images dashboard
    await router.push('/images')
  } catch (error) {
    console.error('Failed to navigate to dashboard:', error)
  } finally {
    isNavigating.value = false
  }
}
</script>
