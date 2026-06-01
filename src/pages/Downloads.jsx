import React, { useState } from 'react';
import ProgressBar from '../components/ProgressBar';

const api = window.electronAPI;

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '—';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function formatSpeed(bps) {
  if (!bps || bps === 0) return '—';
  return formatBytes(bps) + '/s';
}

export default function Downloads({ downloads = [], settings, clearCompleted }) {
  const [linkInput, setLinkInput] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [savePath, setSavePath] = useState(settings?.downloadPath || '');
  const [error, setError] = useState('');

  const handleExtractAndQueue = async () => {
    const urls = linkInput.split('\n').map(u => u.trim()).filter(u => u.length > 0);
    if (urls.length === 0) { setError('Please paste at least one link'); return; }
    setError('');
    setExtracting(true);

    try {
      const results = await api.extractLinks(urls);
      const successful = results.filter(r => r.status === 'success');
      const failed = results.filter(r => r.status === 'error');

      if (successful.length > 0) {
        await api.queueDownloads(successful, savePath || undefined);
        setLinkInput('');
      }
      if (failed.length > 0) {
        setError(`${failed.length} link(s) failed to extract. ${successful.length} queued.`);
      }
    } catch (err) {
      setError(err.message || 'Extraction failed');
    } finally {
      setExtracting(false);
    }
  };

  const handlePickFolder = async () => {
    const folder = await api.pickFolder();
    if (folder) setSavePath(folder);
  };

  const statusOrder = { downloading: 0, queued: 1, paused: 2, error: 3, complete: 4 };
  const sortedDownloads = [...downloads].sort((a, b) => (statusOrder[a.status] || 5) - (statusOrder[b.status] || 5));

  return (
    <div>
      <div style={styles.header}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '4px' }}>Downloads</h1>
          <p style={{ color: 'var(--text-tertiary)', fontSize: '14px' }}>Paste FuckingFast links to start bulk downloading</p>
        </div>
      </div>

      {/* Link Input */}
      <div className="glass-card" style={styles.inputCard}>
        <textarea
          className="input"
          placeholder={"Paste FuckingFast.co links here (one per line)...\n\nhttps://fuckingfast.co/abc123\nhttps://fuckingfast.co/def456"}
          value={linkInput}
          onChange={e => setLinkInput(e.target.value)}
          style={{ minHeight: '140px' }}
        />

        <div style={styles.inputActions}>
          <div style={styles.pathRow}>
            <button className="btn btn-secondary btn-sm" onClick={handlePickFolder}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 3.5V11a1 1 0 001 1h10a1 1 0 001-1V5.5a1 1 0 00-1-1H7L5.5 3H2a1 1 0 00-1 .5z" stroke="currentColor" strokeWidth="1.2" /></svg>
              {savePath ? 'Change Folder' : 'Pick Folder'}
            </button>
            {savePath && <span style={styles.pathText}>{savePath}</span>}
          </div>
          <div style={styles.rightActions}>
            {error && <span style={styles.errorText}>{error}</span>}
            <button
              className="btn btn-primary"
              onClick={handleExtractAndQueue}
              disabled={extracting || !linkInput.trim()}
              style={{ opacity: extracting || !linkInput.trim() ? 0.5 : 1 }}
            >
              {extracting ? (
                <><svg width="14" height="14" viewBox="0 0 14 14" style={{ animation: 'spin 1s linear infinite' }}><circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" strokeDasharray="20 12" fill="none" /></svg> Extracting...</>
              ) : (
                <><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 2v7m0 0L4.5 6.5M7 9l2.5-2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /><path d="M2 11v.5a.5.5 0 00.5.5h9a.5.5 0 00.5-.5V11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg> Extract &amp; Queue</>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {downloads.length > 0 && (
        <div style={styles.bulkActions}>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{downloads.length} item(s)</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-secondary btn-sm" onClick={() => api?.resumeAll()}>▶ Resume All</button>
            <button className="btn btn-secondary btn-sm" onClick={() => api?.pauseAll()}>⏸ Pause All</button>
            <button className="btn btn-secondary btn-sm" onClick={clearCompleted}>✓ Clear Completed</button>
          </div>
        </div>
      )}

      {/* Queue Table */}
      {sortedDownloads.length > 0 && (
        <div className="glass-card" style={{ overflow: 'hidden' }}>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>#</th>
                  <th>File Name</th>
                  <th style={{ width: '90px' }}>Size</th>
                  <th style={{ width: '100px' }}>Status</th>
                  <th style={{ width: '180px' }}>Progress</th>
                  <th style={{ width: '90px' }}>Speed</th>
                  <th style={{ width: '100px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedDownloads.map((dl, idx) => (
                  <tr key={dl.id}>
                    <td style={{ color: 'var(--text-tertiary)' }}>{idx + 1}</td>
                    <td style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-primary)', fontWeight: '500' }}>
                      {dl.fileName}
                    </td>
                    <td>{formatBytes(dl.fileSize)}</td>
                    <td>
                      <span className={`badge ${statusBadgeClass(dl.status)}`}>
                        {dl.status === 'downloading' ? '● ' : ''}{dl.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ flex: 1 }}><ProgressBar progress={dl.progress} status={dl.status} size="sm" /></div>
                        <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', minWidth: '35px', textAlign: 'right' }}>{dl.progress?.toFixed(0)}%</span>
                      </div>
                    </td>
                    <td style={{ fontSize: '12px' }}>{dl.status === 'downloading' ? formatSpeed(dl.speed) : '—'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '2px' }}>
                        {dl.status === 'downloading' && (
                          <button className="btn-icon" onClick={() => api?.pauseDownload(dl.id)} title="Pause">⏸</button>
                        )}
                        {dl.status === 'paused' && (
                          <button className="btn-icon" onClick={() => api?.resumeDownload(dl.id)} title="Resume">▶</button>
                        )}
                        {dl.status === 'error' && (
                          <button className="btn-icon" onClick={() => api?.retryDownload(dl.id)} title="Retry">↻</button>
                        )}
                        {dl.status !== 'complete' && (
                          <button className="btn-icon" onClick={() => api?.cancelDownload(dl.id)} title="Cancel" style={{ color: 'var(--error)' }}>✕</button>
                        )}
                        {dl.status === 'complete' && dl.savePath && (
                          <button className="btn-icon" onClick={() => api?.openFolder(dl.savePath)} title="Open Folder">📂</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {downloads.length === 0 && (
        <div className="empty-state" style={{ padding: '60px' }}>
          <svg width="64" height="64" viewBox="0 0 64 64" fill="none"><rect x="12" y="8" width="40" height="48" rx="4" stroke="#1e293b" strokeWidth="2" /><path d="M22 20h20M22 28h14M22 36h18" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" /></svg>
          <h3>No downloads yet</h3>
          <p>Paste your FuckingFast links above to get started</p>
        </div>
      )}
    </div>
  );
}

function statusBadgeClass(status) {
  switch (status) {
    case 'downloading': return 'badge-cyan';
    case 'complete': return 'badge-success';
    case 'error': return 'badge-error';
    case 'paused': return 'badge-warning';
    case 'queued': return 'badge-info';
    default: return '';
  }
}

const styles = {
  header: { marginBottom: '24px' },
  inputCard: { padding: '20px', marginBottom: '16px' },
  inputActions: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', flexWrap: 'wrap', gap: '10px' },
  pathRow: { display: 'flex', alignItems: 'center', gap: '10px' },
  pathText: { fontSize: '12px', color: 'var(--text-tertiary)', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  rightActions: { display: 'flex', alignItems: 'center', gap: '12px' },
  errorText: { fontSize: '12px', color: 'var(--error)' },
  bulkActions: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', padding: '0 4px' },
};
