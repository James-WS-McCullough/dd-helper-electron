<template>
  <AppLayout>
    <div class="flex flex-col h-full">
      <!-- Header -->
      <div class="p-4 border-b border-gray-700 bg-gray-800">
        <div class="flex items-center gap-3">
          <h2 class="text-lg font-semibold text-white">Encounters</h2>

          <!-- Encounter Name -->
          <input
            v-if="encounterStore.hasEncounter"
            :value="encounterStore.encounterName"
            @change="updateName"
            type="text"
            placeholder="Encounter name..."
            class="flex-1 px-3 py-1.5 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
          />
          <span v-else class="flex-1 text-gray-500 text-sm">No encounter loaded</span>

          <!-- Difficulty -->
          <select
            v-if="encounterStore.hasEncounter"
            :value="encounterStore.encounterDifficulty"
            @change="updateDifficulty"
            class="px-3 py-1.5 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none text-sm"
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
            <option value="deadly">Deadly</option>
          </select>
        </div>

        <!-- Action Buttons -->
        <div class="flex items-center gap-2 mt-3">
          <button
            @click="newEncounter"
            class="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg transition-colors"
          >
            New
          </button>
          <button
            @click="saveEncounter"
            :disabled="!encounterStore.hasEncounter || encounterStore.isSaving"
            class="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors"
          >
            {{ encounterStore.isSaving ? 'Saving...' : 'Save' }}
          </button>
          <button
            @click="showLoadModal = true"
            class="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg transition-colors"
          >
            Load
          </button>
          <button
            v-if="encounterStore.hasEncounter"
            @click="encounterStore.clearEncounter()"
            class="px-3 py-1.5 bg-red-600/20 hover:bg-red-600/40 text-red-400 text-sm rounded-lg transition-colors"
          >
            Clear
          </button>

          <div class="flex-1" />

          <button
            v-if="encounterStore.enemyCount > 0"
            @click="addToInitiative"
            class="px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white text-sm rounded-lg transition-colors flex items-center gap-1"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
            Add to Initiative
          </button>
        </div>

        <p v-if="encounterStore.hasEncounter" class="text-xs text-gray-500 mt-2">
          {{ encounterStore.enemyCount }} character{{ encounterStore.enemyCount !== 1 ? 's' : '' }}
        </p>
      </div>

      <!-- Enemy List -->
      <div class="flex-1 overflow-y-auto p-4 bg-gray-900">
        <!-- No encounter loaded -->
        <div v-if="!encounterStore.hasEncounter && !encounterStore.isLoading" class="flex items-center justify-center h-full">
          <div class="text-center text-gray-500">
            <p class="text-5xl mb-4">&#x2694;&#xFE0F;</p>
            <p>Create or load an encounter</p>
            <p class="text-sm mt-2">Use the buttons above to get started</p>
          </div>
        </div>

        <!-- Loading -->
        <div v-else-if="encounterStore.isLoading" class="flex items-center justify-center h-full">
          <div class="animate-spin h-12 w-12 border-2 border-blue-400 border-t-transparent rounded-full"></div>
        </div>

        <!-- Enemy Cards -->
        <div v-else class="space-y-3 max-w-4xl mx-auto">
          <!-- Empty encounter -->
          <div v-if="encounterStore.enemyCount === 0" class="text-center text-gray-500 py-12">
            <p>No characters yet</p>
            <p class="text-sm mt-1">Add characters using the buttons below</p>
          </div>

          <div
            v-for="(enemy, index) in encounterStore.enemies"
            :key="index"
            class="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden"
          >
            <!-- Enemy Row (always visible) -->
            <div class="flex items-center gap-4 p-4">
              <!-- Portrait -->
              <div
                class="w-14 h-14 rounded-full overflow-hidden flex-shrink-0 border-2"
                :class="getDispositionBorderClass(enemy.disposition)"
              >
                <img
                  v-if="enemy.portraitPath"
                  :src="`media://${enemy.portraitPath}`"
                  :alt="enemy.name"
                  class="w-full h-full object-cover"
                />
                <div v-else class="w-full h-full flex items-center justify-center text-lg" :class="getDispositionBgClass(enemy.disposition)">
                  {{ getDispositionIcon(enemy.disposition) }}
                </div>
              </div>

              <!-- Name & Type -->
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <h3 class="font-bold text-white truncate">{{ enemy.name }}</h3>
                  <span
                    v-if="enemy.disposition && enemy.disposition !== 'hostile'"
                    class="px-1.5 py-0.5 text-xs rounded font-medium flex-shrink-0"
                    :class="enemy.disposition === 'friendly' ? 'bg-green-900/40 text-green-400' : 'bg-yellow-900/40 text-yellow-400'"
                  >
                    {{ enemy.disposition === 'friendly' ? 'Friendly' : 'Neutral' }}
                  </span>
                </div>
                <p v-if="enemy.stats?.type" class="text-xs text-gray-400 italic truncate">{{ enemy.stats.type }}</p>
                <p v-else-if="enemy.notes" class="text-xs text-gray-500 truncate">{{ enemy.notes }}</p>
              </div>

              <!-- CR Badge (if stats) -->
              <div v-if="enemy.stats?.challengeRating" class="text-center flex-shrink-0">
                <div class="text-xs text-gray-500">CR</div>
                <div class="text-sm font-bold text-yellow-400">{{ enemy.stats.challengeRating }}</div>
              </div>

              <!-- HP -->
              <div class="text-center flex-shrink-0">
                <div class="text-xs text-gray-500">HP</div>
                <div class="text-sm font-bold text-white">{{ enemy.maxHp }}</div>
              </div>

              <!-- AC -->
              <div class="text-center flex-shrink-0">
                <div class="text-xs text-gray-500">AC</div>
                <div class="text-sm font-bold text-white">{{ enemy.ac }}</div>
              </div>

              <!-- Expand/Collapse (if stats) -->
              <button
                v-if="enemy.stats"
                @click="toggleExpanded(index)"
                class="p-2 text-gray-400 hover:text-white transition-colors flex-shrink-0"
                title="Toggle stat block"
              >
                <svg
                  class="w-4 h-4 transition-transform"
                  :class="expandedEnemies.has(index) ? 'rotate-180' : ''"
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              <!-- Edit -->
              <button
                @click="openEditEnemy(index)"
                class="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded transition-colors"
              >
                Edit
              </button>

              <!-- Remove -->
              <button
                @click="removeEnemy(index)"
                class="p-2 text-gray-600 hover:text-red-400 transition-colors flex-shrink-0"
                title="Remove"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <!-- Expanded Stat Block -->
            <div v-if="enemy.stats && expandedEnemies.has(index)" class="border-t border-gray-700 p-4">
              <CharacterStatBlock :character="enemy.stats" :disposition="enemy.disposition" />
            </div>
          </div>

          <!-- Add Enemy Buttons -->
          <div class="flex gap-2">
            <button
              @click="openAddStatBlock"
              class="flex-1 py-3 bg-gray-800 hover:bg-gray-750 text-gray-400 hover:text-white border-2 border-dashed border-red-800 hover:border-red-600 rounded-lg transition-colors"
            >
              + Add Character
            </button>
            <button
              v-if="characterStatsStore.characters.length > 0"
              @click="showLibraryModal = true"
              class="flex-1 py-3 bg-gray-800 hover:bg-gray-750 text-gray-400 hover:text-white border-2 border-dashed border-purple-800 hover:border-purple-600 rounded-lg transition-colors"
            >
              + From Library
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Stat Block Editor Modal -->
    <div
      v-if="showStatBlockEditor && editingStats"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      @click.self="showStatBlockEditor = false"
    >
      <div class="bg-gray-800 rounded-lg border border-gray-700 p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <h3 class="text-lg font-semibold text-white mb-4">
          {{ editingEnemyIndex !== null ? 'Edit Character' : 'New Character' }}
        </h3>

        <!-- Disposition Selector -->
        <div class="mb-4">
          <label class="block text-sm text-gray-400 mb-2">Disposition</label>
          <div class="flex gap-2">
            <button
              v-for="d in dispositionOptions"
              :key="d.value"
              @click="editingDisposition = d.value"
              class="flex-1 py-2 rounded-lg text-sm font-medium transition-colors border"
              :class="editingDisposition === d.value ? d.activeClass : 'bg-gray-700 text-gray-400 border-gray-600 hover:bg-gray-600'"
            >
              {{ d.label }}
            </button>
          </div>
        </div>

        <CharacterEditor
          :key="editorKey"
          :character="editingStats"
          @save="onStatBlockSave"
          @cancel="showStatBlockEditor = false"
        />
      </div>
    </div>

    <!-- Library Picker Modal -->
    <div
      v-if="showLibraryModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      @click.self="showLibraryModal = false"
    >
      <div class="bg-gray-800 rounded-lg border border-gray-700 w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <div class="flex items-center justify-between p-4 border-b border-gray-700">
          <h3 class="text-lg font-semibold text-white">Add from Character Library</h3>
          <button
            @click="showLibraryModal = false"
            class="p-1 text-gray-400 hover:text-white transition-colors"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Search -->
        <div class="p-4 border-b border-gray-700">
          <input
            v-model="librarySearch"
            type="text"
            placeholder="Search characters..."
            class="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div class="flex-1 overflow-y-auto p-4 space-y-2">
          <div v-if="filteredLibraryCharacters.length === 0" class="text-center text-gray-500 py-8">
            No characters found
          </div>
          <div
            v-for="char in filteredLibraryCharacters"
            :key="char.id"
            class="flex items-center gap-4 p-3 bg-gray-900 rounded-lg border border-gray-700 hover:border-purple-500 transition-colors"
          >
            <!-- Portrait -->
            <div class="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 border border-gray-600">
              <img
                v-if="char.portraitPath"
                :src="`media://${char.portraitPath}`"
                :alt="char.name"
                class="w-full h-full object-cover"
              />
              <div v-else class="w-full h-full flex items-center justify-center bg-gray-700 text-gray-400 text-sm">
                &#x1F479;
              </div>
            </div>

            <!-- Info -->
            <div class="flex-1 min-w-0">
              <div class="font-bold text-white truncate">{{ char.name }}</div>
              <div class="text-xs text-gray-400 truncate">
                {{ char.type || 'Unknown type' }}
                <span v-if="char.challengeRating" class="text-yellow-400 ml-2">CR {{ char.challengeRating }}</span>
              </div>
            </div>

            <!-- Quick Stats -->
            <div class="flex gap-3 text-xs text-gray-400 flex-shrink-0">
              <span>AC {{ char.armorClass }}</span>
              <span>HP {{ char.maxHitPoints }}</span>
            </div>

            <!-- Add Button -->
            <button
              @click="addFromLibrary(char)"
              class="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-sm rounded-lg transition-colors flex-shrink-0"
            >
              Add
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Load Encounter Modal -->
    <div
      v-if="showLoadModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      @click.self="showLoadModal = false"
    >
      <div class="bg-gray-800 rounded-lg border border-gray-700 w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
        <div class="flex items-center justify-between p-4 border-b border-gray-700">
          <h3 class="text-lg font-semibold text-white">Load Encounter</h3>
          <button
            @click="showLoadModal = false"
            class="p-1 text-gray-400 hover:text-white transition-colors"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="flex-1 overflow-y-auto p-4 space-y-2">
          <div v-if="encounterStore.encounterFiles.length === 0" class="text-center text-gray-500 py-8">
            No saved encounters found
          </div>
          <div
            v-for="file in encounterStore.encounterFiles"
            :key="file.path"
            @click="loadEncounterFile(file.path)"
            class="p-3 bg-gray-900 hover:bg-gray-750 rounded-lg cursor-pointer border border-gray-700 hover:border-blue-500 transition-colors"
          >
            <div class="font-bold text-white">{{ file.name }}</div>
            <div class="flex items-center gap-3 mt-1">
              <span class="text-xs text-gray-400">{{ file.enemyCount }} character{{ file.enemyCount !== 1 ? 's' : '' }}</span>
              <span class="text-xs text-gray-500">{{ formatDate(file.lastModified) }}</span>
            </div>
          </div>
        </div>

        <div class="p-4 border-t border-gray-700">
          <button
            @click="browseEncounterFile"
            class="w-full py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg transition-colors"
          >
            Browse Files...
          </button>
        </div>
      </div>
    </div>

    <!-- New Encounter Modal -->
    <div
      v-if="showNewModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      @click.self="showNewModal = false"
    >
      <div class="bg-gray-800 rounded-lg border border-gray-700 p-6 w-full max-w-md">
        <h3 class="text-lg font-semibold text-white mb-4">New Encounter</h3>
        <div class="space-y-4">
          <div>
            <label class="block text-sm text-gray-400 mb-1">Encounter Name</label>
            <input
              v-model="newEncounterName"
              type="text"
              placeholder="e.g. Goblin Ambush"
              class="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
              @keyup.enter="confirmNewEncounter"
            />
          </div>
          <div class="flex gap-3">
            <button
              @click="showNewModal = false"
              class="flex-1 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              @click="confirmNewEncounter"
              :disabled="!newEncounterName.trim()"
              class="flex-1 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Create
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Toast -->
    <div
      v-if="toast"
      class="fixed bottom-20 right-4 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 shadow-lg z-50"
    >
      <p class="text-sm text-white">{{ toast }}</p>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import AppLayout from '../components/AppLayout.vue'
