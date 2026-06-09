<template>
  <div
    v-if="show"
    class="absolute left-64 bottom-0 bg-gray-900 border-2 border-gray-600 rounded-xl shadow-2xl p-6 z-[100] min-w-[650px]"
  >
    <h3 class="text-xl font-bold text-white mb-5 pb-3 border-b-2 border-gray-600 flex items-center gap-2">
      <span class="text-2xl">🎲</span>
      <span>D&D 5e Ability Checks & Skills</span>
    </h3>
    <div class="grid grid-cols-2 gap-5">
      <div
        v-for="ability in abilities"
        :key="ability.name"
        class="bg-gray-800 rounded-lg p-4 border-l-4 transition-all hover:bg-gray-750"
        :class="ability.borderColor"
      >
        <!-- Ability Score Header -->
        <div class="flex items-center gap-2 mb-3 pb-2 border-b border-gray-700">
          <span class="text-2xl">{{ ability.icon }}</span>
          <div>
            <div class="font-bold text-white text-base">
              {{ ability.name }}
            </div>
            <div class="text-xs font-mono uppercase tracking-wider" :class="ability.textColor">
              {{ ability.abbr }}
            </div>
          </div>
        </div>

        <!-- Skills (if any) -->
        <div v-if="ability.skills.length > 0">
          <div class="space-y-1">
            <div
              v-for="skill in ability.skills"
              :key="skill"
              class="text-gray-200 text-sm pl-2 py-1.5 hover:bg-gray-700 rounded transition-colors cursor-pointer"
            >
              {{ skill }}
            </div>
          </div>
        </div>

        <!-- No skills message -->
        <div v-else class="text-gray-500 text-sm italic pl-2">
          No associated skills
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  show: boolean
}>()

const abilities = [
  {
    name: 'Strength',
    abbr: 'STR',
    icon: '💪',
    borderColor: 'border-red-500',
    textColor: 'text-red-400',
    skills: ['Athletics']
  },
  {
    name: 'Dexterity',
    abbr: 'DEX',
    icon: '🤸',
    borderColor: 'border-green-500',
    textColor: 'text-green-400',
    skills: ['Acrobatics', 'Sleight of Hand', 'Stealth']
  },
  {
    name: 'Constitution',
    abbr: 'CON',
    icon: '❤️',
    borderColor: 'border-orange-500',
    textColor: 'text-orange-400',
    skills: []
  },
  {
    name: 'Intelligence',
    abbr: 'INT',
    icon: '🧠',
    borderColor: 'border-blue-500',
    textColor: 'text-blue-400',
    skills: ['Arcana', 'History', 'Investigation', 'Nature', 'Religion']
  },
  {
    name: 'Wisdom',
    abbr: 'WIS',
    icon: '🦉',
    borderColor: 'border-purple-500',
    textColor: 'text-purple-400',
    skills: ['Animal Handling', 'Insight', 'Medicine', 'Perception', 'Survival']
  },
  {
    name: 'Charisma',
    abbr: 'CHA',
    icon: '⭐',
    borderColor: 'border-pink-500',
    textColor: 'text-pink-400',
    skills: ['Deception', 'Intimidation', 'Performance', 'Persuasion']
  }
]
</script>
