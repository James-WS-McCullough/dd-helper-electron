<template>
  <div class="relative border-t border-gray-700 p-3">
    <div class="flex items-center justify-center gap-2">
      <!-- Ability Checks Button -->
      <button
        @mouseenter="showAbilityChecks = true"
        @mouseleave="showAbilityChecks = false"
        class="w-10 h-10 flex items-center justify-center rounded-lg bg-gray-700 hover:bg-gray-600 text-white transition-colors text-xl"
        title="Ability Checks & Skills"
      >
        🎲
      </button>

      <!-- Placeholder for future info buttons -->
      <button
        class="w-10 h-10 flex items-center justify-center rounded-lg bg-gray-700 hover:bg-gray-600 text-white transition-colors text-xl opacity-50 cursor-not-allowed"
        title="Coming Soon"
        disabled
      >
        📋
      </button>
      <button
        class="w-10 h-10 flex items-center justify-center rounded-lg bg-gray-700 hover:bg-gray-600 text-white transition-colors text-xl opacity-50 cursor-not-allowed"
        title="Coming Soon"
        disabled
      >
        ⚔️
      </button>
    </div>

    <!-- Ability Checks Overlay -->
    <AbilityChecksOverlay :show="showAbilityChecks" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import AbilityChecksOverlay from './AbilityChecksOverlay.vue'

const showAbilityChecks = ref(false)
</script>
