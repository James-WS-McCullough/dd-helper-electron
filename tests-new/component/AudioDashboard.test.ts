import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import AudioDashboard from '../../src/renderer/src/views/AudioDashboard.vue'
import { useDirectoryStore, useDisplayStore } from '../../src/renderer/src/stores'
import type { MediaFile } from '../../src/renderer/src/types'

// Mock AppLayout component
vi.mock('../../src/renderer/src/components/AppLayout.vue', () => ({
  default: {
    name: 'AppLayout',
    template: '<div><slot /></div>'
  }
}))

describe('AudioDashboard', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('Folder Navigation', () => {
    it('should display root folder audio files by default', () => {
      const directoryStore = useDirectoryStore()
      directoryStore.mediaTree = createMockAudioTree()

      const wrapper = mount(AudioDashboard)

      // Should show root level audio files
      const audioItems = wrapper.findAll('[data-testid="audio-item"]')
      expect(audioItems.length).toBe(2) // root_sound1.mp3 and root_sound2.mp3
    })

    it('should display subfolders as navigation chips', () => {
      const directoryStore = useDirectoryStore()
      directoryStore.mediaTree = createMockAudioTree()

      const wrapper = mount(AudioDashboard)

      // Should show subfolder chips
      const folderChips = wrapper.findAll('button').filter(btn =>
        btn.text().includes('📁')
      )
      expect(folderChips.length).toBe(2) // music and sfx folders
      expect(folderChips[0].text()).toContain('music')
      expect(folderChips[1].text()).toContain('sfx')
    })

    it('should not show back button when in root', () => {
      const directoryStore = useDirectoryStore()
      directoryStore.mediaTree = createMockAudioTree()

      const wrapper = mount(AudioDashboard)

      const backButton = wrapper.findAll('button').find(btn =>
        btn.text().includes('Back')
      )
      expect(backButton).toBeUndefined()
    })

    it('should navigate into subfolder when clicking folder chip', async () => {
      const directoryStore = useDirectoryStore()
      directoryStore.mediaTree = createMockAudioTree()

      const wrapper = mount(AudioDashboard)

      // Click on music folder
      const musicButton = wrapper.findAll('button').find(btn =>
        btn.text().includes('music')
      )
      await musicButton?.trigger('click')

      // Should now show music folder's audio files
      const audioItems = wrapper.findAll('[data-testid="audio-item"]')
      expect(audioItems.length).toBe(2) // battle.mp3 and tavern.mp3
    })

    it('should show back button when not in root', async () => {
      const directoryStore = useDirectoryStore()
      directoryStore.mediaTree = createMockAudioTree()

      const wrapper = mount(AudioDashboard)

      // Navigate into music folder
      const musicButton = wrapper.findAll('button').find(btn =>
        btn.text().includes('music')
      )
      await musicButton?.trigger('click')

      // Should show back button
      const backButton = wrapper.findAll('button').find(btn =>
        btn.text().includes('Back')
      )
      expect(backButton).toBeDefined()
    })

    it('should navigate back to parent folder when clicking back button', async () => {
      const directoryStore = useDirectoryStore()
      directoryStore.mediaTree = createMockAudioTree()

      const wrapper = mount(AudioDashboard)

      // Navigate into music folder
      const musicButton = wrapper.findAll('button').find(btn =>
        btn.text().includes('music')
      )
      await musicButton?.trigger('click')

      // Click back button
      const backButton = wrapper.findAll('button').find(btn =>
        btn.text().includes('Back')
      )
      await backButton?.trigger('click')

      // Should be back in root with 2 audio files
      const audioItems = wrapper.findAll('[data-testid="audio-item"]')
      expect(audioItems.length).toBe(2)
    })

    it('should display correct audio count for current folder', async () => {
      const directoryStore = useDirectoryStore()
      directoryStore.mediaTree = createMockAudioTree()

      const wrapper = mount(AudioDashboard)

      // Should show 2 files in root
      expect(wrapper.text()).toContain('2 audio files in current folder')

      // Navigate to music folder
      const musicButton = wrapper.findAll('button').find(btn =>
        btn.text().includes('music')
      )
      await musicButton?.trigger('click')

      // Should show 2 files in music folder
      expect(wrapper.text()).toContain('2 audio files in current folder')
    })

    it('should show empty state when folder has no audio files', async () => {
      const directoryStore = useDirectoryStore()
      directoryStore.mediaTree = createMockAudioTreeWithEmptyFolder()

      const wrapper = mount(AudioDashboard)

      // Navigate to empty folder
      const emptyButton = wrapper.findAll('button').find(btn =>
        btn.text().includes('empty')
      )
      await emptyButton?.trigger('click')

      // Should show empty state
      expect(wrapper.text()).toContain('No audio files in this folder')
    })

    it('should only show audio files in current folder, not recursively', () => {
      const directoryStore = useDirectoryStore()
      directoryStore.mediaTree = createMockAudioTree()

      const wrapper = mount(AudioDashboard)

      // Root should only show 2 files, not all files from subfolders
      const audioItems = wrapper.findAll('[data-testid="audio-item"]')
      expect(audioItems.length).toBe(2)
      expect(audioItems.length).not.toBe(6) // Would be 6 if recursive
    })

    it('should display nested subfolders when navigating deep', async () => {
      const directoryStore = useDirectoryStore()
      directoryStore.mediaTree = createMockDeepAudioTree()

      const wrapper = mount(AudioDashboard)

      // Navigate to parent folder
      const parentButton = wrapper.findAll('button').find(btn =>
        btn.text().includes('parent')
      )
      await parentButton?.trigger('click')

      // Should show nested child folder
      const childButton = wrapper.findAll('button').find(btn =>
        btn.text().includes('child')
      )
      expect(childButton).toBeDefined()

      // Navigate to child folder
      await childButton?.trigger('click')

      // Should show audio in child folder
      const audioItems = wrapper.findAll('[data-testid="audio-item"]')
      expect(audioItems.length).toBe(1) // nested.mp3
    })
  })

  describe('Audio Playback', () => {
    it('should call displayMedia when clicking audio file', async () => {
      const directoryStore = useDirectoryStore()
      const displayStore = useDisplayStore()
      directoryStore.mediaTree = createMockAudioTree()

      const displayMediaSpy = vi.spyOn(displayStore, 'displayMedia')

      const wrapper = mount(AudioDashboard)

      // Click first audio item
      const audioItem = wrapper.find('[data-testid="audio-item"]')
      await audioItem.trigger('click')

      expect(displayMediaSpy).toHaveBeenCalledWith(
        expect.stringContaining('.mp3'),
        'audio',
        expect.any(String),
        expect.any(String)
      )
    })
  })

  describe('UI Display', () => {
    it('should display audio library title', () => {
      const directoryStore = useDirectoryStore()
      directoryStore.mediaTree = createMockAudioTree()

      const wrapper = mount(AudioDashboard)

      expect(wrapper.text()).toContain('Audio Library')
    })

    it('should show file count in header', () => {
      const directoryStore = useDirectoryStore()
      directoryStore.mediaTree = createMockAudioTree()

      const wrapper = mount(AudioDashboard)

      expect(wrapper.text()).toContain('2 audio files in current folder')
    })

    it('should not show active audio display in header (uses global status bar)', () => {
      const directoryStore = useDirectoryStore()
      const displayStore = useDisplayStore()
      directoryStore.mediaTree = createMockAudioTree()

      // Mock active background music
      displayStore.displayState.backgroundMusic = {
        id: '1',
        path: '/music/test.mp3',
        type: 'audio',
        subtype: 'music',
        displayName: 'Test Music'
      }

      const wrapper = mount(AudioDashboard)

      // Active audio should NOT be shown in the AudioDashboard header
      // It should be shown in the global DisplayStatusBar instead
      expect(wrapper.text()).not.toContain('Background Music')
      expect(wrapper.text()).not.toContain('Clear All Audio')
    })
  })

  describe('Audio Categorization', () => {
    it('should display correct badge for music files', () => {
      const directoryStore = useDirectoryStore()
      directoryStore.mediaTree = createMockAudioTree()

      const wrapper = mount(AudioDashboard)

      // Navigate to music folder
      const musicButton = wrapper.findAll('button').find(btn =>
        btn.text().includes('music')
      )
      musicButton?.trigger('click')

      expect(wrapper.text()).toContain('music')
    })

    it('should display correct badge for loop files', async () => {
      const directoryStore = useDirectoryStore()
      directoryStore.mediaTree = createMockAudioTree()

      const wrapper = mount(AudioDashboard)

      // Navigate to sfx folder
      const sfxButton = wrapper.findAll('button').find(btn =>
        btn.text().includes('sfx')
      )
      await sfxButton?.trigger('click')

      expect(wrapper.text()).toContain('loop')
    })
  })
})

