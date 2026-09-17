-- ═══════════════════════════════════════════════════════════════════════════════
-- SEED RECLUTAMIENTO Y PORTAL PÚBLICO — Security Force P&V S.A.C.
-- ═══════════════════════════════════════════════════════════════════════════════

-- Empresa
INSERT INTO companies (id, name, ruc, address, phone, email)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'Security Force P&V S.A.C.',
  '20123456789',
  'Av. Principal 123, San Isidro, Lima',
  '+51 1 234-5678',
  'rrhh@securityforce.pe'
) ON CONFLICT (id) DO NOTHING;

-- Usuarios (Contraseña: Admin1234! / User1234!)
INSERT INTO users (id, company_id, username, email, password_hash, role, full_name)
VALUES
(
  'b0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  'admin',
  'jefe.seleccion@securityforce.pe',
  '$2a$10$9xrvM.36cEGQcPM4Es4qUuY0l5sU4BZNm45TW4RGLNhUJL3zhQYni',
  'admin',
  'Lic. Roberto Mendoza (Jefe de Selección)'
),
(
  'c0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  'carlos.perez',
  'carlos.perez@securityforce.pe',
  '$2a$10$8MdX5nkZ7Fa3nCcTHv/4K.Wk8D6p9br.GfC.oP8nDj9/jVEBWhFma',
  'recruiter',
  'Carlos Pérez (Reclutador Senior)'
),
(
  'c0000000-0000-0000-0000-000000000002',
  'a0000000-0000-0000-0000-000000000001',
  'maria.garcia',
  'maria.garcia@securityforce.pe',
  '$2a$10$8MdX5nkZ7Fa3nCcTHv/4K.Wk8D6p9br.GfC.oP8nDj9/jVEBWhFma',
  'evaluator',
  'Psic. María García (Psicóloga Evaluadora)'
)
ON CONFLICT (id) DO UPDATE SET password_hash = EXCLUDED.password_hash;

