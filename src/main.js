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

// Get the path for storing user data
const userDataPath = app.getPath("userData");
const settingsPath = path.join(userDataPath, "settings.json");

// Load cached directory on startup
async function loadCachedDirectory() {
  try {
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
          (p) => p.path !== mediaPath
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
  }
);

// Handle clearing display elements
ipcMain.handle(
  "clear-display-element",
  (event, elementType, elementPath = null) => {
    if (elementType === "portraits") {
      if (elementPath) {
        // Remove specific portrait
        displayState.portraits = displayState.portraits.filter(
          (p) => p.path !== elementPath
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
          (s) => s.id != elementPath
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
          (s) => s.id != elementPath
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
  }
);

// Get current display state
ipcMain.handle("get-display-state", () => {
  return displayState;
});

app.whenReady().then(async () => {
  await loadCachedDirectory();
  createMainWindow();
});

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
