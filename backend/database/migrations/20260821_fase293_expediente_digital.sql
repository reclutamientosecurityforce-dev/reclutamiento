-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRACIÓN: FASE 2.9.3 — EXPEDIENTE DOCUMENTAL INTELIGENTE
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Tipos enumerados para categorías y tipos documentales
DO $$ BEGIN
  CREATE TYPE document_category AS ENUM (
    'IDENTIDAD',
    'FORMACION_ACADEMICA',
    'EXPERIENCIA_LABORAL',
    'SEGURIDAD',
    'LICENCIAS',
    'CAPACITACION',
    'OTROS'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Crear función de mapeo para compatibilidad con tildes
CREATE OR REPLACE FUNCTION map_document_category_with_tilde(cat TEXT) RETURNS TEXT AS $$
BEGIN
  RETURN CASE cat
    WHEN 'FORMACION_ACADÉMICA' THEN 'FORMACION_ACADEMICA'
    WHEN 'CAPACITACIÓN' THEN 'CAPACITACION'
    ELSE cat
  END;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TYPE document_type AS ENUM (
    'DNI',
    'CE',
    'CUL',
    'CERTIFICADO_ESTUDIOS',
    'CONSTANCIA_ESTUDIOS',
    'CERTIFICADO_SECUNDARIA',
    'CERTIFICADO_INSTITUTO',
    'CERTIFICADO_UNIVERSIDAD',
    'CONSTANCIA_EGRESADO',
    'DIPLOMA',
    'TITULO',
    'CERTIFICADO_TRABAJO',
    'CONSTANCIA_TRABAJO',
    'CERTIFICADO_EXPERIENCIA',
    'SUCAMEC',
    'LICENCIA_ARMAS',
    'BREVETE',
    'CERTIFICADO_CURSO',
    'CERTIFICADO_CAPACITACION',
    'PRIMEROS_AUXILIOS',
    'CCTV',
    'SST',
    'SEGURIDAD',
    'OTRO'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. Tabla de requisitos documentales por convocatoria
CREATE TABLE IF NOT EXISTS opening_document_requirements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  job_opening_id UUID NOT NULL REFERENCES job_openings(id) ON DELETE CASCADE,
  requirement_id UUID REFERENCES opening_requirements(id) ON DELETE SET NULL,
  
  document_type document_type NOT NULL,
  document_category document_category NOT NULL,
  
  title VARCHAR(255) NOT NULL,
  description TEXT,
  
  is_required BOOLEAN NOT NULL DEFAULT true,
  allow_multiple BOOLEAN NOT NULL DEFAULT false,
  max_files INTEGER DEFAULT 1,
  
  order_index INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(company_id, job_opening_id, document_type, order_index)
);

-- 3. Estado de documentos del expediente
ALTER TABLE application_documents
  ADD COLUMN IF NOT EXISTS document_category document_category,
  ADD COLUMN IF NOT EXISTS document_type_typed document_type,
  ADD COLUMN IF NOT EXISTS requirement_id UUID REFERENCES opening_document_requirements(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS verification_status VARCHAR(50) DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS expires_at DATE,
  ADD COLUMN IF NOT EXISTS classification_confidence DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS is_primary BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- 4. Tabla de clasificaciones documentales (para confirmación de usuario)
CREATE TABLE IF NOT EXISTS document_classifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES application_documents(id) ON DELETE CASCADE,
  
  suggested_type document_type,
  suggested_category document_category,
  confidence_score DECIMAL(5,2),
  
  confirmed_type document_type,
  confirmed_category document_category,
  confirmed_by UUID REFERENCES users(id),
  confirmed_at TIMESTAMPTZ,
  
  classification_method VARCHAR(50) DEFAULT 'ai', -- ai, manual, user
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Índices de optimización
CREATE INDEX IF NOT EXISTS idx_opening_doc_reqs_opening ON opening_document_requirements(job_opening_id, is_active);
CREATE INDEX IF NOT EXISTS idx_opening_doc_reqs_type ON opening_document_requirements(document_type);
CREATE INDEX IF NOT EXISTS idx_opening_doc_reqs_category ON opening_document_requirements(document_category);
CREATE INDEX IF NOT EXISTS idx_app_docs_requirement ON application_documents(requirement_id);
CREATE INDEX IF NOT EXISTS idx_app_docs_verification ON application_documents(verification_status);
CREATE INDEX IF NOT EXISTS idx_app_docs_expires ON application_documents(expires_at);
CREATE INDEX IF NOT EXISTS idx_doc_classifications_doc ON document_classifications(document_id);
CREATE INDEX IF NOT EXISTS idx_doc_classifications_confirmed ON document_classifications(confirmed_at);

-- 6. Función para calcular progreso del expediente
CREATE OR REPLACE FUNCTION calculate_expediente_progress(
  p_application_id UUID,
  p_company_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
  v_total_required INTEGER := 0;
  v_total_optional INTEGER := 0;
  v_required_completed INTEGER := 0;
  v_optional_completed INTEGER := 0;
  v_required_pending INTEGER := 0;
  v_score INTEGER := 0;
BEGIN
  -- Contar requisitos obligatorios
  SELECT COUNT(*) INTO v_total_required
  FROM opening_document_requirements
  WHERE job_opening_id = (SELECT job_opening_id FROM applications WHERE id = p_application_id)
    AND company_id = p_company_id
    AND is_required = true
    AND is_active = true;
  
  -- Contar requisitos opcionales
  SELECT COUNT(*) INTO v_total_optional
  FROM opening_document_requirements
  WHERE job_opening_id = (SELECT job_opening_id FROM applications WHERE id = p_application_id)
    AND company_id = p_company_id
    AND is_required = false
    AND is_active = true;
  
  -- Contar documentos obligatorios completados
  SELECT COUNT(DISTINCT requirement_id) INTO v_required_completed
  FROM application_documents
  WHERE application_id = p_application_id
    AND company_id = p_company_id
    AND verification_status IN ('verified', 'approved')
    AND requirement_id IN (
      SELECT id FROM opening_document_requirements 
      WHERE job_opening_id = (SELECT job_opening_id FROM applications WHERE id = p_application_id)
        AND company_id = p_company_id
        AND is_required = true
    );
  
  -- Contar documentos opcionales completados
  SELECT COUNT(DISTINCT requirement_id) INTO v_optional_completed
  FROM application_documents
  WHERE application_id = p_application_id
    AND company_id = p_company_id
    AND verification_status IN ('verified', 'approved')
    AND requirement_id IN (
      SELECT id FROM opening_document_requirements 
      WHERE job_opening_id = (SELECT job_opening_id FROM applications WHERE id = p_application_id)
        AND company_id = p_company_id
        AND is_required = false
    );
  
  -- Calcular pendientes
  v_required_pending := v_total_required - v_required_completed;
  
  -- Calcular score del expediente (0-100)
  IF v_total_required > 0 THEN
    v_score := (v_required_completed * 100) / v_total_required;
  END IF;
  
  -- Construir resultado
  v_result := jsonb_build_object(
    'total_required', v_total_required,
    'total_optional', v_total_optional,
    'required_completed', v_required_completed,
    'optional_completed', v_optional_completed,
    'required_pending', v_required_pending,
    'expediente_score', v_score,
    'progress_percentage', v_score,
    'is_complete', v_required_pending = 0
  );
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- 7. Trigger para actualizar expediente_score en applications
CREATE OR REPLACE FUNCTION update_expediente_score_trigger()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.verification_status = 'verified' OR NEW.verification_status = 'approved' OR OLD.verification_status IN ('verified', 'approved') THEN
    UPDATE applications
    SET expediente_score = (
      SELECT (expediente_progress->>'expediente_score')::INTEGER
      FROM calculate_expediente_progress(NEW.application_id, NEW.company_id) AS expediente_progress
    )
    WHERE id = NEW.application_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_expediente_score ON application_documents;
CREATE TRIGGER trigger_update_expediente_score
  AFTER INSERT OR UPDATE OF verification_status ON application_documents
  FOR EACH ROW EXECUTE FUNCTION update_expediente_score_trigger();

-- 8. Vista de estado del expediente
CREATE OR REPLACE VIEW expediente_status_view AS
SELECT 
  a.id AS application_id,
  a.company_id,
  a.application_code,
  c.first_name,
  c.last_name,
  c.document_number,
  jo.title AS job_title,
  calculate_expediente_progress(a.id, a.company_id) AS expediente_progress,
  COUNT(DISTINCT ad.requirement_id) FILTER (WHERE ad.verification_status IN ('verified', 'approved')) AS documents_verified,
  COUNT(DISTINCT ad.requirement_id) FILTER (WHERE ad.verification_status = 'pending') AS documents_pending,
  COUNT(DISTINCT ad.requirement_id) FILTER (WHERE ad.verification_status = 'observed') AS documents_observed,
  COUNT(DISTINCT ad.requirement_id) FILTER (WHERE ad.verification_status = 'rejected') AS documents_rejected
FROM applications a
JOIN candidates c ON a.candidate_id = c.id
JOIN job_openings jo ON a.job_opening_id = jo.id
LEFT JOIN application_documents ad ON a.id = ad.application_id
GROUP BY a.id, a.company_id, a.application_code, c.first_name, c.last_name, c.document_number, jo.title;
