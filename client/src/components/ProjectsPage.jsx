import React, { useState, useMemo } from 'react';
import { 
  FolderGit2, 
  ExternalLink, 
  Search, 
  Grid, 
  List, 
  ArrowUpRight,
  Share2,
  Check
} from 'lucide-react';
import { copyShareLink } from '../utils/share';
import { GithubIcon } from './GithubIcon';
import { getProjectCategories, normalizeProjectStatus } from '../services/supabase';
import { useResponsiveViewMode } from '../hooks/useResponsiveViewMode';

export function ProjectsPage({ projects, onOpenProjectModal }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState('');

  const handleShareProject = async (e, project) => {
    e.stopPropagation();
    await copyShareLink('project', project.id, project.title);
    setCopiedId(project.id);
    setTimeout(() => setCopiedId(''), 2200);
  };
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [viewMode, setViewMode] = useResponsiveViewMode('directory');

  const categories = useMemo(() => {
    const set = new Set(['All']);
    projects.forEach(p => {
      getProjectCategories(p).forEach(cat => set.add(cat));
    });
    return Array.from(set);
  }, [projects]);

  const statuses = ['All', 'Completed', 'βeta', 'In Progress', 'Planned'];

  const filteredProjects = useMemo(() => {
    return projects.filter(project => {
      const cats = getProjectCategories(project);
      const matchesSearch = 
        project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())) ||
        cats.some(cat => cat.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesCategory = selectedCategory === 'All' || cats.includes(selectedCategory);
      const normStatus = normalizeProjectStatus(project.status);
      const matchesStatus = selectedStatus === 'All' || normStatus === selectedStatus;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [projects, searchTerm, selectedCategory, selectedStatus]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Page Header */}
      <div className="page-header" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: 'clamp(2rem, 4vw, 2.8rem)', marginBottom: '6px' }}>
            Projects
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '640px', fontFamily: 'var(--font-serif)' }}>
            Software systems, distributed services, and experiments with repository links and architecture notes.
          </p>
        </div>

        {/* View Toggle */}
        <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-secondary)', padding: '3px', borderRadius: '5px', border: '1px solid var(--border-color)' }}>
          <button
            onClick={() => setViewMode('grid')}
            className={`paper-stamp ${viewMode === 'grid' ? 'paper-stamp-active' : ''}`}
            style={{ cursor: 'pointer', border: 'none' }}
            title="Grid View"
          >
            <Grid size={13} />
            <span>Grid</span>
          </button>
          <button
            onClick={() => setViewMode('directory')}
            className={`paper-stamp ${viewMode === 'directory' ? 'paper-stamp-active' : ''}`}
            style={{ cursor: 'pointer', border: 'none' }}
            title="Directory Table View"
          >
            <List size={13} />
            <span>Directory</span>
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
              placeholder="Search by title, stack (e.g. Go, Supabase, React)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="paper-input"
              style={{ paddingLeft: '36px' }}
            />
          </div>

          {/* Status selector */}
          <div style={{ display: 'flex', gap: '5px', overflowX: 'auto' }}>
            {statuses.map(st => {
              const count = st === 'All' 
                ? projects.length 
                : projects.filter(p => normalizeProjectStatus(p.status) === st).length;
              return (
                <button
                  key={st}
                  onClick={() => setSelectedStatus(st)}
                  className={`paper-stamp ${selectedStatus === st ? 'paper-stamp-active' : ''}`}
                  style={{ cursor: 'pointer' }}
                >
                  <span>{st}</span>
                  <span style={{ opacity: 0.65, fontSize: '0.75em', marginLeft: '4px' }}>({count})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Categories selector */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
          <span className="mono-stamp" style={{ color: 'var(--text-tertiary)', alignSelf: 'center', marginRight: '4px' }}>
            Category:
          </span>
          {categories.map(cat => {
            const count = cat === 'All' ? projects.length : projects.filter(p => getProjectCategories(p).includes(cat)).length;
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

      {/* Projects Display: Grid View */}
      {viewMode === 'grid' && (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))', 
          gap: '22px' 
        }}>
          {filteredProjects.map((project) => (
            <div 
              key={project.id} 
              className="paper-card" 
              onClick={() => onOpenProjectModal(project)}
              style={{ 
                padding: '24px', 
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'space-between',
                minHeight: '270px',
                cursor: 'pointer'
              }}
            >
              <div>
                {/* Status and Category */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px', gap: '8px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {getProjectCategories(project).map((cat, idx) => (
                      <span key={idx} className="paper-stamp">
                        {cat}
                      </span>
                    ))}
                  </div>

                  <span className={`paper-stamp ${project.status === 'Completed' ? 'paper-stamp-sage' : 'paper-stamp-red'}`}>
                    {(project.status === 'Active' || project.status === 'Beta Testing' || project.status === 'βeta testing' || project.status === 'Beta') ? 'βeta' : project.status}
                  </span>
                </div>

                {/* Title */}
                <h3 style={{ fontSize: '1.25rem', marginBottom: '8px', lineHeight: 1.3 }}>
                  {project.title}
                </h3>

                {/* Description */}
                {project.description && (
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '16px' }}>
                    {project.description}
                  </p>
                )}

                {/* Tech Tags */}
                {project.tags && project.tags.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '18px' }}>
                    {project.tags.map((tag) => (
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
                )}
              </div>

              {/* Card Footer Actions */}
              <div>
                {/* Progress bar if ongoing */}
                {project.progress !== undefined && project.progress < 100 && (
                  <div style={{ marginBottom: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.725rem', color: 'var(--text-tertiary)', marginBottom: '3px', fontFamily: 'var(--font-mono)' }}>
                      <span>PROGRESS</span>
                      <span>{project.progress}%</span>
                    </div>
                    <div style={{ height: '3px', width: '100%', background: 'var(--border-color)', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${project.progress}%`, background: 'var(--text-primary)' }} />
                    </div>
                  </div>
                )}

                {/* Card Action Buttons (without redundant Notes button) */}
                <div 
                  onClick={(e) => e.stopPropagation()}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    gap: '7px',
                    paddingTop: '14px',
                    borderTop: '1px solid var(--border-color)',
                    width: '100%',
                    boxSizing: 'border-box'
                  }}
                >
                  {project.demo_url && (
                    <a
                      href={project.demo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="paper-btn paper-btn-primary paper-btn-sm"
                      style={{ flex: 1, justifyContent: 'center', padding: '6px 8px', fontSize: '0.78rem' }}
                      title="Open Live Deployment"
                    >
                      <ExternalLink size={13} />
                      <span>Live Demo</span>
                    </a>
                  )}

                  {project.repo_url && (
                    <a
                      href={project.repo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="paper-btn paper-btn-sm"
                      style={{ 
                        flex: 1, 
                        justifyContent: 'center', 
                        padding: '6px 8px', 
                        fontSize: '0.78rem'
                      }}
                      title="Inspect GitHub Repository"
                    >
                      <GithubIcon size={13} />
                      <span>GitHub</span>
                      <ArrowUpRight size={11} />
                    </a>
                  )}

                  <button
                    onClick={(e) => handleShareProject(e, project)}
                    className="paper-btn paper-btn-sm"
                    style={{ padding: '6px 10px', fontSize: '0.78rem' }}
                    title="Copy direct share link to this project"
                  >
                    {copiedId === project.id ? <Check size={13} color="var(--accent-stamp-sage)" /> : <Share2 size={13} />}
                    <span>{copiedId === project.id ? 'Copied' : 'Share'}</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Directory View (matches Recent Repositories style from Overview) */}
      {viewMode === 'directory' && filteredProjects.length > 0 && (
        <div className="paper-panel-subtle" style={{ padding: 'clamp(14px, 3.5vw, 20px)', borderRadius: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', paddingBottom: '10px', borderBottom: '1px solid var(--border-color)', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px', minWidth: 0 }}>
              <FolderGit2 size={15} color="var(--text-primary)" style={{ flexShrink: 0 }} />
              <h3 style={{ fontSize: '0.96rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                Repositories
              </h3>
            </div>
            <span className="mono-stamp" style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
              {filteredProjects.length} {filteredProjects.length === 1 ? 'Repository' : 'Repositories'}
            </span>
          </div>

          <div className="dashboard-mini-table">
            {filteredProjects.map((project) => {
              const normStatus = normalizeProjectStatus(project.status);
              const statusClass = normStatus === 'Completed' ? 'paper-stamp-sage' : (normStatus === 'βeta' ? 'paper-stamp-red' : '');

              return (
                <div 
                  key={project.id} 
                  className="dashboard-mini-row"
                  onClick={() => onOpenProjectModal(project)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="dashboard-mini-info">
                    <div className="dashboard-mini-title" title={project.title}>
                      {project.title}
                    </div>
                    {project.description && (
                      <div className="dashboard-mini-desc">
                        {project.description}
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '3px', flexWrap: 'wrap' }}>
                      {getProjectCategories(project).map((cat, idx) => (
                        <span key={idx} className="paper-stamp" style={{ fontSize: '0.65rem', padding: '0 4px' }}>
                          {cat}
                        </span>
                      ))}
                      <span className={`paper-stamp ${statusClass}`} style={{ fontSize: '0.65rem', padding: '0 4px' }}>
                        {normStatus}
                      </span>
                      {project.tags?.slice(0, 3).map(tag => (
                        <span key={tag} className="mono-stamp" style={{ fontSize: '0.65rem', padding: '0 4px', color: 'var(--text-secondary)' }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="dashboard-mini-actions" onClick={(e) => e.stopPropagation()}>
                    {project.repo_url && (
                      <a
                        href={project.repo_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="paper-btn paper-btn-icon"
                        style={{ padding: '4px' }}
                        title="GitHub"
                      >
                        <GithubIcon size={12} />
                      </a>
                    )}
                    {project.demo_url && (
                      <a
                        href={project.demo_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="paper-btn paper-btn-primary paper-btn-sm"
                        style={{ fontSize: '0.72rem', padding: '3px 8px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        title="Live Deployment"
                      >
                        <ExternalLink size={11} />
                        <span className="hide-on-mobile">Live</span>
                      </a>
                    )}
                    <button
                      onClick={(e) => handleShareProject(e, project)}
                      className="paper-btn paper-btn-icon"
                      style={{ padding: '4px' }}
                      title="Share project link"
                    >
                      {copiedId === project.id ? <Check size={12} color="var(--accent-stamp-sage)" /> : <Share2 size={12} />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredProjects.length === 0 && (
        <div className="paper-panel" style={{ padding: '48px 20px', textAlign: 'center' }}>
          <FolderGit2 size={36} color="var(--text-tertiary)" style={{ margin: '0 auto 12px auto' }} />
          <h3 style={{ fontSize: '1.2rem', color: 'var(--text-primary)', marginBottom: '6px' }}>
            No records found
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '14px' }}>
            Modify your query or clear filters.
          </p>
          <button
            onClick={() => { setSearchTerm(''); setSelectedCategory('All'); setSelectedStatus('All'); }}
            className="paper-btn"
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
}
