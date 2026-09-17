import { Request, Response } from 'express';
import { z } from 'zod';
import db from '../../../../db';
import { Interview } from '../../../../types';

const scheduleInterviewSchema = z.object({
  applicationId: z.string().uuid(),
  interviewDate: z.string(),
  locationType: z.enum(['presential', 'virtual']).default('presential'),
  locationNotes: z.string().optional(),
  interviewerId: z.string().uuid().optional(),
});

/**
 * GET /api/interviews
 */
export async function getInterviews(req: Request, res: Response): Promise<void> {
  try {
    const companyId = req.user!.companyId;
    const { rows } = await db.query<Interview>(
      `SELECT 
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
       ORDER BY i.interview_date ASC`,
      [companyId]
    );

    res.json(rows);
  } catch (err) {
    console.error('Error en getInterviews:', err);
    res.status(500).json({ error: 'Error al obtener entrevistas.' });
  }
}

/**
 * POST /api/interviews
 */
export async function scheduleInterview(req: Request, res: Response): Promise<void> {
  try {
    const companyId = req.user!.companyId;
    const userId = req.user!.id;

    const parsed = scheduleInterviewSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Datos de entrevista inválidos.', details: parsed.error.issues });
      return;
    }

    const d = parsed.data;
    const { rows } = await db.query<Interview>(
      `INSERT INTO interviews (
         company_id, application_id, interview_date, location_type,
         location_notes, interviewer_id, status
       ) VALUES ($1, $2, $3, $4, $5, $6, 'scheduled')
       RETURNING *`,
      [companyId, d.applicationId, d.interviewDate, d.locationType, d.locationNotes || null, d.interviewerId || userId]
    );

    // Actualizar la etapa de la postulación a interview si no está en ella
    await db.query(
      `UPDATE applications SET current_stage = 'interview', updated_at = NOW() WHERE id = $1 AND company_id = $2`,
      [d.applicationId, companyId]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Error en scheduleInterview:', err);
    res.status(500).json({ error: 'Error al agendar entrevista.' });
  }
}
