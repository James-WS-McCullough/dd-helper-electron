// Electron module mocks

// Singleton instance to ensure consistency across module resets
let mockInstance = null;

/**
 * Creates a comprehensive Electron mock
 * Uses singleton pattern to ensure same instance is returned
 */
function createElectronMock() {
  // Return existing instance if available
  if (mockInstance) {
    return mockInstance;
  }
  const mockWindows = new Map();

  const BrowserWindow = jest.fn(function(options) {
    const window = {
      id: Math.random().toString(36),
      loadFile: jest.fn(() => Promise.resolve()),
      loadURL: jest.fn(() => Promise.resolve()),
      webContents: {
        openDevTools: jest.fn(),
        send: jest.fn(),
        on: jest.fn(),
        executeJavaScript: jest.fn(() => Promise.resolve())
      },
      isDestroyed: jest.fn(() => false),
      destroy: jest.fn(function() {
        this.isDestroyed = jest.fn(() => true);
      }),
      focus: jest.fn(),
      show: jest.fn(),
      hide: jest.fn(),
      close: jest.fn(),
      on: jest.fn(),
      once: jest.fn(),
      removeListener: jest.fn()
    };

    mockWindows.set(window.id, window);
    return window;
  });

  BrowserWindow.getAllWindows = jest.fn(() => Array.from(mockWindows.values()));
  BrowserWindow.fromId = jest.fn((id) => mockWindows.get(id));

  // Create a single shared promise for app.whenReady()
  // This ensures all callers wait on the same promise
  let readyPromise = null;
  let readyResolve = null;

  const app = {
    getPath: jest.fn((name) => {
      const paths = {
        'userData': '/tmp/test-user-data',
        'appData': '/tmp/test-app-data',
        'home': '/tmp/test-home',
        'temp': '/tmp'
      };
      return paths[name] || '/tmp/test-path';
    }),
    whenReady: jest.fn(() => {
      if (!readyPromise) {
        readyPromise = new Promise((resolve) => {
          readyResolve = resolve;
        });
        // Resolve on next tick to allow synchronous code to complete
        setImmediate(() => readyResolve());
      }
      return readyPromise;
    }),
    quit: jest.fn(),
    exit: jest.fn(),
    on: jest.fn(),
    once: jest.fn(),
    removeListener: jest.fn(),
    isReady: jest.fn(() => true),
    // Helper to reset the ready state for tests
    _resetReady: () => {
      readyPromise = null;
      readyResolve = null;
    }
  };

  const dialog = {
    showOpenDialog: jest.fn(() => Promise.resolve({
      canceled: false,
      filePaths: ['/test/selected/path']
    })),
    showSaveDialog: jest.fn(() => Promise.resolve({
      canceled: false,
      filePath: '/test/save/path.json'
    })),
    showMessageBox: jest.fn(() => Promise.resolve({
      response: 0
    })),
    showErrorBox: jest.fn()
  };

  const ipcHandlers = new Map();

  const ipcMain = {
    handle: jest.fn((channel, handler) => {
      ipcHandlers.set(channel, handler);
    }),
    on: jest.fn(),
    once: jest.fn(),
    removeHandler: jest.fn((channel) => {
      ipcHandlers.delete(channel);
    }),
    removeAllListeners: jest.fn(),
    // Helper to simulate IPC calls in tests
    _simulateInvoke: async (channel, ...args) => {
      const handler = ipcHandlers.get(channel);
      if (!handler) {
        throw new Error(`No handler registered for channel: ${channel}`);
      }
      return handler({ sender: { send: jest.fn() } }, ...args);
    }
  };

  const ipcRenderer = {
    invoke: jest.fn((channel, ...args) => {
      const handler = ipcHandlers.get(channel);
      if (handler) {
        return handler({ sender: { send: jest.fn() } }, ...args);
      }
      return Promise.resolve(null);
    }),
    on: jest.fn(),
    once: jest.fn(),
    removeListener: jest.fn(),
    removeAllListeners: jest.fn(),
    send: jest.fn()
  };

  const contextBridge = {
    exposeInMainWorld: jest.fn()
  };

  mockInstance = {
    app,
    BrowserWindow,
    dialog,
    ipcMain,
    ipcRenderer,
    contextBridge,
    // Helpers for testing
    _mockWindows: mockWindows,
    _ipcHandlers: ipcHandlers
  };

  return mockInstance;
}

/**
 * Resets the singleton instance - useful for test isolation
 */
function resetElectronMock() {
  mockInstance = null;
}

module.exports = {
  createElectronMock,
  resetElectronMock
};
