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
exports.generateCardReport = generateCardReport;
exports.generateAuditReport = generateAuditReport;
const zod_1 = require("zod");
const db_1 = __importDefault(require("../../../../db"));
const reportSchema = zod_1.z.object({
    format: zod_1.z.enum(['json', 'csv', 'xlsx', 'pdf']).default('json'),
    status: zod_1.z.enum(['available', 'reserved', 'used', 'cancelled']).optional(),
    dateFrom: zod_1.z.string().optional(),
    dateTo: zod_1.z.string().optional(),
    userId: zod_1.z.string().uuid().optional(),
});
/**
 * GET /api/admin/reports/cards
 * Reporte de cartas en formato JSON/CSV/XLSX/PDF.
 * Multi-tenant: siempre filtra por companyId del token.
 */
async function generateCardReport(req, res) {
    try {
        const companyId = req.user.companyId;
        const parsed = reportSchema.safeParse(req.query);
        if (!parsed.success) {
            res.status(400).json({ error: 'Parámetros inválidos.', details: parsed.error.issues });
            return;
        }
        const { format, status, dateFrom, dateTo, userId } = parsed.data;
        const conditions = ['c.company_id = $1'];
        const params = [companyId];
        let idx = 2;
        if (status) {
            conditions.push(`c.status = $${idx++}`);
            params.push(status);
        }
        if (dateFrom) {
            conditions.push(`c.updated_at >= $${idx++}`);
            params.push(dateFrom);
        }
        if (dateTo) {
            conditions.push(`c.updated_at <= $${idx++}`);
            params.push(dateTo);
        }
        if (userId) {
            conditions.push(`c.used_by = $${idx++}`);
            params.push(userId);
        }
        const where = conditions.join(' AND ');
        const { rows } = await db_1.default.query(`SELECT
         c.number, c.status,
         u1.full_name AS used_by_name, c.used_at,
         u2.full_name AS reserved_by_name, c.reserved_at,
         u3.full_name AS cancelled_by_name, c.cancelled_at,
         c.observations, c.updated_at
       FROM cards c
       LEFT JOIN users u1 ON c.used_by = u1.id
       LEFT JOIN users u2 ON c.reserved_by = u2.id
       LEFT JOIN users u3 ON c.cancelled_by = u3.id
       WHERE ${where}
       ORDER BY c.number ASC`, params);
        // Auditoría
        await db_1.default.query(`INSERT INTO audit_logs (company_id, user_id, action, resource, details, ip_address, success)
       VALUES ($1, $2, 'report_generated', 'reports', $3, $4::inet, TRUE)`, [companyId, req.user.id,
            JSON.stringify({ format, status, dateFrom, dateTo, count: rows.length }),
            req.ip]);
        if (format === 'json') {
            res.json({ data: rows, total: rows.length });
            return;
        }
        if (format === 'csv') {
            const headers = ['Número', 'Estado', 'Utilizado por', 'Fecha uso', 'Reservado por', 'Fecha reserva', 'Anulado por', 'Fecha anulación', 'Observaciones'];
            const csvRows = rows.map(r => [
                r.number, r.status,
                r.used_by_name || '', r.used_at ? new Date(r.used_at).toLocaleString('es-PE') : '',
                r.reserved_by_name || '', r.reserved_at ? new Date(r.reserved_at).toLocaleString('es-PE') : '',
                r.cancelled_by_name || '', r.cancelled_at ? new Date(r.cancelled_at).toLocaleString('es-PE') : '',
                r.observations || ''
            ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));
            const csv = [headers.join(','), ...csvRows].join('\n');
            res.setHeader('Content-Type', 'text/csv; charset=utf-8');
            res.setHeader('Content-Disposition', `attachment; filename="reporte-cartas-${Date.now()}.csv"`);
            res.send('\uFEFF' + csv); // BOM para Excel
            return;
        }
        if (format === 'xlsx') {
            try {
                const XLSX = await Promise.resolve().then(() => __importStar(require('xlsx')));
                const wsData = [
                    ['Número', 'Estado', 'Utilizado por', 'Fecha uso', 'Observaciones'],
                    ...rows.map(r => [
                        r.number, r.status,
                        r.used_by_name || '',
                        r.used_at ? new Date(r.used_at).toLocaleString('es-PE') : '',
                        r.observations || ''
                    ])
                ];
                const wb = XLSX.utils.book_new();
                const ws = XLSX.utils.aoa_to_sheet(wsData);
                ws['!cols'] = [{ wch: 10 }, { wch: 12 }, { wch: 30 }, { wch: 20 }, { wch: 40 }];
                XLSX.utils.book_append_sheet(wb, ws, 'Cartas');
                const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
                res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                res.setHeader('Content-Disposition', `attachment; filename="reporte-cartas-${Date.now()}.xlsx"`);
                res.send(buffer);
            }
            catch {
                res.status(500).json({ error: 'Error al generar XLSX.' });
            }
            return;
        }
        if (format === 'pdf') {
            try {
                const PDFDocument = (await Promise.resolve().then(() => __importStar(require('pdfkit')))).default;
                const doc = new PDFDocument({ margin: 40, size: 'A4' });
                const chunks = [];
                doc.on('data', (chunk) => chunks.push(chunk));
                doc.on('end', () => {
                    const pdfBuffer = Buffer.concat(chunks);
                    res.setHeader('Content-Type', 'application/pdf');
                    res.setHeader('Content-Disposition', `attachment; filename="reporte-cartas-${Date.now()}.pdf"`);
                    res.send(pdfBuffer);
                });
                // Encabezado
                doc.fontSize(18).font('Helvetica-Bold')
                    .text('Security Force S.A.C.', { align: 'center' });
                doc.fontSize(14).font('Helvetica')
                    .text('Reporte de Cartas de Numeración', { align: 'center' });
                doc.fontSize(10).text(`Generado: ${new Date().toLocaleString('es-PE')}`, { align: 'center' });
                doc.moveDown(1);
                // Tabla
                const colWidths = [60, 80, 160, 120, 80];
                const headers = ['N.º', 'Estado', 'Utilizado por', 'Fecha uso', 'Observación'];
                let y = doc.y;
                // Encabezados
                doc.font('Helvetica-Bold').fontSize(9);
                let x = 40;
                headers.forEach((h, i) => {
                    doc.text(h, x, y, { width: colWidths[i] });
                    x += colWidths[i];
                });
                y += 18;
                doc.moveTo(40, y).lineTo(540, y).stroke();
                y += 4;
                // Filas
                doc.font('Helvetica').fontSize(8);
                for (const row of rows) {
                    if (y > 750) {
                        doc.addPage();
                        y = 40;
                    }
                    x = 40;
                    const cols = [
                        String(row.number),
                        row.status,
                        row.used_by_name || '-',
                        row.used_at ? new Date(row.used_at).toLocaleDateString('es-PE') : '-',
                        row.observations || '-',
                    ];
                    cols.forEach((c, i) => {
                        doc.text(c, x, y, { width: colWidths[i] });
                        x += colWidths[i];
                    });
                    y += 14;
                }
                doc.end();
            }
            catch (pdfErr) {
                console.error('Error generando PDF:', pdfErr);
                res.status(500).json({ error: 'Error al generar PDF.' });
            }
            return;
        }
        res.status(400).json({ error: 'Formato no soportado.' });
    }
    catch (err) {
        console.error('Error en generateCardReport:', err);
        res.status(500).json({ error: 'Error al generar reporte.' });
    }
}
/**
 * GET /api/admin/reports/audit
 * Reporte de auditoría.
 */
