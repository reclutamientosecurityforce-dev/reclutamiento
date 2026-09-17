-- ═══════════════════════════════════════════════════════════════════════════════
-- FASE 2.8: CMS INSTITUCIONAL DEL PORTAL PÚBLICO
-- Security Force P&V S.A.C.
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1. TABLA PRINCIPAL DE SECCIONES (DRAFT Y PUBLISHED)
CREATE TABLE IF NOT EXISTS portal_sections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  section_key VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
  version INTEGER NOT NULL DEFAULT 1,
  
  title VARCHAR(255),
  subtitle VARCHAR(255),
  description TEXT,
  content_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  media_urls JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  published_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at TIMESTAMPTZ,
  
  UNIQUE(company_id, section_key, status)
);

-- 2. TABLA DE HISTORIAL Y VERSIONADO DE PUBLICACIONES
CREATE TABLE IF NOT EXISTS portal_section_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  section_key VARCHAR(50) NOT NULL,
  version INTEGER NOT NULL,
  
  title VARCHAR(255),
  subtitle VARCHAR(255),
  description TEXT,
  content_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  media_urls JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  published_by UUID REFERENCES users(id),
  published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  restored_at TIMESTAMPTZ
);

-- 3. TABLA DE MULTIMEDIA PÚBLICA (PUBLIC MEDIA ASSETS)
CREATE TABLE IF NOT EXISTS portal_media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  file_size INTEGER NOT NULL,
  storage_provider VARCHAR(50) NOT NULL DEFAULT 'local',
  storage_key TEXT NOT NULL,
  public_url TEXT NOT NULL,
  file_hash VARCHAR(64),
  alt_text VARCHAR(255),
  section_key VARCHAR(50),
  uploaded_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. ÍNDICES DE RENDIMIENTO Y BÚSQUEDA
CREATE INDEX IF NOT EXISTS idx_portal_sections_lookup ON portal_sections(company_id, section_key, status);
CREATE INDEX IF NOT EXISTS idx_portal_history_lookup ON portal_section_history(company_id, section_key, version DESC);
CREATE INDEX IF NOT EXISTS idx_portal_media_company ON portal_media(company_id, created_at DESC);
