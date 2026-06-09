<template>
  <AppLayout>
    <div class="flex flex-col h-full">
      <!-- Header -->
      <div class="p-4 border-b border-gray-700 bg-gray-800">
        <div class="flex items-center gap-4 mb-3">
          <h2 class="text-lg font-semibold text-white">Character Library</h2>

          <!-- Refresh Button -->
          <button
            @click="refreshCharacters"
            :disabled="characterStatsStore.isLoading"
            class="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Refresh characters"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5"
              :class="{ 'animate-spin': characterStatsStore.isLoading }"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fill-rule="evenodd"
                d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                clip-rule="evenodd"
              />
            </svg>
          </button>

          <!-- Search Bar -->
          <div class="flex-1 relative">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search characters by name, type, or tags..."
              class="w-full px-4 py-2 pr-10 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none placeholder-gray-400"
            />
            <button
              v-if="searchQuery"
              @click="searchQuery = ''"
              class="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-white transition-colors"
              title="Clear search"
            >
              <span class="text-xl">&times;</span>
            </button>
          </div>

          <!-- Action Buttons -->
          <button
            @click="showNewCharacterModal = true"
            class="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition-colors"
          >
            + New Character
          </button>
          <button
            @click="showAIGenerator = true"
            class="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            <span>Generate with AI</span>
          </button>
        </div>

        <div class="flex items-center justify-between">
          <p class="text-sm text-gray-400">
            {{ filteredCharacters.length }} character{{
              filteredCharacters.length !== 1 ? 's' : ''
            }}
          </p>
        </div>
      </div>

      <!-- Content Area -->
      <div class="flex-1 overflow-hidden flex">
        <!-- Character Grid / List -->
        <div class="flex-1 overflow-y-auto p-6 bg-gray-900">
          <!-- Loading State -->
          <div
            v-if="characterStatsStore.isLoading"
            class="flex items-center justify-center h-full"
          >
            <div class="text-center">
              <div
                class="animate-spin h-12 w-12 border-2 border-blue-400 border-t-transparent rounded-full mx-auto mb-4"
              ></div>
              <p class="text-gray-400">Loading characters...</p>
            </div>
          </div>

          <!-- Character Grid -->
          <div
            v-else-if="filteredCharacters.length > 0"
            class="grid gap-4"
            :class="selectedCharacter
              ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3'
              : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'"
          >
            <div
              v-for="character in filteredCharacters"
              :key="character.id"
              @click="selectCharacter(character)"
              class="cursor-pointer hover:ring-2 hover:ring-blue-500 rounded-lg transition-all"
              :class="{
                'ring-2 ring-blue-500':
                  selectedCharacter?.id === character.id
              }"
            >
              <CharacterStatBlockMini :character="character" />
            </div>
          </div>

          <!-- Empty State -->
          <div v-else class="flex items-center justify-center h-full">
            <div class="text-center text-gray-500">
              <p class="text-6xl mb-4">📋</p>
              <p v-if="searchQuery">No characters match your search</p>
              <p v-else>No characters yet</p>
              <p class="text-sm mt-2">
                Create a new character or generate one with AI
              </p>
            </div>
          </div>
        </div>

        <!-- Character Detail Panel -->
        <div
          v-if="selectedCharacter"
          class="w-[480px] border-l border-gray-700 bg-gray-800 overflow-y-auto"
        >
          <div class="p-4 border-b border-gray-700 flex items-center justify-between">
            <h3 class="text-lg font-semibold text-white">Character Details</h3>
            <div class="flex items-center gap-2">
              <button
                @click="editCharacter"
                class="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded transition-colors"
              >
                Edit
              </button>
              <button
                @click="confirmDelete"
                class="px-3 py-1 bg-red-600 hover:bg-red-500 text-white text-sm rounded transition-colors"
              >
                Delete
              </button>
              <button
                @click="selectedCharacter = null"
                class="p-1 text-gray-400 hover:text-white"
              >
                &times;
              </button>
            </div>
          </div>
          <div class="p-4">
            <CharacterStatBlock
              :character="selectedCharacter"
              :show-hp-tracker="true"
              @update:character="handleCharacterUpdate"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- New Character Modal -->
    <div
      v-if="showNewCharacterModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      @click.self="showNewCharacterModal = false"
    >
      <div class="bg-gray-800 rounded-lg border border-gray-700 p-6 w-full max-w-md">
        <h3 class="text-lg font-semibold text-white mb-4">New Character</h3>
        <div class="space-y-4">
          <div>
            <label class="block text-sm text-gray-400 mb-2">Character Name</label>
            <input
              v-model="newCharacterName"
              type="text"
              placeholder="Enter character name..."
              class="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
              @keyup.enter="createNewCharacter"
            />
          </div>
          <div class="flex gap-3">
            <button
              @click="showNewCharacterModal = false"
              class="flex-1 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              @click="createNewCharacter"
              :disabled="!newCharacterName.trim()"
              class="flex-1 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Create
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- AI Generator Modal -->
    <div
      v-if="showAIGenerator"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto p-4"
      @click.self="showAIGenerator = false"
    >
      <div class="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div class="flex justify-end mb-2">
          <button
            @click="showAIGenerator = false"
            class="p-2 text-gray-400 hover:text-white bg-gray-800 rounded-full"
          >
            &times;
          </button>
        </div>
        <AICharacterGenerator
          @saved="handleAISaved"
          @close="showAIGenerator = false"
        />
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div
      v-if="showDeleteConfirm"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      @click.self="showDeleteConfirm = false"
    >
      <div class="bg-gray-800 rounded-lg border border-gray-700 p-6 w-full max-w-md">
        <h3 class="text-lg font-semibold text-white mb-4">Delete Character</h3>
        <p class="text-gray-300 mb-6">
          Are you sure you want to delete "{{ selectedCharacter?.name }}"? This
          action cannot be undone.
        </p>
        <div class="flex gap-3">
          <button
            @click="showDeleteConfirm = false"
            class="flex-1 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            @click="deleteCharacter"
            class="flex-1 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>

    <!-- Edit Character Modal -->
    <div
      v-if="showEditModal && editingCharacter"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto p-4"
      @click.self="showEditModal = false"
    >
      <div class="bg-gray-800 rounded-lg border border-gray-700 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div class="p-4 border-b border-gray-700 flex items-center justify-between sticky top-0 bg-gray-800">
          <h3 class="text-lg font-semibold text-white">Edit Character</h3>
          <button
            @click="showEditModal = false"
            class="p-1 text-gray-400 hover:text-white"
          >
            &times;
          </button>
        </div>
        <div class="p-6">
          <CharacterEditor
            :character="editingCharacter"
            @save="saveEditedCharacter"
            @cancel="showEditModal = false"
          />
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import AppLayout from '../components/AppLayout.vue'
import CharacterStatBlock from '../components/CharacterStatBlock.vue'
import CharacterStatBlockMini from '../components/CharacterStatBlockMini.vue'
import AICharacterGenerator from '../components/AICharacterGenerator.vue'
import CharacterEditor from '../components/CharacterEditor.vue'
import { useCharacterStatsStore } from '../stores'
import type { CharacterStats } from '../types'

