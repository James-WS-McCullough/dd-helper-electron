<template>
  <AppLayout>
    <div class="flex flex-col h-full">
      <!-- Header -->
      <div class="p-4 border-b border-gray-700 bg-gray-800">
        <div class="flex items-center gap-4">
          <h2 class="text-lg font-semibold text-white">Party Management</h2>
          <div class="flex-1" />
          <button
            @click="openAddMember"
            class="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition-colors"
          >
            + Add Member
          </button>
        </div>
        <p class="text-sm text-gray-400 mt-1">
          {{ partyStore.memberCount }} member{{ partyStore.memberCount !== 1 ? 's' : '' }}
        </p>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto p-4 bg-gray-900">
        <!-- Empty State -->
        <div v-if="!partyStore.hasMembers && !partyStore.isLoading" class="flex items-center justify-center h-full">
          <div class="text-center text-gray-500">
            <p class="text-5xl mb-4">&#x1F9D9;</p>
            <p>No party members yet</p>
            <p class="text-sm mt-2">Add your players to track their stats</p>
          </div>
        </div>

        <!-- Loading -->
        <div v-else-if="partyStore.isLoading" class="flex items-center justify-center h-full">
          <div class="animate-spin h-12 w-12 border-2 border-blue-400 border-t-transparent rounded-full"></div>
        </div>

        <!-- Party Table -->
        <div v-else class="space-y-3">
          <!-- Quick Roll Bar -->
          <div class="bg-gray-800 rounded-lg border border-gray-700 p-3 flex items-center gap-3 flex-wrap">
            <span class="text-sm text-gray-400 font-medium">Quick Roll:</span>
            <button
              @click="rollAllInitiative"
              class="px-3 py-1.5 bg-yellow-600 hover:bg-yellow-500 text-white text-sm rounded-lg transition-colors"
            >
              Initiative
            </button>
            <div class="w-px h-6 bg-gray-600" />
            <span class="text-xs text-gray-500">Saving Throws:</span>
            <button
              v-for="ability in abilityList"
              :key="ability"
              @click="rollAllSavingThrow(ability)"
              class="px-2 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs rounded transition-colors uppercase"
            >
              {{ ability.substring(0, 3) }}
            </button>
          </div>

          <!-- Roll Results -->
          <div
            v-if="rollResults.length > 0"
            class="bg-gray-800 rounded-lg border border-yellow-600/30 p-3"
          >
            <div class="flex items-center justify-between mb-2">
              <h3 class="text-sm font-semibold text-yellow-400">{{ rollLabel }}</h3>
              <button
                @click="rollResults = []"
                class="text-gray-500 hover:text-gray-300 text-sm"
              >
                Clear
              </button>
            </div>
            <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              <div
                v-for="result in rollResults"
                :key="result.memberId"
                class="bg-gray-900 rounded px-3 py-2 flex items-center justify-between"
              >
                <span class="text-sm text-gray-300 truncate mr-2">{{ result.name }}</span>
                <span class="text-lg font-bold text-white whitespace-nowrap">
                  {{ result.total }}
                  <span class="text-xs text-gray-500 font-normal">({{ result.roll }}{{ result.modifier >= 0 ? '+' : '' }}{{ result.modifier }})</span>
                </span>
              </div>
            </div>
          </div>

          <!-- Member Cards -->
          <div
            v-for="member in partyStore.members"
            :key="member.id"
            class="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden"
          >
            <!-- Member Header Row -->
            <div
              class="flex items-center gap-4 p-4 cursor-pointer hover:bg-gray-750"
              @click="toggleExpanded(member.id)"
            >
              <!-- Portrait -->
              <div
                v-if="member.portraitPath"
                class="w-12 h-12 rounded-full overflow-hidden border-2 border-gray-600 flex-shrink-0"
              >
                <img
                  :src="`media://${member.portraitPath}`"
                  :alt="member.name"
                  class="w-full h-full object-cover"
                />
              </div>
              <div
                v-else
                class="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center text-gray-400 text-lg font-bold flex-shrink-0"
              >
                {{ member.name.charAt(0) }}
              </div>

              <!-- Name & Class -->
              <div class="min-w-0 w-40">
                <h3 class="font-bold text-white truncate">{{ member.name }}</h3>
                <p class="text-xs text-gray-400">Lvl {{ member.level }} {{ member.class }}</p>
              </div>

              <!-- Key Stats -->
              <div class="flex items-center gap-4 flex-1">
                <div class="text-center">
                  <div class="text-xs text-gray-500">AC</div>
                  <div class="text-lg font-bold text-white">{{ member.ac }}</div>
                </div>
                <div class="text-center">
                  <div class="text-xs text-gray-500">Init</div>
                  <div class="text-lg font-bold text-white">{{ formatMod(getModifier(member.abilityScores.dexterity)) }}</div>
                </div>
                <div class="text-center">
                  <div class="text-xs text-gray-500">PP</div>
                  <div class="text-lg font-bold text-white">{{ getPassivePerception(member) }}</div>
                </div>

                <!-- Ability Score Row -->
                <div class="hidden lg:flex items-center gap-3 ml-4">
                  <div v-for="(score, ability) in member.abilityScores" :key="ability" class="text-center">
                    <div class="text-xs text-gray-500 uppercase">{{ String(ability).substring(0, 3) }}</div>
                    <div class="text-sm text-gray-300">{{ score }}</div>
                    <div class="text-xs text-gray-500">{{ formatMod(getModifier(score)) }}</div>
                  </div>
                </div>
              </div>

              <!-- Expand Arrow -->
              <div class="text-gray-500">
                <svg
                  class="w-5 h-5 transition-transform"
                  :class="{ 'rotate-180': expandedMemberId === member.id }"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            <!-- Expanded Detail -->
            <div v-if="expandedMemberId === member.id" class="border-t border-gray-700 p-4 bg-gray-850">
              <!-- Ability Scores (visible on small screens) -->
              <div class="lg:hidden grid grid-cols-6 gap-2 text-center mb-4">
                <div v-for="(score, ability) in member.abilityScores" :key="ability" class="bg-gray-900 rounded p-2">
                  <div class="text-xs text-gray-500 uppercase">{{ String(ability).substring(0, 3) }}</div>
                  <div class="text-lg font-bold text-white">{{ score }}</div>
                  <div class="text-xs text-gray-400">{{ formatMod(getModifier(score)) }}</div>
                </div>
              </div>

              <!-- Saving Throws -->
              <div class="mb-4">
                <h4 class="text-xs text-gray-500 uppercase mb-2 font-semibold">Saving Throws</h4>
                <div class="flex flex-wrap gap-2">
                  <div
                    v-for="ability in abilityList"
                    :key="ability"
                    class="px-3 py-1.5 rounded text-sm"
                    :class="member.savingThrowProficiencies?.[ability]
                      ? 'bg-green-900/40 text-green-400 border border-green-700/50'
                      : 'bg-gray-900 text-gray-400'"
                  >
                    <span class="uppercase font-medium">{{ ability.substring(0, 3) }}</span>
                    <span class="ml-1">{{ formatMod(getSavingThrowMod(member, ability)) }}</span>
                  </div>
                </div>
              </div>

              <!-- Skill Proficiencies -->
              <div v-if="member.skillProficiencies && Object.keys(member.skillProficiencies).length > 0" class="mb-4">
                <h4 class="text-xs text-gray-500 uppercase mb-2 font-semibold">Skill Proficiencies</h4>
                <div class="flex flex-wrap gap-2">
                  <div
                    v-for="(level, skill) in member.skillProficiencies"
                    :key="skill"
                    class="px-2 py-1 rounded text-xs"
                    :class="level === 'expertise'
                      ? 'bg-purple-900/40 text-purple-400 border border-purple-700/50'
                      : 'bg-blue-900/40 text-blue-400 border border-blue-700/50'"
                  >
                    {{ formatSkillName(String(skill)) }}
                    {{ formatMod(getSkillMod(member, String(skill))) }}
                    <span v-if="level === 'expertise'" class="ml-1 text-purple-500">(E)</span>
                  </div>
                </div>
              </div>

              <!-- Notes -->
              <div v-if="member.notes" class="mb-4">
                <h4 class="text-xs text-gray-500 uppercase mb-1 font-semibold">Notes</h4>
                <p class="text-sm text-gray-300">{{ member.notes }}</p>
              </div>

              <!-- Actions -->
              <div class="flex gap-2">
                <button
                  @click.stop="editMember(member)"
                  class="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded transition-colors"
                >
                  Edit
                </button>
                <button
                  @click.stop="confirmRemoveMember(member)"
                  class="px-3 py-1.5 bg-red-600/20 hover:bg-red-600/40 text-red-400 text-sm rounded transition-colors"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Add/Edit Member Modal -->
    <div
      v-if="showMemberModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto p-4"
      @click.self="showMemberModal = false"
    >
      <div class="bg-gray-800 rounded-lg border border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div class="p-4 border-b border-gray-700 flex items-center justify-between sticky top-0 bg-gray-800 z-10">
          <h3 class="text-lg font-semibold text-white">
            {{ editingMember ? 'Edit' : 'Add' }} Party Member
          </h3>
          <button @click="showMemberModal = false" class="p-1 text-gray-400 hover:text-white text-xl">
            &times;
          </button>
        </div>

        <div class="p-6 space-y-6">
          <!-- Basic Info -->
          <div class="grid grid-cols-2 gap-4">
            <div class="col-span-2 sm:col-span-1">
              <label class="block text-sm text-gray-400 mb-1">Name</label>
              <input
                v-model="formData.name"
                type="text"
                class="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div class="col-span-2 sm:col-span-1">
              <label class="block text-sm text-gray-400 mb-1">Class</label>
              <input
                v-model="formData.class"
                type="text"
                class="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label class="block text-sm text-gray-400 mb-1">Level</label>
              <input
                v-model.number="formData.level"
                type="number"
                min="1"
                max="20"
                class="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                @change="updateProficiencyBonus"
              />
            </div>
            <div>
              <label class="block text-sm text-gray-400 mb-1">AC</label>
              <input
                v-model.number="formData.ac"
                type="number"
                min="1"
                class="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <!-- Proficiency Bonus (auto-calculated) -->
          <div class="bg-gray-900 rounded-lg p-3 flex items-center gap-3">
            <span class="text-sm text-gray-400">Proficiency Bonus:</span>
            <span class="text-lg font-bold text-white">+{{ formData.proficiencyBonus }}</span>
            <span class="text-xs text-gray-500">(from level {{ formData.level }})</span>
          </div>

          <!-- Ability Scores -->
          <div>
            <h4 class="text-sm text-gray-400 mb-3 font-semibold">Ability Scores</h4>
            <div class="grid grid-cols-3 sm:grid-cols-6 gap-3">
              <div v-for="ability in abilityList" :key="ability" class="text-center">
                <label class="block text-xs text-gray-500 uppercase mb-1">{{ ability.substring(0, 3) }}</label>
                <input
                  v-model.number="formData.abilityScores[ability]"
                  type="number"
                  min="1"
                  max="30"
                  class="w-full px-2 py-2 bg-gray-700 text-white text-center rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                />
                <div class="text-xs text-gray-500 mt-1">{{ formatMod(getModifier(formData.abilityScores[ability])) }}</div>
              </div>
            </div>
          </div>

          <!-- Saving Throw Proficiencies -->
          <div>
            <h4 class="text-sm text-gray-400 mb-3 font-semibold">Saving Throw Proficiencies</h4>
            <div class="grid grid-cols-3 sm:grid-cols-6 gap-2">
              <button
                v-for="ability in abilityList"
                :key="ability"
                @click="toggleSaveProficiency(ability)"
                class="px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                :class="formData.savingThrowProficiencies[ability]
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-700 text-gray-400 hover:bg-gray-600'"
              >
                {{ ability.substring(0, 3).toUpperCase() }}
              </button>
            </div>
          </div>

          <!-- Skill Proficiencies -->
          <div>
            <h4 class="text-sm text-gray-400 mb-3 font-semibold">Skill Proficiencies</h4>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button
                v-for="skill in skillList"
                :key="skill"
                @click="cycleSkillProficiency(skill)"
                class="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors text-left"
                :class="getSkillButtonClass(skill)"
              >
                {{ formatSkillName(skill) }}
                <span v-if="formData.skillProficiencies[skill] === 'expertise'" class="text-purple-300 ml-1">(E)</span>
              </button>
            </div>
            <p class="text-xs text-gray-500 mt-2">Click to toggle: none &rarr; proficient &rarr; expertise &rarr; none</p>
          </div>

          <!-- Portrait -->
          <PortraitPicker v-model="formData.portraitPath" />

          <!-- Notes -->
          <div>
            <label class="block text-sm text-gray-400 mb-1">Notes</label>
            <textarea
              v-model="formData.notes"
              rows="2"
              class="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none resize-none"
              placeholder="Any additional notes..."
            />
          </div>

          <!-- Action Buttons -->
          <div class="flex gap-3">
            <button
              @click="showMemberModal = false"
              class="flex-1 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              @click="saveMember"
              :disabled="!formData.name.trim()"
              class="flex-1 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 text-white rounded-lg transition-colors"
            >
              {{ editingMember ? 'Save' : 'Add' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Remove Confirmation Modal -->
    <div
      v-if="showRemoveConfirm"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      @click.self="showRemoveConfirm = false"
    >
      <div class="bg-gray-800 rounded-lg border border-gray-700 p-6 w-full max-w-md">
        <h3 class="text-lg font-semibold text-white mb-4">Remove Party Member</h3>
        <p class="text-gray-300 mb-6">
          Remove "{{ removingMember?.name }}" from the party?
        </p>
        <div class="flex gap-3">
          <button
            @click="showRemoveConfirm = false"
            class="flex-1 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            @click="removeMember"
            class="flex-1 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors"
          >
            Remove
          </button>
        </div>
      </div>
    </div>

    <!-- Toast Notification -->
    <div
      v-if="toast"
      class="fixed bottom-20 right-4 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 shadow-lg z-50 transition-all"
    >
      <p class="text-sm text-white">{{ toast }}</p>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import AppLayout from '../components/AppLayout.vue'
import PortraitPicker from '../components/PortraitPicker.vue'
import { usePartyStore, useDirectoryStore } from '../stores'
import type { PartyMember } from '../types'
import { calculateModifier, formatModifier, getSkillAbility } from '../utils/abilityFormatter'
import type { AbilityScores, SkillProficiency } from '../types/characterStats'

const partyStore = usePartyStore()
const directoryStore = useDirectoryStore()

const abilityList: (keyof AbilityScores)[] = [
  'strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'
]

const skillList = [
  'acrobatics', 'animal handling', 'arcana', 'athletics', 'deception',
  'history', 'insight', 'intimidation', 'investigation', 'medicine',
  'nature', 'perception', 'performance', 'persuasion', 'religion',
  'sleight of hand', 'stealth', 'survival'
]

const expandedMemberId = ref<string | null>(null)
const showMemberModal = ref(false)
const showRemoveConfirm = ref(false)
const editingMember = ref<PartyMember | null>(null)
const removingMember = ref<PartyMember | null>(null)
const toast = ref<string | null>(null)

interface RollResult {
  memberId: string
  name: string
  roll: number
  modifier: number
  total: number
}

const rollResults = ref<RollResult[]>([])
const rollLabel = ref('')

const formData = ref(createEmptyForm())

function createEmptyForm() {
  return {
    name: '',
    class: 'Fighter',
    level: 1,
    ac: 10,
    proficiencyBonus: 2,
    abilityScores: {
      strength: 10,
      dexterity: 10,
      constitution: 10,
      intelligence: 10,
      wisdom: 10,
      charisma: 10
    } as AbilityScores,
    savingThrowProficiencies: {} as { [ability: string]: boolean },
    skillProficiencies: {} as { [skill: string]: SkillProficiency },
    portraitPath: undefined as string | undefined,
    notes: ''
  }
}

onMounted(async () => {
  console.log('[PartyManagement] Mounting, directory:', directoryStore.currentDirectory)
  console.log('[PartyManagement] Party store has', partyStore.memberCount, 'members before init')
  await directoryStore.initialize()
  console.log('[PartyManagement] Directory after init:', directoryStore.currentDirectory)
  await partyStore.initialize()
  console.log('[PartyManagement] Party store has', partyStore.memberCount, 'members after init')
})

function getModifier(score: number): number {
  return calculateModifier(score)
}

function formatMod(mod: number): string {
  return formatModifier(mod)
}

function getProficiencyBonus(level: number): number {
  return Math.ceil(level / 4) + 1
}

function getPassivePerception(member: PartyMember): number {
  const wisMod = getModifier(member.abilityScores.wisdom)
  const proficient = member.skillProficiencies?.['perception']
  let bonus = wisMod
  if (proficient === 'expertise') {
    bonus += member.proficiencyBonus * 2
  } else if (proficient === 'proficient') {
    bonus += member.proficiencyBonus
  }
  return 10 + bonus
}

function getSavingThrowMod(member: PartyMember, ability: string): number {
  const score = member.abilityScores[ability as keyof AbilityScores]
  const mod = getModifier(score)
  if (member.savingThrowProficiencies?.[ability]) {
    return mod + member.proficiencyBonus
  }
  return mod
}

function getSkillMod(member: PartyMember, skill: string): number {
  const ability = getSkillAbility(skill) as keyof AbilityScores
  const mod = getModifier(member.abilityScores[ability])
  const proficiency = member.skillProficiencies?.[skill]
  if (proficiency === 'expertise') {
    return mod + member.proficiencyBonus * 2
  } else if (proficiency === 'proficient') {
    return mod + member.proficiencyBonus
  }
  return mod
}

function formatSkillName(skill: string): string {
  return skill.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

function toggleExpanded(id: string): void {
  expandedMemberId.value = expandedMemberId.value === id ? null : id
}

// Rolling
function rollD20(): number {
  return Math.floor(Math.random() * 20) + 1
}

function rollAllInitiative(): void {
  rollLabel.value = 'Initiative Rolls'
  rollResults.value = partyStore.members.map(member => {
    const mod = getModifier(member.abilityScores.dexterity)
    const roll = rollD20()
    return {
      memberId: member.id,
      name: member.name,
      roll,
      modifier: mod,
      total: roll + mod
    }
  }).sort((a, b) => b.total - a.total)
}

function rollAllSavingThrow(ability: keyof AbilityScores): void {
  rollLabel.value = `${ability.charAt(0).toUpperCase() + ability.slice(1)} Saving Throws`
  rollResults.value = partyStore.members.map(member => {
    const mod = getSavingThrowMod(member, ability)
    const roll = rollD20()
    return {
      memberId: member.id,
      name: member.name,
      roll,
      modifier: mod,
      total: roll + mod
    }
  }).sort((a, b) => b.total - a.total)
}

// Member CRUD
function openAddMember(): void {
  editingMember.value = null
  formData.value = createEmptyForm()
  showMemberModal.value = true
}

function editMember(member: PartyMember): void {
  editingMember.value = member
  formData.value = {
    name: member.name,
    class: member.class,
    level: member.level,
    ac: member.ac,
    proficiencyBonus: member.proficiencyBonus,
    abilityScores: { ...member.abilityScores },
    savingThrowProficiencies: { ...member.savingThrowProficiencies },
    skillProficiencies: { ...(member.skillProficiencies || {}) } as { [skill: string]: SkillProficiency },
    portraitPath: member.portraitPath,
    notes: member.notes || ''
  }
  showMemberModal.value = true
}

function updateProficiencyBonus(): void {
  formData.value.proficiencyBonus = getProficiencyBonus(formData.value.level)
}

function toggleSaveProficiency(ability: string): void {
  formData.value.savingThrowProficiencies[ability] = !formData.value.savingThrowProficiencies[ability]
}

function cycleSkillProficiency(skill: string): void {
  const current = formData.value.skillProficiencies[skill]
  if (!current) {
    formData.value.skillProficiencies[skill] = 'proficient'
  } else if (current === 'proficient') {
    formData.value.skillProficiencies[skill] = 'expertise'
  } else {
    delete formData.value.skillProficiencies[skill]
  }
}

function getSkillButtonClass(skill: string): string {
  const level = formData.value.skillProficiencies[skill]
  if (level === 'expertise') return 'bg-purple-600 text-white'
  if (level === 'proficient') return 'bg-blue-600 text-white'
  return 'bg-gray-700 text-gray-400 hover:bg-gray-600'
}

async function saveMember(): Promise<void> {
  if (!formData.value.name.trim()) return

  // Clean up empty skill proficiencies
  const cleanSkills: { [skill: string]: SkillProficiency } = {}
  for (const [skill, level] of Object.entries(formData.value.skillProficiencies)) {
    if (level) cleanSkills[skill] = level
  }

  // Clean up false saving throw proficiencies
  const cleanSaves: { [ability: string]: boolean } = {}
  for (const [ability, proficient] of Object.entries(formData.value.savingThrowProficiencies)) {
    if (proficient) cleanSaves[ability] = true
  }

  if (editingMember.value) {
    partyStore.updateMember(editingMember.value.id, {
      name: formData.value.name.trim(),
      class: formData.value.class,
      level: formData.value.level,
      ac: formData.value.ac,
      proficiencyBonus: formData.value.proficiencyBonus,
      abilityScores: { ...formData.value.abilityScores },
      savingThrowProficiencies: cleanSaves,
      skillProficiencies: cleanSkills,
      portraitPath: formData.value.portraitPath || undefined,
      notes: formData.value.notes || undefined
    })
  } else {
    const member: PartyMember = {
      id: crypto.randomUUID(),
      name: formData.value.name.trim(),
      class: formData.value.class,
      level: formData.value.level,
      ac: formData.value.ac,
      proficiencyBonus: formData.value.proficiencyBonus,
      abilityScores: { ...formData.value.abilityScores },
      savingThrowProficiencies: cleanSaves,
      skillProficiencies: cleanSkills,
      portraitPath: formData.value.portraitPath || undefined,
      notes: formData.value.notes || undefined
    }
    partyStore.addMember(member)
  }

  showMemberModal.value = false
  const saved = await partyStore.savePartyData()
  if (!saved) {
    console.error('[PartyManagement] Save failed!', partyStore.lastError)
    showToast('Failed to save party data')
    return
  }
  showToast(editingMember.value ? 'Member updated' : 'Member added')
}

function confirmRemoveMember(member: PartyMember): void {
  removingMember.value = member
  showRemoveConfirm.value = true
}

async function removeMember(): Promise<void> {
  if (!removingMember.value) return
  partyStore.removeMember(removingMember.value.id)
  showRemoveConfirm.value = false
  if (expandedMemberId.value === removingMember.value.id) {
    expandedMemberId.value = null
  }
  removingMember.value = null
  const saved = await partyStore.savePartyData()
  if (!saved) {
    console.error('[PartyManagement] Save after remove failed!', partyStore.lastError)
  }
  showToast(saved ? 'Member removed' : 'Failed to save party data')
}

function showToast(message: string): void {
  toast.value = message
  setTimeout(() => { toast.value = null }, 3000)
}
</script>
