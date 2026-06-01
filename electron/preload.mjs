import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  // Window controls
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),
  isMaximized: () => ipcRenderer.invoke('window-is-maximized'),

  // Link extraction
  extractLinks: (urls) => ipcRenderer.invoke('extract-links', urls),

  // Download management
  queueDownloads: (downloads, savePath) => ipcRenderer.invoke('queue-downloads', downloads, savePath),
  pauseDownload: (id) => ipcRenderer.send('pause-download', id),
  resumeDownload: (id) => ipcRenderer.send('resume-download', id),
  cancelDownload: (id) => ipcRenderer.send('cancel-download', id),
  retryDownload: (id) => ipcRenderer.send('retry-download', id),
  pauseAll: () => ipcRenderer.send('pause-all'),
  resumeAll: () => ipcRenderer.send('resume-all'),
  cancelAll: () => ipcRenderer.send('cancel-all'),
  getActiveDownloads: () => ipcRenderer.invoke('get-active-downloads'),

  // Settings
  getSettings: () => ipcRenderer.invoke('get-settings'),
  setSetting: (key, value) => ipcRenderer.invoke('set-setting', key, value),

  // Profile
  getProfile: () => ipcRenderer.invoke('get-profile'),
  updateProfile: (data) => ipcRenderer.invoke('update-profile', data),

  // Analytics
  getAnalytics: () => ipcRenderer.invoke('get-analytics'),
  getDownloadHistory: (limit) => ipcRenderer.invoke('get-download-history', limit),

  // Dialogs
  pickFolder: () => ipcRenderer.invoke('pick-folder'),
  openFolder: (path) => ipcRenderer.send('open-folder', path),

  // Cleanup
  clearCompleted: () => ipcRenderer.invoke('clear-completed'),

  // Event listeners
  onDownloadProgress: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('download-progress', handler);
    return () => ipcRenderer.removeListener('download-progress', handler);
  },
  onDownloadComplete: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('download-complete', handler);
    return () => ipcRenderer.removeListener('download-complete', handler);
  },
  onDownloadError: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('download-error', handler);
    return () => ipcRenderer.removeListener('download-error', handler);
  },
  onDownloadQueued: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('download-queued', handler);
    return () => ipcRenderer.removeListener('download-queued', handler);
  },
  onDownloadStarted: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('download-started', handler);
    return () => ipcRenderer.removeListener('download-started', handler);
  },
  onDownloadPaused: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('download-paused', handler);
    return () => ipcRenderer.removeListener('download-paused', handler);
  },
  onDownloadResumed: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('download-resumed', handler);
    return () => ipcRenderer.removeListener('download-resumed', handler);
  },
  onDownloadCancelled: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('download-cancelled', handler);
    return () => ipcRenderer.removeListener('download-cancelled', handler);
  },
});