const characterStatsStore = useCharacterStatsStore()

const searchQuery = ref('')
const selectedCharacter = ref<CharacterStats | null>(null)
const showNewCharacterModal = ref(false)
const showAIGenerator = ref(false)
const showDeleteConfirm = ref(false)
const showEditModal = ref(false)
const newCharacterName = ref('')
const editingCharacter = ref<CharacterStats | null>(null)

const filteredCharacters = computed(() => {
  const query = searchQuery.value.toLowerCase().trim()
  if (!query) {
    return characterStatsStore.characters
  }

  return characterStatsStore.characters.filter((character) => {
    const nameMatch = character.name.toLowerCase().includes(query)
    const typeMatch = character.type?.toLowerCase().includes(query)
    const tagMatch = character.tags?.some((tag) =>
      tag.toLowerCase().includes(query)
    )
    return nameMatch || typeMatch || tagMatch
  })
})

onMounted(async () => {
  await characterStatsStore.initialize()
})

async function refreshCharacters(): Promise<void> {
  await characterStatsStore.loadAllCharacters()
}

function selectCharacter(character: CharacterStats): void {
  selectedCharacter.value = character
  characterStatsStore.setCurrentCharacter(character.id)
}

async function createNewCharacter(): Promise<void> {
  if (!newCharacterName.value.trim()) return

  const newCharacter = characterStatsStore.createNewCharacter(
    newCharacterName.value.trim()
  )
  await characterStatsStore.saveCharacter(newCharacter)

  selectedCharacter.value = newCharacter
  showNewCharacterModal.value = false
  newCharacterName.value = ''
}

function confirmDelete(): void {
  showDeleteConfirm.value = true
}

async function deleteCharacter(): Promise<void> {
  if (!selectedCharacter.value) return

  await characterStatsStore.deleteCharacter(selectedCharacter.value.id)
  selectedCharacter.value = null
  showDeleteConfirm.value = false
}

function editCharacter(): void {
  if (!selectedCharacter.value) return
  editingCharacter.value = { ...selectedCharacter.value }
  showEditModal.value = true
}

async function saveEditedCharacter(character: CharacterStats): Promise<void> {
  await characterStatsStore.saveCharacter(character)
  selectedCharacter.value = character
  showEditModal.value = false
  editingCharacter.value = null
}

async function handleCharacterUpdate(character: CharacterStats): Promise<void> {
  characterStatsStore.updateCharacter(character.id, character)
  selectedCharacter.value = character
  // Auto-save HP changes
  await characterStatsStore.saveCharacter(character)
}

function handleAISaved(character: CharacterStats): void {
  showAIGenerator.value = false
  selectedCharacter.value = character
}
</script>
