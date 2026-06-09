<template>
  <div class="space-y-6">
    <!-- Basic Info -->
    <div>
      <label class="block text-sm text-gray-400 mb-1">Name</label>
      <input
        v-model="editedCharacter.name"
        type="text"
        class="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
      />
    </div>

    <!-- Combat Stats -->
    <div class="grid grid-cols-2 gap-4">
      <div>
        <label class="block text-sm text-gray-400 mb-1">Armor Class</label>
        <input
          v-model.number="editedCharacter.armorClass"
          type="number"
          min="1"
          class="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
        />
      </div>
      <div>
        <label class="block text-sm text-gray-400 mb-1">Max HP</label>
        <input
          v-model.number="editedCharacter.maxHitPoints"
          type="number"
          min="1"
          class="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
        />
      </div>
    </div>

    <!-- Ability Scores -->
    <div>
      <label class="block text-sm text-gray-400 mb-2">Ability Scores</label>
      <div class="grid grid-cols-6 gap-2">
        <div v-for="(_, ability) in editedCharacter.abilityScores" :key="ability">
          <label class="block text-xs text-gray-500 mb-1 text-center uppercase">{{ ability.substring(0, 3) }}</label>
          <input
            v-model.number="editedCharacter.abilityScores[ability]"
            type="number"
            min="1"
            max="30"
            class="w-full px-2 py-2 bg-gray-700 text-white text-center rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
          />
        </div>
      </div>
    </div>

    <!-- Speed -->
    <div>
      <label class="block text-sm text-gray-400 mb-2">Speed (ft.)</label>
      <div class="grid grid-cols-5 gap-2">
        <div>
          <label class="block text-xs text-gray-500 mb-1">Walk</label>
          <input
            v-model.number="editedCharacter.speed.walk"
            type="number"
            min="0"
            class="w-full px-2 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
          />
        </div>
        <div>
          <label class="block text-xs text-gray-500 mb-1">Fly</label>
          <input
            v-model.number="editedCharacter.speed.fly"
            type="number"
            min="0"
            class="w-full px-2 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
          />
        </div>
        <div>
          <label class="block text-xs text-gray-500 mb-1">Swim</label>
          <input
            v-model.number="editedCharacter.speed.swim"
            type="number"
            min="0"
            class="w-full px-2 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
          />
        </div>
        <div>
          <label class="block text-xs text-gray-500 mb-1">Climb</label>
          <input
            v-model.number="editedCharacter.speed.climb"
            type="number"
            min="0"
            class="w-full px-2 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
          />
        </div>
        <div>
          <label class="block text-xs text-gray-500 mb-1">Burrow</label>
          <input
            v-model.number="editedCharacter.speed.burrow"
            type="number"
            min="0"
            class="w-full px-2 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
          />
        </div>
      </div>
    </div>

    <!-- Portrait -->
    <PortraitPicker v-model="editedCharacter.portraitPath" />

    <!-- Tags -->
    <div>
      <label class="block text-sm text-gray-400 mb-1">Tags (comma-separated)</label>
      <input
        v-model="tagsString"
        type="text"
        placeholder="boss, undead, spellcaster"
        class="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
      />
    </div>

    <!-- Abilities -->
    <div>
      <div class="flex items-center justify-between mb-2">
        <label class="block text-sm text-gray-400">Abilities</label>
        <button
          @click="addAbility"
          class="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded transition-colors"
        >
          + Add Ability
        </button>
      </div>
      <div class="space-y-3">
        <div
          v-for="(ability, index) in editedCharacter.abilities"
          :key="ability.id"
          class="bg-gray-700 rounded-lg p-3"
        >
          <div class="flex items-start gap-2 mb-2">
            <input
              v-model="ability.name"
              type="text"
              placeholder="Ability name"
              class="flex-1 px-2 py-1 bg-gray-600 text-white rounded border border-gray-500 focus:border-blue-500 focus:outline-none text-sm"
            />
            <select
              v-model="ability.type"
              class="px-2 py-1 bg-gray-600 text-white rounded border border-gray-500 focus:border-blue-500 focus:outline-none text-sm"
            >
              <option value="trait">Trait</option>
              <option value="action">Action</option>
              <option value="bonus_action">Bonus Action</option>
              <option value="reaction">Reaction</option>
              <option value="legendary">Legendary</option>
            </select>
            <input
              v-model="ability.recharge"
              type="text"
              placeholder="Recharge"
              class="w-24 px-2 py-1 bg-gray-600 text-white rounded border border-gray-500 focus:border-blue-500 focus:outline-none text-sm"
            />
            <button
              @click="removeAbility(index)"
              class="p-1 text-red-400 hover:text-red-300"
            >
              &times;
            </button>
          </div>
          <textarea
            v-model="ability.description"
            placeholder="Description (include dice notation like 2d6+3 for clickable dice)"
            rows="2"
            class="w-full px-2 py-1 bg-gray-600 text-white rounded border border-gray-500 focus:border-blue-500 focus:outline-none text-sm resize-none"
          ></textarea>
        </div>
      </div>
    </div>

    <!-- Actions -->
    <div class="flex gap-3 pt-4 border-t border-gray-700">
      <button
        @click="$emit('cancel')"
        class="flex-1 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
      >
        Cancel
      </button>
      <button
        @click="save"
        class="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
      >
        Save Changes
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import PortraitPicker from './PortraitPicker.vue'
import type { CharacterStats, CharacterAbility } from '../types'

interface Props {
  character: CharacterStats
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'save', character: CharacterStats): void
  (e: 'cancel'): void
}>()

// Create a deep copy of the character for editing
const editedCharacter = ref<CharacterStats>(JSON.parse(JSON.stringify(props.character)))

// Watch for prop changes
watch(
  () => props.character,
  (newCharacter) => {
    editedCharacter.value = JSON.parse(JSON.stringify(newCharacter))
  }
)

// Computed string for tags
const tagsString = computed({
  get: () => editedCharacter.value.tags?.join(', ') || '',
  set: (val: string) => {
    editedCharacter.value.tags = val
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
  }
})

function addAbility(): void {
  const newAbility: CharacterAbility = {
    id: crypto.randomUUID(),
    name: '',
    type: 'action',
    description: ''
  }
  editedCharacter.value.abilities.push(newAbility)
}

function removeAbility(index: number): void {
  editedCharacter.value.abilities.splice(index, 1)
}

function save(): void {
  editedCharacter.value.updatedAt = new Date().toISOString()
  emit('save', editedCharacter.value)
}
</script>
