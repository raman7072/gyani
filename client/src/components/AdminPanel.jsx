import React, { useState } from 'react';
import { 
  Lock, 
  X, 
  Plus, 
  Trash2, 
  Edit3, 
  Save, 
  Upload, 
  Database, 
  Key, 
  Check, 
  Copy, 
  FolderGit2, 
  FileText, 
  BookOpen, 
  LogOut, 
  Code2
} from 'lucide-react';
import { 
  api, 
  isSupabaseConfigured, 
  updateSupabaseCredentials, 
  clearSupabaseCredentials, 
  SUPABASE_SCHEMA_SQL,
  supabase 
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
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('gyani_admin_auth') === 'true' || localStorage.getItem('aethervault_admin_auth') === 'true';
  });

  const [authMode, setAuthMode] = useState('passphrase');
  const [passphrase, setPassphrase] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionNotice, setActionNotice] = useState('');

  const [activeTab, setActiveTab] = useState('projects');

  const [editingProject, setEditingProject] = useState(null);
  const [editingNote, setEditingNote] = useState(null);
  const [editingDoc, setEditingDoc] = useState(null);

  const [customUrl, setCustomUrl] = useState(localStorage.getItem('custom_supabase_url') || import.meta.env.VITE_SUPABASE_URL || '');
  const [customKey, setCustomKey] = useState(localStorage.getItem('custom_supabase_key') || import.meta.env.VITE_SUPABASE_ANON_KEY || '');
  const [configSuccess, setConfigSuccess] = useState('');
  const [sqlCopied, setSqlCopied] = useState(false);

  if (!isOpen) return null;

  const showNotification = (msg) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(''), 3000);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setIsSubmitting(true);

    if (authMode === 'passphrase') {
      if (passphrase === 'admin' || passphrase === 'admin123' || passphrase === 'master' || passphrase.length >= 4) {
        setIsAuthenticated(true);
        localStorage.setItem('gyani_admin_auth', 'true');
        setIsSubmitting(false);
      } else {
        setLoginError('Passphrase must be at least 4 characters (e.g. admin123)');
        setIsSubmitting(false);
      }
      return;
    }

    if (authMode === 'supabase') {
      if (!isSupabaseConfigured() || !supabase) {
        setLoginError('Supabase is not configured yet. Configure URL & Key below or use Master Passphrase.');
        setIsSubmitting(false);
        return;
      }
      try {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          setLoginError(error.message);
        } else {
          setIsAuthenticated(true);
          localStorage.setItem('gyani_admin_auth', 'true');
        }
      } catch (err) {
        setLoginError('Authentication failed: ' + err.message);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('gyani_admin_auth');
    localStorage.removeItem('aethervault_admin_auth');
    if (supabase) supabase.auth.signOut();
  };

  const handleSaveProject = async (e) => {
    e.preventDefault();
    const form = e.target;
    const projectData = {
      ...editingProject,
      title: form.title.value.trim(),
      description: form.description.value.trim(),
      category: form.category.value,
      status: form.status.value,
      progress: parseInt(form.progress.value, 10) || 100,
      repo_url: form.repo_url.value.trim(),
      demo_url: form.demo_url.value.trim(),
      architecture_notes: form.architecture_notes.value.trim(),
      tags: form.tags.value.split(',').map(t => t.trim()).filter(Boolean)
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
      title: form.title.value.trim(),
      description: form.description.value.trim(),
      file_name: form.file_name.value.trim(),
      file_size: form.file_size.value.trim() || '1.2 MB',
      file_type: form.file_type.value,
      category: form.category.value,
      preview_content: form.preview_content.value,
      tags: form.tags.value.split(',').map(t => t.trim()).filter(Boolean)
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

    try {
      setIsSubmitting(true);
      const uploaded = await api.uploadFile(file);
      setEditingNote(prev => ({
        ...prev,
        file_name: uploaded.name,
        file_size: uploaded.size,
        file_url: uploaded.url,
        file_type: file.name.split('.').pop().toUpperCase(),
        preview_content: uploaded.content || prev?.preview_content || ''
      }));
      showNotification('File stored in Supabase "documents" bucket!');
    } catch (err) {
      alert('Upload error: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDoc = async (e) => {
    e.preventDefault();
    const form = e.target;
    const docData = {
      ...editingDoc,
      title: form.title.value.trim(),
      slug: form.slug.value.trim().toLowerCase().replace(/\s+/g, '-'),
      category: form.category.value,
      order_index: parseInt(form.order_index.value, 10) || 1,
      summary: form.summary.value.trim(),
      content: form.content.value
    };

    try {
      setIsSubmitting(true);
      await api.saveDoc(docData);
      setEditingDoc(null);
      showNotification('Documentation article saved to Supabase!');
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '22px', borderBottom: '1px solid var(--border-color)', paddingBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <GyaniLogo size="sm" showSubtext={false} />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="paper-stamp paper-stamp-active">ADMIN REGISTRY</span>
                <span className="paper-stamp">
                  {isSupabaseConfigured() ? 'SUPABASE LIVE' : 'LOCAL SANDBOX'}
                </span>
              </div>
              <h2 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', marginTop: '2px' }}>
                Gyani Curator Console
              </h2>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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

        {/* NOT AUTHENTICATED: Login Form */}
        {!isAuthenticated ? (
          <div style={{ maxWidth: '420px', margin: '28px auto' }}>
            <div className="paper-panel-subtle" style={{ padding: '28px', textAlign: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                <GyaniLogo size="md" />
              </div>

              <h3 style={{ fontSize: '1.25rem', marginBottom: '6px' }}>
                Curator Authentication
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '20px', fontFamily: 'var(--font-serif)' }}>
                Access the Gyani repository to publish projects, upload docx/PDF manuscripts, and author documentation.
              </p>

              <div style={{ display: 'flex', gap: '6px', marginBottom: '18px', background: 'var(--bg-tertiary)', padding: '3px', borderRadius: '4px' }}>
                <button
                  type="button"
                  onClick={() => setAuthMode('passphrase')}
                  className={`paper-stamp ${authMode === 'passphrase' ? 'paper-stamp-active' : ''}`}
                  style={{ flex: 1, justifyContent: 'center', cursor: 'pointer', border: 'none' }}
                >
                  Master Passkey
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode('supabase')}
                  className={`paper-stamp ${authMode === 'supabase' ? 'paper-stamp-active' : ''}`}
                  style={{ flex: 1, justifyContent: 'center', cursor: 'pointer', border: 'none' }}
                >
                  Supabase Auth
                </button>
              </div>

              {loginError && (
                <div style={{
                  padding: '8px 12px',
                  borderRadius: '4px',
                  background: 'var(--accent-stamp-bg)',
                  color: 'var(--accent-stamp)',
                  fontSize: '0.8rem',
                  marginBottom: '14px',
                  textAlign: 'left'
                }}>
                  {loginError}
                </div>
              )}

              <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left' }}>
                {authMode === 'passphrase' ? (
                  <div>
                    <label style={{ fontSize: '0.78rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                      MASTER PASSKEY
                    </label>
                    <input
                      type="password"
                      placeholder="admin123"
                      value={passphrase}
                      onChange={(e) => setPassphrase(e.target.value)}
                      className="paper-input"
                      required
                    />
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                      Tip: Enter <code>admin123</code> for immediate curator access.
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <label style={{ fontSize: '0.78rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                        SUPABASE EMAIL
                      </label>
                      <input
                        type="email"
                        placeholder="admin@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="paper-input"
                        required
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.78rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                        PASSWORD
                      </label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="paper-input"
                        required
                      />
                    </div>
                  </>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="paper-btn paper-btn-primary"
                  style={{ marginTop: '8px', padding: '10px' }}
                >
                  {isSubmitting ? 'Authenticating...' : 'Unlock Archive Manager'}
                </button>
              </form>
            </div>
          </div>
        ) : (
          /* AUTHENTICATED: Full Management Interface */
          <div>
            {/* Tabs */}
            <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
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
                        onClick={() => setEditingProject({
                          title: '',
                          description: '',
                          category: 'Full-Stack',
                          status: 'In Progress',
                          progress: 50,
                          repo_url: '',
                          demo_url: '',
                          architecture_notes: '',
                          tags: []
                        })}
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
                          className="paper-panel-subtle" 
                          style={{ padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '14px' }}
                        >
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)', fontFamily: 'var(--font-serif)' }}>
                              {proj.title}
                            </div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                              <span className="paper-stamp" style={{ padding: '1px 6px', fontSize: '0.68rem' }}>{proj.category}</span>
                              {' • '}{proj.status} ({proj.progress}%)
                              {proj.repo_url && ` • GitHub: ${proj.repo_url}`}
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              onClick={() => setEditingProject(proj)}
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
                  <form onSubmit={handleSaveProject} className="paper-panel-subtle" style={{ padding: '20px' }}>
                    <h3 style={{ fontSize: '1.2rem', marginBottom: '16px' }}>
                      {editingProject.id ? 'Edit Project Entry' : 'Create New Project Entry'}
                    </h3>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px', marginBottom: '14px' }}>
                      <div>
                        <label style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                          PROJECT TITLE
                        </label>
                        <input
                          name="title"
                          defaultValue={editingProject.title}
                          className="paper-input"
                          required
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                          CATEGORY
                        </label>
                        <select name="category" defaultValue={editingProject.category || 'Full-Stack'} className="paper-input">
                          <option value="Backend / Systems">Backend / Systems</option>
                          <option value="Frontend / UI">Frontend / UI</option>
                          <option value="AI / Machine Learning">AI / Machine Learning</option>
                          <option value="Systems / Low-Level">Systems / Low-Level</option>
                          <option value="Full-Stack">Full-Stack</option>
                          <option value="DevOps & Cloud">DevOps & Cloud</option>
                        </select>
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

                    <div style={{ marginBottom: '14px' }}>
                      <label style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                        DESCRIPTION
                      </label>
                      <textarea
                        name="description"
                        defaultValue={editingProject.description}
                        className="paper-input"
                        style={{ minHeight: '70px' }}
                        required
                      />
                    </div>

                    <div style={{ marginBottom: '14px' }}>
                      <label style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                        ARCHITECTURE & ENGINEERING NOTES
                      </label>
                      <textarea
                        name="architecture_notes"
                        defaultValue={editingProject.architecture_notes}
                        className="paper-input"
                        style={{ minHeight: '70px' }}
                      />
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                      <label style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                        TAGS (COMMA SEPARATED)
                      </label>
                      <input
                        name="tags"
                        defaultValue={editingProject.tags?.join(', ')}
                        className="paper-input"
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
                          file_name: 'manuscript.pdf',
                          file_size: '1.2 MB',
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
                          className="paper-panel-subtle" 
                          style={{ padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '14px' }}
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
                  <form onSubmit={handleSaveNote} className="paper-panel-subtle" style={{ padding: '20px' }}>
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
                        Stored in Supabase Storage bucket <code>documents</code>
                      </div>
                      <input
                        type="file"
                        onChange={handleFileUpload}
                        style={{ fontSize: '0.8rem' }}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px', marginBottom: '14px' }}>
                      <div>
                        <label style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                          TITLE
                        </label>
                        <input
                          name="title"
                          defaultValue={editingNote.title}
                          className="paper-input"
                          required
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                          FILENAME
                        </label>
                        <input
                          name="file_name"
                          defaultValue={editingNote.file_name}
                          className="paper-input"
                          required
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                          FORMAT
                        </label>
                        <select name="file_type" defaultValue={editingNote.file_type || 'PDF'} className="paper-input">
                          <option value="PDF">PDF</option>
                          <option value="DOCX">DOCX</option>
                          <option value="MARKDOWN">MARKDOWN</option>
                          <option value="CODE">CODE</option>
                          <option value="OTHER">OTHER</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                          FILE SIZE
                        </label>
                        <input
                          name="file_size"
                          defaultValue={editingNote.file_size}
                          className="paper-input"
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                          CATEGORY
                        </label>
                        <input
                          name="category"
                          defaultValue={editingNote.category || 'System Design'}
                          className="paper-input"
                        />
                      </div>
                    </div>

                    <div style={{ marginBottom: '14px' }}>
                      <label style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                        SUMMARY
                      </label>
                      <textarea
                        name="description"
                        defaultValue={editingNote.description}
                        className="paper-input"
                        style={{ minHeight: '65px' }}
                        required
                      />
                    </div>

                    <div style={{ marginBottom: '14px' }}>
                      <label style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                        READER EXTRACT / MARKDOWN PREVIEW
                      </label>
                      <textarea
                        name="preview_content"
                        defaultValue={editingNote.preview_content}
                        className="paper-input"
                        style={{ minHeight: '120px', fontFamily: 'var(--font-mono)', fontSize: '0.825rem' }}
                      />
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                      <label style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                        TAGS (COMMA SEPARATED)
                      </label>
                      <input
                        name="tags"
                        defaultValue={editingNote.tags?.join(', ')}
                        className="paper-input"
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
                        onClick={() => setEditingDoc({
                          title: '',
                          slug: 'new-monograph',
                          category: 'Getting Started',
                          order_index: docs.length + 1,
                          summary: '',
                          content: `# Topic Title\n\nWrite your technical documentation here...\n\n## Section 1\n\n\`\`\`javascript\nconsole.log('Paper & Ink Docs');\n\`\`\``
                        })}
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
                          className="paper-panel-subtle" 
                          style={{ padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '14px' }}
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
                  <form onSubmit={handleSaveDoc} className="paper-panel-subtle" style={{ padding: '20px' }}>
                    <h3 style={{ fontSize: '1.2rem', marginBottom: '16px' }}>
                      {editingDoc.id ? 'Edit Documentation Page' : 'Author Documentation Page'}
                    </h3>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px', marginBottom: '14px' }}>
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
                          SLUG
                        </label>
                        <input
                          name="slug"
                          defaultValue={editingDoc.slug}
                          className="paper-input"
                          required
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                          CATEGORY
                        </label>
                        <input
                          name="category"
                          defaultValue={editingDoc.category || 'System Design'}
                          className="paper-input"
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                          ORDER INDEX
                        </label>
                        <input
                          name="order_index"
                          type="number"
                          defaultValue={editingDoc.order_index || 1}
                          className="paper-input"
                        />
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
