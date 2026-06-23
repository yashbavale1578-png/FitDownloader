const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Window controls
  minimizeWindow: () => ipcRenderer.send('window:minimize'),
  maximizeWindow: () => ipcRenderer.send('window:maximize'),
  closeWindow: () => ipcRenderer.send('window:close'),
  isMaximized: () => ipcRenderer.invoke('window:isMaximized'),
  onMaximizedChanged: (callback) => {
    ipcRenderer.on('window:maximized-changed', (_, value) => callback(value));
  },

  // Download controls
  addUrls: (urls) => ipcRenderer.invoke('download:add-urls', urls),
  startDownload: () => ipcRenderer.invoke('download:start'),
  pauseDownload: () => ipcRenderer.invoke('download:pause'),
  resumeDownload: () => ipcRenderer.invoke('download:resume'),
  cancelDownload: () => ipcRenderer.invoke('download:cancel'),
  clearQueue: () => ipcRenderer.invoke('download:clear'),
  getDownloadStatus: () => ipcRenderer.invoke('download:get-status'),

  // Download events
  onDownloadStarted: (cb) => ipcRenderer.on('download:started', (_, d) => cb(d)),
  onDownloadProgress: (cb) => ipcRenderer.on('download:progress', (_, d) => cb(d)),
  onDownloadCompleted: (cb) => ipcRenderer.on('download:completed', (_, d) => cb(d)),
  onDownloadFailed: (cb) => ipcRenderer.on('download:failed', (_, d) => cb(d)),
  onDownloadRetry: (cb) => ipcRenderer.on('download:retry', (_, d) => cb(d)),
  onDownloadExtracting: (cb) => ipcRenderer.on('download:extracting', (_, d) => cb(d)),
  onDownloadExtracted: (cb) => ipcRenderer.on('download:extracted', (_, d) => cb(d)),
  onDownloadWarning: (cb) => ipcRenderer.on('download:warning', (_, d) => cb(d)),

  // Queue events
  onQueueStarted: (cb) => ipcRenderer.on('queue:started', (_, d) => cb(d)),
  onQueueUpdated: (cb) => ipcRenderer.on('queue:updated', (_, d) => cb(d)),
  onQueueItemStarted: (cb) => ipcRenderer.on('queue:item-started', (_, d) => cb(d)),
  onQueueFinished: (cb) => ipcRenderer.on('queue:finished', (_, d) => cb(d)),
  onQueuePaused: (cb) => ipcRenderer.on('queue:paused', (_, d) => cb(d)),
  onQueueResumed: (cb) => ipcRenderer.on('queue:resumed', (_, d) => cb(d)),
  onQueueCancelled: (cb) => ipcRenderer.on('queue:cancelled', (_, d) => cb(d)),

  // Settings
  selectFolder: () => ipcRenderer.invoke('settings:select-folder'),
  getFolder: () => ipcRenderer.invoke('settings:get-folder'),
  validateFolder: () => ipcRenderer.invoke('settings:validate-folder'),
  getAllSettings: () => ipcRenderer.invoke('settings:get-all'),
  setSetting: (key, value) => ipcRenderer.invoke('settings:set', key, value),

  // System
  openFolder: (path) => ipcRenderer.invoke('system:open-folder', path),
  openFile: (path) => ipcRenderer.invoke('system:open-file', path)
});
