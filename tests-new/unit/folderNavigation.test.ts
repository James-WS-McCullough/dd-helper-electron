/**
 * Tests for Folder Navigation Logic
 *
 * Tests the grid-based folder navigation in ImagesDashboard
 */

import type { MediaFile } from '../../src/renderer/src/types'

describe('Folder Navigation Logic', () => {
  // Helper function to create a mock media tree
  function createMockMediaTree(): MediaFile {
    return {
      type: 'folder',
      displayName: 'root',
      path: '/root',
      mediaType: 'image',
      mediaSubtype: 'default',
      children: [
        {
          type: 'folder',
          displayName: 'Characters',
          path: '/root/Characters',
          mediaType: 'image',
          mediaSubtype: 'default',
          children: [
            {
              type: 'file',
              displayName: 'Hero',
              path: '/root/Characters/hero.jpg',
              mediaType: 'image',
              mediaSubtype: 'portrait'
            },
            {
              type: 'folder',
              displayName: 'NPCs',
              path: '/root/Characters/NPCs',
              mediaType: 'image',
              mediaSubtype: 'default',
              children: [
                {
                  type: 'file',
                  displayName: 'Guard',
                  path: '/root/Characters/NPCs/guard.jpg',
                  mediaType: 'image',
                  mediaSubtype: 'portrait'
                }
              ]
            }
          ]
        },
        {
          type: 'folder',
          displayName: 'Locations',
          path: '/root/Locations',
          mediaType: 'image',
          mediaSubtype: 'default',
          children: [
            {
              type: 'file',
              displayName: 'Tavern',
              path: '/root/Locations/tavern.jpg',
              mediaType: 'image',
              mediaSubtype: 'background'
            }
          ]
        },
        {
          type: 'file',
          displayName: 'Map',
          path: '/root/map.jpg',
          mediaType: 'image',
          mediaSubtype: 'background'
        }
      ]
    }
  }

  // Simulates the currentFolderNode logic from ImagesDashboard
  function getCurrentFolderNode(tree: MediaFile | null, folderPath: string): MediaFile | null {
    if (!tree) return null
    if (!folderPath) return tree

    const pathParts = folderPath.split('/').filter(p => p)
    let node = tree

    for (const part of pathParts) {
      const child = node.children?.find(c => c.displayName === part)
      if (!child || child.type !== 'folder') return null
      node = child
    }

    return node
  }

  // Simulates the currentItems logic from ImagesDashboard
  function getCurrentItems(node: MediaFile | null): { folders: MediaFile[], files: MediaFile[] } {
    if (!node || !node.children) {
      return { folders: [], files: [] }
    }

    const folders = node.children.filter(c => c.type === 'folder')
    const files = node.children.filter(c => c.type === 'file')

    return { folders, files }
  }

  // Simulates navigateInto from ImagesDashboard
  function navigateInto(currentPath: string, folder: MediaFile): string {
    if (folder.type !== 'folder') return currentPath

    if (currentPath) {
      return `${currentPath}/${folder.displayName}`
    } else {
      return folder.displayName
    }
  }

  // Simulates navigateUp from ImagesDashboard
  function navigateUp(currentPath: string): string {
    const parts = currentPath.split('/').filter(p => p)
    parts.pop()
    return parts.join('/')
  }

  describe('getCurrentFolderNode', () => {
    it('should return root node when path is empty', () => {
      const tree = createMockMediaTree()
      const node = getCurrentFolderNode(tree, '')

      expect(node).toBe(tree)
      expect(node?.displayName).toBe('root')
    })

    it('should navigate to first-level folder', () => {
      const tree = createMockMediaTree()
      const node = getCurrentFolderNode(tree, 'Characters')

      expect(node).not.toBeNull()
      expect(node?.displayName).toBe('Characters')
      expect(node?.type).toBe('folder')
    })

    it('should navigate to nested folder', () => {
      const tree = createMockMediaTree()
      const node = getCurrentFolderNode(tree, 'Characters/NPCs')

      expect(node).not.toBeNull()
      expect(node?.displayName).toBe('NPCs')
      expect(node?.type).toBe('folder')
    })

    it('should return null for non-existent folder', () => {
      const tree = createMockMediaTree()
      const node = getCurrentFolderNode(tree, 'NonExistent')

      expect(node).toBeNull()
    })

    it('should return null for invalid path', () => {
      const tree = createMockMediaTree()
      const node = getCurrentFolderNode(tree, 'Characters/InvalidFolder')

      expect(node).toBeNull()
    })
  })

  describe('getCurrentItems', () => {
    it('should return empty arrays for null node', () => {
      const items = getCurrentItems(null)

      expect(items.folders).toEqual([])
      expect(items.files).toEqual([])
    })

    it('should separate folders and files at root level', () => {
      const tree = createMockMediaTree()
      const items = getCurrentItems(tree)

      expect(items.folders).toHaveLength(2)
      expect(items.files).toHaveLength(1)
      expect(items.folders[0].displayName).toBe('Characters')
      expect(items.folders[1].displayName).toBe('Locations')
      expect(items.files[0].displayName).toBe('Map')
    })

    it('should separate folders and files in nested folder', () => {
      const tree = createMockMediaTree()
      const node = getCurrentFolderNode(tree, 'Characters')
      const items = getCurrentItems(node)

      expect(items.folders).toHaveLength(1)
      expect(items.files).toHaveLength(1)
      expect(items.folders[0].displayName).toBe('NPCs')
      expect(items.files[0].displayName).toBe('Hero')
    })

    it('should handle folder with only files', () => {
      const tree = createMockMediaTree()
      const node = getCurrentFolderNode(tree, 'Locations')
      const items = getCurrentItems(node)

      expect(items.folders).toHaveLength(0)
      expect(items.files).toHaveLength(1)
      expect(items.files[0].displayName).toBe('Tavern')
    })
  })

  describe('navigateInto', () => {
    it('should navigate into folder from root', () => {
      const folder: MediaFile = {
        type: 'folder',
        displayName: 'Characters',
        path: '/root/Characters',
        mediaType: 'image',
        mediaSubtype: 'default'
      }

      const newPath = navigateInto('', folder)
      expect(newPath).toBe('Characters')
    })

    it('should navigate into nested folder', () => {
      const folder: MediaFile = {
        type: 'folder',
        displayName: 'NPCs',
        path: '/root/Characters/NPCs',
        mediaType: 'image',
        mediaSubtype: 'default'
      }

      const newPath = navigateInto('Characters', folder)
      expect(newPath).toBe('Characters/NPCs')
    })

    it('should not navigate into files', () => {
      const file: MediaFile = {
        type: 'file',
        displayName: 'Hero',
        path: '/root/Characters/hero.jpg',
        mediaType: 'image',
        mediaSubtype: 'portrait'
      }

      const newPath = navigateInto('Characters', file)
      expect(newPath).toBe('Characters')
    })
  })

  describe('navigateUp', () => {
    it('should navigate to root from first-level folder', () => {
      const newPath = navigateUp('Characters')
      expect(newPath).toBe('')
    })

    it('should navigate up one level from nested folder', () => {
      const newPath = navigateUp('Characters/NPCs')
      expect(newPath).toBe('Characters')
    })

    it('should handle root path', () => {
      const newPath = navigateUp('')
      expect(newPath).toBe('')
    })

    it('should navigate up multiple levels correctly', () => {
      let path = 'Level1/Level2/Level3'

      path = navigateUp(path)
      expect(path).toBe('Level1/Level2')

      path = navigateUp(path)
      expect(path).toBe('Level1')

      path = navigateUp(path)
      expect(path).toBe('')
    })
  })

  describe('Complete Navigation Flow', () => {
    it('should navigate through folder structure correctly', () => {
      const tree = createMockMediaTree()
      let currentPath = ''

      // Start at root
      let node = getCurrentFolderNode(tree, currentPath)
      let items = getCurrentItems(node)
      expect(items.folders).toHaveLength(2)
      expect(items.files).toHaveLength(1)

      // Navigate into Characters
      const charactersFolder = items.folders[0]
      currentPath = navigateInto(currentPath, charactersFolder)
      expect(currentPath).toBe('Characters')

      node = getCurrentFolderNode(tree, currentPath)
      items = getCurrentItems(node)
      expect(items.folders).toHaveLength(1)
      expect(items.files).toHaveLength(1)

      // Navigate into NPCs
      const npcsFolder = items.folders[0]
      currentPath = navigateInto(currentPath, npcsFolder)
      expect(currentPath).toBe('Characters/NPCs')

      node = getCurrentFolderNode(tree, currentPath)
      items = getCurrentItems(node)
      expect(items.folders).toHaveLength(0)
      expect(items.files).toHaveLength(1)

      // Navigate back to Characters
      currentPath = navigateUp(currentPath)
      expect(currentPath).toBe('Characters')

      // Navigate back to root
      currentPath = navigateUp(currentPath)
      expect(currentPath).toBe('')
    })
  })
})
