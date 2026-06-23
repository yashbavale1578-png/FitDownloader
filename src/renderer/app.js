// Main App Controller
class App {
  constructor() {
    this.loadingScreen = new LoadingScreen();
    this.loginScreen = new LoginScreen();
    this.dashboardScreen = null;
    this.downloadPanel = null;
    this.settingsScreen = null;
    this.historyScreen = null;
    this.profileScreen = null;
  }

  async init() {
    // Setup titlebar controls
    this.setupTitlebar();

    // Run loading screen
    await this.loadingScreen.show();

    // Check auth state
    const user = supabase.getUser();
    if (user) {
      this.showMainApp();
    } else {
      this.showScreen('login');
    }

    // Auth events
    document.addEventListener('auth:success', (e) => {
      this.showMainApp();
    });

    document.addEventListener('auth:skip', () => {
      this.showMainApp();
    });

    document.addEventListener('auth:logout', () => {
      this.showScreen('login');
    });

    // Screen enter events
    document.addEventListener('screen:enter', (e) => {
      this.onScreenEnter(e.detail);
    });
  }

  setupTitlebar() {
    document.getElementById('btn-minimize')?.addEventListener('click', () => {
      window.electronAPI.minimizeWindow();
    });
    document.getElementById('btn-maximize')?.addEventListener('click', () => {
      window.electronAPI.maximizeWindow();
    });
    document.getElementById('btn-close')?.addEventListener('click', () => {
      window.electronAPI.closeWindow();
    });
  }

  showScreen(screenName) {
    document.querySelectorAll('.screen').forEach(s => {
      s.classList.remove('active');
      s.style.display = 'none';
    });

    const screen = document.getElementById(`screen-${screenName}`);
    if (screen) {
      screen.classList.add('active');
      screen.style.display = 'flex';
    }
  }

  async showMainApp() {
    this.showScreen('main');

    // Initialize all screens
    navbar = new Navbar();
    this.dashboardScreen = new DashboardScreen();
    this.downloadPanel = new DownloadPanel();
    this.settingsScreen = new SettingsScreen();
    this.historyScreen = new HistoryScreen();
    this.profileScreen = new ProfileScreen();

    // Make globally accessible for cross-screen communication
    window.dashboardScreen = this.dashboardScreen;

    // Render initial view
    await this.dashboardScreen.render();
    this.downloadPanel.render();

    // Initially show only dashboard
    navbar.navigateTo('dashboard');
  }

  async onScreenEnter(screenName) {
    switch (screenName) {
      case 'dashboard':
        if (this.dashboardScreen) await this.dashboardScreen.render();
        break;
      case 'downloads':
        // Download panel is already rendered and persistent
        break;
      case 'history':
        if (this.historyScreen) await this.historyScreen.render();
        break;
      case 'settings':
        if (this.settingsScreen) await this.settingsScreen.render();
        break;
      case 'profile':
        if (this.profileScreen) await this.profileScreen.render();
        break;
    }
  }
}

// Global references
let dashboardScreen;

// Start the app
const app = new App();
app.init().catch(console.error);
