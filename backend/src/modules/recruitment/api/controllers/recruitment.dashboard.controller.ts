import { Request, Response } from 'express';
import db from '../../../../db';
import { RecruitmentSummary } from '../../../../types';

/**
 * GET /api/recruitment/summary
 * Métricas agregadas y embudo de selección en tiempo real.
 */
export async function getRecruitmentSummary(req: Request, res: Response): Promise<void> {
  try {
    const companyId = req.user!.companyId;

    // 1. Contadores generales
    const totalsResult = await db.query<{
      total_candidates: string;
      open_vacancies: string;
      in_evaluation: string;
      approved_count: string;
      hired_count: string;
    }>(
      `SELECT
         (SELECT COUNT(*) FROM candidates WHERE company_id = $1) AS total_candidates,
         (SELECT COALESCE(SUM(vacancies_count - filled_count), 0) FROM job_openings WHERE company_id = $1 AND status = 'open') AS open_vacancies,
         (SELECT COUNT(*) FROM applications WHERE company_id = $1 AND current_stage NOT IN ('approved', 'rejected', 'hired')) AS in_evaluation,
         (SELECT COUNT(*) FROM applications WHERE company_id = $1 AND current_stage = 'approved') AS approved_count,
         (SELECT COUNT(*) FROM applications WHERE company_id = $1 AND current_stage = 'hired') AS hired_count
      `,
      [companyId]
    );

    // 2. Conteo por etapas del pipeline
    const pipelineResult = await db.query<{ stage: string; count: string }>(
      `SELECT current_stage AS stage, COUNT(*) AS count
       FROM applications
       WHERE company_id = $1
       GROUP BY current_stage`,
      [companyId]
    );

    const pipelineCounts: Record<string, number> = {
      registered: 0,
      phone_screening: 0,
      psychological_eval: 0,
      background_check: 0,
      interview: 0,
      medical_exam: 0,
      approved: 0,
      hired: 0,
      rejected: 0,
    };

    pipelineResult.rows.forEach((r) => {
      pipelineCounts[r.stage] = parseInt(r.count, 10);
    });

    // 3. Reclutadores activos
    const recruitersResult = await db.query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM users WHERE company_id = $1 AND is_active = TRUE`,
      [companyId]
    );

    const row = totalsResult.rows[0];
    const summary: RecruitmentSummary = {
      totalCandidates: parseInt(row.total_candidates, 10) || 0,
      openVacancies: parseInt(row.open_vacancies, 10) || 0,
      inEvaluation: parseInt(row.in_evaluation, 10) || 0,
      approvedCount: parseInt(row.approved_count, 10) || 0,
      hiredCount: parseInt(row.hired_count, 10) || 0,
      activeRecruiters: parseInt(recruitersResult.rows[0].count, 10) || 0,
      pipelineCounts: pipelineCounts as RecruitmentSummary['pipelineCounts'],
    };

    res.json(summary);
  } catch (err) {
    console.error('Error en getRecruitmentSummary:', err);
    res.status(500).json({ error: 'Error al obtener resumen de reclutamiento.' });
  }
}

/**
 * GET /api/recruitment/recent-activity
 */
export async function getRecentRecruitmentActivity(req: Request, res: Response): Promise<void> {
  try {
    const companyId = req.user!.companyId;
    const { rows } = await db.query(
      `SELECT 
         al.action, al.details, al.created_at,
         u.full_name AS user_full_name, u.username
       FROM audit_logs al
       LEFT JOIN users u ON al.user_id = u.id
       WHERE al.company_id = $1 AND al.resource IN ('candidates', 'applications', 'job_openings', 'interviews')
       ORDER BY al.created_at DESC
       LIMIT 10`,
      [companyId]
    );
    res.json(rows);
  } catch (err) {
    console.error('Error en getRecentRecruitmentActivity:', err);
    res.status(500).json({ error: 'Error al obtener actividad reciente.' });
  }
}
