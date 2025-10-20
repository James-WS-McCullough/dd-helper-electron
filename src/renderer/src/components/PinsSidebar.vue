<template>
  <div class="w-64 bg-gray-800 border-l border-gray-700 flex flex-col h-full">
    <!-- Header -->
    <div class="p-4 border-b border-gray-700">
      <div class="flex items-center justify-between mb-1">
        <h3 class="text-lg font-semibold text-white">Quick Pins</h3>
        <div class="flex gap-1">
          <button
            ref="savePinBoardButton"
            @click="openSavePinBoardPopup"
            class="p-1.5 bg-blue-600 hover:bg-blue-700 rounded text-white transition-colors"
            title="Save pin board"
          >
            <span class="text-sm">💾</span>
          </button>
          <button
            ref="loadPinBoardButton"
            @click="openLoadPinBoardPopup"
            class="p-1.5 bg-green-600 hover:bg-green-700 rounded text-white transition-colors"
            title="Load pin board"
          >
            <span class="text-sm">📂</span>
          </button>
        </div>
      </div>
      <p class="text-xs text-gray-400">{{ pinsStore.pinnedItems.length }} pinned</p>
    </div>

    <!-- Pinned Items List -->
    <div class="flex-1 overflow-y-auto p-2">
      <div v-if="pinsStore.pinnedItems.length === 0" class="flex items-center justify-center h-full">
        <div class="text-center text-gray-500 px-4">
          <p class="text-3xl mb-2">📌</p>
          <p class="text-sm">No pinned items</p>
          <p class="text-xs mt-1">Pin items for quick access</p>
        </div>
      </div>

      <div v-else class="space-y-1">
        <!-- Image Pins Section -->
        <div v-if="pinsStore.imagePins.length > 0">
          <div class="px-2 py-1 text-xs font-semibold text-gray-400 uppercase">Images</div>
          <div
            v-for="pin in pinsStore.imagePins"
            :key="pin.id"
            class="group relative bg-gray-900 hover:bg-gray-750 rounded-lg overflow-hidden cursor-pointer transition-colors"
          >
            <div class="flex items-center gap-2 p-2" @click="handleTriggerPin(pin)">
              <!-- Thumbnail/Icon -->
              <div class="flex-shrink-0 w-12 h-12 rounded overflow-hidden" :class="pin.type === 'folder' ? 'flex items-center justify-center' : ''" :style="pin.type === 'folder' ? '' : 'background: #1f2937'">
                <!-- Image Thumbnail -->
                <img
                  v-if="pin.type === 'image'"
                  :src="`media://${pin.path}`"
                  :alt="pin.displayName"
                  class="w-full h-full object-cover"
                />
                <!-- Video Thumbnail -->
                <video
                  v-else-if="pin.type === 'video'"
                  :src="`media://${pin.path}`"
                  class="w-full h-full object-cover"
                  muted
                />
                <!-- Folder Icon -->
                <div v-else class="w-full h-full flex items-center justify-center text-2xl" :class="getIconBackground(pin)">
                  {{ getIcon(pin) }}
                </div>
              </div>

              <!-- Info -->
              <div class="flex-1 min-w-0">
                <p class="text-white text-sm font-medium truncate">{{ pin.displayName }}</p>
                <span class="text-xs px-1.5 py-0.5 rounded" :class="getBadgeClass(pin)">
                  {{ pin.type }}
                </span>
              </div>
            </div>

            <!-- Remove Button -->
            <button
              @click.stop="pinsStore.removePin(pin.id)"
              class="absolute top-1 right-1 p-1 bg-red-600 hover:bg-red-700 rounded opacity-0 group-hover:opacity-100 transition-opacity"
              title="Unpin"
            >
              <span class="text-white text-xs">✕</span>
            </button>
          </div>
        </div>

        <!-- Preset Pins Section -->
        <div v-if="pinsStore.presetPins.length > 0" class="mt-4">
          <div class="px-2 py-1 text-xs font-semibold text-gray-400 uppercase">Presets</div>
          <div
            v-for="pin in pinsStore.presetPins"
            :key="pin.id"
            :ref="(el) => setPresetCardRef(pin.id, el)"
            class="group relative bg-gray-900 hover:bg-gray-750 rounded-lg p-2 cursor-pointer transition-colors"
          >
            <div class="flex items-center gap-2" @click="handleTriggerPin(pin)">
              <!-- Icon -->
              <div class="flex-shrink-0 w-8 h-8 rounded flex items-center justify-center text-lg" :class="getIconBackground(pin)">
                {{ getIcon(pin) }}
              </div>

              <!-- Info -->
              <div class="flex-1 min-w-0">
                <p class="text-white text-sm font-medium truncate">{{ pin.displayName }}</p>
                <span class="text-xs px-1.5 py-0.5 rounded" :class="getBadgeClass(pin)">
                  {{ getPresetTypeLabel(pin.type) }}
                </span>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <!-- Rename Button -->
              <button
                @click.stop="openRenamePopup(pin)"
                class="p-1 bg-blue-600 hover:bg-blue-700 rounded"
                title="Rename preset"
              >
                <span class="text-white text-xs">✏️</span>
              </button>
              <!-- Remove Button -->
              <button
                @click.stop="pinsStore.removePin(pin.id)"
                class="p-1 bg-red-600 hover:bg-red-700 rounded"
                title="Unpin"
              >
                <span class="text-white text-xs">✕</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Audio Pins Section -->
        <div v-if="pinsStore.audioPins.length > 0" class="mt-4">
          <div class="px-2 py-1 text-xs font-semibold text-gray-400 uppercase">Audio</div>
          <div
            v-for="pin in pinsStore.audioPins"
            :key="pin.id"
            class="group relative bg-gray-900 hover:bg-gray-750 rounded-lg p-2 cursor-pointer transition-colors"
          >
            <div class="flex items-center gap-2" @click="handleTriggerPin(pin)">
              <!-- Icon -->
              <div class="flex-shrink-0 w-8 h-8 rounded flex items-center justify-center text-lg" :class="getIconBackground(pin)">
                {{ getIcon(pin) }}
              </div>

              <!-- Info -->
              <div class="flex-1 min-w-0">
                <p class="text-white text-sm font-medium truncate">{{ pin.displayName }}</p>
                <span class="text-xs px-1.5 py-0.5 rounded" :class="getBadgeClass(pin)">
                  {{ pin.type }}
                </span>
              </div>
            </div>

            <!-- Remove Button -->
            <button
              @click.stop="pinsStore.removePin(pin.id)"
              class="absolute top-1 right-1 p-1 bg-red-600 hover:bg-red-700 rounded opacity-0 group-hover:opacity-100 transition-opacity"
              title="Unpin"
            >
              <span class="text-white text-xs">✕</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Popups (Outside scrolling container) -->
  <Teleport to="body">
    <!-- Rename Popup -->
    <div
      v-if="renamePopupPin && renamePopupPosition"
      :style="{ left: renamePopupPosition.x + 'px', top: renamePopupPosition.y + 'px' }"
      class="rename-popup fixed bg-gray-900 border-2 border-gray-700 rounded-lg shadow-2xl p-4 z-[10000] w-64"
      @click.stop
    >
      <div class="space-y-3">
        <label class="block text-sm font-medium text-white">Rename Preset</label>
        <input
          ref="renameInput"
          v-model="newPresetName"
          type="text"
          class="w-full px-3 py-2 bg-gray-800 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
          placeholder="Enter preset name"
          @keyup.enter="saveRename"
          @keyup.escape="closeRenamePopup"
        />
        <div class="flex gap-2">
          <button
            @click="saveRename"
            class="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition-colors"
          >
            Save
          </button>
          <button
            @click="closeRenamePopup"
            class="flex-1 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm font-medium transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>

    <!-- Save Pin Board Popup -->
    <div
      v-if="showSavePinBoardPopup && savePinBoardPopupPosition"
      :style="{ left: savePinBoardPopupPosition.x + 'px', top: savePinBoardPopupPosition.y + 'px' }"
      class="save-pin-board-popup fixed bg-gray-900 border-2 border-gray-700 rounded-lg shadow-2xl p-4 z-[10000] w-64"
      @click.stop
    >
      <div class="space-y-3">
        <label class="block text-sm font-medium text-white">Save Pin Board</label>
        <input
          ref="savePinBoardInput"
          v-model="pinBoardName"
          type="text"
          class="w-full px-3 py-2 bg-gray-800 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
          placeholder="Enter board name"
          @keyup.enter="savePinBoard"
          @keyup.escape="closeSavePinBoardPopup"
        />
        <div class="flex gap-2">
          <button
            @click="savePinBoard"
            class="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition-colors"
          >
            Save
          </button>
          <button
            @click="closeSavePinBoardPopup"
            class="flex-1 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm font-medium transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>

    <!-- Load Pin Board Popup -->
    <div
      v-if="showLoadPinBoardPopup && loadPinBoardPopupPosition"
      :style="{ left: loadPinBoardPopupPosition.x + 'px', top: loadPinBoardPopupPosition.y + 'px' }"
      class="load-pin-board-popup fixed bg-gray-900 border-2 border-gray-700 rounded-lg shadow-2xl p-4 z-[10000] w-64 max-h-96 overflow-hidden flex flex-col"
      @click.stop
    >
      <div class="space-y-3 flex flex-col min-h-0">
        <label class="block text-sm font-medium text-white">Load Pin Board</label>

        <div v-if="isLoadingPinBoards" class="flex items-center justify-center py-8">
          <div class="animate-spin h-8 w-8 border-2 border-blue-400 border-t-transparent rounded-full"></div>
        </div>

        <div v-else-if="availablePinBoards.length === 0" class="text-center py-8 text-gray-400">
          <p class="text-sm">No saved pin boards</p>
        </div>

        <div v-else class="flex-1 overflow-y-auto space-y-1 min-h-0">
          <button
            v-for="board in availablePinBoards"
            :key="board"
            @click="loadPinBoard(board)"
            class="w-full text-left px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded text-white text-sm transition-colors"
          >
            {{ board }}
          </button>
        </div>

        <button
          @click="closeLoadPinBoardPopup"
          class="w-full px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm font-medium transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { usePinsStore, useDisplayStore } from '../stores'
