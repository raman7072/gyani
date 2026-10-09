
import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Overview } from './components/Overview';
import { ProjectsPage } from './components/ProjectsPage';
import { NotesPage } from './components/NotesPage';
import { DocsPage } from './components/DocsPage';
import { NoteViewerModal } from './components/NoteViewerModal';
import { ProjectDetailsModal } from './components/ProjectDetailsModal';
import { AdminPanel } from './components/AdminPanel';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { ShortcutsModal } from './components/ShortcutsModal';
import {
  api,
  isSupabaseConfigured,
  INITIAL_PROJECTS,
  INITIAL_NOTES,
  INITIAL_DOCS
} from './services/supabase';
import {
  Database,
  Command
} from 'lucide-react';

// Helper to detect if current URL targets admin portal (#admin, #/admin, ?admin, /admin)
const isAdminRoute = () => {
  if (typeof window === 'undefined') return false;
  const hash = (window.location.hash || '').toLowerCase().replace(/^#[/]?/, '').replace(/[/]$/, '');
  const path = (window.location.pathname || '').toLowerCase();
  const search = (window.location.search || '').toLowerCase();
  return hash === 'admin' || path.endsWith('/admin') || path.endsWith('/admin/') || search.includes('admin');
};

function App() {
  // Theme state: defaults to light (natural warm paper) or dark (e-ink night screen)
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('gyani_theme') || localStorage.getItem('aethervault_theme') || 'light';
  });

  // Navigation tab
  const [activeTab, setActiveTab] = useState(() => {
    const hash = window.location.hash.replace('#', '');
    if (['projects', 'notes', 'docs', 'admin'].includes(hash)) {
      return hash === 'admin' ? 'overview' : hash;
    }
    return 'overview';
  });

  // Data states
  const [projects, setProjects] = useState(INITIAL_PROJECTS);
  const [notes, setNotes] = useState(INITIAL_NOTES);
  const [docs, setDocs] = useState(INITIAL_DOCS);

  // Modals
  const [selectedNote, setSelectedNote] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [adminOpen, setAdminOpen] = useState(() => isAdminRoute());
  const [searchOpen, setSearchOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  // Apply theme to html root
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('gyani_theme', theme);
  }, [theme]);

  // Load data from Supabase / Local storage
  const loadAllData = async () => {
    try {
      const [projData, noteData, docData] = await Promise.all([
        api.getProjects(),
        api.getNotes(),
        api.getDocs(),
      ]);
      setProjects(projData);
      setNotes(noteData);
      setDocs(docData);
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Listen to hash & history changes (e.g., #admin, /admin, ?admin)
  useEffect(() => {
    const handleUrlChange = () => {
      if (isAdminRoute()) {
        setAdminOpen(true);
      }
    };
    window.addEventListener('hashchange', handleUrlChange);
    window.addEventListener('popstate', handleUrlChange);
    return () => {
      window.removeEventListener('hashchange', handleUrlChange);
      window.removeEventListener('popstate', handleUrlChange);
    };
  }, []);

  const handleCloseAdmin = () => {
    setAdminOpen(false);
    if (isAdminRoute()) {
      window.history.pushState(null, "", window.location.pathname);
    }
  };

  // Global Keyboard Shortcuts (Cmd+K for search, Esc to close, ? for shortcuts, 1-4 for tabs, T for theme)
  useEffect(() => {
    const handleKeyDown = (e) => {
      const tag = e.target.tagName;
      const isInput = tag === 'INPUT' || tag === 'TEXTAREA' || e.target.isContentEditable;

      // Curator hotkey: Cmd+Shift+A or Ctrl+Shift+A
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        setAdminOpen(prev => !prev);
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(prev => !prev);
        return;
      }

      if (e.key === 'Escape') {
        setSearchOpen(false);
        setShortcutsOpen(false);
        setSelectedNote(null);
        setSelectedProject(null);
        handleCloseAdmin();
        return;
      }

      // Help shortcuts modal (?)
      if (!isInput && e.key === '?') {
        e.preventDefault();
        setShortcutsOpen(prev => !prev);
        return;
      }

      // Single-key navigation shortcuts when not typing in form inputs or modals
      if (!isInput && !searchOpen && !shortcutsOpen && !selectedNote && !selectedProject && !adminOpen) {
        if (e.key === '1') { e.preventDefault(); handleNavigateTab('overview'); }
        else if (e.key === '2') { e.preventDefault(); handleNavigateTab('projects'); }
        else if (e.key === '3') { e.preventDefault(); handleNavigateTab('notes'); }
        else if (e.key === '4') { e.preventDefault(); handleNavigateTab('docs'); }
        else if (e.key.toLowerCase() === 't') { e.preventDefault(); toggleTheme(); }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchOpen, shortcutsOpen, selectedNote, selectedProject, adminOpen, theme]);

  const handleNavigateTab = (tab) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (tab === 'overview') {
      window.history.pushState(null, '', window.location.pathname + window.location.search);
    } else {
      window.location.hash = `#${tab}`;
    }
  };

  // Toggle Dark/Light mode
  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // Download Note handler
  const handleDownloadNote = (note) => {
    api.incrementNoteDownloads(note.id);
    setNotes(prev => prev.map(n => n.id === note.id ? { ...n, downloads_count: (n.downloads_count || 0) + 1 } : n));

    if (note.file_url && note.file_url.startsWith('http')) {
      const link = document.createElement('a');
      link.href = note.file_url;
      link.download = note.file_name;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      const content = note.preview_content || `# ${note.title}\n\nCategory: ${note.category}\n\n${note.description || ''}`;
      const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = note.file_name || `${note.title.toLowerCase().replace(/\s+/g, '_')}.md`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  // Search Jump handler
  const handleSelectSearchResult = (type, item) => {
    if (type === 'project') {
      handleNavigateTab('projects');
      setSelectedProject(item);
    } else if (type === 'note') {
      handleNavigateTab('notes');
      setSelectedNote(item);
    } else if (type === 'doc') {
      handleNavigateTab('docs');
    }
  };

  return (
    <>
      {/* Paper Grain Micro-Noise Overlay (Kindle / Rag Paper Feel) */}
      <div className="paper-grain-overlay" aria-hidden="true" />

      {/* Editorial Masthead & Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={handleNavigateTab}
        theme={theme}
        toggleTheme={toggleTheme}
        onOpenSearch={() => setSearchOpen(true)}
      />

      {/* Main Content Area */}
      <main className="main-container">
        <div key={activeTab} className="paper-tab-fade">
          {activeTab === 'overview' && (
            <Overview
              projects={projects}
              notes={notes}
              docs={docs}
              onNavigate={handleNavigateTab}
              onOpenProjectModal={setSelectedProject}
              onOpenNoteModal={setSelectedNote}
              onOpenSearch={() => setSearchOpen(true)}
            />
          )}

          {activeTab === 'projects' && (
            <ProjectsPage
              projects={projects}
              onOpenProjectModal={setSelectedProject}
            />
          )}

          {activeTab === 'notes' && (
            <NotesPage
              notes={notes}
              onOpenNoteModal={setSelectedNote}
              onDownloadNote={handleDownloadNote}
            />
          )}

          {activeTab === 'docs' && (
            <DocsPage
              docs={docs}
            />
          )}
        </div>
      </main>

      {/* Minimalist Colophon / Footer */}
      <footer style={{
        width: '100%',
        maxWidth: '1180px',
        margin: '0 auto',
        padding: '0 20px 48px 20px',
        position: 'relative',
        zIndex: 10
      }}>
        <div style={{
          borderTop: '1px solid var(--border-color)',
          paddingTop: '24px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ fontFamily: 'var(--font-serif)', fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                gyani
              </span>
              <span className="paper-stamp" style={{ fontSize: '0.68rem', padding: '1px 6px' }}>
                ज्ञानी
              </span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
              from the root jñā (ज्ञा) — one who possesses knowledge and wisdom
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* Quick Keyboard shortcuts helper (desktop only) */}
            <button
              onClick={() => setShortcutsOpen(true)}
              className="paper-btn paper-btn-sm shortcuts-trigger-btn"
              title="Keyboard shortcuts (?)"
            >
              <Command size={12} />
              <span>Shortcuts</span>
              <kbd style={{
                background: 'var(--bg-secondary)',
                padding: '1px 5px',
                borderRadius: '3px',
                fontSize: '0.65rem',
                border: '1px solid var(--border-color)',
                fontFamily: 'var(--font-mono)'
              }}>?</kbd>
            </button>

            <button
              onClick={() => setAdminOpen(true)}
              className="paper-stamp"
              style={{ cursor: 'pointer', background: 'transparent' }}
              title="Curator Console (or press ⌘Shift+A / visit /#admin)"
            >
              <Database size={11} />
              <span>{isSupabaseConfigured() ? 'inSync' : 'Local'}</span>
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <NoteViewerModal
        note={selectedNote}
        onClose={() => setSelectedNote(null)}
        onDownload={handleDownloadNote}
      />

      <ProjectDetailsModal
        project={selectedProject}
        onClose={() => setSelectedProject(null)}
      />

      <AdminPanel
        isOpen={adminOpen}
        onClose={handleCloseAdmin}
        projects={projects}
        notes={notes}
        docs={docs}
        onRefreshData={loadAllData}
      />

      <GlobalSearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        projects={projects}
        notes={notes}
        docs={docs}
        onSelectResult={handleSelectSearchResult}
      />

      <ShortcutsModal
        isOpen={shortcutsOpen}
        onClose={() => setShortcutsOpen(false)}
      />
    </>
  );
}

export default App;
