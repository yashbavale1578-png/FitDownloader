const { dialog } = require('electron');
const fs = require('fs');
const path = require('path');

// Simple JSON-based settings store (replaces electron-store for CJS compatibility)
class SettingsStore {
  constructor(name, defaults = {}) {
    const { app } = require('electron');
    this.path = path.join(app.getPath('userData'), `${name}.json`);
    this.defaults = defaults;
    this.data = { ...defaults };
    this.load();
  }

  load() {
    try {
      if (fs.existsSync(this.path)) {
        const raw = fs.readFileSync(this.path, 'utf-8');
        this.data = { ...this.defaults, ...JSON.parse(raw) };
      }
    } catch (e) {
      this.data = { ...this.defaults };
    }
  }

  save() {
    try {
      const dir = path.dirname(this.path);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(this.path, JSON.stringify(this.data, null, 2));
    } catch (e) {
      console.error('Failed to save settings:', e);
    }
  }

  get(key, defaultValue) {
    return this.data[key] !== undefined ? this.data[key] : defaultValue;
  }

  set(key, value) {
    this.data[key] = value;
    this.save();
  }

  getAll() {
    return { ...this.data };
  }
}

const store = new SettingsStore('fitdownloads-settings', {
  downloadPath: '',
  maxRetries: 3,
  concurrentDownloads: 1
});

class FileManager {
  static async selectFolder(parentWindow) {
    const result = await dialog.showOpenDialog(parentWindow, {
      title: 'Select Download Folder',
      properties: ['openDirectory', 'createDirectory'],
      buttonLabel: 'Select Folder'
    });

    if (!result.canceled && result.filePaths.length > 0) {
      const selectedPath = result.filePaths[0];
      store.set('downloadPath', selectedPath);
      return selectedPath;
    }

    return null;
  }

  static getDownloadPath() {
    return store.get('downloadPath', '');
  }

  static setDownloadPath(folderPath) {
    if (fs.existsSync(folderPath)) {
      store.set('downloadPath', folderPath);
      return true;
    }
    return false;
  }

  static validateDownloadPath() {
    const downloadPath = store.get('downloadPath', '');
    if (!downloadPath) return { valid: false, reason: 'No download folder selected' };
    if (!fs.existsSync(downloadPath)) return { valid: false, reason: 'Folder does not exist' };

    try {
      fs.accessSync(downloadPath, fs.constants.W_OK);
      return { valid: true, path: downloadPath };
    } catch (e) {
      return { valid: false, reason: 'No write permission to folder' };
    }
  }

  static getSetting(key) {
    return store.get(key);
  }

  static setSetting(key, value) {
    store.set(key, value);
  }

  static getAllSettings() {
    return store.getAll();
  }
}

module.exports = { FileManager };