import { useRouter } from 'vue-router'
import type { PinnedItem } from '../stores/pins'

const pinsStore = usePinsStore()
const displayStore = useDisplayStore()
const router = useRouter()

// Rename popup state
const renamePopupPin = ref<PinnedItem | null>(null)
const renamePopupPosition = ref<{ x: number; y: number } | null>(null)
const newPresetName = ref<string>('')
const renameInput = ref<HTMLInputElement | null>(null)

// Pin board save popup state
const showSavePinBoardPopup = ref(false)
const savePinBoardPopupPosition = ref<{ x: number; y: number } | null>(null)
const pinBoardName = ref<string>('')
const savePinBoardInput = ref<HTMLInputElement | null>(null)
const savePinBoardButton = ref<HTMLElement | null>(null)

// Pin board load popup state
const showLoadPinBoardPopup = ref(false)
const loadPinBoardPopupPosition = ref<{ x: number; y: number } | null>(null)
const loadPinBoardButton = ref<HTMLElement | null>(null)
const availablePinBoards = ref<string[]>([])
const isLoadingPinBoards = ref(false)

// Preset card refs
const presetCardRefs = new Map<string, HTMLElement>()

// Set preset card ref
function setPresetCardRef(id: string, el: any) {
  if (el && el instanceof HTMLElement) {
    presetCardRefs.set(id, el)
  } else {
    presetCardRefs.delete(id)
  }
}

