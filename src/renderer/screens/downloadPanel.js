// Download Panel Screen
class DownloadPanel {
  constructor() {
    this.container = document.getElementById('view-downloads');
    this.isDownloading = false;
    this.isPaused = false;
    this.completedCount = 0;
    this.setupEventListeners();
  }

  render() {
    this.container.innerHTML = `
      <div class="download-wrapper">
        <div class="download-header">
          <h1 class="page-title">⬇️ Download Center</h1>
          <p class="page-subtitle">Paste your links below and let FitDownloads handle the rest</p>
        </div>

        <!-- URL Input Section -->
        <div class="url-input-section" id="url-input-section">
          <div class="url-input-header">
            <h2 class="section-title">Paste URLs</h2>
            <span class="url-count" id="url-count">0 links detected</span>
          </div>
          <textarea 
            id="url-textarea" 
            class="url-textarea" 
            placeholder="Paste your download links here — one per line.&#10;&#10;Example:&#10;https://example.com/file1.zip&#10;https://example.com/file2.rar&#10;https://example.com/file3.exe&#10;&#10;Supports 300-500+ links at once! ⚡"
            rows="10"
          ></textarea>
          <div class="url-actions">
            <button id="btn-clear-urls" class="btn btn-ghost">Clear</button>
            <button id="btn-start-download" class="btn btn-primary btn-glow">
              <span>🚀 START DOWNLOAD</span>
            </button>
          </div>
        </div>

        <!-- Progress Section -->
        <div class="progress-section" id="progress-section" style="display: none;">
          <div class="progress-header">
            <div class="progress-overview">
              <h2 class="section-title">Downloading</h2>
              <div class="progress-stats">
                <span id="dl-completed" class="progress-stat">0</span>
                <span class="progress-stat-sep">/</span>
                <span id="dl-total" class="progress-stat">0</span>
                <span class="progress-stat-label">completed</span>
              </div>
            </div>
            <div class="progress-controls">
              <button id="btn-pause" class="btn btn-ghost btn-sm" title="Pause">⏸️ Pause</button>
              <button id="btn-resume" class="btn btn-ghost btn-sm" title="Resume" style="display:none;">▶️ Resume</button>
              <button id="btn-cancel" class="btn btn-danger btn-sm" title="Cancel">✖ Cancel</button>
            </div>
          </div>

          <!-- Overall Progress -->
          <div class="overall-progress">
            <div class="overall-progress-bar-track">
              <div class="overall-progress-bar-fill" id="overall-progress-bar"></div>
            </div>
            <div class="overall-progress-info">
              <span id="overall-percent">0%</span>
              <span id="overall-speed"></span>
            </div>
          </div>

          <!-- Individual downloads -->
          <div class="download-list" id="download-list"></div>
        </div>

        <!-- Complete Section -->
        <div class="complete-section" id="complete-section" style="display: none;">
          <div class="complete-card">
            <div class="complete-icon">🎉</div>
            <h2 class="complete-title">Downloads Complete!</h2>
            <p class="complete-stats" id="complete-stats"></p>
            <div class="complete-actions">
              <button id="btn-open-downloads" class="btn btn-primary">📂 Open Folder</button>
              <button id="btn-new-batch" class="btn btn-ghost">🔄 New Batch</button>
            </div>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  bindEvents() {
    const textarea = document.getElementById('url-textarea');
    const urlCount = document.getElementById('url-count');

    textarea?.addEventListener('input', Utils.debounce(() => {
      const urls = Utils.parseUrls(textarea.value);
      urlCount.textContent = `${urls.length} link${urls.length !== 1 ? 's' : ''} detected`;
      urlCount.style.color = urls.length > 0 ? 'var(--color-success)' : 'var(--color-text-dim)';
    }, 200));

    document.getElementById('btn-clear-urls')?.addEventListener('click', () => {
      textarea.value = '';
      urlCount.textContent = '0 links detected';
      urlCount.style.color = 'var(--color-text-dim)';
    });

    document.getElementById('btn-start-download')?.addEventListener('click', () => this.startDownload());
    document.getElementById('btn-pause')?.addEventListener('click', () => this.pauseDownload());
    document.getElementById('btn-resume')?.addEventListener('click', () => this.resumeDownload());
    document.getElementById('btn-cancel')?.addEventListener('click', () => this.cancelDownload());
    document.getElementById('btn-open-downloads')?.addEventListener('click', async () => {
      const folder = await window.electronAPI.getFolder();
      if (folder) window.electronAPI.openFolder(folder);
    });
    document.getElementById('btn-new-batch')?.addEventListener('click', () => this.resetToInput());
  }

  async startDownload() {
    const textarea = document.getElementById('url-textarea');
    const urls = Utils.parseUrls(textarea.value);

    if (urls.length === 0) {
      this.showNotification('Please paste at least one valid URL', 'error');
      return;
    }

    // Validate download folder
    const validation = await window.electronAPI.validateFolder();
    if (!validation.valid) {
      this.showNotification('⚠️ ' + validation.reason + '. Go to Settings to set your download folder.', 'error');
      return;
    }

    // Clear previous queue
    await window.electronAPI.clearQueue();

    // Add URLs to queue
    const items = await window.electronAPI.addUrls(urls);

    // Show progress section
    document.getElementById('url-input-section').style.display = 'none';
    document.getElementById('progress-section').style.display = 'block';
    document.getElementById('complete-section').style.display = 'none';

    // Render download cards
    const downloadList = document.getElementById('download-list');
    downloadList.innerHTML = '';
    items.forEach(item => {
      downloadList.appendChild(ProgressCard.create(item));
    });

    document.getElementById('dl-total').textContent = items.length;
    document.getElementById('dl-completed').textContent = '0';
    this.completedCount = 0;
    this.isDownloading = true;

    statusBar.setDownloadStatus(`Downloading 0/${items.length}`);

    // Start download
    const result = await window.electronAPI.startDownload();
    if (!result.success) {
      this.showNotification('Failed to start: ' + result.error, 'error');
    }
  }

  pauseDownload() {
    window.electronAPI.pauseDownload();
    this.isPaused = true;
    document.getElementById('btn-pause').style.display = 'none';
    document.getElementById('btn-resume').style.display = 'inline-flex';
    statusBar.setDownloadStatus('Paused');
  }

  resumeDownload() {
    window.electronAPI.resumeDownload();
    this.isPaused = false;
    document.getElementById('btn-pause').style.display = 'inline-flex';
    document.getElementById('btn-resume').style.display = 'none';
    statusBar.setDownloadStatus('Resuming...');
  }

  cancelDownload() {
    if (confirm('Are you sure you want to cancel all downloads?')) {
      window.electronAPI.cancelDownload();
      this.isDownloading = false;
      statusBar.setDownloadStatus('Cancelled');
    }
  }

  resetToInput() {
    document.getElementById('url-input-section').style.display = 'block';
    document.getElementById('progress-section').style.display = 'none';
    document.getElementById('complete-section').style.display = 'none';
    document.getElementById('url-textarea').value = '';
    document.getElementById('url-count').textContent = '0 links detected';
    this.isDownloading = false;
    this.isPaused = false;
    statusBar.setDownloadStatus('Ready');
  }

  handleDownloadStarted(data) {
    ProgressCard.update(data.id, {
      filename: data.filename,
      totalSize: data.totalSize,
      status: 'downloading'
    });

    // Scroll to the active download
    const card = document.getElementById(`card-${data.id}`);
    if (card) {
      card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  handleDownloadProgress(data) {
    ProgressCard.update(data.id, {
      filename: data.filename,
      downloadedSize: data.downloadedSize,
      totalSize: data.totalSize,
      progress: data.progress,
      speed: data.speed,
      eta: data.eta
    });

    // Update overall speed display
    const speedEl = document.getElementById('overall-speed');
    if (speedEl) speedEl.textContent = Utils.formatSpeed(data.speed);
  }

  handleDownloadCompleted(data) {
    this.completedCount++;
    ProgressCard.update(data.id, {
      filename: data.filename,
      totalSize: data.totalSize,
      status: 'completed',
      progress: 100
    });

    document.getElementById('dl-completed').textContent = this.completedCount;
    const total = parseInt(document.getElementById('dl-total').textContent);
    const percent = Math.round((this.completedCount / total) * 100);
    document.getElementById('overall-progress-bar').style.width = `${percent}%`;
    document.getElementById('overall-percent').textContent = `${percent}%`;

    statusBar.setDownloadStatus(`Downloading ${this.completedCount}/${total}`);

    // Save to Supabase history
    supabase.insertDownloadHistory({
      filename: data.filename,
      url: '',
      file_size: data.totalSize,
      status: 'completed',
      download_path: data.path
    });
  }

  handleDownloadFailed(data) {
    ProgressCard.update(data.id, {
      status: 'failed',
      error: data.error
    });

    supabase.insertDownloadHistory({
      filename: data.url,
      url: data.url,
      file_size: 0,
      status: 'failed',
      download_path: ''
    });
  }

  handleQueueFinished(data) {
    this.isDownloading = false;

    // Show complete section
    document.getElementById('progress-section').style.display = 'none';
    document.getElementById('complete-section').style.display = 'block';

    const statsEl = document.getElementById('complete-stats');
    if (statsEl) {
      statsEl.textContent = `✅ ${data.completed} completed • ❌ ${data.failed} failed • Total: ${data.total}`;
    }

    statusBar.setDownloadStatus(`Done: ${data.completed}/${data.total}`);

    // Update dashboard stats
    if (dashboardScreen) {
      dashboardScreen.updateCompletedCount(data.completed);
      dashboardScreen.updateActiveCount(0);
    }
  }

  showNotification(message, type = 'info') {
    // Create a floating notification
    const notif = document.createElement('div');
    notif.className = `notification notification-${type}`;
    notif.textContent = message;
    document.body.appendChild(notif);

    setTimeout(() => notif.classList.add('show'), 10);
    setTimeout(() => {
      notif.classList.remove('show');
      setTimeout(() => notif.remove(), 300);
    }, 4000);
  }

  handleExtracting(data) {
    ProgressCard.update(data.id, {
      status: 'extracting'
    });
    // Update the card footer to show extraction status
    const card = document.getElementById(`card-${data.id}`);
    if (card) {
      const footer = card.querySelector('.progress-card-footer');
      if (footer) {
        footer.innerHTML = `
          <span class="progress-speed" style="color: var(--color-warning)">🔍 Extracting download link...</span>
          <span class="progress-eta"></span>
        `;
      }
    }
  }

  handleExtracted(data) {
    const card = document.getElementById(`card-${data.id}`);
    if (card) {
      const footer = card.querySelector('.progress-card-footer');
      if (footer) {
        footer.innerHTML = `
          <span class="progress-speed" style="color: var(--color-success)">✅ Found direct link!</span>
          <span class="progress-eta"></span>
        `;
      }
    }
  }

  handleWarning(data) {
    this.showNotification(`⚠️ ${data.message}`, 'error');
  }

  setupEventListeners() {
    if (typeof window.electronAPI !== 'undefined') {
      window.electronAPI.onDownloadStarted((data) => this.handleDownloadStarted(data));
      window.electronAPI.onDownloadProgress((data) => this.handleDownloadProgress(data));
      window.electronAPI.onDownloadCompleted((data) => this.handleDownloadCompleted(data));
      window.electronAPI.onDownloadFailed((data) => this.handleDownloadFailed(data));
      window.electronAPI.onQueueFinished((data) => this.handleQueueFinished(data));
      window.electronAPI.onDownloadExtracting((data) => this.handleExtracting(data));
      window.electronAPI.onDownloadExtracted((data) => this.handleExtracted(data));
      window.electronAPI.onDownloadWarning((data) => this.handleWarning(data));
    }
  }
}
