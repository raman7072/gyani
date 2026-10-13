import React, { useState, useMemo, useEffect, useId } from 'react';
import { 
  BookOpen, 
  Search, 
  ChevronRight, 
  Copy, 
  Check, 
  Clock, 
  Calendar, 
  Info, 
  Lightbulb, 
  Share2, 
  PanelLeft, 
  Maximize2,
  ArrowLeft,
  Grid,
  Table,
  X,
  FileText,
  Layers,
  Compass
} from 'lucide-react';
import { copyShareLink } from '../utils/share';
import { useResponsiveViewMode } from '../hooks/useResponsiveViewMode';
import { marked } from 'marked';
import mermaid from 'mermaid';

// Configure marked options for GitHub Flavored Markdown
marked.setOptions({
  gfm: true,
  breaks: true,
});

// Clean excerpt for cards and directory tables
function getDocExcerpt(doc) {
  if (!doc) return '';
  if (doc.summary) return doc.summary;
  if (!doc.content) return 'Technical specification and documentation record.';
  const clean = doc.content
    .replace(/```[\s\S]*?```/g, '')
    .replace(/#+\s+.*/g, '')
    .replace(/>\s+\[!.*?\]/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[*_`]/g, '')
    .trim();
  return clean.slice(0, 160) + (clean.length > 160 ? '...' : '');
}

// Extract outline section headings from doc markdown
function extractDocHeadings(content) {
  if (!content) return [];
  const lines = content.split('\n');
  const sections = [];
  for (const line of lines) {
    if (line.startsWith('## ')) {
      const clean = line.replace('## ', '').replace(/[*_`#]/g, '').trim();
      sections.push(clean);
      if (sections.length >= 3) break;
    }
  }
  return sections;
}

// Dedicated code block with isolated copy state
function CodeBlock({ code, language }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="code-block-wrapper">
      <div className="code-header">
        <span className="mono-stamp">{language || 'CODE'}</span>
        <button
          onClick={handleCopy}
          type="button"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            background: 'transparent',
            border: 'none',
            color: copied ? 'var(--accent-sage)' : 'var(--text-tertiary)',
            cursor: 'pointer',
            fontSize: '0.75rem',
            fontFamily: 'var(--font-mono)'
          }}
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
      <pre className="code-pre">
        <code>{code}</code>
      </pre>
    </div>
  );
}

// Mermaid diagram component supporting graphs, workflows, trees, and sequence diagrams
function MermaidDiagram({ chart }) {
  const [svgHtml, setSvgHtml] = useState('');
  const [hasError, setHasError] = useState(false);
  const reactId = useId();
  const chartId = useMemo(() => `mermaid-${reactId.replace(/[^a-zA-Z0-9]/g, '')}`, [reactId]);

  useEffect(() => {
    let active = true;
    const isDark = typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'dark';

    try {
      mermaid.initialize({
        startOnLoad: false,
        securityLevel: 'loose',
        theme: isDark ? 'dark' : 'neutral',
        fontFamily: 'var(--font-mono, monospace)',
        themeVariables: isDark ? {
          darkMode: true,
          background: '#161618',
          primaryColor: '#27272a',
          primaryTextColor: '#f4f4f5',
          primaryBorderColor: '#52525b',
          lineColor: '#a1a1aa'
        } : {
          background: '#fcfbf7',
          primaryColor: '#f4f1ea',
          primaryTextColor: '#1c1b18',
          primaryBorderColor: '#c8c2b4',
          lineColor: '#5a574d'
        }
      });
    } catch {
      // initialize silently
    }

    const render = async () => {
      try {
        const id = `svg-${chartId}`;
        const { svg } = await mermaid.render(id, chart.trim());
        if (active) {
          setSvgHtml(svg);
          setHasError(false);
        }
      } catch (err) {
        if (active) {
          console.warn('Mermaid rendering issue:', err);
          setHasError(true);
        }
        const errorEl = document.getElementById(`d${chartId}`);
        if (errorEl) errorEl.remove();
      }
    };

    render();

    return () => {
      active = false;
      const el = document.getElementById(chartId);
      if (el) el.remove();
    };
  }, [chart, chartId]);

  if (hasError) {
    return (
      <div className="mermaid-error-card">
        <div className="mono-stamp" style={{ color: 'var(--accent-stamp-red)', marginBottom: '8px', fontSize: '0.72rem' }}>
          WORKFLOW / DIAGRAM PREVIEW
        </div>
        <pre className="code-pre" style={{ background: 'transparent', padding: 0 }}>
          <code>{chart}</code>
        </pre>
      </div>
    );
  }

  if (!svgHtml) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-tertiary)', fontStyle: 'italic', fontSize: '0.82rem' }}>
        Rendering diagram...
      </div>
    );
  }

  return (
    <div className="mermaid-container">
      <div 
        style={{ width: '100%', overflowX: 'auto', display: 'flex', justifyContent: 'center' }}
        dangerouslySetInnerHTML={{ __html: svgHtml }} 
      />
    </div>
  );
}

