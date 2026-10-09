import React, { useState } from 'react';
import { 
  X, 
  Download, 
  FileText, 
  HardDrive, 
  Calendar,
  Clock,
  ExternalLink,
  BookOpen,
  Code,
  Share2,
  Check
} from 'lucide-react';
import { copyShareLink } from '../utils/share';

export function NoteViewerModal({ note, onClose, onDownload }) {
  const [viewMode, setViewMode] = useState('formatted'); // 'formatted' | 'raw' | 'pdf'
  const [copied, setCopied] = useState(false);

  if (!note) return null;

  const handleShare = async () => {
    await copyShareLink('note', note.id, note.title);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  // Calculate word count & reading time
  const rawText = (note.preview_content || note.description || '')
    .replace(/<[^>]*>?/gm, ' ')
    .trim();
  const wordCount = rawText ? rawText.split(/\s+/).filter(Boolean).length : 0;
  const readTimeMin = Math.max(1, Math.ceil(wordCount / 180));

  const isHtml = note.preview_content && (note.preview_content.includes('<p>') || note.preview_content.includes('<div>') || note.preview_content.includes('<h1>') || note.preview_content.includes('<h2>'));
  const isPdf = note.file_type === 'PDF' && note.file_url;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="paper-panel modal-dialog" 
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '860px' }}
      >
        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', flexWrap: 'wrap' }}>
              <span className={`paper-stamp ${note.file_type === 'PDF' ? 'paper-stamp-red' : note.file_type === 'DOCX' ? 'paper-stamp-blue' : 'paper-stamp-active'}`}>
                {note.file_type} MANUSCRIPT
              </span>
              <span className="paper-stamp">
                {note.category}
              </span>
              {wordCount > 0 && (
                <span className="mono-stamp" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={11} />
                  <span>~{readTimeMin} min read ({wordCount.toLocaleString()} words)</span>
                </span>
              )}
            </div>

            <h2 style={{ fontSize: '1.65rem', color: 'var(--text-primary)', lineHeight: 1.25 }}>
              {note.title}
            </h2>
          </div>

          <button 
            onClick={onClose} 
            className="paper-btn paper-btn-icon"
            aria-label="Close document viewer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Action & Metadata Bar */}
        <div 
          className="paper-panel-subtle" 
          style={{ 
            padding: '14px 18px', 
            display: 'flex', 
            flexWrap: 'wrap', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            gap: '14px',
            marginBottom: '24px'
          }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <FileText size={14} color="var(--text-primary)" />
              <strong style={{ color: 'var(--text-primary)' }}>File:</strong> {note.file_name}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <HardDrive size={14} />
              <strong style={{ color: 'var(--text-primary)' }}>Size:</strong> {note.file_size}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Calendar size={14} />
              <strong style={{ color: 'var(--text-primary)' }}>Archived:</strong> {note.created_at ? new Date(note.created_at).toLocaleDateString() : 'Recent'}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={handleShare}
              className="paper-btn paper-btn-sm"
              title="Copy direct share link to this note"
            >
              {copied ? <Check size={13} color="var(--accent-stamp-sage)" /> : <Share2 size={13} />}
              <span>{copied ? 'Link Copied!' : 'Share'}</span>
            </button>
            {note.file_url && (
              <a
                href={note.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="paper-btn paper-btn-sm"
                title="Open raw file in new browser tab"
              >
                <ExternalLink size={13} />
                <span>Open Raw</span>
              </a>
            )}
            <button
              onClick={() => onDownload(note)}
              className="paper-btn paper-btn-primary paper-btn-sm"
            >
              <Download size={13} />
              <span>Download File</span>
            </button>
          </div>
        </div>

        {/* Description */}
        {note.description && (
          <div style={{ marginBottom: '20px' }}>
            <div className="mono-stamp" style={{ color: 'var(--text-tertiary)', marginBottom: '6px' }}>
              ABSTRACT & SUMMARY
            </div>
            <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.65, fontFamily: 'var(--font-serif)' }}>
              {note.description}
            </p>
          </div>
        )}

        {/* Tags */}
        {note.tags && note.tags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '20px' }}>
            {note.tags.map(tag => (
              <span key={tag} className="mono-stamp" style={{ padding: '2px 8px', borderRadius: '3px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* In-app Document Reader View */}
        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
            <h3 style={{ fontSize: '1.05rem', color: 'var(--text-primary)' }}>
              In-Browser Paper Reader
            </h3>
            
            {/* View Mode Toggle */}
            <div style={{ display: 'flex', gap: '4px' }}>
              <button
                type="button"
                onClick={() => setViewMode('formatted')}
                className={`paper-stamp ${viewMode === 'formatted' ? 'paper-stamp-active' : ''}`}
                style={{ cursor: 'pointer', border: 'none' }}
              >
                <BookOpen size={11} style={{ marginRight: '4px' }} />
                <span>Paper Layout</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('raw')}
                className={`paper-stamp ${viewMode === 'raw' ? 'paper-stamp-active' : ''}`}
                style={{ cursor: 'pointer', border: 'none' }}
              >
                <Code size={11} style={{ marginRight: '4px' }} />
                <span>Raw Text</span>
              </button>
              {isPdf && (
                <button
                  type="button"
                  onClick={() => setViewMode('pdf')}
                  className={`paper-stamp ${viewMode === 'pdf' ? 'paper-stamp-active' : ''}`}
                  style={{ cursor: 'pointer', border: 'none' }}
                >
                  <FileText size={11} style={{ marginRight: '4px' }} />
                  <span>PDF Frame</span>
                </button>
              )}
            </div>
          </div>

          {/* Reader Body */}
          {viewMode === 'pdf' && isPdf ? (
            <div style={{ borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--border-color)', height: '420px' }}>
              <iframe 
                src={`${note.file_url}#toolbar=0`}
                title={note.title}
                width="100%" 
                height="100%" 
                style={{ border: 'none' }}
              />
            </div>
          ) : viewMode === 'formatted' ? (
            <div 
              style={{ 
                padding: '24px 28px', 
                maxHeight: '420px', 
                overflowY: 'auto',
                fontFamily: 'var(--font-serif)',
                fontSize: '1rem',
                lineHeight: 1.8,
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                color: 'var(--text-primary)'
              }}
            >
              {isHtml ? (
                <div 
                  className="paper-docx-content"
                  dangerouslySetInnerHTML={{ __html: note.preview_content }} 
                />
              ) : note.preview_content ? (
                <div style={{ whiteSpace: 'pre-wrap' }}>
                  {note.preview_content}
                </div>
              ) : (
                <div style={{ color: 'var(--text-tertiary)', fontStyle: 'italic', textAlign: 'center', padding: '30px 0' }}>
                  No inline preview content extracted for this manuscript. Click "Download File" to view offline.
                </div>
              )}
            </div>
          ) : (
            <div 
              style={{ 
                padding: '20px', 
                maxHeight: '420px', 
                overflowY: 'auto',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.825rem',
                lineHeight: 1.65,
                whiteSpace: 'pre-wrap',
                background: 'var(--code-bg)',
                border: '1px solid var(--code-border)',
                borderRadius: '4px',
                color: 'var(--code-text)'
              }}
            >
              {rawText || `[Document: ${note.file_name}]\nFormat: ${note.file_type}\nCategory: ${note.category}`}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px', borderTop: '1px solid var(--border-color)', paddingTop: '18px' }}>
          <button onClick={onClose} className="paper-btn">
            Close
          </button>
          <button onClick={() => onDownload(note)} className="paper-btn paper-btn-primary">
            <Download size={14} />
            <span>Download {note.file_type}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
