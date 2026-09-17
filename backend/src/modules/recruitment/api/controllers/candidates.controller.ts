import { Request, Response } from 'express';
import { z } from 'zod';
import db from '../../../../db';
import { Candidate, PaginatedResponse } from '../../../../types';
import { calculateNonOverlappingMonths } from '../../domain/evaluation.engine';

const candidateSchema = z.object({
  documentType: z.string().default('DNI'),
  documentNumber: z.string().min(8).max(20),
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().min(6),
  address: z.string().optional(),
  district: z.string().optional(),
  city: z.string().default('Lima'),
  birthDate: z.string().optional(),
  gender: z.string().optional(),
  heightCm: z.number().int().positive().optional(),
  weightKg: z.number().positive().optional(),
  sucamecStatus: z.enum(['valid', 'in_process', 'none', 'expired']).default('none'),
  sucamecCode: z.string().optional(),
  sucamecExpiresAt: z.string().optional(),
  gunLicense: z.boolean().default(false),
  gunLicenseType: z.string().optional(),
  driverLicense: z.boolean().default(false),
  driverLicenseType: z.string().optional(),
  militaryService: z.boolean().default(false),
  securityExperienceYears: z.number().int().nonnegative().default(0),
  notes: z.string().optional(),
  jobOpeningId: z.string().uuid().optional(), // postulación inicial opcional
});

/**
 * GET /api/candidates
 * Lista paginada con búsqueda por DNI o nombres y filtros por SUCAMEC.
 */
export async function getCandidates(req: Request, res: Response): Promise<void> {
  try {
    const companyId = req.user!.companyId;
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(100, Math.max(10, parseInt(req.query.limit as string, 10) || 20));
    const offset = (page - 1) * limit;

    const search = req.query.search as string | undefined;
    const sucamec = req.query.sucamec as string | undefined;
    const gunLicense = req.query.gunLicense as string | undefined;

    const conditions: string[] = ['c.company_id = $1'];
    const params: unknown[] = [companyId];
    let idx = 2;

    if (search?.trim()) {
      conditions.push(`(c.document_number ILIKE $${idx} OR c.first_name ILIKE $${idx} OR c.last_name ILIKE $${idx})`);
      params.push(`%${search.trim()}%`);
      idx++;
    }

    if (sucamec) {
      conditions.push(`c.sucamec_status = $${idx++}`);
      params.push(sucamec);
    }

    if (gunLicense === 'true') {
      conditions.push(`c.gun_license = TRUE`);
    }

    const where = conditions.join(' AND ');

    const countRes = await db.query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM candidates c WHERE ${where}`,
      params
    );
    const total = parseInt(countRes.rows[0].count, 10);

    const { rows } = await db.query<Candidate>(
      `SELECT 
         c.*,
         a.id AS application_id,
         a.current_stage,
         jo.title AS job_opening_title
       FROM candidates c
       LEFT JOIN LATERAL (
         SELECT id, current_stage, job_opening_id 
         FROM applications 
         WHERE candidate_id = c.id 
         ORDER BY created_at DESC 
         LIMIT 1
       ) a ON true
       LEFT JOIN job_openings jo ON a.job_opening_id = jo.id
       WHERE ${where}
       ORDER BY c.created_at DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, limit, offset]
    );

    res.json({
      data: rows,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
        hasNext: offset + limit < total,
        hasPrev: page > 1,
      },
    } as PaginatedResponse<Candidate>);
  } catch (err) {
    console.error('Error en getCandidates:', err);
    res.status(500).json({ error: 'Error al obtener postulantes.' });
  }
}

/**
 * GET /api/candidates/:id
 */
export async function getCandidate(req: Request, res: Response): Promise<void> {
  try {
    const companyId = req.user!.companyId;
    const { id } = req.params;

    const { rows } = await db.query<Candidate>(
      `SELECT c.* FROM candidates c WHERE c.id = $1 AND c.company_id = $2`,
      [id, companyId]
    );

    if (rows.length === 0) {
      res.status(404).json({ error: 'Postulante no encontrado.' });
      return;
    }

    // Obtener historial de postulaciones y etapas
    const appsRes = await db.query(
      `SELECT 
         a.*, jo.title AS job_title, u.full_name AS recruiter_name
       FROM applications a
       JOIN job_openings jo ON a.job_opening_id = jo.id
       LEFT JOIN users u ON a.assigned_recruiter = u.id
       WHERE a.candidate_id = $1 AND a.company_id = $2
       ORDER BY a.created_at DESC`,
      [id, companyId]
    );

    res.json({
      ...rows[0],
      applications: appsRes.rows,
    });
  } catch (err) {
    console.error('Error en getCandidate:', err);
    res.status(500).json({ error: 'Error al obtener detalle del postulante.' });
  }
}

/**
 * POST /api/candidates
 * Registro de nuevo postulante.
 */
