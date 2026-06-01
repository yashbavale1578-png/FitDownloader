import React from 'react';

const api = window.electronAPI;

export default function TitleBar() {
  return (
    <div style={styles.titleBar}>
      <div style={styles.dragRegion}>
        <span style={styles.appName}>
          <span style={styles.appNameAccent}>Fit</span>Downloader
        </span>
      </div>
      <div style={styles.controls}>
        <button style={styles.controlBtn} onClick={() => api?.minimize()} title="Minimize">
          <svg width="12" height="12" viewBox="0 0 12 12"><rect y="5" width="12" height="1.5" rx="0.75" fill="#94a3b8" /></svg>
        </button>
        <button style={styles.controlBtn} onClick={() => api?.maximize()} title="Maximize">
          <svg width="12" height="12" viewBox="0 0 12 12"><rect x="1" y="1" width="10" height="10" rx="1.5" stroke="#94a3b8" strokeWidth="1.5" fill="none" /></svg>
        </button>
        <button style={{ ...styles.controlBtn, ...styles.closeBtn }} onClick={() => api?.close()} title="Close">
          <svg width="12" height="12" viewBox="0 0 12 12"><path d="M2 2l8 8M10 2l-8 8" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" /></svg>
        </button>
      </div>
    </div>
  );
}

const styles = {
  titleBar: {
    height: 'var(--titlebar-height)',
    minHeight: 'var(--titlebar-height)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: 'rgba(10, 14, 26, 0.8)',
    borderBottom: '1px solid var(--border-subtle)',
    paddingLeft: '16px',
    position: 'relative',
    zIndex: 200,
    WebkitAppRegion: 'drag',
  },
  dragRegion: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
  },
  appName: {
    fontSize: '13px',
    fontWeight: '600',
    color: 'var(--text-secondary)',
    letterSpacing: '0.3px',
  },
  appNameAccent: {
    color: 'var(--accent-primary)',
    fontWeight: '700',
  },
  controls: {
    display: 'flex',
    alignItems: 'center',
    WebkitAppRegion: 'no-drag',
  },
  controlBtn: {
    width: '46px',
    height: 'var(--titlebar-height)',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 150ms',
  },
  closeBtn: {
    // hover handled via CSS or inline
  },
};
