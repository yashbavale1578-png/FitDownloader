import { EventEmitter } from 'events';
import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { app } from 'electron';
import { getDb } from './database.mjs';

/**
 * Download Manager handles queuing, downloading, pausing, resuming, and cancelling downloads.
 * Emits events: progress, complete, error, queued, started, paused, resumed, cancelled
 */
export class DownloadManager extends EventEmitter {
  constructor() {
    super();
    this.queue = new Map(); // id -> download state
    this.activeCount = 0;
    this.maxConcurrent = 5;
    this.defaultSavePath = path.join(app.getPath('downloads'), 'FitDownloader');

    // Ensure default save directory exists
    if (!fs.existsSync(this.defaultSavePath)) {
      fs.mkdirSync(this.defaultSavePath, { recursive: true });
    }
  }

  setMaxConcurrent(n) {
    this.maxConcurrent = Math.max(1, Math.min(10, n));
    this._processQueue();
  }

  /**
   * Queue multiple downloads
   */
  queueMultiple(downloads, savePath) {
    const ids = [];
    for (const dl of downloads) {
      const id = this._generateId();
      const downloadState = {
        id,
        url: dl.directUrl,
        originalUrl: dl.url || dl.directUrl,
        fileName: dl.fileName || this._fileNameFromUrl(dl.directUrl),
        fileSize: dl.fileSize || null,
        savePath: savePath || this.defaultSavePath,
        status: 'queued',
        bytesReceived: 0,
        speed: 0,
        progress: 0,
        startedAt: null,
        completedAt: null,
        error: null,
        request: null,
        stream: null,
        speedSamples: [],
        lastBytesTime: null,
        lastBytes: 0,
      };

      this.queue.set(id, downloadState);

      // Log to database
      const db = getDb();
      db.prepare(`
        INSERT INTO downloads (id, url, fileName, fileSize, status, savePath, startedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(id, downloadState.originalUrl, downloadState.fileName, downloadState.fileSize, 'queued', downloadState.savePath, null);

      this.emit('queued', this._sanitizeState(downloadState));
      ids.push(id);
    }

    this._processQueue();
    return ids;
  }

  /**
   * Pause a specific download
   */
  pause(id) {
    const dl = this.queue.get(id);
    if (!dl || dl.status !== 'downloading') return;

    dl.status = 'paused';
    if (dl.request) {
      dl.request.destroy();
      dl.request = null;
    }
    if (dl.stream) {
      dl.stream.close();
      dl.stream = null;
    }
    this.activeCount--;
    this._updateDb(id, { status: 'paused' });
    this.emit('paused', this._sanitizeState(dl));
    this._processQueue();
  }

  /**
   * Resume a paused download
   */
  resume(id) {
    const dl = this.queue.get(id);
    if (!dl || dl.status !== 'paused') return;

    dl.status = 'queued';
    this._updateDb(id, { status: 'queued' });
    this.emit('resumed', this._sanitizeState(dl));
    this._processQueue();
  }

  /**
   * Cancel a download
   */
  cancel(id) {
    const dl = this.queue.get(id);
    if (!dl) return;

    if (dl.request) {
      dl.request.destroy();
      dl.request = null;
    }
    if (dl.stream) {
      dl.stream.close();
      dl.stream = null;
    }

    if (dl.status === 'downloading') {
      this.activeCount--;
    }

    // Delete partial file
    const filePath = path.join(dl.savePath, dl.fileName);
    if (fs.existsSync(filePath)) {
      try { fs.unlinkSync(filePath); } catch {}
    }

    dl.status = 'cancelled';
    this._updateDb(id, { status: 'cancelled' });
    this.emit('cancelled', this._sanitizeState(dl));
    this.queue.delete(id);
    this._processQueue();
  }

  /**
   * Retry a failed download
   */
  retry(id) {
    const dl = this.queue.get(id);
    if (!dl || (dl.status !== 'error' && dl.status !== 'cancelled')) return;

    dl.status = 'queued';
    dl.bytesReceived = 0;
    dl.speed = 0;
    dl.progress = 0;
    dl.error = null;
    this._updateDb(id, { status: 'queued' });
    this.emit('queued', this._sanitizeState(dl));
    this._processQueue();
  }

  pauseAll() {
    for (const [id, dl] of this.queue) {
      if (dl.status === 'downloading') this.pause(id);
    }
  }

  resumeAll() {
    for (const [id, dl] of this.queue) {
      if (dl.status === 'paused') this.resume(id);
    }
  }

  cancelAll() {
    for (const [id] of this.queue) {
      this.cancel(id);
    }
  }

  getActiveDownloads() {
    const downloads = [];
    for (const dl of this.queue.values()) {
      downloads.push(this._sanitizeState(dl));
    }
    return downloads;
  }

  // --- Internal ---

  _processQueue() {
    if (this.activeCount >= this.maxConcurrent) return;

    for (const [id, dl] of this.queue) {
      if (this.activeCount >= this.maxConcurrent) break;
      if (dl.status === 'queued') {
        this._startDownload(id);
      }
    }
  }

  _startDownload(id) {
    const dl = this.queue.get(id);
    if (!dl) return;

    dl.status = 'downloading';
    dl.startedAt = new Date().toISOString();
    dl.lastBytesTime = Date.now();
    dl.lastBytes = dl.bytesReceived;
    this.activeCount++;
    this._updateDb(id, { status: 'downloading', startedAt: dl.startedAt });
    this.emit('started', this._sanitizeState(dl));

    // Ensure save directory exists
    if (!fs.existsSync(dl.savePath)) {
      fs.mkdirSync(dl.savePath, { recursive: true });
    }

    this._doRequest(id, dl.url, 0);
  }

  /**
   * Perform the actual HTTP request, following redirects recursively.
   */
  _doRequest(id, url, redirectCount) {
    const dl = this.queue.get(id);
    if (!dl || dl.status !== 'downloading') return;

    if (redirectCount > 10) {
      this._handleError(id, 'Too many redirects');
      return;
    }

    const client = url.startsWith('https') ? https : http;

    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': '*/*',
      'Accept-Encoding': 'identity',
      'Connection': 'keep-alive',
      'Referer': 'https://fuckingfast.co/',
    };

    // Support resume via Range header
    const currentFilePath = path.join(dl.savePath, dl.fileName);
    if (dl.bytesReceived > 0 && fs.existsSync(currentFilePath)) {
      headers['Range'] = `bytes=${dl.bytesReceived}-`;
    }

    const req = client.get(url, { headers, timeout: 60000 }, (res) => {
      // Handle redirects — follow them transparently
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        let redirectUrl = res.headers.location;
        if (!redirectUrl.startsWith('http')) {
          try {
            const base = new URL(url);
            redirectUrl = base.origin + redirectUrl;
          } catch {}
        }
        res.resume(); // drain response
        dl.url = redirectUrl;
        this._doRequest(id, redirectUrl, redirectCount + 1);
        return;
      }

      if (res.statusCode !== 200 && res.statusCode !== 206) {
        res.resume();
        this._handleError(id, `HTTP Error ${res.statusCode}`);
        return;
      }

      // Check content-type — reject HTML responses (error pages)
      const contentType = res.headers['content-type'] || '';
      if (contentType.includes('text/html') && !contentType.includes('octet-stream')) {
        res.resume();
        this._handleError(id, 'Server returned an HTML page instead of a file. The download link may be invalid or expired.');
        return;
      }

      // Get total size
      const contentLength = parseInt(res.headers['content-length'], 10);
      if (contentLength && !dl.fileSize) {
        dl.fileSize = contentLength + dl.bytesReceived;
        this._updateDb(id, { fileSize: dl.fileSize });
      }

      // Try to get filename from content-disposition
      const disposition = res.headers['content-disposition'];
      if (disposition) {
        const nameMatch = disposition.match(/filename\*?=\s*(?:UTF-8''|")?([^";\n\r]+)/i);
        if (nameMatch && nameMatch[1]) {
          const newName = decodeURIComponent(nameMatch[1].trim().replace(/^['"]|['"]$/g, ''));
          if (newName && newName !== dl.fileName) {
            dl.fileName = newName;
            this._updateDb(id, { fileName: dl.fileName });
          }
        }
      }

      // Determine final file path (may have changed due to content-disposition)
      const filePath = path.join(dl.savePath, dl.fileName);
      const flags = dl.bytesReceived > 0 ? 'a' : 'w';
      const stream = fs.createWriteStream(filePath, { flags });
      dl.stream = stream;

      res.on('data', (chunk) => {
        dl.bytesReceived += chunk.length;

        // Calculate speed (every 500ms)
        const now = Date.now();
        const elapsed = (now - dl.lastBytesTime) / 1000;
        if (elapsed >= 0.5) {
          dl.speed = (dl.bytesReceived - dl.lastBytes) / elapsed;
          dl.lastBytesTime = now;
          dl.lastBytes = dl.bytesReceived;
        }

        dl.progress = dl.fileSize ? (dl.bytesReceived / dl.fileSize) * 100 : 0;

        this.emit('progress', this._sanitizeState(dl));
      });

      res.on('end', () => {
        stream.end();
        if (dl.status === 'downloading') {
          dl.status = 'complete';
          dl.completedAt = new Date().toISOString();
          dl.progress = 100;
          this.activeCount--;

          // Calculate average speed
          const startTime = new Date(dl.startedAt).getTime();
          const totalTime = (Date.now() - startTime) / 1000;
          const avgSpeed = totalTime > 0 ? dl.bytesReceived / totalTime : 0;

          this._updateDb(id, {
            status: 'complete',
            completedAt: dl.completedAt,
            fileSize: dl.bytesReceived,
            downloadSpeed: Math.round(avgSpeed),
          });

          this.emit('complete', this._sanitizeState(dl));
          this._processQueue();
        }
      });

      res.on('error', (err) => {
        stream.end();
        this._handleError(id, err.message);
      });

      stream.on('error', (err) => {
        this._handleError(id, `Write error: ${err.message}`);
      });
    });

    req.on('error', (err) => {
      this._handleError(id, err.message);
    });

    req.on('timeout', () => {
      req.destroy();
      this._handleError(id, 'Connection timed out');
    });

    dl.request = req;
  }

  _handleError(id, message) {
    const dl = this.queue.get(id);
    if (!dl) return;

    if (dl.status === 'downloading') {
      this.activeCount--;
    }

    dl.status = 'error';
    dl.error = message;

    if (dl.stream) {
      dl.stream.close();
      dl.stream = null;
    }

    this._updateDb(id, { status: 'error' });
    this.emit('error', { ...this._sanitizeState(dl), error: message });
    this._processQueue();
  }

  _updateDb(id, fields) {
    try {
      const db = getDb();
      const sets = [];
      const values = [];
      for (const [key, value] of Object.entries(fields)) {
        sets.push(`${key} = ?`);
        values.push(value);
      }
      values.push(id);
      db.prepare(`UPDATE downloads SET ${sets.join(', ')} WHERE id = ?`).run(...values);
    } catch {}
  }

  _sanitizeState(dl) {
    return {
      id: dl.id,
      url: dl.originalUrl,
      directUrl: dl.url,
      fileName: dl.fileName,
      fileSize: dl.fileSize,
      savePath: dl.savePath,
      status: dl.status,
      bytesReceived: dl.bytesReceived,
      speed: dl.speed,
      progress: dl.progress,
      startedAt: dl.startedAt,
      completedAt: dl.completedAt,
      error: dl.error,
    };
  }

  _generateId() {
    return `dl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  _fileNameFromUrl(url) {
    try {
      const pathname = new URL(url).pathname;
      const parts = pathname.split('/').filter(Boolean);
      const last = parts[parts.length - 1];
      return last ? decodeURIComponent(last) : `download_${Date.now()}.rar`;
    } catch {
      return `download_${Date.now()}.rar`;
    }
  }
}
