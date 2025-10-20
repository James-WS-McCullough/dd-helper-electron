/**
 * Main Process Entry Point
 *
 * Initializes the Electron application and coordinates all modules
 */

import { app, BrowserWindow } from 'electron'
import { electronApp, optimizer } from '@electron-toolkit/utils'
import { createMainWindow } from './windows'
import { registerIpcHandlers } from './ipcHandlers'
import { loadCachedDirectory } from './fileOperations'
import { registerMediaProtocol } from './protocol'

/**
 * Register app event listeners
 */
function registerAppEventListeners(): void {
  // Quit when all windows are closed, except on macOS
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit()
    }
  })

  // On macOS, re-create window when dock icon is clicked
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow()
    }
  })

  // Optimize window behavior on macOS
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })
}

/**
 * Initialize the application
 */
async function initialize(): Promise<void> {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.dd-helper')

  // Register custom protocol for serving media files
  registerMediaProtocol()

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // Register all IPC handlers
  registerIpcHandlers()

  // Register app lifecycle event listeners
  registerAppEventListeners()

  // Load cached directory from previous session
  await loadCachedDirectory()

  // Create the main window
  createMainWindow()
}

// Start the application when Electron is ready
app.whenReady().then(initialize)
