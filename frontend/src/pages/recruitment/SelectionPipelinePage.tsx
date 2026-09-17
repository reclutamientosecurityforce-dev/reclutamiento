import React, { useEffect, useState } from 'react';
import { api } from '../../api/client';
import {
  Phone,
  X,
  Sparkles,
} from 'lucide-react';

interface ApplicationItem {
  id: string;
  candidate_id: string;
  job_opening_id: string;
  current_stage:
    | 'registered'
    | 'phone_screening'
    | 'psychological_eval'
    | 'background_check'
    | 'interview'
    | 'medical_exam'
    | 'approved'
    | 'rejected'
    | 'hired';
  stage_score?: number;
  candidate_name: string;
  candidate_dni: string;
  candidate_phone: string;
  candidate_sucamec?: string;
  job_title: string;
  recruiter_name?: string;
  updated_at: string;
}

const STAGES = [
  { id: 'registered', label: '1. Registro Inicial', color: '#94a3b8' },
  { id: 'phone_screening', label: '2. Filtro Telefónico', color: '#818cf8' },
  { id: 'psychological_eval', label: '3. Psicotécnico', color: '#38bdf8' },
  { id: 'background_check', label: '4. Antecedentes', color: '#fbbf24' },
  { id: 'interview', label: '5. Entrevista', color: '#f59e0b' },
  { id: 'medical_exam', label: '6. Examen Médico', color: '#f43f5e' },
  { id: 'approved', label: '7. Aprobados Aptos', color: '#34d399' },
  { id: 'hired', label: '8. Contratados', color: '#c084fc' },
];

