const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const fs = require("fs").promises;
const os = require("os");

let mainWindow;
let displayWindow;
let cachedDirectory = null;

// Display state management
let displayState = {
  portraits: [],
  background: null,
  event: null,
  backgroundSounds: [], // Changed to array for multiple background sounds
  backgroundMusic: null,
  soundEffects: [],
};

// Lazy initialization for user data path
let userDataPath;
let settingsPath;

function initializePaths() {
  if (!userDataPath) {
    userDataPath = app.getPath("userData");
    settingsPath = path.join(userDataPath, "settings.json");
  }
}

// Load cached directory on startup
async function loadCachedDirectory() {
  try {
    initializePaths();
    const settingsData = await fs.readFile(settingsPath, "utf8");
    const settings = JSON.parse(settingsData);
    if (
      settings.lastDirectory &&
      (await directoryExists(settings.lastDirectory))
    ) {
      cachedDirectory = settings.lastDirectory;
    }
  } catch (error) {
    // Settings file doesn't exist or is invalid, that's okay
    console.log("No cached directory found or invalid settings file");
  }
}

// Save directory to cache
async function saveCachedDirectory(directory) {
  try {
    initializePaths();
    cachedDirectory = directory;
    const settings = { lastDirectory: directory };
    await fs.writeFile(settingsPath, JSON.stringify(settings, null, 2));
  } catch (error) {
    console.error("Error saving directory to cache:", error);
  }
}