import CharacterStatBlock from '../components/CharacterStatBlock.vue'
import CharacterEditor from '../components/CharacterEditor.vue'
import { useEncounterStore, useInitiativeStore, useDirectoryStore, useCharacterStatsStore } from '../stores'
import type { Enemy, Combatant, CharacterStats, Disposition } from '../types'
import { calculateModifier } from '../utils/abilityFormatter'

const encounterStore = useEncounterStore()
const initiativeStore = useInitiativeStore()
const directoryStore = useDirectoryStore()
const characterStatsStore = useCharacterStatsStore()

const showLoadModal = ref(false)
const showNewModal = ref(false)
const showStatBlockEditor = ref(false)
const showLibraryModal = ref(false)
const editingEnemyIndex = ref<number | null>(null)
const editingStats = ref<CharacterStats | null>(null)
const editingDisposition = ref<Disposition>('hostile')

const dispositionOptions: { value: Disposition; label: string; activeClass: string }[] = [
  { value: 'hostile', label: 'Hostile', activeClass: 'bg-red-600 text-white border-red-500' },
  { value: 'neutral', label: 'Neutral', activeClass: 'bg-yellow-600 text-white border-yellow-500' },
  { value: 'friendly', label: 'Friendly', activeClass: 'bg-green-600 text-white border-green-500' }
]
const editorKey = ref(0)
const expandedEnemies = ref(new Set<number>())
const librarySearch = ref('')
const toast = ref<string | null>(null)
const newEncounterName = ref('')