-- Convocatorias / Vacantes Activas con Requisitos y Documentos Dinámicos
INSERT INTO job_openings (id, company_id, title, position_type, location, client_name, vacancies_count, filled_count, salary_offered, shift_type, status, requirements, description, created_by)
VALUES
(
  'e0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  'Agentes de Seguridad - Sede Bancaria',
  'Agente de Seguridad',
  'San Isidro / Miraflores, Lima',
  'Banco Financiero Continental',
  10,
  3,
  1800.00,
  '12x12 Rotativo (4x2)',
  'open',
  '{
    "min_height": 172,
    "min_age": 21,
    "max_age": 55,
    "sucamec_required": true,
    "gun_license_required": false,
    "driver_license_required": false,
    "experience_years": 1,
    "required_documents": [
      {"type": "dni", "label": "DNI / Carné de Extranjería (Ambas caras)", "required": true},
      {"type": "cul", "label": "Certificado Único Laboral (CUL - Certiadulto/Certijoven)", "required": true},
      {"type": "cert_estudios", "label": "Certificado de Secundaria Completa", "required": true},
      {"type": "sucamec", "label": "Carné SUCAMEC Vigente o Trámite", "required": true},
      {"type": "cert_trabajo", "label": "Certificados de Trabajo en Seguridad", "required": false}
    ],
    "benefits": [
      "Ingreso a planilla directa desde el primer día con todos los beneficios de ley (CTS, Gratificaciones, Seguro ESSALUD, Asignación Familiar)",
      "Pagos puntuales quincena y fin de mes",
      "Seguro Vida Ley desde el primer día de servicio",
      "Capacitación continua y línea de carrera en seguridad bancaria",
      "Uniformes completos tácticos sin costo"
    ]
  }',
  'Buscamos agentes de seguridad con vocación de servicio, excelente presencia y carné SUCAMEC vigente para resguardo y control de accesos en agencias bancarias corporativas de primer nivel.',
  'b0000000-0000-0000-0000-000000000001'
),
(
  'e0000000-0000-0000-0000-000000000002',
  'a0000000-0000-0000-0000-000000000001',
  'Conductor Escolta con Licencia L1 y Brevete A2B',
  'Conductor Escolta',
  'Lima Metropolitana / Rutas Nacionales',
  'Corporación Minera del Centro',
  4,
  1,
  2600.00,
  '6x1 Rotativo',
  'open',
  '{
    "min_height": 175,
    "min_age": 25,
    "max_age": 50,
    "sucamec_required": true,
    "gun_license_required": true,
    "driver_license_required": true,
    "driver_license_type": "A2B",
    "experience_years": 2,
    "required_documents": [
      {"type": "dni", "label": "DNI Vigente", "required": true},
      {"type": "brevete", "label": "Licencia de Conducir A2B o superior", "required": true},
      {"type": "lic_armas", "label": "Licencia de Porte de Armas L1/L2 vigente", "required": true},
      {"type": "cul", "label": "Certificado Único Laboral (CUL)", "required": true},
      {"type": "cert_trabajo", "label": "Certificados laborales como conductor o escolta", "required": true}
    ],
    "benefits": [
      "Salario competitivo acorde al mercado + bono por rutas",
      "Planilla completa con todos los beneficios de ley",
      "Unidad móvil asignada con mantenimiento al 100%",
      "Seguro complementario de trabajo de riesgo (SCTR)",
      "Alimentación y viáticos cubiertos en traslados"
    ]
  }',
  'Requerimos conductores escoltas con experiencia comprobada en resguardo ejecutivo, manejo defensivo y evasivo, porte de armas de fuego y récord de conductor impecable.',
  'b0000000-0000-0000-0000-000000000001'
),
(
  'e0000000-0000-0000-0000-000000000003',
  'a0000000-0000-0000-0000-000000000001',
  'Operador de Centro de Control CCTV',
  'Operador CCTV',
  'Centro Comercial Plaza Norte, Independencia',
  'Mall Aventura',
  3,
  0,
  2000.00,
  '12x12 Rotativo',
  'open',
  '{
    "min_height": 165,
    "min_age": 20,
    "max_age": 45,
    "sucamec_required": true,
    "gun_license_required": false,
    "driver_license_required": false,
    "experience_years": 1,
    "required_documents": [
      {"type": "dni", "label": "DNI", "required": true},
      {"type": "cul", "label": "Certificado Único Laboral (CUL)", "required": true},
      {"type": "cert_estudios", "label": "Certificado de estudios / Cursos de CCTV", "required": true}
    ],
    "benefits": [
      "Ingreso a planilla directa con todos los beneficios",
      "Ambiente de trabajo climatizado y tecnología de punta",
      "Capacitaciones en software VMS Milestone y sistemas de alarma",
      "Línea de carrera a Supervisor de Centro de Control"
    ]
  }',
  'Manejo de sistemas de videovigilancia Hikvision / Dahua, monitoreo en tiempo real, detección temprana de incidencias y redacción de informes de novedades.',
  'b0000000-0000-0000-0000-000000000001'
)
ON CONFLICT (id) DO NOTHING;

