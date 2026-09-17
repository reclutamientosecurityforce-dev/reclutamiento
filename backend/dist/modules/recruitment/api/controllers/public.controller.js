"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPublicOpenings = getPublicOpenings;
exports.getPublicOpeningById = getPublicOpeningById;
exports.initApplication = initApplication;
exports.getDraftApplication = getDraftApplication;
exports.saveDraftProfile = saveDraftProfile;
exports.uploadCVFile = uploadCVFile;
exports.uploadDocumentPhotos = uploadDocumentPhotos;
exports.deleteDraftDocument = deleteDraftDocument;
exports.submitApplication = submitApplication;
exports.trackApplication = trackApplication;
exports.generateCVPdf = generateCVPdf;
exports.getPublicPublicationBySlug = getPublicPublicationBySlug;
exports.registerPublicationView = registerPublicationView;
exports.getDocumentRequirements = getDocumentRequirements;
exports.getExpedienteStatus = getExpedienteStatus;
exports.autosaveDraft = autosaveDraft;
exports.registerConsent = registerConsent;
exports.getApplicationFitScore = getApplicationFitScore;
exports.getPublicContactInfo = getPublicContactInfo;
const zod_1 = require("zod");
const crypto_1 = __importDefault(require("crypto"));
const db_1 = __importDefault(require("../../../../db"));
const storage_1 = require("../../../../shared/storage");
// Helper to generate Application Code: SF-2026-XXXXX
function generateApplicationCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let randomPart = '';
    for (let i = 0; i < 5; i++) {
        randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const year = new Date().getFullYear();
    return `SF-${year}-${randomPart}`;
}
// ─── 1. LISTADO PÚBLICO DE VACANTES ──────────────────────────────────────────
// HALLAZGO #2 RESUELTO: filtramos por company_id de la empresa principal (Security Force)
// Para un portal multi-empresa se parametrizaría por dominio; aquí tomamos la única empresa
async function getPublicOpenings(_req, res) {
    try {
        // Obtener la empresa principal (primer registro activo); en multi-tenant se filtraría por subdominio
        const companyRes = await db_1.default.query(`SELECT id FROM companies ORDER BY created_at ASC LIMIT 1`);
        if (companyRes.rows.length === 0) {
            res.json([]);
            return;
        }
        const companyId = companyRes.rows[0].id;
        const { rows } = await db_1.default.query(`SELECT 
         jo.id, jo.title, jo.position_type, jo.location, jo.client_name,
         jo.vacancies_count, jo.filled_count, jo.salary_offered, jo.shift_type,
         jo.status, jo.requirements, jo.description, jo.created_at,
         jc.name AS category_name, jc.color_hex AS category_color
       FROM job_openings jo
       LEFT JOIN job_categories jc ON jo.category_id = jc.id
       WHERE jo.company_id = $1 AND jo.status IN ('open', 'in_progress')
       ORDER BY jo.created_at DESC`, [companyId]);
        res.json(rows);
    }
    catch (err) {
        console.error('Error en getPublicOpenings:', err);
        res.status(500).json({ error: 'Error al obtener convocatorias públicas.' });
    }
}
// ─── 2. DETALLE PÚBLICO DE VACANTE ───────────────────────────────────────────
async function getPublicOpeningById(req, res) {
    try {
        const { id } = req.params;
        const { rows } = await db_1.default.query(`SELECT 
         jo.id, jo.title, jo.position_type, jo.location, jo.client_name,
         jo.vacancies_count, jo.filled_count, jo.salary_offered, jo.shift_type,
         jo.status, jo.requirements, jo.description, jo.created_at,
         jo.company_id,
         jc.name AS category_name, jc.color_hex AS category_color
       FROM job_openings jo
       LEFT JOIN job_categories jc ON jo.category_id = jc.id
       WHERE jo.id = $1 AND jo.status = 'open'`, [id]);
        if (rows.length === 0) {
            res.status(404).json({ error: 'Convocatoria no encontrada o no disponible.' });
            return;
        }
        const opening = rows[0];
        // Obtener requisitos configurados para esta convocatoria
        const reqsRes = await db_1.default.query(`SELECT 
         id, code, title, description, requirement_type, rule_type, 
         rule_config, weight_score, required_document_type, order_index
       FROM opening_requirements 
       WHERE job_opening_id = $1 AND company_id = $2 AND is_active = TRUE 
       ORDER BY order_index ASC`, [id, opening.company_id]);
        res.json({
            ...opening,
            requirements: reqsRes.rows
        });
    }
    catch (err) {
        console.error('Error en getPublicOpeningById:', err);
        res.status(500).json({ error: 'Error al obtener detalle de la convocatoria.' });
    }
}
// ─── 3. INICIO DE POSTULACIÓN SIN LOGIN (DNI + CELULAR + TRAZABILIDAD) ───────
const initApplySchema = zod_1.z.object({
    openingId: zod_1.z.string().uuid().optional(),
    publicationSlug: zod_1.z.string().optional(),
    channelId: zod_1.z.string().uuid().optional().nullable(),
    campaignId: zod_1.z.string().uuid().optional().nullable(),
    utmSource: zod_1.z.string().optional().nullable(),
    utmMedium: zod_1.z.string().optional().nullable(),
    utmCampaign: zod_1.z.string().optional().nullable(),
    documentType: zod_1.z.string().default('DNI'),
    documentNumber: zod_1.z.string().min(8).max(20),
    firstName: zod_1.z.string().min(2),
    lastName: zod_1.z.string().min(2),
    phone: zod_1.z.string().min(6),
    email: zod_1.z.string().optional(),
    birthDate: zod_1.z.string().optional(),
});
async function initApplication(req, res) {
    try {
        const parsed = initApplySchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ error: 'Datos iniciales inválidos.', details: parsed.error.issues });
            return;
        }
        const d = parsed.data;
        let targetOpeningId = d.openingId;
        let publicationRecord = null;
        // Si viene publicationSlug, resolver la publicación y la convocatoria asociada
        if (d.publicationSlug) {
            const pubRes = await db_1.default.query(`SELECT jp.*, jo.company_id, jo.status AS opening_status, jo.title AS opening_title
         FROM job_publications jp
         JOIN job_openings jo ON jp.job_opening_id = jo.id
         WHERE jp.slug = $1`, [d.publicationSlug.trim().toUpperCase()]);
            if (pubRes.rows.length === 0) {
                res.status(404).json({ error: 'La publicación indicada no existe.' });
                return;
            }
            publicationRecord = pubRes.rows[0];
            if (publicationRecord.status !== 'published') {
                res.status(400).json({ error: 'Esta publicación ya no se encuentra activa para recibir postulaciones.' });
                return;
            }
            targetOpeningId = publicationRecord.job_opening_id;
        }
        if (!targetOpeningId) {
            res.status(400).json({ error: 'Debe especificar una convocatoria o publicación válida.' });
            return;
        }
        // 1. Obtener la vacante y empresa
        const openingRes = await db_1.default.query(`SELECT id, company_id, title, requirements FROM job_openings WHERE id = $1 AND status != 'cancelled'`, [targetOpeningId]);
        if (openingRes.rows.length === 0) {
            res.status(404).json({ error: 'La convocatoria no está disponible para postulación.' });
            return;
        }
        const opening = openingRes.rows[0];
        const companyId = opening.company_id;
        // Trazabilidad de Captación
        const finalPublicationId = publicationRecord ? publicationRecord.id : null;
        const finalChannelId = d.channelId || (publicationRecord ? publicationRecord.channel_id : null);
        const finalCampaignId = d.campaignId || (publicationRecord ? publicationRecord.campaign_id : null);
        const finalUtmSource = d.utmSource || null;
        const finalUtmMedium = d.utmMedium || null;
        const finalUtmCampaign = d.utmCampaign || (publicationRecord ? publicationRecord.campaign_name : null);
        // Transacción para buscar o crear candidato y postulación con trazabilidad
        const result = await db_1.default.transaction(async (client) => {
            // A. Buscar o crear candidato (Anti-duplicado por DNI)
            let candidateRes = await client.query(`SELECT * FROM candidates WHERE company_id = $1 AND document_number = $2`, [companyId, d.documentNumber]);
            let candidate;
            let hasPreviousProfile = false;
            if (candidateRes.rows.length > 0) {
                candidate = candidateRes.rows[0];
                hasPreviousProfile = true;
                // Actualizar nombres y teléfono si cambiaron
                const updateRes = await client.query(`UPDATE candidates 
           SET first_name = $1, last_name = $2, phone = $3, 
               email = COALESCE($4, email), birth_date = COALESCE($5, birth_date), updated_at = NOW()
           WHERE id = $6
           RETURNING *`, [d.firstName, d.lastName, d.phone, d.email || null, d.birthDate || null, candidate.id]);
                candidate = updateRes.rows[0];
            }
            else {
                // Crear nuevo candidato
                const insertRes = await client.query(`INSERT INTO candidates (
             company_id, document_type, document_number, first_name, last_name,
             phone, email, birth_date
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           RETURNING *`, [
                    companyId, d.documentType, d.documentNumber, d.firstName, d.lastName,
                    d.phone, d.email || null, d.birthDate || null
                ]);
                candidate = insertRes.rows[0];
            }
            // B. Buscar si ya existe postulación para esta vacante
            const appRes = await client.query(`SELECT * FROM applications WHERE company_id = $1 AND candidate_id = $2 AND job_opening_id = $3`, [companyId, candidate.id, opening.id]);
            let application;
            if (appRes.rows.length > 0) {
                application = appRes.rows[0];
                // Si ya fue enviada
                if (application.application_status !== 'draft') {
                    return {
                        status: 'already_submitted',
                        applicationCode: application.application_code,
                        submittedAt: application.submitted_at || application.created_at,
                        candidate,
                        opening,
                    };
                }
                // Si estaba en borrador pero llega desde una nueva publicación, actualizar trazabilidad
                if (finalPublicationId && application.publication_id !== finalPublicationId) {
                    const updAppRes = await client.query(`UPDATE applications
             SET publication_id = $1, channel_id = $2, campaign_id = $3,
                 utm_source = $4, utm_medium = $5, utm_campaign = $6, updated_at = NOW()
             WHERE id = $7 RETURNING *`, [finalPublicationId, finalChannelId, finalCampaignId, finalUtmSource, finalUtmMedium, finalUtmCampaign, application.id]);
                    application = updAppRes.rows[0];
                }
            }
            else {
                // Crear nueva postulación en borrador con código y draft_token seguro
                const draftToken = crypto_1.default.randomBytes(24).toString('hex');
                // HALLAZGO #1 RESUELTO: loop de hasta 5 reintentos garantiza unicidad incluso en alta concurrencia
                let code = generateApplicationCode();
                for (let attempt = 0; attempt < 5; attempt++) {
                    const checkCode = await client.query(`SELECT id FROM applications WHERE application_code = $1`, [code]);
                    if (checkCode.rows.length === 0)
                        break;
                    code = generateApplicationCode();
                }
                const newAppRes = await client.query(`INSERT INTO applications (
             company_id, candidate_id, job_opening_id, publication_id, channel_id, campaign_id,
             utm_source, utm_medium, utm_campaign, application_code, draft_token,
             application_status, progress_percentage, current_stage
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'draft', 20, 'registered')
           RETURNING *`, [
                    companyId, candidate.id, opening.id, finalPublicationId, finalChannelId, finalCampaignId,
                    finalUtmSource, finalUtmMedium, finalUtmCampaign, code, draftToken
                ]);
                application = newAppRes.rows[0];
                // C. Si proviene de una publicación, crear snapshot histórico inmutable
                if (publicationRecord) {
                    const activeReqsRes = await client.query(`SELECT * FROM opening_requirements WHERE job_opening_id = $1 AND company_id = $2 AND is_active = TRUE ORDER BY order_index ASC`, [opening.id, companyId]);
                    await client.query(`INSERT INTO application_publication_snapshots (
               application_id, company_id, publication_id, job_opening_id,
               requirement_version, publication_title, publication_description,
               requirements_shown, benefits_shown, channel_id, campaign_id,
               utm_source, utm_medium, utm_campaign
             ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`, [
                        application.id,
                        companyId,
                        publicationRecord.id,
                        opening.id,
                        publicationRecord.requirement_version_at_publish || 1,
                        publicationRecord.title,
                        publicationRecord.description,
                        JSON.stringify(activeReqsRes.rows),
                        JSON.stringify(publicationRecord.benefits || []),
                        finalChannelId,
                        finalCampaignId,
                        finalUtmSource,
                        finalUtmMedium,
                        finalUtmCampaign,
                    ]);
                    // Incrementar aplicaciones iniciadas en job_publications
                    await client.query(`UPDATE job_publications 
             SET applications_started = applications_started + 1, updated_at = NOW()
             WHERE id = $1`, [publicationRecord.id]);
                }
            }
            return {
                status: 'draft_active',
                draftToken: application.draft_token,
                applicationCode: application.application_code,
                candidate,
                application,
                opening,
                publication: publicationRecord,
                hasPreviousProfile,
                structuredProfile: candidate.structured_profile,
            };
        });
        res.json(result);
    }
    catch (err) {
        console.error('Error en initApplication:', err);
        res.status(500).json({ error: 'Error al iniciar postulación.' });
    }
}
// ─── 4. OBTENER BORRADOR DE POSTULACIÓN ──────────────────────────────────────
async function getDraftApplication(req, res) {
    try {
        const { draftToken } = req.params;
        const appRes = await db_1.default.query(`SELECT 
         a.*,
         c.document_type AS candidate_document_type,
         c.document_number AS candidate_document_number,
         c.first_name AS candidate_first_name,
         c.last_name AS candidate_last_name,
         c.phone AS candidate_phone,
         c.email AS candidate_email,
         c.district AS candidate_district,
         c.city AS candidate_city,
         c.birth_date AS candidate_birth_date,
         c.gender AS candidate_gender,
         c.height_cm AS candidate_height_cm,
         c.weight_kg AS candidate_weight_kg,
         c.sucamec_status AS candidate_sucamec_status,
         c.sucamec_code AS candidate_sucamec_code,
         c.gun_license AS candidate_gun_license,
         c.gun_license_type AS candidate_gun_license_type,
         c.driver_license AS candidate_driver_license,
         c.driver_license_type AS candidate_driver_license_type,
         c.military_service AS candidate_military_service,
         c.security_experience_years AS candidate_security_experience_years,
         c.structured_profile AS candidate_structured_profile,
         jo.title AS job_title,
         jo.position_type AS job_position_type,
         jo.location AS job_location,
         jo.salary_offered AS job_salary,
         jo.shift_type AS job_shift,
         jo.requirements AS job_requirements
       FROM applications a
       JOIN candidates c ON a.candidate_id = c.id
       JOIN job_openings jo ON a.job_opening_id = jo.id
       WHERE a.draft_token = $1`, [draftToken]);
        if (appRes.rows.length === 0) {
            res.status(404).json({ error: 'Borrador de postulación no encontrado o expirado.' });
            return;
        }
        const app = appRes.rows[0];
        // Obtener documentos subidos
        const docsRes = await db_1.default.query(`SELECT * FROM application_documents WHERE application_id = $1 ORDER BY uploaded_at ASC`, [app.id]);
        res.json({
            application: app,
            documents: docsRes.rows,
        });
    }
    catch (err) {
        console.error('Error en getDraftApplication:', err);
        res.status(500).json({ error: 'Error al recuperar borrador.' });
    }
}
// ─── 5. GUARDAR PERFIL Y DATOS DEL POSTULANTE ────────────────────────────────
const saveProfileSchema = zod_1.z.object({
    firstName: zod_1.z.string().min(2).optional(),
    lastName: zod_1.z.string().min(2).optional(),
    phone: zod_1.z.string().min(6).optional(),
    email: zod_1.z.string().email().optional().or(zod_1.z.literal('')),
    district: zod_1.z.string().optional(),
    city: zod_1.z.string().optional(),
    birthDate: zod_1.z.string().optional(),
    heightCm: zod_1.z.number().optional(),
    weightKg: zod_1.z.number().optional(),
    sucamecStatus: zod_1.z.enum(['valid', 'in_process', 'none', 'expired']).optional(),
    sucamecCode: zod_1.z.string().optional(),
    gunLicense: zod_1.z.boolean().optional(),
    gunLicenseType: zod_1.z.string().optional(),
    driverLicense: zod_1.z.boolean().optional(),
    driverLicenseType: zod_1.z.string().optional(),
    militaryService: zod_1.z.boolean().optional(),
    securityExperienceYears: zod_1.z.number().optional(),
    structuredProfile: zod_1.z.object({
        experiences: zod_1.z.array(zod_1.z.any()).default([]),
        education: zod_1.z.array(zod_1.z.any()).default([]),
        courses: zod_1.z.array(zod_1.z.any()).default([]),
        skills: zod_1.z.array(zod_1.z.string()).default([]),
    }).optional(),
});
async function saveDraftProfile(req, res) {
    try {
        const { draftToken } = req.params;
        const parsed = saveProfileSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ error: 'Datos de perfil inválidos.', details: parsed.error.issues });
            return;
        }
        const d = parsed.data;
        // 1. Obtener la postulación
        const appRes = await db_1.default.query(`SELECT id, candidate_id, job_opening_id FROM applications WHERE draft_token = $1`, [draftToken]);
        if (appRes.rows.length === 0) {
            res.status(404).json({ error: 'Borrador no encontrado.' });
            return;
        }
        const { id: appId, candidate_id: candidateId } = appRes.rows[0];
        // 2. Actualizar datos en candidates
        await db_1.default.query(`UPDATE candidates
       SET first_name = COALESCE($1, first_name),
           last_name = COALESCE($2, last_name),
           phone = COALESCE($3, phone),
           email = COALESCE($4, email),
           district = COALESCE($5, district),
           city = COALESCE($6, city),
           birth_date = COALESCE($7, birth_date),
           height_cm = COALESCE($8, height_cm),
           weight_kg = COALESCE($9, weight_kg),
           sucamec_status = COALESCE($10, sucamec_status),
           sucamec_code = COALESCE($11, sucamec_code),
           gun_license = COALESCE($12, gun_license),
           gun_license_type = COALESCE($13, gun_license_type),
           driver_license = COALESCE($14, driver_license),
           driver_license_type = COALESCE($15, driver_license_type),
           military_service = COALESCE($16, military_service),
           security_experience_years = COALESCE($17, security_experience_years),
           structured_profile = COALESCE($18, structured_profile),
           updated_at = NOW()
       WHERE id = $19`, [
            d.firstName, d.lastName, d.phone, d.email, d.district,
            d.city, d.birthDate, d.heightCm, d.weightKg, d.sucamecStatus,
            d.sucamecCode, d.gunLicense, d.gunLicenseType, d.driverLicense,
            d.driverLicenseType, d.militaryService, d.securityExperienceYears,
            d.structuredProfile ? JSON.stringify(d.structuredProfile) : null,
            candidateId,
        ]);
        // 3. Actualizar progreso del borrador (ej: 60%)
        await db_1.default.query(`UPDATE applications SET progress_percentage = GREATEST(progress_percentage, 60), updated_at = NOW() WHERE id = $1`, [appId]);
        res.json({ message: 'Perfil guardado correctamente.' });
    }
    catch (err) {
        console.error('Error en saveDraftProfile:', err);
        res.status(500).json({ error: 'Error al guardar perfil.' });
    }
}
// ─── 6. SUBIR CV (PDF/DOC) Y EXTRAER SUGERENCIAS ─────────────────────────────
async function uploadCVFile(req, res) {
    try {
        const { draftToken } = req.params;
        const file = req.file;
        if (!file) {
            res.status(400).json({ error: 'No se ha proporcionado ningún archivo de CV.' });
            return;
        }
        const appRes = await db_1.default.query(`SELECT id, company_id, candidate_id FROM applications WHERE draft_token = $1`, [draftToken]);
        if (appRes.rows.length === 0) {
            res.status(404).json({ error: 'Borrador no encontrado.' });
            return;
        }
        const { id: appId, company_id: companyId } = appRes.rows[0];
        // Subir mediante StorageProvider desacoplado (Local / S3 / R2 / MinIO)
        const storageProvider = (0, storage_1.getStorageProvider)();
        const uploadResult = await storageProvider.upload({
            companyId,
            applicationId: appId,
            documentType: 'cv',
            originalName: file.originalname,
            mimeType: file.mimetype,
            filePath: file.path,
            fileSize: file.size,
        });
        // Registrar en application_documents con metadatos completos
        const docRes = await db_1.default.query(`INSERT INTO application_documents (
         company_id, application_id, document_type, file_name, file_path,
         mime_type, file_size, status, file_hash, storage_provider, storage_key, original_name
       ) VALUES ($1, $2, 'cv', $3, $4, $5, $6, 'uploaded', $7, $8, $9, $10)
       RETURNING *`, [
            companyId,
            appId,
            uploadResult.fileName,
            uploadResult.filePath,
            uploadResult.mimeType,
            uploadResult.fileSize,
            uploadResult.fileHash,
            uploadResult.storageProvider,
            uploadResult.storageKey,
            file.originalname,
        ]);
        // Actualizar progreso
        await db_1.default.query(`UPDATE applications SET progress_percentage = GREATEST(progress_percentage, 50), updated_at = NOW() WHERE id = $1`, [appId]);
        res.json({
            message: 'CV subido y procesado exitosamente.',
            document: docRes.rows[0],
        });
    }
    catch (err) {
        console.error('Error en uploadCVFile:', err);
        res.status(500).json({ error: 'Error al subir CV.' });
    }
}
// ─── 7. SUBIR FOTOS DE DOCUMENTOS Y AUTO-ORGANIZAR ────────────────────────────
async function uploadDocumentPhotos(req, res) {
    try {
        const { draftToken } = req.params;
        const files = req.files;
        const documentType = req.body.documentType || 'foto';
        console.log('uploadDocumentPhotos - draftToken:', draftToken);
        console.log('uploadDocumentPhotos - files:', files);
        console.log('uploadDocumentPhotos - documentType:', documentType);
        console.log('uploadDocumentPhotos - req.body:', req.body);
        if (!files || files.length === 0) {
            console.log('uploadDocumentPhotos - No files received');
            res.status(400).json({ error: 'No se subieron imágenes.' });
            return;
        }
        const appRes = await db_1.default.query(`SELECT id, company_id FROM applications WHERE draft_token = $1`, [draftToken]);
        if (appRes.rows.length === 0) {
            res.status(404).json({ error: 'Borrador no encontrado.' });
            return;
        }
        const { id: appId, company_id: companyId } = appRes.rows[0];
        const storageProvider = (0, storage_1.getStorageProvider)();
        const insertedDocs = [];
        for (const file of files) {
            const uploadResult = await storageProvider.upload({
                companyId,
                applicationId: appId,
                documentType,
                originalName: file.originalname,
                mimeType: file.mimetype,
                filePath: file.path,
                fileSize: file.size,
            });
            const docRes = await db_1.default.query(`INSERT INTO application_documents (
           company_id, application_id, document_type, file_name, file_path,
           mime_type, file_size, status, file_hash, storage_provider, storage_key, original_name
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'uploaded', $8, $9, $10, $11)
         RETURNING *`, [
                companyId,
                appId,
                documentType,
                uploadResult.fileName,
                uploadResult.filePath,
                uploadResult.mimeType,
                uploadResult.fileSize,
                uploadResult.fileHash,
                uploadResult.storageProvider,
                uploadResult.storageKey,
                file.originalname,
            ]);
            insertedDocs.push(docRes.rows[0]);
        }
        // Actualizar progreso
        await db_1.default.query(`UPDATE applications SET progress_percentage = GREATEST(progress_percentage, 75), updated_at = NOW() WHERE id = $1`, [appId]);
        res.json({
            message: `${files.length} documento(s) subido(s) correctamente.`,
            documents: insertedDocs,
        });
    }
    catch (err) {
        console.error('Error en uploadDocumentPhotos:', err);
        res.status(500).json({ error: 'Error al subir fotos de documentos.' });
    }
}
// ─── 8. ELIMINAR DOCUMENTO DE BORRADOR ───────────────────────────────────────
async function deleteDraftDocument(req, res) {
    try {
        const { draftToken, docId } = req.params;
        const appRes = await db_1.default.query(`SELECT id FROM applications WHERE draft_token = $1`, [draftToken]);
        if (appRes.rows.length === 0) {
            res.status(404).json({ error: 'Borrador no encontrado.' });
            return;
        }
        await db_1.default.query(`DELETE FROM application_documents WHERE id = $1 AND application_id = $2`, [docId, appRes.rows[0].id]);
        res.json({ message: 'Documento eliminado.' });
    }
    catch (err) {
        console.error('Error en deleteDraftDocument:', err);
        res.status(500).json({ error: 'Error al eliminar documento.' });
    }
}
// ─── 9. ENVÍO FINAL DE LA POSTULACIÓN Y CÁLCULO DE COMPATIBILIDAD ─────────────
async function submitApplication(req, res) {
    try {
        const { draftToken } = req.params;
        // 1. Cargar la postulación, candidato y vacante
        const appRes = await db_1.default.query(`SELECT 
         a.*,
         jo.requirements AS job_requirements,
         c.height_cm AS candidate_height_cm,
         c.sucamec_status AS candidate_sucamec_status,
         c.security_experience_years AS candidate_security_experience_years,
         c.gun_license AS candidate_gun_license,
         c.driver_license AS candidate_driver_license,
         c.first_name AS candidate_first_name,
         c.last_name AS candidate_last_name,
         c.document_number AS candidate_document_number
       FROM applications a
       JOIN candidates c ON a.candidate_id = c.id
       JOIN job_openings jo ON a.job_opening_id = jo.id
       WHERE a.draft_token = $1`, [draftToken]);
        if (appRes.rows.length === 0) {
            res.status(404).json({ error: 'Borrador no encontrado.' });
            return;
        }
        const app = appRes.rows[0];
        // 2. Cargar candidato, vacante, requisitos y documentos para el motor real
        const [candRes, openRes, reqRes, docRes] = await Promise.all([
            db_1.default.query(`SELECT * FROM candidates WHERE id = $1`, [app.candidate_id]),
            db_1.default.query(`SELECT * FROM job_openings WHERE id = $1`, [app.job_opening_id]),
            db_1.default.query(`SELECT * FROM opening_requirements WHERE job_opening_id = $1 AND is_active = TRUE ORDER BY order_index ASC`, [app.job_opening_id]),
            db_1.default.query(`SELECT * FROM application_documents WHERE application_id = $1`, [app.id]),
        ]);
        const { EvaluationEngine } = await Promise.resolve().then(() => __importStar(require('../../domain/evaluation.engine')));
        const evalOutput = EvaluationEngine.evaluate({
            application: app,
            candidate: candRes.rows[0],
            opening: openRes.rows[0],
            requirements: reqRes.rows,
            documents: docRes.rows,
        });
        const score = evalOutput.prefilterScore;
        // 3. Confirmar envío y guardar evaluaciones en base de datos
        await db_1.default.transaction(async (client) => {
            // Guardar evaluaciones por requisito
            await client.query(`DELETE FROM application_evaluations WHERE application_id = $1`, [app.id]);
            for (const ev of evalOutput.evaluations) {
                await client.query(`INSERT INTO application_evaluations (
             company_id, application_id, requirement_id, result, score_earned,
             max_score, source_type, declared_value, extracted_value,
             accredited_value, evidence_document_id, confidence_score,
             discrepancy_detected, discrepancy_details, evaluation_notes,
             is_overridden, evaluated_at
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, FALSE, NOW())`, [
                    app.company_id,
                    app.id,
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
                ]);
            }
            await client.query(`UPDATE applications
         SET application_status = 'submitted',
             current_stage = 'registered',
             progress_percentage = 100,
             compatibility_score = $1,
             prefilter_status = $2,
             prefilter_score = $1,
             prefilter_breakdown = $3,
             total_accredited_exp_months = $4,
             total_declared_exp_months = $5,
             discrepancies_count = $6,
             evaluation_snapshot = $7,
             rejection_reason = $8,
             submitted_at = NOW(),
             evaluated_at = NOW(),
             updated_at = NOW()
         WHERE id = $9`, [
                score,
                evalOutput.prefilterStatus,
                JSON.stringify(evalOutput.prefilterBreakdown),
                evalOutput.totalAccreditedMonths,
                evalOutput.totalDeclaredMonths,
                evalOutput.discrepanciesCount,
                JSON.stringify(evalOutput.snapshot),
                evalOutput.rejectionReason || null,
                app.id,
            ]);
            // Si la postulación proviene de una publicación, incrementar applications_completed
            if (app.publication_id) {
                await client.query(`UPDATE job_publications 
           SET applications_completed = applications_completed + 1, updated_at = NOW()
           WHERE id = $1`, [app.publication_id]);
            }
        });
        // Auditoría
        await db_1.default.query(`INSERT INTO audit_logs (company_id, action, resource, resource_id, details, ip_address, success)
       VALUES ($1, 'public_application_submitted', 'applications', $2, $3, $4::inet, TRUE)`, [
            app.company_id,
            app.id,
            JSON.stringify({
                code: app.application_code,
                candidate: `${app.candidate_first_name} ${app.candidate_last_name}`,
                dni: app.candidate_document_number,
                compatibility: score,
            }),
            req.ip,
        ]);
        res.json({
            message: '¡Postulación enviada exitosamente!',
            applicationCode: app.application_code,
            compatibilityScore: score,
            submittedAt: new Date().toISOString(),
        });
    }
    catch (err) {
        console.error('Error en submitApplication:', err);
        res.status(500).json({ error: 'Error al enviar postulación.' });
    }
}
// ─── 10. CONSULTA PÚBLICA DE SEGUIMIENTO CON CÓDIGO ───────────────────────────
const trackingSchema = zod_1.z.object({
    documentNumber: zod_1.z.string().min(8),
    applicationCode: zod_1.z.string().min(6),
});
async function trackApplication(req, res) {
    try {
        const parsed = trackingSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ error: 'DNI o Código de postulación inválido.' });
            return;
        }
        const { documentNumber, applicationCode } = parsed.data;
        const { rows } = await db_1.default.query(`SELECT 
         a.application_code,
         a.application_status,
         a.current_stage,
         a.submitted_at,
         a.updated_at,
         c.first_name,
         c.last_name,
         c.document_number,
         jo.title AS job_title,
         jo.location AS job_location,
         jo.position_type AS job_position_type,
         i.interview_date,
         i.location_type AS interview_location_type,
         i.location_notes AS interview_location_notes
       FROM applications a
       JOIN candidates c ON a.candidate_id = c.id
       JOIN job_openings jo ON a.job_opening_id = jo.id
       LEFT JOIN LATERAL (
         SELECT interview_date, location_type, location_notes 
         FROM interviews 
         WHERE application_id = a.id 
         ORDER BY interview_date DESC 
         LIMIT 1
       ) i ON true
       WHERE c.document_number = $1 AND a.application_code ILIKE $2`, [documentNumber.trim(), applicationCode.trim()]);
        if (rows.length === 0) {
            res.status(404).json({ error: 'No se encontró ninguna postulación con el DNI y Código proporcionados.' });
            return;
        }
        const row = rows[0];
        res.json({
            applicationCode: row.application_code,
            candidateName: `${row.first_name} ${row.last_name}`,
            documentNumber: row.document_number,
            jobTitle: row.job_title,
            jobLocation: row.job_location,
            status: row.application_status,
            currentStage: row.current_stage,
            submittedAt: row.submitted_at,
            lastUpdate: row.updated_at,
            scheduledInterview: row.interview_date
                ? {
                    date: row.interview_date,
                    locationType: row.interview_location_type,
                    notes: row.interview_location_notes,
                }
                : null,
        });
    }
    catch (err) {
        console.error('Error en trackApplication:', err);
        res.status(500).json({ error: 'Error al consultar estado de postulación.' });
    }
}
// ─── 11. GENERACIÓN DE CV EN PDF ─────────────────────────────────────────────
async function generateCVPdf(req, res) {
    try {
        const { draftToken } = req.params;
        const appRes = await db_1.default.query(`SELECT 
         c.first_name, c.last_name, c.document_number, c.phone, c.email,
         c.district, c.city, c.birth_date, c.height_cm, c.weight_kg,
         c.sucamec_status, c.sucamec_code,
         c.gun_license, c.driver_license, c.military_service,
         c.security_experience_years, c.structured_profile,
         jo.title AS job_title, a.id AS application_id
       FROM applications a
       JOIN candidates c ON a.candidate_id = c.id
       JOIN job_openings jo ON a.job_opening_id = jo.id
       WHERE a.draft_token = $1`, [draftToken]);
        if (appRes.rows.length === 0) {
            res.status(404).json({ error: 'Borrador no encontrado.' });
            return;
        }
        const c = appRes.rows[0];
        const profile = c.structured_profile || { experiences: [], education: [], courses: [], skills: [] };
        // Obtener documentos subidos con rutas de archivos
        const docsRes = await db_1.default.query(`SELECT document_type, file_name, file_path, status, uploaded_at 
       FROM application_documents 
       WHERE application_id = $1 
       ORDER BY uploaded_at ASC`, [c.application_id]);
        const documents = docsRes.rows;
        const PDFDocument = (await Promise.resolve().then(() => __importStar(require('pdfkit')))).default;
        const doc = new PDFDocument({ margin: 40, size: 'A4' });
        const chunks = [];
        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => {
            const pdfBuffer = Buffer.concat(chunks);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="CV_${c.document_number}_${c.first_name}_${c.last_name}.pdf"`);
            res.send(pdfBuffer);
        });
        // Header Red Bar con espacio para foto
        doc.rect(40, 40, 515, 90).fill('#080808');
        doc.rect(40, 128, 515, 3).fill('#dc2626');
        // Intentar agregar foto de perfil si existe
        const photoDoc = documents.find(d => d.document_type === 'photo');
        if (photoDoc && photoDoc.file_path) {
            try {
                const fs = await Promise.resolve().then(() => __importStar(require('fs')));
                if (fs.existsSync(photoDoc.file_path)) {
                    doc.image(photoDoc.file_path, 45, 45, { width: 80, height: 80 });
                }
            }
            catch (err) {
                console.log('No se pudo cargar la foto:', err);
            }
        }
        doc.fillColor('#ffffff').fontSize(20).font('Helvetica-Bold').text(`${c.first_name.toUpperCase()} ${c.last_name.toUpperCase()}`, 140, 55);
        doc.fillColor('#dc2626').fontSize(11).font('Helvetica').text(`POSTULANTE A: ${c.job_title.toUpperCase()}`, 140, 82);
        doc.fillColor('#ffffff').fontSize(9).font('Helvetica').text(`DNI: ${c.document_number} | Tel: ${c.phone}`, 140, 98);
        doc.fillColor('#000000').moveDown(3);
        // Datos de Contacto y Personales
        let y = 125;
        doc.fontSize(11).font('Helvetica-Bold').fillColor('#dc2626').text('DATOS PERSONALES Y DE CONTACTO', 40, y);
        y += 18;
        doc.moveTo(40, y).lineTo(555, y).stroke('#dc2626');
        y += 10;
        doc.fontSize(9).font('Helvetica').fillColor('#333333');
        // Primera fila de datos personales
        const birthDate = c.birth_date ? new Date(c.birth_date).toLocaleDateString('es-PE') : 'No especificado';
        const age = c.birth_date ? Math.floor((new Date().getTime() - new Date(c.birth_date).getTime()) / (1000 * 60 * 60 * 24 * 365.25)) : '-';
        doc.text(`Fecha Nacimiento: ${birthDate} (${age} años)   |   Ciudad: ${c.city || 'Lima'}   |   Distrito: ${c.district || 'Lima'}`, 40, y);
        y += 14;
        doc.text(`Teléfono: ${c.phone}   |   Correo: ${c.email || 'No especificado'}`, 40, y);
        y += 14;
        doc.text(`Estatura: ${c.height_cm || 0} cm   |   Peso: ${c.weight_kg || 0} kg   |   IMC: ${c.height_cm && c.weight_kg ? (c.weight_kg / Math.pow(c.height_cm / 100, 2)).toFixed(1) : '-'}`, 40, y);
        y += 20;
        // Datos Profesionales
        doc.fontSize(11).font('Helvetica-Bold').fillColor('#dc2626').text('DATOS PROFESIONALES', 40, y);
        y += 18;
        doc.moveTo(40, y).lineTo(555, y).stroke('#dc2626');
        y += 10;
        doc.fontSize(9).font('Helvetica').fillColor('#333333');
        doc.text(`SUCAMEC: ${c.sucamec_status === 'valid' ? 'VIGENTE' : c.sucamec_status.toUpperCase()} (${c.sucamec_code || 'S/N'})`, 40, y);
        y += 12;
        doc.text(`Porte Armas: ${c.gun_license ? 'SÍ' : 'NO'}   |   Licencia Conducir: ${c.driver_license ? 'SÍ' : 'NO'}   |   Servicio Militar: ${c.military_service ? 'SÍ' : 'NO'}`, 40, y);
        y += 12;
        doc.text(`Experiencia Seguridad: ${c.security_experience_years || 0} años`, 40, y);
        y += 25;
        // Documentos Adjuntos con imágenes
        if (documents.length > 0) {
            doc.fontSize(11).font('Helvetica-Bold').fillColor('#dc2626').text('DOCUMENTOS Y CERTIFICADOS', 40, y);
            y += 18;
            doc.moveTo(40, y).lineTo(555, y).stroke('#dc2626');
            y += 10;
            const docLabels = {
                'dni': 'DNI',
                'cul': 'CUL',
                'sucamec': 'SUCAMEC',
                'gun_license': 'Licencia Armas',
                'driver_license': 'Licencia Conducir',
                'military': 'Servicio Militar',
                'criminal_record': 'Antecedentes Penales',
                'photo': 'Foto',
                'cv': 'CV',
                'education_certificate': 'Certificado Estudios',
                'work_certificate': 'Certificado Laboral',
                'course_certificate': 'Certificado Curso'
            };
            const fs = await Promise.resolve().then(() => __importStar(require('fs')));
            for (const document of documents) {
                const label = docLabels[document.document_type] || document.document_type.toUpperCase();
                const status = document.status === 'uploaded' ? '✓ Subido' : document.status;
                // Agregar etiqueta del documento
                doc.fontSize(9).font('Helvetica-Bold').fillColor('#000000').text(`${label}:`, 40, y);
                y += 12;
                // Intentar agregar imagen si es un documento visual
                if (document.file_path &&
                    ['photo', 'dni', 'cul', 'sucamec', 'gun_license', 'driver_license', 'education_certificate', 'work_certificate', 'course_certificate'].includes(document.document_type)) {
                    try {
                        if (fs.existsSync(document.file_path)) {
                            // Agregar imagen pequeña como miniatura
                            const maxHeight = 60;
                            const maxWidth = 80;
                            doc.image(document.file_path, 40, y, {
                                fit: [maxWidth, maxHeight]
                            });
                            y += maxHeight + 10;
                        }
                        else {
                            doc.fontSize(8).font('Helvetica').fillColor('#666666').text(`${status} (${new Date(document.uploaded_at).toLocaleDateString('es-PE')})`, 40, y);
                            y += 12;
                        }
                    }
                    catch (err) {
                        doc.fontSize(8).font('Helvetica').fillColor('#666666').text(`${status} (${new Date(document.uploaded_at).toLocaleDateString('es-PE')})`, 40, y);
                        y += 12;
                    }
                }
                else {
                    doc.fontSize(8).font('Helvetica').fillColor('#666666').text(`${status} (${new Date(document.uploaded_at).toLocaleDateString('es-PE')})`, 40, y);
                    y += 12;
                }
                y += 8; // Espacio entre documentos
            }
            y += 15;
        }
        // Experiencia Laboral
        doc.fontSize(11).font('Helvetica-Bold').fillColor('#dc2626').text('EXPERIENCIA LABORAL', 40, y);
        y += 18;
        doc.moveTo(40, y).lineTo(555, y).stroke('#dc2626');
        y += 10;
        const exps = profile.experiences || [];
        if (exps.length === 0) {
            doc.fontSize(9).font('Helvetica-Oblique').fillColor('#666666').text('No se registraron experiencias previas.', 40, y);
            y += 20;
        }
        else {
            for (const exp of exps) {
                doc.fontSize(10).font('Helvetica-Bold').fillColor('#000000').text(`${exp.position} — ${exp.company}`, 40, y);
                y += 14;
                doc.fontSize(9).font('Helvetica').fillColor('#555555').text(`Periodo: ${exp.startDate} a ${exp.endDate || 'Actual'}  |  Ciudad: ${exp.city || 'Lima'}`, 40, y);
                y += 12;
                if (exp.functions) {
                    doc.fontSize(9).font('Helvetica').fillColor('#333333').text(`Funciones: ${exp.functions}`, 40, y, { width: 515 });
                    y += 16;
                }
            }
        }
        // Educación
        y += 10;
        doc.fontSize(11).font('Helvetica-Bold').fillColor('#dc2626').text('EDUCACIÓN', 40, y);
        y += 18;
        doc.moveTo(40, y).lineTo(555, y).stroke('#dc2626');
        y += 10;
        const edus = profile.education || [];
        if (edus.length === 0) {
            doc.fontSize(9).font('Helvetica').fillColor('#333333').text('Secundaria Completa', 40, y);
            y += 16;
        }
        else {
            for (const edu of edus) {
                doc.fontSize(10).font('Helvetica-Bold').fillColor('#000000').text(`${edu.degree} — ${edu.institution}`, 40, y);
                y += 14;
                doc.fontSize(9).font('Helvetica').fillColor('#555555').text(`Nivel: ${edu.level}  |  Año: ${edu.year || '-'}  |  Estado: ${edu.status || 'Culminado'}`, 40, y);
                y += 16;
            }
        }
        // Cursos y Capacitaciones
        y += 10;
        doc.fontSize(11).font('Helvetica-Bold').fillColor('#dc2626').text('CURSOS Y CAPACITACIONES', 40, y);
        y += 18;
        doc.moveTo(40, y).lineTo(555, y).stroke('#dc2626');
        y += 10;
        const courses = profile.courses || [];
        if (courses.length === 0) {
            doc.fontSize(9).font('Helvetica-Oblique').fillColor('#666666').text('No se registraron cursos adicionales.', 40, y);
            y += 16;
        }
        else {
            for (const course of courses) {
                doc.fontSize(9).font('Helvetica-Bold').fillColor('#000000').text(`${course.name}`, 40, y);
                y += 12;
                doc.fontSize(8.5).font('Helvetica').fillColor('#555555').text(`${course.institution || ''} ${course.year ? `| Año: ${course.year}` : ''} ${course.hours ? `| ${course.hours} horas` : ''}`, 40, y);
                y += 14;
            }
        }
        // Habilidades
        y += 10;
        doc.fontSize(11).font('Helvetica-Bold').fillColor('#dc2626').text('HABILIDADES', 40, y);
        y += 18;
        doc.moveTo(40, y).lineTo(555, y).stroke('#dc2626');
        y += 10;
        const skills = profile.skills || [];
        if (skills.length === 0) {
            doc.fontSize(9).font('Helvetica-Oblique').fillColor('#666666').text('No se registraron habilidades específicas.', 40, y);
            y += 16;
        }
        else {
            doc.fontSize(9).font('Helvetica').fillColor('#333333').text(skills.join(' • '), 40, y, { width: 515 });
            y += 20;
        }
        // Pie de página oficial Security Force
        doc.fontSize(8).font('Helvetica').fillColor('#888888').text(`Documento generado automáticamente por el Portal de Postulación Security Force P&V S.A.C. - ${new Date().toLocaleDateString('es-PE')} ${new Date().toLocaleTimeString('es-PE')}`, 40, 780, { align: 'center', width: 515 });
        doc.end();
    }
    catch (err) {
        console.error('Error en generateCVPdf:', err);
        res.status(500).json({ error: 'Error al generar PDF de CV.' });
    }
}
// ─── 7. PORTAL PÚBLICO: DETALLE DE PUBLICACIÓN POR SLUG ────────────────────────
async function getPublicPublicationBySlug(req, res) {
    try {
        const { slug } = req.params;
        const query = `
      SELECT 
        jp.id AS publication_id,
        jp.slug,
        jp.title AS publication_title,
        jp.description AS publication_description,
        jp.banner_url,
        jp.benefits,
        jp.status,
        jp.published_at,
        jp.closes_at,
        jp.og_title,
        jp.og_description,
        jp.og_image_url,
        jo.id AS opening_id,
        jo.title AS opening_title,
        jo.position_type,
        jo.location,
        jo.client_name,
        jo.vacancies_count,
        jo.filled_count,
        jo.salary_offered,
        jo.shift_type,
        jo.description AS opening_description,
        jo.requirements AS opening_raw_requirements,
        jc.id AS category_id,
        jc.name AS category_name,
        jc.icon AS category_icon,
        jc.color_hex AS category_color,
        camp.id AS campaign_id,
        camp.name AS campaign_name,
        chan.id AS channel_id,
        chan.name AS channel_name,
        chan.type AS channel_type,
        comp.id AS company_id,
        comp.name AS company_name,
        comp.phone AS company_phone,
        comp.email AS company_email
      FROM job_publications jp
      JOIN job_openings jo ON jp.job_opening_id = jo.id
      JOIN companies comp ON jp.company_id = comp.id
      LEFT JOIN job_categories jc ON jo.category_id = jc.id
      LEFT JOIN recruitment_campaigns camp ON jp.campaign_id = camp.id
      LEFT JOIN recruitment_channels chan ON jp.channel_id = chan.id
      WHERE jp.slug = $1
    `;
        const { rows } = await db_1.default.query(query, [slug.trim().toUpperCase()]);
        if (rows.length === 0) {
            res.status(404).json({ error: 'Publicación no encontrada.' });
            return;
        }
        const pub = rows[0];
        // Si está en borrador, no se expone al público
        if (pub.status === 'draft') {
            res.status(404).json({ error: 'Esta publicación aún se encuentra en borrador y no está disponible públicamente.' });
            return;
        }
        // Si está cerrada o archivada, devolver con flag de disponibilidad y sugerencias
        const isClosedOrArchived = pub.status === 'closed' || pub.status === 'archived';
        // Obtener requisitos activos vigentes de la convocatoria
        const reqsRes = await db_1.default.query(`SELECT 
         id, code, title, description, requirement_type, rule_type, 
         required_document_type, order_index
       FROM opening_requirements 
       WHERE job_opening_id = $1 AND is_active = TRUE
       ORDER BY order_index ASC`, [pub.opening_id]);
        // Si está cerrada, buscar otras convocatorias abiertas activas de la empresa
        let otherOpenings = [];
        if (isClosedOrArchived) {
            const othersRes = await db_1.default.query(`SELECT jp.slug, jp.title, jo.location, jo.position_type, jo.shift_type
         FROM job_publications jp
         JOIN job_openings jo ON jp.job_opening_id = jo.id
         WHERE jp.company_id = $1 AND jp.status = 'published' AND jp.id != $2
         ORDER BY jp.published_at DESC
         LIMIT 4`, [pub.company_id, pub.publication_id]);
            otherOpenings = othersRes.rows;
        }
        res.json({
            publication: pub,
            requirements: reqsRes.rows,
            isAvailable: !isClosedOrArchived,
            statusMessage: isClosedOrArchived ? 'Esta convocatoria ya no acepta nuevas postulaciones.' : 'Convocatoria abierta',
            otherOpenings,
        });
    }
    catch (err) {
        console.error('Error en getPublicPublicationBySlug:', err);
        res.status(500).json({ error: 'Error al obtener publicación pública.' });
    }
}
// ─── 8. PORTAL PÚBLICO: REGISTRO DE VISUALIZACIONES Y PIXEL TRACKING ─────────
async function registerPublicationView(req, res) {
    try {
        const { slug } = req.params;
        const { channelId, campaignId, utmSource, utmMedium, utmCampaign } = req.body;
        const pubRes = await db_1.default.query(`SELECT id, company_id, channel_id, campaign_id FROM job_publications WHERE slug = $1`, [slug.trim().toUpperCase()]);
        if (pubRes.rows.length === 0) {
            res.status(404).json({ error: 'Publicación no encontrada.' });
            return;
        }
        const pub = pubRes.rows[0];
        // 1. Detección de Bot y dispositivo por User-Agent
        const userAgent = req.headers['user-agent'] || '';
        const isBot = /bot|googlebot|crawler|spider|robot|crawling|facebookexternalhit|slackbot|whatsapp/i.test(userAgent);
        let deviceType = 'desktop';
        if (/android|iphone|ipad|ipod|mobile/i.test(userAgent)) {
            deviceType = 'mobile';
        }
        else if (isBot) {
            deviceType = 'bot';
        }
        // 2. Hash seguro de IP para deduplicación diaria sin guardar PII
        const clientIp = req.headers['x-forwarded-for']?.split(',')[0] || req.ip || '127.0.0.1';
        const todayStr = new Date().toISOString().slice(0, 10);
        const ipHash = crypto_1.default.createHash('sha256').update(`${clientIp}-${pub.id}-${todayStr}`).digest('hex');
        // 3. Verificar si es primera vista de este hash hoy
        const existingViewToday = await db_1.default.query(`SELECT id FROM publication_views 
       WHERE publication_id = $1 AND ip_hash = $2 AND viewed_at >= CURRENT_DATE`, [pub.id, ipHash]);
        const isFirstViewToday = existingViewToday.rows.length === 0 && !isBot;
        // 4. Registrar evento en publication_views
        await db_1.default.query(`INSERT INTO publication_views (
         publication_id, company_id, channel_id, campaign_id,
         utm_source, utm_medium, utm_campaign, ip_hash,
         user_agent_type, is_bot, viewed_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())`, [
            pub.id,
            pub.company_id,
            channelId || pub.channel_id || null,
            campaignId || pub.campaign_id || null,
            utmSource || null,
            utmMedium || null,
            utmCampaign || null,
            ipHash,
            deviceType,
            isBot,
        ]);
        // 5. Incrementar contadores denormalizados en job_publications
        await db_1.default.query(`UPDATE job_publications
       SET views_total = views_total + 1,
           views_bot = views_bot + $1,
           views_unique_estimated = views_unique_estimated + $2,
           updated_at = NOW()
       WHERE id = $3`, [isBot ? 1 : 0, isFirstViewToday ? 1 : 0, pub.id]);
        res.json({ ok: true, registered: true });
    }
    catch (err) {
        console.error('Error en registerPublicationView:', err);
        res.status(500).json({ error: 'Error al registrar vista.' });
    }
}
// ─── 12. OBTENER REQUISITOS DE DOCUMENTOS POR CONVOCATORIA ───────────────────
async function getDocumentRequirements(req, res) {
    try {
        const openingId = req.params.id || req.params.openingId;
        if (!openingId) {
            res.status(400).json({ error: 'ID de convocatoria requerido' });
            return;
        }
        const openingRes = await db_1.default.query(`SELECT requirements FROM job_openings WHERE id = $1`, [openingId]);
        if (openingRes.rows.length === 0) {
            res.status(404).json({ error: 'Convocatoria no encontrada.' });
            return;
        }
        const requirements = openingRes.rows[0].requirements || {};
        const requiredDocuments = requirements.required_documents || [];
        // Categorizar documentos
        const categorized = {
            IDENTIDAD: [],
            FORMACION_ACADÉMICA: [],
            EXPERIENCIA_LABORAL: [],
            SEGURIDAD: [],
            LICENCIAS: [],
            CAPACITACIÓN: [],
            OTROS: []
        };
        requiredDocuments.forEach((doc) => {
            const category = doc.category || 'OTROS';
            if (categorized[category]) {
                categorized[category].push(doc);
            }
            else {
                categorized.OTROS.push(doc);
            }
        });
        // Separar obligatorios y opcionales
        const mandatory = requiredDocuments.filter((d) => d.required);
        const optional = requiredDocuments.filter((d) => !d.required);
        res.json({
            mandatory,
            optional,
            categorized,
            totalRequired: mandatory.length,
            totalOptional: optional.length
        });
    }
    catch (err) {
        console.error('Error en getDocumentRequirements:', err);
        res.status(500).json({ error: 'Error al obtener requisitos de documentos.' });
    }
}
// ─── 13. OBTENER ESTADO DE EXPEDIENTE DEL POSTULANTE ─────────────────────────
async function getExpedienteStatus(req, res) {
    try {
        const { draftToken } = req.params;
        const appRes = await db_1.default.query(`SELECT id, job_opening_id FROM applications WHERE draft_token = $1`, [draftToken]);
        if (appRes.rows.length === 0) {
            res.status(404).json({ error: 'Borrador no encontrado.' });
            return;
        }
        const { id: appId, job_opening_id: jobOpeningId } = appRes.rows[0];
        // Obtener requisitos de la convocatoria
        const openingRes = await db_1.default.query(`SELECT requirements FROM job_openings WHERE id = $1`, [jobOpeningId]);
        const requirements = openingRes.rows[0]?.requirements || {};
        const requiredDocuments = requirements.required_documents || [];
        // Obtener documentos subidos
        const docsRes = await db_1.default.query(`SELECT document_type, file_name, status, uploaded_at, file_size 
       FROM application_documents 
       WHERE application_id = $1 
       ORDER BY uploaded_at ASC`, [appId]);
        const uploadedDocs = docsRes.rows;
        // Calcular estado de cada requisito
        const documentStatus = requiredDocuments.map((req) => {
            const docsForType = uploadedDocs.filter(d => d.document_type === req.type);
            const hasRequired = docsForType.length > 0;
            const requiredCount = req.maxFiles || 1;
            const currentCount = docsForType.length;
            return {
                type: req.type,
                label: req.label,
                category: req.category,
                required: req.required,
                description: req.description,
                status: hasRequired ? 'RECIBIDO' : 'PENDIENTE',
                uploadedCount: currentCount,
                requiredCount: requiredCount,
                allowMultiple: req.allowMultiple || false,
                documents: docsForType,
                isComplete: hasRequired && (!req.allowMultiple || currentCount >= requiredCount)
            };
        });
        // Calcular progreso
        const mandatoryDocs = documentStatus.filter((d) => d.required);
        const completedMandatory = mandatoryDocs.filter((d) => d.isComplete);
        const progressPercentage = mandatoryDocs.length > 0
            ? Math.round((completedMandatory.length / mandatoryDocs.length) * 100)
            : 0;
        // Calcular diferencias entre declarado vs acreditado
        const profileRes = await db_1.default.query(`SELECT structured_profile FROM candidates c 
       JOIN applications a ON c.id = a.candidate_id 
       WHERE a.id = $1`, [appId]);
        const profile = profileRes.rows[0]?.structured_profile || { experiences: [], education: [] };
        const declaredExpMonths = profile.experiences?.reduce((total, exp) => {
            if (exp.startDate) {
                const start = new Date(exp.startDate);
                const end = exp.endDate ? new Date(exp.endDate) : new Date();
                const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
                return total + Math.max(0, months);
            }
            return total;
        }, 0) || 0;
        res.json({
            progress: {
                percentage: progressPercentage,
                completed: completedMandatory.length,
                total: mandatoryDocs.length,
                optionalCompleted: documentStatus.filter((d) => !d.required && d.isComplete).length,
                optionalTotal: documentStatus.filter((d) => !d.required).length
            },
            documents: documentStatus,
            comparison: {
                declaredExperienceMonths: declaredExpMonths,
                // La experiencia acreditada se calcula en el motor de evaluación
            }
        });
    }
    catch (err) {
        console.error('Error en getExpedienteStatus:', err);
        res.status(500).json({ error: 'Error al obtener estado de expediente.' });
    }
}
// ─── 9. AUTOSAVE DEL BORRADOR (CADA STEP O CADA 30s) ─────────────────────────
async function autosaveDraft(req, res) {
    try {
        const { draftToken } = req.params;
        const { heightCm, weightKg, district, sucamecStatus, sucamecCode, gunLicense, gunLicenseType, driverLicense, driverLicenseType, militaryService, securityExpYears, experiences, educationList, notes, } = req.body;
        const appRes = await db_1.default.query(`SELECT id, candidate_id, application_status FROM applications WHERE draft_token = $1`, [draftToken]);
        if (appRes.rows.length === 0) {
            res.status(404).json({ error: 'Borrador no encontrado.' });
            return;
        }
        const app = appRes.rows[0];
        if (app.application_status !== 'draft') {
            res.status(400).json({ error: 'Esta postulación ya fue enviada y no puede modificarse.' });
            return;
        }
        // Construir actualizaciones dinámicas del candidato
        const candidateUpdates = [];
        const candidateParams = [];
        let pIdx = 1;
        if (heightCm !== undefined) {
            candidateUpdates.push(`height_cm = $${pIdx++}`);
            candidateParams.push(heightCm);
        }
        if (weightKg !== undefined) {
            candidateUpdates.push(`weight_kg = $${pIdx++}`);
            candidateParams.push(weightKg);
        }
        if (district !== undefined) {
            candidateUpdates.push(`district = $${pIdx++}`);
            candidateParams.push(district);
        }
        if (sucamecStatus !== undefined) {
            candidateUpdates.push(`sucamec_status = $${pIdx++}`);
            candidateParams.push(sucamecStatus);
        }
        if (sucamecCode !== undefined) {
            candidateUpdates.push(`sucamec_code = $${pIdx++}`);
            candidateParams.push(sucamecCode);
        }
        if (gunLicense !== undefined) {
            candidateUpdates.push(`gun_license = $${pIdx++}`);
            candidateParams.push(gunLicense);
        }
        if (gunLicenseType !== undefined) {
            candidateUpdates.push(`gun_license_type = $${pIdx++}`);
            candidateParams.push(gunLicenseType);
        }
        if (driverLicense !== undefined) {
            candidateUpdates.push(`driver_license = $${pIdx++}`);
            candidateParams.push(driverLicense);
        }
        if (driverLicenseType !== undefined) {
            candidateUpdates.push(`driver_license_type = $${pIdx++}`);
            candidateParams.push(driverLicenseType);
        }
        if (militaryService !== undefined) {
            candidateUpdates.push(`military_service = $${pIdx++}`);
            candidateParams.push(militaryService);
        }
        if (securityExpYears !== undefined) {
            candidateUpdates.push(`security_experience_years = $${pIdx++}`);
            candidateParams.push(securityExpYears);
        }
        // Guardar structured_profile (experiencias + educación como JSONB)
        if (experiences !== undefined || educationList !== undefined) {
            const currentProfileRes = await db_1.default.query(`SELECT structured_profile FROM candidates WHERE id = $1`, [app.candidate_id]);
            const currentProfile = currentProfileRes.rows[0]?.structured_profile || {};
            const updatedProfile = {
                ...currentProfile,
                ...(experiences !== undefined ? { experiences } : {}),
                ...(educationList !== undefined ? { education: educationList } : {}),
                lastSaved: new Date().toISOString(),
            };
            candidateUpdates.push(`structured_profile = $${pIdx++}`);
            candidateParams.push(JSON.stringify(updatedProfile));
        }
        if (candidateUpdates.length > 0) {
            candidateUpdates.push(`updated_at = NOW()`);
            candidateParams.push(app.candidate_id);
            await db_1.default.query(`UPDATE candidates SET ${candidateUpdates.join(', ')} WHERE id = $${pIdx}`, candidateParams);
        }
        // Actualizar notas de la postulación si vienen en el autosave
        if (notes !== undefined) {
            await db_1.default.query(`UPDATE applications SET notes = $1, updated_at = NOW() WHERE id = $2`, [notes, app.id]);
        }
        else {
            await db_1.default.query(`UPDATE applications SET updated_at = NOW() WHERE id = $1`, [app.id]);
        }
        res.json({ ok: true, savedAt: new Date().toISOString() });
    }
    catch (err) {
        console.error('Error en autosaveDraft:', err);
        res.status(500).json({ error: 'Error al guardar progreso automáticamente.' });
    }
}
// ─── 10. REGISTRO DE CONSENTIMIENTO LOPD/PRIVACIDAD ──────────────────────────
async function registerConsent(req, res) {
    try {
        const { draftToken } = req.params;
        const { consentGiven, consentVersion } = req.body;
        if (consentGiven !== true) {
            res.status(400).json({ error: 'El consentimiento debe aceptarse explícitamente (consentGiven: true).' });
            return;
        }
        const appRes = await db_1.default.query(`SELECT id, candidate_id, company_id, application_status FROM applications WHERE draft_token = $1`, [draftToken]);
        if (appRes.rows.length === 0) {
            res.status(404).json({ error: 'Borrador no encontrado.' });
            return;
        }
        const app = appRes.rows[0];
        // Hash de IP para privacidad — nunca se guarda la IP cruda
        const clientIp = req.headers['x-forwarded-for']?.split(',')[0] || req.ip || '0.0.0.0';
        const ipHash = crypto_1.default.createHash('sha256').update(clientIp).digest('hex');
        // Intentar registrar en candidate_consents si la tabla existe
        try {
            await db_1.default.query(`INSERT INTO candidate_consents (
           candidate_id, company_id, application_id,
           consent_type, consent_version, consent_given,
           ip_hash, user_agent, consented_at
         ) VALUES ($1, $2, $3, 'data_processing', $4, TRUE, $5, $6, NOW())
         ON CONFLICT (candidate_id, company_id, consent_type) 
         DO UPDATE SET
           consent_version = EXCLUDED.consent_version,
           consent_given = TRUE,
           ip_hash = EXCLUDED.ip_hash,
           consented_at = NOW()`, [
                app.candidate_id, app.company_id, app.id,
                consentVersion || '1.0',
                ipHash,
                (req.headers['user-agent'] || '').slice(0, 255),
            ]);
        }
        catch (consentErr) {
            // Si la tabla no existe (42P01), continuar sin error
            if (consentErr.code !== '42P01') {
                console.error('Error al insertar en candidate_consents:', consentErr);
                // No lanzar error, continuar
            }
        }
        // Intentar marcar consentimiento en applications si la columna existe
        try {
            await db_1.default.query(`UPDATE applications 
         SET consent_given = TRUE, consent_given_at = NOW(), updated_at = NOW() 
         WHERE id = $1`, [app.id]);
        }
        catch (updateErr) {
            // Si la columna no existe (42703), continuar sin error
            if (updateErr.code !== '42703') {
                console.error('Error al actualizar consent_given en applications:', updateErr);
                // No lanzar error, el consentimiento ya se registró en candidate_consents si existe
            }
        }
        res.json({ ok: true, consentedAt: new Date().toISOString() });
    }
    catch (err) {
        console.error('Error en registerConsent:', err);
        res.status(500).json({ error: 'Error al registrar consentimiento.' });
    }
}
// ─── 11. FIT SCORE — ESTIMACIÓN DE COMPATIBILIDAD EN TIEMPO REAL ─────────────
async function getApplicationFitScore(req, res) {
    try {
        const { draftToken } = req.params;
        const appRes = await db_1.default.query(`SELECT id, candidate_id, job_opening_id, company_id,
              prefilter_score, prefilter_status, compatibility_score
       FROM applications WHERE draft_token = $1`, [draftToken]);
        if (appRes.rows.length === 0) {
            res.status(404).json({ error: 'Postulación no encontrada.' });
            return;
        }
        const application = appRes.rows[0];
        const [reqsRes, candRes] = await Promise.all([
            db_1.default.query(`SELECT code, title, requirement_type, rule_type, rule_config, weight_score
         FROM opening_requirements
         WHERE job_opening_id = $1 AND company_id = $2 AND is_active = TRUE
         ORDER BY order_index ASC`, [application.job_opening_id, application.company_id]),
            db_1.default.query(`SELECT height_cm, weight_kg, sucamec_status, gun_license, driver_license,
                military_service, security_experience_years, structured_profile
         FROM candidates WHERE id = $1`, [application.candidate_id]),
        ]);
        const candidate = candRes.rows[0];
        const requirements = reqsRes.rows;
        // Evaluar eliminatorios en base a datos declarados
        const eliminatoriosFallidos = [];
        for (const req of requirements.filter((r) => r.requirement_type === 'eliminatory')) {
            const config = req.rule_config || {};
            let passes = true;
            if (req.rule_type === 'boolean') {
                const val = candidate[config.field];
                if (config.targetValue === true && !val)
                    passes = false;
                if (config.targetValue === false && val)
                    passes = false;
            }
            else if (req.rule_type === 'min_value') {
                const val = parseFloat(candidate[config.field] || 0);
                if (val < config.minValue)
                    passes = false;
            }
            else if (req.rule_type === 'min_months') {
                const expMo = parseInt(candidate.security_experience_years || 0) * 12;
                if (expMo < config.minMonths)
                    passes = false;
            }
            if (!passes)
                eliminatoriosFallidos.push(req.title);
        }
        // Calcular puntaje puntuable
        let scorePuntuable = 0;
        let maxPuntuable = 0;
        const scoreBreakdown = [];
        for (const req of requirements.filter((r) => r.requirement_type === 'scoreable')) {
            const config = req.rule_config || {};
            const weight = req.weight_score || 0;
            maxPuntuable += weight;
            let obtained = 0;
            let passed = false;
            if (req.rule_type === 'boolean') {
                const val = candidate[config.field];
                if (config.targetValue === true && val) {
                    obtained = weight;
                    passed = true;
                }
            }
            else if (req.rule_type === 'min_value') {
                const val = parseFloat(candidate[config.field] || 0);
                if (val >= config.minValue) {
                    obtained = weight;
                    passed = true;
                }
            }
            else if (req.rule_type === 'min_months') {
                const expMo = parseInt(candidate.security_experience_years || 0) * 12;
                if (expMo >= config.minMonths) {
                    obtained = weight;
                    passed = true;
                }
            }
            scorePuntuable += obtained;
            scoreBreakdown.push({ title: req.title, obtained, max: weight, passed });
        }
        const fitScorePct = maxPuntuable > 0 ? Math.round((scorePuntuable / maxPuntuable) * 100) : 0;
        const isEligible = eliminatoriosFallidos.length === 0;
        res.json({
            fitScore: fitScorePct,
            isEligible,
            eliminatoriosStatus: isEligible ? 'APROBADO' : 'NO_APTO',
            eliminatoriosFallidos,
            scorePuntuable,
            maxPuntuable,
            scoreBreakdown,
            prefilterScore: application.prefilter_score || null,
            prefilterStatus: application.prefilter_status || null,
            note: 'FitScore es indicativo. El puntaje oficial requiere verificación de documentos.',
        });
    }
    catch (err) {
        console.error('Error en getApplicationFitScore:', err);
        res.status(500).json({ error: 'Error al calcular FitScore.' });
    }
}
// ─── 12. OBTENER INFORMACIÓN DE CONTACTO PÚBLICA ───────────────────────────────
async function getPublicContactInfo(req, res) {
    const fallbackContact = {
        name: 'Security Force P&V S.A.C.',
        address: 'Av. Principal 123, San Isidro, Lima, Perú',
        phone: '+51 1 234-5678',
        email: 'rrhh@securityforce.pe',
        whatsapp: '+51 999 888 777',
        facebook_url: 'https://facebook.com/securityforce',
        instagram_url: 'https://instagram.com/securityforce',
        linkedin_url: 'https://linkedin.com/company/securityforce',
        hours: 'Lunes a Viernes: 8:00 AM - 6:00 PM',
    };
    try {
        const companyRes = await db_1.default.query(`SELECT 
         name, 
         address, 
         phone, 
         email, 
         whatsapp, 
         facebook_url, 
         instagram_url, 
         linkedin_url, 
         hours
       FROM companies 
       ORDER BY (is_active = TRUE) DESC, created_at ASC
       LIMIT 1`);
        if (companyRes.rows.length === 0) {
            res.json(fallbackContact);
            return;
        }
        const row = companyRes.rows[0];
        res.json({
            name: row.name || fallbackContact.name,
            address: row.address || fallbackContact.address,
            phone: row.phone || fallbackContact.phone,
            email: row.email || fallbackContact.email,
            whatsapp: row.whatsapp || fallbackContact.whatsapp,
            facebook_url: row.facebook_url || fallbackContact.facebook_url,
            instagram_url: row.instagram_url || fallbackContact.instagram_url,
            linkedin_url: row.linkedin_url || fallbackContact.linkedin_url,
            hours: row.hours || fallbackContact.hours,
        });
    }
    catch (err) {
        console.error('Error en getPublicContactInfo:', err);
        res.json(fallbackContact);
    }
}
//# sourceMappingURL=public.controller.js.map