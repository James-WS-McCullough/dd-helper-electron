<template>
  <AppLayout>
    <div class="flex h-full bg-gray-900 text-gray-100">
      <!-- Left sidebar - Notes list -->
      <div class="w-64 border-r border-gray-700 flex flex-col bg-gray-850">
        <!-- Sidebar header -->
        <div class="p-4 border-b border-gray-700">
          <button
            @click="createNewNote"
            class="w-full px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded font-medium transition-colors"
          >
            + New Note
          </button>
        </div>

        <!-- Notes list -->
        <div class="flex-1 overflow-y-auto">
          <div v-if="notesStore.isLoading" class="p-4 text-center text-gray-400">
            Loading notes...
          </div>
          <div v-else-if="notesStore.notes.length === 0" class="p-4 text-center text-gray-500">
            No notes yet
          </div>
          <div v-else class="space-y-1 p-2">
            <button
              v-for="note in notesStore.notes"
              :key="note.id"
              @click="selectNote(note.id)"
              class="w-full text-left px-3 py-2 rounded transition-colors"
              :class="
                note.id === notesStore.currentNoteId
                  ? 'bg-purple-600 text-white'
                  : 'hover:bg-gray-700 text-gray-300'
              "
            >
              <div class="font-medium truncate">{{ note.title || 'Untitled' }}</div>
              <div class="text-xs opacity-70 truncate">
                {{ formatDate(note.updatedAt) }}
              </div>
            </button>
          </div>
        </div>
      </div>

      <!-- Main editor area -->
      <div class="flex-1 flex flex-col">
        <div v-if="currentNote" class="flex flex-col h-full">
          <!-- Header with title input and delete button -->
          <div
            class="flex items-center gap-4 px-6 py-4 border-b border-gray-700 bg-gray-800"
          >
            <input
              v-model="currentNote.title"
              @input="onTitleChange"
              type="text"
              placeholder="Untitled Note"
              class="flex-1 text-2xl font-bold bg-transparent border-none focus:outline-none text-gray-100"
            />
            <button
              @click="deleteCurrentNote"
              class="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded text-sm transition-colors"
            >
              Delete
            </button>
          </div>

          <!-- Content editor -->
          <div class="flex-1 p-6 overflow-hidden">
            <div
              ref="editorRef"
              contenteditable="true"
              @input="onContentInput"
              @keydown="onKeyDown"
              class="w-full h-full p-6 bg-gray-800 rounded-lg border border-gray-700 text-gray-100 text-base leading-relaxed focus:outline-none focus:border-purple-500 transition-colors overflow-auto"
              style="font-family: 'Menlo', 'Monaco', 'Lucida Console', 'Courier New', monospace; font-weight: 400;"
              data-placeholder="Write your notes here... Use markdown (*italic*, **bold**, # heading), checkboxes ([]), or dice notation (d20, 3d6), then press Enter to format!"
            ></div>
          </div>
        </div>

        <!-- Empty state -->
        <div v-else class="flex-1 flex items-center justify-center text-gray-500">
          <div class="text-center">
            <div class="text-6xl mb-4">📝</div>
            <p class="text-lg">No note selected</p>
            <p class="text-sm">Create a new note to get started</p>
          </div>
        </div>
      </div>

      <!-- Slash command menu -->
      <div
        v-if="showSlashMenu"
        class="fixed bg-gray-800 border border-purple-500 rounded-lg shadow-2xl py-2 z-50 min-w-64"
        :style="{
          left: slashMenuPosition.x + 'px',
          top: slashMenuPosition.y + 'px'
        }"
      >
        <div v-if="filteredCommands.length > 0">
          <button
            v-for="cmd in filteredCommands"
            :key="cmd.command"
            class="w-full text-left px-4 py-2 hover:bg-purple-600 transition-colors flex items-center gap-3"
            @click="insertSlashCommand(cmd.command)"
          >
            <span class="font-mono text-purple-400 font-bold">{{ cmd.label }}</span>
            <span class="text-gray-400 text-sm">{{ cmd.description }}</span>
          </button>
        </div>
        <div v-else class="px-4 py-2 text-gray-500 text-sm">No matching commands</div>
        <div class="px-4 py-1 text-xs text-gray-500 border-t border-gray-700 mt-1">
          <span class="text-purple-400">Tab</span> to complete · <span class="text-purple-400">Space</span> to cancel
        </div>
      </div>

      <!-- HP tooltip -->
      <div
        v-if="showHpTooltip"
        class="fixed bg-gray-800 border border-purple-500 rounded-lg shadow-2xl p-3 z-50"
        :style="{
          left: hpTooltipPosition.x + 'px',
          top: hpTooltipPosition.y + 'px'
        }"
      >
        <div class="flex items-center gap-2">
          <span class="text-gray-300 text-sm font-medium">
            {{ hpTooltipMode === 'damage' ? '💔 Damage' : '💚 Heal' }}
          </span>
        </div>
        <div class="flex items-center gap-2 mt-2">
          <input
            v-model="hpTooltipValue"
            type="number"
            min="1"
            placeholder="Amount"
            class="hp-tooltip-input w-24 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-gray-100 text-sm focus:outline-none focus:border-purple-500"
            @keydown="onHpTooltipKeydown"
          />
          <button
            @click="applyHpChange"
            class="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded text-sm transition-colors"
          >
            ✓
          </button>
          <button
            @click="closeHpTooltip"
            class="px-2 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded text-sm transition-colors"
          >
            ✕
          </button>
        </div>
        <div class="text-xs text-gray-500 mt-2">
          <span class="text-purple-400">Enter</span> to apply · <span class="text-purple-400">Esc</span> to cancel
        </div>
      </div>

      <!-- Image picker menu -->
      <div
        v-if="showImageMenu"
        class="fixed bg-gray-800 border border-purple-500 rounded-lg shadow-2xl p-3 z-50 w-96"
        :style="{
          left: imageMenuPosition.x + 'px',
          top: imageMenuPosition.y + 'px'
        }"
      >
        <div v-if="filteredImages.length > 0" class="grid grid-cols-3 gap-2">
          <button
            v-for="(img, index) in filteredImages"
            :key="img.path"
            @click="insertImage(img)"
            class="aspect-square rounded overflow-hidden border-2 transition-all"
            :class="index === selectedImageIndex ? 'border-purple-400 ring-2 ring-purple-400 scale-105' : 'border-gray-600 hover:border-purple-500'"
          >
            <img
              :src="`media://${img.path}`"
              :alt="getGMDisplayName(img)"
              class="w-full h-full object-cover"
            />
          </button>
        </div>
        <div v-else class="text-center py-6 text-gray-500 text-sm">
          No images found
        </div>
        <div class="mt-2 text-xs text-gray-500 border-t border-gray-700 pt-2">
          <span class="text-purple-400">↑↓</span> navigate · <span class="text-purple-400">Tab</span> to insert · <span class="text-purple-400">Esc</span> to cancel
        </div>
      </div>

      <!-- Toast notifications (lower-left corner) -->
      <div class="fixed bottom-6 left-6 space-y-3 z-50 pointer-events-none">
        <transition-group name="toast">
          <div
            v-for="toast in toasts"
            :key="toast.id"
            class="pointer-events-auto bg-gray-800 border border-purple-500 rounded-lg shadow-2xl p-4 min-w-80 max-w-md"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-2">
                  <span class="text-2xl">🎲</span>
                  <span class="text-purple-400 font-mono font-bold text-lg">{{
                    toast.result.notation
                  }}</span>
                </div>
                <div class="text-gray-400 text-sm mb-2">
                  Rolls: {{ toast.result.rolls.join(', ') }}
                  <span v-if="toast.result.modifier !== 0" class="text-yellow-400">
                    {{ toast.result.modifier > 0 ? ' + ' : ' - ' }}{{
                      Math.abs(toast.result.modifier)
                    }}
                  </span>
                </div>
                <div class="text-4xl font-bold text-green-400">{{ toast.result.total }}</div>
              </div>
              <button
                @click="removeToast(toast.id)"
                class="text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
          </div>
        </transition-group>
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import AppLayout from '../components/AppLayout.vue'
import { useNotesStore, type Note } from '../stores/notes'
import { parseDiceNotation, rollDice, type DiceRoll } from '../utils/diceRoller'
import { useDirectoryStore } from '../stores/directory'
import type { MediaFile } from '../types/media'
import { getAllVisualMedia } from '../utils/mediaFilters'
import { getGMDisplayName } from '../utils/displayNames'

interface Toast {
  id: number
  result: DiceRoll
  timeoutId: number
}

interface SlashCommand {
  command: string
  label: string
  description: string
}

