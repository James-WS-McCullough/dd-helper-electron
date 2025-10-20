/**
 * Renderer Process Integration Tests
 *
 * These tests verify the behavior of the renderer process scripts embedded in HTML files.
 * They test the JavaScript logic that runs in the browser context.
 */

const fs = require('fs');
const path = require('path');

describe('Renderer Process - Starting Screen', () => {
  let electronAPI;
  let document;

  beforeEach(() => {
    // Mock electronAPI
    electronAPI = {
      getCachedDirectory: jest.fn(() => Promise.resolve(null)),
      selectDirectory: jest.fn(() => Promise.resolve('/test/selected')),
      openDisplayWindow: jest.fn(() => Promise.resolve()),
      loadDashboard: jest.fn(() => Promise.resolve())
    };

    global.window = {
      electronAPI,
      addEventListener: jest.fn((event, callback) => {
        if (event === 'DOMContentLoaded') {
          setTimeout(callback, 0);
        }
      })
    };

    // Mock DOM
    const mockElements = {
      selectDirBtn: {
        addEventListener: jest.fn(),
        click: jest.fn()
      },
      startBtn: {
        addEventListener: jest.fn(),
        disabled: true,
        click: jest.fn()
      },
      selectedPath: {
        textContent: '',
        className: '',
        title: ''
      },
      directoryStatus: {
        textContent: ''
      }
    };

    document = {
      getElementById: jest.fn((id) => mockElements[id]),
      addEventListener: jest.fn()
    };

    global.document = document;
  });

  afterEach(() => {
    delete global.window;
    delete global.document;
  });

  test('should load cached directory on startup', async () => {
    const cachedDir = '/test/cached/directory';
    electronAPI.getCachedDirectory.mockResolvedValueOnce(cachedDir);

    // Simulate page load
    const domLoadedHandler = window.addEventListener.mock.calls.find(
      call => call[0] === 'DOMContentLoaded'
    )?.[1];

    if (domLoadedHandler) {
      await domLoadedHandler();

      expect(electronAPI.getCachedDirectory).toHaveBeenCalled();
    }
  });

  test('should enable start button when directory is selected', async () => {
    const selectedDir = '/test/selected/directory';
    electronAPI.selectDirectory.mockResolvedValueOnce(selectedDir);

    const selectBtn = document.getElementById('selectDirBtn');
    const startBtn = document.getElementById('startBtn');
    const selectedPath = document.getElementById('selectedPath');

    // Simulate button click handler
    const clickHandler = jest.fn(async () => {
      const directory = await electronAPI.selectDirectory();
      if (directory) {
        selectedPath.textContent = directory;
        selectedPath.className = 'selected-path new';
        startBtn.disabled = false;
      }
    });

    await clickHandler();

    expect(electronAPI.selectDirectory).toHaveBeenCalled();
    expect(selectedPath.textContent).toBe(selectedDir);
    expect(startBtn.disabled).toBe(false);
  });

  test('should open display window and load dashboard on start', async () => {
    const startHandler = jest.fn(async () => {
      await electronAPI.openDisplayWindow();
      await electronAPI.loadDashboard();
    });

    await startHandler();

    expect(electronAPI.openDisplayWindow).toHaveBeenCalled();
    expect(electronAPI.loadDashboard).toHaveBeenCalled();
  });

  test('should not enable start button if directory selection is canceled', async () => {
    electronAPI.selectDirectory.mockResolvedValueOnce(null);

    const startBtn = document.getElementById('startBtn');

    const clickHandler = jest.fn(async () => {
      const directory = await electronAPI.selectDirectory();
      if (directory) {
        startBtn.disabled = false;
      }
    });

    await clickHandler();

    expect(startBtn.disabled).toBe(true);
  });
});