-- Candidatos / Postulantes con Perfil Estructurado
INSERT INTO candidates (
  id, company_id, document_type, document_number, first_name, last_name, email, phone,
  district, height_cm, weight_kg, sucamec_status, sucamec_code, gun_license, gun_license_type,
  driver_license, driver_license_type, military_service, security_experience_years, notes,
  structured_profile, created_by
)
VALUES
(
  'f0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  'DNI',
  '71234567',
  'Juan Carlos',
  'Quispe Flores',
  'juan.quispe@gmail.com',
  '987654321',
  'Los Olivos',
  176,
  78.5,
  'valid',
  'SUC-2024-99881',
  TRUE,
  'L1',
  TRUE,
  'A1',
  TRUE,
  3,
  'Licenciado de las FFAA, excelente porte y actitud de servicio.',
  '{
    "experiences": [
      {"company": "Prosegur Seguridad", "position": "Agente de Seguridad Bancaria", "startDate": "2023-01", "endDate": "2025-12", "city": "Lima", "functions": "Control de accesos y vigilancia perimétrica en agencia bancaria"},
      {"company": "G4S Perú", "position": "Vigilante", "startDate": "2021-03", "endDate": "2022-12", "city": "Lima", "functions": "Rondas de seguridad y registro de visitas en planta industrial"}
    ],
    "education": [
      {"institution": "Colegio Gran Unidad San Marcos", "degree": "Secundaria Completa", "level": "Secundaria", "year": "2019", "status": "Culminado"}
    ],
    "courses": [
      {"name": "Curso Básico de Seguridad SUCAMEC (80 horas)", "institution": "Centro de Capacitación Táctica", "year": "2023"},
      {"name": "Primeros Auxilios y Lucha Contra Incendios", "institution": "Cruz Roja Peruana", "year": "2024"}
    ],
    "skills": ["Tiro defensivo", "Control de accesos", "Primeros auxilios", "Redacción de informes"]
  }',
  'c0000000-0000-0000-0000-000000000001'
),
(
  'f0000000-0000-0000-0000-000000000002',
  'a0000000-0000-0000-0000-000000000001',
  'DNI',
  '45678912',
  'Luis Alberto',
  'Sánchez Torres',
  'luis.sanchez@gmail.com',
  '912345678',
  'San Juan de Lurigancho',
  174,
  75.0,
  'valid',
  'SUC-2025-11223',
  FALSE,
  NULL,
  FALSE,
  NULL,
  FALSE,
  2,
  'Experiencia en retail y centros comerciales.',
  '{
    "experiences": [
      {"company": "Securitas Perú", "position": "Agente de Seguridad Retail", "startDate": "2023-05", "endDate": "2025-06", "city": "Lima", "functions": "Prevención de pérdidas y control de público en supermercado"}
    ],
    "education": [
      {"institution": "I.E. Antenor Orrego", "degree": "Secundaria Completa", "level": "Secundaria", "year": "2018", "status": "Culminado"}
    ],
    "courses": [],
    "skills": ["Prevención de pérdidas", "Atención al cliente", "Manejo de extintores"]
  }',
  'c0000000-0000-0000-0000-000000000001'
),
(
  'f0000000-0000-0000-0000-000000000003',
  'a0000000-0000-0000-0000-000000000001',
  'DNI',
  '48991122',
  'Miguel Ángel',
  'Ramos Condori',
  'miguel.ramos@gmail.com',
  '955443322',
  'Ate Vitarte',
  178,
  82.0,
  'valid',
  'SUC-2023-77441',
  TRUE,
  'L1 / L2',
  TRUE,
  'A2B',
  TRUE,
  5,
  'Candidato idóneo para escolta, cuenta con récord de manejo impecable.',
  '{
    "experiences": [
      {"company": "Liderman", "position": "Conductor Resguardo", "startDate": "2020-01", "endDate": "2025-01", "city": "Lima / Cusco", "functions": "Conducción de vehículos blindados y escolta a ejecutivos mineros"}
    ],
    "education": [
      {"institution": "Colegio Nacional Alfonso Ugarte", "degree": "Secundaria Completa", "level": "Secundaria", "year": "2016", "status": "Culminado"}
    ],
    "courses": [
      {"name": "Manejo Defensivo y Evasivo 4x4", "institution": "Touring y Automóvil Club del Perú", "year": "2022"}
    ],
    "skills": ["Manejo 4x4", "Protección ejecutiva", "Tiro de precisión", "Radiocomunicación"]
  }',
  'c0000000-0000-0000-0000-000000000001'
),
(
  'f0000000-0000-0000-0000-000000000004',
  'a0000000-0000-0000-0000-000000000001',
  'DNI',
  '73445566',
  'David Alexander',
  'Vega Mendoza',
  'david.vega@gmail.com',
  '933221144',
  'Comas',
  173,
  70.0,
  'in_process',
  NULL,
  FALSE,
  NULL,
  FALSE,
  NULL,
  FALSE,
  1,
  'Trámite SUCAMEC iniciado esta semana.',
  '{
    "experiences": [],
    "education": [
      {"institution": "I.E. José Carlos Mariátegui", "degree": "Secundaria Completa", "level": "Secundaria", "year": "2022", "status": "Culminado"}
    ],
    "courses": [],
    "skills": ["Disponibilidad inmediata", "Buena condición física"]
  }',
  'c0000000-0000-0000-0000-000000000001'
)
ON CONFLICT (id) DO NOTHING;

