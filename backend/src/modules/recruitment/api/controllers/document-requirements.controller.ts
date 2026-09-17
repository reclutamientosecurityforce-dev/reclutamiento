/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CONTROLADOR DE REQUISITOS DOCUMENTALES (Fase 2.9.3)
 * Security Force P&V S.A.C.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { Request, Response } from 'express';
import { DocumentRequirementsService } from '../../domain/services/document-requirements.service';

/**
 * GET /api/recruitment/openings/:openingId/document-requirements
 * Obtiene los requisitos documentales configurados para una convocatoria
 */
export async function getOpeningDocumentRequirements(req: Request, res: Response): Promise<void> {
  try {
    const openingId = req.params.openingId || req.params.id;
    const companyId = req.user!.companyId;

    const requirements = await DocumentRequirementsService.getOpeningDocumentRequirements(
      openingId,
      companyId
    );

    res.json(requirements);
  } catch (err) {
    console.error('Error en getOpeningDocumentRequirements:', err);
    res.status(500).json({ error: 'Error al obtener requisitos documentales' });
  }
}

/**
 * POST /api/recruitment/openings/:openingId/document-requirements
 * Crea un nuevo requisito documental para una convocatoria
 */
export async function createOpeningDocumentRequirement(req: Request, res: Response): Promise<void> {
  try {
    const openingId = req.params.openingId || req.params.id;
    const companyId = req.user!.companyId;
    const userId = req.user!.id;

    const {
      requirementId,
      documentType,
      documentCategory,
      title,
      description,
      isRequired,
      allowMultiple,
      maxFiles,
      orderIndex,
    } = req.body;

    const requirement = await DocumentRequirementsService.createOpeningDocumentRequirement({
      companyId,
      jobOpeningId: openingId,
      requirementId,
      documentType,
      documentCategory,
      title,
      description,
      isRequired,
      allowMultiple,
      maxFiles,
      orderIndex,
      createdBy: userId,
    });

    res.status(201).json(requirement);
  } catch (err) {
    console.error('Error en createOpeningDocumentRequirement:', err);
    res.status(500).json({ error: 'Error al crear requisito documental' });
  }
}

/**
 * PUT /api/recruitment/document-requirements/:id
 * Actualiza un requisito documental existente
 */
export async function updateOpeningDocumentRequirement(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const companyId = req.user!.companyId;

    const requirement = await DocumentRequirementsService.updateOpeningDocumentRequirement(
      id,
      companyId,
      req.body
    );

    res.json(requirement);
  } catch (err) {
    console.error('Error en updateOpeningDocumentRequirement:', err);
    res.status(500).json({ error: 'Error al actualizar requisito documental' });
  }
}

/**
 * DELETE /api/recruitment/document-requirements/:id
 * Elimina (desactiva) un requisito documental
 */
export async function deleteOpeningDocumentRequirement(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const companyId = req.user!.companyId;

    await DocumentRequirementsService.deleteOpeningDocumentRequirement(id, companyId);

    res.status(204).send();
  } catch (err) {
    console.error('Error en deleteOpeningDocumentRequirement:', err);
    res.status(500).json({ error: 'Error al eliminar requisito documental' });
  }
}

/**
 * GET /api/recruitment/applications/:applicationId/expediente-status
 * Obtiene el estado del expediente de una postulación
 */
export async function getExpedienteStatus(req: Request, res: Response): Promise<void> {
  try {
    const applicationId = req.params.applicationId || req.params.id;
    const companyId = req.user!.companyId;

    const status = await DocumentRequirementsService.getExpedienteStatus(
      applicationId,
      companyId
    );

    if (!status) {
      res.status(404).json({ error: 'Expediente no encontrado' });
      return;
    }

    res.json(status);
  } catch (err) {
    console.error('Error en getExpedienteStatus:', err);
    res.status(500).json({ error: 'Error al obtener estado del expediente' });
  }
}

/**
 * GET /api/recruitment/applications/:applicationId/expediente-progress
 * Calcula el progreso del expediente de una postulación
 */
export async function getExpedienteProgress(req: Request, res: Response): Promise<void> {
  try {
    const applicationId = req.params.applicationId || req.params.id;
    const companyId = req.user!.companyId;

    const progress = await DocumentRequirementsService.calculateExpedienteProgress(
      applicationId,
      companyId
    );

    res.json(progress);
  } catch (err) {
    console.error('Error en getExpedienteProgress:', err);
    res.status(500).json({ error: 'Error al calcular progreso del expediente' });
  }
}

/**
 * POST /api/recruitment/openings/:openingId/setup-default-requirements
 * Configura requisitos documentales predeterminados para una convocatoria
 */
export async function setupDefaultDocumentRequirements(req: Request, res: Response): Promise<void> {
  try {
    const openingId = req.params.openingId || req.params.id;
    const companyId = req.user!.companyId;
    const userId = req.user!.id;
    const { positionType } = req.body;

    const requirements = await DocumentRequirementsService.setupDefaultDocumentRequirements(
      openingId,
      companyId,
      positionType,
      userId
    );

    res.status(201).json(requirements);
  } catch (err) {
    console.error('Error en setupDefaultDocumentRequirements:', err);
    res.status(500).json({ error: 'Error al configurar requisitos predeterminados' });
  }
}