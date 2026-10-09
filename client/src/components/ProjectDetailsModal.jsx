import React from 'react';
import { 
  X, 
  ExternalLink, 
  ArrowUpRight,
  GitBranch
} from 'lucide-react';
import { GithubIcon } from './GithubIcon';

export function ProjectDetailsModal({ project, onClose }) {
  if (!project) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="paper-panel modal-dialog" 
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '780px' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '18px', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <span className="paper-stamp">
                {project.category}
              </span>
              <span className={`paper-stamp ${project.status === 'Completed' ? 'paper-stamp-sage' : 'paper-stamp-red'}`}>
                {project.status}
              </span>
            </div>

            <h2 style={{ fontSize: '1.65rem', color: 'var(--text-primary)', lineHeight: 1.25 }}>
              {project.title}
            </h2>
          </div>

          <button 
            onClick={onClose} 
            className="paper-btn paper-btn-icon"
            aria-label="Close project details"
          >
            <X size={16} />
          </button>
        </div>

        {/* Action Links Bar */}
        <div 
          className="paper-panel-subtle" 
          style={{ 
            padding: '14px 18px', 
            display: 'flex', 
            flexWrap: 'wrap', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            gap: '12px',
            marginBottom: '24px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
            <GitBranch size={15} color="var(--text-primary)" />
            <span>Open Source Project Specification</span>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            {project.repo_url && (
              <a
                href={project.repo_url}
                target="_blank"
                rel="noopener noreferrer"
                className="paper-btn paper-btn-primary paper-btn-sm"
              >
                <GithubIcon size={14} />
                <span>GitHub Repository</span>
                <ArrowUpRight size={12} />
              </a>
            )}
            {project.demo_url && (
              <a
                href={project.demo_url}
                target="_blank"
                rel="noopener noreferrer"
                className="paper-btn paper-btn-sm"
              >
                <ExternalLink size={14} />
                <span>Live Demo</span>
              </a>
            )}
          </div>
        </div>

        {/* Overview Description */}
        <div style={{ marginBottom: '20px' }}>
          <div className="mono-stamp" style={{ color: 'var(--text-tertiary)', marginBottom: '6px' }}>
            PROJECT OVERVIEW
          </div>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.65, fontFamily: 'var(--font-serif)' }}>
            {project.description}
          </p>
        </div>

        {/* Architecture & Engineering Decisions */}
        {project.architecture_notes && (
          <div style={{ marginBottom: '24px' }}>
            <div className="mono-stamp" style={{ color: 'var(--text-tertiary)', marginBottom: '6px' }}>
              ARCHITECTURE & ENGINEERING NOTES
            </div>
            <div 
              style={{ 
                padding: '16px 20px', 
                fontSize: '0.9rem', 
                lineHeight: 1.65, 
                color: 'var(--text-primary)',
                background: 'var(--bg-secondary)',
                borderLeft: '3px solid var(--text-primary)',
                borderRadius: '4px'
              }}
            >
              {project.architecture_notes}
            </div>
          </div>
        )}

        {/* Tech Stack Chips */}
        <div style={{ marginBottom: '20px' }}>
          <div className="mono-stamp" style={{ color: 'var(--text-tertiary)', marginBottom: '8px' }}>
            TECHNOLOGIES & STACK
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {project.tags?.map((tag) => (
              <span key={tag} className="paper-stamp">
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
          <button onClick={onClose} className="paper-btn">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
