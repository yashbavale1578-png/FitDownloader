// Progress Card Component
class ProgressCard {
  static create(item) {
    const card = document.createElement('div');
    card.className = `progress-card status-${item.status}`;
    card.id = `card-${item.id}`;

    card.innerHTML = `
      <div class="progress-card-header">
        <span class="progress-status-icon">${Utils.getStatusIcon(item.status)}</span>
        <span class="progress-filename" title="${item.filename || item.url}">
          ${item.filename ? Utils.truncateFilename(item.filename, 50) : Utils.truncateFilename(item.url, 50)}
        </span>
        <span class="progress-size">${item.totalSize ? Utils.formatBytes(item.totalSize) : ''}</span>
      </div>
      <div class="progress-bar-container">
        <div class="progress-bar-track">
          <div class="progress-bar-fill" style="width: ${item.progress || 0}%"></div>
        </div>
        <span class="progress-percent">${Math.round(item.progress || 0)}%</span>
      </div>
      <div class="progress-card-footer">
        <span class="progress-speed">${item.speed ? Utils.formatSpeed(item.speed) : ''}</span>
        <span class="progress-eta">${item.eta ? 'ETA: ' + Utils.formatTime(item.eta) : ''}</span>
      </div>
    `;

    return card;
  }

  static update(itemId, data) {
    const card = document.getElementById(`card-${itemId}`);
    if (!card) return;

    if (data.filename) {
      const filenameEl = card.querySelector('.progress-filename');
      filenameEl.textContent = Utils.truncateFilename(data.filename, 50);
      filenameEl.title = data.filename;
    }

    if (data.totalSize !== undefined) {
      card.querySelector('.progress-size').textContent = Utils.formatBytes(data.totalSize);
    }

    if (data.progress !== undefined) {
      card.querySelector('.progress-bar-fill').style.width = `${data.progress}%`;
      card.querySelector('.progress-percent').textContent = `${Math.round(data.progress)}%`;
    }

    if (data.speed !== undefined) {
      card.querySelector('.progress-speed').textContent = Utils.formatSpeed(data.speed);
    }

    if (data.eta !== undefined) {
      card.querySelector('.progress-eta').textContent = data.eta > 0 ? `ETA: ${Utils.formatTime(data.eta)}` : '';
    }

    if (data.status) {
      card.className = `progress-card status-${data.status}`;
      card.querySelector('.progress-status-icon').textContent = Utils.getStatusIcon(data.status);
      
      if (data.status === 'completed') {
        card.querySelector('.progress-bar-fill').style.width = '100%';
        card.querySelector('.progress-percent').textContent = '100%';
        card.querySelector('.progress-speed').textContent = '';
        card.querySelector('.progress-eta').textContent = 'Done!';
      }
      
      if (data.status === 'failed') {
        card.querySelector('.progress-speed').textContent = '';
        card.querySelector('.progress-eta').textContent = data.error || 'Failed';
      }
    }
  }
}
