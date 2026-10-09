import { createClient } from '@supabase/supabase-js';

// Default Supabase config from Vite env vars or local storage override
const getEnvConfig = () => {
  const localUrl = localStorage.getItem('custom_supabase_url');
  const localKey = localStorage.getItem('custom_supabase_key');

  const supabaseUrl = localUrl || import.meta.env.VITE_SUPABASE_URL || '';
  const supabaseAnonKey = localKey || import.meta.env.VITE_SUPABASE_ANON_KEY || '';

  return { supabaseUrl, supabaseAnonKey };
};

let { supabaseUrl, supabaseAnonKey } = getEnvConfig();

export const isSupabaseConfigured = () => {
  const { supabaseUrl, supabaseAnonKey } = getEnvConfig();
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    !supabaseUrl.includes('your-project-id') &&
    !supabaseAnonKey.includes('your-anon-public-key')
  );
};

export const getSupabaseClient = () => {
  const { supabaseUrl, supabaseAnonKey } = getEnvConfig();
  if (supabaseUrl && supabaseAnonKey) {
    try {
      return createClient(supabaseUrl, supabaseAnonKey);
    } catch (err) {
      console.warn('Failed to initialize Supabase client:', err);
      return null;
    }
  }
  return null;
};

export let supabase = getSupabaseClient();

export const updateSupabaseCredentials = (url, key) => {
  if (url && key) {
    localStorage.setItem('custom_supabase_url', url.trim());
    localStorage.setItem('custom_supabase_key', key.trim());
  } else {
    localStorage.removeItem('custom_supabase_url');
    localStorage.removeItem('custom_supabase_key');
  }
  supabase = getSupabaseClient();
};

export const clearSupabaseCredentials = () => {
  localStorage.removeItem('custom_supabase_url');
  localStorage.removeItem('custom_supabase_key');
  supabase = getSupabaseClient();
};

// ==========================================
// PRE-POPULATED INITIAL MOCK DATA
// ==========================================
// INITIAL DATA ARRAYS (EMPTY - READY FOR REAL DATA)
// ==========================================
export const INITIAL_PROJECTS = [];
export const INITIAL_NOTES = [];
export const INITIAL_DOCS = [];

// Helper to get local storage items or fallback
const getLocalData = (key, fallback) => {
  try {
    // Clear old aethervault key if present
    localStorage.removeItem(`aethervault_${key}`);
    const saved = localStorage.getItem(`gyani_${key}`);
    if (saved) {
      const parsed = JSON.parse(saved);
      // If cached data contains old demo IDs, discard it
      if (Array.isArray(parsed) && parsed.some(item => item.id?.startsWith('proj-') || item.id?.startsWith('note-') || item.id?.startsWith('doc-'))) {
        localStorage.removeItem(`gyani_${key}`);
        return fallback;
      }
      return parsed;
    }
  } catch (err) {
    console.error(`Error parsing ${key} from localStorage:`, err);
  }
  return fallback;
};

const saveLocalData = (key, data) => {
  try {
    localStorage.setItem(`gyani_${key}`, JSON.stringify(data));
  } catch (err) {
    console.error(`Error saving ${key} to localStorage:`, err);
  }
};

// ==========================================
// DATA API (SUPABASE + LOCAL CACHE)
// ==========================================