export async function createCandidate(req: Request, res: Response): Promise<void> {
  try {
    const companyId = req.user!.companyId;
    const userId = req.user!.id;

    const parsed = candidateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Datos de postulante inválidos.', details: parsed.error.issues });
      return;
    }

    const d = parsed.data;

    // Inserción en transacción
    const candidate = await db.transaction(async (client) => {
      const { rows } = await client.query<Candidate>(
        `INSERT INTO candidates (
           company_id, document_type, document_number, first_name, last_name,
           email, phone, address, district, city, birth_date, gender,
           height_cm, weight_kg, sucamec_status, sucamec_code, sucamec_expires_at,
           gun_license, gun_license_type, driver_license, driver_license_type,
           military_service, security_experience_years, notes, created_by
         ) VALUES (
           $1, $2, $3, $4, $5,
           $6, $7, $8, $9, $10, $11, $12,
           $13, $14, $15, $16, $17,
           $18, $19, $20, $21,
           $22, $23, $24, $25
         ) RETURNING *`,
        [
          companyId, d.documentType, d.documentNumber, d.firstName, d.lastName,
          d.email || null, d.phone, d.address || null, d.district || null, d.city || 'Lima',
          d.birthDate || null, d.gender || null, d.heightCm || null, d.weightKg || null,
          d.sucamecStatus, d.sucamecCode || null, d.sucamecExpiresAt || null,
          d.gunLicense, d.gunLicenseType || null, d.driverLicense, d.driverLicenseType || null,
          d.militaryService, d.securityExperienceYears, d.notes || null, userId,
        ]
      );

      const newCand = rows[0];

      // Si se especificó una convocatoria, crear la postulación
      if (d.jobOpeningId) {
        await client.query(
          `INSERT INTO applications (company_id, candidate_id, job_opening_id, current_stage, assigned_recruiter)
           VALUES ($1, $2, $3, 'registered', $4)`,
          [companyId, newCand.id, d.jobOpeningId, userId]
        );
      }

      await client.query(
        `INSERT INTO audit_logs (company_id, user_id, action, resource, resource_id, details, ip_address, success)
         VALUES ($1, $2, 'candidate_created', 'candidates', $3, $4, $5::inet, TRUE)`,
        [
          companyId, userId, newCand.id,
          JSON.stringify({ dni: d.documentNumber, name: `${d.firstName} ${d.lastName}` }),
          req.ip,
        ]
      );

      return newCand;
    });

    res.status(201).json(candidate);
  } catch (err: unknown) {
    const pgErr = err as { code?: string };
    if (pgErr.code === '23505') {
      res.status(409).json({ error: 'Ya existe un postulante con ese número de documento en la empresa.' });
      return;
    }
    console.error('Error en createCandidate:', err);
    res.status(500).json({ error: 'Error al registrar postulante.' });
  }
}

/**
 * PUT /api/candidates/:id
 */
export async function updateCandidate(req: Request, res: Response): Promise<void> {
  try {
    const companyId = req.user!.companyId;
    const { id } = req.params;

    const parsed = candidateSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Datos inválidos.', details: parsed.error.issues });
      return;
    }

    const d = parsed.data;
    const { rows } = await db.query<Candidate>(
      `UPDATE candidates
       SET first_name = COALESCE($1, first_name),
           last_name = COALESCE($2, last_name),
           phone = COALESCE($3, phone),
           email = COALESCE($4, email),
           district = COALESCE($5, district),
           height_cm = COALESCE($6, height_cm),
           weight_kg = COALESCE($7, weight_kg),
           sucamec_status = COALESCE($8, sucamec_status),
           sucamec_code = COALESCE($9, sucamec_code),
           gun_license = COALESCE($10, gun_license),
           gun_license_type = COALESCE($11, gun_license_type),
           driver_license = COALESCE($12, driver_license),
           driver_license_type = COALESCE($13, driver_license_type),
           military_service = COALESCE($14, military_service),
           security_experience_years = COALESCE($15, security_experience_years),
           notes = COALESCE($16, notes),
           updated_at = NOW()
       WHERE id = $17 AND company_id = $18
       RETURNING *`,
      [
        d.firstName, d.lastName, d.phone, d.email, d.district,
        d.heightCm, d.weightKg, d.sucamecStatus, d.sucamecCode,
        d.gunLicense, d.gunLicenseType, d.driverLicense, d.driverLicenseType,
        d.militaryService, d.securityExperienceYears, d.notes,
        id, companyId,
      ]
    );

    if (rows.length === 0) {
      res.status(404).json({ error: 'Postulante no encontrado.' });
      return;
    }

    res.json(rows[0]);
  } catch (err) {
    console.error('Error en updateCandidate:', err);
    res.status(500).json({ error: 'Error al actualizar postulante.' });
  }
}

/**
 * GET /api/candidates/:id/expediente
 * Vista maestra del expediente digital del candidato con historial, documentos y evaluaciones.
 */