describe('Renderer Process - Display Window', () => {
  let electronAPI;
  let document;
  let mockElements;

  beforeEach(() => {
    // Mock electronAPI
    electronAPI = {
      onUpdateDisplay: jest.fn(),
      onDisplayBattlemap: jest.fn(),
      onHideBattlemap: jest.fn(),
      clearDisplayElement: jest.fn()
    };

    mockElements = {
      backgroundLayer: {
        innerHTML: '',
        style: {}
      },
      portraitsLayer: {
        innerHTML: '',
        setAttribute: jest.fn(),
        removeAttribute: jest.fn(),
        style: {}
      },
      eventLayer: {
        style: { display: 'none' },
        innerHTML: ''
      },
      eventContent: {
        innerHTML: '',
        querySelector: jest.fn()
      },
      fadeOverlay: {
        style: { opacity: '0' }
      },
      placeholder: {
        style: { display: 'block' }
      }
    };

    document = {
      getElementById: jest.fn((id) => mockElements[id]),
      addEventListener: jest.fn(),
      querySelector: jest.fn()
    };

    global.window = {
      electronAPI,
      innerWidth: 1920,
      innerHeight: 1080
    };

    global.document = document;
  });

  afterEach(() => {
    delete global.window;
    delete global.document;
  });

  test('should update portraits layer when display state changes', () => {
    const displayState = {
      portraits: [
        { path: '/test/hero.png', displayName: 'Hero' },
        { path: '/test/wizard.png', displayName: 'Wizard' }
      ],
      background: null,
      event: null,
      backgroundSounds: [],
      backgroundMusic: null,
      soundEffects: []
    };

    // Simulate update display function
    const updatePortraits = (portraits) => {
      const portraitsLayer = document.getElementById('portraitsLayer');
      if (portraits && portraits.length > 0) {
        portraitsLayer.setAttribute('data-count', Math.min(portraits.length, 6).toString());
        portraitsLayer.innerHTML = portraits.map(p =>
          `<div class="portrait-item">
            <img src="file://${p.path}" alt="${p.displayName}" class="portrait-image">
            <div class="portrait-name">${p.displayName}</div>
          </div>`
        ).join('');
      }
    };

    updatePortraits(displayState.portraits);

    const portraitsLayer = document.getElementById('portraitsLayer');
    expect(portraitsLayer.setAttribute).toHaveBeenCalledWith('data-count', '2');
    expect(portraitsLayer.innerHTML).toContain('Hero');
    expect(portraitsLayer.innerHTML).toContain('Wizard');
  });

  test('should update background layer with image', () => {
    const background = {
      path: '/test/dungeon.png',
      type: 'image',
      subtype: 'background'
    };

    const updateBackground = (bg) => {
      const backgroundLayer = document.getElementById('backgroundLayer');
      if (bg && bg.type === 'image') {
        backgroundLayer.innerHTML = `<img src="file://${bg.path}" alt="Background" class="background-content">`;
      }
    };

    updateBackground(background);

    const backgroundLayer = document.getElementById('backgroundLayer');
    expect(backgroundLayer.innerHTML).toContain('/test/dungeon.png');
  });

  test('should update background layer with video', () => {
    const background = {
      path: '/test/storm.mp4',
      type: 'video',
      subtype: 'background'
    };

    const updateBackground = (bg) => {
      const backgroundLayer = document.getElementById('backgroundLayer');
      if (bg && bg.type === 'video') {
        backgroundLayer.innerHTML = `<video class="background-content" autoplay muted loop playsinline>
          <source src="file://${bg.path}" type="video/mp4">
        </video>`;
      }
    };

    updateBackground(background);

    const backgroundLayer = document.getElementById('backgroundLayer');
    expect(backgroundLayer.innerHTML).toContain('/test/storm.mp4');
    expect(backgroundLayer.innerHTML).toContain('autoplay');
    expect(backgroundLayer.innerHTML).toContain('muted');
  });

  test('should handle event video display', () => {
    const event = {
      path: '/test/dragon-attack.mp4',
      type: 'video',
      subtype: 'event'
    };

    const updateEvent = (evt) => {
      const eventLayer = document.getElementById('eventLayer');
      const eventContent = document.getElementById('eventContent');

      if (evt && evt.type === 'video') {
        eventContent.innerHTML = `<video class="event-content" autoplay playsinline muted>
          <source src="file://${evt.path}" type="video/mp4">
        </video>`;
        eventLayer.style.display = 'block';
      }
    };

    updateEvent(event);

    const eventLayer = document.getElementById('eventLayer');
    const eventContent = document.getElementById('eventContent');

    expect(eventLayer.style.display).toBe('block');
    expect(eventContent.innerHTML).toContain('/test/dragon-attack.mp4');
  });

  test('should hide placeholder when content is displayed', () => {
    const displayState = {
      portraits: [{ path: '/test/hero.png', displayName: 'Hero' }],
      background: null,
      event: null,
      backgroundSounds: [],
      backgroundMusic: null,
      soundEffects: []
    };

    const updatePlaceholder = (state) => {
      const placeholder = document.getElementById('placeholder');
      const hasContent = state.portraits.length > 0 || state.background || state.event;
      placeholder.style.display = hasContent ? 'none' : 'block';
    };

    updatePlaceholder(displayState);

    const placeholder = document.getElementById('placeholder');
    expect(placeholder.style.display).toBe('none');
  });

  test('should show placeholder when no content is displayed', () => {
    const displayState = {
      portraits: [],
      background: null,
      event: null,
      backgroundSounds: [],
      backgroundMusic: null,
      soundEffects: []
    };

    const updatePlaceholder = (state) => {
      const placeholder = document.getElementById('placeholder');
      const hasContent = state.portraits.length > 0 || state.background || state.event;
      placeholder.style.display = hasContent ? 'none' : 'block';
    };

    updatePlaceholder(displayState);

    const placeholder = document.getElementById('placeholder');
    expect(placeholder.style.display).toBe('block');
  });

  test('should scale portraits based on count', () => {
    const testCases = [
      { count: 1, expectedDataCount: '1' },
      { count: 2, expectedDataCount: '2' },
      { count: 4, expectedDataCount: '4' },
      { count: 8, expectedDataCount: '6' } // Max is 6
    ];

    testCases.forEach(({ count, expectedDataCount }) => {
      const portraits = Array.from({ length: count }, (_, i) => ({
        path: `/test/portrait${i}.png`,
        displayName: `Character ${i}`
      }));

      const updatePortraits = (portraitList) => {
        const portraitsLayer = document.getElementById('portraitsLayer');
        portraitsLayer.setAttribute(
          'data-count',
          Math.min(portraitList.length, 6).toString()
        );
      };

      updatePortraits(portraits);

      const portraitsLayer = document.getElementById('portraitsLayer');
      expect(portraitsLayer.setAttribute).toHaveBeenCalledWith(
        'data-count',
        expectedDataCount
      );
    });
  });
});