-- Postulaciones a vacantes con Código Oficial de Seguimiento y Progreso
INSERT INTO applications (
  id, company_id, candidate_id, job_opening_id, application_code, draft_token,
  application_status, progress_percentage, compatibility_score, current_stage,
  stage_score, assigned_recruiter, submitted_at
)
VALUES
(
  'a1000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  'f0000000-0000-0000-0000-000000000001',
  'e0000000-0000-0000-0000-000000000001',
  'SF-2026-8K42P',
  'token_draft_juan_quispe_12345',
  'submitted',
  100,
  95.00,
  'approved',
  95.00,
  'c0000000-0000-0000-0000-000000000001',
  NOW() - INTERVAL '2 days'
),
(
  'a1000000-0000-0000-0000-000000000002',
  'a0000000-0000-0000-0000-000000000001',
  'f0000000-0000-0000-0000-000000000002',
  'e0000000-0000-0000-0000-000000000001',
  'SF-2026-9M18T',
  'token_draft_luis_sanchez_12345',
  'submitted',
  100,
  88.00,
  'interview',
  82.00,
  'c0000000-0000-0000-0000-000000000001',
  NOW() - INTERVAL '1 day'
),
(
  'a1000000-0000-0000-0000-000000000003',
  'a0000000-0000-0000-0000-000000000001',
  'f0000000-0000-0000-0000-000000000003',
  'e0000000-0000-0000-0000-000000000002',
  'SF-2026-3X77R',
  'token_draft_miguel_ramos_12345',
  'submitted',
  100,
  98.00,
  'medical_exam',
  98.00,
  'c0000000-0000-0000-0000-000000000001',
  NOW() - INTERVAL '3 days'
),
(
  'a1000000-0000-0000-0000-000000000004',
  'a0000000-0000-0000-0000-000000000001',
  'f0000000-0000-0000-0000-000000000004',
  'e0000000-0000-0000-0000-000000000001',
  'SF-2026-4P55Q',
  'token_draft_david_vega_12345',
  'submitted',
  80,
  72.00,
  'psychological_eval',
  75.00,
  'c0000000-0000-0000-0000-000000000001',
  NOW() - INTERVAL '12 hours'
)
ON CONFLICT (id) DO NOTHING;

-- Documentos de Postulantes de Prueba
INSERT INTO application_documents (
  id, company_id, application_id, document_type, file_name, file_path, mime_type, file_size, status
)
VALUES
(
  'd0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  'a1000000-0000-0000-0000-000000000001',
  'dni',
  'DNI_71234567_Juan_Quispe.pdf',
  'uploads/candidates/DNI_71234567_Juan_Quispe.pdf',
  'application/pdf',
  485200,
  'verified'
),
(
  'd0000000-0000-0000-0000-000000000002',
  'a0000000-0000-0000-0000-000000000001',
  'a1000000-0000-0000-0000-000000000001',
  'cul',
  'CUL_Certiadulto_71234567.pdf',
  'uploads/candidates/CUL_Certiadulto_71234567.pdf',
  'application/pdf',
  320100,
  'verified'
),
(
  'd0000000-0000-0000-0000-000000000003',
  'a0000000-0000-0000-0000-000000000001',
  'a1000000-0000-0000-0000-000000000001',
  'sucamec',
  'Carne_SUCAMEC_99881.jpg',
  'uploads/candidates/Carne_SUCAMEC_99881.jpg',
  'image/jpeg',
  850000,
  'verified'
)
ON CONFLICT DO NOTHING;

