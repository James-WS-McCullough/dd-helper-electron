"use strict";
const electron = require("electron");
const path = require("path");
const os = require("os");
const fs = require("fs");
require("fs/promises");
const is = {
  dev: !electron.app.isPackaged
};
const platform = {
  isWindows: process.platform === "win32",
  isMacOS: process.platform === "darwin",
  isLinux: process.platform === "linux"
};
const electronApp = {
  setAppUserModelId(id) {
    if (platform.isWindows)
      electron.app.setAppUserModelId(is.dev ? process.execPath : id);
  },
  setAutoLaunch(auto) {
    if (platform.isLinux)
      return false;
    const isOpenAtLogin = () => {
      return electron.app.getLoginItemSettings().openAtLogin;
    };
    if (isOpenAtLogin() !== auto) {
      electron.app.setLoginItemSettings({ openAtLogin: auto });
      return isOpenAtLogin() === auto;
    } else {
      return true;
    }
  },
  skipProxy() {
    return electron.session.defaultSession.setProxy({ mode: "direct" });
  }
};
const optimizer = {
  watchWindowShortcuts(window, shortcutOptions) {
    if (!window)
      return;
    const { webContents } = window;
    const { escToCloseWindow = false, zoom = false } = shortcutOptions || {};
    webContents.on("before-input-event", (event, input) => {
      if (input.type === "keyDown") {
        if (!is.dev) {
          if (input.code === "KeyR" && (input.control || input.meta))
            event.preventDefault();
          if (input.code === "KeyI" && (input.alt && input.meta || input.control && input.shift)) {
            event.preventDefault();
          }
        } else {
          if (input.code === "F12") {
            if (webContents.isDevToolsOpened()) {
              webContents.closeDevTools();
            } else {
              webContents.openDevTools({ mode: "undocked" });
              console.log("Open dev tool...");
            }
          }
        }
        if (escToCloseWindow) {
          if (input.code === "Escape" && input.key !== "Process") {
            window.close();
            event.preventDefault();
          }
        }
        if (!zoom) {
          if (input.code === "Minus" && (input.control || input.meta))
            event.preventDefault();
          if (input.code === "Equal" && input.shift && (input.control || input.meta))
            event.preventDefault();
        }
      }
    });
  },
  registerFramelessWindowIpc() {
    electron.ipcMain.on("win:invoke", (event, action) => {
      const win = electron.BrowserWindow.fromWebContents(event.sender);
      if (win) {
        if (action === "show") {
          win.show();
        } else if (action === "showInactive") {
          win.showInactive();
        } else if (action === "min") {
          win.minimize();
        } else if (action === "max") {
          const isMaximized = win.isMaximized();
          if (isMaximized) {
            win.unmaximize();
          } else {
            win.maximize();
          }
        } else if (action === "close") {
          win.close();
        }
      }
    });
  }
};
let mainWindow = null;
let displayWindow = null;
function createMainWindow() {
  mainWindow = new electron.BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.js"),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  mainWindow.on("ready-to-show", () => {
    mainWindow?.show();
  });
  mainWindow.webContents.setWindowOpenHandler((details) => {
    require("electron").shell.openExternal(details.url);
    return { action: "deny" };
  });
  if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
  }
  if (process.argv.includes("--dev") || is.dev) {
    mainWindow.webContents.openDevTools();
  }
  return mainWindow;
}
function createDisplayWindow() {
  displayWindow = new electron.BrowserWindow({
    width: 1200,
    height: 800,
    show: true,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.js"),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  displayWindow.on("ready-to-show", () => {
    displayWindow?.show();
  });
  if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    displayWindow.loadURL(`${process.env["ELECTRON_RENDERER_URL"]}#/display`);
  } else {
    displayWindow.loadFile(path.join(__dirname, "../renderer/index.html"), {
      hash: "/display"
    });
  }
  if (process.argv.includes("--dev") || is.dev) {
    displayWindow.webContents.openDevTools();
  }
  return displayWindow;
}
function getMainWindow() {
  return mainWindow;
}
function getDisplayWindow() {
  return displayWindow;
}
function hasDisplayWindow() {
  return displayWindow !== null && !displayWindow.isDestroyed();
}
function openDisplayWindow() {
  if (!displayWindow || displayWindow.isDestroyed()) {
    createDisplayWindow();
  } else {
    displayWindow.focus();
  }
  return true;
}
let userDataPath = null;
let settingsPath = null;
let cachedDirectory = null;
function initializePaths() {
  if (!userDataPath) {
    userDataPath = electron.app.getPath("userData");
    settingsPath = path.join(userDataPath, "settings.json");
  }
}
async function directoryExists(dirPath) {
  try {
    const stats = await fs.promises.stat(dirPath);
    return stats.isDirectory();
  } catch {
    return false;
  }
}
async function loadCachedDirectory() {
  try {
    initializePaths();
    const settingsData = await fs.promises.readFile(settingsPath, "utf8");
    const settings = JSON.parse(settingsData);
    if (settings.lastDirectory && await directoryExists(settings.lastDirectory)) {
      cachedDirectory = settings.lastDirectory;
      return cachedDirectory;
    }
  } catch (error) {
    console.log("No cached directory found or invalid settings file");
  }
  return null;
}
async function saveCachedDirectory(directory) {
  try {
    initializePaths();
    cachedDirectory = directory;
    const settings = { lastDirectory: directory };
    await fs.promises.writeFile(settingsPath, JSON.stringify(settings, null, 2));
  } catch (error) {
    console.error("Error saving directory to cache:", error);
  }
}
function getCachedDirectory() {
  return cachedDirectory;
}
async function scanDirectory(directoryPath) {
  const mediaExtensions = [".jpg", ".jpeg", ".png", ".gif", ".mp4", ".webm", ".mp3", ".wav", ".ogg"];
  async function scanDir(dirPath) {
    const items = await fs.promises.readdir(dirPath, { withFileTypes: true });
    const result = {
      name: path.basename(dirPath),
      path: dirPath,
      type: "folder",
      mediaType: "other",
      mediaSubtype: "default",
      displayName: path.basename(dirPath),
      children: []
    };
    for (const item of items) {
      const itemPath = path.join(dirPath, item.name);
      if (item.isDirectory()) {
        const subDir = await scanDir(itemPath);
        result.children.push(subDir);
      } else if (item.isFile()) {
        const ext = path.extname(item.name).toLowerCase();
        const fileName = path.basename(item.name, ext);
        let mediaType = "other";
        let mediaSubtype = "default";
        if (mediaExtensions.includes(ext)) {
          if ([".jpg", ".jpeg", ".png", ".gif"].includes(ext)) {
            mediaType = "image";
            mediaSubtype = fileName.toLowerCase().endsWith("_location") ? "background" : "portrait";
          } else if ([".mp4", ".webm"].includes(ext)) {
            mediaType = "video";
            mediaSubtype = fileName.toLowerCase().endsWith("_location") ? "background" : "event";
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
        result.children.push({
          name: item.name,
          path: itemPath,
          type: "file",
          mediaType,
          mediaSubtype,
          displayName: fileName.startsWith("_") ? "???" : fileName.replace(/_location$|_loop$|_music$/, "")
        });
      }
    }
    return result;
  }
  return await scanDir(directoryPath);
}
async function savePartyData(filePath, partyData) {
  try {
    await fs.promises.writeFile(filePath, JSON.stringify(partyData, null, 2));
    return true;
  } catch (error) {
    console.error("Error saving party data:", error);
    throw error;
  }
}
async function loadPartyData(filePath) {
  try {
    const data = await fs.promises.readFile(filePath, "utf8");
    return JSON.parse(data);
  } catch (error) {
    if (error.code === "ENOENT") {
      return null;
    }
    console.error("Error loading party data:", error);
    throw error;
  }
}
async function saveEncounterData(filePath, encounterData) {
  try {
    await fs.promises.writeFile(filePath, JSON.stringify(encounterData, null, 2));
    return true;
  } catch (error) {
    console.error("Error saving encounter data:", error);
    throw error;
  }
}
async function loadEncounterData(filePath) {
  try {
    const data = await fs.promises.readFile(filePath, "utf8");
    return JSON.parse(data);
  } catch (error) {
    if (error.code === "ENOENT") {
      return null;
    }
    console.error("Error loading encounter data:", error);
    throw error;
  }
}
async function getEncounterFiles(directoryPath) {
  try {
    const items = await fs.promises.readdir(directoryPath, { withFileTypes: true });
    const encounterFiles = [];
    for (const item of items) {
      if (item.isFile() && item.name.endsWith("_encounter.json")) {
        const filePath = path.join(directoryPath, item.name);
        try {
          const fileContent = await fs.promises.readFile(filePath, "utf8");
          const encounterData = JSON.parse(fileContent);
          if (encounterData.name !== void 0 && Array.isArray(encounterData.enemies)) {
            const stats = await fs.promises.stat(filePath);
            encounterFiles.push({
              filename: item.name,
              path: filePath,
              name: encounterData.name,
              enemyCount: encounterData.enemies.length,
              lastModified: stats.mtime
            });
          }
        } catch (error) {
          console.log(`Skipping invalid encounter file: ${item.name}`);
        }
      }
    }
    encounterFiles.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());
    return encounterFiles;
  } catch (error) {
    console.error("Error getting encounter files:", error);
    return [];
  }
}
async function saveInitiativeData(directoryPath, initiativeData) {
  try {
    const filePath = path.join(directoryPath, "initiative.json");
    await fs.promises.writeFile(filePath, JSON.stringify(initiativeData, null, 2));
    console.log("Initiative data saved to:", filePath);
    return { success: true };
  } catch (error) {
    console.error("Error saving initiative data:", error);
    return { success: false, error: error.message };
  }
}
async function loadInitiativeData(directoryPath) {
  try {
    const filePath = path.join(directoryPath, "initiative.json");
    const data = await fs.promises.readFile(filePath, "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error loading initiative data:", error);
    return null;
  }
}
async function saveBattlemapData(directoryPath, battlemapData, fileName) {
  try {
    const defaultFileName = "default_battlemap.json";
    const actualFileName = fileName || defaultFileName;
    const filePath = path.join(directoryPath, actualFileName);
    await fs.promises.writeFile(filePath, JSON.stringify(battlemapData, null, 2));
    console.log("Battlemap data saved to:", filePath);
    return { success: true };
  } catch (error) {
    console.error("Error saving battlemap data:", error);
    return { success: false, error: error.message };
  }
}
async function loadBattlemapData(pathToLoad) {
  try {
    let filePath;
    if (pathToLoad.endsWith(".json")) {
      filePath = pathToLoad;
      console.log("Loading specific battlemap file:", filePath);
    } else {
      filePath = path.join(pathToLoad, "battlemap.json");
      console.log("Trying legacy battlemap file:", filePath);
      try {
        await fs.promises.access(filePath);
        console.log("Legacy file found");
      } catch {
        filePath = path.join(pathToLoad, "default_battlemap.json");
        console.log("Legacy file not found, trying default:", filePath);
      }
    }
    const data = await fs.promises.readFile(filePath, "utf8");
    console.log("Battlemap data loaded successfully");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error loading battlemap data:", error);
    return null;
  }
}
async function getBattlemapFiles(directoryPath) {
  try {
    const items = await fs.promises.readdir(directoryPath, { withFileTypes: true });
    const battlemapFiles = [];
    for (const item of items) {
      if (item.isFile() && item.name.endsWith("_battlemap.json")) {
        const filePath = path.join(directoryPath, item.name);
        try {
          const fileContent = await fs.promises.readFile(filePath, "utf8");
          const battlemapData = JSON.parse(fileContent);
          if (battlemapData.gridWidth !== void 0 && battlemapData.gridHeight !== void 0) {
            const tokenCount = battlemapData.tokens ? Object.keys(battlemapData.tokens).length : 0;
            const stats = await fs.promises.stat(filePath);
            battlemapFiles.push({
              filename: item.name,
              path: filePath,
              name: item.name.replace("_battlemap.json", ""),
              gridWidth: battlemapData.gridWidth,
              gridHeight: battlemapData.gridHeight,
              backgroundImage: battlemapData.backgroundImage,
              tokenCount,
              lastModified: stats.mtime
            });
          }
        } catch (error) {
          console.log(`Skipping invalid battlemap file: ${item.name}`);
        }
      }
    }
    battlemapFiles.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());
    return battlemapFiles;
  } catch (error) {
    console.error("Error getting battlemap files:", error);
    return [];
  }
}
let displayState = {
  portraits: [],
  background: null,
  event: null,
  backgroundSounds: [],
  backgroundMusic: null,
  soundEffects: []
};
function registerIpcHandlers() {
  electron.ipcMain.handle("select-directory", async () => {
    const mainWindow2 = getMainWindow();
    if (!mainWindow2) return null;
    const result = await electron.dialog.showOpenDialog(mainWindow2, {
      properties: ["openDirectory"],
      defaultPath: getCachedDirectory() || os.homedir()
    });
    if (!result.canceled && result.filePaths.length > 0) {
      const selectedPath = result.filePaths[0];
      await saveCachedDirectory(selectedPath);
      return selectedPath;
    }
    return null;
  });
  electron.ipcMain.handle("get-cached-directory", async () => {
    return getCachedDirectory();
  });
  electron.ipcMain.handle("scan-directory", async (_event, directoryPath) => {
    try {
      return await scanDirectory(directoryPath);
    } catch (error) {
      console.error("Error scanning directory:", error);
      throw error;
    }
  });
  electron.ipcMain.handle("open-display-window", () => {
    return openDisplayWindow();
  });
  electron.ipcMain.handle("load-dashboard", () => {
    const mainWindow2 = getMainWindow();
    if (mainWindow2) {
      return true;
    }
    return false;
  });
  electron.ipcMain.handle(
    "display-media",
    (_event, mediaPath, mediaType, mediaSubtype, displayName) => {
      const displayWindow2 = getDisplayWindow();
      if (!hasDisplayWindow() || !displayWindow2) {
        return false;
      }
      const mediaData = {
        path: mediaPath,
        type: mediaType,
        subtype: mediaSubtype,
        displayName
      };
      if (mediaType === "image" && mediaSubtype === "portrait") {
        displayState.portraits = displayState.portraits.filter((p) => p.path !== mediaPath);
        displayState.portraits.push(mediaData);
      } else if ((mediaType === "image" || mediaType === "video") && mediaSubtype === "background") {
        displayState.background = mediaData;
      } else if (mediaType === "video" && mediaSubtype === "event") {
        displayState.event = mediaData;
      } else if (mediaType === "audio" && mediaSubtype === "sound") {
        displayState.soundEffects.push({ ...mediaData, id: Date.now() });
      } else if (mediaType === "audio" && mediaSubtype === "loop") {
        displayState.backgroundSounds.push({ ...mediaData, id: Date.now() });
      } else if (mediaType === "audio" && mediaSubtype === "music") {
        displayState.backgroundMusic = mediaData;
      }
      displayWindow2.webContents.send("update-display", displayState);
      const mainWindow2 = getMainWindow();
      if (mainWindow2 && !mainWindow2.isDestroyed()) {
        mainWindow2.webContents.send("display-state-updated", displayState);
      }
      return true;
    }
  );
  electron.ipcMain.handle("clear-display-element", (_event, elementType, elementPath) => {
    if (elementType === "portraits") {
      if (elementPath) {
        displayState.portraits = displayState.portraits.filter((p) => p.path !== elementPath);
      } else {
        displayState.portraits = [];
      }
    } else if (elementType === "background") {
      displayState.background = null;
    } else if (elementType === "event") {
      displayState.event = null;
    } else if (elementType === "backgroundSound") {
      if (elementPath) {
        const idToRemove = parseInt(elementPath, 10);
        displayState.backgroundSounds = displayState.backgroundSounds.filter(
          (s) => s.id !== idToRemove
        );
      } else {
        displayState.backgroundSounds = [];
      }
    } else if (elementType === "backgroundMusic") {
      displayState.backgroundMusic = null;
    } else if (elementType === "soundEffect") {
      if (elementPath) {
        const idToRemove = parseInt(elementPath, 10);
        displayState.soundEffects = displayState.soundEffects.filter((s) => s.id !== idToRemove);
      } else {
        displayState.soundEffects = [];
      }
    } else if (elementType === "all") {
      displayState = {
        portraits: [],
        background: null,
        event: null,
        backgroundSounds: [],
        backgroundMusic: null,
        soundEffects: []
      };
    }
    const displayWindow2 = getDisplayWindow();
    if (hasDisplayWindow() && displayWindow2) {
      displayWindow2.webContents.send("update-display", displayState);
    }
    const mainWindow2 = getMainWindow();
    if (mainWindow2 && !mainWindow2.isDestroyed()) {
      mainWindow2.webContents.send("display-state-updated", displayState);
    }
    return true;
  });
  electron.ipcMain.handle("get-display-state", () => {
    return displayState;
  });
  electron.ipcMain.handle("save-party-data", async (_event, filePath, partyData) => {
    return await savePartyData(filePath, partyData);
  });
  electron.ipcMain.handle("load-party-data", async (_event, filePath) => {
    return await loadPartyData(filePath);
  });
  electron.ipcMain.handle("save-encounter-data", async (_event, filePath, encounterData) => {
    return await saveEncounterData(filePath, encounterData);
  });
  electron.ipcMain.handle("load-encounter-data", async (_event, filePath) => {
    return await loadEncounterData(filePath);
  });
  electron.ipcMain.handle("select-encounter-file", async (_event, directoryPath) => {
    const mainWindow2 = getMainWindow();
    if (!mainWindow2) return null;
    const result = await electron.dialog.showOpenDialog(mainWindow2, {
      properties: ["openFile"],
      defaultPath: directoryPath,
      filters: [
        { name: "Encounter Files", extensions: ["json"] },
        { name: "All Files", extensions: ["*"] }
      ]
    });
    if (!result.canceled && result.filePaths.length > 0) {
      return result.filePaths[0];
    }
    return null;
  });
  electron.ipcMain.handle("get-encounter-files", async (_event, directoryPath) => {
    return await getEncounterFiles(directoryPath);
  });
  electron.ipcMain.handle("save-initiative-data", async (_event, directoryPath, initiativeData) => {
    return await saveInitiativeData(directoryPath, initiativeData);
  });
  electron.ipcMain.handle("load-initiative-data", async (_event, directoryPath) => {
    return await loadInitiativeData(directoryPath);
  });
  electron.ipcMain.handle(
    "save-battlemap-data",
    async (_event, directoryPath, battlemapData, fileName) => {
      return await saveBattlemapData(directoryPath, battlemapData, fileName);
    }
  );
  electron.ipcMain.handle("load-battlemap-data", async (_event, pathToLoad) => {
    return await loadBattlemapData(pathToLoad);
  });
  electron.ipcMain.handle("get-battlemap-files", async (_event, directoryPath) => {
    return await getBattlemapFiles(directoryPath);
  });
  electron.ipcMain.handle("display-battlemap", async (_event, battlemapData) => {
    try {
      const displayWindow2 = getDisplayWindow();
      if (displayWindow2) {
        displayWindow2.webContents.send("display-battlemap", battlemapData);
        console.log("Battlemap sent to display window");
        return { success: true };
      }
      return { success: false, error: "Display window not available" };
    } catch (error) {
      console.error("Error displaying battlemap:", error);
      return { success: false, error: error.message };
    }
  });
  electron.ipcMain.handle("hide-battlemap", async () => {
    try {
      const displayWindow2 = getDisplayWindow();
      if (displayWindow2) {
        displayWindow2.webContents.send("hide-battlemap");
        console.log("Battlemap hidden from display");
        return { success: true };
      }
      return { success: false, error: "Display window not available" };
    } catch (error) {
      console.error("Error hiding battlemap:", error);
      return { success: false, error: error.message };
    }
  });
}
function registerMediaProtocol() {
  electron.protocol.registerFileProtocol("media", (request, callback) => {
    const url = request.url.substring("media://".length);
    try {
      const decodedPath = decodeURIComponent(url);
      const normalizedPath = path.normalize(decodedPath);
      if (!fs.existsSync(normalizedPath)) {
        console.error(`Media file not found: ${normalizedPath}`);
        callback({ error: -6 });
        return;
      }
      callback({ path: normalizedPath });
    } catch (error) {
      console.error("Error serving media file:", error);
      callback({ error: -2 });
    }
  });
}
function registerAppEventListeners() {
  electron.app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
      electron.app.quit();
    }
  });
  electron.app.on("activate", () => {
    if (electron.BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
  electron.app.on("browser-window-created", (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });
}
async function initialize() {
  electronApp.setAppUserModelId("com.dd-helper");
  registerMediaProtocol();
  electron.app.on("browser-window-created", (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });
  registerIpcHandlers();
  registerAppEventListeners();
  await loadCachedDirectory();
  createMainWindow();
}
electron.app.whenReady().then(initialize);