// Helper function to create mock audio tree
function createMockAudioTree(): MediaFile {
  return {
    name: 'audio',
    path: '/audio',
    type: 'folder',
    mediaType: 'audio',
    mediaSubtype: 'default',
    displayName: 'audio',
    children: [
      {
        name: 'root_sound1.mp3',
        path: '/audio/root_sound1.mp3',
        type: 'file',
        mediaType: 'audio',
        mediaSubtype: 'sound',
        displayName: 'root_sound1'
      },
      {
        name: 'root_sound2.mp3',
        path: '/audio/root_sound2.mp3',
        type: 'file',
        mediaType: 'audio',
        mediaSubtype: 'sound',
        displayName: 'root_sound2'
      },
      {
        name: 'music',
        path: '/audio/music',
        type: 'folder',
        mediaType: 'audio',
        mediaSubtype: 'default',
        displayName: 'music',
        children: [
          {
            name: 'battle_music.mp3',
            path: '/audio/music/battle_music.mp3',
            type: 'file',
            mediaType: 'audio',
            mediaSubtype: 'music',
            displayName: 'battle'
          },
          {
            name: 'tavern_music.mp3',
            path: '/audio/music/tavern_music.mp3',
            type: 'file',
            mediaType: 'audio',
            mediaSubtype: 'music',
            displayName: 'tavern'
          }
        ]
      },
      {
        name: 'sfx',
        path: '/audio/sfx',
        type: 'folder',
        mediaType: 'audio',
        mediaSubtype: 'default',
        displayName: 'sfx',
        children: [
          {
            name: 'wind_loop.mp3',
            path: '/audio/sfx/wind_loop.mp3',
            type: 'file',
            mediaType: 'audio',
            mediaSubtype: 'loop',
            displayName: 'wind'
          },
          {
            name: 'rain_loop.mp3',
            path: '/audio/sfx/rain_loop.mp3',
            type: 'file',
            mediaType: 'audio',
            mediaSubtype: 'loop',
            displayName: 'rain'
          }
        ]
      }
    ]
  }
}

