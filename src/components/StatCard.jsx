import React from 'react';

export default function StatCard({ icon, label, value, subtitle, trend, color = 'var(--accent-primary)', delay = 0 }) {
  return (
    <div className="glass-card" style={{ ...styles.card, animationDelay: `${delay}ms` }}>
      <div style={{ ...styles.iconBox, background: `${color}15` }}>
        {icon || <DefaultIcon color={color} />}
      </div>
      <div style={styles.info}>
        <span style={styles.label}>{label}</span>
        <span style={styles.value}>{value}</span>
        {subtitle && <span style={styles.subtitle}>{subtitle}</span>}
      </div>
      {trend && (
        <div style={{ ...styles.trend, color: trend > 0 ? 'var(--success)' : 'var(--error)' }}>
          {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
        </div>
      )}
      <div style={{ ...styles.glowLine, background: color }} />
    </div>
  );
}

function DefaultIcon({ color }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="7" stroke={color} strokeWidth="1.5" />
      <circle cx="10" cy="10" r="3" fill={color} opacity="0.4" />
    </svg>
  );
}

const styles = {
  card: {
    padding: '20px',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '14px',
    position: 'relative',
    overflow: 'hidden',
    animation: 'slide-in-up 0.4s ease backwards',
  },
  iconBox: {
    width: '42px',
    height: '42px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  info: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    flex: 1,
    minWidth: 0,
  },
  label: {
    fontSize: '12px',
    fontWeight: '500',
    color: 'var(--text-tertiary)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  value: {
    fontSize: '22px',
    fontWeight: '700',
    color: 'var(--text-primary)',
    letterSpacing: '-0.5px',
  },
  subtitle: {
    fontSize: '11px',
    color: 'var(--text-tertiary)',
  },
  trend: {
    fontSize: '12px',
    fontWeight: '600',
    padding: '4px 8px',
    borderRadius: '6px',
    background: 'rgba(255,255,255,0.03)',
  },
  glowLine: {
    position: 'absolute',
    bottom: 0,
    left: '20px',
    right: '20px',
    height: '2px',
    borderRadius: '2px',
    opacity: 0.3,
  },
};