const filteredLibraryCharacters = computed(() => {
  const q = librarySearch.value.toLowerCase().trim()
  if (!q) return characterStatsStore.characters
  return characterStatsStore.characters.filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      c.type?.toLowerCase().includes(q) ||
      c.tags?.some((t) => t.toLowerCase().includes(q))
  )
})

onMounted(async () => {
  await directoryStore.initialize()
  await encounterStore.initialize()
  await characterStatsStore.initialize()
})

function updateName(event: Event): void {
  const value = (event.target as HTMLInputElement).value
  encounterStore.updateEncounter({ name: value })
}

function updateDifficulty(event: Event): void {
  const value = (event.target as HTMLSelectElement).value as 'easy' | 'medium' | 'hard' | 'deadly'
  encounterStore.updateEncounter({ difficulty: value })
}

function newEncounter(): void {
  newEncounterName.value = ''
  showNewModal.value = true
}

function confirmNewEncounter(): void {
  if (!newEncounterName.value.trim()) return
  encounterStore.createEncounter(newEncounterName.value.trim())
  showNewModal.value = false
  showToast('Encounter created')
}

async function saveEncounter(): Promise<void> {
  const success = await encounterStore.saveEncounter()
  if (success) {
    showToast('Encounter saved')
  } else {
    showToast('Failed to save encounter')
  }
}

