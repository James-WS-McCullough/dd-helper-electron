"use strict";
const electron = require("electron");
const electronAPI = {
  // ============================================
  // DIRECTORY MANAGEMENT
  // ============================================
  selectDirectory: () => electron.ipcRenderer.invoke("select-directory"),
  getCachedDirectory: () => electron.ipcRenderer.invoke("get-cached-directory"),
  scanDirectory: (directoryPath) => electron.ipcRenderer.invoke("scan-directory", directoryPath),
  // ============================================
  // WINDOW MANAGEMENT
  // ============================================
  openDisplayWindow: () => electron.ipcRenderer.invoke("open-display-window"),
  loadDashboard: () => electron.ipcRenderer.invoke("load-dashboard"),
  // ============================================
  // DISPLAY MEDIA CONTROL
  // ============================================
  displayMedia: (mediaPath, mediaType, mediaSubtype, displayName) => electron.ipcRenderer.invoke("display-media", mediaPath, mediaType, mediaSubtype, displayName),
  clearDisplayElement: (elementType, elementPath) => electron.ipcRenderer.invoke("clear-display-element", elementType, elementPath),
  getDisplayState: () => electron.ipcRenderer.invoke("get-display-state"),
  setFocusedPortrait: (portraitPath) => electron.ipcRenderer.invoke("set-focused-portrait", portraitPath),
  setAudioVolume: (audioType, audioId, volume) => electron.ipcRenderer.invoke("set-audio-volume", audioType, audioId, volume),
  // ============================================
  // PIN BOARD MANAGEMENT
  // ============================================
  savePinBoard: (directoryPath, boardName, pins) => electron.ipcRenderer.invoke("save-pin-board", directoryPath, boardName, pins),
  loadPinBoard: (directoryPath, boardName) => electron.ipcRenderer.invoke("load-pin-board", directoryPath, boardName),
  getAvailablePinBoards: (directoryPath) => electron.ipcRenderer.invoke("get-available-pin-boards", directoryPath),
  // ============================================
  // NOTES MANAGEMENT
  // ============================================
  loadNotes: (directoryPath) => electron.ipcRenderer.invoke("load-notes", directoryPath),
  saveNote: (directoryPath, note) => electron.ipcRenderer.invoke("save-note", directoryPath, note),
  deleteNote: (directoryPath, noteId) => electron.ipcRenderer.invoke("delete-note", directoryPath, noteId),
  // ============================================
  // PARTY DATA MANAGEMENT
  // ============================================
  savePartyData: (filePath, partyData) => electron.ipcRenderer.invoke("save-party-data", filePath, partyData),
  loadPartyData: (filePath) => electron.ipcRenderer.invoke("load-party-data", filePath),
  // ============================================
  // ENCOUNTER MANAGEMENT
  // ============================================
  saveEncounterData: (filePath, encounterData) => electron.ipcRenderer.invoke("save-encounter-data", filePath, encounterData),
  loadEncounterData: (filePath) => electron.ipcRenderer.invoke("load-encounter-data", filePath),
  selectEncounterFile: (directoryPath) => electron.ipcRenderer.invoke("select-encounter-file", directoryPath),
  getEncounterFiles: (directoryPath) => electron.ipcRenderer.invoke("get-encounter-files", directoryPath),
  // ============================================
  // INITIATIVE TRACKING
  // ============================================
  saveInitiativeData: (directoryPath, initiativeData) => electron.ipcRenderer.invoke("save-initiative-data", directoryPath, initiativeData),
  loadInitiativeData: (directoryPath) => electron.ipcRenderer.invoke("load-initiative-data", directoryPath),
  // ============================================
  // BATTLEMAP MANAGEMENT
  // ============================================
  saveBattlemapData: (directoryPath, battlemapData, fileName) => electron.ipcRenderer.invoke("save-battlemap-data", directoryPath, battlemapData, fileName),
  loadBattlemapData: (pathToLoad) => electron.ipcRenderer.invoke("load-battlemap-data", pathToLoad),
  getBattlemapFiles: (directoryPath) => electron.ipcRenderer.invoke("get-battlemap-files", directoryPath),
  displayBattlemap: (battlemapData) => electron.ipcRenderer.invoke("display-battlemap", battlemapData),
  hideBattlemap: () => electron.ipcRenderer.invoke("hide-battlemap"),
  // ============================================
  // EVENT LISTENERS
  // ============================================
  onUpdateDisplay: (callback) => {
    electron.ipcRenderer.on("update-display", callback);
  },
  onDisplayStateUpdated: (callback) => {
    electron.ipcRenderer.on("display-state-updated", callback);
  },
  onDisplayBattlemap: (callback) => {
    electron.ipcRenderer.on("display-battlemap", callback);
  },
  onHideBattlemap: (callback) => {
    electron.ipcRenderer.on("hide-battlemap", callback);
  },
  onSetAudioVolume: (callback) => {
    electron.ipcRenderer.on("set-audio-volume", callback);
  },
  removeDisplayListeners: () => {
    electron.ipcRenderer.removeAllListeners("update-display");
    electron.ipcRenderer.removeAllListeners("display-state-updated");
    electron.ipcRenderer.removeAllListeners("display-battlemap");
    electron.ipcRenderer.removeAllListeners("hide-battlemap");
    electron.ipcRenderer.removeAllListeners("set-audio-volume");
  }
};
if (process.contextIsolated) {
  try {
    electron.contextBridge.exposeInMainWorld("electronAPI", electronAPI);
  } catch (error) {
    console.error("Failed to expose electronAPI:", error);
  }
} else {
  window.electronAPI = electronAPI;
}
