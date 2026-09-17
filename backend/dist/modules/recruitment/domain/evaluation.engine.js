"use strict";
/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * MOTOR INTELIGENTE DE PREFILTRO, EVALUACIÓN DOCUMENTAL Y RANKING
 * Security Force P&V S.A.C.
 *
 * Principios:
 * 1. Cero porcentajes inventados — Puntaje 100% explicable y auditable.
 * 2. 3 Fuentes separadas: Declarado vs Extraído vs Acreditado.
 * 3. Cálculo de experiencia laboral con fusión de intervalos (cero doble conteo).
 * 4. Detección de discrepancias con severidad (Low/Med/High) que disparan 'review'.
 * 5. Requisitos eliminatorios prioritarios: Un fallo eliminatorio excluye del ranking de aptos.
 * ═══════════════════════════════════════════════════════════════════════════════
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvaluationEngine = void 0;
exports.parseExperienceDate = parseExperienceDate;
exports.diffMonths = diffMonths;
exports.mergeIntervals = mergeIntervals;
exports.calculateNonOverlappingMonths = calculateNonOverlappingMonths;
exports.calculateAge = calculateAge;
const document_validity_policy_1 = require("./validity/document-validity.policy");
/**
 * Convierte un string de fecha (YYYY-MM, YYYY-MM-DD o 'Actual') a Date.
 */
function parseExperienceDate(dateStr, isEnd = false) {
    if (!dateStr || dateStr.toLowerCase() === 'actual' || dateStr.toLowerCase() === 'presente' || dateStr.toLowerCase() === 'hoy') {
        return new Date();
    }
    const clean = dateStr.trim();
    if (/^\d{4}-\d{2}$/.test(clean)) {
        const [year, month] = clean.split('-').map(Number);
        if (isEnd) {
            // Fin de mes
            return new Date(year, month, 0);
        }
        return new Date(year, month - 1, 1);
    }
    const parsed = new Date(clean);
    return isNaN(parsed.getTime()) ? new Date() : parsed;
}
/**
 * Calcula la diferencia en meses entre dos fechas de forma precisa.
 */
function diffMonths(d1, d2) {
    let months = (d2.getFullYear() - d1.getFullYear()) * 12 + (d2.getMonth() - d1.getMonth());
    if (d2.getDate() >= d1.getDate()) {
        months += 1; // Incluye el mes en curso si se completó
    }
    return Math.max(1, months);
}
/**
 * Fusiona intervalos superpuestos para evitar duplicidad de meses laborados.
 */
function mergeIntervals(intervals) {
    if (intervals.length === 0)
        return [];
    // Ordenar por fecha de inicio
    const sorted = [...intervals].sort((a, b) => a.start.getTime() - b.start.getTime());
    const merged = [sorted[0]];
    for (let i = 1; i < sorted.length; i++) {
        const current = sorted[i];
        const prev = merged[merged.length - 1];
        if (current.start.getTime() <= prev.end.getTime()) {
            // Superposición detectada: fusionar extendiendo el fin
            prev.end = new Date(Math.max(prev.end.getTime(), current.end.getTime()));
        }
        else {
            merged.push(current);
        }
    }
    return merged;
}
/**
 * Calcula el total de meses laborados sin duplicidad.
 */
function calculateNonOverlappingMonths(experiences, positionFilter) {
    if (!experiences || experiences.length === 0)
        return 0;
    const validIntervals = [];
    for (const exp of experiences) {
        if (!exp.startDate)
            continue;
        if (positionFilter && !positionFilter.test(exp.position)) {
            continue;
        }
        const start = parseExperienceDate(exp.startDate, false);
        const end = parseExperienceDate(exp.endDate, true);
        if (start <= end) {
            validIntervals.push({ start, end });
        }
    }
    const merged = mergeIntervals(validIntervals);
    let totalMonths = 0;
    for (const interval of merged) {
        totalMonths += diffMonths(interval.start, interval.end);
    }
    return totalMonths;
}
/**
 * Calcula la edad exacta en años a partir de una fecha de nacimiento.
 */
