const { ipcMain, shell } = require('electron');
const { QueueManager } = require('./queueManager');
const { FileManager } = require('./fileManager');

let queueManager = null;

function setupIpcHandlers(mainWindow) {
  queueManager = new QueueManager();

  // Forward all queue events to renderer
  const forwardEvents = [
    'download:started', 'download:progress', 'download:completed',
    'download:failed', 'download:retry',
    'download:extracting', 'download:extracted', 'download:warning',
    'queue:started', 'queue:updated', 'queue:item-started',
    'queue:finished', 'queue:paused', 'queue:resumed', 'queue:cancelled'
  ];

  forwardEvents.forEach(event => {
    queueManager.on(event, (data) => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send(event, data);
      }
    });
  });

  // === Download Controls ===
  ipcMain.handle('download:add-urls', async (event, urls) => {
    return queueManager.addUrls(urls);
  });

  ipcMain.handle('download:start', async () => {
    const validation = FileManager.validateDownloadPath();
    if (!validation.valid) {
      return { success: false, error: validation.reason };
    }

    // Don't await - let it process in background
    queueManager.startProcessing(validation.path).catch(err => {
      console.error('Queue processing error:', err);
    });

    return { success: true, path: validation.path };
  });

  ipcMain.handle('download:pause', async () => {
    queueManager.pause();
    return { success: true };
  });

  ipcMain.handle('download:resume', async () => {
    queueManager.resume();
    return { success: true };
  });

  ipcMain.handle('download:cancel', async () => {
    queueManager.cancel();
    return { success: true };
  });

  ipcMain.handle('download:clear', async () => {
    queueManager.clearQueue();
    return { success: true };
  });

  ipcMain.handle('download:get-status', async () => {
    return queueManager.getQueueStatus();
  });

  // === Settings / File Manager ===
  ipcMain.handle('settings:select-folder', async () => {
    const folder = await FileManager.selectFolder(mainWindow);
    return folder;
  });

  ipcMain.handle('settings:get-folder', async () => {
    return FileManager.getDownloadPath();
  });

  ipcMain.handle('settings:validate-folder', async () => {
    return FileManager.validateDownloadPath();
  });

  ipcMain.handle('settings:get-all', async () => {
    return FileManager.getAllSettings();
  });

  ipcMain.handle('settings:set', async (event, key, value) => {
    FileManager.setSetting(key, value);
    return { success: true };
  });

  // === System ===
  ipcMain.handle('system:open-folder', async (event, folderPath) => {
    shell.openPath(folderPath);
    return { success: true };
  });

  ipcMain.handle('system:open-file', async (event, filePath) => {
    shell.showItemInFolder(filePath);
    return { success: true };
  });
}

module.exports = { setupIpcHandlers };