async function loadEncounterFile(path: string): Promise<void> {
  const success = await encounterStore.loadEncounter(path)
  if (success) {
    showLoadModal.value = false
    expandedEnemies.value.clear()
    showToast('Encounter loaded')
  }
}

async function browseEncounterFile(): Promise<void> {
  const success = await encounterStore.selectAndLoadEncounter()
  if (success) {
    showLoadModal.value = false
    expandedEnemies.value.clear()
    showToast('Encounter loaded')
  }
}

function toggleExpanded(index: number): void {
  if (expandedEnemies.value.has(index)) {
    expandedEnemies.value.delete(index)
  } else {
    expandedEnemies.value.add(index)
  }
}

function openEditEnemy(index: number): void {
  const enemy = encounterStore.enemies[index]
  editingEnemyIndex.value = index

  // If enemy already has stats, edit them directly
  if (enemy.stats) {
    editingStats.value = JSON.parse(JSON.stringify(enemy.stats))
  } else {
    // Create stats from the simple enemy fields for migration
    editingStats.value = {
      ...createDefaultStats(enemy.name),
      armorClass: enemy.ac,
      maxHitPoints: enemy.maxHp,
      portraitPath: enemy.portraitPath
    }
  }
  editingDisposition.value = enemy.disposition || 'hostile'
  editorKey.value++
  showStatBlockEditor.value = true
}

