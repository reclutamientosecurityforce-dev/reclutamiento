-- ═══════════════════════════════════════════════════════════════════════════════
-- MIGRACIÓN FASE 2.5: CENTRO DE CAPTACIÓN EMPRESARIAL Y TRAZABILIDAD
-- Security Force P&V S.A.C.
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1. TIPOS ENUMERADOS
DO $$ BEGIN
  CREATE TYPE publication_status AS ENUM ('draft', 'published', 'paused', 'closed', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE channel_type AS ENUM ('facebook', 'instagram', 'whatsapp', 'qr', 'web', 'referral', 'campaign', 'other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. CATEGORÍAS (MULTI-TENANT CON PLANTILLA DE REQUISITOS SUGERIDOS)
CREATE TABLE IF NOT EXISTS job_categories (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id            UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name                  VARCHAR(100) NOT NULL,
  slug                  VARCHAR(100) NOT NULL,
  icon                  VARCHAR(50) DEFAULT 'Shield',
  color_hex             VARCHAR(20) DEFAULT '#2563eb',
  description           TEXT,
  template_requirements JSONB NOT NULL DEFAULT '[]',
  is_active             BOOLEAN NOT NULL DEFAULT TRUE,
  order_index           INTEGER NOT NULL DEFAULT 0,
  created_by            UUID REFERENCES users(id),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(company_id, slug)
);

-- 3. CAMPAÑAS DE RECLUTAMIENTO
CREATE TABLE IF NOT EXISTS recruitment_campaigns (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id         UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name               VARCHAR(255) NOT NULL,
  description        TEXT,
  utm_campaign       VARCHAR(100),
  status             VARCHAR(20) NOT NULL DEFAULT 'active',
  starts_at          TIMESTAMPTZ,
  ends_at            TIMESTAMPTZ,
  budget_notes       TEXT,
  total_views        INTEGER NOT NULL DEFAULT 0,
  total_applications INTEGER NOT NULL DEFAULT 0,
  total_apt          INTEGER NOT NULL DEFAULT 0,
  total_hired        INTEGER NOT NULL DEFAULT 0,
  created_by         UUID REFERENCES users(id),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. CANALES DE CAPTACIÓN
CREATE TABLE IF NOT EXISTS recruitment_channels (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id   UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  campaign_id  UUID REFERENCES recruitment_campaigns(id) ON DELETE SET NULL,
  name         VARCHAR(100) NOT NULL,
  type         VARCHAR(50) NOT NULL DEFAULT 'other',
  utm_source   VARCHAR(100),
  utm_medium   VARCHAR(100),
  utm_campaign VARCHAR(100),
  description  TEXT,
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  created_by   UUID REFERENCES users(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(company_id, name)
);

-- 5. ALTERACIÓN DE JOB_OPENINGS (CATEGORÍA ASOCIADA)
ALTER TABLE job_openings 
  ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES job_categories(id) ON DELETE SET NULL;

-- 6. PUBLICACIONES DE CONVOCATORIA (1 A MUCHAS POR CONVOCATORIA)
CREATE TABLE IF NOT EXISTS job_publications (
  id                             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id                     UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  job_opening_id                 UUID NOT NULL REFERENCES job_openings(id) ON DELETE CASCADE,
  campaign_id                    UUID REFERENCES recruitment_campaigns(id) ON DELETE SET NULL,
  channel_id                     UUID REFERENCES recruitment_channels(id) ON DELETE SET NULL,
  slug                           VARCHAR(30) NOT NULL UNIQUE,
  title                          VARCHAR(255) NOT NULL,
  description                    TEXT,
  banner_url                     TEXT,
  benefits                       JSONB NOT NULL DEFAULT '[]',
  requirement_version_at_publish INTEGER,
  status                         publication_status NOT NULL DEFAULT 'draft',
  published_at                   TIMESTAMPTZ,
  paused_at                      TIMESTAMPTZ,
  closed_at                      TIMESTAMPTZ,
  archived_at                    TIMESTAMPTZ,
  closes_at                      TIMESTAMPTZ,
  og_title                       VARCHAR(255),
  og_description                 VARCHAR(500),
  og_image_url                   TEXT,
  views_total                    INTEGER NOT NULL DEFAULT 0,
  views_unique_estimated        INTEGER NOT NULL DEFAULT 0,
  views_bot                      INTEGER NOT NULL DEFAULT 0,
  applications_started           INTEGER NOT NULL DEFAULT 0,
  applications_completed         INTEGER NOT NULL DEFAULT 0,
  created_by                     UUID REFERENCES users(id),
  created_at                     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. EVENTOS DE VISUALIZACIÓN GRANULARES (VISTAS DE PUBLICACIONES)
CREATE TABLE IF NOT EXISTS publication_views (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  publication_id  UUID NOT NULL REFERENCES job_publications(id) ON DELETE CASCADE,
  company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  channel_id      UUID REFERENCES recruitment_channels(id) ON DELETE SET NULL,
  campaign_id     UUID REFERENCES recruitment_campaigns(id) ON DELETE SET NULL,
  utm_source      VARCHAR(100),
  utm_medium      VARCHAR(100),
  utm_campaign    VARCHAR(100),
  ip_hash         VARCHAR(64),
  user_agent_type VARCHAR(20) NOT NULL DEFAULT 'unknown',
  is_bot          BOOLEAN NOT NULL DEFAULT FALSE,
  viewed_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. ALTERACIÓN DE APPLICATIONS (TRAZABILIDAD DE CAPTACIÓN)
ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS publication_id UUID REFERENCES job_publications(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS channel_id     UUID REFERENCES recruitment_channels(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS campaign_id    UUID REFERENCES recruitment_campaigns(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS utm_source     VARCHAR(100),
  ADD COLUMN IF NOT EXISTS utm_medium     VARCHAR(100),
  ADD COLUMN IF NOT EXISTS utm_campaign   VARCHAR(100);

-- 9. SNAPSHOTS HISTÓRICOS INMUTABLES DE PUBLICACIÓN AL POSTULAR
CREATE TABLE IF NOT EXISTS application_publication_snapshots (
  id                       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id           UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  company_id               UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  publication_id           UUID REFERENCES job_publications(id) ON DELETE SET NULL,
  job_opening_id           UUID NOT NULL REFERENCES job_openings(id),
  requirement_version      INTEGER NOT NULL,
  publication_title        TEXT,
  publication_description  TEXT,
  requirements_shown       JSONB NOT NULL DEFAULT '[]',
  benefits_shown           JSONB NOT NULL DEFAULT '[]',
  channel_id               UUID REFERENCES recruitment_channels(id) ON DELETE SET NULL,
  campaign_id              UUID REFERENCES recruitment_campaigns(id) ON DELETE SET NULL,
  utm_source               VARCHAR(100),
  utm_medium               VARCHAR(100),
  utm_campaign             VARCHAR(100),
  captured_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. ÍNDICES DE ALTO RENDIMIENTO
CREATE INDEX IF NOT EXISTS idx_categories_company_active  ON job_categories(company_id, is_active);
CREATE INDEX IF NOT EXISTS idx_campaigns_company_status    ON recruitment_campaigns(company_id, status);
CREATE INDEX IF NOT EXISTS idx_channels_company_campaign   ON recruitment_channels(company_id, campaign_id);
CREATE INDEX IF NOT EXISTS idx_channels_company_type       ON recruitment_channels(company_id, type);
CREATE INDEX IF NOT EXISTS idx_publications_slug           ON job_publications(slug);
CREATE INDEX IF NOT EXISTS idx_publications_opening_status ON job_publications(job_opening_id, status);
CREATE INDEX IF NOT EXISTS idx_publications_company_status ON job_publications(company_id, status);
CREATE INDEX IF NOT EXISTS idx_publications_campaign       ON job_publications(campaign_id, status);
CREATE INDEX IF NOT EXISTS idx_pub_views_pub_date          ON publication_views(publication_id, viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_pub_views_channel_date      ON publication_views(channel_id, viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_pub_views_ip_hash           ON publication_views(publication_id, ip_hash, is_bot);
CREATE INDEX IF NOT EXISTS idx_app_snapshots_application   ON application_publication_snapshots(application_id);
CREATE INDEX IF NOT EXISTS idx_app_snapshots_publication   ON application_publication_snapshots(publication_id);
CREATE INDEX IF NOT EXISTS idx_applications_publication    ON applications(publication_id, prefilter_status);
CREATE INDEX IF NOT EXISTS idx_applications_channel        ON applications(channel_id, current_stage);
CREATE INDEX IF NOT EXISTS idx_applications_campaign       ON applications(campaign_id, prefilter_status);
CREATE INDEX IF NOT EXISTS idx_openings_category           ON job_openings(company_id, category_id);
