
import React, { useState, useEffect, useCallback, useRef } from 'react';
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
    if (typeof window === 'undefined') return 'overview';
    const rawHash = (window.location.hash || '').trim();
    const cleanTab = rawHash.replace(/^#\/?/, '').split(/[?&#]/)[0].toLowerCase();
    if (['projects', 'notes', 'docs'].includes(cleanTab)) {
      return cleanTab;
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
  const [selectedDocId, setSelectedDocId] = useState(null);
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

  // Synchronize active tab and modals with URL hash (#project=id, #note=id, #doc=id/slug, #admin, #projects, #notes, #docs, #overview, or root URL)
  const syncRouteFromHash = useCallback(() => {
    if (typeof window === 'undefined') return;
    const rawHash = (window.location.hash || '').trim();

    // Curator Admin route check
    if (isAdminRoute()) {
      setAdminOpen(true);
      return;
    } else {
      setAdminOpen(false);
    }

    // 1. Direct Project modal link: #project=xyz or #projects?id=xyz or #projects/xyz
    const projDetailMatch = rawHash.match(/^#\/?projects?[=?/&](?:id=)?([a-zA-Z0-9_.-]+)/i);
    if (projDetailMatch && projDetailMatch[1]) {
      const targetId = projDetailMatch[1];
      const found = projects.find(
        p => String(p.id) === targetId || p.title?.toLowerCase().replace(/\s+/g, '-') === targetId.toLowerCase()
      );
      if (found) {
        setSelectedProject(found);
      }
      setActiveTab('projects');
      setSelectedNote(null);
      setSelectedDocId(null);
      return;
    }

    // 2. Direct Note / Manuscript link: #note=xyz or #notes?id=xyz or #notes/xyz
    const noteDetailMatch = rawHash.match(/^#\/?notes?[=?/&](?:id=)?([a-zA-Z0-9_.-]+)/i);
    if (noteDetailMatch && noteDetailMatch[1]) {
      const targetId = noteDetailMatch[1];
      const found = notes.find(n => String(n.id) === targetId);
      if (found) {
        setSelectedNote(found);
      }
      setActiveTab('notes');
      setSelectedProject(null);
      setSelectedDocId(null);
      return;
    }

    // 3. Direct Documentation link with document ID (#doc=1, #doc/1, #docs?id=1, etc.)
    const docParamMatch = rawHash.match(/^#\/?docs?[=?/&](?:id=|slug=|index=)?([a-zA-Z0-9_.-]+)/i);
    if (docParamMatch && docParamMatch[1]) {
      setActiveTab('docs');
      setSelectedDocId(docParamMatch[1]);
      setSelectedProject(null);
      setSelectedNote(null);
      return;
    }

    // 4. Tab links: #overview, #projects, #notes, #docs, or empty hash (root index page)
    const cleanTab = rawHash.replace(/^#\/?/, '').split(/[?&#]/)[0].toLowerCase();

    // If there is no hash, or hash is '#' / '#/' / '#overview', route to Index ('overview')
    if (!cleanTab || cleanTab === 'overview') {
      setActiveTab('overview');
      setSelectedProject(null);
      setSelectedNote(null);
      setSelectedDocId(null);
      return;
    }

    if (cleanTab === 'projects') {
      setActiveTab('projects');
      setSelectedProject(null);
      setSelectedNote(null);
      setSelectedDocId(null);
      return;
    }

    if (cleanTab === 'notes') {
      setActiveTab('notes');
      setSelectedProject(null);
      setSelectedNote(null);
      setSelectedDocId(null);
      return;
    }

    if (cleanTab === 'docs' || cleanTab === 'documentation') {
      setActiveTab('docs');
      setSelectedProject(null);
      setSelectedNote(null);
      setSelectedDocId(null);
      return;
    }

    // Fallback for any other unmatched hash: return to Index
    setActiveTab('overview');
    setSelectedProject(null);
    setSelectedNote(null);
    setSelectedDocId(null);
  }, [projects, notes]);

  // Synchronize route on data load and browser Back/Forward navigation
  useEffect(() => {
    syncRouteFromHash();
    const handleUrlChange = () => {
      syncRouteFromHash();
    };
    window.addEventListener('hashchange', handleUrlChange);
    window.addEventListener('popstate', handleUrlChange);
    return () => {
      window.removeEventListener('hashchange', handleUrlChange);
      window.removeEventListener('popstate', handleUrlChange);
    };
  }, [syncRouteFromHash]);

  const handleOpenAdmin = () => {
    setAdminOpen(true);
    window.history.pushState(null, '', '#admin');
  };

  const handleCloseAdmin = () => {
    setAdminOpen(false);
    if (isAdminRoute()) {
      window.history.pushState(
        null,
        '',
        activeTab === 'overview' ? (window.location.pathname + window.location.search) : `#${activeTab}`
      );
    }
  };

  const handleNavigateTab = (tab) => {
    setActiveTab(tab);
    setSelectedProject(null);
    setSelectedNote(null);
    if (tab === 'docs') {
      setSelectedDocId(null);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (tab === 'overview') {
      window.history.pushState(null, '', window.location.pathname + window.location.search);
    } else {
      window.location.hash = `#${tab}`;
    }
  };

  const handleOpenProject = (project) => {
    setSelectedProject(project);
    window.history.pushState(null, '', `#project=${encodeURIComponent(project.id)}`);
  };

  const handleCloseProject = () => {
    setSelectedProject(null);
    if (activeTab === 'overview') {
      window.history.pushState(null, '', window.location.pathname + window.location.search);
    } else {
      window.history.pushState(null, '', '#projects');
    }
  };

  const handleOpenNote = (note) => {
    setSelectedNote(note);
    window.history.pushState(null, '', `#note=${encodeURIComponent(note.id)}`);
  };

  const handleCloseNote = () => {
    setSelectedNote(null);
    if (activeTab === 'overview') {
      window.history.pushState(null, '', window.location.pathname + window.location.search);
    } else {
      window.history.pushState(null, '', '#notes');
    }
  };

  const handleSelectDoc = (doc) => {
    if (!doc) {
      setSelectedDocId(null);
      if (activeTab === 'overview') {
        window.history.pushState(null, '', window.location.pathname + window.location.search);
      } else {
        window.history.pushState(null, '', '#docs');
      }
      return;
    }
    const docIndex = doc.order_index ?? (docs.findIndex(d => d.id === doc.id) + 1);
    setSelectedDocId(String(docIndex));
    window.history.pushState(null, '', `#doc=${docIndex}`);
  };

  // Toggle Dark/Light mode
  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // Keep reference of current UI modal/tab states and actions for high-performance global shortcut handling
  const stateRef = useRef({
    adminOpen,
    searchOpen,
    shortcutsOpen,
    selectedNote,
    selectedProject,
    selectedDocId,
    activeTab
  });

  const actionsRef = useRef({
    handleCloseAdmin,
    handleOpenAdmin,
    handleCloseNote,
    handleCloseProject,
    handleSelectDoc,
    handleNavigateTab,
    toggleTheme
  });

  useEffect(() => {
    stateRef.current = {
      adminOpen,
      searchOpen,
      shortcutsOpen,
      selectedNote,
      selectedProject,
      selectedDocId,
      activeTab
    };
    actionsRef.current = {
      handleCloseAdmin,
      handleOpenAdmin,
      handleCloseNote,
      handleCloseProject,
      handleSelectDoc,
      handleNavigateTab,
      toggleTheme
    };
  });

  // Global Keyboard Shortcuts (Cmd+K for search, Esc to close, ? for shortcuts, 1-4 for tabs, T for theme)
  useEffect(() => {
    const handleKeyDown = (e) => {
      const tag = e.target.tagName;
      const isInput = tag === 'INPUT' || tag === 'TEXTAREA' || e.target.isContentEditable;
      const current = stateRef.current;
      const actions = actionsRef.current;

      // Curator hotkey: Cmd+Shift+A or Ctrl+Shift+A
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        if (current.adminOpen) {
          actions.handleCloseAdmin();
        } else {
          actions.handleOpenAdmin();
        }
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
        if (current.selectedNote) {
          actions.handleCloseNote();
          return;
        }
        if (current.selectedProject) {
          actions.handleCloseProject();
          return;
        }
        if (current.selectedDocId) {
          actions.handleSelectDoc(null);
          return;
        }
        if (current.adminOpen) {
          actions.handleCloseAdmin();
          return;
        }
      }

      // Help shortcuts modal (?)
      if (!isInput && e.key === '?') {
        e.preventDefault();
        setShortcutsOpen(prev => !prev);
        return;
      }

      // Single-key navigation shortcuts when not typing in form inputs or modals
      if (!isInput && !current.searchOpen && !current.shortcutsOpen && !current.selectedNote && !current.selectedProject && !current.adminOpen) {
        if (e.key === '1') { e.preventDefault(); actions.handleNavigateTab('overview'); }
        else if (e.key === '2') { e.preventDefault(); actions.handleNavigateTab('projects'); }
        else if (e.key === '3') { e.preventDefault(); actions.handleNavigateTab('notes'); }
        else if (e.key === '4') { e.preventDefault(); actions.handleNavigateTab('docs'); }
        else if (e.key.toLowerCase() === 't') { e.preventDefault(); actions.toggleTheme(); }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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
      handleOpenProject(item);
    } else if (type === 'note') {
      handleNavigateTab('notes');
      handleOpenNote(item);
    } else if (type === 'doc') {
      handleNavigateTab('docs');
      handleSelectDoc(item);
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

      {/* Main Content Area — Full Wide Layout across Index, Projects, Notes, and Docs */}
      <main className="main-container main-container-wide">
        <div key={activeTab} className="paper-tab-fade">
          {activeTab === 'overview' && (
            <Overview
              projects={projects}
              notes={notes}
              docs={docs}
              onNavigate={handleNavigateTab}
              onOpenProjectModal={handleOpenProject}
              onOpenNoteModal={handleOpenNote}
              onOpenSearch={() => setSearchOpen(true)}
              onSelectDoc={handleSelectDoc}
            />
          )}

          {activeTab === 'projects' && (
            <ProjectsPage
              projects={projects}
              onOpenProjectModal={handleOpenProject}
            />
          )}

          {activeTab === 'notes' && (
            <NotesPage
              notes={notes}
              onOpenNoteModal={handleOpenNote}
              onDownloadNote={handleDownloadNote}
            />
          )}

          {activeTab === 'docs' && (
            <DocsPage
              docs={docs}
              activeDocId={selectedDocId}
              onSelectDoc={handleSelectDoc}
            />
          )}
        </div>
      </main>

      {/* Minimalist Colophon / Footer — Wide Alignment */}
      <footer style={{
        width: '100%',
        maxWidth: '1560px',
        margin: '0 auto',
        padding: '0 clamp(14px, 2.5vw, 36px) 48px clamp(14px, 2.5vw, 36px)',
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
              onClick={handleOpenAdmin}
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
      {selectedNote && (
        <NoteViewerModal
          key={selectedNote.id}
          note={selectedNote}
          onClose={handleCloseNote}
          onDownload={handleDownloadNote}
        />
      )}

      <ProjectDetailsModal
        project={selectedProject}
        onClose={handleCloseProject}
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
