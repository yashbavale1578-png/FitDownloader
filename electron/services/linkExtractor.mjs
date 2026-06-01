import https from 'https';
import http from 'http';
import * as cheerio from 'cheerio';

/**
 * Extracts the direct download link from a FuckingFast.co landing page.
 *
 * FuckingFast pages embed the real download URL (fuckingfast.co/dl/...)
 * inside <script> tags. This function fetches the HTML and extracts it
 * using the same regex approach as proven community tools.
 *
 * @param {string} landingUrl - The FuckingFast landing page URL
 * @returns {Promise<{directUrl: string, fileName: string, fileSize: number|null}>}
 */
export async function extractDirectLink(landingUrl) {
  if (!landingUrl || typeof landingUrl !== 'string') {
    throw new Error('Invalid URL provided');
  }

  let url = landingUrl.trim();
  if (!url.startsWith('http')) {
    url = 'https://' + url;
  }

  try {
    const html = await fetchPage(url);
    const result = parseDownloadPage(html, url);
    if (!result.directUrl || result.directUrl === url) {
      throw new Error('Could not extract direct download link from the page');
    }
    return result;
  } catch (err) {
    throw new Error(`Failed to extract link from ${url}: ${err.message}`);
  }
}

/**
 * Fetches the HTML content of a page with proper headers to simulate a browser.
 * Follows redirects automatically.
 */
function fetchPage(url, redirectCount = 0) {
  if (redirectCount > 5) {
    return Promise.reject(new Error('Too many redirects'));
  }

  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;

    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'identity',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
      timeout: 30000,
    };

    const req = client.get(url, options, (res) => {
      // Handle redirects
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        let redirectUrl = res.headers.location;
        if (!redirectUrl.startsWith('http')) {
          const base = new URL(url);
          redirectUrl = base.origin + redirectUrl;
        }
        res.resume(); // consume response to free memory
        fetchPage(redirectUrl, redirectCount + 1).then(resolve).catch(reject);
        return;
      }

      if (res.statusCode !== 200) {
        res.resume();
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }

      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve(data));
      res.on('error', reject);
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timed out'));
    });
  });
}

/**
 * Parses the FuckingFast download page HTML to extract the direct download URL.
 * Uses the proven regex approach: looks for fuckingfast.co/dl/... in script tags.
 */
function parseDownloadPage(html, originalUrl) {
  const $ = cheerio.load(html);

  let directUrl = null;
  let fileName = null;
  let fileSize = null;

  // ===== PRIMARY STRATEGY: Regex for dl.fuckingfast.co/dl/ links in <script> tags =====
  // The actual direct download URL uses a "dl." subdomain:
  //   https://dl.fuckingfast.co/dl/<HASH>
  // It's inside a download() function with window.open()
  $('script').each((i, el) => {
    const scriptContent = $(el).html();
    if (!scriptContent) return;

    // Pattern 1: Match https://dl.fuckingfast.co/dl/... (the REAL format)
    const dlSubdomainMatch = scriptContent.match(/https?:\/\/dl\.fuckingfast\.\w+\/dl\/[A-Za-z0-9_\-]+/);
    if (dlSubdomainMatch) {
      directUrl = dlSubdomainMatch[0];
      return false; // break
    }

    // Pattern 2: Match any subdomain: https://*.fuckingfast.co/dl/...
    const anySubdomainMatch = scriptContent.match(/https?:\/\/[a-z0-9\-]*\.?fuckingfast\.\w+\/dl\/[A-Za-z0-9_\-]+/);
    if (anySubdomainMatch) {
      directUrl = anySubdomainMatch[0];
      return false;
    }

    // Pattern 3: window.open("...fuckingfast.../dl/...") calls
    const windowOpenMatch = scriptContent.match(/window\.open\s*\(\s*["'](https?:\/\/[^"']*fuckingfast[^"']*\/dl\/[^"']+)["']/);
    if (windowOpenMatch) {
      directUrl = windowOpenMatch[1];
      return false;
    }
  });

  // ===== FALLBACK: Scan entire raw HTML for dl links =====
  if (!directUrl) {
    const rawMatch = html.match(/https?:\/\/dl\.fuckingfast\.\w+\/dl\/[A-Za-z0-9_\-]+/);
    if (rawMatch) {
      directUrl = rawMatch[0];
    }
  }

  if (!directUrl) {
    const rawMatch2 = html.match(/https?:\/\/[a-z0-9\-]*\.?fuckingfast\.\w+\/dl\/[A-Za-z0-9_\-]+/);
    if (rawMatch2) {
      directUrl = rawMatch2[0];
    }
  }

  // ===== Extract file name =====
  // Try from URL hash first (e.g. #Forza_Horizon_6_--_fitgirl-repacks.site_--_.part01.rar)
  try {
    const urlObj = new URL(originalUrl);
    if (urlObj.hash && urlObj.hash.length > 1) {
      const hashName = decodeURIComponent(urlObj.hash.slice(1));
      if (hashName.includes('.')) {
        fileName = hashName;
      }
    }
  } catch {}

  // Try from page title
  if (!fileName) {
    const titleText = $('title').text().trim();
    if (titleText && titleText.includes('.')) {
      fileName = titleText;
    }
  }

  // Try from page content
  if (!fileName) {
    const h1Text = $('h1').first().text().trim();
    const fileNameEl = $('.file-name, .filename, [class*="file-info"]').first().text().trim();
    fileName = fileNameEl || extractFileNameFromText(h1Text) || extractFileNameFromUrl(originalUrl);
  }

  // ===== Extract file size =====
  const sizeText = $('.file-size, .filesize, [class*="size"]').first().text();
  if (sizeText) {
    fileSize = parseSizeText(sizeText);
  }

  return {
    directUrl: directUrl || null,
    fileName: fileName || 'unknown_file.rar',
    fileSize,
  };
}

function extractFileNameFromText(text) {
  if (!text) return null;
  const match = text.match(/[\w\-\.]+\.(?:rar|zip|7z|iso|bin|exe|tar\.gz|tar\.bz2)/i);
  return match ? match[0] : null;
}

function extractFileNameFromUrl(url) {
  try {
    const pathname = new URL(url).pathname;
    const segments = pathname.split('/').filter(Boolean);
    const last = segments[segments.length - 1];
    if (last && /\.\w{2,4}$/.test(last)) return decodeURIComponent(last);
    if (last) return decodeURIComponent(last) + '.rar';
    return null;
  } catch {
    return null;
  }
}

function parseSizeText(text) {
  const match = text.match(/([\d.]+)\s*(KB|MB|GB|TB)/i);
  if (!match) return null;
  const num = parseFloat(match[1]);
  const unit = match[2].toUpperCase();
  const multipliers = { KB: 1024, MB: 1024 ** 2, GB: 1024 ** 3, TB: 1024 ** 4 };
  return Math.round(num * (multipliers[unit] || 1));
}