const notesStore = useNotesStore()
const directoryStore = useDirectoryStore()
const editorRef = ref<HTMLDivElement | null>(null)
const toasts = ref<Toast[]>([])
const currentNote = ref<Note | null>(null)
const showSlashMenu = ref(false)
const slashMenuPosition = ref({ x: 0, y: 0 })
const slashQuery = ref('')
const showHpTooltip = ref(false)
const hpTooltipPosition = ref({ x: 0, y: 0 })
const hpTooltipMode = ref<'damage' | 'heal'>('damage')
const hpTooltipValue = ref('')
const currentHpElement = ref<HTMLElement | null>(null)
const showImageMenu = ref(false)
const imageMenuPosition = ref({ x: 0, y: 0 })
const imageSearchQuery = ref('')
const selectedImageIndex = ref(0)
const imageSearchStartPos = ref<{ node: Node; offset: number } | null>(null)

const slashCommands: SlashCommand[] = [
  { command: '/hp', label: '/hp', description: 'Insert HP tracker' },
  { command: '/dc', label: '/dc', description: 'Insert DC calculator' },
  { command: '/statblock', label: '/statblock', description: 'Insert stat block' },
  { command: '/img', label: '/img', description: 'Insert image from library' },
  { command: '/dctable', label: '/dctable', description: 'Insert DC check table' }
]

const filteredCommands = computed(() => {
  if (!slashQuery.value) return slashCommands
  const query = slashQuery.value.toLowerCase()
  return slashCommands.filter(cmd =>
    cmd.command.toLowerCase().includes(query)
  )
})

// Get filtered images based on search query
const filteredImages = computed(() => {
  const allImages = getAllVisualMedia(directoryStore.mediaTree)

  if (!imageSearchQuery.value) {
    return allImages.slice(0, 6) // Show first 6 by default
  }

  const query = imageSearchQuery.value.toLowerCase()
  return allImages
    .filter(img => {
      const displayName = getGMDisplayName(img).toLowerCase()
      const fileName = img.name.toLowerCase()
      return displayName.includes(query) || fileName.includes(query)
    })
    .slice(0, 6) // Limit to 6 results
})

let isProcessing = false
let toastIdCounter = 0
let autoSaveTimer: NodeJS.Timeout | null = null

// Get current note from store
const getCurrentNote = () => {
  return notesStore.getCurrentNote()
}

// Load notes on mount
onMounted(async () => {
  await notesStore.loadNotes()

  // Load the current note content
  const note = getCurrentNote()
  if (note) {
    currentNote.value = { ...note }
    await nextTick()
    if (editorRef.value) {
      editorRef.value.innerHTML = note.content || ''
      editorRef.value.addEventListener('click', handleDiceClick)
    }
  }
})

onUnmounted(() => {
  // Clean up any pending timeouts
  toasts.value.forEach((toast) => {
    clearTimeout(toast.timeoutId)
  })
  if (autoSaveTimer) {
    clearTimeout(autoSaveTimer)
  }
})

// Watch for note selection changes
watch(() => notesStore.currentNoteId, async () => {
  const note = getCurrentNote()
  if (note) {
    currentNote.value = { ...note }
    await nextTick()
    if (editorRef.value) {
      editorRef.value.innerHTML = note.content || ''
    }
  } else {
    currentNote.value = null
  }
})

// Auto-save function with debouncing
function scheduleAutoSave() {
  if (autoSaveTimer) {
    clearTimeout(autoSaveTimer)
  }

  autoSaveTimer = setTimeout(async () => {
    if (currentNote.value && editorRef.value) {
      // Create a plain object to avoid IPC cloning errors
      const noteToSave: Note = {
        id: currentNote.value.id,
        title: currentNote.value.title,
        content: editorRef.value.innerHTML,
        createdAt: currentNote.value.createdAt,
        updatedAt: currentNote.value.updatedAt // Keep current value, store will update it
      }
      const newUpdatedAt = await notesStore.saveNote(noteToSave)
      // Update local reference with new updatedAt time
      if (newUpdatedAt && currentNote.value) {
        currentNote.value.updatedAt = newUpdatedAt
      }
    }
  }, 500) // Auto-save after 0.5 seconds of inactivity
}

// Create a new note
async function createNewNote() {
  await notesStore.createNote()
  const note = getCurrentNote()
  if (note) {
    currentNote.value = { ...note }
    await nextTick()
    if (editorRef.value) {
      editorRef.value.innerHTML = ''
    }
  }
}

// Select a note
async function selectNote(noteId: string) {
  // Save current note before switching
  if (currentNote.value && editorRef.value) {
    const noteToSave: Note = {
      id: currentNote.value.id,
      title: currentNote.value.title,
      content: editorRef.value.innerHTML,
      createdAt: currentNote.value.createdAt,
      updatedAt: currentNote.value.updatedAt
    }
    await notesStore.saveNote(noteToSave)
  }

  notesStore.selectNote(noteId)
}

// Delete current note
async function deleteCurrentNote() {
  if (currentNote.value && confirm('Are you sure you want to delete this note?')) {
    await notesStore.deleteNote(currentNote.value.id)
    currentNote.value = null
  }
}

// Handle title changes
function onTitleChange() {
  scheduleAutoSave()
}

// Handle content input
function onContentInput(event: Event) {
  handleSlashInput(event as InputEvent)
  handleImageSearchInput()
  scheduleAutoSave()
}

// Handle input for image search
function handleImageSearchInput() {
  if (!showImageMenu.value || !editorRef.value) return

  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0) return

  const currentRange = selection.getRangeAt(0)

  try {
    // Get text before cursor to find "/img[" and extract search term
    const preCaretRange = currentRange.cloneRange()
    preCaretRange.selectNodeContents(editorRef.value)
    preCaretRange.setEnd(currentRange.endContainer, currentRange.endOffset)
    const textBeforeCursor = preCaretRange.toString()

    // Find the last "/img[" before cursor
    const imgIndex = textBeforeCursor.lastIndexOf('/img[')
    if (imgIndex === -1) {
      // No "/img[" found, close menu
      showImageMenu.value = false
      imageSearchQuery.value = ''
      imageSearchStartPos.value = null
      return
    }

    // Extract search term (everything after "/img[")
    const searchText = textBeforeCursor.substring(imgIndex + 5) // 5 = length of "/img["

    // If user added a newline or closing bracket, close the menu
    if (searchText.includes('\n') || searchText.includes(']')) {
      showImageMenu.value = false
      imageSearchQuery.value = ''
      imageSearchStartPos.value = null
      return
    }

    // Update search query
    imageSearchQuery.value = searchText
    selectedImageIndex.value = 0

    // Update menu position
    const tempSpan = document.createElement('span')
    tempSpan.textContent = '\u200B'
    const posRange = currentRange.cloneRange()
    posRange.insertNode(tempSpan)
    const rect = tempSpan.getBoundingClientRect()
    tempSpan.remove()

    // Normalize to fix any DOM issues from removing the span
    editorRef.value.normalize()

    imageMenuPosition.value = {
      x: rect.left,
      y: rect.bottom + 8
    }
  } catch (e) {
    console.error('Error in handleImageSearchInput:', e)
  }
}

