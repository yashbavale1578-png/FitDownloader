import React from 'react';
import CollapsibleSection from '../components/CollapsibleSection';
import Chart from '../components/Chart';

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function formatSpeed(bps) {
  if (!bps) return '0 B/s';
  return formatBytes(bps) + '/s';
}

export default function Analytics({ analytics, refreshAnalytics }) {
  const dailyData = analytics?.dailyDownloads || [];
  const speedData = analytics?.speedHistory || [];
  const recentDownloads = analytics?.recentDownloads || [];
  const failedDownloads = analytics?.failedDownloads || [];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '4px' }}>Analytics</h1>
          <p style={{ color: 'var(--text-tertiary)', fontSize: '14px' }}>Detailed insights into your download activity</p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={refreshAnalytics}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1.5 7a5.5 5.5 0 019.37-3.9M12.5 7a5.5 5.5 0 01-9.37 3.9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /><path d="M11 1v2.5H8.5M3 13v-2.5h2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          Refresh
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Download History */}
        <CollapsibleSection
          title="Download History"
          badge={recentDownloads.length}
          defaultOpen={true}
          icon={<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="2" width="12" height="12" rx="2" stroke="#06b6d4" strokeWidth="1.2" /><path d="M5 6h6M5 8.5h4M5 11h5" stroke="#06b6d4" strokeWidth="1" strokeLinecap="round" /></svg>}
        >
          {recentDownloads.length === 0 ? (
            <p style={{ color: 'var(--text-tertiary)', fontSize: '13px' }}>No download history yet</p>
          ) : (
            <div className="table-container">
              <table>
                <thead><tr><th>File</th><th>Size</th><th>Speed</th><th>Status</th><th>Date</th></tr></thead>
                <tbody>
                  {recentDownloads.slice(0, 15).map((dl) => (
                    <tr key={dl.id}>
                      <td style={{ maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-primary)' }}>{dl.fileName}</td>
                      <td>{formatBytes(dl.fileSize)}</td>
                      <td>{formatSpeed(dl.downloadSpeed)}</td>
                      <td><span className={`badge ${dl.status === 'complete' ? 'badge-success' : dl.status === 'error' ? 'badge-error' : 'badge-info'}`}>{dl.status}</span></td>
                      <td style={{ fontSize: '12px' }}>{dl.completedAt ? new Date(dl.completedAt).toLocaleDateString() : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CollapsibleSection>

        {/* Speed Analytics */}
        <CollapsibleSection
          title="Speed Analytics"
          defaultOpen={false}
          icon={<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 13l3-5 2.5 2.5L13 3" stroke="#14b8a6" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
        >
          {speedData.length === 0 ? (
            <p style={{ color: 'var(--text-tertiary)', fontSize: '13px' }}>Complete some downloads to see speed data</p>
          ) : (
            <div>
              <div style={{ display: 'flex', gap: '24px', marginBottom: '16px' }}>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Average</span>
                  <div style={{ fontSize: '18px', fontWeight: '700' }}>{formatSpeed(analytics?.avgSpeed)}</div>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Peak</span>
                  <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--success)' }}>{formatSpeed(Math.max(...speedData.map(s => s.maxSpeed || 0)))}</div>
                </div>
              </div>
              <Chart
                type="line"
                data={speedData.map(s => s.avgSpeed || 0)}
                labels={speedData.map(s => s.date?.slice(5) || '')}
                width={600}
                height={200}
                color="#14b8a6"
              />
            </div>
          )}
        </CollapsibleSection>

        {/* Volume Analytics */}
        <CollapsibleSection
          title="Volume Analytics"
          defaultOpen={false}
          icon={<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="8" width="2.5" height="5" rx="0.5" fill="#3b82f6" /><rect x="6" y="5" width="2.5" height="8" rx="0.5" fill="#3b82f6" /><rect x="10" y="3" width="2.5" height="10" rx="0.5" fill="#3b82f6" /></svg>}
        >
          {dailyData.length === 0 ? (
            <p style={{ color: 'var(--text-tertiary)', fontSize: '13px' }}>Complete some downloads to see volume data</p>
          ) : (
            <div>
              <div style={{ marginBottom: '16px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Total Volume</span>
                <div style={{ fontSize: '18px', fontWeight: '700' }}>{formatBytes(analytics?.totalSize)}</div>
              </div>
              <Chart
                type="bar"
                data={dailyData.map(d => d.totalSize || 0)}
                labels={dailyData.map(d => d.date?.slice(5) || '')}
                width={600}
                height={200}
                color="#3b82f6"
              />
            </div>
          )}
        </CollapsibleSection>

        {/* Error Log */}
        <CollapsibleSection
          title="Error Log"
          badge={failedDownloads.length || undefined}
          defaultOpen={false}
          icon={<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="#ef4444" strokeWidth="1.2" /><path d="M8 5v3.5M8 10.5v.5" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" /></svg>}
        >
          {failedDownloads.length === 0 ? (
            <p style={{ color: 'var(--text-tertiary)', fontSize: '13px' }}>No errors — looking good! 🎉</p>
          ) : (
            <div className="table-container">
              <table>
                <thead><tr><th>File</th><th>URL</th><th>Status</th></tr></thead>
                <tbody>
                  {failedDownloads.map((dl) => (
                    <tr key={dl.id}>
                      <td style={{ color: 'var(--text-primary)' }}>{dl.fileName || '—'}</td>
                      <td style={{ maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{dl.url}</td>
                      <td><span className="badge badge-error">Failed</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CollapsibleSection>
      </div>
    </div>
  );
}
