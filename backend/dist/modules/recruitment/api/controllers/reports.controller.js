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
exports.generateRecruitmentReport = generateRecruitmentReport;
const zod_1 = require("zod");
const db_1 = __importDefault(require("../../../../db"));
const reportSchema = zod_1.z.object({
    format: zod_1.z.enum(['json', 'csv', 'xlsx', 'pdf']).default('json'),
    openingId: zod_1.z.string().uuid().optional(),
    stage: zod_1.z.string().optional(),
    dateFrom: zod_1.z.string().optional(),
    dateTo: zod_1.z.string().optional(),
});
/**
 * GET /api/recruitment/reports/candidates
 */
async function generateRecruitmentReport(req, res) {
    try {
        const companyId = req.user.companyId;
        const parsed = reportSchema.safeParse(req.query);
        if (!parsed.success) {
            res.status(400).json({ error: 'Parámetros inválidos.', details: parsed.error.issues });
            return;
        }
        const { format, openingId, stage, dateFrom, dateTo } = parsed.data;
        const conditions = ['c.company_id = $1'];
        const params = [companyId];
        let idx = 2;
        if (openingId) {
            conditions.push(`a.job_opening_id = $${idx++}`);
            params.push(openingId);
        }
        if (stage) {
            conditions.push(`a.current_stage = $${idx++}`);
            params.push(stage);
        }
        if (dateFrom) {
            conditions.push(`a.created_at >= $${idx++}`);
            params.push(dateFrom);
        }
        if (dateTo) {
            conditions.push(`a.created_at <= $${idx++}`);
            params.push(dateTo);
        }
        const { rows } = await db_1.default.query(`SELECT 
         c.document_number,
         c.first_name || ' ' || c.last_name AS candidate_name,
         c.phone,
         c.district,
         c.sucamec_status,
         c.gun_license,
         jo.title AS job_title,
         a.current_stage,
         a.stage_score,
         a.created_at
       FROM candidates c
       JOIN applications a ON c.id = a.candidate_id
       LEFT JOIN job_openings jo ON a.job_opening_id = jo.id
       WHERE ${conditions.join(' AND ')}
       ORDER BY a.created_at DESC`, params);
        // Auditoría
        await db_1.default.query(`INSERT INTO audit_logs (company_id, user_id, action, resource, details, ip_address, success)
       VALUES ($1, $2, 'report_generated', 'recruitment_reports', $3, $4::inet, TRUE)`, [companyId, req.user.id, JSON.stringify({ format, count: rows.length }), req.ip]);
        if (format === 'json') {
            res.json({ data: rows, total: rows.length });
            return;
        }
        if (format === 'csv') {
            const headers = ['DNI / Documento', 'Postulante', 'Teléfono', 'Distrito', 'SUCAMEC', 'Porte Armas', 'Puesto Solicitado', 'Etapa Actual', 'Calificación', 'Fecha Postulación'];
            const csvRows = rows.map((r) => [
                r.document_number,
                r.candidate_name,
                r.phone,
                r.district || '',
                r.sucamec_status,
                r.gun_license ? 'Sí' : 'No',
                r.job_title || '',
                r.current_stage,
                r.stage_score !== null ? r.stage_score : '',
                new Date(r.created_at).toLocaleDateString('es-PE'),
            ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','));
            const csv = [headers.join(','), ...csvRows].join('\n');
            res.setHeader('Content-Type', 'text/csv; charset=utf-8');
            res.setHeader('Content-Disposition', `attachment; filename="reporte-reclutamiento-${Date.now()}.csv"`);
            res.send('\uFEFF' + csv);
            return;
        }
        if (format === 'xlsx') {
            const XLSX = await Promise.resolve().then(() => __importStar(require('xlsx')));
            const wsData = [
                ['DNI / Documento', 'Postulante', 'Teléfono', 'Distrito', 'SUCAMEC', 'Porte Armas', 'Puesto Solicitado', 'Etapa Actual', 'Calificación', 'Fecha'],
                ...rows.map((r) => [
                    r.document_number,
                    r.candidate_name,
                    r.phone,
                    r.district || '',
                    r.sucamec_status,
                    r.gun_license ? 'Sí' : 'No',
                    r.job_title || '',
                    r.current_stage,
                    r.stage_score !== null ? r.stage_score : '-',
                    new Date(r.created_at).toLocaleDateString('es-PE'),
                ]),
            ];
            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.aoa_to_sheet(wsData);
            XLSX.utils.book_append_sheet(wb, ws, 'Postulantes');
            const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename="reporte-reclutamiento-${Date.now()}.xlsx"`);
            res.send(buffer);
            return;
        }
        if (format === 'pdf') {
            const PDFDocument = (await Promise.resolve().then(() => __importStar(require('pdfkit')))).default;
            const doc = new PDFDocument({ margin: 35, size: 'A4' });
            const chunks = [];
            doc.on('data', (chunk) => chunks.push(chunk));
            doc.on('end', () => {
                const pdfBuffer = Buffer.concat(chunks);
                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', `attachment; filename="reporte-reclutamiento-${Date.now()}.pdf"`);
                res.send(pdfBuffer);
            });
            doc.fontSize(16).font('Helvetica-Bold').text('Security Force S.A.C.', { align: 'center' });
            doc.fontSize(12).font('Helvetica').text('Reporte de Selección y Reclutamiento de Personal', { align: 'center' });
            doc.fontSize(8).text(`Generado: ${new Date().toLocaleString('es-PE')} | Total registros: ${rows.length}`, { align: 'center' });
            doc.moveDown(1);
            const colWidths = [60, 140, 70, 70, 60, 80, 50];
            const headers = ['DNI', 'Postulante', 'Teléfono', 'SUCAMEC', 'Armas', 'Etapa', 'Puntaje'];
            let y = doc.y;
            doc.font('Helvetica-Bold').fontSize(8);
            let x = 35;
            headers.forEach((h, i) => {
                doc.text(h, x, y, { width: colWidths[i] });
                x += colWidths[i];
            });
            y += 14;
            doc.moveTo(35, y).lineTo(560, y).stroke();
            y += 4;
            doc.font('Helvetica').fontSize(7.5);
            for (const row of rows) {
                if (y > 770) {
                    doc.addPage();
                    y = 35;
                }
                x = 35;
                const cols = [
                    row.document_number,
                    row.candidate_name,
                    row.phone,
                    row.sucamec_status,
                    row.gun_license ? 'Sí' : 'No',
                    row.current_stage,
                    row.stage_score !== null ? String(row.stage_score) : '-',
                ];
                cols.forEach((c, i) => {
                    doc.text(c, x, y, { width: colWidths[i] });
                    x += colWidths[i];
                });
                y += 12;
            }
            doc.end();
            return;
        }
        res.status(400).json({ error: 'Formato no soportado.' });
    }
    catch (err) {
        console.error('Error en generateRecruitmentReport:', err);
        res.status(500).json({ error: 'Error al generar reporte de reclutamiento.' });
    }
}
//# sourceMappingURL=reports.controller.js.map