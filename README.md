# Gyani (ज्ञानी)

> *From the Sanskrit root **jñā (ज्ञा)** — "one who possesses knowledge, discernment, and wisdom."*

A minimalist, high-aesthetic personal knowledge archive, open-source project directory, document vault, and technical documentation wiki. Inspired by e-ink tablets (reMarkable, Kindle Paperwhite) and classic typographical manuscripts, Gyani is designed for quiet focus, long-form study, and software curation.

---

## ✨ Features & Highlights

### 📜 Tactile Paper & E-Ink Reader Aesthetic
- **Dual Visual Modes**:
  - **Warm Rag Paper (Light Mode)**: Off-white natural rag paper (`#fbf8f3`), deep carbon ink (`#191816`), warm graphite accents, and ambient page illumination.
  - **E-Ink Slate (Dark Mode)**: Charcoal matte paper sheet (`#151513`), warm newsprint chalk (`#ede9e1`), and muted graphite rules.
- **Authentic Paper Texture**: Procedural SVG cotton pulp grain and directional fibers tiled across the viewport with calibrated blend modes.
- **Editorial Typography**: Styled using `Newsreader` (editorial serif), `Plus Jakarta Sans` (interface sans), and `JetBrains Mono` (code & stamps).
- **Responsive Mobile Layout**: Touch-friendly navigation drawer, fluid typography, bottom-sheet modals, and zero horizontal overflow on small screens.

---

### 🗂️ Core Archive Modules

1. **Frontispiece & Ledger (Index / Overview)**:
   - Live metric counters for cataloged repositories, study manuscripts, and technical documentation.
   - Curated shelves showcasing selected featured software and recent study guides.
2. **Projects Directory (`/projects`)**:
   - Filterable catalog of engineering codebases and systems.
   - Live search by title, stack tags (e.g. Go, Supabase, React), category, or development status.
   - Switchable **Grid Cards** and **Directory Table** views.
   - Modal drawer with deep-dive architectural decisions and direct links to GitHub repositories and live deployments.
3. **Manuscripts & Study Vault (`/notes`)**:
   - Repository for PDF whitepapers, DOCX cheat sheets, and Markdown architecture notes.
   - **In-Browser Document Reader**:
     - Client-side DOCX rendering powered by **Mammoth.js**.
     - Embedded PDF viewer and raw text reader.
   - Single-click direct file downloads with automatic download counters.
4. **Technical Documentation Wiki (`/docs`)**:
   - Three-column editorial wiki layout: sticky sidebar directory, long-form reading pane, and interactive Table of Contents.
   - Styled code blocks with copy-to-clipboard, callout quotes, and real-time reading progress bar.
5. **Global Instant Search (`⌘K` / `Ctrl+K`)**:
   - Unified keyboard-driven search modal querying projects, manuscripts, and documentation in real time.
6. **Keyboard Command Reference (`?`)**:
   - Dedicated keyboard cheat sheet modal for rapid key-driven navigation.

---

### 🔐 Hidden Curator Console (`/#admin`)

The curator console is intentionally hidden from regular visitors with zero public navbar or footer buttons:
- **Access**: Append `/#admin` to your browser URL.
- **Authentication**: Unlock with either a **Master Passkey** (default: `admin123`) or **Supabase Auth**.
- **Capabilities**:
  - Full CRUD management of Projects, Notes/Manuscripts, and Documentation pages.
  - Direct file upload to Supabase Storage with automatic size calculation and DOCX text extraction.
  - Automated JSON backup export of the entire archive.
  - Live Supabase connection status check and one-click SQL schema copying.

---

## ⌨️ Keyboard Shortcuts Reference

| Shortcut | Action |
| :--- | :--- |
| <kbd>⌘K</kbd> / <kbd>Ctrl+K</kbd> | Toggle Global Archive Search across all records |
| <kbd>1</kbd> | Jump to **Index / Overview** |
| <kbd>2</kbd> | Jump to **Projects Catalog** |
| <kbd>3</kbd> | Jump to **Manuscripts & Study Vault** |
| <kbd>4</kbd> | Jump to **Technical Documentation** |
| <kbd>T</kbd> | Toggle between **Warm Paper** and **E-Ink Slate** modes |
| <kbd>?</kbd> | Open the Keyboard Shortcuts Reference dialog |
| <kbd>Esc</kbd> | Dismiss any active reader, modal, search, or admin console |

*(Note: Keystroke navigation is active when not typing inside form input fields).*

---

## 🛠️ Tech Stack & Architecture

- **Frontend**: [React 19](https://react.dev/) + [Vite 8](https://vitejs.dev/)
- **Styling**: Vanilla CSS Design System with CSS Custom Properties, tactile ink shadows, and paper grain overlays (Zero heavy UI dependencies)
- **Database & Storage**: [Supabase](https://supabase.com/) (PostgreSQL database, Row Level Security, and S3-compatible file storage)
- **Document Parsing**: [Mammoth.js](https://github.com/mwilliamson/mammoth.js) (DOCX to HTML conversion in the browser)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Code Optimization**: Vite manual chunking isolating React, Supabase, Lucide icons, and Mammoth into distinct bundles for fast initial page load (<120 kB initial bundle).

---

## 🚀 Quickstart & Local Setup

### Prerequisites
- [Node.js](https://nodejs.org/) (v18.0.0 or higher recommended)
- `npm` or `pnpm`

### Installation

1. **Clone the repository**:
   ```bash
   git clone <your-repo-url>
   cd docx
   ```

2. **Install dependencies**:
   ```bash
   npm install --prefix client
   ```

3. **Configure Environment Variables**:
   Copy the example environment file inside `client/`:
   ```bash
   cp client/.env.example client/.env
   ```
   Add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-public-key
   ```
   *(Note: If you run without Supabase credentials, Gyani automatically falls back to an offline local sandbox using LocalStorage).*

4. **Start the local development server**:
   ```bash
   npm run dev
   ```
   The site will be live at `http://localhost:5173/`.

5. **Build for production**:
   ```bash
   npm run build
   ```
   Production artifacts will be generated in `client/dist/`.

---

## 🗄️ Supabase Database Schema

To initialize your Supabase backend, open your Supabase Dashboard -> **SQL Editor** and run the following script:

```sql
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

-- 8. Allow Public Read & Insert Access
CREATE POLICY "Allow Projects Access" ON public.projects FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow Notes Access" ON public.notes FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow Documentation Access" ON public.documentation FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 9. Storage Object Policies
CREATE POLICY "Public Storage Read" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'documents');
CREATE POLICY "Public Storage Insert" ON storage.objects FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'documents');
CREATE POLICY "Public Storage Update" ON storage.objects FOR UPDATE TO anon, authenticated USING (bucket_id = 'documents');
CREATE POLICY "Public Storage Delete" ON storage.objects FOR DELETE TO anon, authenticated USING (bucket_id = 'documents');
```

---

## 🌐 Production Deployment

Gyani is fully optimized for single-page application (SPA) deployment on modern static hosting platforms:

### Vercel / Netlify
- **Root Directory**: `client`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **SPA Routing**: The project includes `client/public/_redirects` (`/* /index.html 200`) to guarantee that browser refreshes and hash routes work without 404 errors.

### Cloudflare Pages
- **Framework Preset**: Vite
- **Root Directory**: `client`
- **Build Output Directory**: `dist`

---

## 📄 Colophon & License

Typeset with care for researchers, open-source engineers, and lifelong students. 

Distributed under the [ISC License](LICENSE).
# docx
