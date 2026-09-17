import React, { useState } from 'react';
import { api } from '../../api/client';
import { FileSpreadsheet, Download, FileText, Filter, CheckCircle2 } from 'lucide-react';

export const AdminReportsPage: React.FC = () => {
  const [status, setStatus] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [downloadingFormat, setDownloadingFormat] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleDownload = async (format: 'csv' | 'xlsx' | 'pdf') => {
    setDownloadingFormat(format);
    setSuccessMsg(null);

    try {
      let url = `/admin/reports/cards?format=${format}`;
      if (status) url += `&status=${status}`;
      if (dateFrom) url += `&dateFrom=${dateFrom}`;
      if (dateTo) url += `&dateTo=${dateTo}`;

      const blob = await api.get<Blob>(url);
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `reporte-cartas-${Date.now()}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);

      setSuccessMsg(`Reporte en formato ${format.toUpperCase()} generado y descargado exitosamente.`);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error al descargar reporte');
    } finally {
      setDownloadingFormat(null);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 800, color: '#f8fafc' }}>
          Reportes y Exportación
        </h1>
        <p style={{ fontSize: '0.9rem', color: '#94a3b8', marginTop: '0.25rem' }}>
          Generación oficial de reportes en formatos ejecutivos con datos en tiempo real
        </p>
      </div>

      {successMsg && (
        <div
          style={{
            padding: '1rem 1.25rem',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: '#34d399',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Filter Section */}
      <div className="glass-panel" style={{ padding: '1.75rem', marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.1rem', color: '#f8fafc', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Filter size={18} color="#818cf8" />
          <span>Filtros para el Reporte</span>
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.4rem' }}>
              Estado de las Cartas
            </label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ width: '100%' }}>
              <option value="">Todos los Estados</option>
              <option value="available">🟢 Disponibles</option>
              <option value="used">🔴 Utilizadas</option>
              <option value="reserved">🟡 Reservadas</option>
              <option value="cancelled">⚫ Anuladas</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.4rem' }}>
              Fecha Desde
            </label>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} style={{ width: '100%' }} />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.4rem' }}>
              Fecha Hasta
            </label>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} style={{ width: '100%' }} />
          </div>
        </div>
      </div>

      {/* Export Options Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
        {/* PDF Card */}
        <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem', borderTop: '4px solid #ef4444' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f87171' }}>
              <FileText size={24} />
            </div>
            <div>
              <h4 style={{ fontSize: '1.15rem', color: '#f8fafc' }}>Documento PDF</h4>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Formato ejecutivo listo para imprimir</span>
            </div>
          </div>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
            Genera un informe formal en PDF con membrete corporativo de Security Force S.A.C., tabla de trazabilidad y resumen.
          </p>
          <button
            className="btn-primary"
            onClick={() => handleDownload('pdf')}
            disabled={downloadingFormat !== null}
            style={{ marginTop: 'auto', background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' }}
          >
            <Download size={16} />
            <span>{downloadingFormat === 'pdf' ? 'Generando PDF...' : 'Exportar a PDF'}</span>
          </button>
        </div>

        {/* Excel XLSX Card */}
        <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem', borderTop: '4px solid #10b981' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#34d399' }}>
              <FileSpreadsheet size={24} />
            </div>
            <div>
              <h4 style={{ fontSize: '1.15rem', color: '#f8fafc' }}>Libro de Excel (.xlsx)</h4>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Hoja de cálculo estructurada</span>
            </div>
          </div>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
            Exporta todas las columnas operativas con anchos de celda ajustados para análisis contable y de auditoría interna.
          </p>
          <button
            className="btn-primary"
            onClick={() => handleDownload('xlsx')}
            disabled={downloadingFormat !== null}
            style={{ marginTop: 'auto', background: 'linear-gradient(135deg, #059669 0%, #047857 100%)' }}
          >
            <Download size={16} />
            <span>{downloadingFormat === 'xlsx' ? 'Generando Excel...' : 'Exportar a Excel'}</span>
          </button>
        </div>

        {/* CSV Card */}
        <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem', borderTop: '4px solid #38bdf8' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'rgba(56, 189, 248, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8' }}>
              <FileText size={24} />
            </div>
            <div>
              <h4 style={{ fontSize: '1.15rem', color: '#f8fafc' }}>Archivo CSV</h4>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Valores separados por coma (UTF-8 con BOM)</span>
            </div>
          </div>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
            Formato plano compatible para integración con ERPs y bases de datos externas de la corporación.
          </p>
          <button
            className="btn-primary"
            onClick={() => handleDownload('csv')}
            disabled={downloadingFormat !== null}
            style={{ marginTop: 'auto', background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' }}
          >
            <Download size={16} />
            <span>{downloadingFormat === 'csv' ? 'Generando CSV...' : 'Exportar a CSV'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
