import React, { useState, useRef, useEffect } from 'react';

export default function CollapsibleSection({ title, icon, badge, defaultOpen = false, children }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const contentRef = useRef(null);
  const [contentHeight, setContentHeight] = useState(0);

  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, [children, isOpen]);

  return (
    <div style={styles.container}>
      <button style={styles.header} onClick={() => setIsOpen(!isOpen)}>
        <div style={styles.headerLeft}>
          {icon && <span style={styles.icon}>{icon}</span>}
          <span style={styles.title}>{title}</span>
          {badge !== undefined && (
            <span style={styles.badge}>{badge}</span>
          )}
        </div>
        <svg
          width="16" height="16" viewBox="0 0 16 16" fill="none"
          style={{ ...styles.chevron, transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
        >
          <path d="M4 6l4 4 4-4" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <div style={{
        ...styles.content,
        maxHeight: isOpen ? contentHeight + 40 : 0,
        opacity: isOpen ? 1 : 0,
        padding: isOpen ? '16px 20px 20px' : '0 20px',
      }}>
        <div ref={contentRef}>
          {children}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-md)',
    overflow: 'hidden',
    transition: 'all 300ms ease',
  },
  header: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 20px',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    transition: 'background 150ms',
    fontFamily: 'var(--font-family)',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  icon: {
    display: 'flex',
    alignItems: 'center',
    color: 'var(--accent-primary)',
  },
  title: {
    fontSize: '14px',
    fontWeight: '600',
    color: 'var(--text-primary)',
  },
  badge: {
    background: 'rgba(6,182,212,0.15)',
    color: 'var(--accent-primary)',
    fontSize: '11px',
    fontWeight: '600',
    padding: '2px 8px',
    borderRadius: '10px',
  },
  chevron: {
    transition: 'transform 300ms ease',
    flexShrink: 0,
  },
  content: {
    overflow: 'hidden',
    transition: 'all 350ms cubic-bezier(0.4, 0, 0.2, 1)',
  },
};