// Check if directory exists
async function directoryExists(dirPath) {
  try {
    const stats = await fs.stat(dirPath);
    return stats.isDirectory();
  } catch {
    return false;
  }
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    icon: path.join(__dirname, "public/d20icon.svg"),
    webPreferences: {
      contextIsolation: true,
      enableRemoteModule: false,
      nodeIntegration: false,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  mainWindow.loadFile("src/renderer/starting-screen.html");

  // Open DevTools in development
  if (process.argv.includes("--dev")) {
    mainWindow.webContents.openDevTools();
  }
}

function createDisplayWindow() {
  displayWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(__dirname, "public/d20icon.svg"),
    webPreferences: {
      contextIsolation: true,
      enableRemoteModule: false,
      nodeIntegration: false,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  displayWindow.loadFile("src/renderer/display-window.html");

  if (process.argv.includes("--dev")) {
    displayWindow.webContents.openDevTools();
  }

  return displayWindow;
}

// Register all IPC handlers
function registerIpcHandlers() {
  // Handle directory selection
  ipcMain.handle("select-directory", async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ["openDirectory"],
      defaultPath: cachedDirectory || os.homedir(),
    });

    if (!result.canceled && result.filePaths.length > 0) {
      const selectedPath = result.filePaths[0];
      await saveCachedDirectory(selectedPath);
      return selectedPath;
    }
    return null;
  });

  // Get cached directory
  ipcMain.handle("get-cached-directory", async () => {
    return cachedDirectory;
  });

  // Handle file system scanning
  ipcMain.handle("scan-directory", async (event, directoryPath) => {
    try {
      const mediaExtensions = [
        ".jpg",
        ".jpeg",
        ".png",
        ".gif",
        ".mp4",
        ".webm",
        ".mp3",
        ".wav",
        ".ogg",
      ];

      async function scanDir(dirPath) {
        const items = await fs.readdir(dirPath, { withFileTypes: true });
        const result = {
          name: path.basename(dirPath),
          path: dirPath,
          type: "folder",
          children: [],
        };

        for (const item of items) {
          const itemPath = path.join(dirPath, item.name);

          if (item.isDirectory()) {
            const subDir = await scanDir(itemPath);
            result.children.push(subDir);
          } else if (item.isFile()) {
            const ext = path.extname(item.name).toLowerCase();
            const fileName = path.basename(item.name, ext);

            // Determine media type and subtype for all files
            let mediaType = "other";
            let mediaSubtype = "default";

            if (mediaExtensions.includes(ext)) {
              if ([".jpg", ".jpeg", ".png", ".gif"].includes(ext)) {
                mediaType = "image";
                if (fileName.toLowerCase().endsWith("_location")) {
                  mediaSubtype = "background";
                } else {
                  mediaSubtype = "portrait";
                }
              } else if ([".mp4", ".webm"].includes(ext)) {
                mediaType = "video";
                if (fileName.toLowerCase().endsWith("_location")) {
                  mediaSubtype = "background";
                } else {
                  mediaSubtype = "event";
                }
              } else if ([".mp3", ".wav", ".ogg"].includes(ext)) {
                mediaType = "audio";
                if (fileName.toLowerCase().endsWith("_loop")) {
                  mediaSubtype = "loop";
                } else if (fileName.toLowerCase().endsWith("_music")) {
                  mediaSubtype = "music";
                } else {
                  mediaSubtype = "sound";
                }
              }
            }

            // Include ALL files, not just media files
            result.children.push({
              name: item.name,
              path: itemPath,
              type: "file",
              mediaType: mediaType,
              mediaSubtype: mediaSubtype,
              displayName: fileName.startsWith("_")
                ? "???"
                : fileName.replace(/_location$|_loop$|_music$/, ""),
            });
          }
        }

        return result;
      }

      return await scanDir(directoryPath);
    } catch (error) {
      console.error("Error scanning directory:", error);
      throw error;
    }
  });

  // Handle window management
  ipcMain.handle("open-display-window", () => {
    if (!displayWindow || displayWindow.isDestroyed()) {
      createDisplayWindow();
    } else {
      displayWindow.focus();
    }
    return true;
  });

  ipcMain.handle("load-dashboard", () => {
    mainWindow.loadFile("src/renderer/dashboard.html");
    return true;
  });

  // Handle display window media
  ipcMain.handle(
    "display-media",
    (event, mediaPath, mediaType, mediaSubtype, displayName) => {
      if (displayWindow && !displayWindow.isDestroyed()) {
        const mediaData = {
          path: mediaPath,
          type: mediaType,
          subtype: mediaSubtype,
          displayName: displayName,
        };

        // Update display state based on media type
        if (mediaType === "image" && mediaSubtype === "portrait") {
          // Add portrait to list (remove if already exists to avoid duplicates)
          displayState.portraits = displayState.portraits.filter(
            (p) => p.path !== mediaPath,
          );
          displayState.portraits.push(mediaData);
        } else if (
          (mediaType === "image" || mediaType === "video") &&
          mediaSubtype === "background"
        ) {
          // Set new background (replaces previous)
          displayState.background = mediaData;
        } else if (mediaType === "video" && mediaSubtype === "event") {
          // Set event (replaces previous)
          displayState.event = mediaData;
        } else if (mediaType === "audio" && mediaSubtype === "sound") {
          // Add sound effect to list
          displayState.soundEffects.push({ ...mediaData, id: Date.now() });
        } else if (mediaType === "audio" && mediaSubtype === "loop") {
          // Add background sound to list (multiple allowed)
          displayState.backgroundSounds.push({ ...mediaData, id: Date.now() });
        } else if (mediaType === "audio" && mediaSubtype === "music") {
          // Set background music (replaces previous)
          displayState.backgroundMusic = mediaData;
        }

        displayWindow.webContents.send("update-display", displayState);

        // Send updated state to dashboard
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send("display-state-updated", displayState);
        }

        return true;
      }
      return false;
    },
  );

  // Handle clearing display elements
  ipcMain.handle(
    "clear-display-element",
    (event, elementType, elementPath = null) => {
      if (elementType === "portraits") {
        if (elementPath) {
          // Remove specific portrait
          displayState.portraits = displayState.portraits.filter(
            (p) => p.path !== elementPath,
          );
        } else {
          // Clear all portraits
          displayState.portraits = [];
        }
      } else if (elementType === "background") {
        displayState.background = null;
      } else if (elementType === "event") {
        displayState.event = null;
      } else if (elementType === "backgroundSound") {
        // Remove specific background sound by ID
        if (elementPath) {
          displayState.backgroundSounds = displayState.backgroundSounds.filter(
            (s) => s.id != elementPath,
          );
        } else {
          // Clear all background sounds
          displayState.backgroundSounds = [];
        }
      } else if (elementType === "backgroundMusic") {
        displayState.backgroundMusic = null;
      } else if (elementType === "soundEffect") {
        // Remove specific sound effect by ID
        if (elementPath) {
          displayState.soundEffects = displayState.soundEffects.filter(
            (s) => s.id != elementPath,
          );
        } else {
          // Clear all sound effects
          displayState.soundEffects = [];
        }
      } else if (elementType === "all") {
        // Clear everything
        displayState = {
          portraits: [],
          background: null,
          event: null,
          backgroundSounds: [],
          backgroundMusic: null,
          soundEffects: [],
        };
      }

      if (displayWindow && !displayWindow.isDestroyed()) {
        displayWindow.webContents.send("update-display", displayState);
      }

      // Send updated state to dashboard
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send("display-state-updated", displayState);
      }

      return true;
    },
  );

  // Get current display state
  ipcMain.handle("get-display-state", () => {
    return displayState;
  });

  // Handle saving party data
  ipcMain.handle("save-party-data", async (event, filePath, partyData) => {
    try {
      await fs.writeFile(filePath, JSON.stringify(partyData, null, 2));
      return true;
    } catch (error) {
      console.error("Error saving party data:", error);
      throw error;
    }
  });

  // Handle loading party data
  ipcMain.handle("load-party-data", async (event, filePath) => {
    try {
      const data = await fs.readFile(filePath, "utf8");
      return JSON.parse(data);
    } catch (error) {
      // File doesn't exist or is invalid
      if (error.code === "ENOENT") {
        return null; // File doesn't exist, that's okay
      }
      console.error("Error loading party data:", error);
      throw error;
    }
  });

  // Handle saving encounter data
  ipcMain.handle(
    "save-encounter-data",
    async (event, filePath, encounterData) => {
      try {
        await fs.writeFile(filePath, JSON.stringify(encounterData, null, 2));
        return true;
      } catch (error) {
        console.error("Error saving encounter data:", error);
        throw error;
      }
    },
  );

  // Handle loading encounter data
  ipcMain.handle("load-encounter-data", async (event, filePath) => {
    try {
      const data = await fs.readFile(filePath, "utf8");
      return JSON.parse(data);
    } catch (error) {
      // File doesn't exist or is invalid
      if (error.code === "ENOENT") {
        return null; // File doesn't exist, that's okay
      }
      console.error("Error loading encounter data:", error);
      throw error;
    }
  });

  // Handle encounter file selection
  ipcMain.handle("select-encounter-file", async (event, directoryPath) => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ["openFile"],
      defaultPath: directoryPath,
      filters: [
        { name: "Encounter Files", extensions: ["json"] },
        { name: "All Files", extensions: ["*"] },
      ],
    });

    if (!result.canceled && result.filePaths.length > 0) {
      return result.filePaths[0];
    }
    return null;
  });

  // Get list of encounter files in directory
  ipcMain.handle("get-encounter-files", async (event, directoryPath) => {
    try {
      const items = await fs.readdir(directoryPath, { withFileTypes: true });
      const encounterFiles = [];

      for (const item of items) {
        if (item.isFile() && item.name.endsWith("_encounter.json")) {
          const filePath = path.join(directoryPath, item.name);
          try {
            // Try to read and parse the file to validate it's a proper encounter
            const fileContent = await fs.readFile(filePath, "utf8");
            const encounterData = JSON.parse(fileContent);

            // Basic validation - check if it has the expected structure
            if (
              encounterData.name !== undefined &&
              Array.isArray(encounterData.enemies)
            ) {
              encounterFiles.push({
                filename: item.name,
                path: filePath,
                name: encounterData.name,
                enemyCount: encounterData.enemies.length,
                lastModified: (await fs.stat(filePath)).mtime,
              });
            }
          } catch (error) {
            // Skip invalid JSON files
            console.log(`Skipping invalid encounter file: ${item.name}`);
          }
        }
      }

      // Sort by last modified date (newest first)
      encounterFiles.sort((a, b) => b.lastModified - a.lastModified);

      return encounterFiles;
    } catch (error) {
      console.error("Error getting encounter files:", error);
      return [];
    }
  });

  // Get list of battlemap files in directory
  ipcMain.handle("get-battlemap-files", async (event, directoryPath) => {
    try {
      const items = await fs.readdir(directoryPath, { withFileTypes: true });
      const battlemapFiles = [];

      for (const item of items) {
        if (item.isFile() && item.name.endsWith("_battlemap.json")) {
          const filePath = path.join(directoryPath, item.name);
          try {
            // Try to read and parse the file to validate it's a proper battlemap
            const fileContent = await fs.readFile(filePath, "utf8");
            const battlemapData = JSON.parse(fileContent);

            // Basic validation - check if it has the expected structure
            if (
              battlemapData.gridWidth !== undefined &&
              battlemapData.gridHeight !== undefined
            ) {
              const tokenCount = battlemapData.tokens
                ? Object.keys(battlemapData.tokens).length
                : 0;

              battlemapFiles.push({
                filename: item.name,
                path: filePath,
                name: item.name.replace("_battlemap.json", ""),
                gridWidth: battlemapData.gridWidth,
                gridHeight: battlemapData.gridHeight,
                backgroundImage: battlemapData.backgroundImage,
                tokenCount: tokenCount,
                lastModified: (await fs.stat(filePath)).mtime,
              });
            }
          } catch (error) {
            // Skip invalid JSON files
            console.log(`Skipping invalid battlemap file: ${item.name}`);
          }
        }
      }

      // Sort by last modified date (newest first)
      battlemapFiles.sort((a, b) => b.lastModified - a.lastModified);

      return battlemapFiles;
    } catch (error) {
      console.error("Error getting battlemap files:", error);
      return [];
    }
  });

  // Initiative tracking IPC handlers
  ipcMain.handle(
    "save-initiative-data",
    async (event, directoryPath, initiativeData) => {
      try {
        const filePath = path.join(directoryPath, "initiative.json");
        await fs.writeFile(filePath, JSON.stringify(initiativeData, null, 2));
        console.log("Initiative data saved to:", filePath);
        return { success: true };
      } catch (error) {
        console.error("Error saving initiative data:", error);
        return { success: false, error: error.message };
      }
    },
  );

  ipcMain.handle("load-initiative-data", async (event, directoryPath) => {
    try {
      const filePath = path.join(directoryPath, "initiative.json");
      const data = await fs.readFile(filePath, "utf8");
      return JSON.parse(data);
    } catch (error) {
      console.error("Error loading initiative data:", error);
      return null;
    }
  });

  // Battlemap IPC handlers
  ipcMain.handle(
    "save-battlemap-data",
    async (event, directoryPath, battlemapData, fileName = null) => {
      try {
        const defaultFileName = "default_battlemap.json";
        const actualFileName = fileName || defaultFileName;
        const filePath = path.join(directoryPath, actualFileName);
        await fs.writeFile(filePath, JSON.stringify(battlemapData, null, 2));
        console.log("Battlemap data saved to:", filePath);
        return { success: true };
      } catch (error) {
        console.error("Error saving battlemap data:", error);
        return { success: false, error: error.message };
      }
    },
  );

  ipcMain.handle("load-battlemap-data", async (event, pathToLoad) => {
    try {
      let filePath;

      // If pathToLoad ends with .json, it's a specific file path
      if (pathToLoad.endsWith(".json")) {
        filePath = pathToLoad;
        console.log("Loading specific battlemap file:", filePath);
      } else {
        // It's a directory, try the legacy filename first
        filePath = path.join(pathToLoad, "battlemap.json");
        console.log("Trying legacy battlemap file:", filePath);

        // Check if legacy file exists, if not, try default
        try {
          await fs.access(filePath);
          console.log("Legacy file found");
        } catch {
          // Legacy file doesn't exist, try default
          filePath = path.join(pathToLoad, "default_battlemap.json");
          console.log("Legacy file not found, trying default:", filePath);
        }
      }

      const data = await fs.readFile(filePath, "utf8");
      console.log("Battlemap data loaded successfully");
      return JSON.parse(data);
    } catch (error) {
      console.error("Error loading battlemap data:", error);
      return null;
    }
  });

  // Battlemap display IPC handlers
  ipcMain.handle("display-battlemap", async (event, battlemapData) => {
    try {
      if (displayWindow) {
        displayWindow.webContents.send("display-battlemap", battlemapData);
        console.log("Battlemap sent to display window");
        return { success: true };
      }
    } catch (error) {
      console.error("Error displaying battlemap:", error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle("hide-battlemap", async (event) => {
    try {
      if (displayWindow) {
        displayWindow.webContents.send("hide-battlemap");
        console.log("Battlemap hidden from display");
        return { success: true };
      }
    } catch (error) {
      console.error("Error hiding battlemap:", error);
      return { success: false, error: error.message };
    }
  });
}

// Register app event listeners
function registerAppEventListeners() {
  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
      app.quit();
    }
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
}

// Main initialization function
async function initialize() {
  registerIpcHandlers();
  registerAppEventListeners();
  await loadCachedDirectory();
  createMainWindow();
}

// Only run if this is the main module (not being required by tests)
if (require.main === module) {
  app.whenReady().then(initialize);
}

// Export functions for testing
module.exports = {
  initialize,
  registerIpcHandlers,
  registerAppEventListeners,
  createMainWindow,
  createDisplayWindow,
  loadCachedDirectory,
  saveCachedDirectory,
  directoryExists,
};