// Format date for display
function formatDate(timestamp: number): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`

  return date.toLocaleDateString()
}

function handleDiceClick(event: MouseEvent) {
  const target = event.target as HTMLElement
  if (target.classList.contains('dice-roller')) {
    event.preventDefault()
    const notation = target.getAttribute('data-notation')
    if (notation) {
      rollDiceNotation(notation)
    }
  } else if (target.classList.contains('stat-dice-roller')) {
    event.preventDefault()
    const notation = target.getAttribute('data-notation')
    if (notation) {
      rollDiceNotation(notation)
    }
  } else if (target.classList.contains('hp-button')) {
    event.preventDefault()
    handleHpButtonClick(target)
  } else if (target.classList.contains('death-save-marker')) {
    event.preventDefault()
    handleDeathSaveClick(target)
  } else if (target.classList.contains('checkbox-marker')) {
    event.preventDefault()
    handleCheckboxClick(target)
  } else if (target.classList.contains('dc-table-add')) {
    event.preventDefault()
    handleDcTableAdd(target)
  } else if (target.classList.contains('dc-table-remove')) {
    event.preventDefault()
    handleDcTableRemove(target)
  }
}

function handleDeathSaveClick(marker: HTMLElement) {
  const hpId = marker.getAttribute('data-hp-id')
  const saveType = marker.getAttribute('data-save-type') as 'success' | 'failure'

  if (!hpId) return

  // Find the HP container and tracker
  const hpContainer = document.querySelector(`.hp-container[data-hp-id="${hpId}"]`) as HTMLElement
  if (!hpContainer) return

  const hpTracker = hpContainer.querySelector('.hp-tracker') as HTMLElement
  if (!hpTracker) return

  // Get current save counts
  let successes = parseInt(hpTracker.getAttribute('data-save-successes') || '0', 10)
  let failures = parseInt(hpTracker.getAttribute('data-save-failures') || '0', 10)

  // Check if this marker is already filled
  const isFilled = marker.textContent === '✓' || marker.textContent === '✗'

  if (isFilled) {
    // Unfill it - decrement the count
    if (saveType === 'success') {
      successes = Math.max(0, successes - 1)
    } else {
      failures = Math.max(0, failures - 1)
    }
    marker.textContent = '○'
  } else {
    // Fill it - increment the count
    if (saveType === 'success') {
      successes = Math.min(3, successes + 1)
      marker.textContent = '✓'
    } else {
      failures = Math.min(3, failures + 1)
      marker.textContent = '✗'
    }
  }

  // Update the tracker's data attributes
  hpTracker.setAttribute('data-save-successes', successes.toString())
  hpTracker.setAttribute('data-save-failures', failures.toString())

  // Trigger re-render to update the visual order
  setTimeout(() => {
    ensureEditorFocusAndRerender()
  }, 50)

  scheduleAutoSave()
}

function handleCheckboxClick(marker: HTMLElement) {
  const checkboxId = marker.getAttribute('data-checkbox-id')
  if (!checkboxId) return

  // Find the checkbox container
  const checkboxContainer = document.querySelector(`.checkbox-container[data-checkbox-id="${checkboxId}"]`) as HTMLElement
  if (!checkboxContainer) return

  // Get current checked state
  const isChecked = marker.getAttribute('data-checked') === 'true'

  // Toggle the state
  marker.setAttribute('data-checked', (!isChecked).toString())

  // Update the checkbox display
  const checkmark = marker.querySelector('.checkbox-checkmark') as HTMLElement
  if (checkmark) {
    checkmark.style.display = !isChecked ? 'block' : 'none'
  }

  // Find the checkbox text span and toggle strikethrough
  const textSpan = checkboxContainer.querySelector('.checkbox-text') as HTMLElement
  if (textSpan) {
    if (!isChecked) {
      textSpan.classList.add('checkbox-checked')
    } else {
      textSpan.classList.remove('checkbox-checked')
    }
  }

  scheduleAutoSave()
}

function handleHpButtonClick(button: HTMLElement) {
  const action = button.getAttribute('data-action') as 'damage' | 'heal'

  // Store reference to button for later use
  currentHpElement.value = button
  hpTooltipMode.value = action
  hpTooltipValue.value = ''

  // Position the tooltip below the button
  const rect = button.getBoundingClientRect()
  hpTooltipPosition.value = {
    x: rect.left,
    y: rect.bottom + 8
  }

  showHpTooltip.value = true

  // Focus the input after showing tooltip
  setTimeout(() => {
    const input = document.querySelector('.hp-tooltip-input') as HTMLInputElement
    if (input) {
      input.focus()
    }
  }, 50)
}

function onKeyDown(event: KeyboardEvent) {
  // Check for image menu navigation
  if (showImageMenu.value) {
    if (event.key === 'Tab') {
      event.preventDefault()
      if (filteredImages.value.length > 0) {
        insertSelectedImage()
      }
      return
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      selectedImageIndex.value = Math.min(selectedImageIndex.value + 1, filteredImages.value.length - 1)
      return
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      selectedImageIndex.value = Math.max(selectedImageIndex.value - 1, 0)
      return
    }
  }

  // Check for slash command menu
  if (event.key === 'Tab' && showSlashMenu.value) {
    // Tab key autocompletes the selected command
    event.preventDefault()
    if (filteredCommands.value.length > 0) {
      completeSlashCommand(filteredCommands.value[0].command)
    }
    return
  }

  if (event.key === ' ' && showSlashMenu.value) {
    // Space key closes the slash menu
    showSlashMenu.value = false
    slashQuery.value = ''
    return
  }

  if (event.key === 'Escape') {
    if (showSlashMenu.value) {
      showSlashMenu.value = false
      slashQuery.value = ''
      event.preventDefault()
      return
    }
    if (showImageMenu.value) {
      showImageMenu.value = false
      imageSearchQuery.value = ''
      imageSearchStartPos.value = null
      event.preventDefault()
      return
    }
  }

  if (event.key === 'Enter') {
    // Check if we're inside a DC table textarea - if so, allow default behavior
    const target = event.target as HTMLElement
    if (target && target.classList.contains('dc-table-text')) {
      // Let the textarea handle Enter naturally
      return
    }

    // Handle slash menu autocomplete
    if (showSlashMenu.value) {
      event.preventDefault()
      if (filteredCommands.value.length > 0) {
        completeSlashCommand(filteredCommands.value[0].command)
      }
      return
    }

    // Handle image menu insert
    if (showImageMenu.value) {
      event.preventDefault()
      if (filteredImages.value.length > 0) {
        insertSelectedImage()
      }
      return
    }

    // Normal line break behavior
    // Insert line breaks - this preserves content after cursor and moves it to new line
    // Insert <br> to end current line, then process markup to handle formatting
    const selection = window.getSelection()
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0)

      // Insert a line break
      const br = document.createElement('br')
      range.insertNode(br)

      // Move cursor after the br
      range.setStartAfter(br)
      range.collapse(true)
      selection.removeAllRanges()
      selection.addRange(range)
    }
    event.preventDefault()

    // Then process markup (dice and markdown)
    setTimeout(() => {
      processContentMarkup()
    }, 50)
    return
  }

  // Detect "/" key to trigger slash menu
  if (event.key === '/') {
    // Wait for "/" to be inserted into DOM before measuring position
    setTimeout(() => {
      const selection = window.getSelection()
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0)

        // Create a temporary element to measure cursor position
        const tempSpan = document.createElement('span')
        tempSpan.textContent = '\u200B' // Zero-width space
        range.insertNode(tempSpan)

        const rect = tempSpan.getBoundingClientRect()

        // Remove the temporary span
        tempSpan.remove()

        // Restore the selection
        range.collapse(false)
        selection.removeAllRanges()
        selection.addRange(range)

        // Position menu below and to the left of cursor
        slashMenuPosition.value = {
          x: rect.left,
          y: rect.bottom + 8
        }
        showSlashMenu.value = true
        slashQuery.value = ''
      }
    }, 0)
  }
}

// Handle input for slash command filtering
function handleSlashInput(_event: InputEvent) {
  if (!showSlashMenu.value) return

  // Get the current selection/cursor position
  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0) return

  const range = selection.getRangeAt(0)

  // Create a range from the start of the editor to the cursor
  const preCaretRange = range.cloneRange()
  preCaretRange.selectNodeContents(editorRef.value!)
  preCaretRange.setEnd(range.endContainer, range.endOffset)

  // Get only the text before the cursor
  const textBeforeCursor = preCaretRange.toString()

  // Find the last occurrence of "/" before the cursor
  const lastSlashIndex = textBeforeCursor.lastIndexOf('/')
  if (lastSlashIndex === -1) {
    showSlashMenu.value = false
    return
  }

  // Get the query after the last "/" (only up to cursor)
  const query = textBeforeCursor.substring(lastSlashIndex + 1)

  // If there's a space or newline in the query, close the menu
  if (query.includes(' ') || query.includes('\n')) {
    showSlashMenu.value = false
    slashQuery.value = ''
    return
  }

  slashQuery.value = query
}

// Complete slash command by replacing "/query" with the full command
function completeSlashCommand(command: string) {
  if (!editorRef.value) return

  // Get the selection
  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0) return

  const currentRange = selection.getRangeAt(0)

  // Get text before cursor to find the slash command
  const preCaretRange = currentRange.cloneRange()
  preCaretRange.selectNodeContents(editorRef.value)
  preCaretRange.setEnd(currentRange.endContainer, currentRange.endOffset)
  const textBeforeCursor = preCaretRange.toString()

  // Find the last "/" before cursor
  const lastSlashIndex = textBeforeCursor.lastIndexOf('/')
  if (lastSlashIndex === -1) return

  // Create a tree walker to find the text node containing "/"
  const walker = document.createTreeWalker(
    editorRef.value,
    NodeFilter.SHOW_TEXT
  )

  let currentNode: Node | null
  let charCount = 0
  let slashNode: Node | null = null
  let slashOffset = 0

  while ((currentNode = walker.nextNode())) {
    const nodeLength = currentNode.textContent?.length || 0

    if (charCount + nodeLength > lastSlashIndex) {
      slashNode = currentNode
      slashOffset = lastSlashIndex - charCount
      break
    }

    charCount += nodeLength
  }

  if (slashNode) {
    try {
      // Create range from "/" to cursor
      const range = document.createRange()
      range.setStart(slashNode, slashOffset)
      range.setEnd(currentRange.endContainer, currentRange.endOffset)

      // Delete the "/query" text
      range.deleteContents()

      // Handle /img specially
      if (command === '/img') {
        // Insert "/img[" text
        const textNode = document.createTextNode('/img[')
        range.insertNode(textNode)

        // Move cursor after the text
        range.setStartAfter(textNode)
        range.collapse(true)
        selection.removeAllRanges()
        selection.addRange(range)

        // Activate image search mode - store position after the "["
        imageSearchStartPos.value = {
          node: range.startContainer,
          offset: range.startOffset
        }
        imageSearchQuery.value = ''
        selectedImageIndex.value = 0
        showImageMenu.value = true

        // Position the menu
        const tempSpan = document.createElement('span')
        tempSpan.textContent = '\u200B'
        range.insertNode(tempSpan)
        const rect = tempSpan.getBoundingClientRect()
        tempSpan.remove()

        // Restore selection
        range.collapse(true)
        selection.removeAllRanges()
        selection.addRange(range)

        imageMenuPosition.value = {
          x: rect.left,
          y: rect.bottom + 8
        }
      } else {
        // Insert the completed command for other commands
        let insertText = ''
        if (command === '/hp') {
          insertText = '50/50hp '
        } else if (command === '/dc') {
          insertText = '/dc '
        } else if (command === '/statblock') {
          insertText = 'statblock[10,10,10,10,10,10] '
        } else if (command === '/dctable') {
          insertText = 'dctable[10:First check,15:Second check,20:Hard check] '
        } else {
          insertText = command + ' '
        }

        const textNode = document.createTextNode(insertText)
        range.insertNode(textNode)

        // Move cursor after the inserted text
        range.setStartAfter(textNode)
        range.collapse(true)
        selection.removeAllRanges()
        selection.addRange(range)
      }
    } catch (e) {
      console.error('Failed to complete command:', e)
    }
  }

  showSlashMenu.value = false
  slashQuery.value = ''
}

// Insert slash command with actual content (called when clicking menu item)
function insertSlashCommand(command: string) {
  // Just call completeSlashCommand - they do the same thing now
  completeSlashCommand(command)
}

function ensureEditorFocusAndRerender() {
  if (!editorRef.value) return

  // Focus the editor
  editorRef.value.focus()

  // Ensure there's a selection (place cursor at the end)
  const selection = window.getSelection()
  if (!selection) return

  // If there's no range, create one at the end of the content
  if (selection.rangeCount === 0) {
    const range = document.createRange()
    range.selectNodeContents(editorRef.value)
    range.collapse(false) // Collapse to end
    selection.removeAllRanges()
    selection.addRange(range)
  }

  // Now call processContentMarkup
  processContentMarkup()
}

function processContentMarkup() {
  if (!editorRef.value || isProcessing) return

  isProcessing = true

  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0) {
    isProcessing = false
    return
  }

  // Insert a unique marker element at cursor position to preserve it
  const range = selection.getRangeAt(0)
  const marker = document.createElement('span')
  marker.id = 'cursor-position-marker'
  marker.setAttribute('data-cursor-marker', 'true')
  marker.textContent = '\u200B' // Zero-width space to make it findable
  range.insertNode(marker)

  // STEP 1: Get the entire plain text content, preserving line breaks
  // We need to replace <br> tags with newlines before getting text
  const tempDiv = document.createElement('div')
  tempDiv.innerHTML = editorRef.value.innerHTML

  // IMPORTANT: Sync form element values from the live DOM to the clone
  // (innerHTML doesn't capture current input/textarea values)
  editorRef.value.querySelectorAll('.dc-table-dc').forEach((input, index) => {
    const clonedInput = tempDiv.querySelectorAll('.dc-table-dc')[index] as HTMLInputElement
    if (clonedInput && input instanceof HTMLInputElement) {
      clonedInput.value = input.value
    }
  })
  editorRef.value.querySelectorAll('.dc-table-text').forEach((textarea, index) => {
    const clonedTextarea = tempDiv.querySelectorAll('.dc-table-text')[index] as HTMLTextAreaElement
    if (clonedTextarea && textarea instanceof HTMLTextAreaElement) {
      clonedTextarea.value = textarea.value
    }
  })

  // Preserve the cursor marker by replacing it with a unique text placeholder
  const cursorMarkerElement = tempDiv.querySelector('#cursor-position-marker')
  const CURSOR_PLACEHOLDER = '___CURSOR_POSITION___'
  if (cursorMarkerElement) {
    const placeholderNode = document.createTextNode(CURSOR_PLACEHOLDER)
    cursorMarkerElement.parentNode?.replaceChild(placeholderNode, cursorMarkerElement)
  }

  // Preserve images by replacing them with placeholders
  const preservedImages: HTMLImageElement[] = []
  tempDiv.querySelectorAll('.inline-note-image').forEach((img, index) => {
    preservedImages.push(img.cloneNode(true) as HTMLImageElement)
    const placeholder = document.createTextNode(`___IMAGE_${index}___`)
    img.parentNode?.replaceChild(placeholder, img)
  })

  // Remove all existing dice buttons, HP buttons, death saves, stat blocks, and styled spans to get clean text
  tempDiv.querySelectorAll('[data-dice-button]').forEach(button => button.remove())
  tempDiv.querySelectorAll('[data-hp-button]').forEach(button => button.remove())
  tempDiv.querySelectorAll('[data-stat-button]').forEach(button => button.remove())
  tempDiv.querySelectorAll('.death-save-marker').forEach(button => button.remove())
  tempDiv.querySelectorAll('.death-saves').forEach(span => span.remove())
  tempDiv.querySelectorAll('.dice-notation').forEach(span => {
    const textNode = document.createTextNode(span.textContent || '')
    span.parentNode?.replaceChild(textNode, span)
  })
  // Replace HP containers with just the text content
  tempDiv.querySelectorAll('.hp-container').forEach(container => {
    const tracker = container.querySelector('.hp-tracker')
    if (tracker) {
      const textNode = document.createTextNode(tracker.textContent || '')
      container.parentNode?.replaceChild(textNode, container)
    }
  })
  // Replace stat block containers with just the original text pattern
  tempDiv.querySelectorAll('.stat-block-container').forEach(container => {
    const statItems = container.querySelectorAll('.stat-item')
    const scores: string[] = []
    statItems.forEach(item => {
      const scoreText = (item.querySelector('.stat-score') as HTMLElement)?.textContent || '10'
      scores.push(scoreText)
    })
    const textNode = document.createTextNode(`statblock[${scores.join(',')}]`)
    container.parentNode?.replaceChild(textNode, container)
  })

  // Replace checkbox containers with clean text representation
  tempDiv.querySelectorAll('.checkbox-container').forEach(container => {
    const marker = container.querySelector('.checkbox-marker') as HTMLElement
    const textSpan = container.querySelector('.checkbox-text') as HTMLElement
    if (marker && textSpan) {
      const isChecked = marker.getAttribute('data-checked') === 'true'
      const checkboxSymbol = isChecked ? '[x]' : '[]'
      const textContent = textSpan.textContent || ''
      const textNode = document.createTextNode(`${checkboxSymbol} ${textContent}`)
      container.parentNode?.replaceChild(textNode, container)
    }
  })

  // Replace DC table containers with text representation
  tempDiv.querySelectorAll('.dc-table-container').forEach(container => {
    const rows = container.querySelectorAll('.dc-table-row')
    const rowData: string[] = []
    rows.forEach(row => {
      const dcInput = row.querySelector('.dc-table-dc') as HTMLInputElement
      const textInput = row.querySelector('.dc-table-text') as HTMLTextAreaElement
      if (dcInput && textInput) {
        // Escape special characters in the text to preserve them
        const escapedText = textInput.value.replace(/\n/g, '\\n').replace(/,/g, '\\c')
        rowData.push(`${dcInput.value}:${escapedText}`)
      }
    })
    const textNode = document.createTextNode(`dctable[${rowData.join(',')}]`)
    container.parentNode?.replaceChild(textNode, container)
  })

  // Remove all markdown styling to get clean text
  tempDiv.querySelectorAll('.md-syntax, .md-content, .md-heading').forEach(span => {
    const textNode = document.createTextNode(span.textContent || '')
    span.parentNode?.replaceChild(textNode, span)
  })

  // Replace <br> with newlines
  tempDiv.querySelectorAll('br').forEach(br => {
    br.replaceWith('\n')
  })

  const fullText = tempDiv.textContent || ''

  // STEP 2: Process the entire text and build formatted HTML
  const lines = fullText.split('\n')
  let formattedHTML = ''

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i]

    // Process slash commands (replace /hp or \hp with their expansions)
    // Support both forward slash and backslash
    line = line.replace(/[/\\]hp\b/g, '50/50hp')
    line = line.replace(/[/\\]dc\b/g, '/dc') // Placeholder for future
    line = line.replace(/[/\\]statblock\b/g, 'statblock[10,10,10,10,10,10]')

    // Store checkbox information before processing markdown
    const originalLine = lines[i]
    const checkboxPattern = /^\s*\[([ xX]?)\]\s*(.*)$/
    const checkboxMatch = checkboxPattern.exec(originalLine)
    let hasCheckbox = false
    let isChecked = false
    let checkboxText = ''

    if (checkboxMatch) {
      hasCheckbox = true
      isChecked = checkboxMatch[1].toLowerCase() === 'x'
      checkboxText = checkboxMatch[2]
      // Remove the checkbox syntax from the line for further processing
      line = checkboxText
    }

    // Process markdown first (in order of precedence)
    // Bold: **text**
    line = line.replace(/\*\*(.+?)\*\*/g, (_match, content) => {
      return `<span class="md-syntax">**</span><span class="md-content md-bold">${escapeHtml(content)}</span><span class="md-syntax">**</span>`
    })

    // Italic: *text* (but not **)
    line = line.replace(/(?<!\*)\*([^*]+?)\*(?!\*)/g, (_match, content) => {
      return `<span class="md-syntax">*</span><span class="md-content md-italic">${escapeHtml(content)}</span><span class="md-syntax">*</span>`
    })

    // Headings (must be at start of line)
    // H3: ### text
    if (line.trim().startsWith('### ')) {
      line = line.replace(/^### (.+)$/, (_match, content) => {
        return `<span class="md-syntax">### </span><span class="md-heading md-h3">${escapeHtml(content)}</span>`
      })
    }
    // H2: ## text
    else if (line.trim().startsWith('## ')) {
      line = line.replace(/^## (.+)$/, (_match, content) => {
        return `<span class="md-syntax">## </span><span class="md-heading md-h2">${escapeHtml(content)}</span>`
      })
    }
    // H1: # text
    else if (line.trim().startsWith('# ')) {
      line = line.replace(/^# (.+)$/, (_match, content) => {
        return `<span class="md-syntax"># </span><span class="md-heading md-h1">${escapeHtml(content)}</span>`
      })
    }

    // Process dice notation on the original plain text (before markdown was added)
    const dicePattern = /\b(\d*d\d+(?:[+-]\d+)?)\b/gi
    const diceMatches: Array<{ notation: string; index: number }> = []
    let match: RegExpExecArray | null

    while ((match = dicePattern.exec(originalLine)) !== null) {
      const notation = match[1]
      if (parseDiceNotation(notation)) {
        diceMatches.push({ notation, index: match.index })
      }
    }

    // Add dice buttons by replacing in the already markdown-processed line
    // We need to be careful to only replace once per occurrence
    for (const { notation } of diceMatches) {
      // Use a non-global regex and replace only the first occurrence
      const diceRegex = new RegExp(`\\b${escapeRegex(notation)}\\b`)
      line = line.replace(diceRegex, (match) => {
        return `<span class="dice-notation">${escapeHtml(match)}</span><button class="dice-roller" data-dice-button="true" data-notation="${escapeHtml(match)}" contenteditable="false">🎲</button>`
      })
    }

    // Process HP notation (e.g., 50/50hp, 25/100hp)
    const hpPattern = /\b(\d+)\/(\d+)hp\b/gi
    const hpMatches: Array<{ match: string; current: string; max: string; index: number }> = []
    let hpMatch: RegExpExecArray | null

    while ((hpMatch = hpPattern.exec(originalLine)) !== null) {
      hpMatches.push({
        match: hpMatch[0],
        current: hpMatch[1],
        max: hpMatch[2],
        index: hpMatch.index
      })
    }

    // Process stat blocks (e.g., statblock[10,14,16,12,8,18])
    const statBlockPattern = /\bstatblock\[((?:\d+,){5}\d+)\]/gi
    const statBlockMatches: Array<{ match: string; scores: number[]; index: number }> = []
    let statBlockMatch: RegExpExecArray | null

    while ((statBlockMatch = statBlockPattern.exec(originalLine)) !== null) {
      const scoresStr = statBlockMatch[1]
      const scores = scoresStr.split(',').map(s => parseInt(s, 10))
      if (scores.length === 6) {
        statBlockMatches.push({
          match: statBlockMatch[0],
          scores,
          index: statBlockMatch.index
        })
      }
    }

    // Add stat blocks
    for (const { match, scores } of statBlockMatches) {
      const statBlockRegex = new RegExp(escapeRegex(match))
      line = line.replace(statBlockRegex, () => {
        const statBlockId = `statblock-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`

        // Calculate modifiers from ability scores: (score - 10) / 2, rounded down
        const calculateModifier = (score: number) => Math.floor((score - 10) / 2)

        const stats = [
          { name: 'STR', icon: '💪', score: scores[0], modifier: calculateModifier(scores[0]) },
          { name: 'DEX', icon: '🤸', score: scores[1], modifier: calculateModifier(scores[1]) },
          { name: 'CON', icon: '🛡️', score: scores[2], modifier: calculateModifier(scores[2]) },
          { name: 'INT', icon: '🧠', score: scores[3], modifier: calculateModifier(scores[3]) },
          { name: 'WIS', icon: '👁️', score: scores[4], modifier: calculateModifier(scores[4]) },
          { name: 'CHA', icon: '✨', score: scores[5], modifier: calculateModifier(scores[5]) }
        ]

        let html = `<span class="stat-block-container" data-statblock-id="${statBlockId}" contenteditable="false">`

        stats.forEach(stat => {
          const modStr = stat.modifier >= 0 ? `+${stat.modifier}` : `${stat.modifier}`
          const diceNotation = stat.modifier >= 0 ? `d20+${stat.modifier}` : `d20${stat.modifier}`

          html += `<span class="stat-item" data-stat-score="${stat.score}">`
          html += `<span class="stat-icon" contenteditable="false">${stat.icon}</span>`
          html += `<span class="stat-name" contenteditable="false">${stat.name}</span>`
          html += `<span class="stat-score" contenteditable="true">${stat.score}</span>`
          html += `<span class="stat-modifier-small" contenteditable="false">${modStr}</span>`
          html += `<button class="stat-dice-roller" data-notation="${diceNotation}" data-stat-button="true" contenteditable="false">🎲 ${diceNotation}</button>`
          html += `</span>`
        })

        html += `</span>`
        return html
      })
    }

    // Process DC tables (e.g., dctable[10:Check description,15:Another check])
    const dcTablePattern = /\bdctable\[([^\]]+)\]/gi
    const dcTableMatches: Array<{ match: string; rows: Array<{ dc: number; text: string }>; index: number }> = []
    let dcTableMatch: RegExpExecArray | null

    while ((dcTableMatch = dcTablePattern.exec(originalLine)) !== null) {
      const rowsStr = dcTableMatch[1]
      const rows: Array<{ dc: number; text: string }> = []

      // Parse rows - we need to handle escaped commas (\\c)
      // Split by commas that aren't escaped
      const rowParts: string[] = []
      let currentPart = ''
      for (let i = 0; i < rowsStr.length; i++) {
        if (rowsStr[i] === ',' && (i === 0 || rowsStr[i-1] !== '\\')) {
          rowParts.push(currentPart)
          currentPart = ''
        } else {
          currentPart += rowsStr[i]
        }
      }
      if (currentPart) rowParts.push(currentPart)

      for (const part of rowParts) {
        const colonIndex = part.indexOf(':')
        if (colonIndex !== -1) {
          const dc = parseInt(part.substring(0, colonIndex).trim(), 10)
          let text = part.substring(colonIndex + 1).trim()
          // Unescape special characters
          text = text.replace(/\\n/g, '\n').replace(/\\c/g, ',')
          if (!isNaN(dc)) {
            rows.push({ dc, text })
          }
        }
      }

      if (rows.length > 0) {
        dcTableMatches.push({
          match: dcTableMatch[0],
          rows,
          index: dcTableMatch.index
        })
      }
    }

    // Add DC tables
    for (const { match, rows } of dcTableMatches) {
      const dcTableRegex = new RegExp(escapeRegex(match))
      line = line.replace(dcTableRegex, () => {
        const tableId = `dctable-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`

        let html = `<div class="dc-table-container" data-dctable-id="${tableId}" contenteditable="false">`

        // Add rows
        rows.forEach((row, index) => {
          const rowId = `${tableId}-row-${index}`
          html += `<div class="dc-table-row" data-row-id="${rowId}">`
          html += `<input type="number" class="dc-table-dc" value="${row.dc}" data-row-id="${rowId}" />`
          html += `<textarea class="dc-table-text" data-row-id="${rowId}" rows="1">${escapeHtml(row.text)}</textarea>`
          html += `</div>`
        })

        // Add control buttons
        html += `<div class="dc-table-controls">`
        html += `<button class="dc-table-btn dc-table-add" data-dctable-id="${tableId}" contenteditable="false">+ Add Row</button>`
        html += `<button class="dc-table-btn dc-table-remove" data-dctable-id="${tableId}" contenteditable="false">− Remove Row</button>`
        html += `</div>`

        html += `</div>`
        return html
      })
    }

    // First, collect existing death save data from the editor before we replace anything
    const deathSaveData = new Map<string, { successes: number; failures: number }>()
    if (editorRef.value) {
      const existingTrackers = editorRef.value.querySelectorAll('.hp-tracker')
      existingTrackers.forEach((tracker) => {
        const hpText = tracker.textContent || ''
        const successes = parseInt((tracker as HTMLElement).getAttribute('data-save-successes') || '0', 10)
        const failures = parseInt((tracker as HTMLElement).getAttribute('data-save-failures') || '0', 10)
        if (successes > 0 || failures > 0) {
          deathSaveData.set(hpText, { successes, failures })
        }
      })
    }

    // Add HP trackers with +/- buttons
    for (const { match, current, max } of hpMatches) {
      const hpRegex = new RegExp(`\\b${escapeRegex(match)}\\b`)
      line = line.replace(hpRegex, (matched) => {
        // Generate a unique ID for this HP tracker
        const hpId = `hp-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
        const currentHp = parseInt(current, 10)

        // Get preserved death save data if it exists
        const savedData = deathSaveData.get(matched) || { successes: 0, failures: 0 }

        // Build the HP tracker HTML
        let html = `<span class="hp-container" data-hp-id="${hpId}">`
        html += `<span class="hp-tracker" data-current="${current}" data-max="${max}" data-save-successes="${savedData.successes}" data-save-failures="${savedData.failures}">${escapeHtml(matched)}</span>`
        html += `<button class="hp-button hp-plus" data-hp-button="true" data-action="heal" data-hp-id="${hpId}" contenteditable="false">+</button>`
        html += `<button class="hp-button hp-minus" data-hp-button="true" data-action="damage" data-hp-id="${hpId}" contenteditable="false">−</button>`

        // Add death saving throws if HP is 0
        if (currentHp === 0) {
          html += `<span class="death-saves">`
          html += `<span class="death-saves-label">💀</span>`
          // Successes
          html += `<span class="death-saves-group">`
          for (let i = 0; i < 3; i++) {
            const marker = i < savedData.successes ? '✓' : '○'
            html += `<button class="death-save-marker save-success" data-hp-id="${hpId}" data-save-type="success" data-save-index="${i}" contenteditable="false">${marker}</button>`
          }
          html += `</span>`
          // Failures
          html += `<span class="death-saves-group">`
          for (let i = 0; i < 3; i++) {
            const marker = i < savedData.failures ? '✗' : '○'
            html += `<button class="death-save-marker save-failure" data-hp-id="${hpId}" data-save-type="failure" data-save-index="${i}" contenteditable="false">${marker}</button>`
          }
          html += `</span>`
          html += `</span>`
        }

        html += `</span>`
        return html
      })
    }

    // Wrap line with checkbox if needed
    if (hasCheckbox) {
      const checkboxId = `checkbox-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
      const checkedClass = isChecked ? 'checkbox-checked' : ''
      const checkmarkDisplay = isChecked ? 'block' : 'none'

      formattedHTML += `<span class="checkbox-container" data-checkbox-id="${checkboxId}">`
      formattedHTML += `<button class="checkbox-marker" data-checkbox-id="${checkboxId}" data-checked="${isChecked}" contenteditable="false">`
      formattedHTML += `<span class="checkbox-checkmark" style="display: ${checkmarkDisplay};">✓</span>`
      formattedHTML += `</button>`
      formattedHTML += `<span class="checkbox-text ${checkedClass}">${line}</span>`
      formattedHTML += `</span>`
    } else {
      // For lines that are just the cursor placeholder, keep them as the placeholder
      // but we'll need to ensure they create an empty line visually
      formattedHTML += line
    }

    // Add <br> after each line except possibly the last
    if (i < lines.length - 1) {
      formattedHTML += '<br>'
    }
  }

  // Handle trailing empty lines - ensure they're represented with a <br>
  // This allows cursor to be positioned on empty lines at the end
  const lastLine = lines.length > 0 ? lines[lines.length - 1] : ''
  // Treat cursor-only lines as empty
  if (lastLine === '' || lastLine === CURSOR_PLACEHOLDER) {
    formattedHTML += '<br>'
  }

  // STEP 3: Replace the cursor placeholder with a marker element in the formatted HTML
  // Use a marker that includes a zero-width space to ensure it occupies space
  const markerHTML = '<span id="cursor-position-marker">\u200B</span>'
  formattedHTML = formattedHTML.replace(CURSOR_PLACEHOLDER, markerHTML)

  // STEP 3.5: Ensure cursor has a place to be - if marker is at the end, add a zero-width space after it
  if (formattedHTML.endsWith(markerHTML)) {
    formattedHTML += '\u200B' // Zero-width space
  }

  // STEP 4: Replace editor content with formatted HTML
  editorRef.value.innerHTML = formattedHTML

  // STEP 4.5: Restore preserved images
  preservedImages.forEach((img, index) => {
    const placeholder = `___IMAGE_${index}___`
    if (!editorRef.value) return

    const walker = document.createTreeWalker(
      editorRef.value,
      NodeFilter.SHOW_TEXT
    )

    let textNode: Node | null = null
    while ((textNode = walker.nextNode())) {
      const text = textNode.textContent || ''
      if (text.includes(placeholder)) {
        // Split the text node and insert the image
        const parts = text.split(placeholder)
        const parent = textNode.parentNode

        if (parent) {
          // Create text nodes for the parts
          const before = document.createTextNode(parts[0])
          const after = document.createTextNode(parts.slice(1).join(placeholder))

          // Replace the text node with: before + image + after
          parent.replaceChild(after, textNode)
          parent.insertBefore(img, after)
          parent.insertBefore(before, img)
        }
        break
      }
    }
  })

  // STEP 5: Find the marker, restore cursor position, and remove marker
  try {
    const restoredMarker = editorRef.value.querySelector('#cursor-position-marker')

    if (restoredMarker) {
      const newRange = document.createRange()

      // Get the text content (zero-width space) from the marker
      const markerContent = restoredMarker.textContent || ''

      // Replace the marker span with its text content
      const textNode = document.createTextNode(markerContent)
      restoredMarker.parentNode?.replaceChild(textNode, restoredMarker)

      // Place cursor right after the text node
      newRange.setStartAfter(textNode)
      newRange.collapse(true)

      selection.removeAllRanges()
      selection.addRange(newRange)
    } else {
      // Fallback: place cursor at end if marker not found
      const newRange = document.createRange()
      newRange.selectNodeContents(editorRef.value)
      newRange.collapse(false)
      selection.removeAllRanges()
      selection.addRange(newRange)
    }
  } catch (e) {
    // If anything fails, just place cursor at the end
    console.error('Failed to restore cursor position:', e)
    const newRange = document.createRange()
    newRange.selectNodeContents(editorRef.value)
    newRange.collapse(false)
    selection.removeAllRanges()
    selection.addRange(newRange)
  }

  isProcessing = false
}

