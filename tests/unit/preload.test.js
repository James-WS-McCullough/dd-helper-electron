// Mock electron module at the top level
jest.mock('electron', () => require('../utils/electronMocks').createElectronMock());

describe('Preload Script', () => {
  let contextBridge, ipcRenderer;
  let exposedAPI;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();

    ({ contextBridge, ipcRenderer } = require('electron'));

    // Capture what gets exposed to the main world
    contextBridge.exposeInMainWorld.mockImplementation((name, api) => {
      if (name === 'electronAPI') {
        exposedAPI = api;
      }
    });

    // Load the preload script
    require('../../src/preload.js');
  });

  describe('Context Bridge Setup', () => {
    test('should expose electronAPI to main world', () => {
      expect(contextBridge.exposeInMainWorld).toHaveBeenCalledWith(
        'electronAPI',
        expect.any(Object)
      );
    });

    test('should expose all required API methods', () => {
      expect(exposedAPI).toHaveProperty('selectDirectory');
      expect(exposedAPI).toHaveProperty('getCachedDirectory');
      expect(exposedAPI).toHaveProperty('scanDirectory');
      expect(exposedAPI).toHaveProperty('openDisplayWindow');
      expect(exposedAPI).toHaveProperty('loadDashboard');
      expect(exposedAPI).toHaveProperty('displayMedia');
      expect(exposedAPI).toHaveProperty('clearDisplayElement');
      expect(exposedAPI).toHaveProperty('getDisplayState');
    });
  });

  describe('Directory Management API', () => {
    test('selectDirectory should invoke IPC and return result', async () => {
      const expectedPath = '/test/selected/directory';
      ipcRenderer.invoke.mockResolvedValueOnce(expectedPath);

      const result = await exposedAPI.selectDirectory();

      expect(ipcRenderer.invoke).toHaveBeenCalledWith('select-directory');
      expect(result).toBe(expectedPath);
    });

    test('getCachedDirectory should invoke IPC and return cached path', async () => {
      const cachedPath = '/test/cached/directory';
      ipcRenderer.invoke.mockResolvedValueOnce(cachedPath);

      const result = await exposedAPI.getCachedDirectory();

      expect(ipcRenderer.invoke).toHaveBeenCalledWith('get-cached-directory');
      expect(result).toBe(cachedPath);
    });

    test('scanDirectory should pass path to IPC handler', async () => {
      const testPath = '/test/media';
      const mockStructure = {
        name: 'media',
        children: []
      };
      ipcRenderer.invoke.mockResolvedValueOnce(mockStructure);

      const result = await exposedAPI.scanDirectory(testPath);

      expect(ipcRenderer.invoke).toHaveBeenCalledWith('scan-directory', testPath);
      expect(result).toEqual(mockStructure);
    });
  });

  describe('Window Management API', () => {
    test('openDisplayWindow should invoke IPC handler', async () => {
      ipcRenderer.invoke.mockResolvedValueOnce(true);

      const result = await exposedAPI.openDisplayWindow();

      expect(ipcRenderer.invoke).toHaveBeenCalledWith('open-display-window');
      expect(result).toBe(true);
    });

    test('loadDashboard should invoke IPC handler', async () => {
      ipcRenderer.invoke.mockResolvedValueOnce(true);

      const result = await exposedAPI.loadDashboard();

      expect(ipcRenderer.invoke).toHaveBeenCalledWith('load-dashboard');
      expect(result).toBe(true);
    });
  });

  describe('Display Media API', () => {
    test('displayMedia should pass all parameters to IPC', async () => {
      const path = '/test/media/hero.png';
      const type = 'image';
      const subtype = 'portrait';
      const displayName = 'Hero';

      ipcRenderer.invoke.mockResolvedValueOnce(true);

      const result = await exposedAPI.displayMedia(path, type, subtype, displayName);

      expect(ipcRenderer.invoke).toHaveBeenCalledWith(
        'display-media',
        path,
        type,
        subtype,
        displayName
      );
      expect(result).toBe(true);
    });

    test('clearDisplayElement should pass element type and path', async () => {
      const elementType = 'portraits';
      const elementPath = '/test/portrait.png';

      ipcRenderer.invoke.mockResolvedValueOnce(true);

      await exposedAPI.clearDisplayElement(elementType, elementPath);

      expect(ipcRenderer.invoke).toHaveBeenCalledWith(
        'clear-display-element',
        elementType,
        elementPath
      );
    });

    test('getDisplayState should retrieve current state', async () => {
      const mockState = {
        portraits: [],
        background: null,
        event: null
      };
      ipcRenderer.invoke.mockResolvedValueOnce(mockState);

      const result = await exposedAPI.getDisplayState();

      expect(ipcRenderer.invoke).toHaveBeenCalledWith('get-display-state');
      expect(result).toEqual(mockState);
    });
  });

  describe('Party Data API', () => {
    test('savePartyData should pass file path and data', async () => {
      const filePath = '/test/party.json';
      const partyData = { name: 'Party', members: [] };

      ipcRenderer.invoke.mockResolvedValueOnce(true);

      await exposedAPI.savePartyData(filePath, partyData);

      expect(ipcRenderer.invoke).toHaveBeenCalledWith(
        'save-party-data',
        filePath,
        partyData
      );
    });

    test('loadPartyData should retrieve party data', async () => {
      const filePath = '/test/party.json';
      const partyData = { name: 'Party', members: [] };

      ipcRenderer.invoke.mockResolvedValueOnce(partyData);

      const result = await exposedAPI.loadPartyData(filePath);

      expect(ipcRenderer.invoke).toHaveBeenCalledWith('load-party-data', filePath);
      expect(result).toEqual(partyData);
    });
  });

  describe('Encounter Data API', () => {
    test('saveEncounterData should pass file path and data', async () => {
      const filePath = '/test/encounter.json';
      const encounterData = { name: 'Battle', enemies: [] };

      ipcRenderer.invoke.mockResolvedValueOnce(true);

      await exposedAPI.saveEncounterData(filePath, encounterData);

      expect(ipcRenderer.invoke).toHaveBeenCalledWith(
        'save-encounter-data',
        filePath,
        encounterData
      );
    });

    test('loadEncounterData should retrieve encounter data', async () => {
      const filePath = '/test/encounter.json';
      const encounterData = { name: 'Battle', enemies: [] };

      ipcRenderer.invoke.mockResolvedValueOnce(encounterData);

      const result = await exposedAPI.loadEncounterData(filePath);

      expect(ipcRenderer.invoke).toHaveBeenCalledWith(
        'load-encounter-data',
        filePath
      );
      expect(result).toEqual(encounterData);
    });

    test('selectEncounterFile should open file dialog', async () => {
      const directoryPath = '/test/encounters';
      const selectedFile = '/test/encounters/battle.json';

      ipcRenderer.invoke.mockResolvedValueOnce(selectedFile);

      const result = await exposedAPI.selectEncounterFile(directoryPath);

      expect(ipcRenderer.invoke).toHaveBeenCalledWith(
        'select-encounter-file',
        directoryPath
      );
      expect(result).toBe(selectedFile);
    });

    test('getEncounterFiles should retrieve list of encounter files', async () => {
      const directoryPath = '/test/encounters';
      const files = [
        { filename: 'battle1_encounter.json', name: 'Battle 1' },
        { filename: 'battle2_encounter.json', name: 'Battle 2' }
      ];

      ipcRenderer.invoke.mockResolvedValueOnce(files);

      const result = await exposedAPI.getEncounterFiles(directoryPath);

      expect(ipcRenderer.invoke).toHaveBeenCalledWith(
        'get-encounter-files',
        directoryPath
      );
      expect(result).toEqual(files);
    });
  });

  describe('Initiative Tracking API', () => {
    test('saveInitiativeData should save to directory', async () => {
      const directoryPath = '/test/campaign';
      const initiativeData = { combatants: [], currentTurn: 0 };

      ipcRenderer.invoke.mockResolvedValueOnce({ success: true });

      await exposedAPI.saveInitiativeData(directoryPath, initiativeData);

      expect(ipcRenderer.invoke).toHaveBeenCalledWith(
        'save-initiative-data',
        directoryPath,
        initiativeData
      );
    });

    test('loadInitiativeData should load from directory', async () => {
      const directoryPath = '/test/campaign';
      const initiativeData = { combatants: [], currentTurn: 0 };

      ipcRenderer.invoke.mockResolvedValueOnce(initiativeData);

      const result = await exposedAPI.loadInitiativeData(directoryPath);

      expect(ipcRenderer.invoke).toHaveBeenCalledWith(
        'load-initiative-data',
        directoryPath
      );
      expect(result).toEqual(initiativeData);
    });
  });

  describe('Battlemap API', () => {
    test('saveBattlemapData should pass all parameters', async () => {
      const directoryPath = '/test/maps';
      const battlemapData = { gridWidth: 10, gridHeight: 10 };
      const fileName = 'dungeon_battlemap.json';

      ipcRenderer.invoke.mockResolvedValueOnce({ success: true });

      await exposedAPI.saveBattlemapData(directoryPath, battlemapData, fileName);

      expect(ipcRenderer.invoke).toHaveBeenCalledWith(
        'save-battlemap-data',
        directoryPath,
        battlemapData,
        fileName
      );
    });

    test('loadBattlemapData should load from path', async () => {
      const directoryPath = '/test/maps';
      const battlemapData = { gridWidth: 10, gridHeight: 10 };

      ipcRenderer.invoke.mockResolvedValueOnce(battlemapData);

      const result = await exposedAPI.loadBattlemapData(directoryPath);

      expect(ipcRenderer.invoke).toHaveBeenCalledWith(
        'load-battlemap-data',
        directoryPath
      );
      expect(result).toEqual(battlemapData);
    });

    test('getBattlemapFiles should retrieve list of battlemap files', async () => {
      const directoryPath = '/test/maps';
      const files = [
        { filename: 'dungeon_battlemap.json', gridWidth: 10, gridHeight: 10 }
      ];

      ipcRenderer.invoke.mockResolvedValueOnce(files);

      const result = await exposedAPI.getBattlemapFiles(directoryPath);

      expect(ipcRenderer.invoke).toHaveBeenCalledWith(
        'get-battlemap-files',
        directoryPath
      );
      expect(result).toEqual(files);
    });

    test('displayBattlemap should send battlemap to display window', async () => {
      const battlemapData = { gridWidth: 10, gridHeight: 10 };

      ipcRenderer.invoke.mockResolvedValueOnce({ success: true });

      await exposedAPI.displayBattlemap(battlemapData);

      expect(ipcRenderer.invoke).toHaveBeenCalledWith(
        'display-battlemap',
        battlemapData
      );
    });

    test('hideBattlemap should hide battlemap from display', async () => {
      ipcRenderer.invoke.mockResolvedValueOnce({ success: true });

      await exposedAPI.hideBattlemap();

      expect(ipcRenderer.invoke).toHaveBeenCalledWith('hide-battlemap');
    });
  });

  describe('Event Listeners API', () => {
    test('onUpdateDisplay should register listener', () => {
      const callback = jest.fn();

      exposedAPI.onUpdateDisplay(callback);

      expect(ipcRenderer.on).toHaveBeenCalledWith('update-display', callback);
    });

    test('onDisplayStateUpdated should register listener', () => {
      const callback = jest.fn();

      exposedAPI.onDisplayStateUpdated(callback);

      expect(ipcRenderer.on).toHaveBeenCalledWith('display-state-updated', callback);
    });

    test('onDisplayBattlemap should register listener', () => {
      const callback = jest.fn();

      exposedAPI.onDisplayBattlemap(callback);

      expect(ipcRenderer.on).toHaveBeenCalledWith('display-battlemap', callback);
    });

    test('onHideBattlemap should register listener', () => {
      const callback = jest.fn();

      exposedAPI.onHideBattlemap(callback);

      expect(ipcRenderer.on).toHaveBeenCalledWith('hide-battlemap', callback);
    });

    test('removeDisplayListeners should remove all display-related listeners', () => {
      exposedAPI.removeDisplayListeners();

      expect(ipcRenderer.removeAllListeners).toHaveBeenCalledWith('update-display');
      expect(ipcRenderer.removeAllListeners).toHaveBeenCalledWith('display-state-updated');
      expect(ipcRenderer.removeAllListeners).toHaveBeenCalledWith('display-battlemap');
      expect(ipcRenderer.removeAllListeners).toHaveBeenCalledWith('hide-battlemap');
    });
  });

  describe('API Security', () => {
    test('should not expose raw ipcRenderer to renderer', () => {
      expect(exposedAPI.ipcRenderer).toBeUndefined();
      expect(exposedAPI.require).toBeUndefined();
      expect(exposedAPI.process).toBeUndefined();
    });

    test('should only expose whitelisted methods', () => {
      const allowedKeys = [
        'selectDirectory',
        'getCachedDirectory',
        'scanDirectory',
        'openDisplayWindow',
        'loadDashboard',
        'displayMedia',
        'clearDisplayElement',
        'getDisplayState',
        'savePartyData',
        'loadPartyData',
        'saveEncounterData',
        'loadEncounterData',
        'selectEncounterFile',
        'getEncounterFiles',
        'saveInitiativeData',
        'loadInitiativeData',
        'saveBattlemapData',
        'loadBattlemapData',
        'getBattlemapFiles',
        'displayBattlemap',
        'hideBattlemap',
        'onUpdateDisplay',
        'onDisplayStateUpdated',
        'onDisplayBattlemap',
        'onHideBattlemap',
        'removeDisplayListeners'
      ];

      const exposedKeys = Object.keys(exposedAPI);

      // Check that all exposed keys are in the allowed list
      exposedKeys.forEach(key => {
        expect(allowedKeys).toContain(key);
      });

      // Check that all allowed keys are exposed
      allowedKeys.forEach(key => {
        expect(exposedAPI).toHaveProperty(key);
      });
    });

    test('all API methods should be functions', () => {
      Object.values(exposedAPI).forEach(method => {
        expect(typeof method).toBe('function');
      });
    });
  });
});