// Calculate position for rename popup
function calculateRenamePopupPosition(cardEl: HTMLElement): { x: number; y: number } | null {
  const rect = cardEl.getBoundingClientRect()
  const popupWidth = 256 // w-64 = 16rem = 256px
  const popupHeight = 150 // approximate height
  const margin = 12

  // Position to the right of the card by default
  let x = rect.right + margin
  let y = rect.top

  // If it would go off the right edge, position to the left
  if (x + popupWidth > window.innerWidth - margin) {
    x = rect.left - popupWidth - margin
  }

  // Prevent going off the left edge
  if (x < margin) {
    x = margin
  }

  // Prevent going off the bottom edge
  if (y + popupHeight > window.innerHeight - margin) {
    y = window.innerHeight - popupHeight - margin
  }

  // Prevent going off the top edge
  if (y < margin) {
    y = margin
  }

  return { x, y }
}

// Open rename popup
async function openRenamePopup(pin: PinnedItem) {
  renamePopupPin.value = pin
  newPresetName.value = pin.displayName

  const cardEl = presetCardRefs.get(pin.id)
  if (cardEl) {
    renamePopupPosition.value = calculateRenamePopupPosition(cardEl)
  }

  // Focus input after popup appears
  await nextTick()
  renameInput.value?.focus()
  renameInput.value?.select()
}

