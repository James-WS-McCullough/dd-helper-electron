const path = require('path');
const { createElectronMock } = require('../utils/electronMocks');
const {
  createMockFsPromises,
  createMockDialogResult,
  createMockFileEntry,
  createMockDisplayState,
  createMockEncounter,
  createMockBattlemapData
} = require('../utils/mockFactories');

// Mock electron module
jest.mock('electron', () => require('../utils/electronMocks').createElectronMock());

// Mock fs.promises
jest.mock('fs', () => ({
  promises: require('../utils/mockFactories').createMockFsPromises()
}));

describe('Main Process', () => {
  let main;
  let app, BrowserWindow, ipcMain, dialog;
  let mockFsPromises;

  beforeEach(() => {
    // Clear mock call history but keep the mock instances
    jest.clearAllMocks();

    // Get references to the singleton mocks
    ({ app, BrowserWindow, ipcMain, dialog } = require('electron'));
    mockFsPromises = require('fs').promises;

    // Reset app ready state for next test
    if (app._resetReady) {
      app._resetReady();
    }

    // Reset modules to ensure main.js is reloaded fresh
    jest.resetModules();

    // Re-import mocks after reset (singleton pattern ensures same instance)
    ({ app, BrowserWindow, ipcMain, dialog } = require('electron'));
    mockFsPromises = require('fs').promises;

    // Import main module after mocks are set up
    main = require('../../src/main.js');

    // Register IPC handlers for tests that need them
    main.registerIpcHandlers();
    main.registerAppEventListeners();
  });

  describe('Application Initialization', () => {
    test('should load cached directory on startup', async () => {
      const mockSettings = {
        lastDirectory: '/test/cached/directory'
      };

      mockFsPromises.readFile.mockResolvedValueOnce(JSON.stringify(mockSettings));
      mockFsPromises.stat.mockResolvedValueOnce({
        isDirectory: () => true
      });

      // Call initialization function
      await main.initialize();

      // Verify settings file was read
      expect(mockFsPromises.readFile).toHaveBeenCalledWith(
        expect.stringContaining('settings.json'),
        'utf8'
      );
    });

    test('should create main window when app is ready', async () => {
      await main.initialize();

      expect(BrowserWindow).toHaveBeenCalled();
      expect(BrowserWindow.mock.results[0].value.loadFile).toHaveBeenCalledWith(
        'src/renderer/starting-screen.html'
      );
    });

    test('should open DevTools in development mode', async () => {
      process.argv.push('--dev');

      await main.initialize();

      const mainWindow = BrowserWindow.mock.results[0].value;
      expect(mainWindow.webContents.openDevTools).toHaveBeenCalled();

      process.argv.pop(); // Remove --dev flag
    });

    test('should handle missing cached directory gracefully', async () => {
      mockFsPromises.readFile.mockRejectedValueOnce(new Error('ENOENT'));

      await main.initialize();

      // Should not throw and should create window anyway
      expect(BrowserWindow).toHaveBeenCalled();
    });
  });

  describe('IPC Handlers - Directory Management', () => {
    beforeEach(async () => {
      // IPC handlers are already registered in the parent beforeEach
      await app.whenReady();
      // Create main window for dialog parent
      main.createMainWindow();
    });

    test('should handle select-directory request', async () => {
      const selectedPath = '/test/selected/directory';
      dialog.showOpenDialog.mockResolvedValueOnce(
        createMockDialogResult(false, [selectedPath])
      );

      const result = await ipcMain._simulateInvoke('select-directory');

      expect(dialog.showOpenDialog).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          properties: ['openDirectory']
        })
      );
      expect(result).toBe(selectedPath);
    });

    test('should return null when directory selection is canceled', async () => {
      dialog.showOpenDialog.mockResolvedValueOnce(
        createMockDialogResult(true, [])
      );

      const result = await ipcMain._simulateInvoke('select-directory');

      expect(result).toBeNull();
    });

    test('should cache selected directory', async () => {
      const selectedPath = '/test/selected/directory';
      dialog.showOpenDialog.mockResolvedValueOnce(
        createMockDialogResult(false, [selectedPath])
      );

      await ipcMain._simulateInvoke('select-directory');

      expect(mockFsPromises.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('settings.json'),
        expect.stringContaining(selectedPath)
      );
    });

    test('should retrieve cached directory', async () => {
      const cachedDir = '/test/cached/directory';
      mockFsPromises.readFile.mockResolvedValueOnce(
        JSON.stringify({ lastDirectory: cachedDir })
      );
      mockFsPromises.stat.mockResolvedValueOnce({
        isDirectory: () => true
      });

      // Load cached directory
      await main.loadCachedDirectory();

      const result = await ipcMain._simulateInvoke('get-cached-directory');
      expect(result).toBe(cachedDir);
    });
  });

  describe('IPC Handlers - Directory Scanning', () => {
    beforeEach(async () => {
      await app.whenReady();
    });

    test('should scan directory and categorize media files', async () => {
      const testPath = '/test/media';
      mockFsPromises.readdir.mockResolvedValueOnce([
        createMockFileEntry('character.png', false),
        createMockFileEntry('dungeon_location.png', false),
        createMockFileEntry('battle_music.mp3', false),
        createMockFileEntry('subfolder', true)
      ]);

      // Mock subfolder scan
      mockFsPromises.readdir.mockResolvedValueOnce([
        createMockFileEntry('dragon.mp4', false)
      ]);

      const result = await ipcMain._simulateInvoke('scan-directory', testPath);

      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('children');
      expect(Array.isArray(result.children)).toBe(true);
      expect(mockFsPromises.readdir).toHaveBeenCalled();
    });

    test('should identify portrait images correctly', async () => {
      const testPath = '/test/media';
      mockFsPromises.readdir.mockResolvedValueOnce([
        createMockFileEntry('hero.png', false)
      ]);

      const result = await ipcMain._simulateInvoke('scan-directory', testPath);
      const portraitFile = result.children.find(c => c.name === 'hero.png');

      expect(portraitFile.mediaType).toBe('image');
      expect(portraitFile.mediaSubtype).toBe('portrait');
    });

    test('should identify background images correctly', async () => {
      const testPath = '/test/media';
      mockFsPromises.readdir.mockResolvedValueOnce([
        createMockFileEntry('castle_location.jpg', false)
      ]);

      const result = await ipcMain._simulateInvoke('scan-directory', testPath);
      const bgFile = result.children.find(c => c.name === 'castle_location.jpg');

      expect(bgFile.mediaType).toBe('image');
      expect(bgFile.mediaSubtype).toBe('background');
    });

    test('should identify audio files with correct subtypes', async () => {
      const testPath = '/test/media';
      mockFsPromises.readdir.mockResolvedValueOnce([
        createMockFileEntry('ambient_loop.mp3', false),
        createMockFileEntry('theme_music.mp3', false),
        createMockFileEntry('explosion.wav', false)
      ]);

      const result = await ipcMain._simulateInvoke('scan-directory', testPath);

      const loopFile = result.children.find(c => c.name === 'ambient_loop.mp3');
      const musicFile = result.children.find(c => c.name === 'theme_music.mp3');
      const soundFile = result.children.find(c => c.name === 'explosion.wav');

      expect(loopFile.mediaSubtype).toBe('loop');
      expect(musicFile.mediaSubtype).toBe('music');
      expect(soundFile.mediaSubtype).toBe('sound');
    });

    test('should handle scanning errors gracefully', async () => {
      mockFsPromises.readdir.mockRejectedValueOnce(new Error('Permission denied'));

      await expect(
        ipcMain._simulateInvoke('scan-directory', '/restricted/path')
      ).rejects.toThrow('Permission denied');
    });

    test('should hide files starting with underscore', async () => {
      const testPath = '/test/media';
      mockFsPromises.readdir.mockResolvedValueOnce([
        createMockFileEntry('_secret.png', false)
      ]);

      const result = await ipcMain._simulateInvoke('scan-directory', testPath);
      const secretFile = result.children.find(c => c.name === '_secret.png');

      expect(secretFile.displayName).toBe('???');
    });
  });

  describe('IPC Handlers - Window Management', () => {
    beforeEach(async () => {
      await app.whenReady();
      // Create main window for these tests
      main.createMainWindow();
    });

    test('should open display window when requested', async () => {
      const result = await ipcMain._simulateInvoke('open-display-window');

      expect(BrowserWindow).toHaveBeenCalledTimes(2); // Main + Display
      expect(result).toBe(true);
    });

    test('should focus existing display window if already open', async () => {
      // Open window first time
      await ipcMain._simulateInvoke('open-display-window');
      const displayWindow = BrowserWindow.mock.results[1].value;

      // Try to open again
      await ipcMain._simulateInvoke('open-display-window');

      expect(BrowserWindow).toHaveBeenCalledTimes(2); // Should not create new window
      expect(displayWindow.focus).toHaveBeenCalled();
    });

    test('should load dashboard in main window', async () => {
      const mainWindow = BrowserWindow.mock.results[0].value;

      const result = await ipcMain._simulateInvoke('load-dashboard');

      expect(mainWindow.loadFile).toHaveBeenCalledWith(
        'src/renderer/dashboard.html'
      );
      expect(result).toBe(true);
    });
  });

  describe('IPC Handlers - Display State Management', () => {
    beforeEach(async () => {
      await app.whenReady();
      // Create main window and open display window for these tests
      main.createMainWindow();
      await ipcMain._simulateInvoke('open-display-window');
    });

    test('should display portrait media and update state', async () => {
      const mediaPath = '/test/portraits/hero.png';
      const displayWindow = BrowserWindow.mock.results[1].value;

      const result = await ipcMain._simulateInvoke(
        'display-media',
        mediaPath,
        'image',
        'portrait',
        'Hero'
      );

      expect(result).toBe(true);
      expect(displayWindow.webContents.send).toHaveBeenCalledWith(
        'update-display',
        expect.objectContaining({
          portraits: expect.arrayContaining([
            expect.objectContaining({
              path: mediaPath,
              displayName: 'Hero'
            })
          ])
        })
      );
    });

    test('should not duplicate portraits in state', async () => {
      const mediaPath = '/test/portraits/hero.png';

      // Add portrait twice
      await ipcMain._simulateInvoke('display-media', mediaPath, 'image', 'portrait', 'Hero');
      await ipcMain._simulateInvoke('display-media', mediaPath, 'image', 'portrait', 'Hero');

      const state = await ipcMain._simulateInvoke('get-display-state');

      // Should only have one instance
      const portraitCount = state.portraits.filter(p => p.path === mediaPath).length;
      expect(portraitCount).toBe(1);
    });

    test('should replace background when new one is set', async () => {
      const firstBg = '/test/bg1.png';
      const secondBg = '/test/bg2.png';

      await ipcMain._simulateInvoke('display-media', firstBg, 'image', 'background', 'BG1');
      await ipcMain._simulateInvoke('display-media', secondBg, 'image', 'background', 'BG2');

      const state = await ipcMain._simulateInvoke('get-display-state');

      expect(state.background.path).toBe(secondBg);
    });

    test('should add multiple background sounds', async () => {
      const sound1 = '/test/ambient1_loop.mp3';
      const sound2 = '/test/ambient2_loop.mp3';

      await ipcMain._simulateInvoke('display-media', sound1, 'audio', 'loop', 'Ambient1');
      await ipcMain._simulateInvoke('display-media', sound2, 'audio', 'loop', 'Ambient2');

      const state = await ipcMain._simulateInvoke('get-display-state');

      expect(state.backgroundSounds).toHaveLength(2);
    });

    test('should clear specific portrait from display', async () => {
      const portraitPath = '/test/portraits/hero.png';
      await ipcMain._simulateInvoke('display-media', portraitPath, 'image', 'portrait', 'Hero');

      await ipcMain._simulateInvoke('clear-display-element', 'portraits', portraitPath);

      const state = await ipcMain._simulateInvoke('get-display-state');
      expect(state.portraits).toHaveLength(0);
    });

    test('should clear all portraits when no path specified', async () => {
      await ipcMain._simulateInvoke('display-media', '/test/p1.png', 'image', 'portrait', 'P1');
      await ipcMain._simulateInvoke('display-media', '/test/p2.png', 'image', 'portrait', 'P2');

      await ipcMain._simulateInvoke('clear-display-element', 'portraits');

      const state = await ipcMain._simulateInvoke('get-display-state');
      expect(state.portraits).toHaveLength(0);
    });

    test('should clear entire display state', async () => {
      // Add various media
      await ipcMain._simulateInvoke('display-media', '/test/p1.png', 'image', 'portrait', 'P1');
      await ipcMain._simulateInvoke('display-media', '/test/bg.png', 'image', 'background', 'BG');

      await ipcMain._simulateInvoke('clear-display-element', 'all');

      const state = await ipcMain._simulateInvoke('get-display-state');
      expect(state.portraits).toHaveLength(0);
      expect(state.background).toBeNull();
      expect(state.event).toBeNull();
    });

    test('should get current display state', async () => {
      const state = await ipcMain._simulateInvoke('get-display-state');

      expect(state).toHaveProperty('portraits');
      expect(state).toHaveProperty('background');
      expect(state).toHaveProperty('event');
      expect(state).toHaveProperty('backgroundSounds');
      expect(state).toHaveProperty('backgroundMusic');
      expect(state).toHaveProperty('soundEffects');
    });
  });

  describe('IPC Handlers - Party Data', () => {
    beforeEach(async () => {
      await app.whenReady();
    });

    test('should save party data to file', async () => {
      const partyData = {
        name: 'The Adventurers',
        members: [
          { name: 'Hero', class: 'Fighter', level: 5 }
        ]
      };

      const result = await ipcMain._simulateInvoke(
        'save-party-data',
        '/test/party.json',
        partyData
      );

      expect(result).toBe(true);
      expect(mockFsPromises.writeFile).toHaveBeenCalledWith(
        '/test/party.json',
        expect.stringContaining('The Adventurers')
      );
    });

    test('should load party data from file', async () => {
      const partyData = {
        name: 'The Adventurers',
        members: []
      };
      mockFsPromises.readFile.mockResolvedValueOnce(JSON.stringify(partyData));

      const result = await ipcMain._simulateInvoke('load-party-data', '/test/party.json');

      expect(result).toEqual(partyData);
    });

    test('should return null for non-existent party file', async () => {
      const error = new Error('File not found');
      error.code = 'ENOENT';
      mockFsPromises.readFile.mockRejectedValueOnce(error);

      const result = await ipcMain._simulateInvoke('load-party-data', '/test/missing.json');

      expect(result).toBeNull();
    });
  });

  describe('IPC Handlers - Encounter Data', () => {
    beforeEach(async () => {
      await app.whenReady();
      // Create main window for dialog parent
      main.createMainWindow();
    });

    test('should save encounter data to file', async () => {
      const encounterData = createMockEncounter();

      const result = await ipcMain._simulateInvoke(
        'save-encounter-data',
        '/test/encounter.json',
        encounterData
      );

      expect(result).toBe(true);
      expect(mockFsPromises.writeFile).toHaveBeenCalled();
    });

    test('should load encounter data from file', async () => {
      const encounterData = createMockEncounter();
      mockFsPromises.readFile.mockResolvedValueOnce(JSON.stringify(encounterData));

      const result = await ipcMain._simulateInvoke(
        'load-encounter-data',
        '/test/encounter.json'
      );

      expect(result).toEqual(encounterData);
    });

    test('should get list of encounter files in directory', async () => {
      mockFsPromises.readdir.mockResolvedValueOnce([
        createMockFileEntry('battle1_encounter.json', false),
        createMockFileEntry('battle2_encounter.json', false),
        createMockFileEntry('not_encounter.json', false)
      ]);

      mockFsPromises.readFile.mockImplementation((filePath) => {
        if (filePath.includes('battle1') || filePath.includes('battle2')) {
          return Promise.resolve(JSON.stringify({
            name: 'Battle',
            enemies: []
          }));
        }
        return Promise.resolve('{}');
      });

      mockFsPromises.stat.mockResolvedValue({
        mtime: new Date()
      });

      const result = await ipcMain._simulateInvoke('get-encounter-files', '/test/encounters');

      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('filename');
      expect(result[0]).toHaveProperty('name');
      expect(result[0]).toHaveProperty('enemyCount');
    });

    test('should handle encounter file selection', async () => {
      const selectedFile = '/test/encounters/battle.json';
      dialog.showOpenDialog.mockResolvedValueOnce(
        createMockDialogResult(false, [selectedFile])
      );

      const result = await ipcMain._simulateInvoke(
        'select-encounter-file',
        '/test/encounters'
      );

      expect(result).toBe(selectedFile);
      expect(dialog.showOpenDialog).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          filters: expect.arrayContaining([
            expect.objectContaining({ name: 'Encounter Files' })
          ])
        })
      );
    });
  });

  describe('IPC Handlers - Battlemap Data', () => {
    beforeEach(async () => {
      await app.whenReady();
      // Create main window first
      main.createMainWindow();
      await ipcMain._simulateInvoke('open-display-window');
    });

    test('should save battlemap data to file', async () => {
      const battlemapData = createMockBattlemapData();

      const result = await ipcMain._simulateInvoke(
        'save-battlemap-data',
        '/test/maps',
        battlemapData,
        'dungeon_battlemap.json'
      );

      expect(result.success).toBe(true);
      expect(mockFsPromises.writeFile).toHaveBeenCalledWith(
        '/test/maps/dungeon_battlemap.json',
        expect.any(String)
      );
    });

    test('should use default filename when none provided', async () => {
      const battlemapData = createMockBattlemapData();

      await ipcMain._simulateInvoke(
        'save-battlemap-data',
        '/test/maps',
        battlemapData,
        null
      );

      expect(mockFsPromises.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('default_battlemap.json'),
        expect.any(String)
      );
    });

    test('should load battlemap data from specific file', async () => {
      const battlemapData = createMockBattlemapData();
      mockFsPromises.readFile.mockResolvedValueOnce(JSON.stringify(battlemapData));

      const result = await ipcMain._simulateInvoke(
        'load-battlemap-data',
        '/test/maps/dungeon_battlemap.json'
      );

      expect(result).toEqual(battlemapData);
    });

    test('should try legacy filename when loading from directory', async () => {
      const battlemapData = createMockBattlemapData();
      mockFsPromises.access.mockResolvedValueOnce(); // Legacy file exists
      mockFsPromises.readFile.mockResolvedValueOnce(JSON.stringify(battlemapData));

      const result = await ipcMain._simulateInvoke(
        'load-battlemap-data',
        '/test/maps'
      );

      expect(mockFsPromises.access).toHaveBeenCalledWith(
        expect.stringContaining('battlemap.json')
      );
    });

    test('should get list of battlemap files in directory', async () => {
      mockFsPromises.readdir.mockResolvedValueOnce([
        createMockFileEntry('dungeon_battlemap.json', false),
        createMockFileEntry('cave_battlemap.json', false)
      ]);

      mockFsPromises.readFile.mockImplementation(() =>
        Promise.resolve(JSON.stringify({
          gridWidth: 10,
          gridHeight: 10,
          backgroundImage: '/test/map.png',
          tokens: {}
        }))
      );

      mockFsPromises.stat.mockResolvedValue({
        mtime: new Date()
      });

      const result = await ipcMain._simulateInvoke('get-battlemap-files', '/test/maps');

      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('gridWidth');
      expect(result[0]).toHaveProperty('gridHeight');
    });

    test('should display battlemap on display window', async () => {
      const battlemapData = createMockBattlemapData();
      const displayWindow = BrowserWindow.mock.results[1].value;

      const result = await ipcMain._simulateInvoke('display-battlemap', battlemapData);

      expect(result.success).toBe(true);
      expect(displayWindow.webContents.send).toHaveBeenCalledWith(
        'display-battlemap',
        battlemapData
      );
    });

    test('should hide battlemap from display window', async () => {
      const displayWindow = BrowserWindow.mock.results[1].value;

      const result = await ipcMain._simulateInvoke('hide-battlemap');

      expect(result.success).toBe(true);
      expect(displayWindow.webContents.send).toHaveBeenCalledWith('hide-battlemap');
    });
  });

  describe('IPC Handlers - Initiative Tracking', () => {
    beforeEach(async () => {
      await app.whenReady();
    });

    test('should save initiative data', async () => {
      const initiativeData = {
        combatants: [
          { name: 'Hero', initiative: 18 },
          { name: 'Goblin', initiative: 12 }
        ],
        currentTurn: 0
      };

      const result = await ipcMain._simulateInvoke(
        'save-initiative-data',
        '/test/campaign',
        initiativeData
      );

      expect(result.success).toBe(true);
      expect(mockFsPromises.writeFile).toHaveBeenCalledWith(
        '/test/campaign/initiative.json',
        expect.any(String)
      );
    });

    test('should load initiative data', async () => {
      const initiativeData = {
        combatants: [],
        currentTurn: 0
      };
      mockFsPromises.readFile.mockResolvedValueOnce(JSON.stringify(initiativeData));

      const result = await ipcMain._simulateInvoke(
        'load-initiative-data',
        '/test/campaign'
      );

      expect(result).toEqual(initiativeData);
    });

    test('should return null for missing initiative data', async () => {
      mockFsPromises.readFile.mockRejectedValueOnce(new Error('Not found'));

      const result = await ipcMain._simulateInvoke(
        'load-initiative-data',
        '/test/campaign'
      );

      expect(result).toBeNull();
    });
  });

  describe('Application Lifecycle', () => {
    beforeEach(() => {
      require('../../src/main.js');
    });

    test('should quit app when all windows are closed on non-macOS', () => {
      const quitHandler = app.on.mock.calls.find(
        call => call[0] === 'window-all-closed'
      )?.[1];

      // Mock non-darwin platform
      const originalPlatform = process.platform;
      Object.defineProperty(process, 'platform', { value: 'win32' });

      if (quitHandler) {
        quitHandler();
        expect(app.quit).toHaveBeenCalled();
      }

      Object.defineProperty(process, 'platform', { value: originalPlatform });
    });

    test('should not quit app when all windows are closed on macOS', () => {
      const quitHandler = app.on.mock.calls.find(
        call => call[0] === 'window-all-closed'
      )?.[1];

      // Mock darwin platform
      const originalPlatform = process.platform;
      Object.defineProperty(process, 'platform', { value: 'darwin' });

      if (quitHandler) {
        jest.clearAllMocks();
        quitHandler();
        expect(app.quit).not.toHaveBeenCalled();
      }

      Object.defineProperty(process, 'platform', { value: originalPlatform });
    });

    test('should create window on activate when none exist', () => {
      BrowserWindow.getAllWindows.mockReturnValueOnce([]);

      const activateHandler = app.on.mock.calls.find(
        call => call[0] === 'activate'
      )?.[1];

      if (activateHandler) {
        activateHandler();
        expect(BrowserWindow).toHaveBeenCalled();
      }
    });
  });
});