async function generateAuditReport(req, res) {
    try {
        const companyId = req.user.companyId;
        const format = req.query.format || 'json';
        const dateFrom = req.query.dateFrom;
        const dateTo = req.query.dateTo;
        const conditions = ['al.company_id = $1'];
        const params = [companyId];
        let idx = 2;
        if (dateFrom) {
            conditions.push(`al.created_at >= $${idx++}`);
            params.push(dateFrom);
        }
        if (dateTo) {
            conditions.push(`al.created_at <= $${idx++}`);
            params.push(dateTo);
        }
        const { rows } = await db_1.default.query(`SELECT al.action, al.resource, al.resource_id, al.success, al.created_at,
              u.username, u.full_name
       FROM audit_logs al
       LEFT JOIN users u ON al.user_id = u.id
       WHERE ${conditions.join(' AND ')}
       ORDER BY al.created_at DESC
       LIMIT 5000`, params);
        if (format === 'csv') {
            const headers = ['Fecha', 'Usuario', 'Acción', 'Recurso', 'ID Recurso', 'Exitoso'];
            const csvRows = rows.map(r => [
                new Date(r.created_at).toLocaleString('es-PE'),
                r.username || '', r.action, r.resource || '', r.resource_id || '',
                r.success ? 'Sí' : 'No'
            ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));
            const csv = [headers.join(','), ...csvRows].join('\n');
            res.setHeader('Content-Type', 'text/csv; charset=utf-8');
            res.setHeader('Content-Disposition', `attachment; filename="reporte-auditoria-${Date.now()}.csv"`);
            res.send('\uFEFF' + csv);
            return;
        }
        res.json({ data: rows, total: rows.length });
    }
    catch (err) {
        console.error('Error en generateAuditReport:', err);
        res.status(500).json({ error: 'Error al generar reporte de auditoría.' });
    }
}
//# sourceMappingURL=reports.controller.js.map