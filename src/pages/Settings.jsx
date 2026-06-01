import React, { useState, useEffect } from 'react';

const api = window.electronAPI;

export default function Settings({ settings: initialSettings, setSettings: setParentSettings }) {
  const [settings, setLocal] = useState({
    maxConcurrent: 5,
    downloadPath: '',
    autoStart: true,
    bandwidthLimit: 0,
    retryAttempts: 3,
    connectionTimeout: 30,
    theme: 'dark',
    accentColor: '#06b6d4',
    notifications: true,
    soundEnabled: false,
    ...initialSettings,
  });

  useEffect(() => {
    if (api) api.getSettings().then(s => setLocal(prev => ({ ...prev, ...s })));
  }, []);

  const updateSetting = async (key, value) => {
    setLocal(prev => ({ ...prev, [key]: value }));
    setParentSettings(prev => ({ ...prev, [key]: value }));
    if (api) await api.setSetting(key, value);
  };

  const handlePickFolder = async () => {
    const folder = await api.pickFolder();
    if (folder) updateSetting('downloadPath', folder);
  };

  return (
    <div>
      <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '4px' }}>Settings</h1>
      <p style={{ color: 'var(--text-tertiary)', fontSize: '14px', marginBottom: '28px' }}>Configure FitDownloader to your preference</p>

      {/* General */}
      <Section title="General">
        <SettingRow label="Download Directory" desc="Where files are saved">
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {settings.downloadPath || 'Default (Downloads/FitDownloader)'}
            </span>
            <button className="btn btn-secondary btn-sm" onClick={handlePickFolder}>Browse</button>
          </div>
        </SettingRow>
        <SettingRow label="Max Concurrent Downloads" desc={`Currently: ${settings.maxConcurrent}`}>
          <div className="slider-container">
            <input type="range" min="1" max="10" value={settings.maxConcurrent} onChange={e => updateSetting('maxConcurrent', parseInt(e.target.value))} />
            <span style={{ fontSize: '14px', fontWeight: '600', minWidth: '24px', color: 'var(--accent-primary)' }}>{settings.maxConcurrent}</span>
          </div>
        </SettingRow>
        <SettingRow label="Auto-start Downloads" desc="Start downloading when links are added">
          <Toggle active={settings.autoStart} onChange={() => updateSetting('autoStart', !settings.autoStart)} />
        </SettingRow>
      </Section>

      {/* Network */}
      <Section title="Network">
        <SettingRow label="Bandwidth Limit (MB/s)" desc="0 = unlimited">
          <div className="slider-container">
            <input type="range" min="0" max="100" value={settings.bandwidthLimit} onChange={e => updateSetting('bandwidthLimit', parseInt(e.target.value))} />
            <span style={{ fontSize: '14px', fontWeight: '600', minWidth: '40px', color: 'var(--accent-primary)' }}>{settings.bandwidthLimit || '∞'}</span>
          </div>
        </SettingRow>
        <SettingRow label="Retry Attempts" desc="How many times to retry a failed download">
          <div className="slider-container">
            <input type="range" min="1" max="10" value={settings.retryAttempts} onChange={e => updateSetting('retryAttempts', parseInt(e.target.value))} />
            <span style={{ fontSize: '14px', fontWeight: '600', minWidth: '24px', color: 'var(--accent-primary)' }}>{settings.retryAttempts}</span>
          </div>
        </SettingRow>
        <SettingRow label="Connection Timeout (seconds)" desc="Time before a connection is considered failed">
          <div className="slider-container">
            <input type="range" min="10" max="120" step="5" value={settings.connectionTimeout} onChange={e => updateSetting('connectionTimeout', parseInt(e.target.value))} />
            <span style={{ fontSize: '14px', fontWeight: '600', minWidth: '30px', color: 'var(--accent-primary)' }}>{settings.connectionTimeout}s</span>
          </div>
        </SettingRow>
      </Section>

      {/* Notifications */}
      <Section title="Notifications">
        <SettingRow label="Desktop Notifications" desc="Show notification when download completes">
          <Toggle active={settings.notifications} onChange={() => updateSetting('notifications', !settings.notifications)} />
        </SettingRow>
        <SettingRow label="Sound Alert" desc="Play sound on download complete">
          <Toggle active={settings.soundEnabled} onChange={() => updateSetting('soundEnabled', !settings.soundEnabled)} />
        </SettingRow>
      </Section>

      {/* About */}
      <Section title="About">
        <div style={{ padding: '8px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 3v10m0 0l-3.5-3.5M10 13l3.5-3.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><path d="M3 15v1a1 1 0 001 1h12a1 1 0 001-1v-1" stroke="white" strokeWidth="1.5" strokeLinecap="round" /></svg>
            </div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: '700' }}><span style={{ color: 'var(--accent-primary)' }}>Fit</span>Downloader</div>
              <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Version 1.0.0</div>
            </div>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', lineHeight: '1.6' }}>
            Premium bulk download manager for FuckingFast.co files. Built with Electron, React, and love.
          </p>
        </div>
      </Section>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: '24px' }}>
      <h3 style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>{title}</h3>
      <div className="glass-card" style={{ overflow: 'hidden' }}>
        {children}
      </div>
    </div>
  );
}

function SettingRow({ label, desc, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid var(--border-subtle)', gap: '20px' }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '2px' }}>{label}</div>
        {desc && <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{desc}</div>}
      </div>
      <div style={{ flexShrink: 0 }}>{children}</div>
    </div>
  );
}

function Toggle({ active, onChange }) {
  return (
    <div className={`toggle ${active ? 'active' : ''}`} onClick={onChange} role="button" tabIndex={0} />
  );
}