-- Evaluaciones por etapa
INSERT INTO stage_evaluations (company_id, application_id, stage, result, score, observations, evaluator_id)
VALUES
(
  'a0000000-0000-0000-0000-000000000001',
  'a1000000-0000-0000-0000-000000000001',
  'psychological_eval',
  'passed',
  95.0,
  'Personalidad estable, apto para control de accesos y resguardo bancario.',
  'c0000000-0000-0000-0000-000000000002'
),
(
  'a0000000-0000-0000-0000-000000000001',
  'a1000000-0000-0000-0000-000000000001',
  'background_check',
  'passed',
  100.0,
  'Antecedentes policiales, penales y judiciales 100% limpios verificados en Certiadulto.',
  'c0000000-0000-0000-0000-000000000001'
)
ON CONFLICT DO NOTHING;

-- Entrevista programada
INSERT INTO interviews (company_id, application_id, interview_date, location_type, location_notes, interviewer_id, status)
VALUES
(
  'a0000000-0000-0000-0000-000000000001',
  'a1000000-0000-0000-0000-000000000002',
  NOW() + INTERVAL '2 hours',
  'presential',
  'Sede Central San Isidro - Sala de Entrevistas B',
  'b0000000-0000-0000-0000-000000000001',
  'scheduled'
)
ON CONFLICT DO NOTHING;

