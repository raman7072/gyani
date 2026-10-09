import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  Download, 
  Eye, 
  Search, 
  HardDrive
} from 'lucide-react';

export function NotesPage({ notes, onOpenNoteModal, onDownloadNote }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFormat, setSelectedFormat] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const formats = ['All', 'PDF', 'DOCX', 'MARKDOWN'];

  const categories = useMemo(() => {
    const set = new Set(['All']);
    notes.forEach(n => {
      if (n.category) set.add(n.category);
    });
    return Array.from(set);
  }, [notes]);

  const filteredNotes = useMemo(() => {
    return notes.filter(note => {
      const matchesSearch = 
        note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.file_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesFormat = selectedFormat === 'All' || note.file_type?.toUpperCase() === selectedFormat;
      const matchesCategory = selectedCategory === 'All' || note.category === selectedCategory;

      return matchesSearch && matchesFormat && matchesCategory;
    });
  }, [notes, searchTerm, selectedFormat, selectedCategory]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Page Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
          <span className="paper-stamp paper-stamp-active">
            ARCHIVE
          </span>
          <span className="paper-stamp">
            MANUSCRIPTS & STUDY NOTES
          </span>
        </div>
        <h1 style={{ fontSize: 'clamp(2rem, 4vw, 2.8rem)', marginBottom: '6px' }}>
          Documents & Study Vault
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '640px', fontFamily: 'var(--font-serif)' }}>
          Archived technical summaries, engineering playbooks, and system design notes. Inspect full texts in-browser or download files directly.
        </p>
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

      {/* Notes Cards Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))', 
        gap: '20px' 
      }}>
        {filteredNotes.map((note) => {
          return (
            <div 
              key={note.id} 
              className="paper-card" 
              style={{ 
                padding: '24px', 
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'space-between',
                minHeight: '260px'
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
                      {note.category}
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
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '16px' }}>
                  {note.description}
                </p>

                {/* Tags */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '18px' }}>
                  {note.tags?.map((tag) => (
                    <span 
                      key={tag} 
                      className="mono-stamp"
                      style={{ 
                        padding: '1px 6px', 
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
              </div>

              {/* Action Buttons: View in Form & Download Button */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                paddingTop: '14px',
                borderTop: '1px solid var(--border-color)'
              }}>
                <button
                  onClick={() => onOpenNoteModal(note)}
                  className="paper-btn paper-btn-sm"
                  style={{ flex: 1 }}
                  title="View document in full-screen reader form"
                >
                  <Eye size={13} />
                  <span>View Form</span>
                </button>

                <button
                  onClick={() => onDownloadNote(note)}
                  className="paper-btn paper-btn-primary paper-btn-sm"
                  style={{ flex: 1.2 }}
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
