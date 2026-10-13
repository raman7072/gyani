import React from 'react';
import { 
  FolderGit2, 
  FileText, 
  BookOpen, 
  BarChart3, 
  PieChart, 
  Layers, 
  Cpu, 
  Code2
} from 'lucide-react';
import { getProjectCategories, normalizeProjectStatus, normalizeCategory } from '../services/supabase';

export function Overview({ 
  projects = [], 
  notes = [], 
  docs = [], 
  onNavigate
}) {
  // 1. Projects Statistics & Metrics
  const totalProjects = projects.length;
  const completedProjects = projects.filter(p => normalizeProjectStatus(p.status) === 'Completed').length;
  const inProgressProjects = projects.filter(p => normalizeProjectStatus(p.status) === 'βeta' || normalizeProjectStatus(p.status) === 'In Progress').length;
  const plannedProjects = Math.max(0, totalProjects - completedProjects - inProgressProjects);
  const completionPercentage = totalProjects > 0 ? Math.round((completedProjects / totalProjects) * 100) : 0;

  // 2. Project Categories Aggregation
  const categoryMap = projects.reduce((acc, p) => {
    const cats = getProjectCategories(p);
    cats.forEach(cat => {
      acc[cat] = (acc[cat] || 0) + 1;
    });
    return acc;
  }, {});
  const sortedCategories = Object.entries(categoryMap).sort((a, b) => b[1] - a[1]);

  // 3. Vault & Document Formats Breakdown
  const totalNotes = notes.length;
  const formatMap = notes.reduce((acc, n) => {
    const type = (n.file_type || 'DOC').toUpperCase();
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});
  const sortedFormats = Object.entries(formatMap).sort((a, b) => b[1] - a[1]);
  const pdfCount = formatMap['PDF'] || 0;
  const docxCount = formatMap['DOCX'] || 0;
  const mdCount = formatMap['MD'] || 0;

  // 4. Technology Stack Tags Frequency
  const tagMap = projects.reduce((acc, p) => {
    (p.tags || []).forEach(t => {
      acc[t] = (acc[t] || 0) + 1;
    });
    return acc;
  }, {});
  const sortedTags = Object.entries(tagMap).sort((a, b) => b[1] - a[1]);
  const totalUniqueTech = Object.keys(tagMap).length;

  // 5. Documentation Metrics
  const totalDocs = docs.length;
  const docCategories = [...new Set(docs.map(d => d.category || 'Architecture'))];
  const totalWords = docs.reduce((acc, d) => acc + (d.content ? d.content.split(/\s+/).length : 0), 0);
  const approxReadingMinutes = Math.max(1, Math.round(totalWords / 200));

  // 6. SVG Donut Chart Calculation
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const safeTotal = totalProjects || 1;
  const completedDash = (completedProjects / safeTotal) * circumference;
  const activeDash = (inProgressProjects / safeTotal) * circumference;
  const plannedDash = (plannedProjects / safeTotal) * circumference;

  const completedOffset = 0;
  const activeOffset = -completedDash;
  const plannedOffset = -(completedDash + activeDash);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* 1. CLEAN MINIMALIST HEADER */}
      <div className="page-header" style={{ marginBottom: 0 }}>
        <h1 style={{ fontSize: 'clamp(2rem, 4vw, 2.8rem)', marginBottom: '6px' }}>
          Overview
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '640px', fontFamily: 'var(--font-serif)' }}>
          Summary of software repositories, study manuscripts, and documentation.
        </p>
      </div>

      {/* 2. CORE METRICS (4 CLEAN CARDS) */}
      <section className="dashboard-metrics-grid">
        {/* Repositories */}
        <div 
          className="paper-panel-subtle dashboard-metric-card"
          onClick={() => onNavigate('projects')}
          style={{ cursor: 'pointer' }}
          title="View Projects"
        >
          <div>
            <div className="dashboard-metric-header">
              <span className="mono-stamp" style={{ color: 'var(--text-tertiary)' }}>
                REPOSITORIES
              </span>
              <FolderGit2 size={15} color="var(--text-secondary)" />
            </div>
            <div className="dashboard-metric-value">
              {totalProjects}
            </div>
          </div>
          <div className="dashboard-metric-sub">
            <span>
              <strong style={{ color: 'var(--text-primary)' }}>{completedProjects}</strong> done • {inProgressProjects} βeta
            </span>
            <span className="paper-stamp paper-stamp-sage" style={{ fontSize: '0.65rem', padding: '1px 5px' }}>
              {completionPercentage}%
            </span>
          </div>
        </div>

        {/* Study Vault */}
        <div 
          className="paper-panel-subtle dashboard-metric-card"
          onClick={() => onNavigate('notes')}
          style={{ cursor: 'pointer' }}
          title="View Manuscripts"
        >
          <div>
            <div className="dashboard-metric-header">
              <span className="mono-stamp" style={{ color: 'var(--text-tertiary)' }}>
                MANUSCRIPTS
              </span>
              <FileText size={15} color="var(--text-secondary)" />
            </div>
            <div className="dashboard-metric-value">
              {totalNotes}
            </div>
          </div>
          <div className="dashboard-metric-sub">
            <span>{pdfCount} PDF • {docxCount} DOCX • {mdCount} MD</span>
          </div>
        </div>

        {/* Documentation */}
        <div 
          className="paper-panel-subtle dashboard-metric-card"
          onClick={() => onNavigate('docs')}
          style={{ cursor: 'pointer' }}
          title="View Documentation"
        >
          <div>
            <div className="dashboard-metric-header">
              <span className="mono-stamp" style={{ color: 'var(--text-tertiary)' }}>
                DOCUMENTATION
              </span>
              <BookOpen size={15} color="var(--text-secondary)" />
            </div>
            <div className="dashboard-metric-value">
              {totalDocs}
            </div>
          </div>
          <div className="dashboard-metric-sub">
            <span>{docCategories.length} categories • ~{approxReadingMinutes}m read</span>
          </div>
        </div>

        {/* Tech Stack */}
        <div 
          className="paper-panel-subtle dashboard-metric-card"
          onClick={() => onNavigate('projects')}
          style={{ cursor: 'pointer' }}
          title="View Tech Stack"
        >
          <div>
            <div className="dashboard-metric-header">
              <span className="mono-stamp" style={{ color: 'var(--text-tertiary)' }}>
                TECHNOLOGIES
              </span>
              <Cpu size={15} color="var(--text-secondary)" />
            </div>
            <div className="dashboard-metric-value">
              {totalUniqueTech}
            </div>
          </div>
          <div className="dashboard-metric-sub">
            <span>Across {totalProjects} projects</span>
          </div>
        </div>
      </section>

      {/* 3. VISUAL CHARTS & DISTRIBUTIONS */}
      <section className="dashboard-charts-grid">
        
        {/* CHART 1: Category & Domain Distribution */}
        <div className="paper-card dashboard-chart-card">
          <div className="dashboard-chart-title-bar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BarChart3 size={15} color="var(--text-primary)" />
              <h3 style={{ fontSize: '0.98rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                Categories
              </h3>
            </div>
            <span className="mono-stamp" style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
              {sortedCategories.length} Domains
            </span>
          </div>

          {sortedCategories.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>
              No categories cataloged yet.
            </div>
          ) : (
            <div className="chart-bar-list">
              {sortedCategories.slice(0, 5).map(([category, count]) => {
                const percentage = totalProjects > 0 ? Math.round((count / totalProjects) * 100) : 0;
                return (
                  <div 
                    key={category} 
                    className="chart-bar-item"
                    onClick={() => onNavigate('projects')}
                    style={{ cursor: 'pointer' }}
                    title={`${category} (${count})`}
                  >
                    <div className="chart-bar-label-row">
                      <span style={{ 
                        fontWeight: 600, 
                        color: 'var(--text-primary)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: '65%'
                      }}>
                        {category}
                      </span>
                      <span style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', flexShrink: 0, fontSize: '0.75rem' }}>
                        {count} ({percentage}%)
                      </span>
                    </div>
                    <div className="chart-bar-track">
                      <div 
                        className="chart-bar-fill" 
                        style={{ 
                          width: `${percentage}%`,
                          background: 'var(--text-primary)'
                        }} 
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* CHART 2: Project Delivery Gauge */}
        <div className="paper-card dashboard-chart-card">
          <div className="dashboard-chart-title-bar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <PieChart size={15} color="var(--text-primary)" />
              <h3 style={{ fontSize: '0.98rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                Project Status
              </h3>
            </div>
            <span className="mono-stamp" style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
              {totalProjects} Systems
            </span>
          </div>

          <div className="donut-layout">
            <div className="donut-circle-box">
              <svg width="130" height="130" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  fill="transparent"
                  stroke="var(--bg-tertiary)"
                  strokeWidth="11"
                />
                {totalProjects > 0 ? (
                  <>
                    <circle
                      cx="50"
                      cy="50"
                      r={radius}
                      fill="transparent"
                      stroke="var(--text-primary)"
                      strokeWidth="11"
                      strokeDasharray={`${completedDash} ${circumference}`}
                      strokeDashoffset={completedOffset}
                      strokeLinecap="round"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r={radius}
                      fill="transparent"
                      stroke="var(--accent-stamp)"
                      strokeWidth="11"
                      strokeDasharray={`${activeDash} ${circumference}`}
                      strokeDashoffset={activeOffset}
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r={radius}
                      fill="transparent"
                      stroke="var(--text-tertiary)"
                      strokeWidth="11"
                      strokeDasharray={`${plannedDash} ${circumference}`}
                      strokeDashoffset={plannedOffset}
                    />
                  </>
                ) : (
                  <circle
                    cx="50"
                    cy="50"
                    r={radius}
                    fill="transparent"
                    stroke="var(--border-color)"
                    strokeWidth="11"
                  />
                )}
              </svg>
              <div className="donut-center-text">
                <div style={{ fontSize: '1.4rem', fontWeight: 700, fontFamily: 'var(--font-serif)', color: 'var(--text-primary)', lineHeight: 1 }}>
                  {completionPercentage}%
                </div>
                <div style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
                  Delivered
                </div>
              </div>
            </div>

            <div className="donut-legend">
              <div className="donut-legend-item">
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: 'var(--text-primary)', flexShrink: 0 }} />
                  <span style={{ color: 'var(--text-secondary)' }}>Completed</span>
                </div>
                <span className="mono-stamp" style={{ fontWeight: 600 }}>{completedProjects}</span>
              </div>

              <div className="donut-legend-item">
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: 'var(--accent-stamp)', flexShrink: 0 }} />
                  <span style={{ color: 'var(--text-secondary)' }}>In Progress</span>
                </div>
                <span className="mono-stamp" style={{ fontWeight: 600 }}>{inProgressProjects}</span>
              </div>

              <div className="donut-legend-item">
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: 'var(--text-tertiary)', flexShrink: 0 }} />
                  <span style={{ color: 'var(--text-secondary)' }}>Planned</span>
                </div>
                <span className="mono-stamp" style={{ fontWeight: 600 }}>{plannedProjects}</span>
              </div>
            </div>
          </div>
        </div>

        {/* CHART 3: Study Vault Format Breakdown */}
        <div className="paper-card dashboard-chart-card">
          <div className="dashboard-chart-title-bar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={15} color="var(--text-primary)" />
              <h3 style={{ fontSize: '0.98rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                File Formats
              </h3>
            </div>
            <span className="mono-stamp" style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
              {totalNotes} Documents
            </span>
          </div>

          <div>
            <div className="stacked-format-bar">
              {totalNotes > 0 ? (
                sortedFormats.map(([type, count], idx) => {
                  const pct = Math.max(3, (count / totalNotes) * 100);
                  const colors = [
                    'var(--text-primary)', 
                    'var(--accent-stamp)', 
                    'var(--accent-stamp-sage, #486b53)', 
                    'var(--accent-stamp-blue, #2c4c68)', 
                    'var(--text-tertiary)'
                  ];
                  return (
                    <div 
                      key={type} 
                      className="stacked-format-segment"
                      style={{ 
                        width: `${pct}%`, 
                        background: colors[idx % colors.length] 
                      }}
                      title={`${type}: ${count}`}
                    />
                  );
                })
              ) : (
                <div style={{ width: '100%', background: 'var(--border-color)' }} />
              )}
            </div>

            <div className="format-breakdown-grid">
              {sortedFormats.map(([type, count], idx) => {
                const colors = [
                  'var(--text-primary)', 
                  'var(--accent-stamp)', 
                  'var(--accent-stamp-sage, #486b53)', 
                  'var(--accent-stamp-blue, #2c4c68)', 
                  'var(--text-tertiary)'
                ];
                return (
                  <div 
                    key={type} 
                    className="paper-panel-subtle" 
                    onClick={() => onNavigate('notes')}
                    style={{ padding: '8px 10px', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                      <span style={{ width: '7px', height: '7px', borderRadius: '2px', background: colors[idx % colors.length], flexShrink: 0 }} />
                      <span style={{ fontSize: '0.74rem', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{type}</span>
                    </div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 700, fontFamily: 'var(--font-serif)', color: 'var(--text-primary)' }}>
                      {count} <span style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', fontWeight: 400 }}>files</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* CHART 4: Tech Stack Frequency Matrix */}
        <div className="paper-card dashboard-chart-card">
          <div className="dashboard-chart-title-bar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Code2 size={15} color="var(--text-primary)" />
              <h3 style={{ fontSize: '0.98rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                Technologies
              </h3>
            </div>
            <span className="mono-stamp" style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
              {totalUniqueTech} Indexed
            </span>
          </div>

          <div>
            <div className="tag-cloud-grid">
              {sortedTags.length > 0 ? (
                sortedTags.slice(0, 16).map(([tag, count]) => (
                  <span 
                    key={tag} 
                    className="tag-cloud-pill"
                    onClick={() => onNavigate('projects')}
                    style={{ cursor: 'pointer' }}
                    title={`Used in ${count} project(s)`}
                  >
                    <span>{tag}</span>
                    <span className="tag-cloud-count">{count}</span>
                  </span>
                ))
              ) : (
                <div style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>
                  No technologies indexed yet.
                </div>
              )}
            </div>
          </div>
        </div>

      </section>

    </div>
  );
}

