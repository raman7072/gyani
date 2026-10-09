import React, { useState, useEffect } from 'react';
import { Search, X, FolderGit2, FileText, BookOpen, ArrowRight } from 'lucide-react';

export function GlobalSearchModal({ isOpen, onClose, projects, notes, docs, onSelectResult }) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else setQuery('');
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredProjects = projects.filter(p => 
    p.title.toLowerCase().includes(query.toLowerCase()) || 
    p.description?.toLowerCase().includes(query.toLowerCase()) ||
    p.tags?.some(t => t.toLowerCase().includes(query.toLowerCase()))
  ).slice(0, 4);

  const filteredNotes = notes.filter(n => 
    n.title.toLowerCase().includes(query.toLowerCase()) || 
    n.description?.toLowerCase().includes(query.toLowerCase()) ||
    n.file_name?.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 4);

  const filteredDocs = docs.filter(d => 
    d.title.toLowerCase().includes(query.toLowerCase()) || 
    d.summary?.toLowerCase().includes(query.toLowerCase()) ||
    d.content?.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 4);

  const totalResults = filteredProjects.length + filteredNotes.length + filteredDocs.length;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="paper-panel modal-dialog" 
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '620px' }}
      >
        {/* Search Input */}
        <div style={{ position: 'relative', marginBottom: '16px' }}>
          <Search size={16} color="var(--text-tertiary)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            autoFocus
            placeholder="Search archive: projects, manuscripts, docs..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="paper-input"
            style={{ padding: '12px 14px 12px 40px', fontSize: '1rem' }}
          />
          {query && (
            <button 
              onClick={() => setQuery('')}
              style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)' }}
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Results */}
        <div style={{ maxHeight: '380px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {filteredProjects.length > 0 && (
            <div>
              <div className="mono-stamp" style={{ color: 'var(--text-tertiary)', marginBottom: '6px' }}>
                PROJECTS ({filteredProjects.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {filteredProjects.map(proj => (
                  <div
                    key={proj.id}
                    onClick={() => { onSelectResult('project', proj); onClose(); }}
                    className="paper-panel-subtle"
                    style={{ padding: '10px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <FolderGit2 size={15} color="var(--text-primary)" />
                      <div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-serif)' }}>{proj.title}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{proj.category} • {proj.status}</div>
                      </div>
                    </div>
                    <ArrowRight size={13} color="var(--text-tertiary)" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {filteredNotes.length > 0 && (
            <div>
              <div className="mono-stamp" style={{ color: 'var(--text-tertiary)', marginBottom: '6px' }}>
                MANUSCRIPTS & NOTES ({filteredNotes.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {filteredNotes.map(note => (
                  <div
                    key={note.id}
                    onClick={() => { onSelectResult('note', note); onClose(); }}
                    className="paper-panel-subtle"
                    style={{ padding: '10px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <FileText size={15} color="var(--text-primary)" />
                      <div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-serif)' }}>{note.title}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{note.file_type} • {note.file_name}</div>
                      </div>
                    </div>
                    <ArrowRight size={13} color="var(--text-tertiary)" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {filteredDocs.length > 0 && (
            <div>
              <div className="mono-stamp" style={{ color: 'var(--text-tertiary)', marginBottom: '6px' }}>
                DOCUMENTATION ({filteredDocs.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {filteredDocs.map(doc => (
                  <div
                    key={doc.id}
                    onClick={() => { onSelectResult('doc', doc); onClose(); }}
                    className="paper-panel-subtle"
                    style={{ padding: '10px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <BookOpen size={15} color="var(--text-primary)" />
                      <div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-serif)' }}>{doc.title}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{doc.category} • /{doc.slug}</div>
                      </div>
                    </div>
                    <ArrowRight size={13} color="var(--text-tertiary)" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {totalResults === 0 && (
            <div style={{ textAlign: 'center', padding: '28px 12px', color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>
              No matches found for "{query}".
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border-color)', fontSize: '0.75rem', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
          <span>LIVE ARCHIVE SEARCH</span>
          <span><kbd style={{ background: 'var(--bg-secondary)', padding: '1px 5px', borderRadius: '3px', border: '1px solid var(--border-color)' }}>ESC</kbd> to dismiss</span>
        </div>
      </div>
    </div>
  );
}
