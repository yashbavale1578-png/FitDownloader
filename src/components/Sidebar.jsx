import React from 'react';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: DashboardIcon },
  { id: 'downloads', label: 'Downloads', icon: DownloadIcon },
  { id: 'analytics', label: 'Analytics', icon: ChartIcon },
  { id: 'profile', label: 'Profile', icon: UserIcon },
  { id: 'settings', label: 'Settings', icon: GearIcon },
];

export default function Sidebar({ activePage, setActivePage, downloads }) {
  const activeCount = downloads?.filter(d => d.status === 'downloading').length || 0;

  return (
    <aside style={styles.sidebar}>
      <div style={styles.logo}>
        <img src="/logo.png" alt="FitDownloader" style={{ width: 38, height: 38, objectFit: 'contain', borderRadius: '6px' }} />
      </div>

      <nav style={styles.nav}>
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActivePage(item.id)}
            style={{
              ...styles.navBtn,
              ...(activePage === item.id ? styles.navBtnActive : {}),
            }}
            title={item.label}
          >
            <div style={{
              ...styles.activeIndicator,
              opacity: activePage === item.id ? 1 : 0,
            }} />
            <item.icon active={activePage === item.id} />
            {item.id === 'downloads' && activeCount > 0 && (
              <span style={styles.badge}>{activeCount}</span>
            )}
          </button>
        ))}
      </nav>

      <div style={styles.bottomSection}>
        <div style={styles.versionTag}>v1.0</div>
      </div>
    </aside>
  );
}

// Icon Components
function DashboardIcon({ active }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <rect x="2" y="2" width="7" height="7" rx="2" stroke={active ? '#06b6d4' : '#64748b'} strokeWidth="1.5" fill={active ? 'rgba(6,182,212,0.1)' : 'none'} />
      <rect x="11" y="2" width="7" height="7" rx="2" stroke={active ? '#06b6d4' : '#64748b'} strokeWidth="1.5" fill={active ? 'rgba(6,182,212,0.1)' : 'none'} />
      <rect x="2" y="11" width="7" height="7" rx="2" stroke={active ? '#06b6d4' : '#64748b'} strokeWidth="1.5" fill={active ? 'rgba(6,182,212,0.1)' : 'none'} />
      <rect x="11" y="11" width="7" height="7" rx="2" stroke={active ? '#06b6d4' : '#64748b'} strokeWidth="1.5" fill={active ? 'rgba(6,182,212,0.1)' : 'none'} />
    </svg>
  );
}
function DownloadIcon({ active }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M10 3v10m0 0l-3.5-3.5M10 13l3.5-3.5" stroke={active ? '#06b6d4' : '#64748b'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 15v1a1 1 0 001 1h12a1 1 0 001-1v-1" stroke={active ? '#06b6d4' : '#64748b'} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
function ChartIcon({ active }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <rect x="2" y="10" width="3" height="7" rx="1" fill={active ? '#06b6d4' : '#64748b'} opacity={active ? 1 : 0.6} />
      <rect x="7" y="6" width="3" height="11" rx="1" fill={active ? '#06b6d4' : '#64748b'} opacity={active ? 1 : 0.8} />
      <rect x="12" y="3" width="3" height="14" rx="1" fill={active ? '#06b6d4' : '#64748b'} />
      <rect x="17" y="8" width="1" height="9" rx="0.5" fill={active ? '#06b6d4' : '#64748b'} opacity={active ? 1 : 0.5} />
    </svg>
  );
}
function UserIcon({ active }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="7" r="3.5" stroke={active ? '#06b6d4' : '#64748b'} strokeWidth="1.5" />
      <path d="M3 17.5c0-3 3.134-5.5 7-5.5s7 2.5 7 5.5" stroke={active ? '#06b6d4' : '#64748b'} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
function GearIcon({ active }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="2.5" stroke={active ? '#06b6d4' : '#64748b'} strokeWidth="1.5" />
      <path d="M10 1.5v2M10 16.5v2M1.5 10h2M16.5 10h2M4 4l1.5 1.5M14.5 14.5L16 16M16 4l-1.5 1.5M5.5 14.5L4 16" stroke={active ? '#06b6d4' : '#64748b'} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

const styles = {
  sidebar: {
    width: 'var(--sidebar-width)',
    minWidth: 'var(--sidebar-width)',
    height: '100vh',
    background: 'rgba(10, 14, 26, 0.95)',
    borderRight: '1px solid var(--border-subtle)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    paddingTop: 'var(--titlebar-height)',
    zIndex: 100,
  },
  logo: {
    padding: '16px 0 20px',
    display: 'flex',
    justifyContent: 'center',
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    flex: 1,
    width: '100%',
    padding: '0 10px',
  },
  navBtn: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '52px',
    height: '44px',
    border: 'none',
    borderRadius: '10px',
    background: 'transparent',
    cursor: 'pointer',
    transition: 'all 200ms ease',
    margin: '0 auto',
  },
  navBtnActive: {
    background: 'rgba(6, 182, 212, 0.08)',
  },
  activeIndicator: {
    position: 'absolute',
    left: '-10px',
    width: '3px',
    height: '20px',
    borderRadius: '0 3px 3px 0',
    background: 'var(--accent-gradient)',
    transition: 'opacity 200ms ease',
    boxShadow: '0 0 8px rgba(6,182,212,0.4)',
  },
  badge: {
    position: 'absolute',
    top: '4px',
    right: '4px',
    minWidth: '16px',
    height: '16px',
    borderRadius: '8px',
    background: 'var(--accent-primary)',
    color: 'white',
    fontSize: '10px',
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 4px',
  },
  bottomSection: {
    padding: '16px 0',
  },
  versionTag: {
    fontSize: '10px',
    color: 'var(--text-tertiary)',
    fontWeight: '500',
  },
};