function calculateAge(birthDateStr) {
    if (!birthDateStr)
        return 0;
    const birth = new Date(birthDateStr);
    if (isNaN(birth.getTime()))
        return 0;
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    return Math.max(0, age);
}
// ─── 2. MOTOR PRINCIPAL DE EVALUACIÓN ─────────────────────────────────────────
class EvaluationEngine {
    /**
     * Ejecuta el prefiltro completo sobre una postulación.
     */
    static evaluate(input) {
        const { application, candidate, requirements, documents } = input;
        const structuredProfile = candidate.structured_profile || { experiences: [], education: [], courses: [], skills: [] };
        const experiences = structuredProfile.experiences || [];
        // A. Experiencias declaradas vs acreditadas
        const totalDeclaredMonths = candidate.security_experience_years
            ? candidate.security_experience_years * 12
            : calculateNonOverlappingMonths(experiences);
        // Documentos que acreditan experiencia laboral
        const workCertDocs = documents.filter((d) => d.document_type === 'cert_trabajo' || d.document_type === 'cul' || d.document_type === 'cv');
        const hasWorkCertificates = workCertDocs.some((d) => d.document_type === 'cert_trabajo');
        // Experiencia acreditada (si tiene certificados formales, tomamos el cálculo de intervalos)
        const totalAccreditedMonths = hasWorkCertificates
            ? calculateNonOverlappingMonths(experiences)
            : Math.min(totalDeclaredMonths, calculateNonOverlappingMonths(experiences));
        const evaluations = [];
        const discrepancies = [];
        let hasEliminatoryFail = false;
        let failingReason = '';
        let hasReviewItem = false;
        let hasPendingItem = false;
        // B. Detectar discrepancia CONTEXTUAL en experiencia (Fase 2.7.1)
        // Encontrar el requisito mínimo de experiencia de la vacante para evaluar el impacto
        const expReq = requirements.find((r) => r.rule_type === 'experience_total' && r.is_active);
        const minRequiredMonths = expReq?.rule_config?.minMonths ? Number(expReq.rule_config.minMonths) : 12;
        if (candidate.security_experience_years) {
            const declaredMonths = candidate.security_experience_years * 12;
            const diffMonthsCount = Math.abs(declaredMonths - totalAccreditedMonths);
            if (diffMonthsCount > 6) {
                // Evaluación Contextual de Gravedad:
                // Caso 1: Declaró cumplir el mínimo, pero lo acreditado queda POR DEBAJO del requisito -> Severidad HIGH (Crítico, altera elegibilidad)
                const altersEligibility = declaredMonths >= minRequiredMonths && totalAccreditedMonths < minRequiredMonths;
                // Caso 2: Ambos superan holgadamente el requisito (ej. Req=12m, Decl=36m, Acred=30m) -> Severidad LOW si la brecha es pequeña
                const bothComfortablyExceed = totalAccreditedMonths >= minRequiredMonths * 1.5 && declaredMonths >= minRequiredMonths;
                let severity = 'low';
                if (altersEligibility || diffMonthsCount > 24) {
                    severity = 'high';
                }
                else if (bothComfortablyExceed && diffMonthsCount <= 12) {
                    severity = 'low';
                }
                else {
                    severity = 'medium';
                }
                discrepancies.push({
                    field: 'security_experience_years',
                    declaredValue: `${candidate.security_experience_years} años (${declaredMonths} meses)`,
                    accreditedValue: `${Math.floor(totalAccreditedMonths / 12)} años y ${totalAccreditedMonths % 12} meses (${totalAccreditedMonths} meses)`,
                    differenceDescription: altersEligibility
                        ? `Diferencia crítica de ${diffMonthsCount} meses: la experiencia acreditada (${totalAccreditedMonths}m) no alcanza el mínimo requerido (${minRequiredMonths}m), a pesar de haber declarado ${declaredMonths}m.`
                        : `Diferencia de ${diffMonthsCount} meses entre experiencia declarada y acreditada (Ambos superan el umbral de ${minRequiredMonths} meses).`,
                    severity,
                });
                if (severity === 'high') {
                    hasReviewItem = true;
                }
            }
        }
        // C. Evaluar cada requisito configurado por el Administrador
        for (const req of requirements) {
            if (!req.is_active)
                continue;
            const evalResult = this.evaluateSingleRequirement({
                req,
                candidate,
                structuredProfile,
                documents,
                totalAccreditedMonths,
                totalDeclaredMonths,
            });
            evaluations.push(evalResult);
            if (evalResult.discrepancy_detected && evalResult.discrepancy_details) {
                discrepancies.push(evalResult.discrepancy_details);
            }
            // Jerarquía de estados
            if (req.requirement_type === 'eliminatory' || req.requirement_type === 'eliminatory_scoreable') {
                if (evalResult.result === 'fail') {
                    hasEliminatoryFail = true;
                    if (!failingReason) {
                        failingReason = `No cumple requisito obligatorio: ${req.title}. (${evalResult.evaluation_notes || ''})`;
                    }
                }
            }
            if (evalResult.result === 'review') {
                hasReviewItem = true;
            }
            else if (evalResult.result === 'pending') {
                hasPendingItem = true;
            }
        }
        // D. Determinar Estado Global de la Postulación
        let prefilterStatus = 'eligible';
        const hasCriticalDiscrepancy = discrepancies.some((d) => d.severity === 'high' || d.severity === 'medium');
        if (hasEliminatoryFail) {
            prefilterStatus = 'ineligible';
        }
        else if (hasReviewItem || hasCriticalDiscrepancy) {
            prefilterStatus = 'review';
        }
        else if (hasPendingItem) {
            prefilterStatus = 'pending';
        }
        // E. Calcular Puntaje Explicable (0 a 100)
        let totalScoreEarned = 0;
        let totalMaxScore = 0;
        const rubricItems = [];
        const reasons = [];
        for (const ev of evaluations) {
            if (ev.max_score > 0) {
                totalScoreEarned += ev.score_earned;
                totalMaxScore += ev.max_score;
                rubricItems.push({
                    code: ev.requirement_code || 'REQ',
                    title: ev.requirement_title || 'Requisito',
                    earned: ev.score_earned,
                    max: ev.max_score,
                    weightPercent: ev.max_score,
                    result: ev.result,
                    notes: ev.evaluation_notes,
                });
            }
        }
        // Normalización del puntaje a base 100
        const normalizedPercentage = totalMaxScore > 0
            ? Math.round((totalScoreEarned / totalMaxScore) * 10000) / 100
            : 50.0;
        // Generar explicaciones en lenguaje natural
        if (prefilterStatus === 'eligible') {
            reasons.push('Cumple el 100% de requisitos obligatorios eliminatorios.');
            reasons.push(`Experiencia total acreditada: ${Math.floor(totalAccreditedMonths / 12)} años y ${totalAccreditedMonths % 12} meses sin superposiciones.`);
            reasons.push(`Puntuación obtenida: ${totalScoreEarned}/${totalMaxScore} pts (${normalizedPercentage}% de compatibilidad).`);
        }
        else if (prefilterStatus === 'review') {
            reasons.push('No presenta descalificación definitiva, pero requiere revisión humana.');
            if (discrepancies.length > 0) {
                reasons.push(`Se detectaron ${discrepancies.length} observación(es) documental(es).`);
            }
        }
        else if (prefilterStatus === 'ineligible') {
            reasons.push(`Descalificado: ${failingReason}`);
        }
        // F. Calcular Calidad del Expediente Documental (0 a 100)
        const expedienteScore = this.calculateExpedienteScore(documents);
        const prefilterBreakdown = {
            totalEarned: totalScoreEarned,
            maxPossible: totalMaxScore,
            normalizedPercentage,
            rubric: rubricItems,
            reasons,
            summaryExplanation: reasons.join(' '),
            expedienteScore,
        };
        // Snapshot inmutable para auditoría y reproducibilidad histórica
        const snapshot = {
            evaluatedAt: new Date().toISOString(),
            status: prefilterStatus,
            score: normalizedPercentage,
            expedienteScore,
            totalAccreditedMonths,
            totalDeclaredMonths,
            discrepanciesCount: discrepancies.length,
            requirementsCount: requirements.length,
            evaluationsSummary: evaluations.map((e) => ({
                code: e.requirement_code,
                result: e.result,
                scoreEarned: e.score_earned,
                maxScore: e.max_score,
            })),
        };
        return {
            prefilterStatus,
            prefilterScore: normalizedPercentage,
            expedienteScore,
            prefilterBreakdown,
            evaluations,
            totalAccreditedMonths,
            totalDeclaredMonths,
            discrepanciesCount: discrepancies.length,
            discrepancies,
            snapshot,
            rejectionReason: hasEliminatoryFail ? failingReason : undefined,
        };
    }
    /**
     * Evalúa la completitud, legibilidad y vigencia documental del expediente del candidato (0 a 100).
     */
    static calculateExpedienteScore(documents) {
        if (!documents || documents.length === 0)
            return 0;
        let score = 0;
        const hasCV = documents.some((d) => d.document_type === 'cv');
        const hasCUL = documents.some((d) => d.document_type === 'cul');
        const hasCertTrabajo = documents.some((d) => d.document_type === 'cert_trabajo');
        const hasIdentityOrPhoto = documents.some((d) => d.document_type === 'dni' || d.document_type === 'sucamec' || d.document_type === 'foto');
        if (hasCV)
            score += 25;
        if (hasCUL)
            score += 35;
        if (hasCertTrabajo)
            score += 25;
        if (hasIdentityOrPhoto)
            score += 15;
        // Ajustes por calidad documental individual
        for (const doc of documents) {
            if (doc.status === 'vencido')
                score -= 25;
            else if (doc.status === 'ilegible')
                score -= 20;
            else if (doc.status === 'incompleto')
                score -= 15;
            else if (doc.status === 'observado')
                score -= 10;
        }
        return Math.max(0, Math.min(100, score));
    }
    // ─── 3. EVALUADOR INDIVIDUAL DE REQUISITOS ───────────────────────────────────
    static evaluateSingleRequirement(params) {
        const { req, candidate, structuredProfile, documents, totalAccreditedMonths } = params;
        const cfg = req.rule_config || {};
        const maxScore = Number(req.weight_score) || 0;
        let result = 'pass';
        let scoreEarned = 0;
        let sourceType = 'declared';
        let declaredVal = null;
        let extractedVal = null;
        let accreditedVal = null;
        let evidenceDocId;
        let confidenceScore = 100;
        let discrepancyDetected = false;
        let discrepancyDetails;
        let notes = '';
        // Encontrar documento de evidencia si aplica
        if (req.required_document_type) {
            const matchDoc = documents.find((d) => d.document_type === req.required_document_type);
            if (matchDoc) {
                evidenceDocId = matchDoc.id;
                sourceType = 'accredited';
            }
        }
        switch (req.rule_type) {
            // ─── REGLA: RANGO DE EDAD ───────────────────────────────────────────────
            case 'range': {
                const age = calculateAge(candidate.birth_date);
                declaredVal = { age, birthDate: candidate.birth_date };
                if (!candidate.birth_date) {
                    result = 'review';
                    notes = 'Fecha de nacimiento no especificada.';
                }
                else {
                    const min = cfg.min !== undefined ? Number(cfg.min) : 18;
                    const max = cfg.max !== undefined ? Number(cfg.max) : 70;
                    if (age >= min && age <= max) {
                        result = 'pass';
                        scoreEarned = maxScore;
                        notes = `Edad válida: ${age} años (Rango requerido: ${min}-${max} años).`;
                    }
                    else {
                        result = 'fail';
                        scoreEarned = 0;
                        notes = `Edad no permitida: ${age} años (Rango requerido: ${min}-${max} años).`;
                    }
                }
                break;
            }
            // ─── REGLA: MÍNIMO NUMÉRICO (EJ: ESTATURA) ──────────────────────────────
            case 'min': {
                const minVal = Number(cfg.min) || 0;
                const candidateVal = Number(candidate.height_cm) || 0;
                declaredVal = { heightCm: candidateVal, minRequired: minVal };
                if (candidateVal >= minVal) {
                    result = 'pass';
                    scoreEarned = maxScore;
                    notes = `Estatura de ${candidateVal} cm cumple el mínimo de ${minVal} cm.`;
                }
                else {
                    result = 'fail';
                    scoreEarned = 0;
                    notes = `Estatura de ${candidateVal} cm no alcanza el mínimo de ${minVal} cm.`;
                }
                break;
            }
            // ─── REGLA: VIGENCIA SUCAMEC / CERTIFICACIONES (Fase 2.7.1 Centralizada)
            case 'validity': {
                const status = candidate.sucamec_status;
                const validityEval = document_validity_policy_1.DocumentValidityPolicy.evaluateValidity(candidate.sucamec_expires_at, {
                    documentName: 'Carné SUCAMEC',
                });
                declaredVal = {
                    sucamecStatus: status,
                    code: candidate.sucamec_code,
                    expiresAt: candidate.sucamec_expires_at,
                    validityEval,
                };
                const sucDoc = documents.find((d) => d.document_type === 'sucamec' || d.document_type === 'cul');
                if (sucDoc) {
                    sourceType = 'accredited';
                    evidenceDocId = sucDoc.id;
                    accreditedVal = { docStatus: sucDoc.status, fileName: sucDoc.file_name };
                }
                // Si la política de vigencia determina que está vencido, prevalece sobre lo declarado
                if (validityEval.isExpired) {
                    result = 'fail';
                    scoreEarned = 0;
                    notes = validityEval.notes;
                    if (status === 'valid') {
                        discrepancyDetected = true;
                        discrepancyDetails = {
                            field: 'sucamec_status',
                            declaredValue: 'Vigente (declarado)',
                            accreditedValue: `Vencido el ${validityEval.normalizedExpiryDate}`,
                            differenceDescription: `El candidato declaró SUCAMEC vigente pero la política de fechas determinó que ya expiró (${validityEval.notes}).`,
                            severity: 'high',
                        };
                    }
                }
                else if (status === 'valid') {
                    result = 'pass';
                    scoreEarned = maxScore;
                    notes = `Carné SUCAMEC vigente (${candidate.sucamec_code || 'Registrado'}). ${validityEval.notes}`;
                }
                else if (status === 'in_process') {
                    if (cfg.allowInProcess) {
                        result = 'review';
                        scoreEarned = maxScore * 0.5; // 50% de puntaje si está en trámite
                        notes = 'Carné SUCAMEC en trámite (permitido condicionalmente para revisión).';
                    }
                    else {
                        result = 'fail';
                        scoreEarned = 0;
                        notes = 'SUCAMEC en trámite no cumple requisito estricto de carné vigente.';
                    }
                }
                else if (status === 'expired') {
                    result = 'fail';
                    scoreEarned = 0;
                    notes = 'Carné SUCAMEC vencido.';
                }
                else {
                    result = 'fail';
                    scoreEarned = 0;
                    notes = 'No cuenta con carné SUCAMEC.';
                }
                break;
            }
            // ─── REGLA: EXPERIENCIA TOTAL EN SEGURIDAD ──────────────────────────────
            case 'experience_total': {
                const minMonths = Number(cfg.minMonths) || 12;
                const maxScoreMonths = Number(cfg.maxScoreMonths) || 36;
                declaredVal = { totalAccreditedMonths, minRequiredMonths: minMonths };
                if (totalAccreditedMonths >= minMonths) {
                    result = 'pass';
                    // Puntuación proporcional entre minMonths y maxScoreMonths
                    if (maxScore > 0) {
                        if (totalAccreditedMonths >= maxScoreMonths) {
                            scoreEarned = maxScore;
                        }
                        else {
                            const ratio = (totalAccreditedMonths - minMonths) / Math.max(1, maxScoreMonths - minMonths);
                            scoreEarned = Math.round((maxScore * 0.7 + maxScore * 0.3 * ratio) * 100) / 100;
                        }
                    }
                    notes = `${totalAccreditedMonths} meses de experiencia cumplen el mínimo de ${minMonths} meses.`;
                }
                else {
                    result = req.requirement_type === 'eliminatory' || req.requirement_type === 'eliminatory_scoreable' ? 'fail' : 'review';
                    scoreEarned = 0;
                    notes = `Experiencia de ${totalAccreditedMonths} meses es inferior a los ${minMonths} meses requeridos.`;
                }
                break;
            }
            // ─── REGLA: EXPERIENCIA ESPECÍFICA (EJ: SUPERVISOR / ESCOLTA) ───────────
            case 'experience_specific': {
                const patternStr = cfg.positionPattern || 'supervisor|escolta|resguardo|cctv';
                const regex = new RegExp(patternStr, 'i');
                const specificMonths = calculateNonOverlappingMonths(structuredProfile.experiences || [], regex);
                const minSpecificMonths = Number(cfg.minMonths) || 12;
                declaredVal = { specificMonths, pattern: patternStr, minRequired: minSpecificMonths };
                if (specificMonths >= minSpecificMonths) {
                    result = 'pass';
                    scoreEarned = maxScore;
                    notes = `Cuenta con ${specificMonths} meses en cargos específicos de ${cfg.positionTitle || patternStr}.`;
                }
                else {
                    result = req.requirement_type === 'eliminatory' ? 'fail' : 'review';
                    scoreEarned = 0;
                    notes = `Registra ${specificMonths} meses específicos (Mínimo solicitado: ${minSpecificMonths} meses).`;
                }
                break;
            }
            // ─── REGLA: EVIDENCIA DOCUMENTAL (CUL / DNI / CERTIFICADOS) ──────────────
            case 'document_evidence': {
                const targetDocType = cfg.documentType || req.required_document_type;
                const matchingDoc = documents.find((d) => d.document_type === targetDocType);
                if (matchingDoc) {
                    evidenceDocId = matchingDoc.id;
                    sourceType = 'accredited';
                    accreditedVal = { fileName: matchingDoc.file_name, status: matchingDoc.status, size: matchingDoc.file_size };
                    result = 'pass';
                    scoreEarned = maxScore;
                    notes = `Documento ${matchingDoc.file_name} adjuntado y verificado.`;
                }
                else {
                    sourceType = 'declared';
                    result = req.requirement_type === 'eliminatory' ? 'fail' : 'review';
                    scoreEarned = 0;
                    notes = `Documento ${req.title} no adjuntado por el postulante.`;
                }
                break;
            }
            // ─── REGLA: BOOLEANA (ARMAS / BREVETE / FFAA) ───────────────────────────
            case 'boolean': {
                const fieldName = cfg.field || 'gun_license';
                const expected = cfg.targetValue !== undefined ? cfg.targetValue : true;
                const actualVal = candidate[fieldName] === true;
                declaredVal = { [fieldName]: actualVal, expected };
                if (actualVal === expected) {
                    result = 'pass';
                    scoreEarned = maxScore;
                    notes = `${req.title}: Cumplido.`;
                }
                else {
                    result = req.requirement_type === 'eliminatory' ? 'fail' : 'review';
                    scoreEarned = 0;
                    notes = `${req.title}: No cuenta con esta acreditación.`;
                }
                break;
            }
            default: {
                result = 'pass';
                scoreEarned = maxScore;
                notes = 'Requisito informativo evaluado.';
                break;
            }
        }
        return {
            company_id: candidate.company_id,
            application_id: candidate.application_id || '',
            requirement_id: req.id,
            result,
            score_earned: scoreEarned,
            max_score: maxScore,
            source_type: sourceType,
            declared_value: declaredVal,
            extracted_value: extractedVal,
            accredited_value: accreditedVal,
            evidence_document_id: evidenceDocId,
            confidence_score: confidenceScore,
            discrepancy_detected: discrepancyDetected,
            discrepancy_details: discrepancyDetails,
            evaluation_notes: notes,
            is_overridden: false,
            evaluated_at: new Date().toISOString(),
            requirement_title: req.title,
            requirement_code: req.code,
            requirement_type: req.requirement_type,
            rule_type: req.rule_type,
        };
    }
}
exports.EvaluationEngine = EvaluationEngine;
//# sourceMappingURL=evaluation.engine.js.map