function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function rollDiceNotation(notation: string) {
  const result = rollDice(notation)
  if (!result) return

  // Create toast
  const toastId = ++toastIdCounter
  const timeoutId = window.setTimeout(() => {
    removeToast(toastId)
  }, 10000) // Auto-dismiss after 10 seconds

  toasts.value.push({
    id: toastId,
    result,
    timeoutId
  })
}

function removeToast(id: number) {
  const index = toasts.value.findIndex((t) => t.id === id)
  if (index !== -1) {
    clearTimeout(toasts.value[index].timeoutId)
    toasts.value.splice(index, 1)
  }
}

function applyHpChange() {
  if (!currentHpElement.value || !hpTooltipValue.value) return

  const amount = parseInt(hpTooltipValue.value, 10)
  if (isNaN(amount) || amount <= 0) return

  // Get the HP ID from the button
  const hpId = currentHpElement.value.getAttribute('data-hp-id')
  if (!hpId) return

  // Find the HP container using the ID
  const hpContainer = document.querySelector(`.hp-container[data-hp-id="${hpId}"]`) as HTMLElement
  if (!hpContainer) return

  // Find the HP tracker inside the container
  const hpTracker = hpContainer.querySelector('.hp-tracker') as HTMLElement
  if (!hpTracker) return

  // Parse the current HP values from the text content (e.g., "50/100hp")
  const hpText = hpTracker.textContent || ''
  const hpMatch = hpText.match(/^(\d+)\/(\d+)hp$/)
  if (!hpMatch) return

  const current = parseInt(hpMatch[1], 10)
  const max = parseInt(hpMatch[2], 10)

  // Handle damage/healing
  if (hpTooltipMode.value === 'damage') {
    if (current === 0) {
      // Character is already at 0 HP - add death save failures
      let failures = parseInt(hpTracker.getAttribute('data-save-failures') || '0', 10)

      // D&D 5e rule: damage at 0 HP = automatic failure
      // If damage >= max HP, it's massive damage = 2 failures
      const failuresToAdd = amount >= max ? 2 : 1
      failures = Math.min(3, failures + failuresToAdd)

      hpTracker.setAttribute('data-save-failures', failures.toString())

      // Update the visual death save markers
      updateDeathSaveMarkers(hpContainer, 'failure', failures)

      // Trigger re-render to update the markers
      setTimeout(() => {
        ensureEditorFocusAndRerender()
      }, 50)
    } else {
      // Normal damage
      const newCurrent = Math.max(0, current - amount)
      hpTracker.textContent = `${newCurrent}/${max}hp`
      hpTracker.setAttribute('data-current', newCurrent.toString())

      // If HP just dropped to 0, we need to refresh to show death saves
      if (newCurrent === 0) {
        // Trigger a re-render
        setTimeout(() => {
          ensureEditorFocusAndRerender()
        }, 100)
      }
    }
  } else {
    // Healing
    const newCurrent = Math.min(max, current + amount)
    hpTracker.textContent = `${newCurrent}/${max}hp`
    hpTracker.setAttribute('data-current', newCurrent.toString())

    // If healing from 0 HP, clear death saves and trigger re-render
    if (current === 0 && newCurrent > 0) {
      hpTracker.setAttribute('data-save-successes', '0')
      hpTracker.setAttribute('data-save-failures', '0')

      // Trigger a re-render to remove death saves UI
      setTimeout(() => {
        ensureEditorFocusAndRerender()
      }, 100)
    }
  }

  closeHpTooltip()
  scheduleAutoSave()
}