export async function getCandidateExpediente(req: Request, res: Response): Promise<void> {
  try {
    const companyId = req.user!.companyId;
    const { id } = req.params;

    // 1. Datos del candidato
    const candRes = await db.query<Candidate>(
      `SELECT * FROM candidates WHERE id = $1 AND company_id = $2`,
      [id, companyId]
    );

    if (candRes.rows.length === 0) {
      res.status(404).json({ error: 'Postulante no encontrado.' });
      return;
    }
    const candidate = candRes.rows[0];

    // 2. Historial de postulaciones y evaluaciones
    const appsRes = await db.query(
      `SELECT 
         a.*,
         jo.title AS job_title,
         jo.location AS job_location,
         jo.position_type AS job_position_type,
         jp.title AS publication_title,
         jp.slug AS publication_slug,
         rc.name AS channel_name,
         camp.name AS campaign_name
       FROM applications a
       JOIN job_openings jo ON a.job_opening_id = jo.id
       LEFT JOIN job_publications jp ON a.publication_id = jp.id
       LEFT JOIN recruitment_channels rc ON a.channel_id = rc.id
       LEFT JOIN recruitment_campaigns camp ON a.campaign_id = camp.id
       WHERE a.candidate_id = $1 AND a.company_id = $2
       ORDER BY a.created_at DESC`,
      [id, companyId]
    );

    // 3. Documentos y evidencias del candidato
    const appIds = appsRes.rows.map(a => a.id);
    let docs: any[] = [];
    if (appIds.length > 0) {
      const docsRes = await db.query(
        `SELECT * FROM application_documents WHERE application_id = ANY($1) ORDER BY uploaded_at DESC`,
        [appIds]
      );
      docs = docsRes.rows;
    }

    // 4. Entrevistas registradas
    let interviews: any[] = [];
    if (appIds.length > 0) {
      const intRes = await db.query(
        `SELECT i.*, u.full_name AS interviewer_name
         FROM interviews i
         LEFT JOIN users u ON i.interviewer_id = u.id
         WHERE i.application_id = ANY($1)
         ORDER BY i.interview_date DESC`,
        [appIds]
      );
      interviews = intRes.rows;
    }

    // 5. Semáforo de vigencias documentales
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const validities = {
      sucamec: {
        status: candidate.sucamec_status,
        code: candidate.sucamec_code,
        expiresAt: candidate.sucamec_expires_at,
        isExpired: candidate.sucamec_expires_at ? new Date(candidate.sucamec_expires_at) < now : false,
        isExpiringSoon: candidate.sucamec_expires_at ? (new Date(candidate.sucamec_expires_at) >= now && new Date(candidate.sucamec_expires_at) <= thirtyDaysFromNow) : false,
      },
      gunLicense: {
        hasLicense: !!candidate.gun_license,
        type: candidate.gun_license_type || null,
        status: candidate.gun_license ? 'Acreditado' : 'No Posee',
      },
      driverLicense: {
        hasLicense: !!candidate.driver_license,
        type: candidate.driver_license_type || null,
        status: candidate.driver_license ? 'Acreditado' : 'No Posee',
      },
    };

    // 6. Desglose comparativo de experiencia (Declarada vs Acreditada vs Fusión)
    const structuredProfile = candidate.structured_profile || { experiences: [] };
    const experiences = structuredProfile.experiences || [];
    const nonOverlappingMonths = calculateNonOverlappingMonths(experiences);
    const declaredYears = Number(candidate.security_experience_years) || 0;
    const declaredMonths = declaredYears * 12;

    const hasWorkCerts = docs.some((d: any) => d.document_type === 'cert_trabajo' || d.document_type === 'cul');
    const accreditedMonths = hasWorkCerts ? nonOverlappingMonths : Math.min(declaredMonths, nonOverlappingMonths);
    const discrepancyMonths = Math.abs(declaredMonths - accreditedMonths);

    const rawMonthsSum = experiences.reduce((acc: number, exp: any) => {
      if (!exp.startDate) return acc;
      const start = new Date(exp.startDate);
      const end = exp.endDate ? new Date(exp.endDate) : new Date();
      if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) return acc;
      const diff = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1;
      return acc + Math.max(1, diff);
    }, 0);

    const hasOverlap = rawMonthsSum > nonOverlappingMonths && nonOverlappingMonths > 0;

    const experienceBreakdown = {
      declaredYears,
      declaredMonths,
      accreditedMonths,
      discrepancyMonths,
      hasOverlap,
      rawSumMonths: rawMonthsSum,
      nonOverlappingMonths,
      status: discrepancyMonths > 6 ? 'DISCREPANCIA' : 'CONSISTENTE',
    };

    res.json({
      candidate,
      applications: appsRes.rows,
      documents: docs,
      interviews,
      validities,
      experienceBreakdown,
    });
  } catch (err) {
    console.error('Error en getCandidateExpediente:', err);
    res.status(500).json({ error: 'Error al obtener expediente del candidato.' });
  }
}
