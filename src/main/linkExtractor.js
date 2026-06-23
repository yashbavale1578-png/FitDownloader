const { request } = require('undici');

/**
 * Link Extractor — Detects file hosting pages and extracts actual download links.
 * Has specific handlers for known file hosts (FuckingFast, GoFile, etc.)
 */
class LinkExtractor {

  // Known direct-download Content-Types
  static BINARY_CONTENT_TYPES = [
    'application/octet-stream', 'application/zip', 'application/x-rar',
    'application/x-7z-compressed', 'application/x-tar', 'application/gzip',
    'application/pdf', 'application/x-msdownload', 'application/x-iso9660-image',
    'video/', 'audio/', 'image/'
  ];

  /**
   * Main entry: resolve a URL to its direct download link
   */
  static async extractDownloadLink(url) {
    try {
      const hostname = new URL(url).hostname.toLowerCase();

      // === SITE-SPECIFIC HANDLERS ===
      if (hostname.includes('fuckingfast')) {
        return await this.handleFuckingFast(url);
      }
      if (hostname.includes('gofile')) {
        return await this.handleGoFile(url);
      }
      if (hostname.includes('pixeldrain')) {
        return await this.handlePixeldrain(url);
      }
      if (hostname.includes('buzzheavier')) {
        return await this.handleBuzzheavier(url);
      }

      // === GENERIC HANDLER ===
      return await this.handleGeneric(url);

    } catch (error) {
      return { directUrl: url, extracted: false, error: error.message };
    }
  }

