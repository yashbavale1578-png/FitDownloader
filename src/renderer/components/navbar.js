// Navbar Component
class Navbar {
  constructor() {
    this.navItems = document.querySelectorAll('.nav-item');
    this.views = document.querySelectorAll('.view');
    this.currentScreen = 'dashboard';

    this.navItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const screen = item.dataset.screen;
        this.navigateTo(screen);
      });
    });
  }

  navigateTo(screenName) {
    // Update nav items
    this.navItems.forEach(item => {
      item.classList.toggle('active', item.dataset.screen === screenName);
    });

    // Update views
    this.views.forEach(view => {
      const viewName = view.id.replace('view-', '');
      if (viewName === screenName) {
        view.classList.add('active');
        view.style.display = 'block';
        // Trigger screen enter event
        document.dispatchEvent(new CustomEvent('screen:enter', { detail: screenName }));
      } else {
        view.classList.remove('active');
        view.style.display = 'none';
      }
    });

    this.currentScreen = screenName;
  }

  getCurrentScreen() {
    return this.currentScreen;
  }
}

let navbar;
document.addEventListener('DOMContentLoaded', () => {
  // Will be initialized in app.js
});
