<template>
  <div class="bg-gray-800 rounded-lg border border-gray-700 p-3 text-sm">
    <!-- Header -->
    <div class="flex items-start gap-3 mb-2">
      <div
        v-if="character.portraitPath"
        class="w-12 h-12 rounded-lg overflow-hidden border border-gray-600 flex-shrink-0"
      >
        <img
          :src="`media://${character.portraitPath}`"
          :alt="character.name"
          class="w-full h-full object-cover"
        />
      </div>
      <div class="flex-1 min-w-0">
        <h3 class="font-bold text-white truncate">{{ character.name }}</h3>
      </div>
    </div>

    <!-- Quick Stats -->
    <div class="grid grid-cols-3 gap-2 text-center mb-2">
      <div class="bg-gray-900 rounded p-1.5">
        <div class="text-xs text-gray-500">AC</div>
        <div class="font-bold text-white">{{ character.armorClass }}</div>
      </div>
      <div class="bg-gray-900 rounded p-1.5">
        <div class="text-xs text-gray-500">HP</div>
        <div class="font-bold text-white">{{ character.maxHitPoints }}</div>
      </div>
      <div class="bg-gray-900 rounded p-1.5">
        <div class="text-xs text-gray-500">SPD</div>
        <div class="font-bold text-white">{{ character.speed.walk || 0 }}</div>
      </div>
    </div>

    <!-- Ability Scores -->
    <div class="grid grid-cols-6 gap-1 text-center text-xs">
      <div v-for="(score, ability) in character.abilityScores" :key="ability">
        <div class="text-gray-500 uppercase">{{ ability.substring(0, 3) }}</div>
        <div class="text-gray-300">{{ formatMod(calculateMod(score)) }}</div>
      </div>
    </div>

    <!-- Tags -->
    <div v-if="character.tags?.length" class="mt-2 flex flex-wrap gap-1">
      <span
        v-for="tag in character.tags.slice(0, 3)"
        :key="tag"
        class="px-1.5 py-0.5 text-xs bg-gray-700 text-gray-400 rounded"
      >
        {{ tag }}
      </span>
      <span v-if="character.tags.length > 3" class="text-xs text-gray-500">
        +{{ character.tags.length - 3 }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CharacterStats } from '../types'
import { calculateModifier, formatModifier } from '../utils/abilityFormatter'

interface Props {
  character: CharacterStats
}

defineProps<Props>()

function calculateMod(score: number): number {
  return calculateModifier(score)
}

function formatMod(mod: number): string {
  return formatModifier(mod)
}
</script>