// Close rename popup
function closeRenamePopup() {
  renamePopupPin.value = null
  renamePopupPosition.value = null
  newPresetName.value = ''
}

// Save renamed preset
function saveRename() {
  if (renamePopupPin.value && newPresetName.value.trim()) {
    pinsStore.renamePin(renamePopupPin.value.id, newPresetName.value.trim())
    closeRenamePopup()
  }
}

// Calculate position for popup relative to button
function calculatePopupPosition(buttonEl: HTMLElement | null): { x: number; y: number } | null {
  if (!buttonEl) return null

  const rect = buttonEl.getBoundingClientRect()
  const popupWidth = 256 // w-64
  const popupHeight = 200 // approximate
  const margin = 12

  // Position below the button
  let x = rect.left
  let y = rect.bottom + margin

  // Prevent going off the right edge
  if (x + popupWidth > window.innerWidth - margin) {
    x = window.innerWidth - popupWidth - margin
  }

  // Prevent going off the left edge
  if (x < margin) {
    x = margin
  }

  // Prevent going off the bottom edge
  if (y + popupHeight > window.innerHeight - margin) {
    y = rect.top - popupHeight - margin // Show above instead
  }

  // Prevent going off the top edge
  if (y < margin) {
    y = margin
  }

  return { x, y }
}

// Open save pin board popup
async function openSavePinBoardPopup() {
  showSavePinBoardPopup.value = true
  pinBoardName.value = ''
  savePinBoardPopupPosition.value = calculatePopupPosition(savePinBoardButton.value)

  await nextTick()
  savePinBoardInput.value?.focus()
}

// Close save pin board popup
function closeSavePinBoardPopup() {
  showSavePinBoardPopup.value = false
  savePinBoardPopupPosition.value = null
  pinBoardName.value = ''
}

// Save pin board
async function savePinBoard() {
  if (pinBoardName.value.trim()) {
    await pinsStore.savePinBoard(pinBoardName.value.trim())
    closeSavePinBoardPopup()
  }
}

// Open load pin board popup
async function openLoadPinBoardPopup() {
  showLoadPinBoardPopup.value = true
  loadPinBoardPopupPosition.value = calculatePopupPosition(loadPinBoardButton.value)

  isLoadingPinBoards.value = true
  availablePinBoards.value = await pinsStore.getAvailablePinBoards()
  isLoadingPinBoards.value = false
}

// Close load pin board popup
function closeLoadPinBoardPopup() {
  showLoadPinBoardPopup.value = false
  loadPinBoardPopupPosition.value = null
  availablePinBoards.value = []
}

// Load pin board
async function loadPinBoard(boardName: string) {
  await pinsStore.loadPinBoard(boardName)
  closeLoadPinBoardPopup()
}

// Close popup when clicking outside
function handleClickOutside(event: MouseEvent) {
  const target = event.target as HTMLElement

  if (renamePopupPin.value) {
    const clickedInsidePopup = target.closest('.rename-popup')
    if (!clickedInsidePopup) {
      closeRenamePopup()
    }
  }

  if (showSavePinBoardPopup.value) {
    const clickedInsideButton = savePinBoardButton.value?.contains(target)
    const clickedInsidePopup = target.closest('.save-pin-board-popup')
    if (!clickedInsidePopup && !clickedInsideButton) {
      closeSavePinBoardPopup()
    }
  }

  if (showLoadPinBoardPopup.value) {
    const clickedInsideButton = loadPinBoardButton.value?.contains(target)
    const clickedInsidePopup = target.closest('.load-pin-board-popup')
    if (!clickedInsidePopup && !clickedInsideButton) {
      closeLoadPinBoardPopup()
    }
  }
}

// Set up click outside listener
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

function getIcon(pin: PinnedItem): string {
  if (pin.type === 'folder') return '📁'
  if (pin.type === 'audio') return '🎵'
  if (pin.type === 'image') return '🖼️'
  if (pin.type === 'video') return '🎬'
  if (pin.type === 'preset') return '💾'
  if (pin.type === 'preset-images') return '🖼️'
  if (pin.type === 'preset-audio') return '🎵'
  return '📄'
}

