import React from 'react';
import { X, Command, Compass, Moon, Search, BookOpen, Layers } from 'lucide-react';

export function ShortcutsModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const shortcuts = [
    { key: '⌘K / Ctrl+K', description: 'Open search across all projects, notes & docs', icon: Search },
    { key: '1', description: 'Navigate to Index / Overview catalog', icon: Compass },
    { key: '2', description: 'Navigate to Projects directory', icon: Layers },
    { key: '3', description: 'Navigate to Notes & Manuscripts vault', icon: BookOpen },
    { key: '4', description: 'Navigate to Documentation wiki', icon: BookOpen },
    { key: 'T', description: 'Toggle between Warm Paper and E-Ink Slate modes', icon: Moon },
    { key: 'Esc', description: 'Close any active reader, detail modal or search', icon: X },
    { key: '?', description: 'Toggle this keyboard shortcuts cheat sheet', icon: Command },
  ];

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div 
        className="paper-panel modal-dialog" 
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '520px' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="paper-stamp paper-stamp-active">SHORTCUTS</span>
            <h3 style={{ fontSize: '1.2rem', color: 'var(--text-primary)' }}>
              Keyboard Command Reference
            </h3>
          </div>
          <button 
            onClick={onClose} 
            className="paper-btn paper-btn-icon"
            aria-label="Close shortcuts reference"
          >
            <X size={16} />
          </button>
        </div>

        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '18px', fontFamily: 'var(--font-serif)' }}>
          Quick keystrokes for rapid paper browsing and research. Shortcuts are active when not typing inside form fields.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {shortcuts.map((sc, i) => {
            const Icon = sc.icon;
            return (
              <div 
                key={i}
                className="paper-panel-subtle"
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: '4px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Icon size={14} color="var(--text-tertiary)" />
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                    {sc.description}
                  </span>
                </div>
                <kbd style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.75rem',
                  padding: '3px 8px',
                  borderRadius: '3px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  boxShadow: '1px 1px 0px var(--border-color)',
                  whiteSpace: 'nowrap'
                }}>
                  {sc.key}
                </kbd>
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: '20px', paddingTop: '12px', borderTop: '1px solid var(--border-color)', textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
          Press <kbd style={{ padding: '1px 4px', border: '1px solid var(--border-color)', borderRadius: '2px' }}>Esc</kbd> or click outside to dismiss
        </div>
      </div>
    </div>
  );
}