export const api = {
  // PROJECTS
  async getProjects() {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .order('created_at', { ascending: false });
        if (!error && data) {
          saveLocalData('projects', data);
          return data;
        }
        if (error) console.warn('Supabase fetch projects error:', error.message);
      } catch (e) {
        console.warn('Supabase fetch projects exception:', e);
      }
    }
    return getLocalData('projects', INITIAL_PROJECTS);
  },

  async saveProject(project) {
    let result = null;
    if (isSupabaseConfigured() && supabase) {
      try {
        if (project.id && !project.id.startsWith('temp-') && !project.id.startsWith('proj-')) {
          const { data, error } = await supabase
            .from('projects')
            .update({
              title: project.title,
              description: project.description,
              category: project.category,
              status: project.status,
              progress: project.progress,
              repo_url: project.repo_url,
              demo_url: project.demo_url,
              architecture_notes: project.architecture_notes,
              tags: project.tags || [],
              updated_at: new Date().toISOString()
            })
            .eq('id', project.id)
            .select();
          if (error) throw error;
          if (data && data[0]) result = data[0];
        } else {
          // create new
          const toInsert = { ...project };
          if (toInsert.id?.startsWith('temp-') || toInsert.id?.startsWith('proj-')) {
            delete toInsert.id;
          }
          const { data, error } = await supabase
            .from('projects')
            .insert([{
              title: toInsert.title,
              description: toInsert.description,
              category: toInsert.category || 'Full-Stack',
              status: toInsert.status || 'Completed',
              progress: toInsert.progress || 100,
              repo_url: toInsert.repo_url || '',
              demo_url: toInsert.demo_url || '',
              architecture_notes: toInsert.architecture_notes || '',
              tags: toInsert.tags || []
            }])
            .select();
          if (error) throw error;
          if (data && data[0]) result = data[0];
        }
      } catch (e) {
        console.error('Supabase save project error:', e);
        throw e;
      }
    }

    // Local cache update
    const current = getLocalData('projects', INITIAL_PROJECTS);
    const savedItem = result || (project.id ? project : { ...project, id: `proj-${Date.now()}`, created_at: new Date().toISOString() });
    const exists = current.some(p => p.id === savedItem.id);
    const updated = exists ? current.map(p => p.id === savedItem.id ? savedItem : p) : [savedItem, ...current];
    saveLocalData('projects', updated);
    return savedItem;
  },

  async deleteProject(id) {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { error } = await supabase.from('projects').delete().eq('id', id);
        if (error) throw error;
      } catch (e) {
        console.error('Supabase delete error:', e);
        throw e;
      }
    }
    const current = getLocalData('projects', INITIAL_PROJECTS);
    const updated = current.filter(p => p.id !== id);
    saveLocalData('projects', updated);
    return true;
  },

  // NOTES / DOCS
  async getNotes() {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('notes')
          .select('*')
          .order('created_at', { ascending: false });
        if (!error && data) {
          saveLocalData('notes', data);
          return data;
        }
        if (error) console.warn('Supabase fetch notes error:', error.message);
      } catch (e) {
        console.warn('Supabase fetch notes exception:', e);
      }
    }
    return getLocalData('notes', INITIAL_NOTES);
  },

  async saveNote(note) {
    let result = null;
    if (isSupabaseConfigured() && supabase) {
      try {
        if (note.id && !note.id.startsWith('note-')) {
          const { data, error } = await supabase
            .from('notes')
            .update({
              title: note.title,
              description: note.description,
              file_name: note.file_name,
              file_url: note.file_url,
              file_size: note.file_size,
              file_type: note.file_type || 'PDF',
              category: note.category || 'General',
              tags: note.tags || [],
              preview_content: note.preview_content || '',
              updated_at: new Date().toISOString()
            })
            .eq('id', note.id)
            .select();
          if (error) throw error;
          if (data && data[0]) result = data[0];
        } else {
          const toInsert = { ...note };
          if (toInsert.id?.startsWith('note-')) delete toInsert.id;
          const { data, error } = await supabase
            .from('notes')
            .insert([{
              title: toInsert.title,
              description: toInsert.description,
              file_name: toInsert.file_name,
              file_url: toInsert.file_url,
              file_size: toInsert.file_size || '1.0 MB',
              file_type: toInsert.file_type || 'PDF',
              category: toInsert.category || 'General',
              tags: toInsert.tags || [],
              preview_content: toInsert.preview_content || '',
              downloads_count: 0
            }])
            .select();
          if (error) throw error;
          if (data && data[0]) result = data[0];
        }
      } catch (e) {
        console.error('Supabase save note error:', e);
        throw e;
      }
    }

    const current = getLocalData('notes', INITIAL_NOTES);
    const savedItem = result || (note.id ? note : { ...note, id: `note-${Date.now()}`, created_at: new Date().toISOString(), downloads_count: 0 });
    const exists = current.some(n => n.id === savedItem.id);
    const updated = exists ? current.map(n => n.id === savedItem.id ? savedItem : n) : [savedItem, ...current];
    saveLocalData('notes', updated);
    return savedItem;
  },

  async deleteNote(id) {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { error } = await supabase.from('notes').delete().eq('id', id);
        if (error) throw error;
      } catch (e) {
        console.error('Supabase delete note error:', e);
        throw e;
      }
    }
    const current = getLocalData('notes', INITIAL_NOTES);
    const updated = current.filter(n => n.id !== id);
    saveLocalData('notes', updated);
    return true;
  },

  async incrementNoteDownloads(id) {
    const current = getLocalData('notes', INITIAL_NOTES);
    const updated = current.map(n => n.id === id ? { ...n, downloads_count: (n.downloads_count || 0) + 1 } : n);
    saveLocalData('notes', updated);
    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.rpc('increment_downloads', { note_id: id });
      } catch (e) {
        // quiet ignore
      }
    }
  },

  // WEB DOCUMENTATION
  async getDocs() {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('documentation')
          .select('*')
          .order('order_index', { ascending: true });
        if (!error && data) {
          saveLocalData('documentation', data);
          return data;
        }
        if (error) console.warn('Supabase fetch docs error:', error.message);
      } catch (e) {
        console.warn('Supabase fetch docs exception:', e);
      }
    }
    return getLocalData('documentation', INITIAL_DOCS);
  },

  async saveDoc(doc) {
    let result = null;
    if (isSupabaseConfigured() && supabase) {
      try {
        if (doc.id && !doc.id.startsWith('doc-')) {
          const { data, error } = await supabase
            .from('documentation')
            .update({
              slug: doc.slug,
              title: doc.title,
              category: doc.category || 'General',
              order_index: doc.order_index || 0,
              summary: doc.summary,
              content: doc.content,
              updated_at: new Date().toISOString()
            })
            .eq('id', doc.id)
            .select();
          if (error) throw error;
          if (data && data[0]) result = data[0];
        } else {
          const toInsert = { ...doc };
          if (toInsert.id?.startsWith('doc-')) delete toInsert.id;
          const { data, error } = await supabase
            .from('documentation')
            .insert([{
              slug: toInsert.slug || `doc-${Date.now()}`,
              title: toInsert.title,
              category: toInsert.category || 'General',
              order_index: toInsert.order_index || 0,
              summary: toInsert.summary || '',
              content: toInsert.content || ''
            }])
            .select();
          if (error) throw error;
          if (data && data[0]) result = data[0];
        }
      } catch (e) {
        console.error('Supabase save doc error:', e);
        throw e;
      }
    }

    const current = getLocalData('documentation', INITIAL_DOCS);
    const savedItem = result || (doc.id ? doc : { ...doc, id: `doc-${Date.now()}`, created_at: new Date().toISOString() });
    const exists = current.some(d => d.id === savedItem.id);
    const updated = exists ? current.map(d => d.id === savedItem.id ? savedItem : d) : [...current, savedItem];
    saveLocalData('documentation', updated);
    return savedItem;
  },

  async deleteDoc(id) {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { error } = await supabase.from('documentation').delete().eq('id', id);
        if (error) throw error;
      } catch (e) {
        console.error('Supabase delete doc error:', e);
        throw e;
      }
    }
    const current = getLocalData('documentation', INITIAL_DOCS);
    const updated = current.filter(d => d.id !== id);
    saveLocalData('documentation', updated);
    return true;
  },

  // STORAGE UPLOAD (Supabase bucket or local base64)
  async uploadFile(file) {
    let previewContent = '';
    if (file.name.endsWith('.md') || file.name.endsWith('.txt')) {
      try {
        previewContent = await file.text();
      } catch (_) {}
    } else if (file.name.endsWith('.docx')) {
      try {
        const mammothModule = await import('mammoth');
        const mammoth = mammothModule.default || mammothModule;
        const arrayBuffer = await file.arrayBuffer();
        const res = await mammoth.convertToHtml({ arrayBuffer });
        previewContent = res.value || '';
      } catch (err) {
        console.warn('Docx extraction warning:', err);
      }
    }

    if (isSupabaseConfigured() && supabase) {
      try {
        const fileExt = file.name.split('.').pop();
        const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const fileName = `${Date.now()}-${safeName}`;
        const filePath = `uploads/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(filePath, file, {
            contentType: file.type || 'application/octet-stream',
            upsert: true
          });

        if (uploadError) {
          console.error('Supabase storage upload error:', uploadError);
          throw uploadError;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('documents')
          .getPublicUrl(filePath);

        return {
          url: publicUrl,
          name: file.name,
          size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
          content: previewContent
        };
      } catch (e) {
        console.error('Supabase storage upload error:', e);
        throw e;
      }
    }

    // Fallback: Read as Data URL or text
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve({
          url: reader.result,
          name: file.name,
          size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
          content: previewContent || (typeof reader.result === 'string' ? reader.result : '')
        });
      };
      if (file.name.endsWith('.md') || file.name.endsWith('.txt')) {
        reader.readAsText(file);
      } else {
        reader.readAsDataURL(file);
      }
    });
  }
};

// ==========================================
// SUPABASE SETUP SQL SCHEMA SCRIPT
// ==========================================
export const SUPABASE_SCHEMA_SQL = `-- ========================================================
-- Gyani (ज्ञानी) / Personal Knowledge & Projects Schema
-- Execute this script in your Supabase Project -> SQL Editor
-- ========================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Projects Table
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  repo_url TEXT,
  demo_url TEXT,
  category TEXT DEFAULT 'Full-Stack',
  status TEXT DEFAULT 'Completed',
  progress INTEGER DEFAULT 100,
  tags TEXT[] DEFAULT '{}',
  architecture_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Notes / Uploaded Documents Table
CREATE TABLE IF NOT EXISTS public.notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  file_name TEXT NOT NULL,
  file_url TEXT,
  file_size TEXT,
  file_type TEXT DEFAULT 'PDF',
  category TEXT DEFAULT 'General',
  tags TEXT[] DEFAULT '{}',
  preview_content TEXT,
  downloads_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Web Documentation Table
CREATE TABLE IF NOT EXISTS public.documentation (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  category TEXT DEFAULT 'General',
  order_index INTEGER DEFAULT 0,
  summary TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Helper Function for atomic downloads increment
CREATE OR REPLACE FUNCTION increment_downloads(note_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.notes
  SET downloads_count = downloads_count + 1
  WHERE id = note_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Setup Supabase Storage Bucket 'documents'
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 7. Enable Row Level Security (RLS)
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documentation ENABLE ROW LEVEL SECURITY;

-- 8. Clean up existing policies if any
DROP POLICY IF EXISTS "Public Read Projects" ON public.projects;
DROP POLICY IF EXISTS "Public Write Projects" ON public.projects;
DROP POLICY IF EXISTS "Allow Projects Access" ON public.projects;
DROP POLICY IF EXISTS "Public Read Notes" ON public.notes;
DROP POLICY IF EXISTS "Public Write Notes" ON public.notes;
DROP POLICY IF EXISTS "Allow Notes Access" ON public.notes;
DROP POLICY IF EXISTS "Public Read Documentation" ON public.documentation;
DROP POLICY IF EXISTS "Public Write Documentation" ON public.documentation;
DROP POLICY IF EXISTS "Allow Documentation Access" ON public.documentation;

DROP POLICY IF EXISTS "Public Storage Read" ON storage.objects;
DROP POLICY IF EXISTS "Public Storage Insert" ON storage.objects;
DROP POLICY IF EXISTS "Public Storage Update" ON storage.objects;
DROP POLICY IF EXISTS "Public Storage Delete" ON storage.objects;

-- 9. Create Permissive Policies for Anon & Authenticated
CREATE POLICY "Allow Projects Access"
  ON public.projects FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow Notes Access"
  ON public.notes FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow Documentation Access"
  ON public.documentation FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public Storage Read"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'documents');

CREATE POLICY "Public Storage Insert"
  ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'documents');

CREATE POLICY "Public Storage Update"
  ON storage.objects FOR UPDATE
  TO anon, authenticated
  USING (bucket_id = 'documents');

CREATE POLICY "Public Storage Delete"
  ON storage.objects FOR DELETE
  TO anon, authenticated
  USING (bucket_id = 'documents');
`;
