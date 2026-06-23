// Profile Screen
class ProfileScreen {
  constructor() {
    this.container = document.getElementById('view-profile');
  }

  async render() {
    const user = supabase.getUser();
    
    if (!user) {
      this.container.innerHTML = `
        <div class="profile-wrapper">
          <div class="empty-state">
            <span class="empty-icon">👤</span>
            <p>You are using FitDownloads as a guest</p>
            <button class="btn btn-primary" onclick="navbar.navigateTo('settings')">Go to Settings</button>
          </div>
        </div>
      `;
      return;
    }

    const username = user.user_metadata?.username || user.email?.split('@')[0] || 'User';
    const email = user.email || 'No email';
    const createdAt = user.created_at ? Utils.formatDate(user.created_at) : 'Unknown';
    const downloadCount = await supabase.getDownloadCount();
    const initials = username.substring(0, 2).toUpperCase();

    this.container.innerHTML = `
      <div class="profile-wrapper">
        <div class="profile-header">
          <h1 class="page-title">👤 Profile</h1>
        </div>

        <div class="profile-card">
          <div class="profile-avatar">
            <div class="avatar-circle">
              <span class="avatar-initials">${initials}</span>
            </div>
            <div class="avatar-ring"></div>
          </div>

          <div class="profile-info">
            <h2 class="profile-name">${username}</h2>
            <p class="profile-email">${email}</p>
          </div>

          <div class="profile-stats">
            <div class="profile-stat">
              <span class="profile-stat-value">${downloadCount}</span>
              <span class="profile-stat-label">Downloads</span>
            </div>
            <div class="profile-stat">
              <span class="profile-stat-value">${createdAt}</span>
              <span class="profile-stat-label">Member Since</span>
            </div>
          </div>

          <div class="profile-actions">
            <button id="btn-logout" class="btn btn-danger">🚪 Logout</button>
          </div>
        </div>
      </div>
    `;

    document.getElementById('btn-logout')?.addEventListener('click', async () => {
      if (confirm('Are you sure you want to logout?')) {
        await supabase.signOut();
        document.dispatchEvent(new CustomEvent('auth:logout'));
      }
    });
  }
}
