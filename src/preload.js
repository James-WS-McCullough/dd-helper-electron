const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  getCachedDirectory: () => ipcRenderer.invoke('get-cached-directory'),
  scanDirectory: (path) => ipcRenderer.invoke('scan-directory', path),
  openDisplayWindow: () => ipcRenderer.invoke('open-display-window'),
  loadDashboard: () => ipcRenderer.invoke('load-dashboard'),
  displayMedia: (path, type, subtype, displayName) => ipcRenderer.invoke('display-media', path, type, subtype, displayName),
  clearDisplayElement: (elementType, elementPath) => ipcRenderer.invoke('clear-display-element', elementType, elementPath),
  getDisplayState: () => ipcRenderer.invoke('get-display-state'),
  
  // Listen for display window events
  onUpdateDisplay: (callback) => ipcRenderer.on('update-display', callback),
  onDisplayStateUpdated: (callback) => ipcRenderer.on('display-state-updated', callback),
  removeDisplayListeners: () => {
    ipcRenderer.removeAllListeners('update-display');
    ipcRenderer.removeAllListeners('display-state-updated');
  }
});
