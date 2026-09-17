"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getInterviews = getInterviews;
exports.scheduleInterview = scheduleInterview;
const zod_1 = require("zod");
const db_1 = __importDefault(require("../../../../db"));
const scheduleInterviewSchema = zod_1.z.object({
    applicationId: zod_1.z.string().uuid(),
    interviewDate: zod_1.z.string(),
    locationType: zod_1.z.enum(['presential', 'virtual']).default('presential'),
    locationNotes: zod_1.z.string().optional(),
    interviewerId: zod_1.z.string().uuid().optional(),
});
/**
 * GET /api/interviews
 */
async function getInterviews(req, res) {
    try {
        const companyId = req.user.companyId;
        const { rows } = await db_1.default.query(`SELECT 
         i.*,
         c.first_name || ' ' || c.last_name AS candidate_name,
         c.phone AS candidate_phone,
         jo.title AS job_title,
         u.full_name AS interviewer_name
       FROM interviews i
       JOIN applications a ON i.application_id = a.id
       JOIN candidates c ON a.candidate_id = c.id
       JOIN job_openings jo ON a.job_opening_id = jo.id
       LEFT JOIN users u ON i.interviewer_id = u.id
       WHERE i.company_id = $1
       ORDER BY i.interview_date ASC`, [companyId]);
        res.json(rows);
    }
    catch (err) {
        console.error('Error en getInterviews:', err);
        res.status(500).json({ error: 'Error al obtener entrevistas.' });
    }
}
/**
 * POST /api/interviews
 */
async function scheduleInterview(req, res) {
    try {
        const companyId = req.user.companyId;
        const userId = req.user.id;
        const parsed = scheduleInterviewSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ error: 'Datos de entrevista inválidos.', details: parsed.error.issues });
            return;
        }
        const d = parsed.data;
        const { rows } = await db_1.default.query(`INSERT INTO interviews (
         company_id, application_id, interview_date, location_type,
         location_notes, interviewer_id, status
       ) VALUES ($1, $2, $3, $4, $5, $6, 'scheduled')
       RETURNING *`, [companyId, d.applicationId, d.interviewDate, d.locationType, d.locationNotes || null, d.interviewerId || userId]);
        // Actualizar la etapa de la postulación a interview si no está en ella
        await db_1.default.query(`UPDATE applications SET current_stage = 'interview', updated_at = NOW() WHERE id = $1 AND company_id = $2`, [d.applicationId, companyId]);
        res.status(201).json(rows[0]);
    }
    catch (err) {
        console.error('Error en scheduleInterview:', err);
        res.status(500).json({ error: 'Error al agendar entrevista.' });
    }
}
//# sourceMappingURL=interviews.controller.js.map