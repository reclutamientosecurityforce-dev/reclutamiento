import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import {
  FileSpreadsheet,
  Download,
  FileText,
  Filter,
  CheckCircle2,
} from 'lucide-react';

interface OpeningItem {
  id: string;
  title: string;
}

export const RecruitmentReportsPage: React.FC = () => {
  const [openings, setOpenings] = useState<OpeningItem[]>([]);
  const [openingId, setOpeningId] = useState('');
  const [stage, setStage] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [downloadingFormat, setDownloadingFormat] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    api.get<OpeningItem[]>('/recruitment/openings').then(setOpenings).catch(() => {});
  }, []);

  const handleDownload = async (format: 'csv' | 'xlsx' | 'pdf') => {
    setDownloadingFormat(format);
    setSuccessMsg(null);

    try {
      let url = `/recruitment/reports/candidates?format=${format}`;
      if (openingId) url += `&openingId=${openingId}`;
      if (stage) url += `&stage=${stage}`;
      if (dateFrom) url += `&dateFrom=${dateFrom}`;
      if (dateTo) url += `&dateTo=${dateTo}`;

      const blob = await api.get<Blob>(url);
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `reporte-postulantes-seguridad-${Date.now()}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);

      setSuccessMsg(`Reporte de Reclutamiento en formato ${format.toUpperCase()} descargado exitosamente.`);
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
          Reportes de Selección y Reclutamiento
        </h1>
        <p style={{ fontSize: '0.9rem', color: '#94a3b8', marginTop: '0.25rem' }}>
          Exportación de expedientes de postulantes, candidatos aptos y contratados
        </p>
      </div>

      {successMsg && (
        <div style={{ padding: '1rem 1.25rem', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#34d399', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Filter Section */}
      <div className="glass-panel" style={{ padding: '1.75rem', marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.1rem', color: '#f8fafc', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Filter size={18} color="#818cf8" />
          <span>Filtros de Exportación</span>
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.35rem' }}>
              Convocatoria / Puesto
            </label>
            <select value={openingId} onChange={(e) => setOpeningId(e.target.value)} style={{ width: '100%' }}>
              <option value="">Todas las convocatorias</option>
              {openings.map((op) => (
                <option key={op.id} value={op.id}>
                  {op.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.35rem' }}>
              Etapa de Selección
            </label>
            <select value={stage} onChange={(e) => setStage(e.target.value)} style={{ width: '100%' }}>
              <option value="">Todas las etapas</option>
              <option value="phone_screening">Filtro Telefónico</option>
              <option value="psychological_eval">Evaluación Psicológica</option>
              <option value="background_check">Verificación Antecedentes</option>
              <option value="interview">Entrevista Personal</option>
              <option value="medical_exam">Examen Médico</option>
              <option value="approved">🟢 Aprobados Aptos</option>
              <option value="hired">🟣 Contratados</option>
              <option value="rejected">🔴 Descartados</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.35rem' }}>
              Fecha Desde
            </label>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} style={{ width: '100%' }} />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.35rem' }}>
              Fecha Hasta
            </label>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} style={{ width: '100%' }} />
          </div>
        </div>
      </div>

      {/* Export Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
        {/* PDF */}
        <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem', borderTop: '4px solid #ef4444' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f87171' }}>
              <FileText size={24} />
            </div>
            <div>
              <h4 style={{ fontSize: '1.15rem', color: '#f8fafc' }}>Informe PDF Oficial</h4>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Formato ejecutivo membretado</span>
            </div>
          </div>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
            Genera un PDF con membrete corporativo de Security Force S.A.C., estado SUCAMEC, licencia de armas y calificación de cada postulante.
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

        {/* Excel XLSX */}
        <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem', borderTop: '4px solid #10b981' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#34d399' }}>
              <FileSpreadsheet size={24} />
            </div>
            <div>
              <h4 style={{ fontSize: '1.15rem', color: '#f8fafc' }}>Padrón Excel (.xlsx)</h4>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Hoja de cálculo para RRHH y Planilla</span>
            </div>
          </div>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
            Exporta todas las columnas operativas: DNI, teléfono, distrito, SUCAMEC, brevete y etapa para cruzar con contratos.
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

        {/* CSV */}
        <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem', borderTop: '4px solid #38bdf8' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'rgba(56, 189, 248, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8' }}>
              <FileText size={24} />
            </div>
            <div>
              <h4 style={{ fontSize: '1.15rem', color: '#f8fafc' }}>Formato Plano CSV</h4>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Integración con sistemas ERP</span>
            </div>
          </div>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
            Archivo separado por comas UTF-8 con BOM para importar en bases de datos o ERPs de seguridad.
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
