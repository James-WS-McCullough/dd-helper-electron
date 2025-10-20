export const app = {
  getPath: jest.fn(() => '/test/user/data'),
  whenReady: jest.fn(() => Promise.resolve()),
  on: jest.fn(),
  quit: jest.fn()
}

export class BrowserWindow {
  static getAllWindows = jest.fn(() => [])
  webContents = {
    send: jest.fn(),
    openDevTools: jest.fn(),
    setWindowOpenHandler: jest.fn()
  }
  loadURL = jest.fn()
  loadFile = jest.fn()
  on = jest.fn()
  focus = jest.fn()
  isDestroyed = jest.fn(() => false)
  show = jest.fn()
}

export const ipcMain = {
  handle: jest.fn(),
  on: jest.fn()
}

export const dialog = {
  showOpenDialog: jest.fn()
}

export const shell = {
  openExternal: jest.fn()
}

export const ipcRenderer = {
  invoke: jest.fn(),
  on: jest.fn(),
  send: jest.fn(),
  removeAllListeners: jest.fn()
}

export const contextBridge = {
  exposeInMainWorld: jest.fn()
}
