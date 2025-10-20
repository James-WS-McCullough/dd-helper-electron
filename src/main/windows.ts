/**
 * Window Management Module
 *
 * Handles creation and management of Electron windows
 */

import { BrowserWindow } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'

let mainWindow: BrowserWindow | null = null
let displayWindow: BrowserWindow | null = null

/**
 * Create the main application window
 */
export function createMainWindow(): BrowserWindow {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    // Open links in external browser
    require('electron').shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // Load the starting screen or dev server
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  // Open DevTools in development
  if (process.argv.includes('--dev') || is.dev) {
    mainWindow.webContents.openDevTools()
  }

  return mainWindow
}

/**
 * Create the display window for presenting content to players
 */
export function createDisplayWindow(): BrowserWindow {
  displayWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: true,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  displayWindow.on('ready-to-show', () => {
    displayWindow?.show()
  })

  // TODO: Load display window HTML (will be implemented in later phases)
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    // For now, just load the same dev server (we'll add routing later)
    displayWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}#/display`)
  } else {
    displayWindow.loadFile(join(__dirname, '../renderer/index.html'), {
      hash: '/display'
    })
  }

  // Open DevTools in development
  if (process.argv.includes('--dev') || is.dev) {
    displayWindow.webContents.openDevTools()
  }

  return displayWindow
}

/**
 * Get the main window instance
 */
export function getMainWindow(): BrowserWindow | null {
  return mainWindow
}

/**
 * Get the display window instance
 */
export function getDisplayWindow(): BrowserWindow | null {
  return displayWindow
}

/**
 * Check if display window exists and is not destroyed
 */
export function hasDisplayWindow(): boolean {
  return displayWindow !== null && !displayWindow.isDestroyed()
}

/**
 * Open or focus the display window
 */
export function openDisplayWindow(): boolean {
  if (!displayWindow || displayWindow.isDestroyed()) {
    createDisplayWindow()
  } else {
    displayWindow.focus()
  }
  return true
}
