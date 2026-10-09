import React, { useState, useMemo } from 'react';
import { 
  BookOpen, 
  Search, 
  ChevronRight, 
  Copy, 
  Check, 
  Clock, 
  Calendar, 
  Info, 
  Lightbulb
} from 'lucide-react';

export function DocsPage({ docs }) {
  const [activeDocId, setActiveDocId] = useState(docs[0]?.id || '');
  const [searchTopic, setSearchTopic] = useState('');
  const [copiedSnippet, setCopiedSnippet] = useState('');
  const [scrollProgress, setScrollProgress] = useState(0);

  // Track reading progress on scroll
  React.useEffect(() => {
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

  const handleSelectDoc = (id) => {
    setActiveDocId(id);
    const contentArea = document.querySelector('.docs-content-area');
    if (contentArea) {
      contentArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const currentDoc = useMemo(() => {
    return docs.find(d => d.id === activeDocId) || docs[0];
  }, [docs, activeDocId]);

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Reading Progress Indicator */}
      {currentDoc && (
        <div 
          className="reading-progress-bar" 
          style={{ width: `${scrollProgress}%` }} 
          aria-hidden="true" 
        />
      )}

      {/* Top Banner */}
      <div className="page-header" style={{ marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
          <span className="paper-stamp paper-stamp-active">
            MANUAL
          </span>
          <span className="paper-stamp">
            TECHNICAL DOCUMENTATION
          </span>
        </div>
        <h1 style={{ fontSize: 'clamp(2rem, 4vw, 2.8rem)', marginBottom: '6px' }}>
          Documentation & Wiki
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', fontFamily: 'var(--font-serif)' }}>
          System specifications, design records, and long-form guides formatted for clear, quiet reading.
        </p>
      </div>

      {/* Docs Layout */}
      <div className="docs-layout">
        {/* Left Sidebar: Categories & Article Directory */}
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
                        onClick={() => handleSelectDoc(doc.id)}
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

        {/* Center Content: Article Renderer */}
        <main className="paper-panel docs-content-area">
          {currentDoc ? (
            <div>
              {/* Category Breadcrumbs */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: 'var(--text-tertiary)', marginBottom: '14px', fontFamily: 'var(--font-mono)' }}>
                <span>DOCS</span>
                <ChevronRight size={11} />
                <span>{currentDoc.category}</span>
                <ChevronRight size={11} />
                <span style={{ color: 'var(--text-primary)' }}>{currentDoc.title}</span>
              </div>

              {/* Document Title */}
              <h1 style={{ fontSize: 'clamp(2rem, 3.5vw, 2.6rem)', marginBottom: '12px', lineHeight: 1.2 }}>
                {currentDoc.title}
              </h1>

              {/* Meta info bar */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', fontSize: '0.78rem', color: 'var(--text-tertiary)', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)', marginBottom: '22px', fontFamily: 'var(--font-mono)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Clock size={12} />
                  <span>~{docReadTime} MIN READ ({docWordCount.toLocaleString()} WORDS)</span>
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Calendar size={12} />
                  <span>UPDATED RECENTLY</span>
                </span>
                <span>
                  SLUG: /{currentDoc.slug}
                </span>
              </div>

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

              {/* Bottom Pagination */}
              <div style={{
                marginTop: '44px',
                paddingTop: '24px',
                borderTop: '1px solid var(--border-color)',
                display: 'flex',
                justifyContent: 'space-between',
                gap: '14px'
              }}>
                {prevDoc ? (
                  <button
                    onClick={() => handleSelectDoc(prevDoc.id)}
                    className="paper-btn"
                    style={{ textAlign: 'left', alignItems: 'flex-start', flexDirection: 'column', gap: '2px', padding: '10px 14px' }}
                  >
                    <span className="mono-stamp" style={{ color: 'var(--text-tertiary)', fontSize: '0.68rem' }}>← PREVIOUS PAGE</span>
                    <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{prevDoc.title}</span>
                  </button>
                ) : <div />}

                {nextDoc && (
                  <button
                    onClick={() => handleSelectDoc(nextDoc.id)}
                    className="paper-btn paper-btn-primary"
                    style={{ textAlign: 'right', alignItems: 'flex-end', flexDirection: 'column', gap: '2px', padding: '10px 14px' }}
                  >
                    <span className="mono-stamp" style={{ opacity: 0.8, fontSize: '0.68rem' }}>NEXT PAGE →</span>
                    <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{nextDoc.title}</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '56px 20px' }}>
              <BookOpen size={40} color="var(--text-tertiary)" style={{ margin: '0 auto 12px auto' }} />
              <h3 style={{ fontSize: '1.2rem', color: 'var(--text-primary)', marginBottom: '6px' }}>
                {docs.length === 0 ? 'No monographs published yet' : 'Select a topic from the directory to start reading'}
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', maxWidth: '420px', margin: '0 auto' }}>
                {docs.length === 0
                  ? 'Author your first web-based documentation article in Markdown via the curator console at /#admin.'
                  : 'Browse topics on the left sidebar to inspect technical specifications and code architecture.'}
              </p>
            </div>
          )}
        </main>

        {/* Right Sidebar: On This Page (TOC) */}
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
      </div>
    </div>
  );
}
