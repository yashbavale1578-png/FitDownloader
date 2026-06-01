import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import { app } from 'electron';

let db = null;
let dbPath = '';

/**
 * Initialize the SQLite database with all required tables.
 * Uses sql.js (pure JS, no native compilation needed).
 */
export async function initDatabase() {
  dbPath = path.join(app.getPath('userData'), 'fitdownloader.db');
  const SQL = await initSqlJs();

  // Load existing database or create new
  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  // Create tables
  db.run(`
    CREATE TABLE IF NOT EXISTS downloads (
      id TEXT PRIMARY KEY,
      url TEXT NOT NULL,
      fileName TEXT,
      fileSize INTEGER,
      status TEXT DEFAULT 'queued',
      savePath TEXT,
      startedAt TEXT,
      completedAt TEXT,
      downloadSpeed REAL DEFAULT 0,
      error TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS profile (
      id INTEGER PRIMARY KEY DEFAULT 1,
      username TEXT DEFAULT 'User',
      avatarPath TEXT DEFAULT '',
      createdAt TEXT DEFAULT (datetime('now'))
    )
  `);

  db.run(`CREATE INDEX IF NOT EXISTS idx_downloads_status ON downloads(status)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_downloads_startedAt ON downloads(startedAt)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_downloads_completedAt ON downloads(completedAt)`);

  // Ensure profile row exists
  const profileCount = db.exec('SELECT COUNT(*) as count FROM profile');
  if (!profileCount.length || profileCount[0].values[0][0] === 0) {
    db.run("INSERT INTO profile (id, username, avatarPath) VALUES (1, 'User', '')");
  }

  // Insert default settings if they don't exist
  const defaultSettings = {
    maxConcurrent: 5,
    downloadPath: path.join(app.getPath('downloads'), 'FitDownloader'),
    autoStart: true,
    bandwidthLimit: 0,
    retryAttempts: 3,
    connectionTimeout: 30,
    theme: 'dark',
    accentColor: '#06b6d4',
    notifications: true,
    soundEnabled: false,
  };

  for (const [key, value] of Object.entries(defaultSettings)) {
    const existing = db.exec(`SELECT COUNT(*) FROM settings WHERE key = '${key}'`);
    if (!existing.length || existing[0].values[0][0] === 0) {
      db.run('INSERT INTO settings (key, value) VALUES (?, ?)', [key, JSON.stringify(value)]);
    }
  }

  saveDb();
  return db;
}

/**
 * Save database to disk.
 */
function saveDb() {
  if (!db || !dbPath) return;
  try {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
  } catch {}
}

// Auto-save every 10 seconds
setInterval(() => saveDb(), 10000);

/**
 * Get the database instance. Provides a wrapper with a familiar API.
 */
export function getDb() {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }

  return {
    prepare(sql) {
      return {
        run(...params) {
          db.run(sql, params);
          saveDb();
        },
        get(...params) {
          const result = db.exec(sql, params);
          if (!result.length || !result[0].values.length) return undefined;
          const columns = result[0].columns;
          const values = result[0].values[0];
          const row = {};
          columns.forEach((col, i) => (row[col] = values[i]));
          return row;
        },
        all(...params) {
          const result = db.exec(sql, params);
          if (!result.length) return [];
          const columns = result[0].columns;
          return result[0].values.map(values => {
            const row = {};
            columns.forEach((col, i) => (row[col] = values[i]));
            return row;
          });
        },
      };
    },
    exec(sql) {
      db.run(sql);
      saveDb();
    },
  };
}
