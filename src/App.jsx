import React, { useState, useEffect, useCallback } from 'react';
import TitleBar from './components/TitleBar';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Downloads from './pages/Downloads';
import Analytics from './pages/Analytics';
import Profile from './pages/Profile';
import Settings from './pages/Settings';

const api = window.electronAPI;

export default function App() {
  const [activePage, setActivePage] = useState('dashboard');
  const [downloads, setDownloads] = useState([]);
  const [settings, setSettings] = useState({});
  const [analytics, setAnalytics] = useState(null);

  // Load initial data
  useEffect(() => {
    if (!api) return;
    api.getSettings().then(setSettings);
    api.getActiveDownloads().then(setDownloads);
    api.getAnalytics().then(setAnalytics);
  }, []);

  // Subscribe to download events
  useEffect(() => {
    if (!api) return;
    const unsubs = [];

    unsubs.push(api.onDownloadQueued((data) => {
      setDownloads(prev => [...prev, data]);
    }));
    unsubs.push(api.onDownloadStarted((data) => {
      setDownloads(prev => prev.map(d => d.id === data.id ? data : d));
    }));
    unsubs.push(api.onDownloadProgress((data) => {
      setDownloads(prev => prev.map(d => d.id === data.id ? data : d));
    }));
    unsubs.push(api.onDownloadComplete((data) => {
      setDownloads(prev => prev.map(d => d.id === data.id ? data : d));
      api.getAnalytics().then(setAnalytics);
    }));
    unsubs.push(api.onDownloadError((data) => {
      setDownloads(prev => prev.map(d => d.id === data.id ? data : d));
    }));
    unsubs.push(api.onDownloadPaused((data) => {
      setDownloads(prev => prev.map(d => d.id === data.id ? data : d));
    }));
    unsubs.push(api.onDownloadResumed((data) => {
      setDownloads(prev => prev.map(d => d.id === data.id ? data : d));
    }));
    unsubs.push(api.onDownloadCancelled((data) => {
      setDownloads(prev => prev.filter(d => d.id !== data.id));
    }));

    return () => unsubs.forEach(fn => fn && fn());
  }, []);

  const refreshAnalytics = useCallback(() => {
    if (api) api.getAnalytics().then(setAnalytics);
  }, []);

  const clearCompleted = useCallback(() => {
    setDownloads(prev => prev.filter(d => d.status !== 'complete'));
    if (api) api.clearCompleted();
  }, []);

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return <Dashboard downloads={downloads} analytics={analytics} />;
      case 'downloads':
        return <Downloads downloads={downloads} settings={settings} clearCompleted={clearCompleted} />;
      case 'analytics':
        return <Analytics analytics={analytics} refreshAnalytics={refreshAnalytics} />;
      case 'profile':
        return <Profile analytics={analytics} />;
      case 'settings':
        return <Settings settings={settings} setSettings={setSettings} />;
      default:
        return <Dashboard downloads={downloads} analytics={analytics} />;
    }
  };

  return (
    <div className="app-layout">
      <Sidebar activePage={activePage} setActivePage={setActivePage} downloads={downloads} />
      <div className="main-area">
        <TitleBar />
        <div className="page-content" key={activePage}>
          {renderPage()}
        </div>
      </div>
    </div>
  );
}
