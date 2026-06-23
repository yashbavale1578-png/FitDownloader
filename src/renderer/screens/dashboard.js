// Dashboard Screen
class DashboardScreen {
  constructor() {
    this.container = document.getElementById('view-dashboard');
    this.stats = {
      totalDownloads: 0,
      activeDownloads: 0,
      completedToday: 0
    };
  }

  async render() {
    const user = supabase.getUser();
    const username = user?.user_metadata?.username || user?.email?.split('@')[0] || 'Gamer';
    const downloadCount = await supabase.getDownloadCount();

    const greetings = [
      `What's up, ${username}! 🎮`,
      `Ready to download, ${username}? ⚡`,
      `Welcome back, ${username}! 🔥`,
      `Let's go, ${username}! 🚀`
    ];
    const greeting = greetings[Math.floor(Math.random() * greetings.length)];

    this.container.innerHTML = `
      <div class="dashboard-wrapper">
        <div class="dashboard-header">
          <h1 class="dashboard-greeting">${greeting}</h1>
          <p class="dashboard-subtitle">Your downloads, your speed, your rules.</p>
        </div>

        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon">📥</div>
            <div class="stat-info">
              <span class="stat-value" id="stat-total">${downloadCount}</span>
              <span class="stat-label">Total Downloads</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">⚡</div>
            <div class="stat-info">
              <span class="stat-value" id="stat-active">0</span>
              <span class="stat-label">Active Now</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">✅</div>
            <div class="stat-info">
              <span class="stat-value" id="stat-completed">0</span>
              <span class="stat-label">Completed Today</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">📂</div>
            <div class="stat-info">
              <span class="stat-value" id="stat-folder" style="font-size: 0.9rem;">--</span>
              <span class="stat-label">Download Folder</span>
            </div>
          </div>
        </div>

        <div class="quick-actions">
          <h2 class="section-title">Quick Actions</h2>
          <div class="actions-grid">
            <button class="action-card" id="action-new-download">
              <div class="action-icon">🚀</div>
              <span class="action-label">New Download</span>
              <span class="action-desc">Paste links & go!</span>
            </button>
            <button class="action-card" id="action-view-history">
              <div class="action-icon">📜</div>
              <span class="action-label">View History</span>
              <span class="action-desc">Past downloads</span>
            </button>
            <button class="action-card" id="action-settings">
              <div class="action-icon">⚙️</div>
              <span class="action-label">Settings</span>
              <span class="action-desc">Configure app</span>
            </button>
            <button class="action-card" id="action-open-folder">
              <div class="action-icon">📁</div>
              <span class="action-label">Open Folder</span>
              <span class="action-desc">Download location</span>
            </button>
          </div>
        </div>

        <div class="recent-section">
          <h2 class="section-title">Recent Downloads</h2>
          <div id="recent-downloads" class="recent-list">
            <div class="empty-state">
              <span class="empty-icon">📭</span>
              <p>No recent downloads yet. Start downloading!</p>
            </div>
          </div>
        </div>
      </div>
    `;

    this.bindActions();
    this.loadFolder();
    this.loadRecentDownloads();
  }

  bindActions() {
    document.getElementById('action-new-download')?.addEventListener('click', () => {
      navbar.navigateTo('downloads');
    });
    document.getElementById('action-view-history')?.addEventListener('click', () => {
      navbar.navigateTo('history');
    });
    document.getElementById('action-settings')?.addEventListener('click', () => {
      navbar.navigateTo('settings');
    });
    document.getElementById('action-open-folder')?.addEventListener('click', async () => {
      const folder = await window.electronAPI.getFolder();
      if (folder) {
        window.electronAPI.openFolder(folder);
      } else {
        navbar.navigateTo('settings');
      }
    });
  }

  async loadFolder() {
    const folder = await window.electronAPI.getFolder();
    const folderEl = document.getElementById('stat-folder');
    if (folderEl) {
      if (folder) {
        const parts = folder.split(/[/\\]/);
        folderEl.textContent = '...' + parts.slice(-2).join('/');
        folderEl.title = folder;
      } else {
        folderEl.textContent = 'Not set';
        folderEl.style.color = 'var(--color-error)';
      }
    }
  }

  async loadRecentDownloads() {
    const recent = await supabase.getDownloadHistory(5, 0);
    const container = document.getElementById('recent-downloads');
    if (!container) return;

    if (!recent || recent.length === 0) return;

    container.innerHTML = recent.map(item => `
      <div class="recent-item">
        <span class="recent-icon">${Utils.getStatusIcon(item.status)}</span>
        <span class="recent-name" title="${item.filename}">${Utils.truncateFilename(item.filename, 35)}</span>
        <span class="recent-size">${Utils.formatBytes(item.file_size)}</span>
        <span class="recent-date">${Utils.formatDate(item.downloaded_at)}</span>
      </div>
    `).join('');
  }

  updateActiveCount(count) {
    const el = document.getElementById('stat-active');
    if (el) el.textContent = count;
  }

  updateCompletedCount(count) {
    const el = document.getElementById('stat-completed');
    if (el) el.textContent = count;
  }
}