function updateDeathSaveMarkers(hpContainer: HTMLElement, saveType: 'success' | 'failure', count: number) {
  const className = saveType === 'success' ? '.save-success' : '.save-failure'
  const markers = hpContainer.querySelectorAll(className) as NodeListOf<HTMLElement>

  markers.forEach((marker, index) => {
    if (index < count) {
      marker.textContent = saveType === 'success' ? '✓' : '✗'
    } else {
      marker.textContent = '○'
    }
  })
}

function closeHpTooltip() {
  showHpTooltip.value = false
  hpTooltipValue.value = ''
  currentHpElement.value = null
}

function onHpTooltipKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter') {
    event.preventDefault()
    applyHpChange()
  } else if (event.key === 'Escape') {
    event.preventDefault()
    closeHpTooltip()
  }
}

function handleDcTableAdd(button: HTMLElement) {
  const tableId = button.getAttribute('data-dctable-id')
  if (!tableId) return

  // Find the table container
  const tableContainer = document.querySelector(`.dc-table-container[data-dctable-id="${tableId}"]`)
  if (!tableContainer) return

  // Create a new row
  const rowCount = tableContainer.querySelectorAll('.dc-table-row').length
  const newRowId = `${tableId}-row-${rowCount}`

  const newRow = document.createElement('div')
  newRow.className = 'dc-table-row'
  newRow.setAttribute('data-row-id', newRowId)

  const dcInput = document.createElement('input')
  dcInput.type = 'number'
  dcInput.className = 'dc-table-dc'
  dcInput.value = '10'
  dcInput.setAttribute('data-row-id', newRowId)

  const textInput = document.createElement('textarea')
  textInput.className = 'dc-table-text'
  textInput.value = 'New check'
  textInput.rows = 1
  textInput.setAttribute('data-row-id', newRowId)

  newRow.appendChild(dcInput)
  newRow.appendChild(textInput)

  // Insert before the controls div
  const controls = tableContainer.querySelector('.dc-table-controls')
  if (controls) {
    tableContainer.insertBefore(newRow, controls)
  }

  // Trigger auto-save
  scheduleAutoSave()
}

