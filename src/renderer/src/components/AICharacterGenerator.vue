<template>
  <div class="bg-gray-800 rounded-lg border border-gray-700 p-6">
    <h3 class="text-lg font-semibold text-white mb-4 flex items-center gap-2">
      <span>Generate Character with AI</span>
    </h3>

    <div v-if="!generatedCharacter" class="space-y-4">
      <!-- Description Input -->
      <div>
        <label class="block text-sm text-gray-400 mb-2">Character Description</label>
        <textarea
          v-model="description"
          placeholder="Describe the character you want to create, e.g., 'A cunning goblin assassin who uses poison-tipped daggers' or 'An ancient red dragon named Infernus'"
          rows="4"
          class="w-full bg-gray-700 text-white rounded-lg px-4 py-3 border border-gray-600 focus:border-blue-500 focus:outline-none resize-none placeholder-gray-500"
        ></textarea>
      </div>

      <!-- Character Type -->
      <div>
        <label class="block text-sm text-gray-400 mb-2">Character Type (Optional)</label>
        <select
          v-model="characterType"
          class="w-full bg-gray-700 text-white rounded-lg px-4 py-2 border border-gray-600 focus:border-blue-500 focus:outline-none"
        >
          <option value="">Auto-detect</option>
          <option value="NPC">NPC</option>
          <option value="Monster">Monster</option>
          <option value="Boss">Boss Monster</option>
          <option value="Humanoid">Humanoid</option>
          <option value="Beast">Beast</option>
          <option value="Undead">Undead</option>
          <option value="Fiend">Fiend</option>
          <option value="Celestial">Celestial</option>
          <option value="Elemental">Elemental</option>
          <option value="Dragon">Dragon</option>
        </select>
      </div>

      <!-- Error Message -->
      <div v-if="error" class="bg-red-900/50 border border-red-600 rounded-lg p-3">
        <p class="text-red-400 text-sm">{{ error }}</p>
      </div>

      <!-- Generate Button -->
      <button
        @click="generate"
        :disabled="!description.trim() || isGenerating"
        class="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        <span v-if="isGenerating" class="animate-spin">
          <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" stroke-linecap="round" class="opacity-25" />
            <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
          </svg>
        </span>
        <span>{{ isGenerating ? 'Generating...' : 'Generate Character' }}</span>
      </button>

      <p class="text-xs text-gray-500 text-center">
        Requires ANTHROPIC_API_KEY environment variable to be set
      </p>
    </div>

    <!-- Preview Generated Character -->
    <div v-else class="space-y-4">
      <div class="flex items-center justify-between mb-4">
        <h4 class="text-white font-medium">Preview Generated Character</h4>
        <button
          @click="clearGenerated"
          class="text-gray-400 hover:text-white text-sm"
        >
          Start Over
        </button>
      </div>

      <CharacterStatBlock :character="generatedCharacter" />

      <PortraitPicker v-model="generatedCharacter.portraitPath" />

      <div class="flex gap-3">
        <button
          @click="saveCharacter"
          :disabled="isSaving"
          class="flex-1 py-2 bg-green-600 hover:bg-green-500 disabled:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
        >
          {{ isSaving ? 'Saving...' : 'Save Character' }}
        </button>
        <button
          @click="regenerate"
          :disabled="isGenerating"
          class="flex-1 py-2 bg-gray-600 hover:bg-gray-500 disabled:bg-gray-700 text-white font-semibold rounded-lg transition-colors"
        >
          {{ isGenerating ? 'Generating...' : 'Regenerate' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { CharacterStats } from '../types'
import { useCharacterStatsStore } from '../stores'
import CharacterStatBlock from './CharacterStatBlock.vue'
import PortraitPicker from './PortraitPicker.vue'

const emit = defineEmits<{
  (e: 'generated', character: CharacterStats): void
  (e: 'saved', character: CharacterStats): void
  (e: 'close'): void
}>()

const characterStatsStore = useCharacterStatsStore()

const description = ref('')
const characterType = ref('')
const generatedCharacter = ref<CharacterStats | null>(null)
const isGenerating = ref(false)
const isSaving = ref(false)
const error = ref<string | null>(null)

async function generate(): Promise<void> {
  if (!description.value.trim()) return

  isGenerating.value = true
  error.value = null

  try {
    const result = await characterStatsStore.generateFromAI(
      description.value,
      characterType.value || undefined
    )

    if (result) {
      generatedCharacter.value = result
      emit('generated', result)
    } else {
      error.value = characterStatsStore.lastError || 'Failed to generate character'
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Unknown error'
  } finally {
    isGenerating.value = false
  }
}

async function regenerate(): Promise<void> {
  generatedCharacter.value = null
  await generate()
}

async function saveCharacter(): Promise<void> {
  if (!generatedCharacter.value) return

  isSaving.value = true

  try {
    const success = await characterStatsStore.saveCharacter(generatedCharacter.value)
    if (success) {
      emit('saved', generatedCharacter.value)
      emit('close')
      clearGenerated()
    } else {
      error.value = characterStatsStore.lastError || 'Failed to save character'
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Unknown error'
  } finally {
    isSaving.value = false
  }
}

function clearGenerated(): void {
  generatedCharacter.value = null
  description.value = ''
  characterType.value = ''
  error.value = null
}
</script>