// Full-feature Markdown & Mermaid renderer supporting bold, italic, code, workflows, graphs, trees, and tables
function renderMarkdown(rawContent) {
  if (!rawContent) return null;

  let tokens = [];
  try {
    tokens = marked.lexer(rawContent);
  } catch (err) {
    console.error('Markdown parse error:', err);
    return <p style={{ whiteSpace: 'pre-wrap' }}>{rawContent}</p>;
  }

  const elements = [];
  let headingCounter = 0;

  tokens.forEach((token, index) => {
    switch (token.type) {
      case 'heading': {
        const id = (token.depth === 2 || token.depth === 3) ? `section-${headingCounter++}` : undefined;
        const html = marked.parseInline(token.text);
        if (token.depth === 1) {
          elements.push(
            <h1 key={index} id={id} style={{ fontSize: '1.9rem', margin: '36px 0 16px', lineHeight: 1.25 }}>
              <span dangerouslySetInnerHTML={{ __html: html }} />
            </h1>
          );
        } else if (token.depth === 2) {
          elements.push(
            <h2 key={index} id={id} style={{ fontSize: '1.45rem', margin: '36px 0 14px', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px', lineHeight: 1.3 }}>
              <span dangerouslySetInnerHTML={{ __html: html }} />
            </h2>
          );
        } else if (token.depth === 3) {
          elements.push(
            <h3 key={index} id={id} style={{ fontSize: '1.18rem', margin: '24px 0 10px', lineHeight: 1.35 }}>
              <span dangerouslySetInnerHTML={{ __html: html }} />
            </h3>
          );
        } else if (token.depth === 4) {
          elements.push(
            <h4 key={index} id={id} style={{ fontSize: '1.05rem', margin: '20px 0 8px', fontWeight: 600 }}>
              <span dangerouslySetInnerHTML={{ __html: html }} />
            </h4>
          );
        } else {
          elements.push(
            <h5 key={index} id={id} style={{ fontSize: '0.95rem', margin: '16px 0 6px', fontWeight: 600 }}>
              <span dangerouslySetInnerHTML={{ __html: html }} />
            </h5>
          );
        }
        break;
      }

      case 'code': {
        const lang = (token.lang || '').toLowerCase().trim();
        if (lang === 'mermaid') {
          elements.push(<MermaidDiagram key={index} chart={token.text} />);
        } else {
          elements.push(<CodeBlock key={index} code={token.text} language={token.lang} />);
        }
        break;
      }

      case 'paragraph': {
        const html = marked.parseInline(token.text);
        elements.push(
          <p 
            key={index} 
            className="docs-paragraph"
            style={{ fontSize: '0.98rem', color: 'var(--text-secondary)', lineHeight: 1.75, marginBottom: '16px' }}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        );
        break;
      }

      case 'list': {
        elements.push(
          <div 
            key={index} 
            className="docs-list-block"
            dangerouslySetInnerHTML={{ __html: marked.parse(token.raw) }} 
          />
        );
        break;
      }

      case 'table': {
        elements.push(
          <div key={index} className="paper-table-wrapper" style={{ margin: '22px 0' }}>
            <table className="paper-table">
              <thead>
                <tr>
                  {token.header.map((col, colIdx) => (
                    <th key={colIdx} style={{ textAlign: token.align && token.align[colIdx] ? token.align[colIdx] : 'left' }}>
                      <span dangerouslySetInnerHTML={{ __html: marked.parseInline(col.text) }} />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {token.rows.map((row, rowIdx) => (
                  <tr key={rowIdx}>
                    {row.map((cell, cellIdx) => (
                      <td key={cellIdx} style={{ textAlign: token.align && token.align[cellIdx] ? token.align[cellIdx] : 'left' }}>
                        <span dangerouslySetInnerHTML={{ __html: marked.parseInline(cell.text) }} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        break;
      }

      case 'blockquote': {
        const rawText = token.text || '';
        if (rawText.startsWith('[!TIP]')) {
          const body = rawText.replace('[!TIP]', '').trim();
          elements.push(
            <div key={index} className="callout" style={{ borderLeftColor: 'var(--accent-sage)' }}>
              <Lightbulb size={18} color="var(--accent-sage)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <div className="callout-title" style={{ color: 'var(--accent-sage)' }}>Marginal Note: Tip</div>
                <div className="callout-body" dangerouslySetInnerHTML={{ __html: marked.parseInline(body || 'Practical implementation advice for system engineers.') }} />
              </div>
            </div>
          );
        } else if (rawText.startsWith('[!NOTE]') || rawText.startsWith('[!IMPORTANT]')) {
          const body = rawText.replace(/\[!(NOTE|IMPORTANT)\]/, '').trim();
          elements.push(
            <div key={index} className="callout" style={{ borderLeftColor: 'var(--text-primary)' }}>
              <Info size={18} color="var(--text-primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <div className="callout-title">Marginal Note</div>
                <div className="callout-body" dangerouslySetInnerHTML={{ __html: marked.parseInline(body || 'Key architectural context and trade-offs.') }} />
              </div>
            </div>
          );
        } else {
          elements.push(
            <div 
              key={index} 
              className="docs-blockquote-container"
              dangerouslySetInnerHTML={{ __html: marked.parse(token.raw) }} 
            />
          );
        }
        break;
      }

      case 'html': {
        elements.push(
          <div key={index} dangerouslySetInnerHTML={{ __html: token.text }} />
        );
        break;
      }

      case 'text': {
        elements.push(
          <p 
            key={index} 
            className="docs-paragraph"
            style={{ fontSize: '0.98rem', color: 'var(--text-secondary)', lineHeight: 1.75, marginBottom: '16px' }}
            dangerouslySetInnerHTML={{ __html: marked.parseInline(token.text) }}
          />
        );
        break;
      }

      case 'hr': {
        elements.push(
          <hr key={index} style={{ margin: '30px 0', border: 'none', borderTop: '1px solid var(--border-color)' }} />
        );
        break;
      }

      default:
        break;
    }
  });

  return elements;
}

export function DocsPage({ docs, activeDocId: controlledDocId, onSelectDoc }) {
  const [internalDocId, setInternalDocId] = useState(controlledDocId || null);
  const [searchTopic, setSearchTopic] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('index'); // 'index' | 'readingTime' | 'title'
  const [viewMode, setViewMode] = useResponsiveViewMode('directory');
  const [copiedShare, setCopiedShare] = useState(false);
  const [copiedCardId, setCopiedCardId] = useState(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [focusMode, setFocusMode] = useState(false);

  const activeDocId = controlledDocId !== undefined ? controlledDocId : internalDocId;

  // Resolve current active doc. If no doc is specified or selected, currentDoc is null (showing Index page)
  const currentDoc = useMemo(() => {
    if (!docs.length || !activeDocId) return null;

    // 1. Try matching by numerical order_index (auto-assigned index like #doc=1, #doc=2)
    const num = parseInt(activeDocId, 10);
    if (!isNaN(num)) {
      const byOrder = docs.find(d => Number(d.order_index) === num);
      if (byOrder) return byOrder;
      // Fallback: 1-based document position
      if (num >= 1 && num <= docs.length) {
        return docs[num - 1];
      }
    }

    // 2. Fallback: match by UUID id or string slug for compatibility
    const bySlugOrId = docs.find(d => String(d.id) === String(activeDocId) || d.slug === activeDocId);
    if (bySlugOrId) return bySlugOrId;

    return null;
  }, [docs, activeDocId]);

  // Track reading progress on scroll when inside an article
  useEffect(() => {
    if (!currentDoc) return;
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
          if (totalHeight > 0) {
            const progress = Math.min(100, Math.max(0, (window.scrollY / totalHeight) * 100));
            setScrollProgress(progress);
          }
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [currentDoc]);

  const handleSelectDoc = (doc) => {
    if (!doc) {
      setInternalDocId(null);
      if (onSelectDoc) {
        onSelectDoc(null);
      } else {
        window.history.pushState(null, '', '#docs');
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const docIndex = doc.order_index ?? (docs.findIndex(d => d.id === doc.id) + 1);
    setInternalDocId(String(docIndex));
    if (onSelectDoc) {
      onSelectDoc(doc);
    } else {
      window.history.pushState(null, '', `#doc=${docIndex}`);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToIndex = () => {
    handleSelectDoc(null);
  };

  const handleShareDoc = async (e, targetDoc) => {
    if (e && e.stopPropagation) e.stopPropagation();
    const docToShare = targetDoc || currentDoc;
    if (!docToShare) return;
    const docIndex = docToShare.order_index ?? (docs.findIndex(d => d.id === docToShare.id) + 1);
    await copyShareLink('doc', docIndex, docToShare.title);
    
    if (targetDoc) {
      setCopiedCardId(targetDoc.id);
      setTimeout(() => setCopiedCardId(null), 2200);
    } else {
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2200);
    }
  };

  // Categories list
  const categories = useMemo(() => {
    const set = new Set(['All']);
    docs.forEach(doc => {
      if (doc.category) set.add(doc.category);
    });
    return Array.from(set);
  }, [docs]);

  // Overall statistics for the index banner
  const totalCorpusWords = useMemo(() => {
    return docs.reduce((acc, d) => acc + (d.content ? d.content.trim().split(/\s+/).filter(Boolean).length : 0), 0);
  }, [docs]);

  const totalReadingMinutes = Math.max(1, Math.round(totalCorpusWords / 180));

  // Filtered & sorted documents for index page
  const filteredDocs = useMemo(() => {
    let result = docs.filter(doc => {
      const q = searchTopic.toLowerCase().trim();
      const matchesSearch = !q ||
        doc.title?.toLowerCase().includes(q) ||
        doc.category?.toLowerCase().includes(q) ||
        doc.summary?.toLowerCase().includes(q) ||
        doc.content?.toLowerCase().includes(q);

      const matchesCat = selectedCategory === 'All' || doc.category === selectedCategory;
      return matchesSearch && matchesCat;
    });

    if (sortBy === 'readingTime') {
      result.sort((a, b) => {
        const aWords = a.content ? a.content.split(/\s+/).length : 0;
        const bWords = b.content ? b.content.split(/\s+/).length : 0;
        return aWords - bWords;
      });
    } else if (sortBy === 'title') {
      result.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    } else {
      // index
      result.sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
    }

    return result;
  }, [docs, searchTopic, selectedCategory, sortBy]);

  // Sidebar grouping for document reader mode
  const groupedDocs = useMemo(() => {
    const groups = {};
    docs.forEach(doc => {
      const cat = doc.category || 'General';
      if (!groups[cat]) groups[cat] = [];
      if (!searchTopic || doc.title.toLowerCase().includes(searchTopic.toLowerCase()) || doc.content.toLowerCase().includes(searchTopic.toLowerCase())) {
        groups[cat].push(doc);
      }
    });
    return groups;
  }, [docs, searchTopic]);

  const currentIndex = docs.findIndex(d => d.id === currentDoc?.id);
  const prevDoc = currentIndex > 0 ? docs[currentIndex - 1] : null;
  const nextDoc = currentIndex < docs.length - 1 ? docs[currentIndex + 1] : null;

  const docContent = currentDoc ? currentDoc.content || '' : '';

  const tocHeadings = useMemo(() => {
    if (!docContent) return [];
    try {
      const tokens = marked.lexer(docContent);
      const headings = [];
      let headingIndex = 0;
      tokens.forEach((token) => {
        if (token.type === 'heading' && (token.depth === 2 || token.depth === 3)) {
          headings.push({
            level: token.depth,
            text: token.text.replace(/[*_`#]/g, '').trim(),
            id: `section-${headingIndex++}`
          });
        }
      });
      return headings;
    } catch {
      return [];
    }
  }, [docContent]);

  const docWordCount = useMemo(() => {
    if (!docContent) return 0;
    return docContent.trim().split(/\s+/).filter(Boolean).length;
  }, [docContent]);

  const docReadTime = Math.max(1, Math.ceil(docWordCount / 180));

  const renderedContent = useMemo(() => {
    return renderMarkdown(docContent);
  }, [docContent]);

  const handleScrollToHeading = (e, id) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // =========================================================================
  // VIEW 1: DOCUMENTATION INDEX / CATALOG PAGE (Default when no doc selected)
  // =========================================================================
  if (!currentDoc) {
    return (
      <div className="docs-index-layout">
        {/* Page Header */}
        <div className="page-header" style={{ marginBottom: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h1 style={{ fontSize: 'clamp(2.1rem, 4vw, 2.9rem)', marginBottom: '8px' }}>
                Documentation
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.98rem', maxWidth: '680px', fontFamily: 'var(--font-serif)' }}>
                System specifications, engineering blueprints, and technical monographs.
              </p>
            </div>

            {/* View Mode Toggle */}
            <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-secondary)', padding: '3px', borderRadius: '5px', border: '1px solid var(--border-color)', alignSelf: 'flex-end' }}>
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
                title="Cards Grid View"
              >
                <Grid size={13} />
                <span>Grid</span>
              </button>
            </div>
          </div>

          {/* Quick Stats Ribbon */}
          <div className="docs-stats-ribbon">
            <div className="docs-stat-card">
              <span className="mono-stamp" style={{ color: 'var(--text-tertiary)', fontSize: '0.68rem' }}>
                INDEXED MONOGRAPHS
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <BookOpen size={15} color="var(--text-primary)" />
                <span style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: 'var(--font-serif)', color: 'var(--text-primary)' }}>
                  {docs.length}
                </span>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>articles</span>
              </div>
            </div>

            <div className="docs-stat-card">
              <span className="mono-stamp" style={{ color: 'var(--text-tertiary)', fontSize: '0.68rem' }}>
                SYSTEM DOMAINS
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Layers size={15} color="var(--text-primary)" />
                <span style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: 'var(--font-serif)', color: 'var(--text-primary)' }}>
                  {categories.length - 1}
                </span>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>categories</span>
              </div>
            </div>

            <div className="docs-stat-card">
              <span className="mono-stamp" style={{ color: 'var(--text-tertiary)', fontSize: '0.68rem' }}>
                CORPUS VOLUME
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FileText size={15} color="var(--text-primary)" />
                <span style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: 'var(--font-serif)', color: 'var(--text-primary)' }}>
                  {totalCorpusWords.toLocaleString()}
                </span>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>words</span>
              </div>
            </div>

            <div className="docs-stat-card">
              <span className="mono-stamp" style={{ color: 'var(--text-tertiary)', fontSize: '0.68rem' }}>
                TOTAL READING TIME
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={15} color="var(--text-primary)" />
                <span style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: 'var(--font-serif)', color: 'var(--text-primary)' }}>
                  ~{totalReadingMinutes}
                </span>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>min</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="paper-panel" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
              <Search 
                size={15} 
                color="var(--text-tertiary)" 
                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} 
              />
              <input
                type="text"
                placeholder="Search documentation by topic, keywords, or content..."
                value={searchTopic}
                onChange={(e) => setSearchTopic(e.target.value)}
                className="paper-input"
                style={{ paddingLeft: '36px', paddingRight: searchTopic ? '36px' : '12px' }}
              />
              {searchTopic && (
                <button
                  onClick={() => setSearchTopic('')}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-tertiary)',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                  title="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Sort Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', fontFamily: 'var(--font-mono)' }}>
              <span style={{ color: 'var(--text-tertiary)' }}>SORT:</span>
              <button
                onClick={() => setSortBy('index')}
                className={`paper-stamp ${sortBy === 'index' ? 'paper-stamp-active' : ''}`}
                style={{ cursor: 'pointer' }}
              >
                Index #
              </button>
              <button
                onClick={() => setSortBy('readingTime')}
                className={`paper-stamp ${sortBy === 'readingTime' ? 'paper-stamp-active' : ''}`}
                style={{ cursor: 'pointer' }}
              >
                Read Time
              </button>
              <button
                onClick={() => setSortBy('title')}
                className={`paper-stamp ${sortBy === 'title' ? 'paper-stamp-active' : ''}`}
                style={{ cursor: 'pointer' }}
              >
                Title
              </button>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span className="mono-stamp" style={{ color: 'var(--text-tertiary)', marginRight: '4px', fontSize: '0.7rem' }}>
              CATEGORIES:
            </span>
            {categories.map(cat => {
              const count = cat === 'All' ? docs.length : docs.filter(d => d.category === cat).length;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`paper-stamp ${selectedCategory === cat ? 'paper-stamp-active' : ''}`}
                  style={{ cursor: 'pointer' }}
                >
                  <span>{cat}</span>
                  <span style={{ opacity: 0.7, marginLeft: '4px', fontSize: '0.65rem' }}>({count})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Results Counter if searching or filtering */}
        {(searchTopic || selectedCategory !== 'All') && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', padding: '0 4px' }}>
            <span>
              Showing {filteredDocs.length} of {docs.length} document{docs.length === 1 ? '' : 's'}
              {selectedCategory !== 'All' ? ` in ${selectedCategory}` : ''}
              {searchTopic ? ` matching "${searchTopic}"` : ''}
            </span>
            {(searchTopic || selectedCategory !== 'All') && (
              <button
                onClick={() => { setSearchTopic(''); setSelectedCategory('All'); }}
                className="paper-btn paper-btn-sm"
                style={{ fontSize: '0.72rem', padding: '2px 8px' }}
              >
                Reset Filters
              </button>
            )}
          </div>
        )}

        {/* GRID VIEW */}
        {viewMode === 'grid' && (
          <div className="docs-grid">
            {filteredDocs.map((doc) => {
              const docIndex = doc.order_index ?? (docs.findIndex(d => d.id === doc.id) + 1);
              const words = doc.content ? doc.content.trim().split(/\s+/).filter(Boolean).length : 0;
              const readTime = Math.max(1, Math.ceil(words / 180));
              const sections = extractDocHeadings(doc.content);
              const excerpt = getDocExcerpt(doc);
              const isCopied = copiedCardId === doc.id;

              return (
                <div
                  key={doc.id}
                  className="paper-card docs-card"
                  onClick={() => handleSelectDoc(doc)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSelectDoc(doc); }}
                >
                  <div>
                    {/* Card Header: Index & Category */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className="paper-stamp paper-stamp-active" style={{ fontSize: '0.68rem', padding: '2px 6px' }}>
                          INDEX #{docIndex}
                        </span>
                        <span className="paper-stamp" style={{ fontSize: '0.68rem', padding: '2px 6px' }}>
                          {doc.category || 'General'}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-tertiary)', fontSize: '0.72rem', fontFamily: 'var(--font-mono)' }}>
                        <Clock size={11} />
                        <span>~{readTime} MIN READ</span>
                      </div>
                    </div>

                    {/* Document Title */}
                    <h3 className="docs-card-title">
                      {doc.title}
                    </h3>

                    {/* Excerpt / Summary */}
                    <p className="docs-card-summary">
                      {excerpt}
                    </p>

                    {/* Section Headings Preview Pills */}
                    {sections.length > 0 && (
                      <div className="docs-card-sections">
                        {sections.map((sec, sIdx) => (
                          <span key={sIdx} className="docs-section-pill">
                            § {sec}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Card Footer Actions */}
                  <div className="docs-card-footer">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-tertiary)', fontSize: '0.72rem', fontFamily: 'var(--font-mono)' }}>
                      <span>{words.toLocaleString()} words</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button
                        onClick={(e) => handleShareDoc(e, doc)}
                        className="paper-btn paper-btn-sm"
                        style={{ padding: '4px 8px', fontSize: '0.72rem' }}
                        title="Copy share link"
                      >
                        {isCopied ? <Check size={11} color="var(--accent-sage)" /> : <Share2 size={11} />}
                        <span>{isCopied ? 'Copied' : 'Share'}</span>
                      </button>

                      <button
                        onClick={(e) => { e.stopPropagation(); handleSelectDoc(doc); }}
                        className="paper-btn paper-btn-sm paper-btn-primary"
                        style={{ padding: '4px 10px', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <span>Read</span>
                        <ChevronRight size={11} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* DIRECTORY TABLE VIEW */}
        {viewMode === 'directory' && (
          <div className="paper-table-wrapper docs-directory-table-wrapper" style={{ padding: '0' }}>
            <table className="paper-table docs-directory-table">
              <thead>
                <tr>
                  <th style={{ width: '85px' }}>INDEX</th>
                  <th>MANUSCRIPT TITLE & SUMMARY</th>
                  <th style={{ width: '140px' }}>DOMAIN</th>
                  <th style={{ width: '220px' }}>KEY SECTIONS</th>
                  <th style={{ width: '110px' }}>EST. READ</th>
                  <th style={{ width: '130px', textAlign: 'right' }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {filteredDocs.map((doc) => {
                  const docIndex = doc.order_index ?? (docs.findIndex(d => d.id === doc.id) + 1);
                  const words = doc.content ? doc.content.trim().split(/\s+/).filter(Boolean).length : 0;
                  const readTime = Math.max(1, Math.ceil(words / 180));
                  const sections = extractDocHeadings(doc.content);
                  const excerpt = getDocExcerpt(doc);
                  const isCopied = copiedCardId === doc.id;

                  return (
                    <tr 
                      key={doc.id}
                      className="docs-directory-row"
                      onClick={() => handleSelectDoc(doc)}
                    >
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.8rem' }}>
                        #{docIndex}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: '0.94rem', color: 'var(--text-primary)', fontFamily: 'var(--font-serif)', marginBottom: '3px' }}>
                          {doc.title}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', maxWidth: '480px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {excerpt}
                        </div>
                      </td>
                      <td>
                        <span className="paper-stamp" style={{ fontSize: '0.68rem', padding: '1px 5px' }}>
                          {doc.category || 'General'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {sections.slice(0, 2).map((sec, sIdx) => (
                            <span key={sIdx} className="docs-section-pill" style={{ fontSize: '0.68rem', padding: '1px 5px' }}>
                              § {sec}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                        ~{readTime} min
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button
                            onClick={(e) => handleShareDoc(e, doc)}
                            className="paper-btn paper-btn-sm"
                            style={{ padding: '3px 7px', fontSize: '0.72rem' }}
                            title="Share link"
                          >
                            {isCopied ? <Check size={11} color="var(--accent-sage)" /> : <Share2 size={11} />}
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleSelectDoc(doc); }}
                            className="paper-btn paper-btn-sm paper-btn-primary"
                            style={{ padding: '3px 9px', fontSize: '0.72rem' }}
                          >
                            Read
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Empty States */}
        {filteredDocs.length === 0 && (
          <div className="paper-panel" style={{ textAlign: 'center', padding: '56px 20px' }}>
            <Compass size={42} color="var(--text-tertiary)" style={{ margin: '0 auto 12px auto' }} />
            <h3 style={{ fontSize: '1.2rem', color: 'var(--text-primary)', marginBottom: '6px' }}>
              {docs.length === 0 ? 'No technical monographs published yet' : `No documents match "${searchTopic}"`}
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', maxWidth: '440px', margin: '0 auto 18px auto' }}>
              {docs.length === 0
                ? 'Author your first web-based documentation article in Markdown via the curator console at /#admin.'
                : 'Try adjusting your search query, clearing filters, or browsing other categories.'}
            </p>
            {docs.length > 0 && (
              <button
                onClick={() => { setSearchTopic(''); setSelectedCategory('All'); }}
                className="paper-btn paper-btn-primary"
                style={{ padding: '8px 16px', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <span>Reset Search Filters</span>
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: FULL DOCUMENT READER VIEW (When a document is selected)
  // =========================================================================
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Reading Progress Indicator */}
      <div 
        className="reading-progress-bar" 
        style={{ width: `${scrollProgress}%` }} 
        aria-hidden="true" 
      />

      {/* Top Breadcrumb Navigation & Back to Index Bar */}
      <div className="paper-panel" style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={handleBackToIndex}
            className="paper-btn paper-btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 9px', fontSize: '0.78rem' }}
            title="Return to documentation index catalog"
          >
            <ArrowLeft size={13} />
            <span>All Documents</span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
            <span 
              onClick={handleBackToIndex}
              style={{ cursor: 'pointer', textDecoration: 'underline' }}
              title="Documentation Index"
            >
              DOCS
            </span>
            <ChevronRight size={11} />
            <span>{currentDoc.category || 'General'}</span>
            <ChevronRight size={11} />
            <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{currentDoc.title}</span>
          </div>
        </div>

        {/* Reader Canvas Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className={`paper-btn paper-btn-sm ${sidebarCollapsed ? 'paper-btn-primary' : ''}`}
            title={sidebarCollapsed ? "Show topics directory" : "Expand preview: collapse topics directory"}
            style={{ padding: '3px 8px', fontSize: '0.72rem' }}
          >
            <PanelLeft size={13} />
            <span>{sidebarCollapsed ? "Show Directory" : "Wide Canvas"}</span>
          </button>

          <button
            onClick={() => setFocusMode(!focusMode)}
            className={`paper-btn paper-btn-sm ${focusMode ? 'paper-btn-primary' : ''}`}
            title={focusMode ? "Exit focus mode" : "Full width reading mode without sidebars"}
            style={{ padding: '3px 8px', fontSize: '0.72rem' }}
          >
            <Maximize2 size={12} />
            <span>{focusMode ? "Standard" : "Focus"}</span>
          </button>

          <button
            onClick={(e) => handleShareDoc(e)}
            className="paper-btn paper-btn-sm"
            title="Copy shareable link to this document"
            style={{ padding: '3px 9px', fontSize: '0.72rem' }}
          >
            {copiedShare ? <Check size={12} color="var(--accent-sage)" /> : <Share2 size={12} />}
            <span>{copiedShare ? 'Link Copied!' : 'Share'}</span>
          </button>
        </div>
      </div>

      {/* Docs Layout */}
      <div className={`docs-layout ${sidebarCollapsed ? 'sidebar-collapsed' : ''} ${focusMode ? 'focus-mode' : ''}`}>
        {/* Left Sidebar: Categories & Article Directory */}
        {!sidebarCollapsed && !focusMode && (
          <aside className="paper-panel docs-sidebar">
            {/* Quick Filter */}
            <div style={{ position: 'relative', marginBottom: '16px' }}>
              <Search size={14} color="var(--text-tertiary)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Search topics..."
                value={searchTopic}
                onChange={(e) => setSearchTopic(e.target.value)}
                className="paper-input"
                style={{ padding: '6px 10px 6px 30px', fontSize: '0.8rem' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {Object.entries(groupedDocs).map(([category, items]) => (
                <div key={category}>
                  <div className="mono-stamp" style={{ 
                    color: 'var(--text-tertiary)', 
                    marginBottom: '6px',
                    paddingLeft: '4px'
                  }}>
                    {category}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    {items.map(doc => {
                      const isActive = doc.id === currentDoc?.id;
                      return (
                        <button
                          key={doc.id}
                          onClick={() => handleSelectDoc(doc)}
                          style={{
                            textAlign: 'left',
                            padding: '7px 10px',
                            borderRadius: '4px',
                            fontSize: '0.85rem',
                            fontWeight: isActive ? 600 : 400,
                            color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                            background: isActive ? 'var(--bg-secondary)' : 'transparent',
                            border: isActive ? '1px solid var(--border-color)' : '1px solid transparent',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {doc.title}
                          </span>
                          {isActive && <ChevronRight size={13} />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </aside>
        )}

        {/* Center Content: Article Renderer */}
        <main className="paper-panel docs-content-area">
          <div>
            {/* Document Title */}
            <h1 style={{ fontSize: 'clamp(2rem, 3.5vw, 2.6rem)', marginBottom: '12px', lineHeight: 1.2 }}>
              {currentDoc.title}
            </h1>

            {/* Meta info bar */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '14px', fontSize: '0.78rem', color: 'var(--text-tertiary)', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)', marginBottom: '22px', fontFamily: 'var(--font-mono)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Clock size={12} />
                <span>~{docReadTime} MIN READ ({docWordCount.toLocaleString()} WORDS)</span>
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Calendar size={12} />
                <span>UPDATED RECENTLY</span>
              </span>
              <span>
                INDEX: #{currentDoc.order_index ?? (currentIndex + 1)}
              </span>
            </div>

            {/* In-content Table of Contents for Tablet/Mobile where right sidebar is hidden */}
            {tocHeadings.length > 0 && (
              <div className="docs-inline-toc">
                <details 
                  className="paper-panel-subtle" 
                  style={{ padding: '10px 14px', borderRadius: '4px', marginBottom: '22px' }}
                >
                  <summary style={{ 
                    cursor: 'pointer', 
                    fontFamily: 'var(--font-mono)', 
                    fontSize: '0.78rem', 
                    color: 'var(--text-secondary)', 
                    userSelect: 'none' 
                  }}>
                    ON THIS PAGE ({tocHeadings.length} sections)
                  </summary>
                  <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {tocHeadings.map((heading) => (
                      <a
                        key={heading.id}
                        href={`#${heading.id}`}
                        onClick={(e) => handleScrollToHeading(e, heading.id)}
                        style={{
                          fontSize: '0.825rem',
                          color: 'var(--text-secondary)',
                          textDecoration: 'none',
                          lineHeight: 1.4,
                          paddingLeft: heading.level === 3 ? '10px' : '0px'
                        }}
                      >
                        {heading.text}
                      </a>
                    ))}
                  </div>
                </details>
              </div>
            )}

            {/* Summary lead */}
            {currentDoc.summary && (
              <div style={{
                fontSize: '1.05rem',
                lineHeight: 1.65,
                color: 'var(--text-primary)',
                marginBottom: '26px',
                fontFamily: 'var(--font-serif)',
                fontStyle: 'italic',
                padding: '14px 18px',
                borderRadius: '4px',
                background: 'var(--bg-secondary)',
                borderLeft: '3px solid var(--text-primary)'
              }}>
                {currentDoc.summary}
              </div>
            )}

            {/* Render Document Content */}
            <div className="docs-article">
              {renderedContent}
            </div>

            {/* Bottom Pagination & Back to Index */}
            <div style={{
              marginTop: '44px',
              paddingTop: '24px',
              borderTop: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '14px'
            }}>
              {prevDoc ? (
                <button
                  onClick={() => handleSelectDoc(prevDoc)}
                  className="paper-btn"
                  style={{ textAlign: 'left', alignItems: 'flex-start', flexDirection: 'column', gap: '2px', padding: '10px 14px' }}
                >
                  <span className="mono-stamp" style={{ color: 'var(--text-tertiary)', fontSize: '0.68rem' }}>← PREVIOUS PAGE</span>
                  <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{prevDoc.title}</span>
                </button>
              ) : <div />}

              <button
                onClick={handleBackToIndex}
                className="paper-btn"
                style={{ padding: '8px 14px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                title="Return to documentation index catalog"
              >
                <ArrowLeft size={13} />
                <span>Documentation Index</span>
              </button>

              {nextDoc ? (
                <button
                  onClick={() => handleSelectDoc(nextDoc)}
                  className="paper-btn paper-btn-primary"
                  style={{ textAlign: 'right', alignItems: 'flex-end', flexDirection: 'column', gap: '2px', padding: '10px 14px' }}
                >
                  <span className="mono-stamp" style={{ opacity: 0.8, fontSize: '0.68rem' }}>NEXT PAGE →</span>
                  <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{nextDoc.title}</span>
                </button>
              ) : <div />}
            </div>
          </div>
        </main>

        {/* Right Sidebar: On This Page (TOC) */}
        {!focusMode && (
          <aside className="paper-panel docs-toc docs-toc-col" style={{ padding: '16px' }}>
            <div className="mono-stamp" style={{ color: 'var(--text-tertiary)', marginBottom: '12px' }}>
              ON THIS PAGE
            </div>

            {tocHeadings.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {tocHeadings.map((heading) => (
                  <a
                    key={heading.id}
                    href={`#${heading.id}`}
                    onClick={(e) => handleScrollToHeading(e, heading.id)}
                    style={{
                      fontSize: '0.825rem',
                      color: 'var(--text-secondary)',
                      textDecoration: 'none',
                      lineHeight: 1.4,
                      paddingLeft: heading.level === 3 ? '10px' : '0px',
                      transition: 'color 0.15s ease',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => e.target.style.color = 'var(--text-primary)'}
                    onMouseLeave={(e) => e.target.style.color = 'var(--text-secondary)'}
                  >
                    {heading.text}
                  </a>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                Overview content
              </div>
            )}
          </aside>
        )}
      </div>
    </div>
  );
}
