// Mock factories for creating test data and mocks

/**
 * Creates a mock BrowserWindow instance
 */
function createMockBrowserWindow(overrides = {}) {
  return {
    loadFile: jest.fn(() => Promise.resolve()),
    webContents: {
      openDevTools: jest.fn(),
      send: jest.fn(),
      on: jest.fn()
    },
    isDestroyed: jest.fn(() => false),
    focus: jest.fn(),
    on: jest.fn(),
    ...overrides
  };
}

/**
 * Creates a mock IPC event object
 */
function createMockIpcEvent(overrides = {}) {
  return {
    sender: {
      send: jest.fn()
    },
    reply: jest.fn(),
    ...overrides
  };
}

/**
 * Creates a mock file system entry
 */
function createMockFileEntry(name, isDirectory = false, overrides = {}) {
  return {
    name,
    isDirectory: jest.fn(() => isDirectory),
    isFile: jest.fn(() => !isDirectory),
    ...overrides
  };
}

/**
 * Creates a mock media item
 */
function createMockMediaItem(type = 'image', subtype = 'portrait', overrides = {}) {
  const basePath = `/test/media/${type}`;
  const extension = type === 'image' ? '.png' : type === 'video' ? '.mp4' : '.mp3';

  return {
    name: `test-${type}${extension}`,
    path: `${basePath}/test-${type}${extension}`,
    type: 'file',
    mediaType: type,
    mediaSubtype: subtype,
    displayName: `Test ${type}`,
    ...overrides
  };
}

/**
 * Creates a mock directory structure
 */
function createMockDirectoryStructure(overrides = {}) {
  return {
    name: 'test-directory',
    path: '/test/directory',
    type: 'folder',
    children: [
      createMockMediaItem('image', 'portrait', { name: 'character.png' }),
      createMockMediaItem('image', 'background', { name: 'dungeon_location.png' }),
      createMockMediaItem('video', 'event', { name: 'dragon-attack.mp4' }),
      createMockMediaItem('audio', 'music', { name: 'battle_music.mp3' })
    ],
    ...overrides
  };
}

/**
 * Creates a mock display state
 */
function createMockDisplayState(overrides = {}) {
  return {
    portraits: [],
    background: null,
    event: null,
    backgroundSounds: [],
    backgroundMusic: null,
    soundEffects: [],
    ...overrides
  };
}

/**
 * Creates a mock party member
 */
function createMockPartyMember(overrides = {}) {
  return {
    name: 'Test Character',
    class: 'Fighter',
    level: 5,
    hp: 45,
    maxHp: 45,
    ac: 16,
    portraitPath: '/test/portraits/character.png',
    ...overrides
  };
}

/**
 * Creates a mock enemy
 */
function createMockEnemy(overrides = {}) {
  return {
    name: 'Goblin',
    hp: 7,
    maxHp: 7,
    ac: 15,
    initiative: 12,
    ...overrides
  };
}

/**
 * Creates a mock encounter data
 */
function createMockEncounter(overrides = {}) {
  return {
    name: 'Goblin Ambush',
    enemies: [
      createMockEnemy({ name: 'Goblin 1' }),
      createMockEnemy({ name: 'Goblin 2' })
    ],
    description: 'A group of goblins ambush the party',
    ...overrides
  };
}

/**
 * Creates a mock battlemap token
 */
function createMockBattlemapToken(overrides = {}) {
  return {
    name: 'Token',
    portrait: '/test/portraits/token.png',
    hidden: false,
    ...overrides
  };
}

/**
 * Creates a mock battlemap data
 */
function createMockBattlemapData(overrides = {}) {
  return {
    gridWidth: 10,
    gridHeight: 10,
    backgroundImage: '/test/maps/dungeon.png',
    tokens: {},
    zoom: {
      scale: 1.0,
      centerX: 0.5,
      centerY: 0.5
    },
    ...overrides
  };
}

/**
 * Creates a mock fs.promises module
 */
function createMockFsPromises() {
  return {
    readFile: jest.fn((path) => Promise.resolve('{}')),
    writeFile: jest.fn(() => Promise.resolve()),
    readdir: jest.fn(() => Promise.resolve([])),
    stat: jest.fn(() => Promise.resolve({
      isDirectory: () => false,
      isFile: () => true,
      mtime: new Date()
    })),
    access: jest.fn(() => Promise.resolve())
  };
}

/**
 * Creates a mock dialog result
 */
function createMockDialogResult(canceled = false, filePaths = []) {
  return {
    canceled,
    filePaths
  };
}

module.exports = {
  createMockBrowserWindow,
  createMockIpcEvent,
  createMockFileEntry,
  createMockMediaItem,
  createMockDirectoryStructure,
  createMockDisplayState,
  createMockPartyMember,
  createMockEnemy,
  createMockEncounter,
  createMockBattlemapToken,
  createMockBattlemapData,
  createMockFsPromises,
  createMockDialogResult
};
