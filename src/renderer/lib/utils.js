// Utility functions for FitDownloads

const Utils = {
  formatBytes(bytes, decimals = 2) {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
  },

  formatSpeed(bytesPerSecond) {
    if (!bytesPerSecond || bytesPerSecond === 0) return '0 B/s';
    return Utils.formatBytes(bytesPerSecond) + '/s';
  },

  formatTime(seconds) {
    if (!seconds || seconds === 0 || !isFinite(seconds)) return '--:--';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  },

  formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  parseUrls(text) {
    if (!text || !text.trim()) return [];
    
    const lines = text.split(/[\n\r]+/);
    const urls = [];
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      
      // Basic URL validation
      try {
        const url = new URL(trimmed);
        if (url.protocol === 'http:' || url.protocol === 'https:') {
          urls.push(trimmed);
        }
      } catch (e) {
        // If it doesn't start with http, try adding it
        if (!trimmed.startsWith('http')) {
          try {
            new URL('https://' + trimmed);
            urls.push('https://' + trimmed);
          } catch (e2) {
            // Not a valid URL, skip
          }
        }
      }
    }
    
    return [...new Set(urls)]; // Remove duplicates
  },

  truncateFilename(filename, maxLength = 40) {
    if (!filename || filename.length <= maxLength) return filename;
    const ext = filename.lastIndexOf('.');
    if (ext > 0) {
      const name = filename.substring(0, ext);
      const extension = filename.substring(ext);
      const maxName = maxLength - extension.length - 3;
      return name.substring(0, maxName) + '...' + extension;
    }
    return filename.substring(0, maxLength - 3) + '...';
  },

  getStatusIcon(status) {
    switch (status) {
      case 'pending': return '⏳';
      case 'downloading': return '⬇️';
      case 'completed': return '✅';
      case 'failed': return '❌';
      case 'cancelled': return '🚫';
      default: return '❓';
    }
  },

  getStatusColor(status) {
    switch (status) {
      case 'pending': return 'var(--color-text-dim)';
      case 'downloading': return 'var(--color-primary)';
      case 'completed': return 'var(--color-success)';
      case 'failed': return 'var(--color-error)';
      case 'cancelled': return 'var(--color-warning)';
      default: return 'var(--color-text-dim)';
    }
  },

  debounce(fn, delay = 200) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  },

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
};