function getIconBackground(pin: PinnedItem): string {
  if (pin.type === 'folder') return 'bg-blue-900/30'
  if (pin.type === 'audio') return 'bg-pink-900/30'
  if (pin.type === 'image') return 'bg-green-900/30'
  if (pin.type === 'video') return 'bg-purple-900/30'
  if (pin.type === 'preset' || pin.type === 'preset-images' || pin.type === 'preset-audio') return 'bg-orange-900/30'
  return 'bg-gray-700'
}

function getBadgeClass(pin: PinnedItem): string {
  if (pin.type === 'folder') return 'bg-blue-500/30 text-blue-200'
  if (pin.type === 'audio') return 'bg-pink-500/30 text-pink-200'
  if (pin.type === 'image') return 'bg-green-500/30 text-green-200'
  if (pin.type === 'video') return 'bg-purple-500/30 text-purple-200'
  if (pin.type === 'preset' || pin.type === 'preset-images' || pin.type === 'preset-audio') return 'bg-orange-500/30 text-orange-200'
  return 'bg-gray-500/30 text-gray-200'
}

function getPresetTypeLabel(type: string): string {
  if (type === 'preset') return 'full'
  if (type === 'preset-images') return 'images'
  if (type === 'preset-audio') return 'audio'
  return 'preset'
}

async function handleTriggerPin(pin: PinnedItem) {
  if (pin.type === 'folder') {
    // Navigate to the appropriate view and folder
    const route = pin.category === 'images' ? '/images' : '/audio'
    await router.push({
      path: route,
      query: { folder: pin.path }
    })
  } else if (pin.type === 'preset' || pin.type === 'preset-images' || pin.type === 'preset-audio') {
    // Restore preset
    await restorePreset(pin)
  } else {
    // Trigger the media item (play/display)
    await displayStore.displayMedia(
      pin.path,
      pin.mediaType || pin.type,
      pin.mediaSubtype || 'default',
      pin.displayName
    )
  }
}

// Restore a preset by replaying all display actions
async function restorePreset(pin: PinnedItem) {
  if (!pin.displayState) return

  const state = pin.displayState

  // Clear current state first if it's a full preset
  if (pin.type === 'preset') {
    await displayStore.clearAll()
    await displayStore.clearBackgroundMusic()
    await displayStore.clearAllBackgroundSounds()
    await displayStore.clearAllSoundEffects()
  } else if (pin.type === 'preset-images') {
    await displayStore.clearAllImages()
    await displayStore.clearAllPortraits()
  } else if (pin.type === 'preset-audio') {
    await displayStore.clearBackgroundMusic()
    await displayStore.clearAllBackgroundSounds()
    await displayStore.clearAllSoundEffects()
  }

  // Restore background
  if (state.background) {
    await displayStore.displayMedia(
      state.background.path,
      state.background.type,
      state.background.subtype || 'default',
      state.background.displayName
    )
  }

  // Restore event
  if (state.event) {
    await displayStore.displayMedia(
      state.event.path,
      state.event.type,
      state.event.subtype || 'default',
      state.event.displayName
    )
  }

  // Restore portraits
  if (state.portraits && state.portraits.length > 0) {
    for (const portrait of state.portraits) {
      await displayStore.displayMedia(
        portrait.path,
        portrait.type,
        portrait.subtype || 'default',
        portrait.displayName
      )
    }
    // Restore focused portrait
    if (state.focusedPortraitPath) {
      await displayStore.setFocusedPortrait(state.focusedPortraitPath)
    }
  }

  // Restore background music
  if (state.backgroundMusic) {
    await displayStore.displayMedia(
      state.backgroundMusic.path,
      state.backgroundMusic.type,
      state.backgroundMusic.subtype || 'default',
      state.backgroundMusic.displayName
    )
  }

  // Restore background sounds
  if (state.backgroundSounds && state.backgroundSounds.length > 0) {
    for (const sound of state.backgroundSounds) {
      await displayStore.displayMedia(
        sound.path,
        sound.type,
        sound.subtype || 'default',
        sound.displayName
      )
    }
  }

  // Restore sound effects
  if (state.soundEffects && state.soundEffects.length > 0) {
    for (const effect of state.soundEffects) {
      await displayStore.displayMedia(
        effect.path,
        effect.type,
        effect.subtype || 'default',
        effect.displayName
      )
    }
  }
}
</script>