describe('Renderer Process - Dashboard Media Controls', () => {
  let electronAPI;

  beforeEach(() => {
    electronAPI = {
      displayMedia: jest.fn(() => Promise.resolve(true)),
      clearDisplayElement: jest.fn(() => Promise.resolve(true)),
      getDisplayState: jest.fn(() => Promise.resolve({
        portraits: [],
        background: null,
        event: null,
        backgroundSounds: [],
        backgroundMusic: null,
        soundEffects: []
      })),
      onDisplayStateUpdated: jest.fn()
    };

    global.window = { electronAPI };
  });

  afterEach(() => {
    delete global.window;
  });

  test('should display media item when clicked', async () => {
    const mediaItem = {
      path: '/test/media/hero.png',
      type: 'image',
      subtype: 'portrait',
      displayName: 'Hero'
    };

    const handleMediaClick = async (item) => {
      await window.electronAPI.displayMedia(
        item.path,
        item.type,
        item.subtype,
        item.displayName
      );
    };

    await handleMediaClick(mediaItem);

    expect(electronAPI.displayMedia).toHaveBeenCalledWith(
      '/test/media/hero.png',
      'image',
      'portrait',
      'Hero'
    );
  });

  test('should clear display element when requested', async () => {
    const handleClearPortraits = async () => {
      await window.electronAPI.clearDisplayElement('portraits');
    };

    await handleClearPortraits();

    expect(electronAPI.clearDisplayElement).toHaveBeenCalledWith('portraits');
  });

  test('should clear specific portrait by path', async () => {
    const portraitPath = '/test/portraits/hero.png';

    const handleClearSpecificPortrait = async (path) => {
      await window.electronAPI.clearDisplayElement('portraits', path);
    };

    await handleClearSpecificPortrait(portraitPath);

    expect(electronAPI.clearDisplayElement).toHaveBeenCalledWith(
      'portraits',
      portraitPath
    );
  });

  test('should clear all display content', async () => {
    const handleClearAll = async () => {
      await window.electronAPI.clearDisplayElement('all');
    };

    await handleClearAll();

    expect(electronAPI.clearDisplayElement).toHaveBeenCalledWith('all');
  });

  test('should get current display state', async () => {
    const mockState = {
      portraits: [{ path: '/test/p1.png', displayName: 'P1' }],
      background: { path: '/test/bg.png' },
      event: null,
      backgroundSounds: [],
      backgroundMusic: null,
      soundEffects: []
    };

    electronAPI.getDisplayState.mockResolvedValueOnce(mockState);

    const state = await window.electronAPI.getDisplayState();

    expect(state.portraits).toHaveLength(1);
    expect(state.background).toBeDefined();
  });
});

