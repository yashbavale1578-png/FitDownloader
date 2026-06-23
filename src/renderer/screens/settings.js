// Settings Screen
class SettingsScreen {
  constructor() {
    this.container = document.getElementById('view-settings');
  }

  async render() {
    const currentFolder = await window.electronAPI.getFolder();
    const validation = await window.electronAPI.validateFolder();
    const settings = await window.electronAPI.getAllSettings();

    this.container.innerHTML = `
      <div class="settings-wrapper">
        <div class="settings-header">
          <h1 class="page-title">⚙️ Settings</h1>
          <p class="page-subtitle">Configure your download preferences</p>
        </div>

        <div class="settings-grid">
          <!-- Download Folder -->
          <div class="settings-card" id="settings-folder-card">
            <div class="settings-card-header">
              <span class="settings-card-icon">📂</span>
              <h3>Download Folder</h3>
            </div>
            <div class="settings-card-body">
              <div class="folder-display">
                <div class="folder-path ${validation.valid ? 'valid' : 'invalid'}">
                  <span class="folder-status">${validation.valid ? '✅' : '⚠️'}</span>
                  <span class="folder-text">${currentFolder || 'No folder selected'}</span>
                </div>
                ${!validation.valid ? `<p class="folder-error">${validation.reason}</p>` : ''}
              </div>
              <div class="folder-actions">
                <button id="btn-select-folder" class="btn btn-primary">
                  📁 ${currentFolder ? 'Change Folder' : 'Select Folder'}
                </button>
                ${currentFolder ? `<button id="btn-open-current-folder" class="btn btn-ghost">Open Folder</button>` : ''}
              </div>
            </div>
          </div>

          <!-- Download Behavior -->
          <div class="settings-card">
            <div class="settings-card-header">
              <span class="settings-card-icon">⚡</span>
              <h3>Download Behavior</h3>
            </div>
            <div class="settings-card-body">
              <div class="setting-row">
                <div class="setting-info">
                  <span class="setting-label">Auto-retry failed downloads</span>
                  <span class="setting-desc">Retry up to 3 times on failure</span>
                </div>
                <label class="toggle">
                  <input type="checkbox" id="setting-autoretry" checked>
                  <span class="toggle-slider"></span>
                </label>
              </div>
              <div class="setting-row">
                <div class="setting-info">
                  <span class="setting-label">Skip duplicate files</span>
                  <span class="setting-desc">Skip files that already exist in folder</span>
                </div>
                <label class="toggle">
                  <input type="checkbox" id="setting-skip-duplicates">
                  <span class="toggle-slider"></span>
                </label>
              </div>
            </div>
          </div>

          <!-- About -->
          <div class="settings-card">
            <div class="settings-card-header">
              <span class="settings-card-icon">💜</span>
              <h3>About FitDownloads</h3>
            </div>
            <div class="settings-card-body">
              <div class="about-info">
                <p><strong>Version:</strong> 1.0.0</p>
                <p><strong>Built by:</strong> Yash Arun Bavale</p>
                <p><strong>Engine:</strong> Electron + Undici</p>
                <p class="about-tagline">Lightning-fast bulk downloads for gamers & developers ⚡</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  bindEvents() {
    document.getElementById('btn-select-folder')?.addEventListener('click', async () => {
      const folder = await window.electronAPI.selectFolder();
      if (folder) {
        this.render(); // Re-render to show new folder
        // Show success notification
        const notif = document.createElement('div');
        notif.className = 'notification notification-success show';
        notif.textContent = `✅ Download folder set to: ${folder}`;
        document.body.appendChild(notif);
        setTimeout(() => {
          notif.classList.remove('show');
          setTimeout(() => notif.remove(), 300);
        }, 3000);
      }
    });

    document.getElementById('btn-open-current-folder')?.addEventListener('click', async () => {
      const folder = await window.electronAPI.getFolder();
      if (folder) window.electronAPI.openFolder(folder);
    });
  }
}
