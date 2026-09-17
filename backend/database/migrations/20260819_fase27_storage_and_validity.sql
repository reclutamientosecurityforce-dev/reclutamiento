-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRACIÓN: FASE 2.7.1 — STORAGE PROVIDER, ACL Y METADATOS DOCUMENTALES
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Columnas para StorageProvider en application_documents
ALTER TABLE application_documents 
  ADD COLUMN IF NOT EXISTS storage_provider VARCHAR(50) DEFAULT 'local',
  ADD COLUMN IF NOT EXISTS storage_key VARCHAR(500),
  ADD COLUMN IF NOT EXISTS original_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS file_hash VARCHAR(64);

-- 2. Asegurar columna expediente_score en applications
ALTER TABLE applications 
  ADD COLUMN IF NOT EXISTS expediente_score INTEGER DEFAULT 0;

-- 3. Índices de optimización para seguridad, ACL y deduplicación
CREATE INDEX IF NOT EXISTS idx_app_docs_storage_key ON application_documents(storage_key);
CREATE INDEX IF NOT EXISTS idx_app_docs_file_hash ON application_documents(file_hash);
CREATE INDEX IF NOT EXISTS idx_app_docs_company_app ON application_documents(company_id, application_id);
