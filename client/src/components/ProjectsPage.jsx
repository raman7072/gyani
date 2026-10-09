import React, { useState, useMemo } from 'react';
import { 
  FolderGit2, 
  ExternalLink, 
  Search, 
  Grid, 
  List, 
  ArrowUpRight,
  Info
} from 'lucide-react';
import { GithubIcon } from './GithubIcon';

export function ProjectsPage({ projects, onOpenProjectModal }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'directory'

  const categories = useMemo(() => {
    const set = new Set(['All']);
    projects.forEach(p => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [projects]);

  const statuses = ['All', 'Completed', 'Active', 'In Progress', 'Planned'];

  const filteredProjects = useMemo(() => {
    return projects.filter(project => {
      const matchesSearch = 
        project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesCategory = selectedCategory === 'All' || project.category === selectedCategory;
      const matchesStatus = selectedStatus === 'All' || project.status === selectedStatus;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [projects, searchTerm, selectedCategory, selectedStatus]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Page Header */}
      <div className="page-header" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <span className="paper-stamp paper-stamp-active">
              CATALOG
            </span>
            <span className="paper-stamp">
              OPEN SOURCE REPOSITORIES
            </span>
          </div>
          <h1 style={{ fontSize: 'clamp(2rem, 4vw, 2.8rem)', marginBottom: '6px' }}>
            Projects Directory
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '640px', fontFamily: 'var(--font-serif)' }}>
            Complete register of software systems, distributed services, and experiments. Direct links to GitHub repositories and architecture design notes.
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
              const count = st === 'All' ? projects.length : projects.filter(p => p.status === st).length;
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
            const count = cat === 'All' ? projects.length : projects.filter(p => p.category === cat).length;
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
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))', 
          gap: '20px' 
        }}>
          {filteredProjects.map((project) => (
            <div 
              key={project.id} 
              className="paper-card" 
              style={{ 
                padding: '24px', 
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'space-between',
                minHeight: '270px'
              }}
            >
              <div>
                {/* Status and Category */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <span className="paper-stamp">
                    {project.category}
                  </span>

                  <span className={`paper-stamp ${project.status === 'Completed' ? 'paper-stamp-sage' : 'paper-stamp-red'}`}>
                    {project.status}
                  </span>
                </div>

                {/* Title */}
                <h3 style={{ fontSize: '1.25rem', marginBottom: '8px', lineHeight: 1.3 }}>
                  {project.title}
                </h3>

                {/* Description */}
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '16px' }}>
                  {project.description}
                </p>

                {/* Tech Tags */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '18px' }}>
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

                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  paddingTop: '14px',
                  borderTop: '1px solid var(--border-color)',
                  gap: '8px'
                }}>
                  <button
                    onClick={() => onOpenProjectModal(project)}
                    className="paper-btn paper-btn-sm"
                    style={{ flex: 1 }}
                    title="Read architecture overview & design notes"
                  >
                    <Info size={13} />
                    <span>Notes</span>
                  </button>

                  {/* Direct GitHub Link */}
                  {project.repo_url && (
                    <a
                      href={project.repo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="paper-btn paper-btn-primary paper-btn-sm"
                      style={{ flex: 1.3 }}
                      title="Inspect GitHub Repository"
                    >
                      <GithubIcon size={14} />
                      <span>GitHub</span>
                      <ArrowUpRight size={12} />
                    </a>
                  )}

                  {project.demo_url && (
                    <a
                      href={project.demo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="paper-btn paper-btn-sm"
                      style={{ padding: '6px 9px' }}
                      title="Open Live Deployment"
                    >
                      <ExternalLink size={13} />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Directory Table View */}
      {viewMode === 'directory' && (
        <div className="paper-panel" style={{ overflowX: 'auto', padding: '8px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-tertiary)', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>
                <th style={{ padding: '12px 14px' }}>Manuscript / Project</th>
                <th style={{ padding: '12px 14px' }}>Category</th>
                <th style={{ padding: '12px 14px' }}>Tech Stack</th>
                <th style={{ padding: '12px 14px' }}>Status</th>
                <th style={{ padding: '12px 14px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProjects.map((project) => (
                <tr 
                  key={project.id}
                  style={{ borderBottom: '1px solid var(--border-color)' }}
                >
                  <td style={{ padding: '14px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.95rem', marginBottom: '2px', fontFamily: 'var(--font-serif)' }}>
                      {project.title}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', maxWidth: '380px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {project.description}
                    </div>
                  </td>
                  <td style={{ padding: '14px' }}>
                    <span className="paper-stamp">
                      {project.category}
                    </span>
                  </td>
                  <td style={{ padding: '14px' }}>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', maxWidth: '200px' }}>
                      {project.tags?.slice(0, 3).map(tag => (
                        <span key={tag} className="mono-stamp" style={{ padding: '1px 5px', borderRadius: '3px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td style={{ padding: '14px' }}>
                    <span className={`paper-stamp ${project.status === 'Completed' ? 'paper-stamp-sage' : 'paper-stamp-red'}`}>
                      {project.status}
                    </span>
                  </td>
                  <td style={{ padding: '14px', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '6px' }}>
                      <button
                        onClick={() => onOpenProjectModal(project)}
                        className="paper-btn paper-btn-sm"
                        style={{ padding: '5px 8px' }}
                        title="View Architecture Notes"
                      >
                        <Info size={13} />
                      </button>
                      {project.repo_url && (
                        <a
                          href={project.repo_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="paper-btn paper-btn-primary paper-btn-sm"
                          style={{ padding: '5px 10px' }}
                          title="Check out GitHub Repository"
                        >
                          <GithubIcon size={13} />
                          <span>Repo</span>
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
