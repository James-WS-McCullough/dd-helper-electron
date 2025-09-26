const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  selectDirectory: () => ipcRenderer.invoke("select-directory"),
  getCachedDirectory: () => ipcRenderer.invoke("get-cached-directory"),
  scanDirectory: (path) => ipcRenderer.invoke("scan-directory", path),
  openDisplayWindow: () => ipcRenderer.invoke("open-display-window"),
  loadDashboard: () => ipcRenderer.invoke("load-dashboard"),
  displayMedia: (path, type, subtype, displayName) =>
    ipcRenderer.invoke("display-media", path, type, subtype, displayName),
  clearDisplayElement: (elementType, elementPath) =>
    ipcRenderer.invoke("clear-display-element", elementType, elementPath),
  getDisplayState: () => ipcRenderer.invoke("get-display-state"),

  // Party data methods
  savePartyData: (filePath, partyData) =>
    ipcRenderer.invoke("save-party-data", filePath, partyData),
  loadPartyData: (filePath) => ipcRenderer.invoke("load-party-data", filePath),

  // Encounter data methods
  saveEncounterData: (filePath, encounterData) =>
    ipcRenderer.invoke("save-encounter-data", filePath, encounterData),
  loadEncounterData: (filePath) =>
    ipcRenderer.invoke("load-encounter-data", filePath),
  selectEncounterFile: (directoryPath) =>
    ipcRenderer.invoke("select-encounter-file", directoryPath),
  getEncounterFiles: (directoryPath) =>
    ipcRenderer.invoke("get-encounter-files", directoryPath),

  // Initiative data methods
  saveInitiativeData: (directoryPath, initiativeData) =>
    ipcRenderer.invoke("save-initiative-data", directoryPath, initiativeData),
  loadInitiativeData: (directoryPath) =>
    ipcRenderer.invoke("load-initiative-data", directoryPath),

  // Battlemap data methods
  saveBattlemapData: (directoryPath, battlemapData, fileName) =>
    ipcRenderer.invoke(
      "save-battlemap-data",
      directoryPath,
      battlemapData,
      fileName
    ),
  loadBattlemapData: (directoryPath) =>
    ipcRenderer.invoke("load-battlemap-data", directoryPath),
  getBattlemapFiles: (directoryPath) =>
    ipcRenderer.invoke("get-battlemap-files", directoryPath),

  // Battlemap display methods
  displayBattlemap: (battlemapData) =>
    ipcRenderer.invoke("display-battlemap", battlemapData),
  hideBattlemap: () => ipcRenderer.invoke("hide-battlemap"),

  // Listen for display window events
  onUpdateDisplay: (callback) => ipcRenderer.on("update-display", callback),
  onDisplayStateUpdated: (callback) =>
    ipcRenderer.on("display-state-updated", callback),
  onDisplayBattlemap: (callback) =>
    ipcRenderer.on("display-battlemap", callback),
  onHideBattlemap: (callback) => ipcRenderer.on("hide-battlemap", callback),
  removeDisplayListeners: () => {
    ipcRenderer.removeAllListeners("update-display");
    ipcRenderer.removeAllListeners("display-state-updated");
    ipcRenderer.removeAllListeners("display-battlemap");
    ipcRenderer.removeAllListeners("hide-battlemap");
  },
});