// --- Stat Block ---

function createDefaultStats(name: string): CharacterStats {
  const now = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    name,
    abilityScores: {
      strength: 10,
      dexterity: 10,
      constitution: 10,
      intelligence: 10,
      wisdom: 10,
      charisma: 10
    },
    armorClass: 10,
    maxHitPoints: 10,
    currentHitPoints: 10,
    speed: { walk: 30 },
    abilities: [],
    createdAt: now,
    updatedAt: now
  }
}

function enemyFromStats(stats: CharacterStats, disposition: Disposition = 'hostile'): Enemy {
  return {
    name: stats.name,
    maxHp: stats.maxHitPoints,
    ac: stats.armorClass,
    portraitPath: stats.portraitPath,
    stats: JSON.parse(JSON.stringify(stats)),
    disposition
  }
}

function openAddStatBlock(): void {
  editingEnemyIndex.value = null
  editingStats.value = createDefaultStats('New Character')
  editingDisposition.value = 'hostile'
  editorKey.value++
  showStatBlockEditor.value = true
}

function onStatBlockSave(stats: CharacterStats): void {
  if (editingEnemyIndex.value !== null) {
    const enemy = enemyFromStats(stats, editingDisposition.value)
    encounterStore.updateEnemy(editingEnemyIndex.value, enemy)
    showToast('Character updated')
  } else {
    const enemy = enemyFromStats(stats, editingDisposition.value)
    encounterStore.addEnemy(enemy)
    showToast('Character added')
  }

  showStatBlockEditor.value = false
  encounterStore.saveEncounter()
}

// --- Library Picker ---

function addFromLibrary(character: CharacterStats): void {
  const cloned = JSON.parse(JSON.stringify(character)) as CharacterStats
  cloned.id = crypto.randomUUID() // Fresh ID for independence
  const enemy = enemyFromStats(cloned)
  encounterStore.addEnemy(enemy)
  encounterStore.saveEncounter()
  showToast(`Added ${character.name}`)
}

// --- Initiative ---

function rollInitiative(enemy: Enemy): number {
  const dexMod = enemy.stats
    ? calculateModifier(enemy.stats.abilityScores.dexterity)
    : 0
  return Math.floor(Math.random() * 20) + 1 + dexMod
}

function addToInitiative(): void {
  let addedCount = 0
  for (const enemy of encounterStore.enemies) {
    const combatant: Combatant = {
      id: crypto.randomUUID(),
      name: enemy.name,
      type: 'enemy',
      initiative: rollInitiative(enemy),
      hp: enemy.maxHp,
      maxHp: enemy.maxHp,
      ac: enemy.ac,
      portraitPath: enemy.portraitPath,
      notes: enemy.notes,
      stats: enemy.stats ? JSON.parse(JSON.stringify(enemy.stats)) : undefined,
      disposition: enemy.disposition || 'hostile'
    }
    initiativeStore.addCombatant(combatant)
    addedCount++
  }

  if (addedCount > 0) {
    initiativeStore.saveInitiative()
    showToast(`Added ${addedCount} character${addedCount !== 1 ? 's' : ''} with rolled initiative`)
  }
}

function removeEnemy(index: number): void {
  encounterStore.removeEnemy(index)
  expandedEnemies.value.delete(index)
  encounterStore.saveEncounter()
}

// --- Helpers ---

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// --- Disposition Helpers ---

function getDispositionBorderClass(disposition?: Disposition): string {
  if (disposition === 'friendly') return 'border-green-500'
  if (disposition === 'neutral') return 'border-yellow-500'
  return 'border-red-500'
}

function getDispositionBgClass(disposition?: Disposition): string {
  if (disposition === 'friendly') return 'bg-green-900 text-green-300'
  if (disposition === 'neutral') return 'bg-yellow-900 text-yellow-300'
  return 'bg-red-900 text-red-300'
}

function getDispositionIcon(disposition?: Disposition): string {
  if (disposition === 'friendly') return '\u{1F91D}'
  if (disposition === 'neutral') return '\u{1F610}'
  return '\u{1F479}'
}

function showToast(message: string): void {
  toast.value = message
  setTimeout(() => { toast.value = null }, 3000)
}
</script>
