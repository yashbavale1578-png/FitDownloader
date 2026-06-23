const { app, BrowserWindow, ipcMain, nativeTheme } = require('electron');
const path = require('path');
const { setupIpcHandlers } = require('./ipcHandlers');

// ============================================
// Squirrel.Windows — Handle install/update/uninstall shortcuts
// Creates Desktop + Start Menu shortcuts automatically
// ============================================
if (process.platform === 'win32') {
  const { spawn } = require('child_process');
  const appFolder = path.resolve(process.execPath, '..');
  const rootFolder = path.resolve(appFolder, '..');
  const updateExe = path.join(rootFolder, 'Update.exe');
  const exeName = path.basename(process.execPath);

  const handleSquirrelEvent = () => {
    if (process.argv.length === 1) return false;

    const squirrelEvent = process.argv[1];

    const spawnUpdate = (args) => {
      try {
        return spawn(updateExe, args, { detached: true });
      } catch (e) {
        return null;
      }
    };

    switch (squirrelEvent) {
      case '--squirrel-install':
      case '--squirrel-updated':
        // Create Desktop + Start Menu shortcuts
        spawnUpdate(['--createShortcut', exeName, '--shortcut-locations', 'Desktop,StartMenu']);
        setTimeout(() => app.quit(), 1000);
        return true;

      case '--squirrel-uninstall':
        // Remove shortcuts
        spawnUpdate(['--removeShortcut', exeName]);
        setTimeout(() => app.quit(), 1000);
        return true;

      case '--squirrel-obsolete':
        app.quit();
        return true;
    }
    return false;
  };

  if (handleSquirrelEvent()) {
    // Squirrel handled the event, don't start the app
    return;
  }
}

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1000,
    minHeight: 700,
    frame: false,
    titleBarStyle: 'hidden',
    backgroundColor: '#0a0a0f',
    icon: path.join(__dirname, '../../assets/icons/icon.png'),
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    },
    show: false
  });

  mainWindow.loadFile(path.join(__dirname, '../../index.html'));

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Window control IPC
  ipcMain.on('window:minimize', () => mainWindow?.minimize());
  ipcMain.on('window:maximize', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow?.maximize();
    }
  });
  ipcMain.on('window:close', () => mainWindow?.close());
  ipcMain.handle('window:isMaximized', () => mainWindow?.isMaximized());

  mainWindow.on('maximize', () => {
    mainWindow.webContents.send('window:maximized-changed', true);
  });
  mainWindow.on('unmaximize', () => {
    mainWindow.webContents.send('window:maximized-changed', false);
  });
}

app.whenReady().then(() => {
  nativeTheme.themeSource = 'dark';
  createWindow();
  setupIpcHandlers(mainWindow);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

module.exports = { getMainWindow: () => mainWindow };