function handleDcTableRemove(button: HTMLElement) {
  const tableId = button.getAttribute('data-dctable-id')
  if (!tableId) return

  // Find the table container
  const tableContainer = document.querySelector(`.dc-table-container[data-dctable-id="${tableId}"]`)
  if (!tableContainer) return

  // Get all rows
  const rows = tableContainer.querySelectorAll('.dc-table-row')

  // Don't remove if only one row left
  if (rows.length <= 1) return

  // Remove the last row
  const lastRow = rows[rows.length - 1]
  lastRow.remove()

  // Trigger auto-save
  scheduleAutoSave()
}

function insertSelectedImage() {
  if (filteredImages.value.length === 0) return
  const selectedImage = filteredImages.value[selectedImageIndex.value]
  if (selectedImage) {
    insertImage(selectedImage)
  }
}

function insertImage(img: MediaFile) {
  if (!editorRef.value) return

  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0) return

  // If we have an image search start position, delete from "/img[" to cursor
  if (imageSearchStartPos.value) {
    const currentRange = selection.getRangeAt(0)

    // Walk backwards to find "/img["
    const walker = document.createTreeWalker(
      editorRef.value,
      NodeFilter.SHOW_TEXT
    )

    let textNode: Node | null = null
    let foundNode: Node | null = null
    let foundOffset = 0

    // Find all text nodes and locate the one with "/img["
    while ((textNode = walker.nextNode())) {
      const text = textNode.textContent || ''
      const imgIndex = text.lastIndexOf('/img[')

      if (imgIndex !== -1) {
        // Check if this is before or at our search start position
        foundNode = textNode
        foundOffset = imgIndex
      }
    }

    if (foundNode) {
      try {
        // Delete from "/img[" to current cursor
        const deleteRange = document.createRange()
        deleteRange.setStart(foundNode, foundOffset)
        deleteRange.setEnd(currentRange.endContainer, currentRange.endOffset)
        deleteRange.deleteContents()

        // Create and insert image at the deletion point
        const imgElement = document.createElement('img')
        imgElement.src = `media://${img.path}`
        imgElement.alt = getGMDisplayName(img)
        imgElement.setAttribute('class', 'inline-note-image')
        imgElement.setAttribute('contenteditable', 'false')
        imgElement.style.maxWidth = '200px'
        imgElement.style.maxHeight = '200px'
        imgElement.style.borderRadius = '8px'
        imgElement.style.margin = '4px'
        imgElement.style.verticalAlign = 'middle'

        deleteRange.insertNode(imgElement)

        // Add a space after the image
        const spaceNode = document.createTextNode(' ')
        deleteRange.setStartAfter(imgElement)
        deleteRange.insertNode(spaceNode)

        // Move cursor after the space
        deleteRange.setStartAfter(spaceNode)
        deleteRange.collapse(true)
        selection.removeAllRanges()
        selection.addRange(deleteRange)
      } catch (e) {
        console.error('Failed to insert image:', e)
      }
    }
  }

  // Close the image menu
  showImageMenu.value = false
  imageSearchQuery.value = ''
  imageSearchStartPos.value = null

  // Trigger auto-save
  scheduleAutoSave()
}
</script>

