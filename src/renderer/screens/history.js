// History Screen
class HistoryScreen {
  constructor() {
    this.container = document.getElementById('view-history');
    this.page = 0;
    this.pageSize = 20;
  }

  async render() {
    const user = supabase.getUser();

    this.container.innerHTML = `
      <div class="history-wrapper">
        <div class="history-header">
          <div>
            <h1 class="page-title">📜 Download History</h1>
            <p class="page-subtitle">Your past downloads are saved here</p>
          </div>
          <div class="history-actions">
            <button id="btn-refresh-history" class="btn btn-ghost btn-sm">🔄 Refresh</button>
            ${user ? `<button id="btn-clear-history" class="btn btn-danger btn-sm">🗑️ Clear All</button>` : ''}
          </div>
        </div>

        <div id="history-list" class="history-list">
          <div class="loading-spinner">Loading...</div>
        </div>

        <div id="history-pagination" class="history-pagination" style="display:none;">
          <button id="btn-prev-page" class="btn btn-ghost btn-sm" disabled>← Previous</button>
          <span id="history-page-info" class="page-info">Page 1</span>
          <button id="btn-next-page" class="btn btn-ghost btn-sm">Next →</button>
        </div>

        ${!user ? `
          <div class="history-login-prompt">
            <p>🔒 Login to save your download history in the cloud</p>
          </div>
        ` : ''}
      </div>
    `;

    this.bindEvents();
    await this.loadHistory();
  }

  async loadHistory() {
    const listEl = document.getElementById('history-list');
    const user = supabase.getUser();

    if (!user) {
      listEl.innerHTML = `
        <div class="empty-state">
          <span class="empty-icon">🔒</span>
          <p>Login to view your download history</p>
        </div>
      `;
      return;
    }

    const history = await supabase.getDownloadHistory(this.pageSize, this.page * this.pageSize);

    if (!history || history.length === 0) {
      listEl.innerHTML = `
        <div class="empty-state">
          <span class="empty-icon">📭</span>
          <p>No download history yet. Start downloading!</p>
        </div>
      `;
      return;
    }

    listEl.innerHTML = `
      <div class="history-table">
        <div class="history-table-header">
          <span class="hist-col-status">Status</span>
          <span class="hist-col-name">Filename</span>
          <span class="hist-col-size">Size</span>
          <span class="hist-col-date">Date</span>
        </div>
        ${history.map(item => `
          <div class="history-table-row" data-path="${item.download_path || ''}">
            <span class="hist-col-status">
              <span class="hist-status-badge ${item.status}">${Utils.getStatusIcon(item.status)}</span>
            </span>
            <span class="hist-col-name" title="${item.filename}">${Utils.truncateFilename(item.filename, 40)}</span>
            <span class="hist-col-size">${Utils.formatBytes(item.file_size)}</span>
            <span class="hist-col-date">${Utils.formatDate(item.downloaded_at)}</span>
          </div>
        `).join('')}
      </div>
    `;

    // Show pagination
    if (history.length >= this.pageSize || this.page > 0) {
      document.getElementById('history-pagination').style.display = 'flex';
      document.getElementById('history-page-info').textContent = `Page ${this.page + 1}`;
      document.getElementById('btn-prev-page').disabled = this.page === 0;
      document.getElementById('btn-next-page').disabled = history.length < this.pageSize;
    }

    // Click to open file location
    document.querySelectorAll('.history-table-row[data-path]').forEach(row => {
      row.addEventListener('click', () => {
        const fpath = row.dataset.path;
        if (fpath) window.electronAPI.openFile(fpath);
      });
      row.style.cursor = 'pointer';
    });
  }

  bindEvents() {
    document.getElementById('btn-refresh-history')?.addEventListener('click', () => this.loadHistory());
    
    document.getElementById('btn-clear-history')?.addEventListener('click', async () => {
      if (confirm('Are you sure you want to clear all download history?')) {
        await supabase.clearDownloadHistory();
        await this.loadHistory();
      }
    });

    document.getElementById('btn-prev-page')?.addEventListener('click', () => {
      if (this.page > 0) {
        this.page--;
        this.loadHistory();
      }
    });

    document.getElementById('btn-next-page')?.addEventListener('click', () => {
      this.page++;
      this.loadHistory();
    });
  }
}
