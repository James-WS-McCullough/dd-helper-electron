/**
 * End-to-End Workflow Tests
 *
 * These tests verify complete user workflows from start to finish,
 * simulating real-world usage scenarios of the D&D Helper application.
 */

const { createElectronMock } = require('../utils/electronMocks');
const {
  createMockFsPromises,
  createMockDialogResult,
  createMockFileEntry,
  createMockEncounter,
  createMockBattlemapData,
  createMockPartyMember
} = require('../utils/mockFactories');

// Mock modules at the top level
jest.mock('electron', () => require('../utils/electronMocks').createElectronMock());
jest.mock('fs', () => ({
  promises: require('../utils/mockFactories').createMockFsPromises()
}));

describe('E2E: Complete Session Workflows', () => {
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

  describe('Workflow: First Time Campaign Setup', () => {
    test('should complete full first-time setup workflow', async () => {
      // ARRANGE: Start application
      await app.whenReady();
      main.createMainWindow();

      const campaignPath = '/test/campaigns/dragon-heist';

      // ACT: Step 1 - Select campaign directory
      dialog.showOpenDialog.mockResolvedValueOnce(
        createMockDialogResult(false, [campaignPath])
      );

      const selectedPath = await ipcMain._simulateInvoke('select-directory');

      // ASSERT: Directory selected and cached
      expect(selectedPath).toBe(campaignPath);
      expect(mockFsPromises.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('settings.json'),
        expect.stringContaining(campaignPath)
      );

      // ACT: Step 2 - Scan campaign directory
      mockFsPromises.readdir.mockResolvedValueOnce([
        createMockFileEntry('portraits', true),
        createMockFileEntry('backgrounds', true),
        createMockFileEntry('music', true)
      ]);

      mockFsPromises.readdir.mockResolvedValueOnce([
        createMockFileEntry('hero1.png', false),
        createMockFileEntry('hero2.png', false)
      ]);

      mockFsPromises.readdir.mockResolvedValueOnce([
        createMockFileEntry('tavern_location.jpg', false)
      ]);

      mockFsPromises.readdir.mockResolvedValueOnce([
        createMockFileEntry('tavern_music.mp3', false)
      ]);

      const scannedDir = await ipcMain._simulateInvoke('scan-directory', campaignPath);

      // ASSERT: Directory structure scanned correctly
      expect(scannedDir.children).toHaveLength(3);
      expect(scannedDir.children.find(c => c.name === 'portraits')).toBeDefined();

      // ACT: Step 3 - Open display window
      await ipcMain._simulateInvoke('open-display-window');

      // ASSERT: Both windows created
      expect(BrowserWindow).toHaveBeenCalledTimes(2);

      // ACT: Step 4 - Navigate to dashboard
      await ipcMain._simulateInvoke('load-dashboard');
      const mainWindow = BrowserWindow.mock.results[0].value;

      // ASSERT: Dashboard loaded
      expect(mainWindow.loadFile).toHaveBeenCalledWith(
        'src/renderer/dashboard.html'
      );

      // ACT: Step 5 - Create and save party
      const partyData = {
        name: 'The Dragon Slayers',
        members: [
          createMockPartyMember({ name: 'Thorin', class: 'Fighter' }),
          createMockPartyMember({ name: 'Elara', class: 'Wizard' })
        ]
      };

      await ipcMain._simulateInvoke(
        'save-party-data',
        `${campaignPath}/party.json`,
        partyData
      );

      // ASSERT: Party saved
      expect(mockFsPromises.writeFile).toHaveBeenCalledWith(
        `${campaignPath}/party.json`,
        expect.stringContaining('Dragon Slayers')
      );

      // SUCCESS: First-time setup complete
    });
  });

  describe('Workflow: Running a Combat Encounter', () => {
    test('should complete full combat encounter workflow', async () => {
      // ARRANGE: Setup application with existing campaign
      await app.whenReady();
      main.createMainWindow();

      const campaignPath = '/test/campaigns/adventure';

      // Mock cached directory
      mockFsPromises.readFile.mockResolvedValueOnce(
        JSON.stringify({ lastDirectory: campaignPath })
      );
      mockFsPromises.stat.mockResolvedValueOnce({
        isDirectory: () => true
      });

      await ipcMain._simulateInvoke('open-display-window');
      const displayWindow = BrowserWindow.mock.results[1].value;

      // ACT: Step 1 - Create encounter
      const encounter = createMockEncounter({
        name: 'Goblin Ambush',
        enemies: [
          { name: 'Goblin Chief', hp: 20, maxHp: 20, ac: 16, initiative: 15 },
          { name: 'Goblin 1', hp: 7, maxHp: 7, ac: 15, initiative: 12 },
          { name: 'Goblin 2', hp: 7, maxHp: 7, ac: 15, initiative: 10 }
        ]
      });

      await ipcMain._simulateInvoke(
        'save-encounter-data',
        `${campaignPath}/goblin_encounter.json`,
        encounter
      );

      // ASSERT: Encounter saved
      expect(mockFsPromises.writeFile).toHaveBeenCalled();

      // ACT: Step 2 - Set up battlemap
      const battlemap = createMockBattlemapData({
        gridWidth: 15,
        gridHeight: 15,
        backgroundImage: `${campaignPath}/forest_battlemap.png`,
        tokens: {
          '7-7': { name: 'Hero', portrait: `${campaignPath}/hero.png`, hidden: false },
          '10-5': { name: 'Goblin Chief', portrait: null, hidden: false },
          '11-5': { name: 'Goblin 1', portrait: null, hidden: false },
          '9-5': { name: 'Goblin 2', portrait: null, hidden: false }
        }
      });

      await ipcMain._simulateInvoke(
        'save-battlemap-data',
        campaignPath,
        battlemap,
        'forest_battle_battlemap.json'
      );

      // ASSERT: Battlemap saved
      expect(mockFsPromises.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('forest_battle_battlemap.json'),
        expect.any(String)
      );

      // ACT: Step 3 - Display battlemap
      jest.clearAllMocks();
      await ipcMain._simulateInvoke('display-battlemap', battlemap);

      // ASSERT: Battlemap displayed
      expect(displayWindow.webContents.send).toHaveBeenCalledWith(
        'display-battlemap',
        battlemap
      );

      // ACT: Step 4 - Set up initiative
      const initiativeData = {
        combatants: [
          { name: 'Goblin Chief', initiative: 15, hp: 20, maxHp: 20 },
          { name: 'Hero', initiative: 14, hp: 45, maxHp: 45 },
          { name: 'Goblin 1', initiative: 12, hp: 7, maxHp: 7 },
          { name: 'Goblin 2', initiative: 10, hp: 7, maxHp: 7 }
        ],
        currentTurn: 0,
        round: 1
      };

      await ipcMain._simulateInvoke(
        'save-initiative-data',
        campaignPath,
        initiativeData
      );

      // ASSERT: Initiative saved
      expect(mockFsPromises.writeFile).toHaveBeenCalledWith(
        `${campaignPath}/initiative.json`,
        expect.any(String)
      );

      // ACT: Step 5 - Display character portraits during combat
      jest.clearAllMocks();
      await ipcMain._simulateInvoke(
        'display-media',
        `${campaignPath}/hero.png`,
        'image',
        'portrait',
        'Hero'
      );

      // Note: In real app, battlemap would prevent portrait display,
      // but we're testing the state management

      // ACT: Step 6 - End combat, hide battlemap
      jest.clearAllMocks();
      await ipcMain._simulateInvoke('hide-battlemap');

      // ASSERT: Battlemap hidden
      expect(displayWindow.webContents.send).toHaveBeenCalledWith('hide-battlemap');

      // SUCCESS: Combat encounter complete
    });
  });

  describe('Workflow: Narrative Scene with Media', () => {
    test('should complete narrative scene with background and music', async () => {
      // ARRANGE
      await app.whenReady();
      main.createMainWindow();

      const campaignPath = '/test/campaigns/story';
      await ipcMain._simulateInvoke('open-display-window');
      const displayWindow = BrowserWindow.mock.results[1].value;

      // ACT: Step 1 - Set scene background
      jest.clearAllMocks();
      await ipcMain._simulateInvoke(
        'display-media',
        `${campaignPath}/tavern_location.jpg`,
        'image',
        'background',
        'The Prancing Pony'
      );

      // ASSERT: Background displayed
      expect(displayWindow.webContents.send).toHaveBeenCalledWith(
        'update-display',
        expect.objectContaining({
          background: expect.objectContaining({
            path: `${campaignPath}/tavern_location.jpg`
          })
        })
      );

      // ACT: Step 2 - Add character portraits
      jest.clearAllMocks();
      const characters = [
        { path: `${campaignPath}/innkeeper.png`, name: 'Innkeeper' },
        { path: `${campaignPath}/mysterious_stranger.png`, name: 'Mysterious Stranger' }
      ];

      for (const char of characters) {
        await ipcMain._simulateInvoke(
          'display-media',
          char.path,
          'image',
          'portrait',
          char.name
        );
      }

      // ASSERT: All portraits added
      const state1 = await ipcMain._simulateInvoke('get-display-state');
      expect(state1.portraits).toHaveLength(2);

      // ACT: Step 3 - Add ambient music
      jest.clearAllMocks();
      await ipcMain._simulateInvoke(
        'display-media',
        `${campaignPath}/tavern_music.mp3`,
        'audio',
        'music',
        'Tavern Ambience'
      );

      // ASSERT: Music added to state
      const state2 = await ipcMain._simulateInvoke('get-display-state');
      expect(state2.backgroundMusic).toBeDefined();
      expect(state2.backgroundMusic.path).toContain('tavern_music.mp3');

      // ACT: Step 4 - Play dramatic event video
      jest.clearAllMocks();
      await ipcMain._simulateInvoke(
        'display-media',
        `${campaignPath}/dragon_arrival.mp4`,
        'video',
        'event',
        'Dragon Arrives'
      );

      // ASSERT: Event video displayed
      const state3 = await ipcMain._simulateInvoke('get-display-state');
      expect(state3.event).toBeDefined();
      expect(state3.event.path).toContain('dragon_arrival.mp4');

      // ACT: Step 5 - Clear scene after event
      jest.clearAllMocks();
      await ipcMain._simulateInvoke('clear-display-element', 'all');

      // ASSERT: All cleared
      const state4 = await ipcMain._simulateInvoke('get-display-state');
      expect(state4.portraits).toHaveLength(0);
      expect(state4.background).toBeNull();
      expect(state4.event).toBeNull();
      expect(state4.backgroundMusic).toBeNull();

      // SUCCESS: Narrative scene complete
    });
  });

  describe('Workflow: Session Persistence and Recovery', () => {
    test('should save and restore complete session state', async () => {
      // ARRANGE: First session
      await app.whenReady();
      main.createMainWindow();

      const campaignPath = '/test/campaigns/persistent';

      // Select directory
      dialog.showOpenDialog.mockResolvedValueOnce(
        createMockDialogResult(false, [campaignPath])
      );
      await ipcMain._simulateInvoke('select-directory');

      // Open display window
      await ipcMain._simulateInvoke('open-display-window');

      // ACT: Save party data
      const partyData = {
        name: 'The Fellowship',
        members: [
          createMockPartyMember({ name: 'Frodo', class: 'Rogue', level: 3 }),
          createMockPartyMember({ name: 'Gandalf', class: 'Wizard', level: 20 })
        ]
      };

      await ipcMain._simulateInvoke(
        'save-party-data',
        `${campaignPath}/party.json`,
        partyData
      );

      // ACT: Save initiative data
      const initiativeData = {
        combatants: [
          { name: 'Frodo', initiative: 18, hp: 25, maxHp: 25 },
          { name: 'Orc', initiative: 10, hp: 15, maxHp: 15 }
        ],
        currentTurn: 0,
        round: 2
      };

      await ipcMain._simulateInvoke(
        'save-initiative-data',
        campaignPath,
        initiativeData
      );

      // ACT: Save battlemap data
      const battlemapData = createMockBattlemapData({
        gridWidth: 20,
        gridHeight: 20,
        tokens: {
          '10-10': { name: 'Frodo', portrait: `${campaignPath}/frodo.png` },
          '15-15': { name: 'Orc', portrait: null }
        }
      });

      await ipcMain._simulateInvoke(
        'save-battlemap-data',
        campaignPath,
        battlemapData,
        'current_battlemap.json'
      );

      // ASSERT: All data saved
      expect(mockFsPromises.writeFile).toHaveBeenCalledTimes(4); // settings, party, initiative, battlemap

      // ARRANGE: Simulate app restart
      jest.resetModules();
      jest.clearAllMocks();

      // Get fresh references
      const { app: app2, ipcMain: ipcMain2 } = require('electron');
      const mockFsPromises2 = require('fs').promises;

      // Mock cached directory
      mockFsPromises2.readFile.mockImplementation((path) => {
        if (path.includes('settings.json')) {
          return Promise.resolve(JSON.stringify({ lastDirectory: campaignPath }));
        } else if (path.includes('party.json')) {
          return Promise.resolve(JSON.stringify(partyData));
        } else if (path.includes('initiative.json')) {
          return Promise.resolve(JSON.stringify(initiativeData));
        } else if (path.includes('battlemap.json')) {
          return Promise.resolve(JSON.stringify(battlemapData));
        }
        return Promise.resolve('{}');
      });

      mockFsPromises2.stat.mockResolvedValue({
        isDirectory: () => true,
        mtime: new Date()
      });

      // ACT: Start app again
      const main2 = require('../../src/main.js');
      main2.registerIpcHandlers();
      await app2.whenReady();
      await main2.loadCachedDirectory();

      // ACT: Load cached directory
      const cachedDir = await ipcMain2._simulateInvoke('get-cached-directory');

      // ASSERT: Directory restored
      expect(cachedDir).toBe(campaignPath);

      // ACT: Load party data
      const loadedParty = await ipcMain2._simulateInvoke(
        'load-party-data',
        `${campaignPath}/party.json`
      );

      // ASSERT: Party data restored
      expect(loadedParty.name).toBe('The Fellowship');
      expect(loadedParty.members).toHaveLength(2);

      // ACT: Load initiative data
      const loadedInitiative = await ipcMain2._simulateInvoke(
        'load-initiative-data',
        campaignPath
      );

      // ASSERT: Initiative restored
      expect(loadedInitiative.round).toBe(2);
      expect(loadedInitiative.combatants).toHaveLength(2);

      // ACT: Load battlemap data
      mockFsPromises2.access.mockResolvedValueOnce(); // Legacy check
      const loadedBattlemap = await ipcMain2._simulateInvoke(
        'load-battlemap-data',
        campaignPath
      );

      // ASSERT: Battlemap restored
      expect(loadedBattlemap.gridWidth).toBe(20);
      expect(Object.keys(loadedBattlemap.tokens)).toHaveLength(2);

      // SUCCESS: Session fully restored
    });
  });

  describe('Workflow: Multi-File Management', () => {
    test('should manage multiple encounters and battlemaps', async () => {
      // ARRANGE
      await app.whenReady();
      main.createMainWindow();

      const campaignPath = '/test/campaigns/multi';

      // ACT: Create multiple encounters
      const encounters = [
        createMockEncounter({ name: 'Forest Bandits' }),
        createMockEncounter({ name: 'Dragon Lair' }),
        createMockEncounter({ name: 'Undead Crypt' })
      ];

      for (let i = 0; i < encounters.length; i++) {
        const filename = encounters[i].name.toLowerCase().replace(/\s+/g, '_');
        await ipcMain._simulateInvoke(
          'save-encounter-data',
          `${campaignPath}/${filename}_encounter.json`,
          encounters[i]
        );
      }

      // ACT: List encounter files
      mockFsPromises.readdir.mockResolvedValueOnce([
        createMockFileEntry('forest_bandits_encounter.json', false),
        createMockFileEntry('dragon_lair_encounter.json', false),
        createMockFileEntry('undead_crypt_encounter.json', false)
      ]);

      mockFsPromises.readFile.mockImplementation((path) => {
        const encounter = encounters.find(e =>
          path.includes(e.name.toLowerCase().replace(/\s+/g, '_'))
        );
        return Promise.resolve(JSON.stringify(encounter || {}));
      });

      mockFsPromises.stat.mockResolvedValue({
        mtime: new Date()
      });

      const encounterFiles = await ipcMain._simulateInvoke(
        'get-encounter-files',
        campaignPath
      );

      // ASSERT: All encounters listed
      expect(encounterFiles).toHaveLength(3);

      // ACT: Create multiple battlemaps
      const battlemaps = [
        createMockBattlemapData({ gridWidth: 15, gridHeight: 15 }),
        createMockBattlemapData({ gridWidth: 20, gridHeight: 20 }),
        createMockBattlemapData({ gridWidth: 10, gridHeight: 10 })
      ];

      const mapNames = ['forest', 'dragon_lair', 'crypt'];
      for (let i = 0; i < battlemaps.length; i++) {
        await ipcMain._simulateInvoke(
          'save-battlemap-data',
          campaignPath,
          battlemaps[i],
          `${mapNames[i]}_battlemap.json`
        );
      }

      // ACT: List battlemap files
      mockFsPromises.readdir.mockResolvedValueOnce([
        createMockFileEntry('forest_battlemap.json', false),
        createMockFileEntry('dragon_lair_battlemap.json', false),
        createMockFileEntry('crypt_battlemap.json', false)
      ]);

      mockFsPromises.readFile.mockImplementation((path) => {
        const map = battlemaps.find((_, i) =>
          path.includes(mapNames[i])
        );
        return Promise.resolve(JSON.stringify(map || {}));
      });

      const battlemapFiles = await ipcMain._simulateInvoke(
        'get-battlemap-files',
        campaignPath
      );

      // ASSERT: All battlemaps listed
      expect(battlemapFiles).toHaveLength(3);

      // SUCCESS: Multiple files managed successfully
    });
  });

  describe('Workflow: Error Recovery', () => {
    test('should handle and recover from various errors', async () => {
      // ARRANGE
      await app.whenReady();
      main.createMainWindow();

      const campaignPath = '/test/campaigns/errors';

      // ACT & ASSERT: Handle disk full error
      mockFsPromises.writeFile.mockRejectedValueOnce(new Error('ENOSPC: Disk full'));

      await expect(
        ipcMain._simulateInvoke('save-party-data', `${campaignPath}/party.json`, {})
      ).rejects.toThrow('Disk full');

      // ACT & ASSERT: Handle corrupted file
      mockFsPromises.readFile.mockResolvedValueOnce('{ invalid json ]][');

      await expect(
        ipcMain._simulateInvoke('load-encounter-data', `${campaignPath}/bad.json`)
      ).rejects.toThrow();

      // ACT & ASSERT: Handle missing file gracefully
      const error = new Error('File not found');
      error.code = 'ENOENT';
      mockFsPromises.readFile.mockRejectedValueOnce(error);

      const result = await ipcMain._simulateInvoke(
        'load-party-data',
        `${campaignPath}/missing.json`
      );

      expect(result).toBeNull(); // Should return null, not throw

      // ACT & ASSERT: Handle permission denied
      mockFsPromises.readdir.mockRejectedValueOnce(new Error('EACCES: Permission denied'));

      await expect(
        ipcMain._simulateInvoke('scan-directory', '/restricted/path')
      ).rejects.toThrow('Permission denied');

      // SUCCESS: Errors handled appropriately
    });
  });
});
