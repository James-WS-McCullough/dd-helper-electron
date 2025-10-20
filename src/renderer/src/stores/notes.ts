import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useDirectoryStore } from './directory'

export interface Note {
  id: string
  title: string
  content: string
  createdAt: number
  updatedAt: number
}

export const useNotesStore = defineStore('notes', () => {
  const notes = ref<Note[]>([])
  const currentNoteId = ref<string | null>(null)
  const isLoading = ref(false)

  // Get directory from directory store
  function getDirectoryPath(): string | null {
    const directoryStore = useDirectoryStore()
    return directoryStore.currentDirectory
  }

  // Load all notes from disk
  async function loadNotes() {
    const directoryPath = getDirectoryPath()
    if (!directoryPath) {
      console.warn('No directory selected')
      return
    }

    isLoading.value = true
    try {
      const loadedNotes = await window.electronAPI.loadNotes(directoryPath)
      notes.value = loadedNotes
      // If no note is selected and we have notes, select the first one
      if (!currentNoteId.value && loadedNotes.length > 0) {
        currentNoteId.value = loadedNotes[0].id
      }
    } catch (error) {
      console.error('Failed to load notes:', error)
    } finally {
      isLoading.value = false
    }
  }

  // Create a new note
  async function createNote() {
    const directoryPath = getDirectoryPath()
    if (!directoryPath) {
      console.warn('No directory selected')
      return null
    }

    const newNote: Note = {
      id: `note-${Date.now()}`,
      title: 'Untitled Note',
      content: '',
      createdAt: Date.now(),
      updatedAt: Date.now()
    }

    try {
      await window.electronAPI.saveNote(directoryPath, newNote)
      notes.value.push(newNote)
      currentNoteId.value = newNote.id
      return newNote
    } catch (error) {
      console.error('Failed to create note:', error)
      return null
    }
  }

  // Save a note to disk
  async function saveNote(note: Note) {
    const directoryPath = getDirectoryPath()
    if (!directoryPath) {
      console.warn('No directory selected')
      return
    }

    // Create a plain object with updated timestamp (don't mutate the passed object)
    const noteToSave = {
      id: note.id,
      title: note.title,
      content: note.content,
      createdAt: note.createdAt,
      updatedAt: Date.now()
    }

    try {
      await window.electronAPI.saveNote(directoryPath, noteToSave)
      // Update in store
      const index = notes.value.findIndex((n) => n.id === note.id)
      if (index !== -1) {
        notes.value[index] = { ...noteToSave }
      }
      return noteToSave.updatedAt
    } catch (error) {
      console.error('Failed to save note:', error)
      return null
    }
  }

  // Delete a note
  async function deleteNote(noteId: string) {
    const directoryPath = getDirectoryPath()
    if (!directoryPath) {
      console.warn('No directory selected')
      return
    }

    try {
      await window.electronAPI.deleteNote(directoryPath, noteId)
      notes.value = notes.value.filter((n) => n.id !== noteId)
      // If we deleted the current note, select another
      if (currentNoteId.value === noteId) {
        currentNoteId.value = notes.value.length > 0 ? notes.value[0].id : null
      }
    } catch (error) {
      console.error('Failed to delete note:', error)
    }
  }

  // Get current note
  function getCurrentNote(): Note | null {
    if (!currentNoteId.value) return null
    return notes.value.find((n) => n.id === currentNoteId.value) || null
  }

  // Select a note
  function selectNote(noteId: string) {
    currentNoteId.value = noteId
  }

  return {
    notes,
    currentNoteId,
    isLoading,
    loadNotes,
    createNote,
    saveNote,
    deleteNote,
    getCurrentNote,
    selectNote
  }
})