  // ============================================
  // FUCKINGFAST.CO — Specific Handler
  // ============================================
  static async handleFuckingFast(url) {
    const { BrowserWindow } = require('electron');
    return new Promise((resolve) => {
      let resolved = false;

      const win = new BrowserWindow({
        show: false,
        width: 800,
        height: 600,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true
        }
      });

      const cleanup = () => {
        if (!win.isDestroyed()) {
          win.close();
        }
      };

      const timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          cleanup();
          resolve({
            directUrl: url,
            extracted: false,
            warning: 'Timeout while bypassing Cloudflare for FuckingFast.'
          });
        }
      }, 30000);

      win.webContents.on('did-finish-load', async () => {
        if (resolved) return;

        try {
          const html = await win.webContents.executeJavaScript('document.documentElement.outerHTML');

          if (html.includes('Just a moment...') || html.includes('challenge-error-text')) {
            return; // Wait for the Cloudflare challenge to complete and page to reload
          }

          const dlPattern = /window\.open\(\s*["'](https?:\/\/(?:[a-z0-9-]+\.)?fuckingfast\.co\/dl\/[^"']+)["']\s*\)/gi;
          const matches = [];
          let match;
          while ((match = dlPattern.exec(html)) !== null) {
            matches.push(match[1]);
          }

          const downloadLink = matches.find(m => m.includes('/dl/'));

          if (downloadLink) {
            const filenameMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/i) ||
                                  html.match(/filename["\s:=]+["']?([^"'<>\n]+)/i);

            resolved = true;
            clearTimeout(timeout);
            cleanup();
            resolve({
              directUrl: downloadLink,
              extracted: true,
              filename: filenameMatch ? filenameMatch[1].trim() : null,
              referer: url
            });
            return;
          }

          const dlFallback = html.match(/["'](https?:\/\/(?:[a-z0-9-]+\.)?fuckingfast\.co\/dl\/[^"'\s]+)["']/i);
          if (dlFallback) {
            resolved = true;
            clearTimeout(timeout);
            cleanup();
            resolve({ directUrl: dlFallback[1], extracted: true, referer: url });
            return;
          }

          const altPattern = html.match(/["'](\/dl\/[^"'\s]+)["']/i);
          if (altPattern) {
            const baseUrl = new URL(url);
            resolved = true;
            clearTimeout(timeout);
            cleanup();
            resolve({
              directUrl: `${baseUrl.protocol}//${baseUrl.host}${altPattern[1]}`,
              extracted: true,
              referer: url
            });
            return;
          }

          resolved = true;
          clearTimeout(timeout);
          cleanup();
          resolve({
            directUrl: url,
            extracted: false,
            warning: 'Could not extract FuckingFast download link. The file may be expired or requires manual CAPTCHA.'
          });

        } catch (err) {}
      });

      win.loadURL(url, {
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
      });
    });
  }

  // ============================================
  // GOFILE.IO — Specific Handler
  // ============================================
  static async handleGoFile(url) {
    try {
      // GoFile URL: https://gofile.io/d/XXXXX
      const idMatch = url.match(/gofile\.io\/d\/(\w+)/i);
      if (!idMatch) return { directUrl: url, extracted: false };

      const contentId = idMatch[1];

      // GoFile API: get file info
      const apiResponse = await request(`https://api.gofile.io/contents/${contentId}?wt=4fd6sg89d7s6`, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          'Accept': 'application/json'
        }
      });

      const data = await apiResponse.body.json();
      if (data.status === 'ok' && data.data?.children) {
        const files = Object.values(data.data.children);
        if (files.length > 0) {
          const file = files[0];
          return {
            directUrl: file.link || file.directLink,
            extracted: true,
            filename: file.name,
            referer: url
          };
        }
      }

      return { directUrl: url, extracted: false };
    } catch (error) {
      return { directUrl: url, extracted: false, error: error.message };
    }
  }

  // ============================================
  // PIXELDRAIN.COM — Specific Handler
  // ============================================
  static async handlePixeldrain(url) {
    try {
      // Pixeldrain URL: https://pixeldrain.com/u/XXXXX
      const idMatch = url.match(/pixeldrain\.com\/u\/(\w+)/i);
      if (!idMatch) return { directUrl: url, extracted: false };

      const fileId = idMatch[1];
      // Pixeldrain direct download: /api/file/ID?download
      return {
        directUrl: `https://pixeldrain.com/api/file/${fileId}?download`,
        extracted: true,
        referer: url
      };
    } catch (error) {
      return { directUrl: url, extracted: false, error: error.message };
    }
  }

  // ============================================
  // BUZZHEAVIER — Specific Handler
  // ============================================
  static async handleBuzzheavier(url) {
    try {
      const response = await request(url, {
        method: 'GET',
        maxRedirections: 10,
        headersTimeout: 15000,
        bodyTimeout: 30000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html'
        }
      });

      const html = await response.body.text();

      // Look for download links
      const dlMatch = html.match(/href=["']([^"']*\/dl\/[^"']+)["']/i) ||
                       html.match(/["'](https?:\/\/[^"'\s]*buzzheavier[^"'\s]*\/dl\/[^"'\s]+)["']/i);

      if (dlMatch) {
        let link = dlMatch[1];
        if (link.startsWith('/')) {
          const base = new URL(url);
          link = `${base.protocol}//${base.host}${link}`;
        }
        return { directUrl: link, extracted: true, referer: url };
      }

      return await this.handleGeneric(url);
    } catch (error) {
      return { directUrl: url, extracted: false, error: error.message };
    }
  }

  // ============================================
  // GENERIC HANDLER — Works for most sites
  // ============================================
  static async handleGeneric(url) {
    try {
      // Step 1: HEAD request to check Content-Type
      const headResponse = await request(url, {
        method: 'HEAD',
        maxRedirections: 10,
        headersTimeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
        }
      });

      const contentType = (headResponse.headers['content-type'] || '').toLowerCase();
      
      // Consume body to prevent undici connection pool leaks
      await headResponse.body.dump();

      // If NOT HTML, it's a direct download
      if (!contentType.includes('text/html') && !contentType.includes('text/plain')) {
        return { directUrl: url, extracted: false };
      }

      // Step 2: GET the HTML page
      const pageResponse = await request(url, {
        method: 'GET',
        maxRedirections: 10,
        headersTimeout: 15000,
        bodyTimeout: 30000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Referer': url
        }
      });

      const html = await pageResponse.body.text();

      // Step 3: Extract download links from HTML
      const downloadLink = this.parseHtmlForDownloadLink(html, url);

      if (downloadLink) {
        const verified = await this.verifyDownloadLink(downloadLink, url);
        if (verified) {
          return { directUrl: downloadLink, extracted: true, referer: url };
        }
      }

      // Step 4: Look for API endpoints
      const apiLink = this.findApiEndpoint(html, url);
      if (apiLink) {
        const apiResult = await this.tryApiEndpoint(apiLink, url);
        if (apiResult) {
          return { directUrl: apiResult, extracted: true, referer: url };
        }
      }

      return {
        directUrl: url,
        extracted: false,
        warning: 'Could not extract download link. Site may require browser interaction.'
      };

    } catch (error) {
      return { directUrl: url, extracted: false, error: error.message };
    }
  }

  /**
   * Parse HTML for download links using common patterns
   */
  static parseHtmlForDownloadLink(html, sourceUrl) {
    const candidates = [];

    // Patterns to find real download links
    const patterns = [
      // window.open with download URL
      /window\.open\(\s*["'](https?:\/\/[^"']*\/dl\/[^"']+)["']/gi,
      /window\.open\(\s*["'](https?:\/\/[^"']*\/download[^"']+)["']/gi,
      // href with file extensions
      /href=["']([^"']*(?:\.zip|\.rar|\.7z|\.exe|\.msi|\.pkg|\.dmg|\.iso|\.tar\.gz|\.tar\.bz2|\.mp4|\.mkv|\.avi|\.mp3|\.flac|\.pdf|\.apk|\.bin|\.nsp|\.xci)[^"']*)["']/gi,
      // href with download paths
      /href=["']([^"']*\/(?:download|dl|get|fetch|serve)\/[^"']+)["']/gi,
      // data attributes
      /data-(?:href|url|download|link|file)=["']([^"']+)["']/gi,
      // CDN/storage URLs
      /["'](https?:\/\/(?:cdn|storage|files?|media|assets?)\.[^"'\s]+\.[a-z0-9]{2,5})["']/gi,
      // location.href assignments
      /(?:location\.href|location)\s*=\s*["'](https?:\/\/[^"']+)["']/gi,
    ];

    for (const pattern of patterns) {
      pattern.lastIndex = 0;
      let match;
      while ((match = pattern.exec(html)) !== null) {
        let link = match[1].trim();

        // Resolve relative URLs
        if (link.startsWith('/')) {
          try {
            const base = new URL(sourceUrl);
            link = `${base.protocol}//${base.host}${link}`;
          } catch { continue; }
        }

        if (!link.startsWith('http')) continue;
        if (link.includes('javascript:')) continue;
        if (link.includes('.css') || link.includes('.js') || link.includes('favicon')) continue;
        if (link.includes('/login') || link.includes('/signup')) continue;

        candidates.push(link);
      }
    }

    // Deduplicate and score
    const unique = [...new Set(candidates)];
    const scored = unique.map(link => {
      let score = 0;
      if (/\.(zip|rar|7z|exe|iso|mp4|mkv|pdf|apk|tar|gz|bin|nsp|xci)/i.test(link)) score += 10;
      if (/\/(download|dl|get|fetch|serve)\//i.test(link)) score += 5;
      if (/cdn|storage|files?\./i.test(link)) score += 5;
      if (/\/(login|signup|register|about|faq|tos)/i.test(link)) score -= 20;
      return { link, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.length > 0 ? scored[0].link : null;
  }

  /**
   * Verify a link is not HTML (i.e., it's an actual file)
   */
  static async verifyDownloadLink(link, referer) {
    try {
      const response = await request(link, {
        method: 'HEAD',
        maxRedirections: 10,
        headersTimeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': referer
        }
      });
      const contentType = (response.headers['content-type'] || '').toLowerCase();
      
      // Consume body to prevent undici connection pool leaks
      await response.body.dump();
      
      return !contentType.includes('text/html');
    } catch {
      return true; // If HEAD fails, still try downloading
    }
  }

  /**
   * Look for API endpoints in the page source
   */
  static findApiEndpoint(html, sourceUrl) {
    const apiPatterns = [
      /["'](\/api\/[^"']*download[^"']*)["']/gi,
      /["'](\/api\/[^"']*file[^"']*)["']/gi,
      /fetch\(["']([^"']+\/api\/[^"']+)["']/gi,
    ];

    for (const pattern of apiPatterns) {
      pattern.lastIndex = 0;
      const match = pattern.exec(html);
      if (match) {
        let link = match[1];
        if (link.startsWith('/')) {
          try {
            const base = new URL(sourceUrl);
            link = `${base.protocol}//${base.host}${link}`;
          } catch { continue; }
        }
        if (link.startsWith('http')) return link;
      }
    }
    return null;
  }

  /**
   * Try hitting an API endpoint to get a download link
   */
  static async tryApiEndpoint(apiUrl, referer) {
    try {
      const response = await request(apiUrl, {
        method: 'GET',
        maxRedirections: 10,
        headersTimeout: 10000,
        bodyTimeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          'Referer': referer,
          'Accept': 'application/json, */*'
        }
      });

      const contentType = (response.headers['content-type'] || '').toLowerCase();
      if (contentType.includes('application/json')) {
        const json = await response.body.json();
        const url = json.url || json.download_url || json.downloadUrl || json.link ||
                    json.file_url || json.fileUrl || json.data?.url || json.data?.download_url;
        if (url && url.startsWith('http')) return url;
      } else {
        // Consume body to prevent undici connection pool leaks
        await response.body.dump();
      }
    } catch { /* ignore */ }
    return null;
  }
}

module.exports = { LinkExtractor };
