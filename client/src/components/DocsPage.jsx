import React, { useState, useMemo, useEffect } from 'react';
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
  List,
  X,
  FileText,
  Layers,
  Compass
} from 'lucide-react';
import { copyShareLink } from '../utils/share';

export function DocsPage({ docs, activeDocId: controlledDocId, onSelectDoc }) {
  const [internalDocId, setInternalDocId] = useState(controlledDocId || null);
  const [searchTopic, setSearchTopic] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('index'); // 'index' | 'readingTime' | 'title'
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'directory'
  const [copiedSnippet, setCopiedSnippet] = useState('');
  const [copiedShare, setCopiedShare] = useState(false);
  const [copiedCardId, setCopiedCardId] = useState(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [focusMode, setFocusMode] = useState(false);

  const activeDocId = controlledDocId !== undefined ? controlledDocId : internalDocId;

  useEffect(() => {
    setInternalDocId(controlledDocId || null);
  }, [controlledDocId]);

  // Track reading progress on scroll when inside an article
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const progress = Math.min(100, Math.max(0, (window.scrollY / totalHeight) * 100));
        setScrollProgress(progress);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  // Extract outline section headings from doc markdown
  const extractDocHeadings = (content) => {
    if (!content) return [];
    const lines = content.split('\n');
    const sections = [];
    for (const line of lines) {
      if (line.startsWith('## ')) {
        sections.push(line.replace('## ', '').trim());
        if (sections.length >= 3) break;
      }
    }
    return sections;
  };

  // Clean excerpt for cards
  const getDocExcerpt = (doc) => {
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
  };

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

  const handleCopyCode = (code, id) => {
    navigator.clipboard.writeText(code);
    setCopiedSnippet(id);
    setTimeout(() => setCopiedSnippet(''), 2000);
  };

  const tocHeadings = useMemo(() => {
    if (!currentDoc?.content) return [];
    const lines = currentDoc.content.split('\n');
    const headings = [];
    lines.forEach((line, index) => {
      if (line.startsWith('## ')) {
        const text = line.replace('## ', '').trim();
        headings.push({ level: 2, text, id: `section-${index}` });
      } else if (line.startsWith('### ')) {
        const text = line.replace('### ', '').trim();
        headings.push({ level: 3, text, id: `section-${index}` });
      }
    });
    return headings;
  }, [currentDoc]);

  const docWordCount = useMemo(() => {
    if (!currentDoc?.content) return 0;
    return currentDoc.content.trim().split(/\s+/).filter(Boolean).length;
  }, [currentDoc]);

  const docReadTime = Math.max(1, Math.ceil(docWordCount / 180));

  const handleScrollToHeading = (e, id) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const renderMarkdown = (rawContent) => {
    if (!rawContent) return null;

    const lines = rawContent.split('\n');
    const elements = [];
    let inCodeBlock = false;
    let codeLanguage = '';
    let codeBuffer = [];
    let inTable = false;
    let tableBuffer = [];

    const flushCodeBlock = (key) => {
      const codeText = codeBuffer.join('\n');
      const snippetId = `snippet-${key}`;
      elements.push(
        <div key={snippetId} className="code-block-wrapper">
          <div className="code-header">
            <span className="mono-stamp">{codeLanguage || 'CODE'}</span>
            <button
              onClick={() => handleCopyCode(codeText, snippetId)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                background: 'transparent',
                border: 'none',
                color: copiedSnippet === snippetId ? 'var(--accent-sage)' : 'var(--text-tertiary)',
                cursor: 'pointer',
                fontSize: '0.75rem',
                fontFamily: 'var(--font-mono)'
              }}
            >
              {copiedSnippet === snippetId ? <Check size={12} /> : <Copy size={12} />}
              <span>{copiedSnippet === snippetId ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <pre className="code-pre">
            <code>{codeText}</code>
          </pre>
        </div>
      );
      codeBuffer = [];
      codeLanguage = '';
      inCodeBlock = false;
    };

    const flushTable = (key) => {
      if (tableBuffer.length === 0) return;
      const headerRow = tableBuffer[0].split('|').filter(c => c.trim() !== '');
      const bodyRows = tableBuffer.slice(2).map(r => r.split('|').filter(c => c.trim() !== ''));

      elements.push(
        <div key={`table-${key}`} style={{ overflowX: 'auto', margin: '20px 0' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-strong)', background: 'var(--bg-secondary)' }}>
                {headerRow.map((h, i) => (
                  <th key={i} style={{ padding: '8px 12px', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: '0.78rem', textTransform: 'uppercase' }}>
                    {h.trim()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bodyRows.map((row, rIdx) => (
                <tr key={rIdx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} style={{ padding: '8px 12px', color: 'var(--text-secondary)' }}>
                      {cell.trim()}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      tableBuffer = [];
      inTable = false;
    };

    lines.forEach((line, index) => {
      if (line.startsWith('```')) {
        if (inCodeBlock) {
          flushCodeBlock(index);
        } else {
          inCodeBlock = true;
          codeLanguage = line.replace('```', '').trim();
        }
        return;
      }

      if (inCodeBlock) {
        codeBuffer.push(line);
        return;
      }

      if (line.startsWith('|') && line.endsWith('|')) {
        inTable = true;
        tableBuffer.push(line);
        return;
      } else if (inTable) {
        flushTable(index);
      }

      if (line.startsWith('> [!TIP]')) {
        elements.push(
          <div key={index} className="callout" style={{ borderLeftColor: 'var(--accent-sage)' }}>
            <Lightbulb size={17} color="var(--accent-sage)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div className="callout-title" style={{ color: 'var(--accent-sage)' }}>Marginal Note: Tip</div>
              <div className="callout-body">Practical implementation advice for system engineers.</div>
            </div>
          </div>
        );
        return;
      }
      if (line.startsWith('> [!NOTE]') || line.startsWith('> [!IMPORTANT]')) {
        elements.push(
          <div key={index} className="callout" style={{ borderLeftColor: 'var(--text-primary)' }}>
            <Info size={17} color="var(--text-primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div className="callout-title">Marginal Note</div>
              <div className="callout-body">Key architectural context and trade-offs.</div>
            </div>
          </div>
        );
        return;
      }

      if (line.startsWith('# ')) {
        return;
      }
      if (line.startsWith('## ')) {
        const text = line.replace('## ', '');
        elements.push(
          <h2 key={index} id={`section-${index}`} style={{ fontSize: '1.45rem', margin: '36px 0 14px', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>
            {text}
          </h2>
        );
        return;
      }
      if (line.startsWith('### ')) {
        const text = line.replace('### ', '');
        elements.push(
          <h3 key={index} id={`section-${index}`} style={{ fontSize: '1.18rem', margin: '22px 0 10px' }}>
            {text}
          </h3>
        );
        return;
      }

      if (line.startsWith('- ') || line.startsWith('* ')) {
        const text = line.substring(2);
        elements.push(
          <li key={index} style={{ marginLeft: '22px', marginBottom: '6px', color: 'var(--text-secondary)', lineHeight: 1.65 }}>
            {text}
          </li>
        );
        return;
      }

      if (/^\d+\.\s/.test(line)) {
        const text = line.replace(/^\d+\.\s/, '');
        elements.push(
          <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '6px', color: 'var(--text-secondary)', lineHeight: 1.65 }}>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>•</span>
            <span>{text}</span>
          </div>
        );
        return;
      }

      if (line.startsWith('---')) {
        elements.push(<hr key={index} style={{ margin: '28px 0', border: 'none', borderTop: '1px solid var(--border-color)' }} />);
        return;
      }

      if (line.trim().length > 0) {
        elements.push(
          <p key={index} style={{ fontSize: '0.98rem', color: 'var(--text-secondary)', lineHeight: 1.75, marginBottom: '16px' }}>
            {line}
          </p>
        );
      }
    });

    if (inCodeBlock) flushCodeBlock('end');
    if (inTable) flushTable('end');

    return elements;
  };

  // =========================================================================
  // VIEW 1: DOCUMENTATION INDEX / CATALOG PAGE (Default when no doc selected)
  // =========================================================================
  if (!currentDoc) {
    return (
      <div className="docs-index-layout">
        {/* Page Header */}
        <div className="page-header" style={{ marginBottom: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
            <span className="paper-stamp paper-stamp-active">
              DOCUMENTATION
            </span>
            <span className="paper-stamp">
              SYSTEM ARCHITECTURE & MANUALS
            </span>
            <span className="paper-stamp paper-stamp-sage">
              CATALOG INDEX
            </span>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h1 style={{ fontSize: 'clamp(2.1rem, 4vw, 2.9rem)', marginBottom: '8px' }}>
                Documentation & Wiki
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.98rem', maxWidth: '680px', fontFamily: 'var(--font-serif)' }}>
                System specifications, engineering blueprints, and in-depth monographs. Search topics or browse by domain to inspect technical manuals.
              </p>
            </div>

            {/* View Mode Toggle */}
            <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-secondary)', padding: '3px', borderRadius: '5px', border: '1px solid var(--border-color)', alignSelf: 'flex-end' }}>
              <button
                onClick={() => setViewMode('grid')}
                className={`paper-stamp ${viewMode === 'grid' ? 'paper-stamp-active' : ''}`}
                style={{ cursor: 'pointer', border: 'none' }}
                title="Cards Grid View"
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
          <div className="paper-panel docs-directory-table-wrapper" style={{ padding: '0' }}>
            <table className="docs-directory-table">
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
                          {getDocExcerpt(doc)}
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
            {/* Direct Return to Index Button in Sidebar */}
            <button
              onClick={handleBackToIndex}
              className="paper-btn paper-btn-sm"
              style={{ width: '100%', marginBottom: '12px', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem' }}
            >
              <ArrowLeft size={13} />
              <span>← All Documentation</span>
            </button>

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
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px', fontSize: '0.78rem', color: 'var(--text-tertiary)', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)', marginBottom: '22px', fontFamily: 'var(--font-mono)' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '14px' }}>
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

              <button
                onClick={(e) => handleShareDoc(e)}
                className="paper-btn paper-btn-sm"
                title="Copy shareable link to this document"
                style={{ padding: '3px 9px', fontSize: '0.74rem' }}
              >
                {copiedShare ? <Check size={12} color="var(--accent-sage)" /> : <Share2 size={12} />}
                <span>{copiedShare ? 'Link Copied!' : 'Share Doc'}</span>
              </button>
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
            <div>
              {renderMarkdown(currentDoc.content)}
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