-- Requisitos Configurables del Motor de Prefiltro (Opening Requirements)
-- Vacante 1: Agentes de Seguridad - Sede Bancaria
INSERT INTO opening_requirements (
  id, company_id, job_opening_id, version, code, title, description,
  requirement_type, rule_type, rule_config, weight_score, required_document_type, order_index
)
VALUES
(
  'a2000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  'e0000000-0000-0000-0000-000000000001',
  1,
  'REQ_AGE',
  'Edad Permitida (21 a 55 años)',
  'Rango de edad legal para servicio de resguardo bancario.',
  'eliminatory',
  'range',
  '{"min": 21, "max": 55}',
  0.00,
  'dni',
  1
),
(
  'a2000000-0000-0000-0000-000000000002',
  'a0000000-0000-0000-0000-000000000001',
  'e0000000-0000-0000-0000-000000000001',
  1,
  'REQ_HEIGHT',
  'Estatura Mínima Operativa',
  'Estatura mínima 172 cm para presencia perimétrica.',
  'eliminatory',
  'min',
  '{"min": 172}',
  0.00,
  NULL,
  2
),
(
  'a2000000-0000-0000-0000-000000000003',
  'a0000000-0000-0000-0000-000000000001',
  'e0000000-0000-0000-0000-000000000001',
  1,
  'REQ_SUCAMEC',
  'Carné SUCAMEC Vigente',
  'Carné SUCAMEC obligatorio para control de accesos.',
  'eliminatory',
  'validity',
  '{"expectedStatus": "valid", "allowInProcess": true}',
  0.00,
  'sucamec',
  3
),
(
  'a2000000-0000-0000-0000-000000000004',
  'a0000000-0000-0000-0000-000000000001',
  'e0000000-0000-0000-0000-000000000001',
  1,
  'REQ_EXP_TOTAL',
  'Experiencia Total en Seguridad',
  'Mínimo 12 meses acreditados. Puntaje progresivo hasta 36 meses.',
  'eliminatory_scoreable',
  'experience_total',
  '{"minMonths": 12, "maxScoreMonths": 36}',
  30.00,
  'cert_trabajo',
  4
),
(
  'a2000000-0000-0000-0000-000000000005',
  'a0000000-0000-0000-0000-000000000001',
  'e0000000-0000-0000-0000-000000000001',
  1,
  'REQ_DOC_CUL',
  'Certificado Único Laboral (CUL / Certiadulto)',
  'Antecedentes policiales, penales y judiciales 100% limpios.',
  'documental',
  'document_evidence',
  '{"documentType": "cul", "maxAgeDays": 90}',
  25.00,
  'cul',
  5
),
(
  'a2000000-0000-0000-0000-000000000006',
  'a0000000-0000-0000-0000-000000000001',
  'e0000000-0000-0000-0000-000000000001',
  1,
  'REQ_DOC_STUDIES',
  'Secundaria Completa Acreditada',
  'Certificado de estudios secundarios completos.',
  'documental',
  'document_evidence',
  '{"documentType": "cert_estudios"}',
  15.00,
  'cert_estudios',
  6
),
(
  'a2000000-0000-0000-0000-000000000007',
  'a0000000-0000-0000-0000-000000000001',
  'e0000000-0000-0000-0000-000000000001',
  1,
  'REQ_MILITARY',
  'Licenciado de las Fuerzas Armadas (FFAA)',
  'Bonificación por servicio militar en Ejército, Marina o FAP.',
  'scoreable',
  'boolean',
  '{"field": "military_service", "targetValue": true}',
  15.00,
  NULL,
  7
),
(
  'a2000000-0000-0000-0000-000000000008',
  'a0000000-0000-0000-0000-000000000001',
  'e0000000-0000-0000-0000-000000000001',
  1,
  'REQ_GUN_BONUS',
  'Licencia de Porte de Armas (L1/L2)',
  'Puntos adicionales si cuenta con licencia de armas.',
  'scoreable',
  'boolean',
  '{"field": "gun_license", "targetValue": true}',
  15.00,
  'lic_armas',
  8
)
ON CONFLICT (id) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════════
-- SEED CENTRO DE CAPTACIÓN
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1. Categorías Oficiales
INSERT INTO job_categories (id, company_id, name, slug, icon, color_hex, description, template_requirements, is_active, order_index)
VALUES
(
  'f0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  'Agentes de Seguridad',
  'agentes-seguridad',
  'Shield',
  '#2563eb',
  'Personal operativo para control de accesos, custodia de instalaciones y rondas.',
  '[
    {"code": "REQ_AGE", "title": "Rango de Edad (19-55 años)", "requirement_type": "eliminatory", "rule_type": "range", "rule_config": {"min": 19, "max": 55, "field": "birth_date"}, "weight_score": 0, "order_index": 1},
    {"code": "REQ_HEIGHT", "title": "Estatura Mínima (1.65m)", "requirement_type": "eliminatory", "rule_type": "min", "rule_config": {"minValue": 165, "field": "height_cm"}, "weight_score": 0, "order_index": 2},
    {"code": "REQ_SUCAMEC", "title": "Carné SUCAMEC Vigente", "requirement_type": "eliminatory", "rule_type": "validity", "rule_config": {"expectedStatus": "valid", "allowInProcess": true}, "weight_score": 0, "order_index": 3},
    {"code": "REQ_EXP_TOTAL", "title": "Experiencia en Seguridad", "requirement_type": "eliminatory_scoreable", "rule_type": "experience_total", "rule_config": {"minMonths": 6, "maxScoreMonths": 36}, "weight_score": 40, "order_index": 4},
    {"code": "REQ_DOC_CUL", "title": "Certificado Único Laboral (CUL)", "requirement_type": "documental", "rule_type": "document_evidence", "rule_config": {"documentType": "cul", "maxAgeDays": 90}, "weight_score": 30, "order_index": 5},
    {"code": "REQ_DOC_STUDIES", "title": "Secundaria Completa", "requirement_type": "documental", "rule_type": "document_evidence", "rule_config": {"documentType": "cert_estudios"}, "weight_score": 30, "order_index": 6}
  ]',
  TRUE,
  1
),
(
  'f0000000-0000-0000-0000-000000000002',
  'a0000000-0000-0000-0000-000000000001',
  'Supervisores de Seguridad',
  'supervisores',
  'UserCheck',
  '#7c3aed',
  'Supervisión de puestos de vigilancia, liderazgo de escuadra y coordinación con clientes.',
  '[
    {"code": "REQ_EXP_SUP", "title": "Experiencia como Supervisor", "requirement_type": "eliminatory_scoreable", "rule_type": "experience_total", "rule_config": {"minMonths": 24, "maxScoreMonths": 48}, "weight_score": 50, "order_index": 1},
    {"code": "REQ_DRIVER_LIC", "title": "Brevete de Conducir (A1 / A2B)", "requirement_type": "eliminatory", "rule_type": "boolean", "rule_config": {"field": "driver_license", "targetValue": true}, "weight_score": 0, "order_index": 2},
    {"code": "REQ_DOC_CUL", "title": "Certificado Único Laboral (CUL)", "requirement_type": "documental", "rule_type": "document_evidence", "rule_config": {"documentType": "cul"}, "weight_score": 50, "order_index": 3}
  ]',
  TRUE,
  2
),
(
  'f0000000-0000-0000-0000-000000000003',
  'a0000000-0000-0000-0000-000000000001',
  'Operadores CCTV',
  'operadores-cctv',
  'Eye',
  '#0284c7',
  'Monitoreo de cámaras de seguridad, alarmas y respuesta ante incidencias en centro de control.',
  '[
    {"code": "REQ_EXP_CCTV", "title": "Experiencia en Monitoreo CCTV", "requirement_type": "eliminatory_scoreable", "rule_type": "experience_total", "rule_config": {"minMonths": 12, "maxScoreMonths": 36}, "weight_score": 60, "order_index": 1},
    {"code": "REQ_DOC_CUL", "title": "Certificado Único Laboral (CUL)", "requirement_type": "documental", "rule_type": "document_evidence", "rule_config": {"documentType": "cul"}, "weight_score": 40, "order_index": 2}
  ]',
  TRUE,
  3
),
(
  'f0000000-0000-0000-0000-000000000004',
  'a0000000-0000-0000-0000-000000000001',
  'Conductores y Escoltas',
  'conductores-escoltas',
  'Truck',
  '#d97706',
  'Protección de ejecutivos, transporte blindado y conductores con licencia profesional.',
  '[]',
  TRUE,
  4
),
(
  'f0000000-0000-0000-0000-000000000005',
  'a0000000-0000-0000-0000-000000000001',
  'Personal Administrativo',
  'administrativo',
  'Briefcase',
  '#059669',
  'Gestión documental, recursos humanos, operaciones y logística de seguridad.',
  '[]',
  TRUE,
  5
),
(
  'f0000000-0000-0000-0000-000000000006',
  'a0000000-0000-0000-0000-000000000001',
  'Otros Puestos',
  'otros',
  'Grid',
  '#64748b',
  'Puestos especializados y de apoyo operativo.',
  '[]',
  TRUE,
  6
)
ON CONFLICT (company_id, slug) DO NOTHING;

