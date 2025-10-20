const { createElectronMock } = require('../utils/electronMocks');
const {
  createMockFsPromises,
  createMockDialogResult,
  createMockFileEntry,
  createMockDisplayState,
  createMockEncounter,
  createMockBattlemapData
} = require('../utils/mockFactories');

// Mock modules at the top level
jest.mock('electron', () => require('../utils/electronMocks').createElectronMock());
jest.mock('fs', () => ({
  promises: require('../utils/mockFactories').createMockFsPromises()
}));

describe('IPC Communication Integration Tests', () => {
  let main;
  let app, BrowserWindow, ipcMain, dialog;
  let mockFsPromises;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();

    ({ app, BrowserWindow, ipcMain, dialog } = require('electron'));
    mockFsPromises = require('fs').promises;

    // Import and initialize main module
    main = require('../../src/main.js');
    main.registerIpcHandlers();
    main.registerAppEventListeners();
  });

  describe('Full Directory Selection and Scanning Workflow', () => {
    test('should select directory, cache it, and scan contents', async () => {
      await app.whenReady();

      const selectedPath = '/test/media/campaign';

      // Step 1: Select directory
      dialog.showOpenDialog.mockResolvedValueOnce(
        createMockDialogResult(false, [selectedPath])
      );

      const dirResult = await ipcMain._simulateInvoke('select-directory');
      expect(dirResult).toBe(selectedPath);

      // Verify directory was cached
      expect(mockFsPromises.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('settings.json'),
        expect.stringContaining(selectedPath)
      );

      // Step 2: Scan the selected directory
      mockFsPromises.readdir.mockResolvedValueOnce([
        createMockFileEntry('hero.png', false),
        createMockFileEntry('dungeon_location.jpg', false),
        createMockFileEntry('battle_music.mp3', false)
      ]);

      const scanResult = await ipcMain._simulateInvoke('scan-directory', selectedPath);

      expect(scanResult).toHaveProperty('children');
      expect(scanResult.children.length).toBe(3);

      // Verify file categorization
      const heroFile = scanResult.children.find(c => c.name === 'hero.png');
      const dungeonFile = scanResult.children.find(c => c.name === 'dungeon_location.jpg');
      const musicFile = scanResult.children.find(c => c.name === 'battle_music.mp3');

      expect(heroFile.mediaSubtype).toBe('portrait');
      expect(dungeonFile.mediaSubtype).toBe('background');
      expect(musicFile.mediaType).toBe('audio');
    });

    test('should retrieve cached directory on subsequent launches', async () => {
      const cachedPath = '/test/cached/directory';

      mockFsPromises.readFile.mockResolvedValueOnce(
        JSON.stringify({ lastDirectory: cachedPath })
      );
      mockFsPromises.stat.mockResolvedValueOnce({
        isDirectory: () => true
      });

      // Simulate app restart
      await app.whenReady();
      await main.loadCachedDirectory();
      main.createMainWindow();

      const result = await ipcMain._simulateInvoke('get-cached-directory');

      expect(result).toBe(cachedPath);
      expect(mockFsPromises.readFile).toHaveBeenCalled();
    });
  });

  describe('Display Window Lifecycle and Media Display', () => {
    test('should open display window and send media updates', async () => {
      await app.whenReady();
      main.createMainWindow();

      // Open display window
      const openResult = await ipcMain._simulateInvoke('open-display-window');
      expect(openResult).toBe(true);
      expect(BrowserWindow).toHaveBeenCalledTimes(2); // Main + Display

      const displayWindow = BrowserWindow.mock.results[1].value;

      // Display portrait
      const portraitPath = '/test/portraits/hero.png';
      await ipcMain._simulateInvoke('display-media', portraitPath, 'image', 'portrait', 'Hero');

      // Verify display window received update
      expect(displayWindow.webContents.send).toHaveBeenCalledWith(
        'update-display',
        expect.objectContaining({
          portraits: expect.arrayContaining([
            expect.objectContaining({
              path: portraitPath,
              displayName: 'Hero'
            })
          ])
        })
      );

      // Add background
      const bgPath = '/test/backgrounds/dungeon_location.jpg';
      await ipcMain._simulateInvoke('display-media', bgPath, 'image', 'background', 'Dungeon');

      // Verify both portrait and background are in state
      expect(displayWindow.webContents.send).toHaveBeenCalledWith(
        'update-display',
        expect.objectContaining({
          portraits: expect.any(Array),
          background: expect.objectContaining({
            path: bgPath
          })
        })
      );
    });

    test('should update main window when display state changes', async () => {
      await app.whenReady();
      main.createMainWindow();

      const mainWindow = BrowserWindow.mock.results[0].value;

      // Open display window
      await ipcMain._simulateInvoke('open-display-window');

      // Display media
      await ipcMain._simulateInvoke('display-media', '/test/p1.png', 'image', 'portrait', 'P1');

      // Main window should also receive state update
      expect(mainWindow.webContents.send).toHaveBeenCalledWith(
        'display-state-updated',
        expect.objectContaining({
          portraits: expect.any(Array)
        })
      );
    });

    test('should handle clearing display elements correctly', async () => {
      await app.whenReady();
      main.createMainWindow();

      await ipcMain._simulateInvoke('open-display-window');
      const displayWindow = BrowserWindow.mock.results[1].value;

      // Add multiple portraits
      await ipcMain._simulateInvoke('display-media', '/test/p1.png', 'image', 'portrait', 'P1');
      await ipcMain._simulateInvoke('display-media', '/test/p2.png', 'image', 'portrait', 'P2');

      // Clear specific portrait
      jest.clearAllMocks();
      await ipcMain._simulateInvoke('clear-display-element', 'portraits', '/test/p1.png');

      // Verify update was sent
      expect(displayWindow.webContents.send).toHaveBeenCalledWith(
        'update-display',
        expect.objectContaining({
          portraits: expect.arrayContaining([
            expect.objectContaining({ path: '/test/p2.png' })
          ])
        })
      );

      const state = await ipcMain._simulateInvoke('get-display-state');
      expect(state.portraits).toHaveLength(1);
      expect(state.portraits[0].path).toBe('/test/p2.png');
    });
  });

  describe('Party and Encounter Data Flow', () => {
    test('should create, save, and load party data', async () => {
      await app.whenReady();
      main.createMainWindow();

      const partyFilePath = '/test/campaign/party.json';
      const partyData = {
        name: 'The Adventurers',
        members: [
          { name: 'Aragorn', class: 'Ranger', level: 10 },
          { name: 'Gandalf', class: 'Wizard', level: 15 }
        ]
      };

      // Save party data
      const saveResult = await ipcMain._simulateInvoke(
        'save-party-data',
        partyFilePath,
        partyData
      );

      expect(saveResult).toBe(true);
      expect(mockFsPromises.writeFile).toHaveBeenCalledWith(
        partyFilePath,
        expect.stringContaining('The Adventurers')
      );

      // Mock file read for loading
      mockFsPromises.readFile.mockResolvedValueOnce(JSON.stringify(partyData));

      // Load party data
      const loadedData = await ipcMain._simulateInvoke('load-party-data', partyFilePath);

      expect(loadedData).toEqual(partyData);
      expect(loadedData.members).toHaveLength(2);
    });

    test('should create, save, and load encounter data', async () => {
      await app.whenReady();
      main.createMainWindow();

      const encounterFilePath = '/test/campaign/goblin_encounter.json';
      const encounterData = createMockEncounter({
        name: 'Goblin Ambush',
        enemies: [
          { name: 'Goblin Chief', hp: 20, ac: 16 },
          { name: 'Goblin Warrior 1', hp: 7, ac: 15 },
          { name: 'Goblin Warrior 2', hp: 7, ac: 15 }
        ]
      });

      // Save encounter
      await ipcMain._simulateInvoke('save-encounter-data', encounterFilePath, encounterData);

      expect(mockFsPromises.writeFile).toHaveBeenCalledWith(
        encounterFilePath,
        expect.stringContaining('Goblin Ambush')
      );

      // Load encounter
      mockFsPromises.readFile.mockResolvedValueOnce(JSON.stringify(encounterData));
      const loaded = await ipcMain._simulateInvoke('load-encounter-data', encounterFilePath);

      expect(loaded.name).toBe('Goblin Ambush');
      expect(loaded.enemies).toHaveLength(3);
    });

    test('should list and select encounter files', async () => {
      await app.whenReady();
      main.createMainWindow();

      const campaignPath = '/test/campaign';

      // Mock directory with encounter files
      mockFsPromises.readdir.mockResolvedValueOnce([
        createMockFileEntry('battle1_encounter.json', false),
        createMockFileEntry('battle2_encounter.json', false),
        createMockFileEntry('notes.txt', false)
      ]);

      mockFsPromises.readFile.mockImplementation((path) => {
        if (path.includes('battle1')) {
          return Promise.resolve(JSON.stringify({
            name: 'Battle 1',
            enemies: [{ name: 'Orc' }]
          }));
        } else if (path.includes('battle2')) {
          return Promise.resolve(JSON.stringify({
            name: 'Battle 2',
            enemies: [{ name: 'Troll' }, { name: 'Goblin' }]
          }));
        }
        return Promise.resolve('not json');
      });

      mockFsPromises.stat.mockResolvedValue({
        mtime: new Date()
      });

      // Get encounter files
      const files = await ipcMain._simulateInvoke('get-encounter-files', campaignPath);

      expect(files).toHaveLength(2);
      expect(files[0].name).toBeDefined();
      expect(files[0].enemyCount).toBeDefined();

      // Select encounter file
      const selectedFile = `${campaignPath}/battle1_encounter.json`;
      dialog.showOpenDialog.mockResolvedValueOnce(
        createMockDialogResult(false, [selectedFile])
      );

      const selected = await ipcMain._simulateInvoke('select-encounter-file', campaignPath);

      expect(selected).toBe(selectedFile);
    });
  });

  describe('Battlemap Integration Flow', () => {
    test('should create, save, load, and display battlemap', async () => {
      await app.whenReady();
      main.createMainWindow();

      await ipcMain._simulateInvoke('open-display-window');
      const displayWindow = BrowserWindow.mock.results[1].value;

      const campaignPath = '/test/campaign';
      const battlemapData = createMockBattlemapData({
        gridWidth: 20,
        gridHeight: 15,
        backgroundImage: '/test/maps/dungeon.png',
        tokens: {
          '5-7': { name: 'Hero', portrait: '/test/hero.png' },
          '10-10': { name: 'Dragon', portrait: '/test/dragon.png' }
        }
      });

      // Save battlemap
      const saveResult = await ipcMain._simulateInvoke(
        'save-battlemap-data',
        campaignPath,
        battlemapData,
        'dungeon_battlemap.json'
      );

      expect(saveResult.success).toBe(true);
      expect(mockFsPromises.writeFile).toHaveBeenCalledWith(
        `${campaignPath}/dungeon_battlemap.json`,
        expect.any(String)
      );

      // Load battlemap
      mockFsPromises.readFile.mockResolvedValueOnce(JSON.stringify(battlemapData));
      const loaded = await ipcMain._simulateInvoke(
        'load-battlemap-data',
        `${campaignPath}/dungeon_battlemap.json`
      );

      expect(loaded.gridWidth).toBe(20);
      expect(loaded.gridHeight).toBe(15);
      expect(Object.keys(loaded.tokens)).toHaveLength(2);

      // Display battlemap
      jest.clearAllMocks();
      const displayResult = await ipcMain._simulateInvoke('display-battlemap', battlemapData);

      expect(displayResult.success).toBe(true);
      expect(displayWindow.webContents.send).toHaveBeenCalledWith(
        'display-battlemap',
        battlemapData
      );

      // Hide battlemap
      jest.clearAllMocks();
      const hideResult = await ipcMain._simulateInvoke('hide-battlemap');

      expect(hideResult.success).toBe(true);
      expect(displayWindow.webContents.send).toHaveBeenCalledWith('hide-battlemap');
    });

    test('should list battlemap files in directory', async () => {
      await app.whenReady();
      main.createMainWindow();

      const campaignPath = '/test/campaign';

      mockFsPromises.readdir.mockResolvedValueOnce([
        createMockFileEntry('dungeon_battlemap.json', false),
        createMockFileEntry('forest_battlemap.json', false),
        createMockFileEntry('notes.txt', false)
      ]);

      const battlemapTemplate = {
        gridWidth: 10,
        gridHeight: 10,
        backgroundImage: '/test/map.png',
        tokens: {}
      };

      mockFsPromises.readFile.mockImplementation((path) => {
        return Promise.resolve(JSON.stringify(battlemapTemplate));
      });

      mockFsPromises.stat.mockResolvedValue({
        mtime: new Date()
      });

      const files = await ipcMain._simulateInvoke('get-battlemap-files', campaignPath);

      expect(files).toHaveLength(2);
      expect(files[0]).toHaveProperty('gridWidth');
      expect(files[0]).toHaveProperty('gridHeight');
      expect(files[0]).toHaveProperty('tokenCount');
    });
  });

  describe('Initiative Tracking Integration', () => {
    test('should save and load initiative data', async () => {
      await app.whenReady();
      main.createMainWindow();

      const campaignPath = '/test/campaign';
      const initiativeData = {
        combatants: [
          { name: 'Hero', initiative: 18, hp: 45, maxHp: 45 },
          { name: 'Goblin 1', initiative: 15, hp: 7, maxHp: 7 },
          { name: 'Goblin 2', initiative: 12, hp: 7, maxHp: 7 }
        ],
        currentTurn: 0,
        round: 1
      };

      // Save initiative
      const saveResult = await ipcMain._simulateInvoke(
        'save-initiative-data',
        campaignPath,
        initiativeData
      );

      expect(saveResult.success).toBe(true);
      expect(mockFsPromises.writeFile).toHaveBeenCalledWith(
        `${campaignPath}/initiative.json`,
        expect.stringContaining('Hero')
      );

      // Load initiative
      mockFsPromises.readFile.mockResolvedValueOnce(JSON.stringify(initiativeData));
      const loaded = await ipcMain._simulateInvoke('load-initiative-data', campaignPath);

      expect(loaded.combatants).toHaveLength(3);
      expect(loaded.currentTurn).toBe(0);
      expect(loaded.round).toBe(1);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    beforeEach(async () => {
      await app.whenReady();
      main.createMainWindow();
    });

    test('should handle file system errors gracefully', async () => {
      mockFsPromises.writeFile.mockRejectedValueOnce(new Error('Disk full'));

      await expect(
        ipcMain._simulateInvoke('save-party-data', '/test/party.json', {})
      ).rejects.toThrow('Disk full');
    });

    test('should handle missing files when loading data', async () => {
      const error = new Error('File not found');
      error.code = 'ENOENT';
      mockFsPromises.readFile.mockRejectedValueOnce(error);

      const result = await ipcMain._simulateInvoke('load-party-data', '/test/missing.json');

      expect(result).toBeNull();
    });

    test('should handle invalid JSON when loading data', async () => {
      mockFsPromises.readFile.mockResolvedValueOnce('invalid json {{{');

      await expect(
        ipcMain._simulateInvoke('load-encounter-data', '/test/bad.json')
      ).rejects.toThrow();
    });

    test('should handle display window being destroyed', async () => {
      await ipcMain._simulateInvoke('open-display-window');
      const displayWindow = BrowserWindow.mock.results[1].value;

      // Destroy window
      displayWindow.isDestroyed.mockReturnValueOnce(true);

      // Try to display media
      const result = await ipcMain._simulateInvoke(
        'display-media',
        '/test/p.png',
        'image',
        'portrait',
        'P'
      );

      expect(result).toBe(false);
    });

    test('should handle empty directory scans', async () => {
      mockFsPromises.readdir.mockResolvedValueOnce([]);

      const result = await ipcMain._simulateInvoke('scan-directory', '/test/empty');

      expect(result.children).toHaveLength(0);
    });

    test('should handle nested directory scanning', async () => {
      const basePath = '/test/media';

      // Root directory
      mockFsPromises.readdir.mockResolvedValueOnce([
        createMockFileEntry('portraits', true),
        createMockFileEntry('backgrounds', true)
      ]);

      // Portraits subdirectory
      mockFsPromises.readdir.mockResolvedValueOnce([
        createMockFileEntry('hero.png', false)
      ]);

      // Backgrounds subdirectory
      mockFsPromises.readdir.mockResolvedValueOnce([
        createMockFileEntry('dungeon_location.png', false)
      ]);

      const result = await ipcMain._simulateInvoke('scan-directory', basePath);

      expect(result.children).toHaveLength(2);
      expect(result.children[0].type).toBe('folder');
      expect(result.children[0].children).toHaveLength(1);
    });
  });

  describe('Cross-Window Communication', () => {
    test('should sync display state across main and display windows', async () => {
      await app.whenReady();
      main.createMainWindow();

      const mainWindow = BrowserWindow.mock.results[0].value;

      await ipcMain._simulateInvoke('open-display-window');
      const displayWindow = BrowserWindow.mock.results[1].value;

      jest.clearAllMocks();

      // Add portrait
      await ipcMain._simulateInvoke('display-media', '/test/p.png', 'image', 'portrait', 'P');

      // Both windows should receive updates
      expect(displayWindow.webContents.send).toHaveBeenCalledWith(
        'update-display',
        expect.objectContaining({
          portraits: expect.any(Array)
        })
      );

      expect(mainWindow.webContents.send).toHaveBeenCalledWith(
        'display-state-updated',
        expect.objectContaining({
          portraits: expect.any(Array)
        })
      );
    });

    test('should maintain display state when main window navigates', async () => {
      await app.whenReady();
      main.createMainWindow();

      await ipcMain._simulateInvoke('open-display-window');

      // Add some display content
      await ipcMain._simulateInvoke('display-media', '/test/p.png', 'image', 'portrait', 'P');

      // Navigate main window to dashboard
      await ipcMain._simulateInvoke('load-dashboard');

      // Display state should persist
      const state = await ipcMain._simulateInvoke('get-display-state');
      expect(state.portraits).toHaveLength(1);
    });
  });
});
