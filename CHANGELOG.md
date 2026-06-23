# FitDownloads Changelog

## v1.0.1 — Patch Update (2026-04-09)

### 🐛 Bug Fixes
- **Fixed: Downloads not cancelling** — Cancel button now instantly aborts active downloads using `AbortController`. Previously, cancelling only set a flag but the HTTP stream kept downloading in the background.
- **Fixed: Downloading HTML instead of actual files** — The app was saving the webpage HTML when given file hosting URLs (like FuckingFast). Now it intelligently extracts the real download link from the page before downloading.

### ✨ New Features
- **Smart Link Extraction Engine** — Added `linkExtractor.js` module that detects file hosting pages and extracts actual download URLs:
  - **FuckingFast.co** — Extracts `/dl/TOKEN` from `window.open()` in page JavaScript
  - **GoFile.io** — Uses GoFile API to get direct download links
  - **Pixeldrain.com** — Converts to direct API download URL
  - **Buzzheavier** — Parses page HTML for download links
  - **Generic handler** — Works with most file hosting sites by scanning for download patterns in HTML
- **Extraction Status UI** — Download cards now show:
  - 🔍 "Extracting download link..." while scanning the page
  - ✅ "Found direct link!" when extraction succeeds
  - ⚠️ Warning notifications if extraction fails
- **Proper Referer Headers** — Downloads now send the original page URL as Referer, which is required by most file hosting services
- **Improved Filename Detection** — Better Content-Disposition parsing with RFC 5987 support (`filename*=UTF-8''`)

### 🔧 Technical Changes
- Replaced `electron-store` (ESM-only) with built-in JSON settings store for full CommonJS compatibility
- Added `AbortController` to HTTP requests for instant download cancellation
- Active streams (response body + file write) are now properly destroyed on cancel
- Partial files are automatically cleaned up when downloads are cancelled
- Added `download:extracting`, `download:extracted`, `download:warning` IPC events
- Browser-like User-Agent header for better compatibility with file hosting sites

---

## v1.0.0 — Initial Release (2026-04-09)

### 🎮 Core Features
- Lightning-fast bulk download manager built with Electron 33 + undici
- Paste 300-500+ URLs at once and download sequentially
- Real-time progress tracking with speed (MB/s) and ETA per file
- Pause / Resume / Cancel controls for entire queue
- Custom download folder selection via native OS dialog
- Auto-retry failed downloads (3 attempts with 2s backoff)
- Duplicate filename handling (auto-renames)

### 🔐 Authentication & History
- Supabase email/password authentication (signup + login)
- Skip auth option for guest usage
- Download history saved to Supabase cloud
- Paginated history with status, size, and date
- User profile with download stats

### 🎨 Gaming UI
- Neon cyber theme (cyan, purple, green, pink)
- Custom frameless titlebar with window controls
- Glassmorphic cards with backdrop blur
- Canvas particle background with connected dots
- Glitch text loading animation
- Typewriter intro: "What's up! What's your next download?"
- Expandable sidebar navigation
- Animated progress bars with shimmer gradient
- Status bar with live clock, battery level, network status
- "Made with love by Yash Arun Bavale" footer

### 📦 Platform Support
- Windows (x64) — .exe Setup installer via Squirrel
- Cross-platform ready (Mac/Linux with Electron Forge)
