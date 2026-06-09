<template>
  <AppLayout>
    <div class="flex flex-col h-full">
      <!-- Header -->
      <div class="p-4 border-b border-gray-700 bg-gray-800">
        <div class="flex items-center gap-4">
          <h2 class="text-lg font-semibold text-white">Initiative Tracker</h2>

          <!-- Round Counter -->
          <div class="flex items-center gap-2 px-3 py-1.5 bg-gray-900 rounded-lg border border-orange-600/40">
            <span class="text-sm text-gray-400">Round</span>
            <span class="text-xl font-bold text-white">{{ initiativeStore.round }}</span>
          </div>

          <div class="flex-1" />

          <!-- Turn Controls -->
          <div class="flex items-center gap-2">
            <button
              @click="previousTurn"
              :disabled="initiativeStore.combatantCount === 0"
              class="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
              Prev
            </button>
            <button
              @click="nextTurn"
              :disabled="initiativeStore.combatantCount === 0"
              class="px-4 py-2 bg-green-600 hover:bg-green-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2"
            >
              Next
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex items-center gap-2 mt-3">
          <button
            @click="addPartyToInitiative"
            :disabled="!partyStore.hasMembers"
            class="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors"
          >
            + Add Party
          </button>
          <button
            @click="showEncounterModal = true"
            class="px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-white text-sm rounded-lg transition-colors"
          >
            + Add Encounter
          </button>
          <button
            @click="openAddCombatant"
            class="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg transition-colors"
          >
            + Add Combatant
          </button>
          <button
            @click="openAddNote"
            class="px-3 py-1.5 bg-yellow-600/20 hover:bg-yellow-600/40 text-yellow-400 text-sm rounded-lg transition-colors"
          >
            + Add Note
          </button>
          <div class="flex-1" />
          <button
            v-if="initiativeStore.combatantCount > 0"
            @click="showClearConfirm = true"
            class="px-3 py-1.5 bg-red-600/20 hover:bg-red-600/40 text-red-400 text-sm rounded-lg transition-colors"
          >
            Clear All
          </button>
        </div>
      </div>

      <!-- Initiative List -->
      <div class="flex-1 overflow-y-auto p-4 bg-gray-900">
        <!-- Empty State -->
        <div v-if="initiativeStore.combatantCount === 0 && !initiativeStore.isLoading" class="flex items-center justify-center h-full">
          <div class="text-center text-gray-500">
            <p class="text-5xl mb-4">&#x2694;&#xFE0F;</p>
            <p>No combatants in initiative</p>
            <p class="text-sm mt-2">Add your party to get started</p>
          </div>
        </div>

        <!-- Loading -->
        <div v-else-if="initiativeStore.isLoading" class="flex items-center justify-center h-full">
          <div class="animate-spin h-12 w-12 border-2 border-blue-400 border-t-transparent rounded-full"></div>
        </div>

        <!-- Combatant List -->
        <div v-else class="space-y-2 max-w-3xl mx-auto">
          <div
            v-for="(combatant, index) in initiativeStore.combatants"
            :key="combatant.id"
            class="flex items-center gap-3 p-3 rounded-lg border-l-4 transition-all cursor-pointer"
            :class="getCombatantRowClass(combatant, index)"
            @click="openInfoModal(combatant)"
          >
            <!-- Current Turn Indicator -->
            <div class="w-6 flex-shrink-0 text-center">
              <span
                v-if="index === initiativeStore.currentTurn"
                class="text-green-400 text-lg"
              >&#x25B6;</span>
            </div>

            <!-- Portrait (Note icon for notes) -->
            <div
              v-if="combatant.type === 'note'"
              class="w-12 h-12 rounded-full flex-shrink-0 border-2 border-yellow-500/50 bg-yellow-900/30 flex items-center justify-center text-lg"
            >
              &#x1F4DD;
            </div>
            <div
              v-else
              class="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 border-2"
              :class="getCombatantBorderClass(combatant)"
            >
              <img
                v-if="combatant.portraitPath"
                :src="`media://${combatant.portraitPath}`"
                :alt="combatant.name"
                class="w-full h-full object-cover"
              />
              <div
                v-else
                class="w-full h-full flex items-center justify-center text-lg"
                :class="getCombatantBgClass(combatant)"
              >
                {{ getCombatantIcon(combatant) }}
              </div>
            </div>

            <!-- Name & Info -->
            <div class="flex-1 min-w-0">
              <h3
                class="font-bold truncate"
                :class="combatant.type === 'note' ? 'text-yellow-300 italic' : 'text-white'"
              >
                {{ combatant.name }}
              </h3>
              <p class="text-xs uppercase" :class="getTypeBadgeClass(combatant.type, combatant.disposition)">
                {{ combatant.type === 'enemy' && combatant.disposition && combatant.disposition !== 'hostile' ? combatant.disposition : combatant.type }}
              </p>

              <!-- Tags -->
              <div v-if="combatant.type !== 'note'" class="flex flex-wrap gap-1 mt-1" @click.stop>
                <span
                  v-for="tag in combatant.tags || []"
                  :key="tag"
                  class="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-900/40 text-purple-300 border border-purple-700/50 rounded text-xs"
                >
                  {{ tag }}
                  <button
                    @click="removeTag(combatant.id, tag)"
                    class="text-purple-400 hover:text-white transition-colors"
                    title="Remove tag"
                  >
                    &times;
                  </button>
                </span>
                <template v-if="addingTagForId === combatant.id">
                  <input
                    :ref="(el) => { tagInput = el as HTMLInputElement | null }"
                    v-model="newTagValue"
                    @keyup.enter="confirmAddTag(combatant.id)"
                    @keyup.escape="cancelAddTag"
                    @blur="cancelAddTag"
                    type="text"
                    placeholder="tag"
                    class="px-2 py-0.5 bg-gray-700 text-white text-xs rounded border border-purple-500 focus:outline-none w-24"
                  />
                </template>
                <button
                  v-else
                  @click="startAddTag(combatant.id)"
                  class="px-2 py-0.5 bg-gray-700 hover:bg-purple-900/40 text-gray-400 hover:text-purple-300 border border-gray-600 hover:border-purple-700 rounded text-xs transition-colors"
                  title="Add tag"
                >
                  + tag
                </button>
              </div>
            </div>

            <!-- AC Badge (hidden for notes) -->
            <div v-if="combatant.type !== 'note'" class="text-center flex-shrink-0">
              <div class="text-xs text-gray-500">AC</div>
              <div class="text-sm font-bold text-white">{{ combatant.ac }}</div>
            </div>

            <!-- HP Display (clickable, hidden for notes and when maxHp is 0) -->
            <div
              v-if="combatant.type !== 'note' && combatant.maxHp > 0"
              class="text-center flex-shrink-0 cursor-pointer"
              @click.stop="openHpModal(combatant)"
              title="Click to manage HP"
            >
              <div class="text-xs text-gray-500">HP</div>
              <div class="text-sm font-bold" :class="getHpColor(combatant)">
                {{ combatant.hp }}/{{ combatant.maxHp }}
              </div>
              <div class="w-16 h-1 bg-gray-700 rounded-full mt-0.5">
                <div
                  class="h-full rounded-full transition-all"
                  :class="getHpBarColor(combatant)"
                  :style="{ width: `${getHpPercent(combatant)}%` }"
                />
              </div>

              <!-- Death Saves (players at 0 HP) -->
              <div
                v-if="showDeathSaves(combatant)"
                class="flex items-center justify-center gap-1 mt-1"
                :title="deathSavesTitle(combatant)"
                @click.stop
              >
                <span class="text-xs">&#x1F480;</span>
                <div class="flex gap-0.5">
                  <button
                    v-for="i in 3"
                    :key="`s${i}`"
                    @click.stop="setSuccesses(combatant, i)"
                    class="w-2.5 h-2.5 rounded-full border transition-colors"
                    :class="(combatant.deathSaves?.successes || 0) >= i
                      ? 'bg-green-500 border-green-400'
                      : 'bg-gray-700 border-gray-600 hover:border-green-500'"
                    :title="`Success ${i}`"
                  />
                </div>
                <span class="text-gray-600">|</span>
                <div class="flex gap-0.5">
                  <button
                    v-for="i in 3"
                    :key="`f${i}`"
                    @click.stop="setFailures(combatant, i)"
                    class="w-2.5 h-2.5 rounded-full border transition-colors"
                    :class="(combatant.deathSaves?.failures || 0) >= i
                      ? 'bg-red-500 border-red-400'
                      : 'bg-gray-700 border-gray-600 hover:border-red-500'"
                    :title="`Failure ${i}`"
                  />
                </div>
              </div>
              <div
                v-if="deathSaveStatus(combatant)"
                class="text-[10px] font-bold uppercase mt-0.5"
                :class="deathSaveStatus(combatant) === 'STABLE' ? 'text-green-400' : 'text-red-500'"
              >
                {{ deathSaveStatus(combatant) }}
              </div>
            </div>

            <!-- Initiative Input -->
            <div class="flex-shrink-0 w-20" @click.stop>
              <label class="text-xs text-gray-500 block text-center">Init</label>
              <input
                :value="combatant.initiative"
                @change="updateInitiative(combatant.id, $event)"
                type="number"
                min="0"
                max="50"
                class="w-full px-2 py-1.5 bg-gray-700 text-white text-center text-lg font-bold rounded-lg border border-gray-600 focus:border-yellow-500 focus:outline-none"
              />
            </div>

            <!-- Remove Button -->
            <button
              @click.stop="removeCombatant(combatant.id)"
              class="p-2 text-gray-600 hover:text-red-400 transition-colors flex-shrink-0"
              title="Remove"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Combatant Modal -->
    <div
      v-if="showAddModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      @click.self="showAddModal = false"
    >
      <div class="bg-gray-800 rounded-lg border border-gray-700 p-6 w-full max-w-md">
        <h3 class="text-lg font-semibold text-white mb-4">Add Combatant</h3>
        <div class="space-y-4">
          <div>
            <label class="block text-sm text-gray-400 mb-1">Name</label>
            <input
              v-model="addForm.name"
              type="text"
              class="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
              @keyup.enter="addManualCombatant"
            />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm text-gray-400 mb-1">Type</label>
              <select
                v-model="addForm.type"
                class="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
              >
                <option value="player">Player</option>
                <option value="enemy">Enemy</option>
              </select>
            </div>
            <div>
              <label class="block text-sm text-gray-400 mb-1">Initiative</label>
              <input
                v-model.number="addForm.initiative"
                type="number"
                min="0"
                max="50"
                class="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>
          <div class="grid grid-cols-3 gap-4">
            <div>
              <label class="block text-sm text-gray-400 mb-1">AC</label>
              <input
                v-model.number="addForm.ac"
                type="number"
                min="1"
                class="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label class="block text-sm text-gray-400 mb-1">Max HP</label>
              <input
                v-model.number="addForm.maxHp"
                type="number"
                min="0"
                class="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label class="block text-sm text-gray-400 mb-1">Current HP</label>
              <input
                v-model.number="addForm.hp"
                type="number"
                min="0"
                class="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>
          <div class="flex gap-3">
            <button
              @click="showAddModal = false"
              class="flex-1 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              @click="addManualCombatant"
              :disabled="!addForm.name.trim()"
              class="flex-1 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Add
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Note Modal -->
    <div
      v-if="showNoteModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      @click.self="showNoteModal = false"
    >
      <div class="bg-gray-800 rounded-lg border border-gray-700 p-6 w-full max-w-md">
        <h3 class="text-lg font-semibold text-white mb-4">Add Note</h3>
        <div class="space-y-4">
          <div>
            <label class="block text-sm text-gray-400 mb-1">Note Text</label>
            <input
              v-model="noteForm.text"
              type="text"
              placeholder="e.g. Lair action, Legendary resistance recharges"
              class="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
              @keyup.enter="addNote"
            />
          </div>
          <div>
            <label class="block text-sm text-gray-400 mb-1">Initiative</label>
            <input
              v-model.number="noteForm.initiative"
              type="number"
              min="0"
              max="50"
              class="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div class="flex gap-3">
            <button
              @click="showNoteModal = false"
              class="flex-1 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              @click="addNote"
              :disabled="!noteForm.text.trim()"
              class="flex-1 py-2 bg-yellow-600 hover:bg-yellow-500 disabled:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Add Note
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Encounter Selection Modal -->
    <div
      v-if="showEncounterModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      @click.self="showEncounterModal = false"
    >
      <div class="bg-gray-800 rounded-lg border border-gray-700 w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
        <div class="flex items-center justify-between p-4 border-b border-gray-700">
          <h3 class="text-lg font-semibold text-white">Add Encounter to Initiative</h3>
          <button
            @click="showEncounterModal = false"
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
            @click="addEncounterToInitiative(file.path)"
            class="p-3 bg-gray-900 hover:bg-gray-750 rounded-lg cursor-pointer border border-gray-700 hover:border-orange-500 transition-colors"
          >
            <div class="font-bold text-white">{{ file.name }}</div>
            <div class="flex items-center gap-3 mt-1">
              <span class="text-xs text-gray-400">{{ file.enemyCount }} enem{{ file.enemyCount === 1 ? 'y' : 'ies' }}</span>
              <span class="text-xs text-gray-500">{{ formatDate(file.lastModified) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- HP Management Modal -->
    <div
      v-if="showHpModal && selectedCombatant"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      @click.self="showHpModal = false"
      @keydown="handleHpKeydown"
    >
      <div class="bg-gray-800 rounded-lg border border-gray-700 p-6 w-full max-w-sm">
        <h3 class="text-lg font-semibold text-white mb-2">{{ selectedCombatant.name }}</h3>

        <!-- HP Display -->
        <div class="text-center mb-4">
          <div class="text-3xl font-bold" :class="getHpColor(selectedCombatant)">
            {{ selectedCombatant.hp }} / {{ selectedCombatant.maxHp }}
          </div>
          <div class="w-full h-3 bg-gray-700 rounded-full mt-2">
            <div
              class="h-full rounded-full transition-all"
              :class="getHpBarColor(selectedCombatant)"
              :style="{ width: `${getHpPercent(selectedCombatant)}%` }"
            />
          </div>
        </div>

        <!-- Amount Input -->
        <div class="mb-4">
          <label class="block text-sm text-gray-400 mb-1 text-center">Amount</label>
          <input
            ref="hpInput"
            v-model.number="hpAmount"
            type="number"
            min="0"
            class="w-full px-3 py-3 bg-gray-700 text-white text-center text-2xl font-bold rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
          />
        </div>

        <!-- Action Buttons -->
        <div class="flex gap-3 mb-2">
          <button
            @click="applyDamage"
            :disabled="!hpAmount || hpAmount <= 0"
            class="flex-1 py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-colors"
          >
            Apply Damage
          </button>
          <button
            @click="applyHealing"
            :disabled="!hpAmount || hpAmount <= 0"
            class="flex-1 py-2.5 bg-green-600 hover:bg-green-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-colors"
          >
            Apply Healing
          </button>
        </div>
        <p class="text-xs text-gray-500 text-center">Enter = damage, Shift+Enter = heal</p>

        <!-- Death Saves (players at 0 HP) -->
        <div v-if="showDeathSaves(selectedCombatant)" class="mt-4 p-3 bg-gray-900 rounded-lg border border-gray-700">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm text-gray-400 flex items-center gap-1">
              <span>&#x1F480;</span> Death Saves
            </span>
            <button
              @click="resetDeathSaves(selectedCombatant)"
              class="text-xs text-gray-500 hover:text-white transition-colors"
            >
              Reset
            </button>
          </div>
          <div class="space-y-2">
            <div class="flex items-center gap-3">
              <span class="text-xs text-green-400 w-16">Successes</span>
              <div class="flex gap-1.5">
                <button
                  v-for="i in 3"
                  :key="`ms${i}`"
                  @click="setSuccesses(selectedCombatant, i)"
                  class="w-6 h-6 rounded-full border-2 transition-colors"
                  :class="(selectedCombatant.deathSaves?.successes || 0) >= i
                    ? 'bg-green-500 border-green-400'
                    : 'bg-gray-800 border-gray-600 hover:border-green-500'"
                />
              </div>
            </div>
            <div class="flex items-center gap-3">
              <span class="text-xs text-red-400 w-16">Failures</span>
              <div class="flex gap-1.5">
                <button
                  v-for="i in 3"
                  :key="`mf${i}`"
                  @click="setFailures(selectedCombatant, i)"
                  class="w-6 h-6 rounded-full border-2 transition-colors"
                  :class="(selectedCombatant.deathSaves?.failures || 0) >= i
                    ? 'bg-red-500 border-red-400'
                    : 'bg-gray-800 border-gray-600 hover:border-red-500'"
                />
              </div>
            </div>
          </div>
          <div
            v-if="deathSaveStatus(selectedCombatant)"
            class="text-center mt-2 text-sm font-bold uppercase"
            :class="deathSaveStatus(selectedCombatant) === 'STABLE' ? 'text-green-400' : 'text-red-500'"
          >
            {{ deathSaveStatus(selectedCombatant) === 'STABLE' ? 'Stabilized' : 'Dead' }}
          </div>
        </div>
      </div>
    </div>

    <!-- Enemy Info Modal -->
    <div
      v-if="showInfoModal && selectedCombatant"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      @click.self="showInfoModal = false"
    >
      <!-- Full stat block view -->
      <div v-if="selectedCombatant.stats" class="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div class="relative">
          <button
            @click="showInfoModal = false"
            class="absolute top-2 right-2 z-10 p-1.5 bg-gray-900/80 rounded-full text-gray-400 hover:text-white transition-colors"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <CharacterStatBlock
            :character="selectedCombatant.stats"
            :show-hp-tracker="true"
            :disposition="selectedCombatant.disposition"
            @update:character="onStatsHpUpdate"
          />
        </div>
      </div>

      <!-- Simple info view (no stats) -->
      <div v-else class="bg-gray-800 rounded-lg border border-gray-700 p-6 w-full max-w-sm">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-white">{{ selectedCombatant.name }}</h3>
          <button
            @click="showInfoModal = false"
            class="p-1 text-gray-400 hover:text-white transition-colors"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Portrait -->
        <div class="flex justify-center mb-4">
          <div class="w-24 h-24 rounded-lg overflow-hidden border-2" :class="getCombatantBorderClass(selectedCombatant)">
            <img
              v-if="selectedCombatant.portraitPath"
              :src="`media://${selectedCombatant.portraitPath}`"
              :alt="selectedCombatant.name"
              class="w-full h-full object-cover"
            />
            <div v-else class="w-full h-full flex items-center justify-center text-3xl" :class="getCombatantBgClass(selectedCombatant)">
              {{ getCombatantIcon(selectedCombatant) }}
            </div>
          </div>
        </div>

        <!-- HP Bar -->
        <div v-if="selectedCombatant.maxHp > 0" class="mb-4">
          <div class="flex items-center justify-between mb-1">
            <span class="text-sm text-gray-400">HP</span>
            <span class="text-sm font-bold" :class="getHpColor(selectedCombatant)">
              {{ selectedCombatant.hp }} / {{ selectedCombatant.maxHp }}
            </span>
          </div>
          <div class="w-full h-4 bg-gray-700 rounded-full">
            <div
              class="h-full rounded-full transition-all"
              :class="getHpBarColor(selectedCombatant)"
              :style="{ width: `${getHpPercent(selectedCombatant)}%` }"
            />
          </div>
        </div>

        <!-- Stats Grid -->
        <div class="grid grid-cols-2 gap-3">
          <div class="bg-gray-900 rounded-lg p-3 text-center">
            <div class="text-xs text-gray-500">AC</div>
            <div class="text-lg font-bold text-white">{{ selectedCombatant.ac }}</div>
          </div>
          <div class="bg-gray-900 rounded-lg p-3 text-center">
            <div class="text-xs text-gray-500">Initiative</div>
            <div class="text-lg font-bold text-white">{{ selectedCombatant.initiative }}</div>
          </div>
        </div>

        <!-- Notes -->
        <div v-if="selectedCombatant.notes" class="mt-4 p-3 bg-gray-900 rounded-lg">
          <div class="text-xs text-gray-500 mb-1">Notes</div>
          <p class="text-sm text-gray-300">{{ selectedCombatant.notes }}</p>
        </div>
      </div>
    </div>

    <!-- Clear Confirmation Modal -->
    <div
      v-if="showClearConfirm"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      @click.self="showClearConfirm = false"
    >
      <div class="bg-gray-800 rounded-lg border border-gray-700 p-6 w-full max-w-md">
        <h3 class="text-lg font-semibold text-white mb-4">Clear Initiative</h3>
        <p class="text-gray-300 mb-6">Remove all combatants and reset the tracker?</p>
        <div class="flex gap-3">
          <button
            @click="showClearConfirm = false"
            class="flex-1 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            @click="clearAll"
            class="flex-1 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors"
          >
            Clear All
          </button>
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
import { ref, onMounted, nextTick } from 'vue'
import AppLayout from '../components/AppLayout.vue'
import CharacterStatBlock from '../components/CharacterStatBlock.vue'
import { useInitiativeStore, usePartyStore, useEncounterStore } from '../stores'
import type { Combatant, CombatantType, CharacterStats, Enemy } from '../types'
import { calculateModifier } from '../utils/abilityFormatter'

const initiativeStore = useInitiativeStore()
const partyStore = usePartyStore()
const encounterStore = useEncounterStore()

const showAddModal = ref(false)
const showClearConfirm = ref(false)
const showNoteModal = ref(false)
const showEncounterModal = ref(false)
const showHpModal = ref(false)
const showInfoModal = ref(false)
const selectedCombatant = ref<Combatant | null>(null)
const hpAmount = ref(0)
const hpInput = ref<HTMLInputElement | null>(null)
const toast = ref<string | null>(null)
const addingTagForId = ref<string | null>(null)
const newTagValue = ref('')
const tagInput = ref<HTMLInputElement | null>(null)

const addForm = ref({
  name: '',
  type: 'enemy' as CombatantType,
  initiative: 0,
  ac: 10,
  maxHp: 0,
  hp: 0
})

const noteForm = ref({
  text: '',
  initiative: 20
})

onMounted(async () => {
  await partyStore.initialize()
  await initiativeStore.initialize()
  await encounterStore.initialize()
})

function getCombatantRowClass(combatant: Combatant, index: number): string {
  const isCurrentTurn = index === initiativeStore.currentTurn

  if (isCurrentTurn) {
    return 'bg-green-900/30 border-green-500 ring-1 ring-green-500/30 scale-[1.01]'
  }
  if (combatant.type === 'note') {
    return 'bg-gray-800 border-yellow-500/50'
  }
  if (combatant.type === 'player') {
    return 'bg-gray-800 border-blue-500/50'
  }
  if (combatant.disposition === 'friendly') return 'bg-gray-800 border-green-500/50'
  if (combatant.disposition === 'neutral') return 'bg-gray-800 border-yellow-500/50'
  return 'bg-gray-800 border-red-500/50'
}

function getTypeBadgeClass(type: CombatantType, disposition?: string): string {
  if (type === 'note') return 'text-yellow-500'
  if (type === 'player') return 'text-blue-500'
  if (disposition === 'friendly') return 'text-green-500'
  if (disposition === 'neutral') return 'text-yellow-500'
  return 'text-red-500'
}

function getCombatantBorderClass(combatant: Combatant): string {
  if (combatant.type === 'player') return 'border-blue-500'
  if (combatant.disposition === 'friendly') return 'border-green-500'
  if (combatant.disposition === 'neutral') return 'border-yellow-500'
  return 'border-red-500'
}

function getCombatantBgClass(combatant: Combatant): string {
  if (combatant.type === 'player') return 'bg-blue-900 text-blue-300'
  if (combatant.disposition === 'friendly') return 'bg-green-900 text-green-300'
  if (combatant.disposition === 'neutral') return 'bg-yellow-900 text-yellow-300'
  return 'bg-red-900 text-red-300'
}

function getCombatantIcon(combatant: Combatant): string {
  if (combatant.type === 'player') return '\u{1F464}'
  if (combatant.disposition === 'friendly') return '\u{1F91D}'
  if (combatant.disposition === 'neutral') return '\u{1F610}'
  return '\u{1F479}'
}

function getHpPercent(combatant: Combatant): number {
  if (combatant.maxHp <= 0) return 0
  return Math.max(0, Math.min(100, (combatant.hp / combatant.maxHp) * 100))
}

function getHpColor(combatant: Combatant): string {
  const ratio = combatant.maxHp > 0 ? combatant.hp / combatant.maxHp : 0
  if (ratio >= 0.75) return 'text-green-400'
  if (ratio >= 0.25) return 'text-yellow-400'
  return 'text-red-400'
}

function getHpBarColor(combatant: Combatant): string {
  const ratio = combatant.maxHp > 0 ? combatant.hp / combatant.maxHp : 0
  if (ratio >= 0.75) return 'bg-green-500'
  if (ratio >= 0.25) return 'bg-yellow-500'
  return 'bg-red-500'
}

function showDeathSaves(combatant: Combatant | null): boolean {
  if (!combatant) return false
  if (combatant.maxHp <= 0 || combatant.hp !== 0) return false
  if (combatant.type === 'player') return true
  return combatant.type === 'enemy' && combatant.disposition === 'friendly'
}

function deathSaveStatus(combatant: Combatant | null): 'STABLE' | 'DEAD' | null {
  if (!showDeathSaves(combatant)) return null
  const ds = combatant!.deathSaves
  if (!ds) return null
  if (ds.failures >= 3) return 'DEAD'
  if (ds.successes >= 3) return 'STABLE'
  return null
}

function deathSavesTitle(combatant: Combatant): string {
  const s = combatant.deathSaves?.successes || 0
  const f = combatant.deathSaves?.failures || 0
  return `Death Saves: ${s} successes, ${f} failures`
}

function setSuccesses(combatant: Combatant | null, target: number): void {
  if (!combatant) return
  const current = combatant.deathSaves?.successes || 0
  const next = current >= target ? target - 1 : target
  updateDeathSaves(combatant, { successes: next, failures: combatant.deathSaves?.failures || 0 })
}

function setFailures(combatant: Combatant | null, target: number): void {
  if (!combatant) return
  const current = combatant.deathSaves?.failures || 0
  const next = current >= target ? target - 1 : target
  updateDeathSaves(combatant, { successes: combatant.deathSaves?.successes || 0, failures: next })
}

function resetDeathSaves(combatant: Combatant | null): void {
  if (!combatant) return
  initiativeStore.updateCombatant(combatant.id, { deathSaves: undefined })
  if (selectedCombatant.value?.id === combatant.id) {
    selectedCombatant.value = { ...selectedCombatant.value, deathSaves: undefined }
  }
  initiativeStore.saveInitiative()
}

function updateDeathSaves(
  combatant: Combatant,
  deathSaves: { successes: number; failures: number }
): void {
  const clamped = {
    successes: Math.max(0, Math.min(3, deathSaves.successes)),
    failures: Math.max(0, Math.min(3, deathSaves.failures))
  }
  initiativeStore.updateCombatant(combatant.id, { deathSaves: clamped })
  if (selectedCombatant.value?.id === combatant.id) {
    selectedCombatant.value = { ...selectedCombatant.value, deathSaves: clamped }
  }
  initiativeStore.saveInitiative()
}

function addPartyToInitiative(): void {
  if (!partyStore.hasMembers) return

  const existingIds = new Set(initiativeStore.combatants.map(c => c.id))

  let addedCount = 0
  for (const member of partyStore.members) {
    if (existingIds.has(member.id)) continue

    const combatant: Combatant = {
      id: member.id,
      name: member.name,
      type: 'player',
      initiative: 0,
      hp: 0,
      maxHp: 0,
      ac: member.ac,
      portraitPath: member.portraitPath
    }

    initiativeStore.addCombatant(combatant)
    addedCount++
  }

  if (addedCount > 0) {
    initiativeStore.saveInitiative()
    showToast(`Added ${addedCount} party member${addedCount !== 1 ? 's' : ''}`)
  } else {
    showToast('Party members already in initiative')
  }
}

async function addEncounterToInitiative(filePath: string): Promise<void> {
  const success = await encounterStore.loadEncounter(filePath)
  if (!success) return

  let addedCount = 0
  for (const enemy of encounterStore.enemies) {
    const combatant: Combatant = {
      id: crypto.randomUUID(),
      name: enemy.name,
      type: 'enemy',
      initiative: rollEnemyInitiative(enemy),
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
    showToast(`Added ${addedCount} character${addedCount !== 1 ? 's' : ''} from ${encounterStore.encounterName}`)
  }
  showEncounterModal.value = false
}

function rollEnemyInitiative(enemy: Enemy): number {
  const dexMod = enemy.stats
    ? calculateModifier(enemy.stats.abilityScores.dexterity)
    : 0
  return Math.floor(Math.random() * 20) + 1 + dexMod
}

function openAddCombatant(): void {
  addForm.value = { name: '', type: 'enemy', initiative: 0, ac: 10, maxHp: 0, hp: 0 }
  showAddModal.value = true
}

function addManualCombatant(): void {
  if (!addForm.value.name.trim()) return

  const hp = addForm.value.hp || addForm.value.maxHp
  const combatant: Combatant = {
    id: crypto.randomUUID(),
    name: addForm.value.name.trim(),
    type: addForm.value.type,
    initiative: addForm.value.initiative,
    hp,
    maxHp: addForm.value.maxHp,
    ac: addForm.value.ac
  }

  initiativeStore.addCombatant(combatant)
  initiativeStore.saveInitiative()
  showAddModal.value = false
  showToast(`Added ${combatant.name}`)
}

function openAddNote(): void {
  noteForm.value = { text: '', initiative: 20 }
  showNoteModal.value = true
}

function addNote(): void {
  if (!noteForm.value.text.trim()) return

  const combatant: Combatant = {
    id: crypto.randomUUID(),
    name: noteForm.value.text.trim(),
    type: 'note',
    initiative: noteForm.value.initiative,
    hp: 0,
    maxHp: 0,
    ac: 0
  }

  initiativeStore.addCombatant(combatant)
  initiativeStore.saveInitiative()
  showNoteModal.value = false
  showToast('Note added')
}

function openHpModal(combatant: Combatant): void {
  selectedCombatant.value = combatant
  hpAmount.value = 0
  showHpModal.value = true
  nextTick(() => {
    hpInput.value?.focus()
    hpInput.value?.select()
  })
}

function applyDamage(): void {
  if (!selectedCombatant.value || !hpAmount.value || hpAmount.value <= 0) return
  const newHp = Math.max(0, selectedCombatant.value.hp - hpAmount.value)
  const updates: Partial<Combatant> = { hp: newHp }
  if (selectedCombatant.value.stats) {
    const updatedStats = { ...selectedCombatant.value.stats, currentHitPoints: newHp }
    updates.stats = updatedStats
    selectedCombatant.value = { ...selectedCombatant.value, hp: newHp, stats: updatedStats }
  } else {
    selectedCombatant.value = { ...selectedCombatant.value, hp: newHp }
  }
  initiativeStore.updateCombatant(selectedCombatant.value.id, updates)
  initiativeStore.saveInitiative()
  hpAmount.value = 0
}

function applyHealing(): void {
  if (!selectedCombatant.value || !hpAmount.value || hpAmount.value <= 0) return
  const newHp = Math.min(selectedCombatant.value.maxHp, selectedCombatant.value.hp + hpAmount.value)
  const updates: Partial<Combatant> = { hp: newHp }
  if (newHp > 0 && selectedCombatant.value.deathSaves) {
    updates.deathSaves = undefined
  }
  if (selectedCombatant.value.stats) {
    const updatedStats = { ...selectedCombatant.value.stats, currentHitPoints: newHp }
    updates.stats = updatedStats
    selectedCombatant.value = {
      ...selectedCombatant.value,
      hp: newHp,
      stats: updatedStats,
      deathSaves: newHp > 0 ? undefined : selectedCombatant.value.deathSaves
    }
  } else {
    selectedCombatant.value = {
      ...selectedCombatant.value,
      hp: newHp,
      deathSaves: newHp > 0 ? undefined : selectedCombatant.value.deathSaves
    }
  }
  initiativeStore.updateCombatant(selectedCombatant.value.id, updates)
  initiativeStore.saveInitiative()
  hpAmount.value = 0
}

function onStatsHpUpdate(updatedStats: CharacterStats): void {
  if (!selectedCombatant.value) return
  const newHp = updatedStats.currentHitPoints ?? updatedStats.maxHitPoints
  const updates: Partial<Combatant> = { stats: updatedStats, hp: newHp }
  if (newHp > 0 && selectedCombatant.value.deathSaves) {
    updates.deathSaves = undefined
  }
  initiativeStore.updateCombatant(selectedCombatant.value.id, updates)
  selectedCombatant.value = {
    ...selectedCombatant.value,
    stats: updatedStats,
    hp: newHp,
    deathSaves: newHp > 0 ? undefined : selectedCombatant.value.deathSaves
  }
  initiativeStore.saveInitiative()
}

function handleHpKeydown(event: KeyboardEvent): void {
  if (event.key === 'Enter') {
    event.preventDefault()
    if (event.shiftKey) {
      applyHealing()
    } else {
      applyDamage()
    }
  }
}

function openInfoModal(combatant: Combatant): void {
  selectedCombatant.value = combatant
  showInfoModal.value = true
}

function updateInitiative(id: string, event: Event): void {
  const value = parseInt((event.target as HTMLInputElement).value, 10)
  if (isNaN(value)) return

  const currentId = initiativeStore.currentCombatant?.id

  initiativeStore.updateCombatant(id, { initiative: value })

  if (currentId) {
    const newIndex = initiativeStore.combatants.findIndex(c => c.id === currentId)
    if (newIndex !== -1) {
      initiativeStore.setTurn(newIndex)
    }
  }

  initiativeStore.saveInitiative()
}

function removeCombatant(id: string): void {
  initiativeStore.removeCombatant(id)
  initiativeStore.saveInitiative()
}

function startAddTag(id: string): void {
  addingTagForId.value = id
  newTagValue.value = ''
  nextTick(() => {
    tagInput.value?.focus()
  })
}

function cancelAddTag(): void {
  addingTagForId.value = null
  newTagValue.value = ''
}

function confirmAddTag(id: string): void {
  const tag = newTagValue.value.trim()
  if (!tag) {
    cancelAddTag()
    return
  }
  const combatant = initiativeStore.combatants.find((c) => c.id === id)
  if (!combatant) return
  const existing = combatant.tags || []
  if (existing.includes(tag)) {
    cancelAddTag()
    return
  }
  initiativeStore.updateCombatant(id, { tags: [...existing, tag] })
  initiativeStore.saveInitiative()
  cancelAddTag()
}

function removeTag(id: string, tag: string): void {
  const combatant = initiativeStore.combatants.find((c) => c.id === id)
  if (!combatant) return
  const tags = (combatant.tags || []).filter((t) => t !== tag)
  initiativeStore.updateCombatant(id, { tags })
  initiativeStore.saveInitiative()
}

function nextTurn(): void {
  initiativeStore.nextTurn()
  initiativeStore.saveInitiative()
}

function previousTurn(): void {
  initiativeStore.previousTurn()
  initiativeStore.saveInitiative()
}

function clearAll(): void {
  initiativeStore.clearInitiative()
  initiativeStore.saveInitiative()
  showClearConfirm.value = false
  showToast('Initiative cleared')
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function showToast(message: string): void {
  toast.value = message
  setTimeout(() => { toast.value = null }, 3000)
}
</script>
