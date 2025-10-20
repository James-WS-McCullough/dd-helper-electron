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
              data-placeholder="Write your notes here... Use markdown (*italic*, **bold**, # heading) or dice notation (d20, 3d6), then press Enter to format!"
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

const slashCommands: SlashCommand[] = [
  { command: '/hp', label: '/hp', description: 'Insert HP tracker' },
  { command: '/dc', label: '/dc', description: 'Insert DC calculator' },
  { command: '/statblock', label: '/statblock', description: 'Insert stat block' }
]

const filteredCommands = computed(() => {
  if (!slashQuery.value) return slashCommands
  const query = slashQuery.value.toLowerCase()
  return slashCommands.filter(cmd =>
    cmd.command.toLowerCase().includes(query)
  )
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
  scheduleAutoSave()
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
  } else if (target.classList.contains('hp-button')) {
    event.preventDefault()
    handleHpButtonClick(target)
  } else if (target.classList.contains('death-save-marker')) {
    event.preventDefault()
    handleDeathSaveClick(target)
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

  if (event.key === 'Escape' && showSlashMenu.value) {
    showSlashMenu.value = false
    slashQuery.value = ''
    event.preventDefault()
    return
  }

  if (event.key === 'Enter') {
    // Close slash menu if open
    if (showSlashMenu.value) {
      showSlashMenu.value = false
      slashQuery.value = ''
    }

    // First, insert the line breaks
    document.execCommand('insertHTML', false, '<br><br>')
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

  // Get text content from editor
  const text = editorRef.value?.textContent || ''

  // Find the last occurrence of "/"
  const lastSlashIndex = text.lastIndexOf('/')
  if (lastSlashIndex === -1) {
    showSlashMenu.value = false
    return
  }

  // Get the query after the last "/"
  const query = text.substring(lastSlashIndex + 1)

  // If there's a space in the query, close the menu
  if (query.includes(' ')) {
    showSlashMenu.value = false
    slashQuery.value = ''
    return
  }

  slashQuery.value = query
}

// Complete slash command by replacing "/query" with the full command
function completeSlashCommand(command: string) {
  if (!editorRef.value) return

  const text = editorRef.value.textContent || ''
  const lastSlashIndex = text.lastIndexOf('/')

  if (lastSlashIndex === -1) return

  // Get the selection
  const selection = window.getSelection()
  if (!selection) return

  // Create a range from the "/" to the current cursor position
  const range = document.createRange()

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
    // Set range from "/" to current cursor position
    try {
      range.setStart(slashNode, slashOffset)
      const currentRange = selection.getRangeAt(0)
      range.setEnd(currentRange.endContainer, currentRange.endOffset)

      // Delete the "/query" text
      range.deleteContents()

      // Insert the completed command
      const textNode = document.createTextNode(command + ' ')
      range.insertNode(textNode)

      // Move cursor after the inserted text
      range.setStartAfter(textNode)
      range.collapse(true)
      selection.removeAllRanges()
      selection.addRange(range)
    } catch (_e) {
      console.error('Failed to complete command')
    }
  }

  showSlashMenu.value = false
  slashQuery.value = ''
}

// Insert slash command with actual content
function insertSlashCommand(command: string) {
  if (!editorRef.value) return

  const text = editorRef.value.textContent || ''
  const lastSlashIndex = text.lastIndexOf('/')

  if (lastSlashIndex === -1) return

  const selection = window.getSelection()
  if (!selection) return

  const range = document.createRange()

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
      range.setStart(slashNode, slashOffset)
      const currentRange = selection.getRangeAt(0)
      range.setEnd(currentRange.endContainer, currentRange.endOffset)

      // Delete the "/query" text
      range.deleteContents()

      // Insert content based on command
      let insertText = ''
      if (command === '/hp') {
        insertText = '50/50hp '
      } else if (command === '/dc') {
        insertText = '/dc '
      } else if (command === '/statblock') {
        insertText = '/statblock '
      }

      const textNode = document.createTextNode(insertText)
      range.insertNode(textNode)

      // Move cursor after the inserted text
      range.setStartAfter(textNode)
      range.collapse(true)
      selection.removeAllRanges()
      selection.addRange(range)
    } catch (_e) {
      console.error('Failed to insert command')
    }
  }

  showSlashMenu.value = false
  slashQuery.value = ''
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

  // Insert a temporary marker at the cursor position to preserve it
  const currentRange = selection.getRangeAt(0)
  const marker = document.createElement('span')
  marker.id = 'cursor-marker-temp'
  marker.setAttribute('data-cursor-marker', 'true')
  currentRange.insertNode(marker)

  // STEP 1: Get the entire plain text content, preserving line breaks
  // We need to replace <br> tags with newlines before getting text
  const tempDiv = document.createElement('div')
  tempDiv.innerHTML = editorRef.value.innerHTML

  // Remove the cursor marker from the temp div
  const tempMarker = tempDiv.querySelector('#cursor-marker-temp')
  if (tempMarker) {
    tempMarker.remove()
  }

  // Remove all existing dice buttons, HP buttons, death saves, and styled spans to get clean text
  tempDiv.querySelectorAll('[data-dice-button]').forEach(button => button.remove())
  tempDiv.querySelectorAll('[data-hp-button]').forEach(button => button.remove())
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
    const originalLine = lines[i] // Get the original plain text line
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
        const hpId = `hp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
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

    formattedHTML += line
    if (i < lines.length - 1) {
      formattedHTML += '<br>'
    }
  }

  // STEP 3: Replace editor content with formatted HTML
  editorRef.value.innerHTML = formattedHTML

  // STEP 4: Restore cursor position
  // Find where the marker should be in the new content
  const range = document.createRange()
  range.selectNodeContents(editorRef.value)
  range.collapse(false) // Move to end
  selection.removeAllRanges()
  selection.addRange(range)

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
</style>
