/**
 * Starting Screen Integration Tests
 *
 * Tests the directory selection flow and navigation to dashboard
 */

import { ipcMain, dialog, BrowserWindow } from 'electron'
import { promises as fs } from 'fs'

jest.mock('fs')
jest.mock('electron')
jest.mock('../../src/main/windows', () => ({
  getMainWindow: jest.fn(() => ({ isDestroyed: () => false })),
  getDisplayWindow: jest.fn(),
  hasDisplayWindow: jest.fn(() => false),
  openDisplayWindow: jest.fn(() => true),
  createMainWindow: jest.fn(),
  createDisplayWindow: jest.fn(() => ({ isDestroyed: () => false }))
}))

// Import the handlers once
import { registerIpcHandlers } from '../../src/main/ipcHandlers'

describe('Starting Screen - Directory Selection Flow', () => {
  let handlers: Record<string, Function>

  beforeAll(() => {
    // Register handlers once for all tests
    registerIpcHandlers()

    // Extract handlers from mock calls
    handlers = {}
    ;(ipcMain.handle as jest.Mock).mock.calls.forEach(([channel, handler]) => {
      handlers[channel] = handler
    })
  })

  beforeEach(() => {
    // Clear mocks but keep handlers
    jest.clearAllMocks()
  })

  describe('Directory Selection and Navigation', () => {
    it('should open display window when navigating to dashboard', () => {
      // Verify the handler exists
      expect(handlers['open-display-window']).toBeDefined()

      // Call the handler
      const result = handlers['open-display-window']()

      // Verify that opening display window returns true
      expect(result).toBe(true)
    })

    it('should cache selected directory for future sessions', async () => {
      // Mock file system operations
      ;(fs.writeFile as jest.Mock).mockResolvedValue(undefined)
      ;(fs.readFile as jest.Mock).mockResolvedValue(
        JSON.stringify({ lastDirectory: '/cached/path' })
      )
      ;(dialog.showOpenDialog as jest.Mock).mockResolvedValue({
        canceled: false,
        filePaths: ['/test/campaign/directory']
      })

      // Verify handler exists
      expect(handlers['select-directory']).toBeDefined()

      // Call the handler
      const result = await handlers['select-directory']({}, {})

      // Verify directory was selected and cached
      expect(result).toBe('/test/campaign/directory')
      expect(fs.writeFile).toHaveBeenCalled()
    })

    it('should scan directory after selection', async () => {
      ;(fs.readdir as jest.Mock).mockResolvedValue([
        {
          name: 'test.jpg',
          isDirectory: () => false,
          isFile: () => true
        }
      ])

      // Verify handler exists
      expect(handlers['scan-directory']).toBeDefined()

      // Call the handler
      const result = await handlers['scan-directory']({}, '/test/campaign')

      // Verify scan result
      expect(result).toHaveProperty('type', 'folder')
      expect(result).toHaveProperty('children')
    })
  })

  describe('Error Handling', () => {
    it('should handle directory selection cancellation', async () => {
      ;(dialog.showOpenDialog as jest.Mock).mockResolvedValue({
        canceled: true,
        filePaths: []
      })

      const result = await handlers['select-directory']({}, {})

      // Should return null when canceled
      expect(result).toBeNull()
    })

    it('should handle directory scanning errors gracefully', async () => {
      ;(fs.readdir as jest.Mock).mockRejectedValue(new Error('Permission denied'))

      // Should throw error which will be caught by the renderer
      await expect(handlers['scan-directory']({}, '/restricted')).rejects.toThrow()
    })
  })

  describe('Complete Workflow', () => {
    it('should complete full starting screen workflow', async () => {
      // Setup mocks for complete workflow
      ;(dialog.showOpenDialog as jest.Mock).mockResolvedValue({
        canceled: false,
        filePaths: ['/test/campaign']
      })

      ;(fs.writeFile as jest.Mock).mockResolvedValue(undefined)
      ;(fs.readFile as jest.Mock).mockResolvedValue(
        JSON.stringify({ lastDirectory: '/test/campaign' })
      )

      ;(fs.readdir as jest.Mock).mockResolvedValue([
        {
          name: 'portrait.jpg',
          isDirectory: () => false,
          isFile: () => true
        }
      ])

      // Step 1: Select directory
      const selectedPath = await handlers['select-directory']({}, {})
      expect(selectedPath).toBe('/test/campaign')

      // Step 2: Scan directory
      const scanResult = await handlers['scan-directory']({}, selectedPath)
      expect(scanResult).toHaveProperty('children')
      expect(scanResult.children).toHaveLength(1)

      // Step 3: Open display window (should happen on dashboard navigation)
      const displayOpened = handlers['open-display-window']()
      expect(displayOpened).toBe(true)

      // Workflow complete: directory selected, scanned, and display window opened
    })
  })
})
