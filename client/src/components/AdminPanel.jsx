import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  X, 
  Plus, 
  Trash2, 
  Edit3, 
  Save, 
  Upload, 
  Database, 
  Check, 
  Copy, 
  FolderGit2, 
  FileText, 
  BookOpen, 
  LogOut, 
  Code2,
  Download
} from 'lucide-react';
import { 
  api, 
  isSupabaseConfigured, 
  updateSupabaseCredentials, 
  clearSupabaseCredentials, 
  SUPABASE_SCHEMA_SQL,
  supabase,
  getProjectCategories 
} from '../services/supabase';
import { GyaniLogo } from './GyaniLogo';

export function AdminPanel({ 
  isOpen, 
  onClose, 
  projects, 
  notes, 
  docs, 
  onRefreshData 
}) {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('gyani_admin_auth') === 'true';
  });

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionNotice, setActionNotice] = useState('');

  const [activeTab, setActiveTab] = useState('projects');

  const [editingProject, setEditingProject] = useState(null);
  const [editingNote, setEditingNote] = useState(null);
  const [editingDoc, setEditingDoc] = useState(null);

  // Category management for Projects (custom and multiple categories)
  const DEFAULT_CATEGORIES = [
    'Full-Stack',
    'Backend / Systems',
    'Frontend / UI',
    'AI / Machine Learning',
    'Systems / Low-Level',
    'DevOps & Cloud',
    'Data Engineering',
    'Mobile Development',
    'Distributed Systems',
    'Security & Cryptography',
    'Open Source Tooling'
  ];

  const [projectCategories, setProjectCategories] = useState(['Full-Stack']);
  const [newCategoryInput, setNewCategoryInput] = useState('');
  const [customCategoriesList, setCustomCategoriesList] = useState(() => {
    try {
      const stored = localStorage.getItem('gyani_custom_project_categories');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const allAvailableCategories = React.useMemo(() => {
    const set = new Set([...DEFAULT_CATEGORIES, ...customCategoriesList]);
    if (projects) {
      projects.forEach(p => {
        getProjectCategories(p).forEach(c => set.add(c));
      });
    }
    return Array.from(set);
  }, [projects, customCategoriesList]);

  const handleStartNewProject = () => {
    setEditingProject({
      title: '',
      description: '',
      category: 'Full-Stack',
      status: 'In Progress',
      progress: 50,
      repo_url: '',
      demo_url: '',
      architecture_notes: '',
      tags: []
    });
    setProjectCategories(['Full-Stack']);
    setNewCategoryInput('');
  };

  const handleStartEditProject = (proj) => {
    setEditingProject(proj);
    setProjectCategories(getProjectCategories(proj));
    setNewCategoryInput('');
  };

  const handleToggleCategory = (cat) => {
    setProjectCategories(prev => {
      if (prev.includes(cat)) {
        return prev.filter(c => c !== cat);
      } else {
        return [...prev, cat];
      }
    });
  };

  const handleRemoveCategory = (cat) => {
    setProjectCategories(prev => prev.filter(c => c !== cat));
  };

  const handleAddCustomCategory = (e) => {
    if (e) e.preventDefault();
    const trimmed = newCategoryInput.trim();
    if (!trimmed) return;

    if (!projectCategories.includes(trimmed)) {
      setProjectCategories(prev => [...prev, trimmed]);
    }

    if (!customCategoriesList.includes(trimmed) && !DEFAULT_CATEGORIES.includes(trimmed)) {
      const updated = [...customCategoriesList, trimmed];
      setCustomCategoriesList(updated);
      try {
        localStorage.setItem('gyani_custom_project_categories', JSON.stringify(updated));
      } catch (err) {
        console.warn('Could not save custom category to localStorage', err);
      }
    }

    setNewCategoryInput('');
  };

  const handleDeleteCustomCategoryFromPool = (e, cat) => {
    e.stopPropagation();
    const updated = customCategoriesList.filter(c => c !== cat);
    setCustomCategoriesList(updated);
    try {
      localStorage.setItem('gyani_custom_project_categories', JSON.stringify(updated));
    } catch (err) {
      console.warn('Could not update custom categories in localStorage', err);
    }
    setProjectCategories(prev => prev.filter(c => c !== cat));
  };

  const [customUrl, setCustomUrl] = useState(localStorage.getItem('custom_supabase_url') || import.meta.env.VITE_SUPABASE_URL || '');
  const [customKey, setCustomKey] = useState(localStorage.getItem('custom_supabase_key') || import.meta.env.VITE_SUPABASE_ANON_KEY || '');
  const [configSuccess, setConfigSuccess] = useState('');
  const [sqlCopied, setSqlCopied] = useState(false);


  // Automatically sync Supabase Auth session
  useEffect(() => {
    if (isSupabaseConfigured() && supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          setIsAuthenticated(true);
          setCurrentUser(session.user);
          localStorage.setItem('gyani_admin_auth', 'true');
        } else {
          setIsAuthenticated(false);
          setCurrentUser(null);
          localStorage.removeItem('gyani_admin_auth');
        }
      }).catch((err) => {
        console.warn('Session check warning:', err);
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          setIsAuthenticated(true);
          setCurrentUser(session.user);
          localStorage.setItem('gyani_admin_auth', 'true');
        } else {
          setIsAuthenticated(false);
          setCurrentUser(null);
          localStorage.removeItem('gyani_admin_auth');
        }
      });

      return () => subscription?.unsubscribe?.();
    }
  }, []);

  if (!isOpen) return null;

  const showNotification = (msg) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(''), 3000);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setIsSubmitting(true);

    if (!isSupabaseConfigured() || !supabase) {
      setLoginError('Supabase client is not connected. Please verify your Supabase URL & Key in Supabase Setup.');
      setIsSubmitting(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password
      });

      if (error) {
        setLoginError(error.message || 'Invalid administrator email or password.');
      } else if (data?.user) {
        setIsAuthenticated(true);
        setCurrentUser(data.user);
        localStorage.setItem('gyani_admin_auth', 'true');
        showNotification('Authenticated successfully with Supabase!');
      }
    } catch (err) {
      setLoginError('Authentication error: ' + (err.message || err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    localStorage.removeItem('gyani_admin_auth');
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.warn('Sign out warning:', e);
      }
    }
    showNotification('Signed out of curator session.');
  };

  const handleSaveProject = async (e) => {
    e.preventDefault();
    const form = e.target;
    const finalCategories = projectCategories.length > 0 ? projectCategories : ['Full-Stack'];
    const projectData = {
      ...editingProject,
      title: form.title.value.trim(),
      description: form.description?.value?.trim() || '',
      category: finalCategories.join(', '),
      categories: finalCategories,
      status: form.status.value,
      progress: parseInt(form.progress.value, 10) || 100,
      repo_url: form.repo_url?.value?.trim() || '',
      demo_url: form.demo_url?.value?.trim() || '',
      architecture_notes: form.architecture_notes?.value?.trim() || '',
      tags: form.tags?.value ? form.tags.value.split(',').map(t => t.trim()).filter(Boolean) : []
    };

    try {
      setIsSubmitting(true);
      await api.saveProject(projectData);
      setEditingProject(null);
      showNotification('Project saved successfully to Supabase database!');
      onRefreshData();
    } catch (err) {
      alert('Error saving project to Supabase: ' + (err.message || err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProject = async (id) => {
    if (window.confirm('Delete this project record from Supabase?')) {
      try {
        await api.deleteProject(id);
        showNotification('Project deleted from Supabase.');
        onRefreshData();
      } catch (err) {
        alert('Error deleting project: ' + (err.message || err));
      }
    }
  };

  const handleSaveNote = async (e) => {
    e.preventDefault();
    const form = e.target;
    const noteData = {
      ...editingNote,
      title: form.title?.value?.trim() || editingNote?.file_name || 'Untitled Document',
      description: form.description?.value?.trim() || '',
      file_name: form.file_name?.value?.trim() || editingNote?.file_name || 'document',
      file_size: form.file_size?.value?.trim() || editingNote?.file_size || 'Unknown',
      file_type: form.file_type?.value || editingNote?.file_type || 'PDF',
      category: form.category?.value?.trim() || editingNote?.category || 'General',
      preview_content: form.preview_content?.value || editingNote?.preview_content || '',
      tags: form.tags?.value ? form.tags.value.split(',').map(t => t.trim()).filter(Boolean) : (editingNote?.tags || [])
    };

    try {
      setIsSubmitting(true);
      await api.saveNote(noteData);
      setEditingNote(null);
      showNotification('Note and document metadata saved to Supabase!');
      onRefreshData();
    } catch (err) {
      alert('Error saving note to Supabase: ' + (err.message || err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteNote = async (id) => {
    if (window.confirm('Delete this manuscript record from Supabase?')) {
      try {
        await api.deleteNote(id);
        showNotification('Note record deleted from Supabase.');
        onRefreshData();
      } catch (err) {
        alert('Error deleting note: ' + (err.message || err));
      }
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Immediately format size: KB or MB
    const formattedSize = file.size < 1024 * 1024 
      ? (file.size / 1024).toFixed(1) + ' KB' 
      : (file.size / (1024 * 1024)).toFixed(1) + ' MB';
    const inferredExt = (file.name.split('.').pop() || '').toUpperCase();
    const cleanTitle = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]+/g, ' ').trim();

    // Immediately populate state so user sees filename and size instantly
    setEditingNote(prev => ({
      ...prev,
      title: prev?.title ? prev.title : cleanTitle,
      file_name: file.name,
      file_size: formattedSize,
      file_type: ['PDF', 'DOCX', 'MARKDOWN', 'CODE'].includes(inferredExt) ? inferredExt : (inferredExt === 'MD' ? 'MARKDOWN' : 'OTHER')
    }));

    try {
      setIsSubmitting(true);
      const uploaded = await api.uploadFile(file);
      setEditingNote(prev => ({
        ...prev,
        file_name: uploaded.name || file.name,
        file_size: uploaded.size || formattedSize,
        file_url: uploaded.url,
        preview_content: uploaded.content || prev?.preview_content || ''
      }));
      showNotification(`File "${file.name}" (${formattedSize}) loaded into storage!`);
    } catch (err) {
      console.warn('Upload error:', err);
      showNotification(`File metadata "${file.name}" (${formattedSize}) captured.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDoc = async (e) => {
    e.preventDefault();
    const form = e.target;

    // Automatic index calculation: preserve existing index or auto-assign next sequence integer
    const autoOrderIndex = editingDoc?.id && editingDoc?.order_index
      ? Number(editingDoc.order_index)
      : (docs.length > 0 ? Math.max(...docs.map(d => Number(d.order_index) || 0)) + 1 : 1);

    const titleVal = form.title.value.trim();
    const rawSlug = form.slug?.value?.trim() || '';
    const slugVal = rawSlug
      ? rawSlug.toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/(^-|-$)/g, '')
      : titleVal.toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/(^-|-$)/g, '') || `doc-${autoOrderIndex}`;

    const docData = {
      ...editingDoc,
      title: titleVal,
      slug: slugVal,
      category: form.category.value.trim() || 'General',
      order_index: autoOrderIndex,
      summary: form.summary?.value?.trim() || '',
      content: form.content.value
    };

    try {
      setIsSubmitting(true);
      await api.saveDoc(docData);
      setEditingDoc(null);
      showNotification(`Documentation article #${autoOrderIndex} saved to Supabase!`);
      onRefreshData();
    } catch (err) {
      alert('Error saving document to Supabase: ' + (err.message || err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDoc = async (id) => {
    if (window.confirm('Delete this documentation article from Supabase?')) {
      try {
        await api.deleteDoc(id);
        showNotification('Documentation article deleted from Supabase.');
        onRefreshData();
      } catch (err) {
        alert('Error deleting documentation: ' + (err.message || err));
      }
    }
  };

  const handleSaveCredentials = (e) => {
    e.preventDefault();
    updateSupabaseCredentials(customUrl, customKey);
    setConfigSuccess('Supabase credentials synchronized!');
    setTimeout(() => {
      onRefreshData();
    }, 800);
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SCHEMA_SQL);
    setSqlCopied(true);
    setTimeout(() => setSqlCopied(false), 2500);
  };

  const handleExportArchive = () => {
    const archivePayload = {
      archive: 'Gyani Knowledge Archive',
      version: '1.0',
      exported_at: new Date().toISOString(),
      counts: {
        projects: projects.length,
        notes: notes.length,
        docs: docs.length
      },
      data: {
        projects,
        notes,
        documentation: docs
      }
    };

    const blob = new Blob([JSON.stringify(archivePayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `gyani-archive-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showNotification('Complete Gyani archive exported to JSON backup!');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="paper-panel modal-dialog" 
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '940px' }}
      >
        {/* Top Header */}
        <div className="admin-header">
          <div className="admin-header-brand">
            <GyaniLogo size="sm" showSubtext={false} />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                <span className="paper-stamp paper-stamp-active">ADMIN REGISTRY</span>
                <span className={`paper-stamp ${isSupabaseConfigured() ? 'paper-stamp-sage' : ''}`}>
                  {isSupabaseConfigured() ? 'SUPABASE LIVE' : 'LOCAL SANDBOX'}
                </span>
              </div>
              <h2 style={{ fontSize: '1.2rem', color: 'var(--text-primary)', marginTop: '2px', lineHeight: 1.25 }}>
                Gyani Curator Console
              </h2>
              {currentUser?.email && (
                <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                  User: {currentUser.email}
                </div>
              )}
            </div>
          </div>

          <div className="admin-header-actions">
            {isAuthenticated && (
              <>
                <button 
                  onClick={handleExportArchive}
                  className="paper-btn paper-btn-sm"
                  title="Download complete archive as JSON backup"
                >
                  <Download size={13} />
                  <span>Backup JSON</span>
                </button>
                <button 
                  onClick={handleLogout}
                  className="paper-btn paper-btn-sm"
                  title="Log out"
                >
                  <LogOut size={13} />
                  <span>Sign Out</span>
                </button>
              </>
            )}
            <button 
              onClick={onClose} 
              className="paper-btn paper-btn-icon"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Global Action Notice */}
        {actionNotice && (
          <div style={{
            padding: '10px 16px',
            marginBottom: '18px',
            borderRadius: '4px',
            border: '1px solid var(--accent-ink)',
            background: 'var(--bg-tertiary)',
            color: 'var(--text-primary)',
            fontSize: '0.85rem',
            fontFamily: 'var(--font-mono)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Check size={15} color="var(--accent-ink)" />
            <span>{actionNotice}</span>
          </div>
        )}

        {/* NOT AUTHENTICATED: Supabase Auth Login Form */}
        {!isAuthenticated ? (
          <div style={{ maxWidth: '440px', margin: '20px auto', width: '100%' }}>
            <div className="paper-panel-subtle" style={{ padding: 'clamp(20px, 4vw, 32px)', textAlign: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '14px' }}>
                <GyaniLogo size="md" />
              </div>

              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                <span className="paper-stamp paper-stamp-active" style={{ fontSize: '0.72rem' }}>
                  <Lock size={11} />
                  SUPABASE AUTHENTICATION
                </span>
              </div>

              <h3 style={{ fontSize: '1.25rem', marginBottom: '6px', color: 'var(--text-primary)' }}>
                Curator Authentication
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '20px', fontFamily: 'var(--font-serif)', lineHeight: 1.5 }}>
                Sign in with your authorized Supabase administrator credentials to manage projects, documents, and wiki pages.
              </p>

              {loginError && (
                <div style={{
                  padding: '10px 14px',
                  borderRadius: '4px',
                  background: 'var(--accent-stamp-bg)',
                  color: 'var(--accent-stamp)',
                  fontSize: '0.8rem',
                  marginBottom: '16px',
                  textAlign: 'left',
                  border: '1px solid var(--accent-stamp)'
                }}>
                  {loginError}
                </div>
              )}

              <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px', textAlign: 'left' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    ADMINISTRATOR EMAIL
                  </label>
                  <input
                    type="email"
                    placeholder="curator@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="paper-input"
                    autoFocus
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    PASSWORD
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="paper-input"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="paper-btn paper-btn-primary"
                  style={{ marginTop: '6px', padding: '11px', width: '100%', justifyContent: 'center' }}
                >
                  <Lock size={14} />
                  <span>{isSubmitting ? 'Verifying with Supabase...' : 'Unlock Curator Console'}</span>
                </button>
              </form>

              <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border-color)', fontSize: '0.72rem', color: 'var(--text-tertiary)', lineHeight: 1.4 }}>
                Secured strictly via Supabase Auth. Master passkey access has been permanently disabled.
              </div>
            </div>
          </div>
        ) : (
          /* AUTHENTICATED: Full Management Interface */
          <div>
            {/* Tabs */}
            <div className="admin-tabs-bar">
              <button
                onClick={() => { setActiveTab('projects'); setEditingProject(null); }}
                className={`paper-stamp ${activeTab === 'projects' ? 'paper-stamp-active' : ''}`}
                style={{ cursor: 'pointer' }}
              >
                <FolderGit2 size={13} />
                <span>Projects ({projects.length})</span>
              </button>
              <button
                onClick={() => { setActiveTab('notes'); setEditingNote(null); }}
                className={`paper-stamp ${activeTab === 'notes' ? 'paper-stamp-active' : ''}`}
                style={{ cursor: 'pointer' }}
              >
                <FileText size={13} />
                <span>Notes & Files ({notes.length})</span>
              </button>
              <button
                onClick={() => { setActiveTab('docs'); setEditingDoc(null); }}
                className={`paper-stamp ${activeTab === 'docs' ? 'paper-stamp-active' : ''}`}
                style={{ cursor: 'pointer' }}
              >
                <BookOpen size={13} />
                <span>Docs ({docs.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('supabase')}
                className={`paper-stamp ${activeTab === 'supabase' ? 'paper-stamp-active' : ''}`}
                style={{ cursor: 'pointer' }}
              >
                <Database size={13} />
                <span>Supabase Setup</span>
              </button>
            </div>

            {/* TAB 1: PROJECTS */}
            {activeTab === 'projects' && (
              <div>
                {!editingProject ? (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <h3 style={{ fontSize: '1.15rem' }}>
                        Projects Directory Register
                      </h3>
                      <button
                        onClick={handleStartNewProject}
                        className="paper-btn paper-btn-primary paper-btn-sm"
                      >
                        <Plus size={14} />
                        <span>New Project Entry</span>
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {projects.map(proj => (
                        <div 
                          key={proj.id} 
                          className="paper-panel-subtle admin-item-row"
                        >
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)', fontFamily: 'var(--font-serif)' }}>
                              {proj.title}
                            </div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                              {getProjectCategories(proj).map((cat, idx) => (
                                <span key={idx} className="paper-stamp" style={{ padding: '1px 6px', fontSize: '0.68rem' }}>
                                  {cat}
                                </span>
                              ))}
                              <span>• {proj.status} ({proj.progress}%)</span>
                              {proj.repo_url && <span>• GitHub: {proj.repo_url}</span>}
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              onClick={() => handleStartEditProject(proj)}
                              className="paper-btn paper-btn-sm"
                            >
                              <Edit3 size={13} />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => handleDeleteProject(proj.id)}
                              className="paper-btn paper-btn-sm"
                              style={{ color: 'var(--accent-stamp)' }}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSaveProject} className="paper-panel-subtle admin-form-padding">
                    <h3 style={{ fontSize: '1.2rem', marginBottom: '16px' }}>
                      {editingProject.id ? 'Edit Project Entry' : 'Create New Project Entry'}
                    </h3>

                    {/* Basic Info Fields */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: '14px', marginBottom: '14px' }}>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <label style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                          PROJECT TITLE
                        </label>
                        <input
                          name="title"
                          defaultValue={editingProject.title}
                          className="paper-input"
                          placeholder="e.g. Distributed Consensus Engine"
                          required
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                          STATUS
                        </label>
                        <select name="status" defaultValue={editingProject.status || 'Active'} className="paper-input">
                          <option value="Completed">Completed</option>
                          <option value="Active">Active</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Planned">Planned</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                          PROGRESS %
                        </label>
                        <input
                          name="progress"
                          type="number"
                          min="0"
                          max="100"
                          defaultValue={editingProject.progress !== undefined ? editingProject.progress : 100}
                          className="paper-input"
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                          GITHUB URL
                        </label>
                        <input
                          name="repo_url"
                          type="url"
                          defaultValue={editingProject.repo_url}
                          placeholder="https://github.com/..."
                          className="paper-input"
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                          LIVE DEMO URL
                        </label>
                        <input
                          name="demo_url"
                          type="url"
                          defaultValue={editingProject.demo_url}
                          placeholder="https://..."
                          className="paper-input"
                        />
                      </div>
                    </div>

                    {/* CATEGORIES SECTION (MULTIPLE & CUSTOM CATEGORIES) */}
                    <div className="paper-panel" style={{ padding: '16px', marginBottom: '16px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                        <div>
                          <label style={{ fontSize: '0.78rem', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', fontWeight: 600, display: 'block' }}>
                            PROJECT CATEGORIES (MULTIPLE & CUSTOM)
                          </label>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                            Assign multiple categories or create custom categories for your system
                          </span>
                        </div>
                        <span className="paper-stamp paper-stamp-active" style={{ fontSize: '0.7rem' }}>
                          {projectCategories.length} Selected
                        </span>
                      </div>

                      {/* Active selected categories chips */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', minHeight: '38px', alignItems: 'center', marginBottom: '12px', padding: '8px 10px', background: 'var(--bg-card)', borderRadius: '4px', border: '1px dashed var(--border-color)' }}>
                        {projectCategories.length === 0 ? (
                          <span style={{ fontSize: '0.78rem', color: 'var(--accent-stamp)', fontStyle: 'italic' }}>
                            No category selected. Please select from below or add a custom category.
                          </span>
                        ) : (
                          projectCategories.map((cat) => (
                            <span 
                              key={cat} 
                              className="paper-stamp paper-stamp-active"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 9px', fontSize: '0.76rem' }}
                            >
                              <span>{cat}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveCategory(cat)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: 'inherit',
                                  cursor: 'pointer',
                                  padding: '0 2px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  opacity: 0.85
                                }}
                                title={`Remove ${cat}`}
                              >
                                <X size={12} />
                              </button>
                            </span>
                          ))
                        )}
                      </div>

                      {/* Custom category entry input */}
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
                        <input
                          type="text"
                          value={newCategoryInput}
                          onChange={(e) => setNewCategoryInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddCustomCategory(e);
                            }
                          }}
                          placeholder="Type custom category name (e.g. Robotics, Cryptography, Compilers)..."
                          className="paper-input"
                          style={{ flex: '1 1 240px', fontSize: '0.85rem', padding: '7px 11px' }}
                        />
                        <button
                          type="button"
                          onClick={handleAddCustomCategory}
                          className="paper-btn paper-btn-sm"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '7px 14px' }}
                        >
                          <Plus size={13} />
                          <span>Add Category</span>
                        </button>
                      </div>

                      {/* Available categories quick toggle cloud */}
                      <div>
                        <div style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', marginBottom: '6px', textTransform: 'uppercase' }}>
                          SUGGESTED & CATALOGED CATEGORIES (CLICK TO TOGGLE):
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', maxHeight: '120px', overflowY: 'auto' }}>
                          {allAvailableCategories.map((cat) => {
                            const isSelected = projectCategories.includes(cat);
                            const isCustom = customCategoriesList.includes(cat);
                            return (
                              <span
                                key={cat}
                                onClick={() => handleToggleCategory(cat)}
                                className={`paper-stamp ${isSelected ? 'paper-stamp-active' : ''}`}
                                style={{
                                  cursor: 'pointer',
                                  fontSize: '0.72rem',
                                  padding: '3px 8px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '5px',
                                  userSelect: 'none'
                                }}
                                title={isSelected ? `Click to deselect ${cat}` : `Click to select ${cat}`}
                              >
                                {isSelected ? <Check size={11} /> : <Plus size={11} />}
                                <span>{cat}</span>
                                {isCustom && !isSelected && (
                                  <button
                                    type="button"
                                    onClick={(e) => handleDeleteCustomCategoryFromPool(e, cat)}
                                    style={{
                                      background: 'none',
                                      border: 'none',
                                      color: 'var(--accent-stamp)',
                                      cursor: 'pointer',
                                      padding: '0 2px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      marginLeft: '3px'
                                    }}
                                    title={`Delete custom category "${cat}" from saved pool`}
                                  >
                                    <X size={11} />
                                  </button>
                                )}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <div style={{ marginBottom: '14px' }}>
                      <label style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                        DESCRIPTION (OPTIONAL)
                      </label>
                      <textarea
                        name="description"
                        defaultValue={editingProject.description}
                        className="paper-input"
                        style={{ minHeight: '70px' }}
                        placeholder="Optional project abstract or overview..."
                      />
                    </div>

                    <div style={{ marginBottom: '14px' }}>
                      <label style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                        ARCHITECTURE & ENGINEERING NOTES (OPTIONAL)
                      </label>
                      <textarea
                        name="architecture_notes"
                        defaultValue={editingProject.architecture_notes}
                        className="paper-input"
                        style={{ minHeight: '70px' }}
                        placeholder="Optional architectural patterns, engineering trade-offs, and technical notes..."
                      />
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                      <label style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                        TAGS (COMMA SEPARATED, OPTIONAL)
                      </label>
                      <input
                        name="tags"
                        defaultValue={editingProject.tags?.join(', ')}
                        className="paper-input"
                        placeholder="e.g. distributed-systems, raft, rust, webassembly"
                      />
                    </div>

                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                      <button
                        type="button"
                        onClick={() => setEditingProject(null)}
                        className="paper-btn"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="paper-btn paper-btn-primary"
                      >
                        <Save size={14} />
                        <span>Save Entry</span>
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* TAB 2: NOTES */}
            {activeTab === 'notes' && (
              <div>
                {!editingNote ? (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <h3 style={{ fontSize: '1.15rem' }}>
                        Manuscript & File Register
                      </h3>
                      <button
                        onClick={() => setEditingNote({
                          title: '',
                          description: '',
                          file_name: '',
                          file_size: '',
                          file_type: 'PDF',
                          category: 'Databases',
                          preview_content: '',
                          tags: []
                        })}
                        className="paper-btn paper-btn-primary paper-btn-sm"
                      >
                        <Upload size={14} />
                        <span>Upload File</span>
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {notes.map(note => (
                        <div 
                          key={note.id} 
                          className="paper-panel-subtle admin-item-row"
                        >
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)', fontFamily: 'var(--font-serif)' }}>
                              {note.title}
                            </div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                              <span className="paper-stamp" style={{ padding: '1px 6px', fontSize: '0.68rem' }}>{note.file_type}</span>
                              {' • '}{note.file_name} ({note.file_size}) • {note.category}
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              onClick={() => setEditingNote(note)}
                              className="paper-btn paper-btn-sm"
                            >
                              <Edit3 size={13} />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => handleDeleteNote(note.id)}
                              className="paper-btn paper-btn-sm"
                              style={{ color: 'var(--accent-stamp)' }}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSaveNote} className="paper-panel-subtle admin-form-padding">
                    <h3 style={{ fontSize: '1.2rem', marginBottom: '16px' }}>
                      {editingNote.id ? 'Edit Manuscript Record' : 'Upload New Document'}
                    </h3>

                    <div style={{ 
                      padding: '16px', 
                      border: '1px dashed var(--border-color)', 
                      borderRadius: '4px', 
                      textAlign: 'center', 
                      marginBottom: '18px',
                      background: 'var(--bg-card)'
                    }}>
                      <Upload size={24} color="var(--text-primary)" style={{ margin: '0 auto 6px auto' }} />
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        Select Document (PDF, DOCX, Markdown, etc.)
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginBottom: '10px' }}>
                        Filename and file size are automatically captured on selection
                      </div>
                      <input
                        type="file"
                        onChange={handleFileUpload}
                        style={{ fontSize: '0.8rem' }}
                      />
                      {editingNote.file_name && (
                        <div style={{ marginTop: '8px', fontSize: '0.76rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                          <span className="paper-stamp paper-stamp-active" style={{ fontSize: '0.7rem' }}>
                            {editingNote.file_name}
                          </span>
                          <span>• {editingNote.file_size || 'Auto-detected'}</span>
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: '14px', marginBottom: '14px' }}>
                      <div>
                        <label style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                          TITLE
                        </label>
                        <input
                          name="title"
                          value={editingNote.title || ''}
                          onChange={(e) => setEditingNote(prev => ({ ...prev, title: e.target.value }))}
                          placeholder="Document title..."
                          className="paper-input"
                          required
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                          FILENAME (AUTO-DETECTED)
                        </label>
                        <input
                          name="file_name"
                          value={editingNote.file_name || ''}
                          onChange={(e) => setEditingNote(prev => ({ ...prev, file_name: e.target.value }))}
                          placeholder="Auto-detected from file..."
                          className="paper-input"
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                          FORMAT
                        </label>
                        <select 
                          name="file_type" 
                          value={editingNote.file_type || 'PDF'} 
                          onChange={(e) => setEditingNote(prev => ({ ...prev, file_type: e.target.value }))}
                          className="paper-input"
                        >
                          <option value="PDF">PDF</option>
                          <option value="DOCX">DOCX</option>
                          <option value="MARKDOWN">MARKDOWN</option>
                          <option value="CODE">CODE</option>
                          <option value="OTHER">OTHER</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                          FILE SIZE (AUTO-DETECTED)
                        </label>
                        <input
                          name="file_size"
                          value={editingNote.file_size || ''}
                          onChange={(e) => setEditingNote(prev => ({ ...prev, file_size: e.target.value }))}
                          placeholder="Auto-detected size..."
                          className="paper-input"
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                          CATEGORY (CUSTOM OR PRESET)
                        </label>
                        <input
                          name="category"
                          value={editingNote.category || 'System Design'}
                          onChange={(e) => setEditingNote(prev => ({ ...prev, category: e.target.value }))}
                          className="paper-input"
                          list="note-categories-datalist"
                          placeholder="Select or type custom category..."
                        />
                        <datalist id="note-categories-datalist">
                          <option value="System Design" />
                          <option value="Databases" />
                          <option value="Distributed Systems" />
                          <option value="Algorithms" />
                          <option value="Networking" />
                          <option value="Cloud Architecture" />
                          <option value="Security" />
                          <option value="Performance" />
                          <option value="Machine Learning" />
                        </datalist>
                      </div>
                    </div>

                    <div style={{ marginBottom: '14px' }}>
                      <label style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                        SUMMARY (OPTIONAL)
                      </label>
                      <textarea
                        name="description"
                        value={editingNote.description || ''}
                        onChange={(e) => setEditingNote(prev => ({ ...prev, description: e.target.value }))}
                        className="paper-input"
                        style={{ minHeight: '65px' }}
                        placeholder="Optional brief summary or abstract..."
                      />
                    </div>

                    <div style={{ marginBottom: '14px' }}>
                      <label style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                        READER EXTRACT / MARKDOWN PREVIEW (OPTIONAL)
                      </label>
                      <textarea
                        name="preview_content"
                        value={editingNote.preview_content || ''}
                        onChange={(e) => setEditingNote(prev => ({ ...prev, preview_content: e.target.value }))}
                        className="paper-input"
                        style={{ minHeight: '120px', fontFamily: 'var(--font-mono)', fontSize: '0.825rem' }}
                        placeholder="Optional inline markdown or extracted preview text..."
                      />
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                      <label style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                        TAGS (COMMA SEPARATED, OPTIONAL)
                      </label>
                      <input
                        name="tags"
                        value={Array.isArray(editingNote.tags) ? editingNote.tags.join(', ') : (editingNote.tags || '')}
                        onChange={(e) => setEditingNote(prev => ({ ...prev, tags: e.target.value.split(',').map(t => t.trim()) }))}
                        className="paper-input"
                        placeholder="e.g. system-design, storage, databases"
                      />
                    </div>

                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                      <button
                        type="button"
                        onClick={() => setEditingNote(null)}
                        className="paper-btn"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="paper-btn paper-btn-primary"
                      >
                        <Save size={14} />
                        <span>Save Record</span>
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* TAB 3: DOCS */}
            {activeTab === 'docs' && (
              <div>
                {!editingDoc ? (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <h3 style={{ fontSize: '1.15rem' }}>
                        Documentation Monograph Register
                      </h3>
                      <button
                        onClick={() => {
                          const nextOrderIndex = docs.length > 0 ? Math.max(...docs.map(d => Number(d.order_index) || 0)) + 1 : 1;
                          setEditingDoc({
                            title: '',
                            slug: '',
                            category: 'Getting Started',
                            order_index: nextOrderIndex,
                            summary: '',
                            content: `# Topic Title\n\nWrite your technical documentation here...\n\n## Section 1\n\n\`\`\`javascript\nconsole.log('Gyani Technical Docs');\n\`\`\``
                          });
                        }}
                        className="paper-btn paper-btn-primary paper-btn-sm"
                      >
                        <Plus size={14} />
                        <span>New Page</span>
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {docs.map(doc => (
                        <div 
                          key={doc.id} 
                          className="paper-panel-subtle admin-item-row"
                        >
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)', fontFamily: 'var(--font-serif)' }}>
                              {doc.title}
                            </div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                              <span className="paper-stamp" style={{ padding: '1px 6px', fontSize: '0.68rem' }}>{doc.category}</span>
                              {' • '}/{doc.slug} • Order #{doc.order_index || 0}
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              onClick={() => setEditingDoc(doc)}
                              className="paper-btn paper-btn-sm"
                            >
                              <Edit3 size={13} />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => handleDeleteDoc(doc.id)}
                              className="paper-btn paper-btn-sm"
                              style={{ color: 'var(--accent-stamp)' }}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSaveDoc} className="paper-panel-subtle admin-form-padding">
                    <h3 style={{ fontSize: '1.2rem', marginBottom: '16px' }}>
                      {editingDoc.id ? 'Edit Documentation Page' : 'Author Documentation Page'}
                    </h3>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: '14px', marginBottom: '14px' }}>
                      <div>
                        <label style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                          ARTICLE TITLE
                        </label>
                        <input
                          name="title"
                          defaultValue={editingDoc.title}
                          className="paper-input"
                          required
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                          SLUG (OPTIONAL)
                        </label>
                        <input
                          name="slug"
                          defaultValue={editingDoc.slug}
                          placeholder="Auto-generated from title if blank..."
                          className="paper-input"
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                          CATEGORY (CUSTOM OR PRESET)
                        </label>
                        <input
                          name="category"
                          defaultValue={editingDoc.category || 'Architecture'}
                          className="paper-input"
                          list="doc-categories-datalist"
                          placeholder="Select or type custom category..."
                        />
                        <datalist id="doc-categories-datalist">
                          <option value="Architecture" />
                          <option value="Getting Started" />
                          <option value="Guides" />
                          <option value="API Reference" />
                          <option value="Deep Dive" />
                          <option value="Design Patterns" />
                          <option value="Infrastructure" />
                          <option value="Best Practices" />
                        </datalist>
                      </div>

                      <div>
                        <label style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                          ORDER INDEX (AUTOMATIC)
                        </label>
                        <div style={{
                          padding: '7px 11px',
                          background: 'var(--bg-card)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          <span className="paper-stamp paper-stamp-active" style={{ fontSize: '0.7rem' }}>
                            #{editingDoc.order_index || (docs.length > 0 ? Math.max(...docs.map(d => Number(d.order_index) || 0)) + 1 : 1)}
                          </span>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
                            {editingDoc.id ? 'Preserved' : 'Auto-assigned in sequence'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div style={{ marginBottom: '14px' }}>
                      <label style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                        SUMMARY LEAD
                      </label>
                      <input
                        name="summary"
                        defaultValue={editingDoc.summary}
                        className="paper-input"
                      />
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <label style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                          MARKDOWN TEXT
                        </label>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                          Supports ## Headings, ```code, | tables |, and &gt; [!NOTE] callouts
                        </span>
                      </div>
                      <textarea
                        name="content"
                        defaultValue={editingDoc.content}
                        className="paper-input"
                        style={{ minHeight: '220px', fontFamily: 'var(--font-mono)', fontSize: '0.825rem' }}
                        required
                      />
                    </div>

                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                      <button
                        type="button"
                        onClick={() => setEditingDoc(null)}
                        className="paper-btn"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="paper-btn paper-btn-primary"
                      >
                        <Save size={14} />
                        <span>Save Article</span>
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* TAB 4: SUPABASE CONFIG */}
            {activeTab === 'supabase' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="paper-panel-subtle" style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Database size={18} color="var(--text-primary)" />
                      <h3 style={{ fontSize: '1.15rem' }}>
                        Supabase Backend Sync
                      </h3>
                    </div>

                    <span className={`paper-stamp ${isSupabaseConfigured() ? 'paper-stamp-sage' : ''}`}>
                      {isSupabaseConfigured() ? '✓ Connected' : 'Local Archive'}
                    </span>
                  </div>

                  {configSuccess && (
                    <div style={{
                      padding: '8px 12px',
                      borderRadius: '4px',
                      background: 'var(--accent-sage-bg)',
                      color: 'var(--accent-sage)',
                      fontSize: '0.825rem',
                      marginBottom: '14px'
                    }}>
                      {configSuccess}
                    </div>
                  )}

                  <form onSubmit={handleSaveCredentials} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                        SUPABASE PROJECT URL
                      </label>
                      <input
                        type="url"
                        value={customUrl}
                        onChange={(e) => setCustomUrl(e.target.value)}
                        placeholder="https://xyz.supabase.co"
                        className="paper-input"
                        required
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                        SUPABASE ANON API KEY
                      </label>
                      <input
                        type="text"
                        value={customKey}
                        onChange={(e) => setCustomKey(e.target.value)}
                        placeholder="eyJh..."
                        className="paper-input"
                        required
                      />
                    </div>

                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '6px' }}>
                      <button
                        type="button"
                        onClick={() => {
                          clearSupabaseCredentials();
                          setCustomUrl('');
                          setCustomKey('');
                          onRefreshData();
                          setConfigSuccess('Reset to local archive.');
                        }}
                        className="paper-btn"
                      >
                        Reset Local
                      </button>
                      <button
                        type="submit"
                        className="paper-btn paper-btn-primary"
                      >
                        <Save size={14} />
                        <span>Save & Synchronize</span>
                      </button>
                    </div>
                  </form>
                </div>

                <div className="paper-panel-subtle" style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Code2 size={18} color="var(--text-primary)" />
                      <h3 style={{ fontSize: '1.15rem' }}>
                        PostgreSQL Schema Script
                      </h3>
                    </div>

                    <button
                      onClick={handleCopySql}
                      className="paper-btn paper-btn-primary paper-btn-sm"
                    >
                      {sqlCopied ? <Check size={13} /> : <Copy size={13} />}
                      <span>{sqlCopied ? 'Copied' : 'Copy SQL Script'}</span>
                    </button>
                  </div>

                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '12px', fontFamily: 'var(--font-serif)' }}>
                    Paste this into your Supabase SQL Editor to initialize projects, notes, and documentation tables with public read and authenticated admin policies.
                  </p>

                  <pre style={{
                    padding: '14px',
                    borderRadius: '4px',
                    background: 'var(--code-bg)',
                    border: '1px solid var(--code-border)',
                    maxHeight: '220px',
                    overflowY: 'auto',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.75rem',
                    color: 'var(--code-text)'
                  }}>
                    {SUPABASE_SCHEMA_SQL}
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