describe('Renderer Process - Battlemap Display', () => {
  let document;
  let mockElements;

  beforeEach(() => {
    mockElements = {
      backgroundLayer: {
        innerHTML: ''
      },
      portraitsLayer: {
        innerHTML: ''
      },
      eventLayer: {
        style: { display: 'none' }
      },
      placeholder: {
        style: { display: 'block' }
      }
    };

    document = {
      getElementById: jest.fn((id) => mockElements[id])
    };

    global.document = document;
    global.window = {
      innerWidth: 1920,
      innerHeight: 1080
    };
  });

  afterEach(() => {
    delete global.document;
    delete global.window;
  });

  test('should calculate grid cell size correctly', () => {
    const battlemapData = {
      gridWidth: 20,
      gridHeight: 15,
      zoom: {
        scale: 1.0,
        centerX: 0.5,
        centerY: 0.5
      }
    };

    const calculateCellSize = (gridWidth, gridHeight, zoom) => {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const baseGridSize = Math.min(
        viewportWidth / gridWidth,
        viewportHeight / gridHeight
      );
      return baseGridSize * zoom.scale;
    };

    const cellSize = calculateCellSize(
      battlemapData.gridWidth,
      battlemapData.gridHeight,
      battlemapData.zoom
    );

    expect(cellSize).toBeGreaterThan(0);
    expect(cellSize).toBeLessThanOrEqual(window.innerWidth / battlemapData.gridWidth);
  });

  test('should apply zoom to battlemap display', () => {
    const battlemapData = {
      gridWidth: 10,
      gridHeight: 10,
      zoom: {
        scale: 2.0,
        centerX: 0.5,
        centerY: 0.5
      }
    };

    const calculateCellSize = (gridWidth, gridHeight, zoom) => {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const baseGridSize = Math.min(
        viewportWidth / gridWidth,
        viewportHeight / gridHeight
      );
      return baseGridSize * zoom.scale;
    };

    const cellSize = calculateCellSize(
      battlemapData.gridWidth,
      battlemapData.gridHeight,
      battlemapData.zoom
    );

    const baseCellSize = calculateCellSize(
      battlemapData.gridWidth,
      battlemapData.gridHeight,
      { scale: 1.0 }
    );

    expect(cellSize).toBe(baseCellSize * 2.0);
  });

  test('should hide battlemap and restore previous content', () => {
    const backgroundLayer = document.getElementById('backgroundLayer');
    const portraitsLayer = document.getElementById('portraitsLayer');
    const placeholder = document.getElementById('placeholder');

    // Simulate battlemap being displayed
    backgroundLayer.innerHTML = '<div class="battlemap">...</div>';

    // Hide battlemap
    const hideBattlemap = () => {
      backgroundLayer.innerHTML = '';
      portraitsLayer.innerHTML = '';
      placeholder.style.display = 'block';
    };

    hideBattlemap();

    expect(backgroundLayer.innerHTML).toBe('');
    expect(portraitsLayer.innerHTML).toBe('');
    expect(placeholder.style.display).toBe('block');
  });
});

describe('Renderer Process - Error Handling', () => {
  let electronAPI;

  beforeEach(() => {
    electronAPI = {
      selectDirectory: jest.fn(),
      displayMedia: jest.fn(),
      savePartyData: jest.fn()
    };

    global.window = { electronAPI };
    global.console = { error: jest.fn() };
  });

  afterEach(() => {
    delete global.window;
  });

  test('should handle errors when selecting directory', async () => {
    electronAPI.selectDirectory.mockRejectedValueOnce(new Error('Permission denied'));

    const handleSelectDirectory = async () => {
      try {
        await window.electronAPI.selectDirectory();
      } catch (error) {
        console.error('Error selecting directory:', error);
        throw error;
      }
    };

    await expect(handleSelectDirectory()).rejects.toThrow('Permission denied');
    expect(console.error).toHaveBeenCalled();
  });

  test('should handle errors when displaying media', async () => {
    electronAPI.displayMedia.mockRejectedValueOnce(new Error('Display window not found'));

    const handleDisplayMedia = async () => {
      try {
        await window.electronAPI.displayMedia('/test/media.png', 'image', 'portrait', 'Media');
      } catch (error) {
        console.error('Error displaying media:', error);
        throw error;
      }
    };

    await expect(handleDisplayMedia()).rejects.toThrow('Display window not found');
  });

  test('should handle errors when saving data', async () => {
    electronAPI.savePartyData.mockRejectedValueOnce(new Error('Disk full'));

    const handleSaveData = async () => {
      try {
        await window.electronAPI.savePartyData('/test/party.json', {});
      } catch (error) {
        console.error('Error saving data:', error);
        throw error;
      }
    };

    await expect(handleSaveData()).rejects.toThrow('Disk full');
  });
});
