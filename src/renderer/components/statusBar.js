// Status Bar Component - Time, Battery, Network
class StatusBar {
  constructor() {
    this.timeEl = document.getElementById('status-time');
    this.batteryEl = document.getElementById('battery-level');
    this.networkDot = document.querySelector('#status-network .status-dot');
    this.networkText = document.querySelector('#status-network span:last-child');
    this.downloadsStatus = document.querySelector('#status-downloads span');

    this.startClock();
    this.startBattery();
    this.startNetworkMonitor();
  }

  startClock() {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const seconds = now.getSeconds().toString().padStart(2, '0');
      this.timeEl.textContent = `${hours}:${minutes}:${seconds}`;
    };

    updateTime();
    setInterval(updateTime, 1000);
  }

  async startBattery() {
    try {
      if ('getBattery' in navigator) {
        const battery = await navigator.getBattery();
        
        const updateBattery = () => {
          const level = Math.round(battery.level * 100);
          this.batteryEl.textContent = `${level}%`;
          
          if (battery.charging) {
            this.batteryEl.textContent += ' ⚡';
          }
        };

        updateBattery();
        battery.addEventListener('levelchange', updateBattery);
        battery.addEventListener('chargingchange', updateBattery);
      } else {
        this.batteryEl.textContent = 'N/A';
      }
    } catch (e) {
      this.batteryEl.textContent = 'N/A';
    }
  }

  startNetworkMonitor() {
    const updateNetwork = () => {
      if (navigator.onLine) {
        this.networkDot.className = 'status-dot online';
        this.networkText.textContent = 'Online';
      } else {
        this.networkDot.className = 'status-dot offline';
        this.networkText.textContent = 'Offline';
      }
    };

    updateNetwork();
    window.addEventListener('online', updateNetwork);
    window.addEventListener('offline', updateNetwork);
  }

  setDownloadStatus(text) {
    if (this.downloadsStatus) {
      this.downloadsStatus.textContent = text;
    }
  }
}

const statusBar = new StatusBar();
