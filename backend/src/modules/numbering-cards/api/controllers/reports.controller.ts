import { Request, Response } from 'express';
import { z } from 'zod';
import db from '../../../../db';

const reportSchema = z.object({
  format: z.enum(['json', 'csv', 'xlsx', 'pdf']).default('json'),
  status: z.enum(['available', 'reserved', 'used', 'cancelled']).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  userId: z.string().uuid().optional(),
});

/**
 * GET /api/admin/reports/cards
 * Reporte de cartas en formato JSON/CSV/XLSX/PDF.
 * Multi-tenant: siempre filtra por companyId del token.
 */
export async function generateCardReport(req: Request, res: Response): Promise<void> {
  try {
    const companyId = req.user!.companyId;
    const parsed = reportSchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ error: 'Parámetros inválidos.', details: parsed.error.issues });
      return;
    }

    const { format, status, dateFrom, dateTo, userId } = parsed.data;

    const conditions: string[] = ['c.company_id = $1'];
    const params: unknown[] = [companyId];
    let idx = 2;

    if (status) { conditions.push(`c.status = $${idx++}`); params.push(status); }
    if (dateFrom) { conditions.push(`c.updated_at >= $${idx++}`); params.push(dateFrom); }
    if (dateTo) { conditions.push(`c.updated_at <= $${idx++}`); params.push(dateTo); }
    if (userId) { conditions.push(`c.used_by = $${idx++}`); params.push(userId); }

    const where = conditions.join(' AND ');

    interface CardReportRow {
      number: number;
      status: string;
      used_by_name: string | null;
      used_at: string | null;
      reserved_by_name: string | null;
      reserved_at: string | null;
      cancelled_by_name: string | null;
      cancelled_at: string | null;
      observations: string | null;
      updated_at: string;
    }

    const { rows } = await db.query<CardReportRow>(
      `SELECT
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
       ORDER BY c.number ASC`,
      params
    );

    // Auditoría
    await db.query(
      `INSERT INTO audit_logs (company_id, user_id, action, resource, details, ip_address, success)
       VALUES ($1, $2, 'report_generated', 'reports', $3, $4::inet, TRUE)`,
      [companyId, req.user!.id,
        JSON.stringify({ format, status, dateFrom, dateTo, count: rows.length }),
        req.ip]
    );

    if (format === 'json') {
      res.json({ data: rows, total: rows.length });
      return;
    }

    if (format === 'csv') {
      const headers = ['Número', 'Estado', 'Utilizado por', 'Fecha uso', 'Reservado por', 'Fecha reserva', 'Anulado por', 'Fecha anulación', 'Observaciones'];
      const csvRows = rows.map(r =>
        [
          r.number, r.status,
          r.used_by_name || '', r.used_at ? new Date(r.used_at).toLocaleString('es-PE') : '',
          r.reserved_by_name || '', r.reserved_at ? new Date(r.reserved_at).toLocaleString('es-PE') : '',
          r.cancelled_by_name || '', r.cancelled_at ? new Date(r.cancelled_at).toLocaleString('es-PE') : '',
          r.observations || ''
        ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')
      );
      const csv = [headers.join(','), ...csvRows].join('\n');
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="reporte-cartas-${Date.now()}.csv"`);
      res.send('\uFEFF' + csv); // BOM para Excel
      return;
    }

    if (format === 'xlsx') {
      try {
        const XLSX = await import('xlsx');
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
      } catch {
        res.status(500).json({ error: 'Error al generar XLSX.' });
      }
      return;
    }

    if (format === 'pdf') {
      try {
        const PDFDocument = (await import('pdfkit')).default;
        const doc = new PDFDocument({ margin: 40, size: 'A4' });
        const chunks: Buffer[] = [];
        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
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
          if (y > 750) { doc.addPage(); y = 40; }
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
      } catch (pdfErr) {
        console.error('Error generando PDF:', pdfErr);
        res.status(500).json({ error: 'Error al generar PDF.' });
      }
      return;
    }

    res.status(400).json({ error: 'Formato no soportado.' });
  } catch (err) {
    console.error('Error en generateCardReport:', err);
    res.status(500).json({ error: 'Error al generar reporte.' });
  }
}

/**
 * GET /api/admin/reports/audit
 * Reporte de auditoría.
 */
export async function generateAuditReport(req: Request, res: Response): Promise<void> {
  try {
    const companyId = req.user!.companyId;
    const format = (req.query.format as string) || 'json';
    const dateFrom = req.query.dateFrom as string | undefined;
    const dateTo = req.query.dateTo as string | undefined;

    const conditions: string[] = ['al.company_id = $1'];
    const params: unknown[] = [companyId];
    let idx = 2;

    if (dateFrom) { conditions.push(`al.created_at >= $${idx++}`); params.push(dateFrom); }
    if (dateTo) { conditions.push(`al.created_at <= $${idx++}`); params.push(dateTo); }

    interface AuditReportRow {
      action: string;
      resource: string | null;
      resource_id: string | null;
      success: boolean;
      created_at: string;
      username: string | null;
      full_name: string | null;
    }

    const { rows } = await db.query<AuditReportRow>(
      `SELECT al.action, al.resource, al.resource_id, al.success, al.created_at,
              u.username, u.full_name
       FROM audit_logs al
       LEFT JOIN users u ON al.user_id = u.id
       WHERE ${conditions.join(' AND ')}
       ORDER BY al.created_at DESC
       LIMIT 5000`,
      params
    );

    if (format === 'csv') {
      const headers = ['Fecha', 'Usuario', 'Acción', 'Recurso', 'ID Recurso', 'Exitoso'];
      const csvRows = rows.map(r =>
        [
          new Date(r.created_at).toLocaleString('es-PE'),
          r.username || '', r.action, r.resource || '', r.resource_id || '',
          r.success ? 'Sí' : 'No'
        ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')
      );
      const csv = [headers.join(','), ...csvRows].join('\n');
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="reporte-auditoria-${Date.now()}.csv"`);
      res.send('\uFEFF' + csv);
      return;
    }

    res.json({ data: rows, total: rows.length });
  } catch (err) {
    console.error('Error en generateAuditReport:', err);
    res.status(500).json({ error: 'Error al generar reporte de auditoría.' });
  }
}
