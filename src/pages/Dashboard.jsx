import React from 'react';
import StatCard from '../components/StatCard';
import ProgressBar from '../components/ProgressBar';

const api = window.electronAPI;

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function formatSpeed(bps) {
  if (!bps || bps === 0) return '0 B/s';
  return formatBytes(bps) + '/s';
}

function formatETA(bytesRemaining, speed) {
  if (!speed || speed === 0) return '∞';
  const seconds = bytesRemaining / speed;
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`;
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
}

export default function Dashboard({ downloads = [], analytics }) {
  const activeDownloads = downloads.filter(d => d.status === 'downloading');
  const completedDownloads = downloads.filter(d => d.status === 'complete');
  const totalActive = activeDownloads.length;

  return (
    <div>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Dashboard</h1>
          <p style={styles.subtitle}>Monitor your downloads in real-time</p>
        </div>
      </div>

      {/* Stats Row */}
      <div style={styles.statsGrid}>
        <StatCard
          label="Total Downloads"
          value={analytics?.totalDownloads || 0}
          color="#06b6d4"
          delay={0}
          icon={<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 3v10m0 0l-3.5-3.5M10 13l3.5-3.5" stroke="#06b6d4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><path d="M3 15v1a1 1 0 001 1h12a1 1 0 001-1v-1" stroke="#06b6d4" strokeWidth="1.5" strokeLinecap="round" /></svg>}
        />
        <StatCard
          label="Data Downloaded"
          value={formatBytes(analytics?.totalSize || 0)}
          color="#3b82f6"
          delay={80}
          icon={<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="7" stroke="#3b82f6" strokeWidth="1.5" /><path d="M7 10h6M10 7v6" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" /></svg>}
        />
        <StatCard
          label="Avg Speed"
          value={formatSpeed(analytics?.avgSpeed || 0)}
          color="#14b8a6"
          delay={160}
          icon={<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 17l4-6 3 3 7-10" stroke="#14b8a6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
        />
        <StatCard
          label="Active"
          value={totalActive}
          subtitle={totalActive > 0 ? 'Downloading now' : 'Idle'}
          color="#f59e0b"
          delay={240}
          icon={<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="3" fill="#f59e0b" /><circle cx="10" cy="10" r="6" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="3 3"><animateTransform attributeName="transform" type="rotate" from="0 10 10" to="360 10 10" dur="3s" repeatCount="indefinite" /></circle></svg>}
        />
      </div>

      {/* Active Downloads */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="3" fill="#06b6d4"><animate attributeName="opacity" values="1;0.3;1" dur="1.5s" repeatCount="indefinite" /></circle></svg>
          Active Downloads
          {totalActive > 0 && <span style={styles.countBadge}>{totalActive}</span>}
        </h3>

        {activeDownloads.length === 0 ? (
          <div className="empty-state" style={{ padding: '40px 20px' }}>
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none"><circle cx="24" cy="24" r="20" stroke="#1e293b" strokeWidth="2" /><path d="M24 14v14m0 0l-5-5m5 5l5-5" stroke="#334155" strokeWidth="2" strokeLinecap="round" /></svg>
            <h3>No active downloads</h3>
            <p>Go to Downloads tab to add links</p>
          </div>
        ) : (
          <div style={styles.downloadList}>
            {activeDownloads.map((dl) => (
              <div key={dl.id} className="glass-card" style={styles.downloadItem}>
                <div style={styles.dlInfo}>
                  <div style={styles.dlTop}>
                    <span style={styles.dlName}>{dl.fileName}</span>
                    <span style={styles.dlPercent}>{dl.progress?.toFixed(1)}%</span>
                  </div>
                  <ProgressBar progress={dl.progress} status={dl.status} />
                  <div style={styles.dlMeta}>
                    <span>{formatBytes(dl.bytesReceived)} / {dl.fileSize ? formatBytes(dl.fileSize) : '?'}</span>
                    <span>{formatSpeed(dl.speed)}</span>
                    <span>ETA: {dl.fileSize ? formatETA(dl.fileSize - dl.bytesReceived, dl.speed) : '—'}</span>
                  </div>
                </div>
                <div style={styles.dlActions}>
                  <button className="btn-icon" onClick={() => api?.pauseDownload(dl.id)} title="Pause">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="4" y="3" width="3" height="10" rx="1" fill="#94a3b8" /><rect x="9" y="3" width="3" height="10" rx="1" fill="#94a3b8" /></svg>
                  </button>
                  <button className="btn-icon" onClick={() => api?.cancelDownload(dl.id)} title="Cancel">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" /></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Completed */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Recent Activity</h3>
        {completedDownloads.length === 0 && downloads.filter(d => d.status === 'error').length === 0 ? (
          <p style={{ color: 'var(--text-tertiary)', fontSize: '13px' }}>No recent activity</p>
        ) : (
          <div style={styles.recentList}>
            {downloads.filter(d => d.status === 'complete' || d.status === 'error').slice(0, 8).map((dl) => (
              <div key={dl.id} style={styles.recentItem}>
                <div style={{ ...styles.recentDot, background: dl.status === 'complete' ? 'var(--success)' : 'var(--error)' }} />
                <span style={styles.recentName}>{dl.fileName}</span>
                <span style={styles.recentSize}>{formatBytes(dl.fileSize)}</span>
                <span className={`badge ${dl.status === 'complete' ? 'badge-success' : 'badge-error'}`}>
                  {dl.status === 'complete' ? 'Done' : 'Failed'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  header: { marginBottom: '24px' },
  title: { fontSize: '28px', fontWeight: '700', marginBottom: '4px' },
  subtitle: { color: 'var(--text-tertiary)', fontSize: '14px' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px' },
  section: { marginBottom: '28px' },
  sectionTitle: { fontSize: '15px', fontWeight: '600', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' },
  countBadge: { background: 'rgba(6,182,212,0.15)', color: 'var(--accent-primary)', fontSize: '11px', fontWeight: '600', padding: '2px 8px', borderRadius: '10px' },
  downloadList: { display: 'flex', flexDirection: 'column', gap: '10px' },
  downloadItem: { padding: '16px', display: 'flex', alignItems: 'center', gap: '16px' },
  dlInfo: { flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' },
  dlTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  dlName: { fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '400px' },
  dlPercent: { fontSize: '13px', fontWeight: '700', color: 'var(--accent-primary)' },
  dlMeta: { display: 'flex', gap: '20px', fontSize: '11px', color: 'var(--text-tertiary)' },
  dlActions: { display: 'flex', gap: '4px', flexShrink: 0 },
  recentList: { display: 'flex', flexDirection: 'column', gap: '6px' },
  recentItem: { display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-card)' },
  recentDot: { width: '6px', height: '6px', borderRadius: '50%', flexShrink: 0 },
  recentName: { flex: 1, fontSize: '13px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  recentSize: { fontSize: '12px', color: 'var(--text-tertiary)', flexShrink: 0 },
};
