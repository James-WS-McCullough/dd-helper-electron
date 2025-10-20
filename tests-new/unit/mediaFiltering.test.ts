/**
 * Media Filtering Tests
 *
 * Tests for filtering media files by type (images/videos vs audio)
 */

import type { MediaFile, MediaType } from '../../src/renderer/src/types'

describe('Media Filtering Logic', () => {
  const createMediaFile = (
    name: string,
    type: 'file' | 'folder',
    mediaType: MediaType,
    children?: MediaFile[]
  ): MediaFile => ({
    name,
    path: `/test/${name}`,
    type,
    mediaType,
    mediaSubtype: 'default',
    displayName: name,
    children
  })

  describe('filterMediaByType', () => {
    it('should filter only image and video files', () => {
      const mediaTree: MediaFile = createMediaFile('root', 'folder', 'other', [
        createMediaFile('image.jpg', 'file', 'image'),
        createMediaFile('video.mp4', 'file', 'video'),
        createMediaFile('audio.mp3', 'file', 'audio'),
        createMediaFile('document.pdf', 'file', 'other')
      ])

      const filterVisualMedia = (node: MediaFile): MediaFile | null => {
        if (node.type === 'file') {
          return node.mediaType === 'image' || node.mediaType === 'video' ? node : null
        }

        const filteredChildren = node.children
          ?.map(child => filterVisualMedia(child))
          .filter((child): child is MediaFile => child !== null)

        if (!filteredChildren || filteredChildren.length === 0) {
          return null
        }

        return { ...node, children: filteredChildren }
      }

      const result = filterVisualMedia(mediaTree)

      expect(result).not.toBeNull()
      expect(result?.children).toHaveLength(2)
      expect(result?.children?.[0].name).toBe('image.jpg')
      expect(result?.children?.[1].name).toBe('video.mp4')
    })

    it('should filter only audio files', () => {
      const mediaTree: MediaFile = createMediaFile('root', 'folder', 'other', [
        createMediaFile('image.jpg', 'file', 'image'),
        createMediaFile('video.mp4', 'file', 'video'),
        createMediaFile('audio.mp3', 'file', 'audio'),
        createMediaFile('sound.wav', 'file', 'audio')
      ])

      const filterAudioMedia = (node: MediaFile): MediaFile | null => {
        if (node.type === 'file') {
          return node.mediaType === 'audio' ? node : null
        }

        const filteredChildren = node.children
          ?.map(child => filterAudioMedia(child))
          .filter((child): child is MediaFile => child !== null)

        if (!filteredChildren || filteredChildren.length === 0) {
          return null
        }

        return { ...node, children: filteredChildren }
      }

      const result = filterAudioMedia(mediaTree)

      expect(result).not.toBeNull()
      expect(result?.children).toHaveLength(2)
      expect(result?.children?.[0].name).toBe('audio.mp3')
      expect(result?.children?.[1].name).toBe('sound.wav')
    })

    it('should preserve folder structure when filtering', () => {
      const mediaTree: MediaFile = createMediaFile('root', 'folder', 'other', [
        createMediaFile('images', 'folder', 'other', [
          createMediaFile('portrait.jpg', 'file', 'image'),
          createMediaFile('background.png', 'file', 'image')
        ]),
        createMediaFile('audio', 'folder', 'other', [
          createMediaFile('music.mp3', 'file', 'audio')
        ])
      ])

      const filterVisualMedia = (node: MediaFile): MediaFile | null => {
        if (node.type === 'file') {
          return node.mediaType === 'image' || node.mediaType === 'video' ? node : null
        }

        const filteredChildren = node.children
          ?.map(child => filterVisualMedia(child))
          .filter((child): child is MediaFile => child !== null)

        if (!filteredChildren || filteredChildren.length === 0) {
          return null
        }

        return { ...node, children: filteredChildren }
      }

      const result = filterVisualMedia(mediaTree)

      expect(result?.children).toHaveLength(1)
      expect(result?.children?.[0].name).toBe('images')
      expect(result?.children?.[0].children).toHaveLength(2)
    })

    it('should remove empty folders after filtering', () => {
      const mediaTree: MediaFile = createMediaFile('root', 'folder', 'other', [
        createMediaFile('emptyFolder', 'folder', 'other', [
          createMediaFile('audio.mp3', 'file', 'audio')
        ]),
        createMediaFile('hasImages', 'folder', 'other', [
          createMediaFile('image.jpg', 'file', 'image')
        ])
      ])

      const filterVisualMedia = (node: MediaFile): MediaFile | null => {
        if (node.type === 'file') {
          return node.mediaType === 'image' || node.mediaType === 'video' ? node : null
        }

        const filteredChildren = node.children
          ?.map(child => filterVisualMedia(child))
          .filter((child): child is MediaFile => child !== null)

        if (!filteredChildren || filteredChildren.length === 0) {
          return null
        }

        return { ...node, children: filteredChildren }
      }

      const result = filterVisualMedia(mediaTree)

      expect(result?.children).toHaveLength(1)
      expect(result?.children?.[0].name).toBe('hasImages')
    })

    it('should handle nested folder structures', () => {
      const mediaTree: MediaFile = createMediaFile('root', 'folder', 'other', [
        createMediaFile('level1', 'folder', 'other', [
          createMediaFile('level2', 'folder', 'other', [
            createMediaFile('level3', 'folder', 'other', [
              createMediaFile('deep.jpg', 'file', 'image')
            ])
          ])
        ])
      ])

      const filterVisualMedia = (node: MediaFile): MediaFile | null => {
        if (node.type === 'file') {
          return node.mediaType === 'image' || node.mediaType === 'video' ? node : null
        }

        const filteredChildren = node.children
          ?.map(child => filterVisualMedia(child))
          .filter((child): child is MediaFile => child !== null)

        if (!filteredChildren || filteredChildren.length === 0) {
          return null
        }

        return { ...node, children: filteredChildren }
      }

      const result = filterVisualMedia(mediaTree)

      expect(result).not.toBeNull()
      expect(result?.children?.[0]?.children?.[0]?.children?.[0]?.children?.[0].name).toBe(
        'deep.jpg'
      )
    })

    it('should return null if no matching files found', () => {
      const mediaTree: MediaFile = createMediaFile('root', 'folder', 'other', [
        createMediaFile('audio.mp3', 'file', 'audio'),
        createMediaFile('document.pdf', 'file', 'other')
      ])

      const filterVisualMedia = (node: MediaFile): MediaFile | null => {
        if (node.type === 'file') {
          return node.mediaType === 'image' || node.mediaType === 'video' ? node : null
        }

        const filteredChildren = node.children
          ?.map(child => filterVisualMedia(child))
          .filter((child): child is MediaFile => child !== null)

        if (!filteredChildren || filteredChildren.length === 0) {
          return null
        }

        return { ...node, children: filteredChildren }
      }

      const result = filterVisualMedia(mediaTree)

      expect(result).toBeNull()
    })
  })
})
