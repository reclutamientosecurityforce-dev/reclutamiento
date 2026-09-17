-- MIGRACIÓN: CONFIGURACIÓN DE CONTACTO DESDE PANEL ADMIN
-- Fecha: 21 de agosto de 2026
-- Security Force P&V S.A.C.

-- Ampliar tabla companies con campos de contacto adicionales
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS whatsapp VARCHAR(50),
ADD COLUMN IF NOT EXISTS facebook_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS instagram_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS linkedin_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS hours TEXT;

-- Comentario para describir los nuevos campos
COMMENT ON COLUMN companies.whatsapp IS 'Número de WhatsApp para contacto';
COMMENT ON COLUMN companies.facebook_url IS 'URL de página de Facebook';
COMMENT ON COLUMN companies.instagram_url IS 'URL de página de Instagram';
COMMENT ON COLUMN companies.linkedin_url IS 'URL de página de LinkedIn';
COMMENT ON COLUMN companies.hours IS 'Horario de atención';
