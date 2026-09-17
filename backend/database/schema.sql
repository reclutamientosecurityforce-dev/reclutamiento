-- ═══════════════════════════════════════════════════════════════════════════════
-- SCHEMA POSTGRESQL — Sistema de Reclutamiento y Selección de Personal
-- Security Force P&V S.A.C.
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── TIPOS ENUMERADOS ──────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'recruiter', 'evaluator');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE opening_status AS ENUM ('open', 'in_progress', 'filled', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE candidate_status AS ENUM (
    'registered',
    'phone_screening',
    'psychological_eval',
    'background_check',
    'interview',
    'medical_exam',
    'approved',
    'rejected',
    'hired'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE sucamec_status AS ENUM ('valid', 'in_process', 'none', 'expired');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE stage_result AS ENUM ('pending', 'passed', 'failed', 'conditional');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE publication_status AS ENUM ('draft', 'published', 'paused', 'closed', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE channel_type AS ENUM ('facebook', 'instagram', 'whatsapp', 'qr', 'web', 'referral', 'campaign', 'other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── 1. EMPRESAS (MULTI-TENANT) ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS companies (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        VARCHAR(255) NOT NULL,
  ruc         VARCHAR(20)  UNIQUE,
  address     TEXT,
  phone       VARCHAR(50),
  email       VARCHAR(255),
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 2. USUARIOS / RECLUTADORES ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id    UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  username      VARCHAR(100) NOT NULL,
  email         VARCHAR(255) NOT NULL,
  password_hash TEXT NOT NULL,
  role          user_role NOT NULL DEFAULT 'recruiter',
  full_name     VARCHAR(255),
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  last_login_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(company_id, username),
  UNIQUE(company_id, email)
);

-- ─── 3. SESIONES ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sessions (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_id   UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  token_hash   TEXT NOT NULL UNIQUE,
  ip_address   INET,
  user_agent   TEXT,
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  expires_at   TIMESTAMPTZ NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 4. CATEGORÍAS (CENTRO DE CAPTACIÓN) ──────────────────────────────────────
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

-- ─── 5. CAMPAÑAS DE RECLUTAMIENTO ─────────────────────────────────────────────
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

-- ─── 6. CANALES DE CAPTACIÓN ──────────────────────────────────────────────────
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

-- ─── 7. CONVOCATORIAS / VACANTES (JOB OPENINGS) ───────────────────────────────
CREATE TABLE IF NOT EXISTS job_openings (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id       UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  category_id      UUID REFERENCES job_categories(id) ON DELETE SET NULL,
  title            VARCHAR(255) NOT NULL,
  position_type    VARCHAR(100) NOT NULL,
  location         VARCHAR(255) NOT NULL,
  client_name      VARCHAR(255),
  vacancies_count  INTEGER NOT NULL DEFAULT 1 CHECK (vacancies_count > 0),
  filled_count     INTEGER NOT NULL DEFAULT 0 CHECK (filled_count >= 0),
  salary_offered   DECIMAL(10,2),
  shift_type       VARCHAR(100) DEFAULT '12x12 Rotativo',
  status           opening_status NOT NULL DEFAULT 'open',
  requirements     JSONB DEFAULT '{}',
  description      TEXT,
  created_by       UUID REFERENCES users(id),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 8. PUBLICACIONES DE CAPTACIÓN (JOB PUBLICATIONS) ─────────────────────────
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

-- ─── 9. POSTULANTES / CANDIDATOS ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS candidates (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id          UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  document_type       VARCHAR(20) NOT NULL DEFAULT 'DNI',
  document_number     VARCHAR(30) NOT NULL,
  first_name          VARCHAR(100) NOT NULL,
  last_name           VARCHAR(100) NOT NULL,
  email               VARCHAR(255),
  phone               VARCHAR(50) NOT NULL,
  address             TEXT,
  district            VARCHAR(100),
  city                VARCHAR(100) DEFAULT 'Lima',
  birth_date          DATE,
  gender              VARCHAR(20),
  height_cm           INTEGER,
  weight_kg           DECIMAL(5,2),
  
  sucamec_status      sucamec_status NOT NULL DEFAULT 'none',
  sucamec_code        VARCHAR(50),
  sucamec_expires_at  DATE,
  gun_license         BOOLEAN DEFAULT FALSE,
  gun_license_type    VARCHAR(50),
  driver_license      BOOLEAN DEFAULT FALSE,
  driver_license_type VARCHAR(20),
  military_service    BOOLEAN DEFAULT FALSE,
  security_experience_years INTEGER DEFAULT 0,
  
  notes               TEXT,
  structured_profile  JSONB DEFAULT '{"experiences": [], "education": [], "courses": [], "skills": []}',
  created_by          UUID REFERENCES users(id),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(company_id, document_number)
);

-- ─── 10. POSTULACIONES (APPLICATIONS) ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS applications (
  id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id                  UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  candidate_id                UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  job_opening_id              UUID NOT NULL REFERENCES job_openings(id) ON DELETE CASCADE,
  publication_id              UUID REFERENCES job_publications(id) ON DELETE SET NULL,
  channel_id                  UUID REFERENCES recruitment_channels(id) ON DELETE SET NULL,
  campaign_id                 UUID REFERENCES recruitment_campaigns(id) ON DELETE SET NULL,
  utm_source                  VARCHAR(100),
  utm_medium                  VARCHAR(100),
  utm_campaign                VARCHAR(100),
  application_code            VARCHAR(30) UNIQUE,
  draft_token                 VARCHAR(64) UNIQUE,
  application_status          VARCHAR(50) NOT NULL DEFAULT 'draft',
  progress_percentage         INTEGER NOT NULL DEFAULT 0,
  compatibility_score         DECIMAL(5,2),
  prefilter_status            VARCHAR(50) NOT NULL DEFAULT 'pending',
  prefilter_score             DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  prefilter_breakdown         JSONB DEFAULT '{}',
  total_accredited_exp_months INTEGER NOT NULL DEFAULT 0,
  total_declared_exp_months   INTEGER NOT NULL DEFAULT 0,
  discrepancies_count         INTEGER NOT NULL DEFAULT 0,
  evaluation_snapshot         JSONB DEFAULT '{}',
  evaluated_at                TIMESTAMPTZ,
  current_stage               candidate_status NOT NULL DEFAULT 'registered',
  stage_score                 DECIMAL(5,2),
  assigned_recruiter          UUID REFERENCES users(id),
  rejection_reason            TEXT,
  hired_at                    TIMESTAMPTZ,
  hired_notes                 TEXT,
  submitted_at                TIMESTAMPTZ,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(company_id, candidate_id, job_opening_id)
);

-- ─── 11. REQUISITOS CONFIGURABLES POR CONVOCATORIA ────────────────────────────
CREATE TABLE IF NOT EXISTS opening_requirements (
  id                     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id             UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  job_opening_id         UUID NOT NULL REFERENCES job_openings(id) ON DELETE CASCADE,
  version                INTEGER NOT NULL DEFAULT 1,
  code                   VARCHAR(50) NOT NULL,
  title                  VARCHAR(255) NOT NULL,
  description            TEXT,
  requirement_type       VARCHAR(50) NOT NULL DEFAULT 'eliminatory',
  rule_type              VARCHAR(50) NOT NULL DEFAULT 'exists',
  rule_config            JSONB NOT NULL DEFAULT '{}',
  weight_score           DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  required_document_type VARCHAR(50),
  order_index            INTEGER NOT NULL DEFAULT 0,
  is_active              BOOLEAN NOT NULL DEFAULT TRUE,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 12. DOCUMENTOS Y EVIDENCIAS DE POSTULACIÓN ──────────────────────────────
CREATE TABLE IF NOT EXISTS application_documents (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id     UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  document_type  VARCHAR(50) NOT NULL,
  file_name      TEXT NOT NULL,
  file_path      TEXT NOT NULL,
  mime_type      VARCHAR(100),
  file_size      INTEGER,
  status         VARCHAR(50) NOT NULL DEFAULT 'uploaded',
  extracted_data JSONB DEFAULT '{}',
  uploaded_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 13. EVALUACIONES DEL MOTOR POR REQUISITO ─────────────────────────────────
CREATE TABLE IF NOT EXISTS application_evaluations (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id           UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  application_id       UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  requirement_id       UUID NOT NULL REFERENCES opening_requirements(id) ON DELETE CASCADE,
  result               VARCHAR(20) NOT NULL DEFAULT 'pending',
  score_earned         DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  max_score            DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  source_type          VARCHAR(50) NOT NULL DEFAULT 'declared',
  declared_value       JSONB DEFAULT '{}',
  extracted_value      JSONB DEFAULT '{}',
  accredited_value     JSONB DEFAULT '{}',
  evidence_document_id UUID REFERENCES application_documents(id) ON DELETE SET NULL,
  confidence_score     DECIMAL(5,2),
  discrepancy_detected BOOLEAN NOT NULL DEFAULT FALSE,
  discrepancy_details  JSONB DEFAULT '{}',
  evaluation_notes     TEXT,
  is_overridden        BOOLEAN NOT NULL DEFAULT FALSE,
  overridden_by        UUID REFERENCES users(id),
  overridden_at        TIMESTAMPTZ,
  override_reason      TEXT,
  evaluated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 14. VISUALIZACIONES GRANULARES (CENTRO DE CAPTACIÓN) ─────────────────────
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

-- ─── 15. SNAPSHOT HISTÓRICO INMUTABLE DE PUBLICACIÓN AL POSTULAR ──────────────
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

-- ─── 16. EVALUACIONES POR ETAPA ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS stage_evaluations (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id     UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  stage          candidate_status NOT NULL,
  result         stage_result NOT NULL DEFAULT 'pending',
  score          DECIMAL(5,2),
  observations   TEXT,
  evaluator_id   UUID REFERENCES users(id),
  evaluated_at   TIMESTAMPTZ DEFAULT NOW(),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 17. ENTREVISTAS Y CITAS PROGRAMADAS ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS interviews (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id     UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  interview_date TIMESTAMPTZ NOT NULL,
  location_type  VARCHAR(50) DEFAULT 'presential',
  location_notes TEXT,
  interviewer_id UUID REFERENCES users(id),
  status         VARCHAR(50) DEFAULT 'scheduled',
  result_notes   TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 18. AUDITORÍA ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id    UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id       UUID REFERENCES users(id),
  action        TEXT NOT NULL,
  resource      TEXT,
  resource_id   TEXT,
  details       JSONB DEFAULT '{}',
  ip_address    INET,
  user_agent    TEXT,
  success       BOOLEAN NOT NULL DEFAULT TRUE,
  error_message TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 19. GARANTÍA DE COLUMNAS EN TABLAS EXISTENTES (IDEMPOTENTE) ──────────────
ALTER TABLE job_openings 
  ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES job_categories(id) ON DELETE SET NULL;

ALTER TABLE applications 
  ADD COLUMN IF NOT EXISTS publication_id UUID REFERENCES job_publications(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS channel_id     UUID REFERENCES recruitment_channels(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS campaign_id    UUID REFERENCES recruitment_campaigns(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS utm_source     VARCHAR(100),
  ADD COLUMN IF NOT EXISTS utm_medium     VARCHAR(100),
  ADD COLUMN IF NOT EXISTS utm_campaign   VARCHAR(100);

-- ─── 20. ÍNDICES DE RENDIMIENTO ───────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_candidates_company_doc      ON candidates(company_id, document_number);
CREATE INDEX IF NOT EXISTS idx_candidates_sucamec          ON candidates(company_id, sucamec_status);
CREATE INDEX IF NOT EXISTS idx_openings_company_status     ON job_openings(company_id, status);
CREATE INDEX IF NOT EXISTS idx_openings_category           ON job_openings(company_id, category_id);
CREATE INDEX IF NOT EXISTS idx_open_reqs_opening           ON opening_requirements(job_opening_id, is_active);
CREATE INDEX IF NOT EXISTS idx_applications_stage          ON applications(company_id, current_stage);
CREATE INDEX IF NOT EXISTS idx_applications_prefilter      ON applications(job_opening_id, prefilter_status, prefilter_score DESC);
CREATE INDEX IF NOT EXISTS idx_applications_code           ON applications(application_code);
CREATE INDEX IF NOT EXISTS idx_applications_draft_token    ON applications(draft_token);
CREATE INDEX IF NOT EXISTS idx_applications_publication    ON applications(publication_id, prefilter_status);
CREATE INDEX IF NOT EXISTS idx_applications_channel        ON applications(channel_id, current_stage);
CREATE INDEX IF NOT EXISTS idx_applications_campaign       ON applications(campaign_id, prefilter_status);
CREATE INDEX IF NOT EXISTS idx_app_docs_app_id             ON application_documents(application_id);
CREATE INDEX IF NOT EXISTS idx_app_evals_app_id            ON application_evaluations(application_id);
CREATE INDEX IF NOT EXISTS idx_interviews_date             ON interviews(company_id, interview_date);
CREATE INDEX IF NOT EXISTS idx_audit_company_created       ON audit_logs(company_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_categories_company_active   ON job_categories(company_id, is_active);
CREATE INDEX IF NOT EXISTS idx_campaigns_company_status     ON recruitment_campaigns(company_id, status);
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