<style scoped>
/* Placeholder styling */
[contenteditable][data-placeholder]:empty:before {
  content: attr(data-placeholder);
  color: #6b7280;
  pointer-events: none;
  position: absolute;
}

/* Dice notation styling */
:deep(.dice-notation) {
  color: #c084fc;
  font-weight: 600;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
}

/* Dice roller button */
:deep(.dice-roller) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-left: 4px;
  margin-right: 4px;
  padding: 2px 6px;
  background: linear-gradient(135deg, #9333ea 0%, #7c3aed 100%);
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 4px rgba(147, 51, 234, 0.3);
  vertical-align: middle;
}

:deep(.dice-roller):hover {
  transform: scale(1.15) rotate(5deg);
  box-shadow: 0 4px 8px rgba(147, 51, 234, 0.5);
}

:deep(.dice-roller):active {
  transform: scale(1.05);
}

/* Markdown syntax characters (gray) */
:deep(.md-syntax) {
  color: #6b7280;
  font-weight: normal;
}

/* Markdown content styling */
:deep(.md-bold) {
  font-weight: bold;
}

:deep(.md-italic) {
  font-style: italic;
}

/* Markdown headings */
:deep(.md-h1) {
  font-size: 2em;
  font-weight: bold;
  line-height: 1.2;
}