export const SelectionPipelinePage: React.FC = () => {
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<ApplicationItem | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Modal Advance State
  const [targetStage, setTargetStage] = useState<string>('psychological_eval');
  const [stageScore, setStageScore] = useState<number | ''>(85);
  const [observations, setObservations] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  const fetchPipeline = async () => {
    try {
      setLoading(true);
      const res = await api.get<ApplicationItem[]>('/recruitment/pipeline');
      setApplications(res || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPipeline();
  }, []);

  const handleOpenAdvanceModal = (app: ApplicationItem) => {
    setSelectedApp(app);
    // Sugerir la siguiente etapa natural
    const currentIndex = STAGES.findIndex((s) => s.id === app.current_stage);
    if (currentIndex >= 0 && currentIndex < STAGES.length - 1) {
      setTargetStage(STAGES[currentIndex + 1].id);
    } else {
      setTargetStage('approved');
    }
    setStageScore(85);
    setObservations('');
    setRejectionReason('');
  };

  const handleAdvanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp) return;
    setActionLoading(true);

    try {
      await api.post(`/recruitment/pipeline/${selectedApp.id}/advance`, {
        targetStage,
        stageScore: stageScore ? Number(stageScore) : undefined,
        result: targetStage === 'rejected' ? 'failed' : 'passed',
        observations: observations || undefined,
        rejectionReason: targetStage === 'rejected' ? rejectionReason : undefined,
      });

      setSelectedApp(null);
      fetchPipeline();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error al avanzar etapa');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 800, color: '#f8fafc' }}>
          Tablero de Selección (Pipeline)
        </h1>
        <p style={{ fontSize: '0.9rem', color: '#94a3b8', marginTop: '0.25rem' }}>
          Seguimiento visual de postulantes por cada fase de evaluación de seguridad
        </p>
      </div>

      {loading ? (
        <div style={{ padding: '4rem', textAlign: 'center', color: '#94a3b8' }}>
          Cargando tablero pipeline...
        </div>
      ) : (
        <div
          style={{
            display: 'flex',
            gap: '1rem',
            overflowX: 'auto',
            paddingBottom: '1.5rem',
            alignItems: 'flex-start',
            minHeight: '650px',
          }}
        >
          {STAGES.map((stage) => {
            const stageApps = applications.filter((a) => a.current_stage === stage.id);

            return (
              <div
                key={stage.id}
                style={{
                  minWidth: '260px',
                  maxWidth: '280px',
                  background: 'var(--bg-surface-glass)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                }}
              >
                {/* Stage Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid ' + stage.color, paddingBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#f8fafc' }}>{stage.label}</span>
                  <span
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      color: stage.color,
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      padding: '0.15rem 0.5rem',
                      borderRadius: '9999px',
                    }}
                  >
                    {stageApps.length}
                  </span>
                </div>

                {/* Candidate Cards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', minHeight: '100px' }}>
                  {stageApps.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '1.5rem 0', color: '#64748b', fontSize: '0.75rem' }}>
                      Sin postulantes
                    </div>
                  ) : (
                    stageApps.map((app, appIdx) => (
                      <div
                        key={app.id || `app-${appIdx}`}
                        style={{
                          background: 'var(--bg-surface-elevated)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-md)',
                          padding: '0.85rem',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.4rem',
                          boxShadow: 'var(--shadow-sm)',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <span style={{ fontWeight: 700, color: '#f8fafc', fontSize: '0.875rem' }}>
                            {app.candidate_name}
                          </span>
                          {app.stage_score && (
                            <span style={{ fontSize: '0.7rem', color: '#34d399', fontWeight: 800, background: 'rgba(16,185,129,0.15)', padding: '0.1rem 0.35rem', borderRadius: '3px' }}>
                              {app.stage_score} pts
                            </span>
                          )}
                        </div>

                        <div style={{ fontSize: '0.75rem', color: '#818cf8' }}>
                          DNI: {app.candidate_dni}
                        </div>

                        <div style={{ fontSize: '0.72rem', color: '#cbd5e1', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          🏢 {app.job_title}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.72rem', color: '#94a3b8' }}>
                          <Phone size={12} />
                          <span>{app.candidate_phone}</span>
                        </div>

                        {/* Action Button */}
                        <button
                          onClick={() => handleOpenAdvanceModal(app)}
                          className="btn-primary"
                          style={{
                            marginTop: '0.35rem',
                            padding: '0.35rem',
                            fontSize: '0.72rem',
                            width: '100%',
                            gap: '0.25rem',
                          }}
                        >
                          <Sparkles size={12} />
                          <span>Evaluar / Mover</span>
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── MODAL EVALUAR / AVANZAR ETAPA ──────────────────────────────────── */}
      {selectedApp && (
        <div className="modal-overlay" onClick={() => setSelectedApp(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ padding: '2rem', maxWidth: '540px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', color: '#f8fafc' }}>Evaluación y Cambio de Etapa</h3>
                <p style={{ fontSize: '0.85rem', color: '#818cf8', fontWeight: 600 }}>
                  {selectedApp.candidate_name} (DNI {selectedApp.candidate_dni})
                </p>
              </div>
              <button onClick={() => setSelectedApp(null)} style={{ background: 'transparent', color: '#94a3b8' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAdvanceSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.35rem' }}>
                  Siguiente Etapa / Decisión
                </label>
                <select value={targetStage} onChange={(e) => setTargetStage(e.target.value)} style={{ width: '100%' }}>
                  <option value="phone_screening">2. Filtro Telefónico</option>
                  <option value="psychological_eval">3. Evaluación Psicológica</option>
                  <option value="background_check">4. Verificación de Antecedentes</option>
                  <option value="interview">5. Entrevista Personal</option>
                  <option value="medical_exam">6. Examen Médico Ocupacional</option>
                  <option value="approved">🟢 7. APROBADO APTO (Listo para contratación)</option>
                  <option value="hired">🟣 8. CONTRATADO (Ingreso a planilla)</option>
                  <option value="rejected">🔴 DESCARTADO / NO APTO</option>
                </select>
              </div>

              {targetStage !== 'rejected' ? (
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.35rem' }}>
                    Calificación de la Etapa (0 a 100)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={stageScore}
                    onChange={(e) => setStageScore(e.target.value ? Number(e.target.value) : '')}
                    style={{ width: '100%' }}
                  />
                </div>
              ) : (
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#f87171', marginBottom: '0.35rem' }}>
                    Motivo de Descarte / No Apto <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Ej: Antecedente policial observado / No cumple estatura / Desaprobó test"
                    required
                    style={{ width: '100%' }}
                  />
                </div>
              )}

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.35rem' }}>
                  Observaciones de la Evaluación
                </label>
                <textarea
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  placeholder="Detalles sobre el desempeño en la prueba o entrevista..."
                  rows={3}
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setSelectedApp(null)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={actionLoading}>
                  {actionLoading ? 'Guardando...' : 'Confirmar Decisión'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
