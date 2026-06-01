import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDatabase, getDb } from './services/database.mjs';
import { DownloadManager } from './services/downloadManager.mjs';
import { extractDirectLink } from './services/linkExtractor.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;
let downloadManager;

const isDev = !app.isPackaged;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    frame: false,
    transparent: false,
    backgroundColor: '#0a0e1a',
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    icon: path.join(__dirname, '..', 'public', 'logo.png'),
    show: false,
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  await initDatabase();
  downloadManager = new DownloadManager();

  // Forward download events to renderer
  downloadManager.on('progress', (data) => {
    mainWindow?.webContents.send('download-progress', data);
  });
  downloadManager.on('complete', (data) => {
    mainWindow?.webContents.send('download-complete', data);
  });
  downloadManager.on('error', (data) => {
    mainWindow?.webContents.send('download-error', data);
  });
  downloadManager.on('queued', (data) => {
    mainWindow?.webContents.send('download-queued', data);
  });
  downloadManager.on('started', (data) => {
    mainWindow?.webContents.send('download-started', data);
  });
  downloadManager.on('paused', (data) => {
    mainWindow?.webContents.send('download-paused', data);
  });
  downloadManager.on('resumed', (data) => {
    mainWindow?.webContents.send('download-resumed', data);
  });
  downloadManager.on('cancelled', (data) => {
    mainWindow?.webContents.send('download-cancelled', data);
  });

  createWindow();
  registerIpcHandlers();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

function registerIpcHandlers() {
  // Window controls
  ipcMain.on('window-minimize', () => mainWindow?.minimize());
  ipcMain.on('window-maximize', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow?.maximize();
    }
  });
  ipcMain.on('window-close', () => mainWindow?.close());
  ipcMain.handle('window-is-maximized', () => mainWindow?.isMaximized());

  // Extract direct links from FuckingFast URLs
  ipcMain.handle('extract-links', async (event, urls) => {
    const results = [];
    for (const url of urls) {
      try {
        console.log(`[Extractor] Processing: ${url.trim()}`);
        const result = await extractDirectLink(url.trim());
        console.log(`[Extractor] ✓ Found direct URL: ${result.directUrl}`);
        console.log(`[Extractor]   File: ${result.fileName}`);
        results.push({ url: url.trim(), ...result, status: 'success' });
      } catch (err) {
        console.error(`[Extractor] ✗ Failed: ${err.message}`);
        results.push({ url: url.trim(), error: err.message, status: 'error' });
      }
    }
    return results;
  });

  // Queue downloads
  ipcMain.handle('queue-downloads', async (event, downloads, savePath) => {
    return downloadManager.queueMultiple(downloads, savePath);
  });

  // Download controls
  ipcMain.on('pause-download', (event, id) => downloadManager.pause(id));
  ipcMain.on('resume-download', (event, id) => downloadManager.resume(id));
  ipcMain.on('cancel-download', (event, id) => downloadManager.cancel(id));
  ipcMain.on('pause-all', () => downloadManager.pauseAll());
  ipcMain.on('resume-all', () => downloadManager.resumeAll());
  ipcMain.on('cancel-all', () => downloadManager.cancelAll());
  ipcMain.on('retry-download', (event, id) => downloadManager.retry(id));

  // Settings
  ipcMain.handle('get-settings', () => {
    const db = getDb();
    const rows = db.prepare('SELECT key, value FROM settings').all();
    const settings = {};
    rows.forEach((r) => (settings[r.key] = JSON.parse(r.value)));
    return settings;
  });

  ipcMain.handle('set-setting', (event, key, value) => {
    const db = getDb();
    db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, JSON.stringify(value));
    if (key === 'maxConcurrent') {
      downloadManager.setMaxConcurrent(value);
    }
    return true;
  });

  // Profile
  ipcMain.handle('get-profile', () => {
    const db = getDb();
    const profile = db.prepare('SELECT * FROM profile WHERE id = 1').get();
    return profile || { id: 1, username: 'User', avatarPath: '', createdAt: new Date().toISOString() };
  });

  ipcMain.handle('update-profile', (event, data) => {
    const db = getDb();
    db.prepare('UPDATE profile SET username = ?, avatarPath = ? WHERE id = 1').run(data.username, data.avatarPath || '');
    return true;
  });

  // Analytics
  ipcMain.handle('get-analytics', () => {
    const db = getDb();
    const totalDownloads = db.prepare('SELECT COUNT(*) as count FROM downloads WHERE status = ?').get('complete');
    const totalSize = db.prepare('SELECT COALESCE(SUM(fileSize), 0) as total FROM downloads WHERE status = ?').get('complete');
    const avgSpeed = db.prepare('SELECT COALESCE(AVG(downloadSpeed), 0) as avg FROM downloads WHERE status = ? AND downloadSpeed > 0').get('complete');
    const dailyDownloads = db.prepare(`
      SELECT DATE(completedAt) as date, COUNT(*) as count, SUM(fileSize) as totalSize
      FROM downloads WHERE status = ? AND completedAt IS NOT NULL
      GROUP BY DATE(completedAt) ORDER BY date DESC LIMIT 30
    `).all('complete');
    const recentDownloads = db.prepare('SELECT * FROM downloads ORDER BY startedAt DESC LIMIT 20').all();
    const failedDownloads = db.prepare('SELECT * FROM downloads WHERE status = ? ORDER BY startedAt DESC').all('error');
    const speedHistory = db.prepare(`
      SELECT DATE(completedAt) as date, AVG(downloadSpeed) as avgSpeed, MAX(downloadSpeed) as maxSpeed
      FROM downloads WHERE status = ? AND completedAt IS NOT NULL AND downloadSpeed > 0
      GROUP BY DATE(completedAt) ORDER BY date DESC LIMIT 7
    `).all('complete');

    return {
      totalDownloads: totalDownloads.count,
      totalSize: totalSize.total,
      avgSpeed: avgSpeed.avg,
      dailyDownloads: dailyDownloads.reverse(),
      recentDownloads,
      failedDownloads,
      speedHistory: speedHistory.reverse(),
    };
  });

  // Download history
  ipcMain.handle('get-download-history', (event, limit = 100) => {
    const db = getDb();
    return db.prepare('SELECT * FROM downloads ORDER BY startedAt DESC LIMIT ?').all(limit);
  });

  // Dialog: pick folder
  ipcMain.handle('pick-folder', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory'],
    });
    return result.canceled ? null : result.filePaths[0];
  });

  // Open folder in file explorer
  ipcMain.on('open-folder', (event, folderPath) => {
    shell.openPath(folderPath);
  });

  // Clear completed downloads from DB
  ipcMain.handle('clear-completed', () => {
    const db = getDb();
    db.prepare("DELETE FROM downloads WHERE status = 'complete'").run();
    return true;
  });

  // Get active downloads state
  ipcMain.handle('get-active-downloads', () => {
    return downloadManager.getActiveDownloads();
  });
}
