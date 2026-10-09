import React from 'react';
import { 
  FolderGit2, 
  FileText, 
  BookOpen, 
  ExternalLink, 
  ArrowRight, 
  Download, 
  Clock, 
  Database, 
  Layers, 
  Bookmark,
  FileCheck
} from 'lucide-react';
import { GithubIcon } from './GithubIcon';

export function Overview({ projects, notes, docs, onNavigate, onOpenProjectModal, onOpenNoteModal }) {
  const completedProjects = projects.filter(p => p.status === 'Completed').length;
  const inProgressProjects = projects.filter(p => p.status === 'In Progress' || p.status === 'Active').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
      {/* Frontispiece / Hero Section */}
      <section className="paper-panel hero-section">
        <div style={{ maxWidth: '820px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <span className="paper-stamp paper-stamp-active">
              INDEX • VOL. I
            </span>
            <span className="paper-stamp">
              OPEN ACCESS
            </span>
          </div>

          <h1 style={{ 
            fontSize: 'clamp(1.85rem, 5vw, 3.2rem)', 
            marginBottom: '18px',
            color: 'var(--text-primary)',
            letterSpacing: '-0.02em',
            lineHeight: 1.15
          }}>
            An archive of software systems built, research noted, and engineering explored.
          </h1>

          <p style={{ 
            fontSize: '1.1rem', 
            color: 'var(--text-secondary)', 
            lineHeight: 1.7, 
            marginBottom: '32px',
            maxWidth: '680px',
            fontFamily: 'var(--font-serif)'
          }}>
            A minimalist digital manuscript cataloging open-source code directories, 
            downloadable architectural study notes, and web-based technical documentation. 
            Typeset for quiet focus and long-form study.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            <button 
              onClick={() => onNavigate('projects')}
              className="paper-btn paper-btn-primary"
            >
              <FolderGit2 size={15} />
              <span>Browse Projects Catalog</span>
              <ArrowRight size={14} />
            </button>

            <button 
              onClick={() => onNavigate('notes')}
              className="paper-btn"
            >
              <FileText size={15} />
              <span>Archived Notes & Files</span>
            </button>

            <button 
              onClick={() => onNavigate('docs')}
              className="paper-btn"
            >
              <BookOpen size={15} />
              <span>Technical Documentation</span>
            </button>
          </div>
        </div>
      </section>

      {/* Index Ledger / Metrics Bar */}
      <section style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', 
        gap: '16px' 
      }}>
        <div className="paper-panel-subtle" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span className="mono-stamp" style={{ color: 'var(--text-tertiary)' }}>
              Projects Catalog
            </span>
            <FolderGit2 size={16} color="var(--text-secondary)" />
          </div>
          <div style={{ fontSize: '2.2rem', fontFamily: 'var(--font-serif)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '2px' }}>
            {projects.length}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            <strong>{completedProjects}</strong> completed • <strong>{inProgressProjects}</strong> active
          </div>
        </div>

        <div className="paper-panel-subtle" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span className="mono-stamp" style={{ color: 'var(--text-tertiary)' }}>
              Documents & Notes
            </span>
            <FileText size={16} color="var(--text-secondary)" />
          </div>
          <div style={{ fontSize: '2.2rem', fontFamily: 'var(--font-serif)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '2px' }}>
            {notes.length}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            PDF, DOCX & Markdown attachments
          </div>
        </div>

        <div className="paper-panel-subtle" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span className="mono-stamp" style={{ color: 'var(--text-tertiary)' }}>
              Web Documentation
            </span>
            <BookOpen size={16} color="var(--text-secondary)" />
          </div>
          <div style={{ fontSize: '2.2rem', fontFamily: 'var(--font-serif)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '2px' }}>
            {docs.length}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Long-form guides & specifications
          </div>
        </div>

        <div className="paper-panel-subtle" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span className="mono-stamp" style={{ color: 'var(--text-tertiary)' }}>
              Backend Store
            </span>
            <Database size={16} color="var(--text-secondary)" />
          </div>
          <div style={{ fontSize: '2.2rem', fontFamily: 'var(--font-serif)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '2px' }}>
            Supabase
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            PostgreSQL & S3 document storage
          </div>
        </div>
      </section>

      {/* Selected Works / Projects Shelf */}
      <section>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
          <div>
            <h2 style={{ fontSize: '1.6rem', color: 'var(--text-primary)', marginBottom: '4px' }}>
              Selected Projects & Repositories
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Architectural codebases, distributed systems, and open-source packages
            </p>
          </div>

          <button 
            onClick={() => onNavigate('projects')}
            className="paper-btn paper-btn-sm"
          >
            <span>Full Directory</span>
            <ArrowRight size={13} />
          </button>
        </div>

        {projects.length === 0 ? (
          <div className="paper-panel-subtle" style={{ padding: '36px 20px', textAlign: 'center' }}>
            <FolderGit2 size={32} color="var(--text-tertiary)" style={{ margin: '0 auto 10px auto' }} />
            <h3 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', marginBottom: '6px' }}>
              No projects cataloged yet
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', maxWidth: '460px', margin: '0 auto' }}>
              Your archive is pristine. Navigate to <code style={{ fontFamily: 'var(--font-mono)' }}>/#admin</code> in your browser to publish your first open-source project and repository link.
            </p>
          </div>
        ) : (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', 
            gap: '20px' 
          }}>
            {projects.slice(0, 3).map((project) => (
              <div 
                key={project.id} 
                className="paper-card" 
                style={{ 
                  padding: '24px', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  justifyContent: 'space-between' 
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                    <span className="paper-stamp">
                      {project.category}
                    </span>
                    <span className={`paper-stamp ${project.status === 'Completed' ? 'paper-stamp-sage' : 'paper-stamp-red'}`}>
                      {project.status}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.25rem', marginBottom: '10px', lineHeight: 1.3 }}>
                    {project.title}
                  </h3>

                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '16px' }}>
                    {project.description}
                  </p>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '20px' }}>
                    {project.tags?.map((tag) => (
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
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  paddingTop: '16px',
                  borderTop: '1px solid var(--border-color)'
                }}>
                  <button
                    onClick={() => onOpenProjectModal(project)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-primary)',
                      fontSize: '0.825rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    Architecture Notes <ArrowRight size={13} />
                  </button>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    {project.repo_url && (
                      <a
                        href={project.repo_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="paper-btn paper-btn-sm"
                        title="Inspect GitHub Repository"
                      >
                        <GithubIcon size={14} />
                        <span>Code</span>
                      </a>
                    )}
                    {project.demo_url && (
                      <a
                        href={project.demo_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="paper-btn paper-btn-sm"
                        title="Live Demo"
                      >
                        <ExternalLink size={14} />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Featured Manuscripts & Learning Notes */}
      <section>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
          <div>
            <h2 style={{ fontSize: '1.6rem', color: 'var(--text-primary)', marginBottom: '4px' }}>
              Curated Manuscripts & Study Guides
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Technical documents formatted for in-browser reading and direct download
            </p>
          </div>

          <button 
            onClick={() => onNavigate('notes')}
            className="paper-btn paper-btn-sm"
          >
            <span>All Documents</span>
            <ArrowRight size={13} />
          </button>
        </div>

        {notes.length === 0 ? (
          <div className="paper-panel-subtle" style={{ padding: '36px 20px', textAlign: 'center' }}>
            <FileText size={32} color="var(--text-tertiary)" style={{ margin: '0 auto 10px auto' }} />
            <h3 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', marginBottom: '6px' }}>
              No manuscripts uploaded yet
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', maxWidth: '460px', margin: '0 auto' }}>
              Upload your PDF guides, DOCX cheatsheets, or Markdown architectures via <code style={{ fontFamily: 'var(--font-mono)' }}>/#admin</code> to populate your study vault.
            </p>
          </div>
        ) : (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', 
            gap: '18px' 
          }}>
            {notes.slice(0, 3).map((note) => (
              <div 
                key={note.id} 
                className="paper-card" 
                style={{ 
                  padding: '22px', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  justifyContent: 'space-between' 
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span className={`paper-stamp ${note.file_type === 'PDF' ? 'paper-stamp-red' : note.file_type === 'DOCX' ? 'paper-stamp-blue' : ''}`}>
                      {note.file_type}
                    </span>
                    <span className="mono-stamp" style={{ color: 'var(--text-tertiary)' }}>
                      {note.file_size}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.15rem', marginBottom: '8px', lineHeight: 1.3 }}>
                    {note.title}
                  </h3>

                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '16px' }}>
                    {note.description}
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '8px', paddingTop: '14px', borderTop: '1px solid var(--border-color)' }}>
                  <button
                    onClick={() => onOpenNoteModal(note)}
                    className="paper-btn paper-btn-sm"
                    style={{ flex: 1 }}
                  >
                    <FileText size={13} />
                    <span>View Form</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
