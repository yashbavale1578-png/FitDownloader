import React, { useState, useEffect } from 'react';

const api = window.electronAPI;

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

const achievements = [
  { id: 'first', label: 'First Download', desc: 'Completed your first download', icon: '🎯', threshold: 1 },
  { id: 'ten', label: 'Getting Started', desc: '10 downloads completed', icon: '🚀', threshold: 10 },
  { id: 'fifty', label: 'Power User', desc: '50 downloads completed', icon: '⚡', threshold: 50 },
  { id: 'hundred', label: 'Century Club', desc: '100 downloads completed', icon: '💯', threshold: 100 },
  { id: 'gb', label: '1GB Club', desc: 'Downloaded over 1 GB', icon: '📦', threshold: null },
  { id: 'tb', label: 'Terabyte Titan', desc: 'Downloaded over 1 TB', icon: '🏆', threshold: null },
];

export default function Profile({ analytics }) {
  const [profile, setProfile] = useState({ username: 'User', avatarPath: '' });
  const [editing, setEditing] = useState(false);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    if (api) api.getProfile().then((p) => { setProfile(p); setNewName(p.username); });
  }, []);

  const handleSave = async () => {
    await api.updateProfile({ username: newName, avatarPath: profile.avatarPath });
    setProfile(prev => ({ ...prev, username: newName }));
    setEditing(false);
  };

  const totalDL = analytics?.totalDownloads || 0;
  const totalSize = analytics?.totalSize || 0;

  const unlockedAchievements = achievements.filter(a => {
    if (a.id === 'gb') return totalSize >= 1024 ** 3;
    if (a.id === 'tb') return totalSize >= 1024 ** 4;
    return a.threshold && totalDL >= a.threshold;
  });

  return (
    <div>
      <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '4px' }}>Profile</h1>
      <p style={{ color: 'var(--text-tertiary)', fontSize: '14px', marginBottom: '28px' }}>Your download identity</p>

      {/* Profile Card */}
      <div className="glass-card" style={styles.profileCard}>
        <div style={styles.avatar}>
          <span style={styles.avatarText}>{profile.username?.[0]?.toUpperCase() || 'U'}</span>
        </div>
        <div style={styles.profileInfo}>
          {editing ? (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input className="input" value={newName} onChange={e => setNewName(e.target.value)} style={{ maxWidth: '200px' }} />
              <button className="btn btn-primary btn-sm" onClick={handleSave}>Save</button>
              <button className="btn btn-ghost btn-sm" onClick={() => { setEditing(false); setNewName(profile.username); }}>Cancel</button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2 style={{ fontSize: '20px' }}>{profile.username}</h2>
              <button className="btn-icon" onClick={() => setEditing(true)} title="Edit name">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M10 1.5l2.5 2.5L4.5 12H2v-2.5L10 1.5z" stroke="#94a3b8" strokeWidth="1.2" strokeLinejoin="round" /></svg>
              </button>
            </div>
          )}
          <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Member since {new Date(profile.createdAt || Date.now()).toLocaleDateString()}</span>
        </div>
      </div>

      {/* Stats Summary */}
      <div style={styles.statsRow}>
        <div className="glass-card" style={styles.statBox}>
          <span style={styles.statLabel}>Total Downloads</span>
          <span style={styles.statValue}>{totalDL}</span>
        </div>
        <div className="glass-card" style={styles.statBox}>
          <span style={styles.statLabel}>Data Downloaded</span>
          <span style={styles.statValue}>{formatBytes(totalSize)}</span>
        </div>
        <div className="glass-card" style={styles.statBox}>
          <span style={styles.statLabel}>Avg Speed</span>
          <span style={styles.statValue}>{formatBytes(analytics?.avgSpeed || 0)}/s</span>
        </div>
      </div>

      {/* Achievements */}
      <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '14px', marginTop: '28px' }}>Achievements</h3>
      <div style={styles.achievementsGrid}>
        {achievements.map(a => {
          const unlocked = unlockedAchievements.some(u => u.id === a.id);
          return (
            <div key={a.id} className="glass-card" style={{ ...styles.achieveCard, opacity: unlocked ? 1 : 0.35 }}>
              <span style={{ fontSize: '28px' }}>{a.icon}</span>
              <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>{a.label}</span>
              <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', textAlign: 'center' }}>{a.desc}</span>
              {unlocked && <span style={styles.unlockedBadge}>✓ Unlocked</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const styles = {
  profileCard: { display: 'flex', alignItems: 'center', gap: '20px', padding: '24px', marginBottom: '20px' },
  avatar: { width: '64px', height: '64px', borderRadius: '50%', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avatarText: { fontSize: '24px', fontWeight: '700', color: 'white' },
  profileInfo: { display: 'flex', flexDirection: 'column', gap: '4px' },
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' },
  statBox: { padding: '18px', display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center', textAlign: 'center' },
  statLabel: { fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px' },
  statValue: { fontSize: '20px', fontWeight: '700' },
  achievementsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' },
  achieveCard: { padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', transition: 'all 300ms ease' },
  unlockedBadge: { fontSize: '10px', fontWeight: '600', color: 'var(--success)', background: 'rgba(34,197,94,0.1)', padding: '2px 8px', borderRadius: '10px', marginTop: '4px' },
};
