const { EventEmitter } = require('events');
const { DownloadManager } = require('./downloadManager');

class QueueManager extends EventEmitter {
  constructor() {
    super();
    this.queue = [];
    this.completedItems = [];
    this.failedItems = [];
    this.isProcessing = false;
    this.isPaused = false;
    this.isCancelled = false;
    this.currentIndex = 0;
    this.downloadManager = new DownloadManager();

    // Forward download events
    this.downloadManager.on('download:started', (data) => this.emit('download:started', data));
    this.downloadManager.on('download:progress', (data) => this.emit('download:progress', data));
    this.downloadManager.on('download:completed', (data) => this.emit('download:completed', data));
    this.downloadManager.on('download:failed', (data) => this.emit('download:failed', data));
    this.downloadManager.on('download:retry', (data) => this.emit('download:retry', data));
    this.downloadManager.on('download:extracting', (data) => this.emit('download:extracting', data));
    this.downloadManager.on('download:extracted', (data) => this.emit('download:extracted', data));
    this.downloadManager.on('download:warning', (data) => this.emit('download:warning', data));
  }

  addUrls(urls) {
    const newItems = urls.map((url, index) => ({
      id: `dl_${Date.now()}_${this.queue.length + index}`,
      url: url.trim(),
      status: 'pending', // pending, downloading, completed, failed, cancelled
      filename: null,
      size: 0,
      progress: 0,
      speed: 0,
      eta: 0,
      error: null,
      addedAt: Date.now()
    }));

    this.queue.push(...newItems);
    this.emit('queue:updated', this.getQueueStatus());
    return newItems;
  }

  async startProcessing(downloadPath) {
    if (this.isProcessing) return;

    this.isProcessing = true;
    this.isCancelled = false;
    this.isPaused = false;
    this.completedItems = [];
    this.failedItems = [];

    this.emit('queue:started', {
      total: this.queue.length
    });

    for (let i = this.currentIndex; i < this.queue.length; i++) {
      if (this.isCancelled) break;

      while (this.isPaused) {
        await new Promise(r => setTimeout(r, 200));
        if (this.isCancelled) break;
      }

      if (this.isCancelled) break;

      const item = this.queue[i];
      item.status = 'downloading';
      this.currentIndex = i;

      this.emit('queue:item-started', {
        index: i,
        total: this.queue.length,
        item
      });

      try {
        const result = await this.downloadManager.downloadFile(
          item.url,
          downloadPath,
          item.id
        );
        
        item.status = 'completed';
        item.filename = result.filename;
        item.size = result.size;
        item.progress = 100;
        item.path = result.path;
        this.completedItems.push(item);

      } catch (error) {
        if (this.isCancelled) {
          item.status = 'cancelled';
        } else {
          item.status = 'failed';
          item.error = error.message;
          this.failedItems.push(item);
        }
      }

      this.emit('queue:updated', this.getQueueStatus());
    }

    this.isProcessing = false;
    this.currentIndex = 0;

    this.emit('queue:finished', {
      total: this.queue.length,
      completed: this.completedItems.length,
      failed: this.failedItems.length,
      cancelled: this.isCancelled
    });
  }

  pause() {
    this.isPaused = true;
    this.emit('queue:paused');
  }

  resume() {
    this.isPaused = false;
    this.emit('queue:resumed');
  }

  cancel() {
    this.isCancelled = true;
    this.downloadManager.cancel();
    
    // Mark remaining pending items as cancelled
    this.queue.forEach(item => {
      if (item.status === 'pending' || item.status === 'downloading') {
        item.status = 'cancelled';
      }
    });

    this.emit('queue:cancelled');
  }

  clearQueue() {
    this.queue = [];
    this.completedItems = [];
    this.failedItems = [];
    this.currentIndex = 0;
    this.isProcessing = false;
    this.isPaused = false;
    this.isCancelled = false;
    this.emit('queue:updated', this.getQueueStatus());
  }

  getQueueStatus() {
    const pending = this.queue.filter(i => i.status === 'pending').length;
    const downloading = this.queue.filter(i => i.status === 'downloading').length;
    const completed = this.queue.filter(i => i.status === 'completed').length;
    const failed = this.queue.filter(i => i.status === 'failed').length;
    const cancelled = this.queue.filter(i => i.status === 'cancelled').length;

    return {
      total: this.queue.length,
      pending,
      downloading,
      completed,
      failed,
      cancelled,
      isProcessing: this.isProcessing,
      isPaused: this.isPaused,
      items: this.queue
    };
  }

  getQueue() {
    return this.queue;
  }
}

module.exports = { QueueManager };
