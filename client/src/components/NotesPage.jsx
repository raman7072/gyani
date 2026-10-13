import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  Download, 
  Search, 
  HardDrive, 
  Share2, 
  Check,
  Table,
  Grid
} from 'lucide-react';
import { copyShareLink } from '../utils/share';
import { useResponsiveViewMode } from '../hooks/useResponsiveViewMode';
import { normalizeCategory } from '../services/supabase';

export function NotesPage({ notes, onOpenNoteModal, onDownloadNote }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState('');

  const handleShareNote = async (e, note) => {
    e.stopPropagation();
    await copyShareLink('note', note.id, note.title);
    setCopiedId(note.id);
    setTimeout(() => setCopiedId(''), 2200);
  };
  const [selectedFormat, setSelectedFormat] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [viewMode, setViewMode] = useResponsiveViewMode('directory');

  const formats = ['All', 'PDF', 'DOCX', 'MARKDOWN'];

  const categories = useMemo(() => {
    const set = new Set(['All']);
    notes.forEach(n => {
      if (n.category) set.add(normalizeCategory(n.category));
    });
    return Array.from(set);
  }, [notes]);

  const filteredNotes = useMemo(() => {
    return notes.filter(note => {
      const cat = normalizeCategory(note.category);
      const matchesSearch = 
        note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.file_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())) ||
        cat?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesFormat = selectedFormat === 'All' || note.file_type?.toUpperCase() === selectedFormat;
      const matchesCategory = selectedCategory === 'All' || cat === selectedCategory;

      return matchesSearch && matchesFormat && matchesCategory;
    });
  }, [notes, searchTerm, selectedFormat, selectedCategory]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Page Header */}
      <div className="page-header" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: 'clamp(2rem, 4vw, 2.8rem)', marginBottom: '6px' }}>
            Notes & Files
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '640px', fontFamily: 'var(--font-serif)' }}>
            Technical manuscripts, playbooks, and architecture notes. Inspect in-browser or download files directly.
          </p>
        </div>

        {/* View Toggle */}
        <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-secondary)', padding: '3px', borderRadius: '5px', border: '1px solid var(--border-color)' }}>
          <button
            onClick={() => setViewMode('directory')}
            className={`paper-stamp ${viewMode === 'directory' ? 'paper-stamp-active' : ''}`}
            style={{ cursor: 'pointer', border: 'none' }}
            title="Directory Table View"
          >
            <Table size={13} />
            <span>Directory</span>
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`paper-stamp ${viewMode === 'grid' ? 'paper-stamp-active' : ''}`}
            style={{ cursor: 'pointer', border: 'none' }}
            title="Grid View"
          >
            <Grid size={13} />
            <span>Grid</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="paper-panel" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
            <Search 
              size={15} 
              color="var(--text-tertiary)" 
              style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} 
            />
            <input
              type="text"
              placeholder="Search notes by topic, filename or tags (e.g. Postgres, Systems)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="paper-input"
              style={{ paddingLeft: '36px' }}
            />
          </div>

          {/* Format pills */}
          <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
            {formats.map(fmt => {
              const count = fmt === 'All' ? notes.length : notes.filter(n => n.file_type?.toUpperCase() === fmt).length;
              return (
                <button
                  key={fmt}
                  onClick={() => setSelectedFormat(fmt)}
                  className={`paper-stamp ${selectedFormat === fmt ? 'paper-stamp-active' : ''}`}
                  style={{ cursor: 'pointer' }}
                >
                  <span>{fmt}</span>
                  <span style={{ opacity: 0.65, fontSize: '0.75em', marginLeft: '4px' }}>({count})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Category filters */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
          <span className="mono-stamp" style={{ color: 'var(--text-tertiary)', alignSelf: 'center', marginRight: '4px' }}>
            Category:
          </span>
          {categories.map(cat => {
            const count = cat === 'All' ? notes.length : notes.filter(n => n.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`paper-stamp ${selectedCategory === cat ? 'paper-stamp-active' : ''}`}
                style={{ cursor: 'pointer' }}
              >
                <span>{cat}</span>
                <span style={{ opacity: 0.65, fontSize: '0.75em', marginLeft: '4px' }}>({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Directory View (matches Recent Documents style from Overview) */}
      {viewMode === 'directory' && filteredNotes.length > 0 && (
        <div className="paper-panel-subtle" style={{ padding: 'clamp(14px, 3.5vw, 20px)', borderRadius: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', paddingBottom: '10px', borderBottom: '1px solid var(--border-color)', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px', minWidth: 0 }}>
              <FileText size={15} color="var(--text-primary)" style={{ flexShrink: 0 }} />
              <h3 style={{ fontSize: '0.96rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                Documents
              </h3>
            </div>
            <span className="mono-stamp" style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
              {filteredNotes.length} {filteredNotes.length === 1 ? 'Document' : 'Documents'}
            </span>
          </div>

          <div className="dashboard-mini-table">
            {filteredNotes.map((note) => {
              const type = (note.file_type || 'DOC').toUpperCase();
              const typeClass = type === 'PDF' ? 'paper-stamp-red' : type === 'DOCX' ? 'paper-stamp-blue' : '';

              return (
                <div 
                  key={note.id} 
                  className="dashboard-mini-row"
                  onClick={() => onOpenNoteModal(note)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="dashboard-mini-info">
                    <div className="dashboard-mini-title" title={note.title}>
                      {note.title}
                    </div>
                    {note.description && (
                      <div className="dashboard-mini-desc">
                        {note.description}
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '3px', flexWrap: 'wrap' }}>
                      <span className={`paper-stamp ${typeClass}`} style={{ fontSize: '0.65rem', padding: '0 4px' }}>
                        {type}
                      </span>
                      {note.category && (
                        <span className="paper-stamp" style={{ fontSize: '0.65rem', padding: '0 4px' }}>
                          {normalizeCategory(note.category)}
                        </span>
                      )}
                      {note.file_size && (
                        <span className="mono-stamp" style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)' }}>
                          {note.file_size}
                        </span>
                      )}
                      {note.tags?.slice(0, 2).map((tag) => (
                        <span key={tag} className="mono-stamp" style={{ fontSize: '0.65rem', padding: '0 4px', color: 'var(--text-secondary)' }}>
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="dashboard-mini-actions" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={(e) => handleShareNote(e, note)}
                      className="paper-btn paper-btn-icon"
                      style={{ padding: '4px' }}
                      title="Share document link"
                    >
                      {copiedId === note.id ? <Check size={12} color="var(--accent-stamp-sage)" /> : <Share2 size={12} />}
                    </button>
                    {onDownloadNote && (
                      <button
                        onClick={() => onDownloadNote(note)}
                        className="paper-btn paper-btn-primary paper-btn-sm"
                        style={{ fontSize: '0.72rem', padding: '3px 8px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        title="Download document file"
                      >
                        <Download size={11} />
                        <span className="hide-on-mobile">Save</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Notes Cards Grid */}
      {viewMode === 'grid' && (
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 310px), 1fr))', 
        gap: '22px' 
      }}>
        {filteredNotes.map((note) => {
          return (
            <div 
              key={note.id} 
              className="paper-card" 
              onClick={() => onOpenNoteModal(note)}
              style={{ 
                padding: '24px', 
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'space-between',
                minHeight: '260px',
                cursor: 'pointer'
              }}
            >
              <div>
                {/* Format and Size header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className={`paper-stamp ${note.file_type === 'PDF' ? 'paper-stamp-red' : note.file_type === 'DOCX' ? 'paper-stamp-blue' : ''}`}>
                      {note.file_type}
                    </span>
                    <span className="paper-stamp">
                      {normalizeCategory(note.category)}
                    </span>
                  </div>

                  <span className="mono-stamp" style={{ color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <HardDrive size={11} />
                    {note.file_size}
                  </span>
                </div>

                {/* Title */}
                <h3 style={{ fontSize: '1.2rem', marginBottom: '6px', lineHeight: 1.35 }}>
                  {note.title}
                </h3>

                {/* Filename subtext */}
                <div className="mono-stamp" style={{ color: 'var(--text-tertiary)', marginBottom: '12px', fontSize: '0.72rem' }}>
                  FILE: {note.file_name}
                </div>

                {/* Description */}
                {note.description && (
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '16px' }}>
                    {note.description}
                  </p>
                )}

                {/* Tags */}
                {note.tags && note.tags.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '18px' }}>
                    {note.tags.map((tag) => (
                      <span 
                        key={tag} 
                        className="mono-stamp"
                        style={{ 
                          padding: '2px 6px', 
                          borderRadius: '3px', 
                          background: 'var(--bg-secondary)', 
                          border: '1px solid var(--border-color)',
                          color: 'var(--text-secondary)'
                        }}
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons: Share & Download Button (without redundant Open button) */}
              <div 
                onClick={(e) => e.stopPropagation()}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  paddingTop: '14px',
                  borderTop: '1px solid var(--border-color)'
                }}
              >
                <button
                  onClick={(e) => handleShareNote(e, note)}
                  className="paper-btn paper-btn-sm"
                  style={{ flex: 1, justifyContent: 'center' }}
                  title="Copy direct share link to this note"
                >
                  {copiedId === note.id ? <Check size={13} color="var(--accent-stamp-sage)" /> : <Share2 size={13} />}
                  <span>{copiedId === note.id ? 'Copied' : 'Share'}</span>
                </button>

                <button
                  onClick={() => onDownloadNote(note)}
                  className="paper-btn paper-btn-primary paper-btn-sm"
                  style={{ flex: 1, justifyContent: 'center' }}
                  title="Download raw document file"
                >
                  <Download size={13} />
                  <span>Download</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
      )}

      {/* Empty State */}
      {filteredNotes.length === 0 && (
        <div className="paper-panel" style={{ padding: '48px 20px', textAlign: 'center' }}>
          <FileText size={36} color="var(--text-tertiary)" style={{ margin: '0 auto 12px auto' }} />
          <h3 style={{ fontSize: '1.2rem', color: 'var(--text-primary)', marginBottom: '6px' }}>
            No documents found
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '14px' }}>
            Try modifying your search or format criteria.
          </p>
          <button
            onClick={() => { setSearchTerm(''); setSelectedFormat('All'); setSelectedCategory('All'); }}
            className="paper-btn"
          >
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
}
