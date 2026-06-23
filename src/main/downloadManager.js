const { request } = require('undici');
const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');
const { LinkExtractor } = require('./linkExtractor');

class DownloadManager extends EventEmitter {
  constructor() {
    super();
    this.activeDownload = null;
    this.isPaused = false;
    this.isCancelled = false;
    this.activeAbortController = null;
    this.activeResponseBody = null;
    this.activeWriteStream = null;
    this.activeFilePath = null;
  }

  extractFilename(url, headers) {
    // Try Content-Disposition header first
    const disposition = headers?.['content-disposition'];
    if (disposition) {
      // Try filename*= (RFC 5987)
      const starMatch = disposition.match(/filename\*=(?:UTF-8''|utf-8'')([^;\s]+)/i);
      if (starMatch) {
        return decodeURIComponent(starMatch[1].replace(/"/g, ''));
      }
      // Try filename=
      const filenameMatch = disposition.match(/filename=["']?([^"';\n]+)/i);
      if (filenameMatch) {
        return decodeURIComponent(filenameMatch[1].trim().replace(/"/g, ''));
      }
    }

    // Fall back to URL path
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const segments = pathname.split('/').filter(Boolean);
      if (segments.length > 0) {
        const last = decodeURIComponent(segments[segments.length - 1]);
        // Only use if it looks like a filename (has extension)
        if (last.includes('.') && !last.startsWith('.')) {
          return last;
        }
      }
    } catch (e) {
      // ignore
    }

    // Generate a name based on timestamp
    return `download_${Date.now()}`;
  }

  async downloadFile(url, downloadPath, itemId) {
    this.isCancelled = false;
    this.isPaused = false;

    // === STEP 1: Extract real download link if URL is a webpage ===
    this.emit('download:extracting', {
      id: itemId,
      url,
      message: 'Extracting download link...'
    });

    let finalUrl = url;
    let extractionInfo = {};

    try {
      const result = await LinkExtractor.extractDownloadLink(url);
      finalUrl = result.directUrl;
      extractionInfo = result;

      if (result.extracted) {
        this.emit('download:extracted', {
          id: itemId,
          originalUrl: url,
          extractedUrl: finalUrl,
          message: 'Found direct download link!'
        });
      }

      if (result.warning) {
        this.emit('download:warning', {
          id: itemId,
          message: result.warning
        });
      }
    } catch (extractError) {
      // If extraction fails, try the original URL anyway
      this.emit('download:warning', {
        id: itemId,
        message: `Link extraction failed: ${extractError.message}. Trying original URL...`
      });
    }

    // === STEP 2: Download the actual file ===
    let retries = 3;
    let lastError = null;

    while (retries > 0 && !this.isCancelled) {
      try {
        // Create AbortController so we can abort mid-download
        this.activeAbortController = new AbortController();

        const response = await request(finalUrl, {
          method: 'GET',
          maxRedirections: 10,
          headersTimeout: 30000,
          bodyTimeout: 600000, // 10 min timeout for large files
          signal: this.activeAbortController.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
            'Accept': '*/*',
            'Accept-Encoding': 'identity', // No compression to get accurate content-length
            'Referer': url // Use original URL as referer (important for file hosts)
          }
        });

        if (response.statusCode < 200 || response.statusCode >= 400) {
          // Consume body to prevent undici connection pool leaks
          await response.body.dump();
          throw new Error(`HTTP ${response.statusCode}`);
        }

        // Check if we still got HTML (extraction failed to find the real link)
        const contentType = (response.headers['content-type'] || '').toLowerCase();
        if (contentType.includes('text/html')) {
          // Try to parse this page for a download link as a second attempt
          const htmlBody = await response.body.text();
          const secondTry = LinkExtractor.parseHtmlForDownloadLink(htmlBody, finalUrl);
          
          if (secondTry && secondTry !== finalUrl) {
            finalUrl = secondTry;
            this.emit('download:extracted', {
              id: itemId,
              originalUrl: url,
              extractedUrl: finalUrl,
              message: 'Found download link on second pass!'
            });
            continue; // Retry with new URL
          }
          
          // If still HTML, warn but save anyway (user might want it)
          this.emit('download:warning', {
            id: itemId,
            message: 'Response is HTML — the site may require browser interaction to download.'
          });
        }

        const finalHeaders = {};
        for (const [key, value] of Object.entries(response.headers)) {
          finalHeaders[key.toLowerCase()] = value;
        }

        const filename = this.extractFilename(finalUrl, finalHeaders);
        const totalSize = parseInt(finalHeaders['content-length'] || '0', 10);
        const filePath = path.join(downloadPath, filename);

        // Handle duplicate filenames
        const finalPath = this.getUniqueFilePath(filePath);
        const finalFilename = path.basename(finalPath);

        const writeStream = fs.createWriteStream(finalPath);
        // Store references for cancel
        this.activeResponseBody = response.body;
        this.activeWriteStream = writeStream;
        this.activeFilePath = finalPath;
        let downloadedSize = 0;
        let lastProgressTime = Date.now();
        let lastDownloadedSize = 0;

        this.emit('download:started', {
          id: itemId,
          filename: finalFilename,
          totalSize,
          path: finalPath,
          extracted: extractionInfo.extracted || false
        });

        return new Promise((resolve, reject) => {
          response.body.on('data', (chunk) => {
            if (this.isCancelled) {
              writeStream.destroy();
              response.body.destroy();
              try { fs.unlinkSync(finalPath); } catch (e) {}
              reject(new Error('Download cancelled'));
              return;
            }

            const canContinue = writeStream.write(chunk);
            downloadedSize += chunk.length;

            if (!canContinue) {
              response.body.pause();
              writeStream.once('drain', () => {
                response.body.resume();
              });
            }

            // Throttle progress updates to every 100ms
            const now = Date.now();
            if (now - lastProgressTime >= 100) {
              const elapsed = (now - lastProgressTime) / 1000;
              const speed = (downloadedSize - lastDownloadedSize) / elapsed;
              const progress = totalSize > 0 ? (downloadedSize / totalSize) * 100 : 0;
              const eta = totalSize > 0 && speed > 0 
                ? (totalSize - downloadedSize) / speed 
                : 0;

              this.emit('download:progress', {
                id: itemId,
                filename: finalFilename,
                downloadedSize,
                totalSize,
                progress,
                speed,
                eta
              });

              lastProgressTime = now;
              lastDownloadedSize = downloadedSize;
            }
          });

          response.body.on('end', () => {
            writeStream.end(() => {
              this.emit('download:completed', {
                id: itemId,
                filename: finalFilename,
                totalSize: downloadedSize,
                path: finalPath
              });
              resolve({
                filename: finalFilename,
                size: downloadedSize,
                path: finalPath,
                status: 'completed'
              });
            });
          });

          response.body.on('error', (err) => {
            writeStream.destroy();
            try { fs.unlinkSync(finalPath); } catch (e) {}
            reject(err);
          });

          writeStream.on('error', (err) => {
            response.body.destroy();
            reject(err);
          });
        });

      } catch (error) {
        lastError = error;
        retries--;

        if (this.activeResponseBody) {
          try { this.activeResponseBody.destroy(); } catch (e) {}
          this.activeResponseBody = null;
        }
        if (this.activeWriteStream) {
          try { this.activeWriteStream.destroy(); } catch (e) {}
          this.activeWriteStream = null;
        }

        if (this.isCancelled) {
          throw new Error('Download cancelled');
        }

        if (retries > 0) {
          this.emit('download:retry', {
            id: itemId,
            url: finalUrl,
            retriesLeft: retries,
            error: error.message
          });
          await new Promise(r => setTimeout(r, 2000));
        }
      }
    }

    this.emit('download:failed', {
      id: itemId,
      url,
      error: lastError?.message || 'Unknown error'
    });

    throw lastError || new Error('Download failed after retries');
  }

  getUniqueFilePath(filePath) {
    if (!fs.existsSync(filePath)) return filePath;

    const dir = path.dirname(filePath);
    const ext = path.extname(filePath);
    const base = path.basename(filePath, ext);
    let counter = 1;

    while (fs.existsSync(path.join(dir, `${base} (${counter})${ext}`))) {
      counter++;
    }

    return path.join(dir, `${base} (${counter})${ext}`);
  }

  cancel() {
    this.isCancelled = true;

    // Abort the active HTTP request
    if (this.activeAbortController) {
      try { this.activeAbortController.abort(); } catch (e) {}
      this.activeAbortController = null;
    }

    // Destroy active streams
    if (this.activeResponseBody) {
      try { this.activeResponseBody.destroy(); } catch (e) {}
      this.activeResponseBody = null;
    }

    if (this.activeWriteStream) {
      try { this.activeWriteStream.destroy(); } catch (e) {}
      this.activeWriteStream = null;
    }

    // Clean up partial file
    if (this.activeFilePath) {
      try { fs.unlinkSync(this.activeFilePath); } catch (e) {}
      this.activeFilePath = null;
    }
  }
}

module.exports = { DownloadManager };
