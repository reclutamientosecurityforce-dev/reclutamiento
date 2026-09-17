import { Request, Response } from 'express';
import { z } from 'zod';
import db from '../../../../db';
import { Application } from '../../../../types';

const advanceStageSchema = z.object({
  targetStage: z.enum([
    'registered',
    'phone_screening',
    'psychological_eval',
    'background_check',
    'interview',
    'medical_exam',
    'approved',
    'rejected',
    'hired',
  ]),
  stageScore: z.number().min(0).max(100).optional(),
  result: z.enum(['pending', 'passed', 'failed', 'conditional']).default('passed'),
  observations: z.string().optional(),
  rejectionReason: z.string().optional(),
  hiredNotes: z.string().optional(),
});

/**
 * GET /api/pipeline
 * Lista todas las postulaciones activas agrupadas por etapa para vista Kanban o lista.
 */
export async function getPipelineApplications(req: Request, res: Response): Promise<void> {
  try {
    const companyId = req.user!.companyId;
    const openingId = req.query.openingId as string | undefined;

    const conditions = ['a.company_id = $1'];
    const params: unknown[] = [companyId];
    let idx = 2;

    if (openingId) {
      conditions.push(`a.job_opening_id = $${idx++}`);
      params.push(openingId);
    }

    const { rows } = await db.query<Application>(
      `SELECT 
         a.*,
         c.first_name || ' ' || c.last_name AS candidate_name,
         c.document_number AS candidate_dni,
         c.phone AS candidate_phone,
         c.sucamec_status AS candidate_sucamec,
         c.gun_license AS candidate_gun_license,
         jo.title AS job_title,
         u.full_name AS recruiter_name
       FROM applications a
       JOIN candidates c ON a.candidate_id = c.id
       JOIN job_openings jo ON a.job_opening_id = jo.id
       LEFT JOIN users u ON a.assigned_recruiter = u.id
       WHERE ${conditions.join(' AND ')}
       ORDER BY a.updated_at DESC`,
      params
    );

    res.json(rows);
  } catch (err) {
    console.error('Error en getPipelineApplications:', err);
    res.status(500).json({ error: 'Error al obtener postulaciones del pipeline.' });
  }
}

/**
 * POST /api/pipeline/:id/advance
 * Avanza o cambia de etapa a un postulante y registra la evaluación.
 */
export async function advanceCandidateStage(req: Request, res: Response): Promise<void> {
  try {
    const companyId = req.user!.companyId;
    const userId = req.user!.id;
    const { id } = req.params;

    const parsed = advanceStageSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Datos de etapa inválidos.', details: parsed.error.issues });
      return;
    }

    const d = parsed.data;

    const updated = await db.transaction(async (client) => {
      // 1. Obtener la postulación
      const appRes = await client.query<{
        id: string; current_stage: string; candidate_id: string; job_opening_id: string;
      }>(
        `SELECT id, current_stage, candidate_id, job_opening_id 
         FROM applications 
         WHERE id = $1 AND company_id = $2 
         FOR UPDATE`,
        [id, companyId]
      );

      if (appRes.rows.length === 0) {
        throw { statusCode: 404, message: 'Postulación no encontrada.' };
      }

      const app = appRes.rows[0];
      const oldStage = app.current_stage;

      // 2. Si se contrata, incrementar filled_count en la vacante
      if (d.targetStage === 'hired' && oldStage !== 'hired') {
        await client.query(
          `UPDATE job_openings 
           SET filled_count = filled_count + 1,
               status = CASE WHEN filled_count + 1 >= vacancies_count THEN 'filled'::opening_status ELSE status END,
               updated_at = NOW()
           WHERE id = $1 AND company_id = $2`,
          [app.job_opening_id, companyId]
        );
      }

      // 3. Actualizar la postulación con casting explícito de candidate_status
      const { rows } = await client.query<Application>(
        `UPDATE applications
         SET current_stage = $1::candidate_status,
             stage_score = COALESCE($2, stage_score),
             rejection_reason = CASE WHEN $1::candidate_status = 'rejected'::candidate_status THEN $3 ELSE rejection_reason END,
             hired_at = CASE WHEN $1::candidate_status = 'hired'::candidate_status THEN NOW() ELSE hired_at END,
             hired_notes = CASE WHEN $1::candidate_status = 'hired'::candidate_status THEN $4 ELSE hired_notes END,
             updated_at = NOW()
         WHERE id = $5 AND company_id = $6
         RETURNING *`,
        [d.targetStage, d.stageScore ?? null, d.rejectionReason ?? null, d.hiredNotes ?? null, id, companyId]
      );

      // 4. Registrar en stage_evaluations
      await client.query(
        `INSERT INTO stage_evaluations (
           company_id, application_id, stage, result, score, observations, evaluator_id
         ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          companyId, id, d.targetStage, d.result, d.stageScore || null,
          d.observations || (d.targetStage === 'rejected' ? d.rejectionReason : null),
          userId,
        ]
      );

      // 5. Auditoría
      await client.query(
        `INSERT INTO audit_logs (company_id, user_id, action, resource, resource_id, details, ip_address, success)
         VALUES ($1, $2, 'stage_advanced', 'applications', $3, $4, $5::inet, TRUE)`,
        [
          companyId, userId, id,
          JSON.stringify({ oldStage, newStage: d.targetStage, score: d.stageScore, result: d.result }),
          req.ip,
        ]
      );

      return rows[0];
    });

    res.json({ message: 'Etapa actualizada exitosamente.', application: updated });
  } catch (err: unknown) {
    const e = err as { statusCode?: number; message?: string };
    if (e.statusCode) {
      res.status(e.statusCode).json({ error: e.message });
      return;
    }
    console.error('Error en advanceCandidateStage:', err);
    res.status(500).json({ error: 'Error al cambiar etapa de selección.' });
  }
}
