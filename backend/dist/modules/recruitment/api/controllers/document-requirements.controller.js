"use strict";
/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CONTROLADOR DE REQUISITOS DOCUMENTALES (Fase 2.9.3)
 * Security Force P&V S.A.C.
 * ═══════════════════════════════════════════════════════════════════════════
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOpeningDocumentRequirements = getOpeningDocumentRequirements;
exports.createOpeningDocumentRequirement = createOpeningDocumentRequirement;
exports.updateOpeningDocumentRequirement = updateOpeningDocumentRequirement;
exports.deleteOpeningDocumentRequirement = deleteOpeningDocumentRequirement;
exports.getExpedienteStatus = getExpedienteStatus;
exports.getExpedienteProgress = getExpedienteProgress;
exports.setupDefaultDocumentRequirements = setupDefaultDocumentRequirements;
const document_requirements_service_1 = require("../../domain/services/document-requirements.service");
/**
 * GET /api/recruitment/openings/:openingId/document-requirements
 * Obtiene los requisitos documentales configurados para una convocatoria
 */
async function getOpeningDocumentRequirements(req, res) {
    try {
        const openingId = req.params.openingId || req.params.id;
        const companyId = req.user.companyId;
        const requirements = await document_requirements_service_1.DocumentRequirementsService.getOpeningDocumentRequirements(openingId, companyId);
        res.json(requirements);
    }
    catch (err) {
        console.error('Error en getOpeningDocumentRequirements:', err);
        res.status(500).json({ error: 'Error al obtener requisitos documentales' });
    }
}
/**
 * POST /api/recruitment/openings/:openingId/document-requirements
 * Crea un nuevo requisito documental para una convocatoria
 */
async function createOpeningDocumentRequirement(req, res) {
    try {
        const openingId = req.params.openingId || req.params.id;
        const companyId = req.user.companyId;
        const userId = req.user.id;
        const { requirementId, documentType, documentCategory, title, description, isRequired, allowMultiple, maxFiles, orderIndex, } = req.body;
        const requirement = await document_requirements_service_1.DocumentRequirementsService.createOpeningDocumentRequirement({
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
    }
    catch (err) {
        console.error('Error en createOpeningDocumentRequirement:', err);
        res.status(500).json({ error: 'Error al crear requisito documental' });
    }
}
/**
 * PUT /api/recruitment/document-requirements/:id
 * Actualiza un requisito documental existente
 */
async function updateOpeningDocumentRequirement(req, res) {
    try {
        const { id } = req.params;
        const companyId = req.user.companyId;
        const requirement = await document_requirements_service_1.DocumentRequirementsService.updateOpeningDocumentRequirement(id, companyId, req.body);
        res.json(requirement);
    }
    catch (err) {
        console.error('Error en updateOpeningDocumentRequirement:', err);
        res.status(500).json({ error: 'Error al actualizar requisito documental' });
    }
}
/**
 * DELETE /api/recruitment/document-requirements/:id
 * Elimina (desactiva) un requisito documental
 */
async function deleteOpeningDocumentRequirement(req, res) {
    try {
        const { id } = req.params;
        const companyId = req.user.companyId;
        await document_requirements_service_1.DocumentRequirementsService.deleteOpeningDocumentRequirement(id, companyId);
        res.status(204).send();
    }
    catch (err) {
        console.error('Error en deleteOpeningDocumentRequirement:', err);
        res.status(500).json({ error: 'Error al eliminar requisito documental' });
    }
}
/**
 * GET /api/recruitment/applications/:applicationId/expediente-status
 * Obtiene el estado del expediente de una postulación
 */
async function getExpedienteStatus(req, res) {
    try {
        const applicationId = req.params.applicationId || req.params.id;
        const companyId = req.user.companyId;
        const status = await document_requirements_service_1.DocumentRequirementsService.getExpedienteStatus(applicationId, companyId);
        if (!status) {
            res.status(404).json({ error: 'Expediente no encontrado' });
            return;
        }
        res.json(status);
    }
    catch (err) {
        console.error('Error en getExpedienteStatus:', err);
        res.status(500).json({ error: 'Error al obtener estado del expediente' });
    }
}
/**
 * GET /api/recruitment/applications/:applicationId/expediente-progress
 * Calcula el progreso del expediente de una postulación
 */
async function getExpedienteProgress(req, res) {
    try {
        const applicationId = req.params.applicationId || req.params.id;
        const companyId = req.user.companyId;
        const progress = await document_requirements_service_1.DocumentRequirementsService.calculateExpedienteProgress(applicationId, companyId);
        res.json(progress);
    }
    catch (err) {
        console.error('Error en getExpedienteProgress:', err);
        res.status(500).json({ error: 'Error al calcular progreso del expediente' });
    }
}
/**
 * POST /api/recruitment/openings/:openingId/setup-default-requirements
 * Configura requisitos documentales predeterminados para una convocatoria
 */
async function setupDefaultDocumentRequirements(req, res) {
    try {
        const openingId = req.params.openingId || req.params.id;
        const companyId = req.user.companyId;
        const userId = req.user.id;
        const { positionType } = req.body;
        const requirements = await document_requirements_service_1.DocumentRequirementsService.setupDefaultDocumentRequirements(openingId, companyId, positionType, userId);
        res.status(201).json(requirements);
    }
    catch (err) {
        console.error('Error en setupDefaultDocumentRequirements:', err);
        res.status(500).json({ error: 'Error al configurar requisitos predeterminados' });
    }
}
//# sourceMappingURL=document-requirements.controller.js.map