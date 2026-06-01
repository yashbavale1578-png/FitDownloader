import React from 'react';

export default function ProgressBar({ progress = 0, status = 'downloading', size = 'md' }) {
  const height = size === 'sm' ? 4 : size === 'lg' ? 10 : 6;
  const colors = {
    downloading: 'linear-gradient(90deg, #06b6d4, #3b82f6, #06b6d4)',
    complete: 'linear-gradient(90deg, #22c55e, #14b8a6)',
    paused: 'linear-gradient(90deg, #f59e0b, #eab308)',
    error: 'linear-gradient(90deg, #ef4444, #f97316)',
    queued: 'linear-gradient(90deg, #64748b, #94a3b8)',
  };

  return (
    <div style={{ width: '100%', height, background: 'rgba(255,255,255,0.06)', borderRadius: height, overflow: 'hidden', position: 'relative' }}>
      <div style={{
        width: `${Math.min(100, Math.max(0, progress))}%`,
        height: '100%',
        background: colors[status] || colors.downloading,
        backgroundSize: status === 'downloading' ? '200% 100%' : 'auto',
        animation: status === 'downloading' ? 'shimmer 2s linear infinite' : 'none',
        borderRadius: height,
        transition: 'width 300ms ease',
        boxShadow: status === 'downloading' ? '0 0 10px rgba(6,182,212,0.3)' : 'none',
      }} />
    </div>
  );
}