function createMockAudioTreeWithEmptyFolder(): MediaFile {
  return {
    name: 'audio',
    path: '/audio',
    type: 'folder',
    mediaType: 'audio',
    mediaSubtype: 'default',
    displayName: 'audio',
    children: [
      {
        name: 'empty',
        path: '/audio/empty',
        type: 'folder',
        mediaType: 'audio',
        mediaSubtype: 'default',
        displayName: 'empty',
        children: []
      }
    ]
  }
}

function createMockDeepAudioTree(): MediaFile {
  return {
    name: 'audio',
    path: '/audio',
    type: 'folder',
    mediaType: 'audio',
    mediaSubtype: 'default',
    displayName: 'audio',
    children: [
      {
        name: 'parent',
        path: '/audio/parent',
        type: 'folder',
        mediaType: 'audio',
        mediaSubtype: 'default',
        displayName: 'parent',
        children: [
          {
            name: 'child',
            path: '/audio/parent/child',
            type: 'folder',
            mediaType: 'audio',
            mediaSubtype: 'default',
            displayName: 'child',
            children: [
              {
                name: 'nested.mp3',
                path: '/audio/parent/child/nested.mp3',
                type: 'file',
                mediaType: 'audio',
                mediaSubtype: 'sound',
                displayName: 'nested'
              }
            ]
          }
        ]
      }
    ]
  }
}
