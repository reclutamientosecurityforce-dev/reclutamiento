"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOpeningRequirements = getOpeningRequirements;
exports.saveOpeningRequirements = saveOpeningRequirements;
exports.evaluateApplicationEndpoint = evaluateApplicationEndpoint;
exports.evaluateAllOpeningApplications = evaluateAllOpeningApplications;
exports.getApplicationEvaluation = getApplicationEvaluation;
exports.overrideEvaluationEndpoint = overrideEvaluationEndpoint;
exports.getOpeningRanking = getOpeningRanking;
exports.getEvaluationSummary = getEvaluationSummary;
const zod_1 = require("zod");
const db_1 = __importDefault(require("../../../../db"));
const evaluation_engine_1 = require("../../domain/evaluation.engine");
// ─── 1. OBTENER REQUISITOS CONFIGURADOS DE UNA VACANTE ──────────────────────
async function getOpeningRequirements(req, res) {
    try {
        const companyId = req.user.companyId;
        const { id: openingId } = req.params;
        const { rows } = await db_1.default.query(`SELECT * FROM opening_requirements 
       WHERE company_id = $1 AND job_opening_id = $2 
       ORDER BY order_index ASC, created_at ASC`, [companyId, openingId]);
        res.json(rows);
    }
    catch (err) {
        console.error('Error en getOpeningRequirements:', err);
        res.status(500).json({ error: 'Error al obtener requisitos de la convocatoria.' });
    }
}
// ─── 2. CREAR O ACTUALIZAR REQUISITOS (CON VALIDACIÓN DE PESOS) ─────────────
const requirementItemSchema = zod_1.z.object({
    id: zod_1.z.string().uuid().optional(),
    code: zod_1.z.string().min(2),
    title: zod_1.z.string().min(3),
    description: zod_1.z.string().optional(),
    requirement_type: zod_1.z.enum(['eliminatory', 'scoreable', 'documental', 'eliminatory_scoreable', 'informative']),
    rule_type: zod_1.z.enum(['range', 'min', 'max', 'boolean', 'exists', 'validity', 'text_category', 'experience_total', 'experience_specific', 'document_evidence', 'date_range', 'numeric', 'list_contains']),
    rule_config: zod_1.z.record(zod_1.z.any()).default({}),
    weight_score: zod_1.z.number().min(0).max(100).default(0),
    required_document_type: zod_1.z.string().optional(),
    order_index: zod_1.z.number().default(0),
    is_active: zod_1.z.boolean().default(true),
});
const saveRequirementsSchema = zod_1.z.object({
    requirements: zod_1.z.array(requirementItemSchema),
});
async function saveOpeningRequirements(req, res) {
    try {
        const companyId = req.user.companyId;
        const { id: openingId } = req.params;
        const parsed = saveRequirementsSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ error: 'Estructura de requisitos inválida.', details: parsed.error.issues });
            return;
        }
        const { requirements } = parsed.data;
        // Validación de pesos para requisitos puntuables
        const totalScoreableWeight = requirements
            .filter((r) => r.is_active && (r.requirement_type === 'scoreable' || r.requirement_type === 'eliminatory_scoreable' || r.requirement_type === 'documental'))
            .reduce((sum, r) => sum + r.weight_score, 0);
        // Transacción para guardar la nueva versión de requisitos
        const result = await db_1.default.transaction(async (client) => {
            // Obtener versión actual
            const verRes = await client.query(`SELECT COALESCE(MAX(version), 0) AS max_ver FROM opening_requirements WHERE company_id = $1 AND job_opening_id = $2`, [companyId, openingId]);
            const nextVersion = verRes.rows[0].max_ver + 1;
            // Desactivar requisitos antiguos para versionado histórico
            await client.query(`UPDATE opening_requirements SET is_active = FALSE WHERE company_id = $1 AND job_opening_id = $2`, [companyId, openingId]);
            const inserted = [];
            for (const r of requirements) {
                const insRes = await client.query(`INSERT INTO opening_requirements (
             company_id, job_opening_id, version, code, title, description,
             requirement_type, rule_type, rule_config, weight_score,
             required_document_type, order_index, is_active
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
           RETURNING *`, [
                    companyId,
                    openingId,
                    nextVersion,
                    r.code,
                    r.title,
                    r.description || null,
                    r.requirement_type,
                    r.rule_type,
                    JSON.stringify(r.rule_config),
                    r.weight_score,
                    r.required_document_type || null,
                    r.order_index,
                    r.is_active,
                ]);
                inserted.push(insRes.rows[0]);
            }
            // Registro de Auditoría
            await client.query(`INSERT INTO audit_logs (company_id, user_id, action, resource, resource_id, details)
         VALUES ($1, $2, 'update_opening_requirements', 'job_openings', $3, $4)`, [
                companyId,
                req.user.id,
                openingId,
                JSON.stringify({ version: nextVersion, count: inserted.length, totalScoreableWeight }),
            ]);
            return { nextVersion, totalScoreableWeight, requirements: inserted };
        });
        res.json({
            message: `Requisitos guardados exitosamente (Versión ${result.nextVersion}).`,
            totalScoreableWeight: result.totalScoreableWeight,
            requirements: result.requirements,
        });
    }
    catch (err) {
        console.error('Error en saveOpeningRequirements:', err);
        res.status(500).json({ error: 'Error al guardar requisitos de la convocatoria.' });
    }
}
// ─── 3. EVALUAR UNA POSTULACIÓN CON EL MOTOR ──────────────────────────────────
async function evaluateApplicationEndpoint(req, res) {
    try {
        const companyId = req.user.companyId;
        const { id: applicationId } = req.params;
        // 1. Cargar aplicación, candidato, vacante, requisitos y documentos
        const appRes = await db_1.default.query(`SELECT * FROM applications WHERE id = $1 AND company_id = $2`, [applicationId, companyId]);
        if (appRes.rows.length === 0) {
            res.status(404).json({ error: 'Postulación no encontrada.' });
            return;
        }
        const application = appRes.rows[0];
        const [candRes, openRes, reqRes, docRes] = await Promise.all([
            db_1.default.query(`SELECT * FROM candidates WHERE id = $1 AND company_id = $2`, [application.candidate_id, companyId]),
            db_1.default.query(`SELECT * FROM job_openings WHERE id = $1 AND company_id = $2`, [application.job_opening_id, companyId]),
            db_1.default.query(`SELECT * FROM opening_requirements WHERE job_opening_id = $1 AND company_id = $2 AND is_active = TRUE ORDER BY order_index ASC`, [application.job_opening_id, companyId]),
            db_1.default.query(`SELECT * FROM application_documents WHERE application_id = $1 AND company_id = $2`, [application.id, companyId]),
        ]);
        if (candRes.rows.length === 0 || openRes.rows.length === 0) {
            res.status(404).json({ error: 'Candidato o vacante no encontrados.' });
            return;
        }
        const candidate = candRes.rows[0];
        const opening = openRes.rows[0];
        const requirements = reqRes.rows;
        const documents = docRes.rows;
        // 2. Ejecutar motor de evaluación de dominio puro
        const evalOutput = evaluation_engine_1.EvaluationEngine.evaluate({
            application,
            candidate,
            opening,
            requirements,
            documents,
        });
        // 3. Persistir evaluaciones y actualizar aplicación en transacción
        await db_1.default.transaction(async (client) => {
            // Limpiar evaluaciones anteriores de esta postulación
            await client.query(`DELETE FROM application_evaluations WHERE application_id = $1`, [application.id]);
            // Insertar nuevas evaluaciones individuales por requisito
            for (const ev of evalOutput.evaluations) {
                await client.query(`INSERT INTO application_evaluations (
             company_id, application_id, requirement_id, result, score_earned,
             max_score, source_type, declared_value, extracted_value,
             accredited_value, evidence_document_id, confidence_score,
             discrepancy_detected, discrepancy_details, evaluation_notes,
             is_overridden, evaluated_at
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW())`, [
                    companyId,
                    application.id,
                    ev.requirement_id,
                    ev.result,
                    ev.score_earned,
                    ev.max_score,
                    ev.source_type,
                    JSON.stringify(ev.declared_value || {}),
                    JSON.stringify(ev.extracted_value || {}),
                    JSON.stringify(ev.accredited_value || {}),
                    ev.evidence_document_id || null,
                    ev.confidence_score || 100,
                    ev.discrepancy_detected,
                    JSON.stringify(ev.discrepancy_details || {}),
                    ev.evaluation_notes || null,
                    false,
                ]);
            }
            // Actualizar estado global y scores en applications (incluyendo expediente_score)
            await client.query(`UPDATE applications
         SET prefilter_status = $1,
             prefilter_score = $2,
             expediente_score = $3,
             prefilter_breakdown = $4,
             total_accredited_exp_months = $5,
             total_declared_exp_months = $6,
             discrepancies_count = $7,
             evaluation_snapshot = $8,
             rejection_reason = $9,
             compatibility_score = $2,
             evaluated_at = NOW(),
             updated_at = NOW()
         WHERE id = $10`, [
                evalOutput.prefilterStatus,
                evalOutput.prefilterScore,
                evalOutput.expedienteScore || 0,
                JSON.stringify(evalOutput.prefilterBreakdown),
                evalOutput.totalAccreditedMonths,
                evalOutput.totalDeclaredMonths,
                evalOutput.discrepanciesCount,
                JSON.stringify(evalOutput.snapshot),
                evalOutput.rejectionReason || null,
                application.id,
            ]);
        });
        res.json({
            message: 'Postulación evaluada exitosamente con el motor de reglas.',
            applicationId: application.id,
            prefilterStatus: evalOutput.prefilterStatus,
            prefilterScore: evalOutput.prefilterScore,
            breakdown: evalOutput.prefilterBreakdown,
            discrepancies: evalOutput.discrepancies,
        });
    }
    catch (err) {
        console.error('Error en evaluateApplicationEndpoint:', err);
        res.status(500).json({ error: 'Error al evaluar postulación.' });
    }
}
// ─── 4. EVALUAR TODAS LAS POSTULACIONES DE UNA CONVOCATORIA (BATCH) ──────────
// ─── 4. EVALUAR TODAS LAS POSTULACIONES DE UNA CONVOCATORIA (BATCH OPTIMIZADO) ─
async function evaluateAllOpeningApplications(req, res) {
    try {
        const companyId = req.user.companyId;
        const { id: openingId } = req.params;
        // 1. Cargar vacante y requisitos activos UNA SOLA VEZ
        const [openRes, reqRes] = await Promise.all([
            db_1.default.query(`SELECT * FROM job_openings WHERE id = $1 AND company_id = $2`, [openingId, companyId]),
            db_1.default.query(`SELECT * FROM opening_requirements WHERE job_opening_id = $1 AND is_active = TRUE`, [openingId]),
        ]);
        const opening = openRes.rows[0];
        if (!opening) {
            res.status(404).json({ error: 'Convocatoria no encontrada.' });
            return;
        }
        const requirements = reqRes.rows;
        // 2. Cargar todas las postulaciones y sus candidatos en un solo SELECT con JOIN
        const { rows: appsWithCandidates } = await db_1.default.query(`SELECT 
         a.*,
         c.id AS c_id,
         c.document_type AS c_document_type,
         c.document_number AS c_document_number,
         c.first_name AS c_first_name,
         c.last_name AS c_last_name,
         c.phone AS c_phone,
         c.height_cm AS c_height_cm,
         c.weight_kg AS c_weight_kg,
         c.sucamec_status AS c_sucamec_status,
         c.sucamec_code AS c_sucamec_code,
         c.sucamec_expires_at AS c_sucamec_expires_at,
         c.gun_license AS c_gun_license,
         c.gun_license_type AS c_gun_license_type,
         c.driver_license AS c_driver_license,
         c.driver_license_type AS c_driver_license_type,
         c.military_service AS c_military_service,
         c.security_experience_years AS c_security_experience_years,
         c.birth_date AS c_birth_date,
         c.structured_profile AS c_structured_profile
       FROM applications a
       JOIN candidates c ON a.candidate_id = c.id
       WHERE a.company_id = $1 AND a.job_opening_id = $2`, [companyId, openingId]);
        if (appsWithCandidates.length === 0) {
            res.json({ message: 'No hay postulaciones registradas en esta convocatoria.', evaluatedCount: 0 });
            return;
        }
        // 3. Cargar todos los documentos de estas aplicaciones en una sola consulta
        const appIds = appsWithCandidates.map(a => a.id);
        const { rows: allDocs } = await db_1.default.query(`SELECT * FROM application_documents WHERE application_id = ANY($1)`, [appIds]);
        const docsByApp = new Map();
        for (const doc of allDocs) {
            const list = docsByApp.get(doc.application_id) || [];
            list.push(doc);
            docsByApp.set(doc.application_id, list);
        }
        // 4. Evaluar en memoria y actualizar mediante transacción
        let evaluatedCount = 0;
        await db_1.default.transaction(async (client) => {
            for (const row of appsWithCandidates) {
                const candidate = {
                    id: row.c_id,
                    company_id: companyId,
                    document_type: row.c_document_type || 'DNI',
                    document_number: row.c_document_number || '',
                    first_name: row.c_first_name || '',
                    last_name: row.c_last_name || '',
                    phone: row.c_phone || '',
                    height_cm: row.c_height_cm,
                    weight_kg: row.c_weight_kg,
                    sucamec_status: row.c_sucamec_status,
                    sucamec_code: row.c_sucamec_code,
                    sucamec_expires_at: row.c_sucamec_expires_at,
                    gun_license: row.c_gun_license,
                    gun_license_type: row.c_gun_license_type,
                    driver_license: row.c_driver_license,
                    driver_license_type: row.c_driver_license_type,
                    military_service: row.c_military_service,
                    security_experience_years: row.c_security_experience_years,
                    birth_date: row.c_birth_date,
                    structured_profile: row.c_structured_profile,
                    created_at: row.created_at,
                    updated_at: row.updated_at,
                };
                const docs = docsByApp.get(row.id) || [];
                const evalOutput = evaluation_engine_1.EvaluationEngine.evaluate({
                    application: row,
                    candidate,
                    opening,
                    requirements,
                    documents: docs,
                });
                await client.query(`UPDATE applications
           SET prefilter_status = $1,
               prefilter_score = $2,
               expediente_score = $3,
               prefilter_breakdown = $4,
               total_accredited_exp_months = $5,
               total_declared_exp_months = $6,
               discrepancies_count = $7,
               evaluation_snapshot = $8,
               compatibility_score = $2,
               evaluated_at = NOW(),
               updated_at = NOW()
           WHERE id = $9`, [
                    evalOutput.prefilterStatus,
                    evalOutput.prefilterScore,
                    evalOutput.expedienteScore || 0,
                    JSON.stringify(evalOutput.prefilterBreakdown),
                    evalOutput.totalAccreditedMonths,
                    evalOutput.totalDeclaredMonths,
                    evalOutput.discrepanciesCount,
                    JSON.stringify(evalOutput.snapshot),
                    row.id,
                ]);
                evaluatedCount++;
            }
        });
        res.json({ message: `Se evaluaron ${evaluatedCount} postulaciones con las reglas vigentes en lote.`, evaluatedCount });
    }
    catch (err) {
        console.error('Error en evaluateAllOpeningApplications:', err);
        res.status(500).json({ error: 'Error al evaluar postulaciones en lote.' });
    }
}
// ─── 5. OBTENER DETALLE EXPLICABLE DE EVALUACIÓN ("¿POR QUÉ ESTE RESULTADO?") ─
async function getApplicationEvaluation(req, res) {
    try {
        const companyId = req.user.companyId;
        const { id: applicationId } = req.params;
        // Obtener aplicación con datos de candidato y vacante
        const appRes = await db_1.default.query(`SELECT 
         a.*,
         c.first_name AS candidate_first_name,
         c.last_name AS candidate_last_name,
         c.document_number AS candidate_document_number,
         c.phone AS candidate_phone,
         c.email AS candidate_email,
         c.sucamec_status AS candidate_sucamec_status,
         c.height_cm AS candidate_height_cm,
         c.birth_date AS candidate_birth_date,
         jo.title AS job_title,
         jo.position_type AS job_position_type,
         jo.location AS job_location
       FROM applications a
       JOIN candidates c ON a.candidate_id = c.id
       JOIN job_openings jo ON a.job_opening_id = jo.id
       WHERE a.id = $1 AND a.company_id = $2`, [applicationId, companyId]);
        if (appRes.rows.length === 0) {
            res.status(404).json({ error: 'Postulación no encontrada.' });
            return;
        }
        const app = appRes.rows[0];
        // Obtener las evaluaciones individuales de requisitos con joins a evidencias
        const evalsRes = await db_1.default.query(`SELECT 
         ae.*,
         r.title AS requirement_title,
         r.code AS requirement_code,
         r.requirement_type,
         r.rule_type,
         r.weight_score,
         ad.file_name AS evidence_file_name,
         ad.file_path AS evidence_file_path,
         u.full_name AS overridden_by_name
       FROM application_evaluations ae
       JOIN opening_requirements r ON ae.requirement_id = r.id
       LEFT JOIN application_documents ad ON ae.evidence_document_id = ad.id
       LEFT JOIN users u ON ae.overridden_by = u.id
       WHERE ae.application_id = $1 AND ae.company_id = $2
       ORDER BY r.order_index ASC, ae.evaluated_at DESC`, [applicationId, companyId]);
        // Obtener todos los documentos adjuntos
        const docsRes = await db_1.default.query(`SELECT * FROM application_documents WHERE application_id = $1 AND company_id = $2 ORDER BY uploaded_at ASC`, [applicationId, companyId]);
        res.json({
            application: app,
            evaluations: evalsRes.rows,
            documents: docsRes.rows,
            breakdown: app.prefilter_breakdown,
            snapshot: app.evaluation_snapshot,
        });
    }
    catch (err) {
        console.error('Error en getApplicationEvaluation:', err);
        res.status(500).json({ error: 'Error al obtener detalle de evaluación.' });
    }
}
// ─── 6. OVERRIDE HUMANO (DECISIÓN MANUAL DE RECLUTADOR CON AUDITORÍA) ─────────
const overrideSchema = zod_1.z.object({
    evaluationId: zod_1.z.string().uuid(),
    newResult: zod_1.z.enum(['pass', 'review', 'fail']),
    overrideReason: zod_1.z.string().min(5, 'Debe especificar un motivo detallado para el override.'),
    newScoreEarned: zod_1.z.number().optional(),
});
async function overrideEvaluationEndpoint(req, res) {
    try {
        const companyId = req.user.companyId;
        const userId = req.user.id;
        const { id: applicationId } = req.params;
        const parsed = overrideSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ error: 'Datos de override inválidos.', details: parsed.error.issues });
            return;
        }
        const { evaluationId, newResult, overrideReason, newScoreEarned } = parsed.data;
        // Verificar existencia de la evaluación
        const evalRes = await db_1.default.query(`SELECT * FROM application_evaluations WHERE id = $1 AND application_id = $2 AND company_id = $3`, [evaluationId, applicationId, companyId]);
        if (evalRes.rows.length === 0) {
            res.status(404).json({ error: 'Registro de evaluación no encontrado.' });
            return;
        }
        const prevEval = evalRes.rows[0];
        // Pre-calcular el score a escribir antes de la query para evitar ambigüedad de tipos
        const finalScore = newScoreEarned !== undefined
            ? newScoreEarned
            : (newResult === 'pass' ? Number(prevEval.max_score) : 0);
        await db_1.default.transaction(async (client) => {
            // 1. Actualizar la evaluación con score pre-calculado en JS y source_type verified_human
            await client.query(`UPDATE application_evaluations
         SET result = $1,
             score_earned = $2,
             source_type = 'verified_human',
             is_overridden = TRUE,
             overridden_by = $3,
             overridden_at = NOW(),
             override_reason = $4
         WHERE id = $5`, [newResult, finalScore, userId, overrideReason, evaluationId]);
            // 2. Registrar en audit_logs
            await client.query(`INSERT INTO audit_logs (company_id, user_id, action, resource, resource_id, details)
         VALUES ($1, $2, 'human_evaluation_override', 'application_evaluations', $3, $4)`, [
                companyId,
                userId,
                evaluationId,
                JSON.stringify({
                    applicationId,
                    requirementId: prevEval.requirement_id,
                    previousResult: prevEval.result,
                    newResult,
                    previousScore: prevEval.score_earned,
                    newScore: newScoreEarned,
                    overrideReason,
                }),
            ]);
            // 3. Recalcular el estado global de la postulación
            const allEvalsRes = await client.query(`SELECT ae.*, r.requirement_type 
         FROM application_evaluations ae
         JOIN opening_requirements r ON ae.requirement_id = r.id
         WHERE ae.application_id = $1`, [applicationId]);
            let hasFail = false;
            let hasReview = false;
            let totalEarned = 0;
            let totalMax = 0;
            for (const e of allEvalsRes.rows) {
                if (e.requirement_type === 'eliminatory' || e.requirement_type === 'eliminatory_scoreable') {
                    if (e.result === 'fail')
                        hasFail = true;
                }
                if (e.result === 'review')
                    hasReview = true;
                totalEarned += Number(e.score_earned);
                totalMax += Number(e.max_score);
            }
            let newStatus = 'eligible';
            if (hasFail)
                newStatus = 'ineligible';
            else if (hasReview)
                newStatus = 'review';
            const newScore = totalMax > 0 ? Math.round((totalEarned / totalMax) * 10000) / 100 : 50;
            await client.query(`UPDATE applications
         SET prefilter_status = $1,
             prefilter_score = $2,
             compatibility_score = $2,
             updated_at = NOW()
         WHERE id = $3`, [newStatus, newScore, applicationId]);
        });
        res.json({ message: 'Override registrado y auditado correctamente.' });
    }
    catch (err) {
        console.error('Error en overrideEvaluationEndpoint:', err);
        res.status(500).json({ error: 'Error al registrar override.' });
    }
}
// ─── 7. RANKING DE CANDIDATOS POR CONVOCATORIA (TOP TALENTO DUAL FIT + EXPEDIENTE)
async function getOpeningRanking(req, res) {
    try {
        const companyId = req.user.companyId;
        const { id: openingId } = req.params;
        const { statusFilter, minScore, limit } = req.query;
        let query = `
      SELECT 
        a.id AS application_id,
        a.application_code,
        a.prefilter_status,
        a.prefilter_score,
        COALESCE(a.expediente_score, 0) AS expediente_score,
        a.total_accredited_exp_months,
        a.total_declared_exp_months,
        a.discrepancies_count,
        a.submitted_at,
        a.evaluated_at,
        c.id AS candidate_id,
        c.first_name,
        c.last_name,
        c.document_number,
        c.phone,
        c.email,
        c.sucamec_status,
        c.gun_license,
        c.driver_license,
        c.military_service,
        jo.title AS job_title,
        (SELECT COUNT(*) FROM application_documents WHERE application_id = a.id) AS documents_count
      FROM applications a
      JOIN candidates c ON a.candidate_id = c.id
      JOIN job_openings jo ON a.job_opening_id = jo.id
      WHERE a.company_id = $1 AND a.job_opening_id = $2
    `;
        const params = [companyId, openingId];
        if (statusFilter && statusFilter !== 'all') {
            params.push(statusFilter);
            query += ` AND a.prefilter_status = $${params.length}`;
        }
        if (minScore) {
            params.push(Number(minScore));
            query += ` AND a.prefilter_score >= $${params.length}`;
        }
        // Ordenamiento por Prioridad de Negocio Multidimensional:
        // 1. Elegibles primero ('eligible' > 'review' > 'pending' > 'ineligible')
        // 2. Mayor compatibilidad / prefilter_score DESC (FitScore)
        // 3. Mayor calidad de legajo / expediente_score DESC
        // 4. Mayor experiencia acreditada DESC
        // 5. Menor cantidad de discrepancias ASC
        // 6. Fecha de postulación más temprana
        query += `
      ORDER BY 
        CASE 
          WHEN a.prefilter_status = 'eligible' THEN 1
          WHEN a.prefilter_status = 'review' THEN 2
          WHEN a.prefilter_status = 'pending' THEN 3
          ELSE 4
        END ASC,
        a.prefilter_score DESC,
        COALESCE(a.expediente_score, 0) DESC,
        a.total_accredited_exp_months DESC,
        a.discrepancies_count ASC,
        a.submitted_at ASC
    `;
        if (limit && Number(limit) > 0) {
            params.push(Number(limit));
            query += ` LIMIT $${params.length}`;
        }
        const { rows } = await db_1.default.query(query, params);
        // Asignar posición de ranking calculada
        const rankedList = rows.map((r, idx) => ({
            rankPosition: idx + 1,
            ...r,
        }));
        res.json(rankedList);
    }
    catch (err) {
        console.error('Error en getOpeningRanking:', err);
        res.status(500).json({ error: 'Error al obtener ranking de la convocatoria.' });
    }
}
// ─── 8. RESUMEN DE MÉTRICAS DEL MOTOR DE PREFILTRO ────────────────────────────
async function getEvaluationSummary(req, res) {
    try {
        const companyId = req.user.companyId;
        const { id: openingId } = req.params;
        const { rows } = await db_1.default.query(`SELECT 
         COUNT(*) AS total_applicants,
         COUNT(*) FILTER (WHERE prefilter_status = 'eligible') AS eligible_count,
         COUNT(*) FILTER (WHERE prefilter_status = 'review') AS review_count,
         COUNT(*) FILTER (WHERE prefilter_status = 'ineligible') AS ineligible_count,
         COUNT(*) FILTER (WHERE prefilter_status = 'pending') AS pending_count,
         COALESCE(AVG(prefilter_score) FILTER (WHERE prefilter_status = 'eligible'), 0) AS avg_eligible_score,
         COALESCE(AVG(prefilter_score), 0) AS avg_global_score,
         COUNT(*) FILTER (WHERE discrepancies_count > 0) AS with_discrepancies_count
       FROM applications
       WHERE company_id = $1 AND job_opening_id = $2`, [companyId, openingId]);
        res.json(rows[0]);
    }
    catch (err) {
        console.error('Error en getEvaluationSummary:', err);
        res.status(500).json({ error: 'Error al obtener resumen de métricas.' });
    }
}
//# sourceMappingURL=prefilter.controller.js.map