-- Asignar categorías a convocatorias existentes
UPDATE job_openings 
SET category_id = 'f0000000-0000-0000-0000-000000000001'
WHERE id IN ('e0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000002');

UPDATE job_openings 
SET category_id = 'f0000000-0000-0000-0000-000000000003'
WHERE id = 'e0000000-0000-0000-0000-000000000003';

-- 2. Campañas de Captación Iniciales
INSERT INTO recruitment_campaigns (id, company_id, name, description, utm_campaign, status, starts_at, ends_at)
VALUES
(
  'd1000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  'Convocatoria Masiva Lima Centro 2026',
  'Campaña multicanal para cubrir 40 puestos en Lima Metropolitana y sedes financieras.',
  'lima_centro_2026',
  'active',
  NOW() - INTERVAL '10 days',
  NOW() + INTERVAL '30 days'
),
(
  'd1000000-0000-0000-0000-000000000002',
  'a0000000-0000-0000-0000-000000000001',
  'Campaña Captación Norte - Trujillo',
  'Atracción de agentes licenciados FFAA para contratos en La Libertad y Trujillo.',
  'trujillo_norte_2026',
  'active',
  NOW() - INTERVAL '5 days',
  NOW() + INTERVAL '45 days'
)
ON CONFLICT (id) DO NOTHING;