:deep(.md-h2) {
  font-size: 1.5em;
  font-weight: bold;
  line-height: 1.3;
}

:deep(.md-h3) {
  font-size: 1.25em;
  font-weight: bold;
  line-height: 1.4;
}

/* HP container styling */
:deep(.hp-container) {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

/* HP tracker styling */
:deep(.hp-tracker) {
  color: #10b981;
  font-weight: 700;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  padding: 2px 4px;
  background: rgba(16, 185, 129, 0.1);
  border-radius: 4px;
}

/* HP button styling */
:deep(.hp-button) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  background: #4b5563;
  border: 1px solid #6b7280;
  border-radius: 4px;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
  color: #e5e7eb;
}

:deep(.hp-button.hp-plus) {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border-color: #10b981;
}

:deep(.hp-button.hp-minus) {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  border-color: #ef4444;
}

:deep(.hp-button):hover {
  transform: scale(1.15);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

:deep(.hp-button):active {
  transform: scale(1.0);
}

/* Death save styling */
:deep(.death-saves) {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-left: 8px;
  padding: 4px 8px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 6px;
  border: 1px solid #4b5563;
}

:deep(.death-saves-label) {
  font-size: 16px;
  margin-right: 2px;
}

:deep(.death-saves-group) {
  display: inline-flex;
  gap: 4px;
  padding: 0 4px;
}

:deep(.death-saves-group:first-of-type) {
  border-right: 1px solid #4b5563;
  padding-right: 8px;
}

:deep(.death-save-marker) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  background: transparent;
  border: none;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  padding: 0;
  color: #9ca3af;
}

:deep(.death-save-marker.save-success) {
  color: #10b981;
}

:deep(.death-save-marker.save-failure) {
  color: #ef4444;
}

:deep(.death-save-marker):hover {
  transform: scale(1.2);
}

:deep(.death-save-marker):active {
  transform: scale(1.0);
}

/* Stat block styling */
:deep(.stat-block-container) {
  display: inline-grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  padding: 12px;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%);
  border: 2px solid #8b5cf6;
  border-radius: 12px;
  margin: 8px 0;
  box-shadow: 0 4px 6px rgba(139, 92, 246, 0.2);
}

:deep(.stat-item) {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  border: 1px solid #6b7280;
  transition: all 0.2s;
}

:deep(.stat-item):hover {
  background: rgba(139, 92, 246, 0.2);
  border-color: #8b5cf6;
  transform: translateY(-2px);
}

:deep(.stat-icon) {
  font-size: 24px;
  line-height: 1;
}

:deep(.stat-name) {
  font-size: 11px;
  font-weight: 700;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

:deep(.stat-score) {
  font-size: 28px;
  font-weight: 900;
  color: #8b5cf6;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  line-height: 1;
  cursor: text;
  padding: 2px 4px;
  border-radius: 4px;
  transition: all 0.2s;
}

:deep(.stat-score):hover {
  background: rgba(139, 92, 246, 0.2);
  outline: 1px solid #8b5cf6;
}

:deep(.stat-score):focus {
  background: rgba(139, 92, 246, 0.3);
  outline: 2px solid #8b5cf6;
}

:deep(.stat-modifier-small) {
  font-size: 12px;
  font-weight: 600;
  color: #a78bfa;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
}

:deep(.stat-dice-roller) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 4px 8px;
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  border: none;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  color: white;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 4px rgba(139, 92, 246, 0.3);
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
}

:deep(.stat-dice-roller):hover {
  transform: scale(1.1) rotate(5deg);
  box-shadow: 0 4px 8px rgba(139, 92, 246, 0.5);
}

:deep(.stat-dice-roller):active {
  transform: scale(1.0);
}

/* Checkbox styling */
:deep(.checkbox-container) {
  display: inline-flex;
  align-items: flex-start;
  gap: 8px;
  margin-right: 4px;
}

:deep(.checkbox-marker) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  min-width: 20px;
  min-height: 20px;
  background: transparent;
  border: 2px solid #8b5cf6;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  padding: 0;
  flex-shrink: 0;
  margin-top: 2px;
  position: relative;
}

:deep(.checkbox-marker):hover {
  background: rgba(139, 92, 246, 0.1);
  transform: scale(1.1);
  box-shadow: 0 2px 4px rgba(139, 92, 246, 0.3);
}

:deep(.checkbox-marker):active {
  transform: scale(0.95);
}

:deep(.checkbox-checkmark) {
  font-size: 14px;
  font-weight: bold;
  color: #8b5cf6;
  line-height: 1;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

:deep(.checkbox-text) {
  flex: 1;
  transition: all 0.2s;
}

:deep(.checkbox-text.checkbox-checked) {
  text-decoration: line-through;
  opacity: 0.6;
}

/* Toast animations */
.toast-enter-active {
  animation: toast-slide-in 0.3s ease-out;
}

.toast-leave-active {
  animation: toast-slide-out 0.3s ease-in;
}

.toast-move {
  transition: transform 0.3s ease;
}

@keyframes toast-slide-in {
  from {
    transform: translateX(-100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes toast-slide-out {
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(-100%);
    opacity: 0;
  }
}

/* Inline note images */
:deep(.inline-note-image) {
  max-width: 200px;
  max-height: 200px;
  border-radius: 8px;
  margin: 4px;
  vertical-align: middle;
  border: 2px solid #6b7280;
  transition: all 0.2s;
  cursor: pointer;
}

:deep(.inline-note-image):hover {
  border-color: #8b5cf6;
  transform: scale(1.05);
  box-shadow: 0 4px 8px rgba(139, 92, 246, 0.3);
}

/* DC Table styling */
:deep(.dc-table-container) {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 12px 0;
  padding: 12px;
  background: rgba(139, 92, 246, 0.1);
  border: 2px solid #8b5cf6;
  border-radius: 8px;
}

:deep(.dc-table-row) {
  display: flex;
  gap: 8px;
  align-items: center;
}

:deep(.dc-table-dc) {
  width: 60px;
  padding: 6px 8px;
  background: #1f2937;
  border: 1px solid #6b7280;
  border-radius: 4px;
  color: #f3f4f6;
  font-weight: 600;
  text-align: center;
  font-size: 14px;
  transition: all 0.2s;
}

:deep(.dc-table-dc):focus {
  outline: none;
  border-color: #8b5cf6;
  background: #374151;
}

:deep(.dc-table-text) {
  flex: 1;
  padding: 6px 12px;
  background: #1f2937;
  border: 1px solid #6b7280;
  border-radius: 4px;
  color: #f3f4f6;
  font-size: 14px;
  font-family: inherit;
  transition: all 0.2s;
  resize: vertical;
  min-height: 32px;
  line-height: 1.4;
}

:deep(.dc-table-text):focus {
  outline: none;
  border-color: #8b5cf6;
  background: #374151;
}

:deep(.dc-table-controls) {
  display: flex;
  gap: 6px;
  margin-top: 6px;
  justify-content: flex-end;
}

:deep(.dc-table-btn) {
  padding: 4px 10px;
  background: transparent;
  border: 1px solid rgba(107, 114, 128, 0.4);
  border-radius: 4px;
  color: #9ca3af;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
  opacity: 0.6;
}

:deep(.dc-table-btn):hover {
  opacity: 1;
  border-color: rgba(139, 92, 246, 0.5);
  color: #c4b5fd;
  background: rgba(139, 92, 246, 0.1);
}

:deep(.dc-table-btn):active {
  transform: scale(0.95);
}

:deep(.dc-table-add):hover {
  border-color: rgba(16, 185, 129, 0.5);
  color: #6ee7b7;
  background: rgba(16, 185, 129, 0.1);
}

:deep(.dc-table-remove):hover {
  border-color: rgba(239, 68, 68, 0.5);
  color: #fca5a5;
  background: rgba(239, 68, 68, 0.1);
}
</style>
