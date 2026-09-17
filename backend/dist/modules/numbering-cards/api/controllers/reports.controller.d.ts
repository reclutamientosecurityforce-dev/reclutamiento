import { Request, Response } from 'express';
/**
 * GET /api/admin/reports/cards
 * Reporte de cartas en formato JSON/CSV/XLSX/PDF.
 * Multi-tenant: siempre filtra por companyId del token.
 */
export declare function generateCardReport(req: Request, res: Response): Promise<void>;
/**
 * GET /api/admin/reports/audit
 * Reporte de auditoría.
 */
export declare function generateAuditReport(req: Request, res: Response): Promise<void>;
//# sourceMappingURL=reports.controller.d.ts.map