-- 3. Canales de Captación
INSERT INTO recruitment_channels (id, company_id, campaign_id, name, type, utm_source, utm_medium, utm_campaign, description)
VALUES
(
  'd2000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  'd1000000-0000-0000-0000-000000000001',
  'Facebook Ads - Redes Sociales',
  'facebook',
  'facebook',
  'paid_social',
  'lima_centro_2026',
  'Anuncios pagados en feed e historias de Facebook con botón de postulación directa.'
),
(
  'd2000000-0000-0000-0000-000000000002',
  'a0000000-0000-0000-0000-000000000001',
  'd1000000-0000-0000-0000-000000000001',
  'Código QR Afiches y Volantes',
  'qr',
  'qr_poster',
  'offline_print',
  'lima_centro_2026',
  'QR impreso en afiches ubicados en bases operativas, comisarías y centros cívicos.'
),
(
  'd2000000-0000-0000-0000-000000000003',
  'a0000000-0000-0000-0000-000000000001',
  'd1000000-0000-0000-0000-000000000001',
  'WhatsApp Difusión Comunitaria',
  'whatsapp',
  'whatsapp',
  'direct_messaging',
  'lima_centro_2026',
  'Enlaces compartidos en grupos de vigilantes, licenciados y postulantes.'
),
(
  'd2000000-0000-0000-0000-000000000004',
  'a0000000-0000-0000-0000-000000000001',
  NULL,
  'Portal Web Institucional',
  'web',
  'portal_web',
  'organic',
  'organico',
  'Tráfico orgánico directo a través de la bolsa laboral en securityforce.pe.'
),
(
  'd2000000-0000-0000-0000-000000000005',
  'a0000000-0000-0000-0000-000000000001',
  NULL,
  'Programa de Referidos Internos',
  'referral',
  'referidos',
  'internal_staff',
  'plan_referidos',
  'Recomendaciones de agentes en servicio con bono de contratación.'
)
ON CONFLICT (company_id, name) DO NOTHING;

-- 4. Publicaciones de Ejemplo
INSERT INTO job_publications (
  id, company_id, job_opening_id, campaign_id, channel_id,
  slug, title, description, banner_url, benefits, requirement_version_at_publish,
  status, published_at, closes_at, og_title, og_description,
  views_total, views_unique_estimated, applications_started, applications_completed
)
VALUES
(
  'd3000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  'e0000000-0000-0000-0000-000000000001',
  'd1000000-0000-0000-0000-000000000001',
  'd2000000-0000-0000-0000-000000000001',
  'SEC-BAN01',
  '¡Únete como Agente de Seguridad para Sede Financiera!',
  'En Security Force P&V buscamos a los mejores Agentes de Seguridad para importante entidad bancaria en San Isidro y Miraflores. Ofrecemos ingreso inmediato a planilla completa con todos los beneficios de ley (CTS, Gratificaciones, Seguro Vida Ley y EsSalud). Pagos puntuales fin de mes y quincena.',
  NULL,
  '["Planilla completa desde el primer día", "Pagos puntuales (quincena y fin de mes)", "Seguro Vida Ley y EsSalud", "Línea de carrera y capacitaciones pagadas", "Uniformes y EPPs completos sin costo"]',
  1,
  'published',
  NOW() - INTERVAL '7 days',
  NOW() + INTERVAL '20 days',
  'Agentes de Seguridad — Sede Bancaria | Security Force P&V',
  'Postula online en 3 minutos. Ingreso a planilla completa, pagos puntuales y turnos 12x12.',
  450,
  310,
  45,
  32
),
(
  'd3000000-0000-0000-0000-000000000002',
  'a0000000-0000-0000-0000-000000000001',
  'e0000000-0000-0000-0000-000000000002',
  'd1000000-0000-0000-0000-000000000001',
  'd2000000-0000-0000-0000-000000000002',
  'SEC-RET02',
  'Convocatoria: Agentes de Prevención de Pérdidas y Retail',
  'Protege las mejores cadenas comerciales en Lima Norte y Sur. Turnos rotativos 12x12, bonos de puntualidad y ambiente de trabajo seguro con protocolos de primer nivel.',
  NULL,
  '["Sueldo básico + Bonos de puntualidad", "Planilla MYPE / Régimen General", "Seguro SCTR y Vida Ley", "Capacitaciones continuas"]',
  1,
  'published',
  NOW() - INTERVAL '4 days',
  NOW() + INTERVAL '15 days',
  'Agentes Prevención Retail — Convocatoria Masiva',
  'Trabaja cerca de tu domicilio en Lima Norte / Sur. Postula hoy.',
  280,
  195,
  28,
  19
)
ON CONFLICT (slug) DO NOTHING;

