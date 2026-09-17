import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../../api/client';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  Eye,
  UserCheck,
  FileText,
  Zap,
  BarChart2,
  AlertCircle,
  Edit3,
  Save,
  Info,
} from 'lucide-react';

// ─── TYPES ─────────────────────────────────────────────────────────────────────

interface EvaluationItem {
  id: string;
  requirement_id: string;
  requirement_title: string;
  requirement_code: string;
  requirement_type: 'eliminatory' | 'scoreable' | 'documental' | 'eliminatory_scoreable' | 'informative';
  rule_type: string;
  result: 'pass' | 'review' | 'fail' | 'pending';
  score_earned: number;
  max_score: number;
  source_type: 'declared' | 'extracted' | 'accredited';
  declared_value?: any;
  extracted_value?: any;
  accredited_value?: any;
  evidence_file_name?: string;
  evidence_file_path?: string;
  confidence_score?: number;
  discrepancy_detected: boolean;
  discrepancy_details?: {
    field: string;
    differenceDescription: string;
    severity: 'low' | 'medium' | 'high';
  };
  evaluation_notes?: string;
  is_overridden: boolean;
  override_reason?: string;
  overridden_by?: string;
}

interface Discrepancy {
  field: string;
  declaredValue?: any;
  accreditedValue?: any;
  differenceDescription: string;
  severity: 'low' | 'medium' | 'high';
}

interface RubricItem {
  code: string;
  title: string;
  earned: number;
  max: number;
  result: 'pass' | 'review' | 'fail' | 'pending';
  notes?: string;
}

interface Breakdown {
  totalEarned: number;
  maxPossible: number;
  normalizedPercentage: number;
  rubric: RubricItem[];
  reasons: string[];
  summaryExplanation: string;
}

interface ApplicationDetail {
  id: string;
  application_code?: string;
  prefilter_status: string;
  prefilter_score: number;
  total_accredited_exp_months: number;
  total_declared_exp_months: number;
  discrepancies_count: number;
  evaluated_at?: string;
  candidate_first_name: string;
  candidate_last_name: string;
  candidate_document_number: string;
  candidate_sucamec_status: string;
  candidate_height_cm?: number;
  candidate_birth_date?: string;
  job_title: string;
  job_position_type: string;
  job_location: string;
}

interface EvaluationModalProps {
  applicationId: string;
  onClose: () => void;
}

// ─── HELPERS ────────────────────────────────────────────────────────────────────

const STATUS_META: Record<string, { icon: React.ReactNode; label: string; color: string; bg: string }> = {
  pass: { icon: <CheckCircle2 size={15} />, label: 'Cumple', color: '#16a34a', bg: 'rgba(22,163,74,0.12)' },
  review: { icon: <AlertTriangle size={15} />, label: 'Revisar', color: '#d97706', bg: 'rgba(217,119,6,0.12)' },
  fail: { icon: <XCircle size={15} />, label: 'No Cumple', color: '#dc2626', bg: 'rgba(220,38,38,0.12)' },
  pending: { icon: <Clock size={15} />, label: 'Pendiente', color: '#64748b', bg: 'rgba(100,116,139,0.12)' },
};

const PREFILTER_META: Record<string, { label: string; color: string; dot: string }> = {
  eligible: { label: '🟢 APTO', color: '#16a34a', dot: '#16a34a' },
  review: { label: '🟡 REVISAR', color: '#d97706', dot: '#d97706' },
  ineligible: { label: '🔴 NO APTO', color: '#dc2626', dot: '#dc2626' },
  pending: { label: '⚪ PENDIENTE', color: '#64748b', dot: '#64748b' },
};

const SEV_COLOR: Record<string, string> = { low: '#16a34a', medium: '#d97706', high: '#dc2626' };
const SOURCE_LABEL: Record<string, string> = { declared: 'Declarado', extracted: 'Extraído', accredited: 'Acreditado' };
const TYPE_LABEL: Record<string, string> = {
  eliminatory: 'Eliminatorio',
  scoreable: 'Puntuable',
  documental: 'Documental',
  eliminatory_scoreable: 'Eliminatorio + Puntuable',
  informative: 'Informativo',
};

function expMonthsLabel(months: number): string {
  const years = Math.floor(months / 12);
  const rem = months % 12;
  if (years === 0) return `${rem} mes${rem !== 1 ? 'es' : ''}`;
  if (rem === 0) return `${years} año${years !== 1 ? 's' : ''}`;
  return `${years} año${years !== 1 ? 's' : ''} y ${rem} mes${rem !== 1 ? 'es' : ''}`;
}

// ─── COMPONENT ──────────────────────────────────────────────────────────────────

export const EvaluationModal: React.FC<EvaluationModalProps> = ({ applicationId, onClose }) => {
  const [application, setApplication] = useState<ApplicationDetail | null>(null);
  const [evaluations, setEvaluations] = useState<EvaluationItem[]>([]);
  const [breakdown, setBreakdown] = useState<Breakdown | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Override state
  const [overrideTarget, setOverrideTarget] = useState<EvaluationItem | null>(null);
  const [overrideResult, setOverrideResult] = useState<'pass' | 'review' | 'fail'>('pass');
  const [overrideReason, setOverrideReason] = useState('');
  const [overrideSaving, setOverrideSaving] = useState(false);
  const [overrideError, setOverrideError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.get<{ application: ApplicationDetail; evaluations: EvaluationItem[]; breakdown: Breakdown | null }>(
        `/recruitment/applications/${applicationId}/evaluation`
      );
      setApplication(data.application);
      setEvaluations(data.evaluations || []);
      setBreakdown(data.breakdown || null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [applicationId]);

  useEffect(() => { load(); }, [load]);

  const toggleRow = (id: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const submitOverride = async () => {
    if (!overrideTarget || overrideReason.trim().length < 5) {
      setOverrideError('El motivo debe tener al menos 5 caracteres.');
      return;
    }
    try {
      setOverrideSaving(true);
      setOverrideError(null);
      await api.post(`/recruitment/applications/${applicationId}/override`, {
        evaluationId: overrideTarget.id,
        newResult: overrideResult,
        overrideReason: overrideReason.trim(),
      });
      setOverrideTarget(null);
      setOverrideReason('');
      await load();
    } catch (err: any) {
      setOverrideError(err.message || 'Error al guardar override.');
    } finally {
      setOverrideSaving(false);
    }
  };

  const status = application ? PREFILTER_META[application.prefilter_status] || PREFILTER_META.pending : PREFILTER_META.pending;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      padding: '2rem 1rem', overflowY: 'auto',
    }}>
      <div style={{
        background: '#111', border: '1px solid #222', borderRadius: '1rem',
        width: '100%', maxWidth: '900px', color: '#e2e8f0',
        boxShadow: '0 25px 80px rgba(0,0,0,0.8)',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '1.5rem 2rem', borderBottom: '1px solid #1e1e1e',
          background: 'linear-gradient(135deg, #0d0d0d, #1a0505)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: 40, height: 40, borderRadius: '50%',
              background: 'rgba(220,38,38,0.15)', border: '1px solid rgba(220,38,38,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <BarChart2 size={20} color="#dc2626" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: '#fff' }}>
                Resultado de Prefiltro — Motor de Evaluación
              </div>
              {application && (
                <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 2 }}>
                  {application.candidate_first_name} {application.candidate_last_name} · {application.job_title}
                </div>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 4 }}
          >
            <X size={22} />
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
            <div className="spinner" style={{ margin: '0 auto 1rem' }} />
            Cargando evaluación...
          </div>
        ) : !application ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#dc2626' }}>
            <AlertCircle size={40} style={{ margin: '0 auto 1rem' }} />
            No se encontró la evaluación. Ejecuta primero el motor de prefiltro.
          </div>
        ) : (
          <>
            {/* ─── RESUMEN EJECUTIVO ─────────────────────────────────────────── */}
            <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid #1e1e1e' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
                {/* Estado */}
                <div style={{ background: '#0d0d0d', border: '1px solid #1e1e1e', borderRadius: '0.75rem', padding: '1rem' }}>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Estado</div>
                  <div style={{ fontWeight: 800, fontSize: '1rem', color: status.color }}>{status.label}</div>
                </div>

                {/* Score */}
                <div style={{ background: '#0d0d0d', border: '1px solid #1e1e1e', borderRadius: '0.75rem', padding: '1rem' }}>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Compatibilidad</div>
                  <div style={{ fontWeight: 800, fontSize: '1.5rem', color: '#fff' }}>
                    {Number(application.prefilter_score).toFixed(1)}<span style={{ fontSize: '0.9rem', color: '#64748b' }}>/100</span>
                  </div>
                </div>

                {/* Experiencia Acreditada */}
                <div style={{ background: '#0d0d0d', border: '1px solid #1e1e1e', borderRadius: '0.75rem', padding: '1rem' }}>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Exp. Acreditada</div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#e2e8f0' }}>
                    {expMonthsLabel(application.total_accredited_exp_months)}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: 2 }}>
                    Declarada: {expMonthsLabel(application.total_declared_exp_months)}
                  </div>
                </div>

                {/* Discrepancias */}
                <div style={{ background: '#0d0d0d', border: '1px solid #1e1e1e', borderRadius: '0.75rem', padding: '1rem' }}>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Discrepancias</div>
                  <div style={{ fontWeight: 700, fontSize: '1rem', color: application.discrepancies_count > 0 ? '#d97706' : '#16a34a' }}>
                    {application.discrepancies_count > 0 ? `${application.discrepancies_count} detectadas` : 'Sin discrepancias'}
                  </div>
                </div>
              </div>

              {/* Barra de Progreso de Score */}
              {breakdown && (
                <div style={{ marginTop: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.78rem', color: '#64748b' }}>
                    <span>Puntaje obtenido: <b style={{ color: '#e2e8f0' }}>{breakdown.totalEarned}/{breakdown.maxPossible} pts</b></span>
                    <span>Normalizado: <b style={{ color: '#e2e8f0' }}>{breakdown.normalizedPercentage.toFixed(1)}%</b></span>
                  </div>
                  <div style={{ height: 8, background: '#1e1e1e', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: 4,
                      width: `${Math.min(100, breakdown.normalizedPercentage)}%`,
                      background: application.prefilter_status === 'eligible'
                        ? 'linear-gradient(90deg, #16a34a, #22c55e)'
                        : application.prefilter_status === 'review'
                          ? 'linear-gradient(90deg, #d97706, #f59e0b)'
                          : 'linear-gradient(90deg, #dc2626, #ef4444)',
                      transition: 'width 0.6s ease',
                    }} />
                  </div>
                </div>
              )}

              {/* Explicación del estado */}
              {breakdown?.reasons && breakdown.reasons.length > 0 && (
                <div style={{ marginTop: '1rem', background: '#0a0a0a', borderRadius: '0.5rem', padding: '0.75rem 1rem', borderLeft: `3px solid ${status.color}` }}>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase' }}>¿Por qué este resultado?</div>
                  {breakdown.reasons.map((r, i) => (
                    <div key={`reason-${i}`} style={{ fontSize: '0.82rem', color: '#cbd5e1', display: 'flex', gap: 6, alignItems: 'flex-start', marginBottom: 3 }}>
                      <span style={{ color: status.color, marginTop: 2 }}>›</span>
                      <span>{r}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ─── RÚBRICA DE PUNTAJE ─────────────────────────────────────────── */}
            {breakdown && breakdown.rubric.length > 0 && (
              <div style={{ padding: '1.25rem 2rem', borderBottom: '1px solid #1e1e1e' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#dc2626', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Zap size={14} /> Desglose de Puntaje (Explicable)
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.625rem' }}>
                  {breakdown.rubric.map((item, i) => {
                    const meta = STATUS_META[item.result] || STATUS_META.pending;
                    return (
                      <div key={item.title || `rubric-${i}`} style={{
                        background: '#0d0d0d', border: `1px solid ${meta.color}33`,
                        borderRadius: '0.625rem', padding: '0.75rem',
                      }}>
                        <div style={{ fontSize: '0.7rem', color: '#64748b', marginBottom: 4 }}>{item.title}</div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontWeight: 700, fontSize: '1rem', color: '#fff' }}>
                            {item.earned}<span style={{ color: '#475569', fontSize: '0.8rem' }}>/{item.max}</span>
                          </span>
                          <span style={{ color: meta.color, display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.75rem' }}>
                            {meta.icon} {meta.label}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ─── TABLA DE REQUISITOS ──────────────────────────────────────────── */}
            <div style={{ padding: '1.25rem 2rem', borderBottom: '1px solid #1e1e1e' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#dc2626', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                <FileText size={14} /> Evaluación por Requisito
              </div>

              {evaluations.length === 0 ? (
                <div style={{ color: '#475569', fontSize: '0.85rem', padding: '1rem', background: '#0d0d0d', borderRadius: '0.5rem', textAlign: 'center' }}>
                  <Info size={18} style={{ marginBottom: 6, opacity: 0.5 }} />
                  <div>No hay evaluaciones registradas.</div>
                  <div style={{ fontSize: '0.75rem', marginTop: 4, color: '#374151' }}>Ejecuta el motor de prefiltro desde el panel de la convocatoria.</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {evaluations.map((ev, idx) => {
                    const meta = STATUS_META[ev.result] || STATUS_META.pending;
                    const isExpanded = expandedRows.has(ev.id);
                    return (
                      <div key={ev.id || `eval-${idx}`} style={{ background: '#0d0d0d', border: `1px solid ${ev.discrepancy_detected ? '#d97706' : '#1e1e1e'}`, borderRadius: '0.625rem', overflow: 'hidden' }}>
                        {/* Row Header */}
                        <div
                          onClick={() => toggleRow(ev.id)}
                          style={{ padding: '0.75rem 1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem' }}
                        >
                          {/* Status Badge */}
                          <div style={{
                            display: 'flex', alignItems: 'center', gap: 4,
                            color: meta.color, background: meta.bg,
                            padding: '3px 8px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 600,
                            flexShrink: 0, minWidth: 90, justifyContent: 'center',
                          }}>
                            {meta.icon} {meta.label}
                          </div>
                          {/* Title */}
                          <div style={{ flex: 1, fontSize: '0.85rem', color: '#e2e8f0', fontWeight: 500 }}>
                            {ev.requirement_title}
                            {ev.is_overridden && (
                              <span style={{ marginLeft: 6, fontSize: '0.67rem', color: '#7c3aed', background: 'rgba(124,58,237,0.12)', padding: '1px 5px', borderRadius: 4 }}>
                                OVERRIDE
                              </span>
                            )}
                            {ev.discrepancy_detected && (
                              <span style={{ marginLeft: 6, fontSize: '0.67rem', color: '#d97706', background: 'rgba(217,119,6,0.12)', padding: '1px 5px', borderRadius: 4 }}>
                                DISCREPANCIA
                              </span>
                            )}
                          </div>
                          {/* Type Badge */}
                          <span style={{ fontSize: '0.67rem', color: '#475569', flexShrink: 0 }}>
                            {TYPE_LABEL[ev.requirement_type] || ev.requirement_type}
                          </span>
                          {/* Score */}
                          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fff', flexShrink: 0, minWidth: 55, textAlign: 'right' }}>
                            {ev.score_earned}<span style={{ color: '#475569', fontWeight: 400 }}>/{ev.max_score}</span>
                          </div>
                          {/* Source */}
                          <span style={{ fontSize: '0.67rem', color: '#374151', background: '#111', padding: '2px 6px', borderRadius: 4, flexShrink: 0 }}>
                            {SOURCE_LABEL[ev.source_type]}
                          </span>
                          {isExpanded ? <ChevronUp size={14} color="#475569" /> : <ChevronDown size={14} color="#475569" />}
                        </div>

                        {/* Expanded Detail */}
                        {isExpanded && (
                          <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid #1a1a1a', background: '#080808' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '0.75rem' }}>
                              {ev.declared_value && Object.keys(ev.declared_value).length > 0 && (
                                <div>
                                  <div style={{ fontSize: '0.67rem', color: '#64748b', marginBottom: 4, textTransform: 'uppercase' }}>Declarado</div>
                                  <pre style={{ fontSize: '0.72rem', color: '#93c5fd', whiteSpace: 'pre-wrap', margin: 0 }}>
                                    {JSON.stringify(ev.declared_value, null, 2)}
                                  </pre>
                                </div>
                              )}
                              {ev.accredited_value && Object.keys(ev.accredited_value).length > 0 && (
                                <div>
                                  <div style={{ fontSize: '0.67rem', color: '#64748b', marginBottom: 4, textTransform: 'uppercase' }}>Acreditado</div>
                                  <pre style={{ fontSize: '0.72rem', color: '#86efac', whiteSpace: 'pre-wrap', margin: 0 }}>
                                    {JSON.stringify(ev.accredited_value, null, 2)}
                                  </pre>
                                </div>
                              )}
                              {ev.evidence_file_name && (
                                <div>
                                  <div style={{ fontSize: '0.67rem', color: '#64748b', marginBottom: 4, textTransform: 'uppercase' }}>Evidencia</div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.75rem', color: '#60a5fa' }}>
                                    <FileText size={12} />
                                    {ev.evidence_file_name}
                                  </div>
                                </div>
                              )}
                            </div>

                            {ev.evaluation_notes && (
                              <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic', marginBottom: '0.75rem', padding: '0.5rem', background: '#0d0d0d', borderRadius: '0.375rem', borderLeft: `3px solid ${meta.color}` }}>
                                {ev.evaluation_notes}
                              </div>
                            )}

                            {ev.discrepancy_detected && ev.discrepancy_details && (
                              <div style={{ marginBottom: '0.75rem', padding: '0.625rem', background: 'rgba(217,119,6,0.08)', borderRadius: '0.375rem', border: '1px solid rgba(217,119,6,0.25)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.72rem', fontWeight: 700, color: '#d97706', marginBottom: 4 }}>
                                  <AlertTriangle size={12} /> Discrepancia Detectada — Gravedad: <span style={{ color: SEV_COLOR[ev.discrepancy_details.severity] }}>{ev.discrepancy_details.severity.toUpperCase()}</span>
                                </div>
                                <div style={{ fontSize: '0.78rem', color: '#fbbf24' }}>
                                  {ev.discrepancy_details.differenceDescription}
                                </div>
                              </div>
                            )}

                            {ev.is_overridden && ev.override_reason && (
                              <div style={{ marginBottom: '0.75rem', padding: '0.625rem', background: 'rgba(124,58,237,0.08)', borderRadius: '0.375rem', border: '1px solid rgba(124,58,237,0.2)' }}>
                                <div style={{ fontSize: '0.7rem', color: '#a78bfa', fontWeight: 700, marginBottom: 3, textTransform: 'uppercase' }}>Decisión Manual Registrada</div>
                                <div style={{ fontSize: '0.78rem', color: '#c4b5fd' }}>{ev.override_reason}</div>
                              </div>
                            )}

                            {/* Override Button */}
                            <button
                              onClick={() => { setOverrideTarget(ev); setOverrideResult(ev.result === 'fail' ? 'pass' : 'review'); setOverrideReason(''); }}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 5,
                                background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)',
                                color: '#dc2626', padding: '5px 10px', borderRadius: '0.375rem',
                                cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600,
                              }}
                            >
                              <Edit3 size={12} /> Revisar y Decidir (Override)
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ─── OVERRIDE PANEL ───────────────────────────────────────────────── */}
            {overrideTarget && (
              <div style={{ padding: '1.5rem 2rem', background: 'rgba(124,58,237,0.06)', borderBottom: '1px solid rgba(124,58,237,0.15)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: '0.75rem', color: '#a78bfa', fontWeight: 700, fontSize: '0.85rem' }}>
                  <UserCheck size={16} /> Revisión y Decisión Manual — {overrideTarget.requirement_title}
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                  {(['pass', 'review', 'fail'] as const).map(r => {
                    const m = STATUS_META[r];
                    return (
                      <button
                        key={r}
                        onClick={() => setOverrideResult(r)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 5,
                          padding: '6px 14px', borderRadius: '20px', cursor: 'pointer',
                          fontWeight: 600, fontSize: '0.78rem',
                          background: overrideResult === r ? m.bg : 'transparent',
                          border: `1.5px solid ${overrideResult === r ? m.color : '#1e1e1e'}`,
                          color: overrideResult === r ? m.color : '#475569',
                        }}
                      >
                        {m.icon} {m.label}
                      </button>
                    );
                  })}
                </div>
                <textarea
                  value={overrideReason}
                  onChange={e => setOverrideReason(e.target.value)}
                  placeholder="Motivo obligatorio de la decisión (ej: Candidato presentó documento original en entrevista)…"
                  rows={3}
                  style={{
                    width: '100%', background: '#0d0d0d', border: '1px solid #1e1e1e',
                    borderRadius: '0.5rem', padding: '0.75rem', color: '#e2e8f0',
                    fontSize: '0.82rem', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box',
                  }}
                />
                {overrideError && (
                  <div style={{ color: '#dc2626', fontSize: '0.78rem', marginTop: 5 }}>{overrideError}</div>
                )}
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                  <button
                    onClick={submitOverride}
                    disabled={overrideSaving}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      background: '#7c3aed', border: 'none', color: '#fff',
                      padding: '8px 18px', borderRadius: '0.5rem', cursor: 'pointer',
                      fontWeight: 700, fontSize: '0.82rem', opacity: overrideSaving ? 0.7 : 1,
                    }}
                  >
                    <Save size={13} /> {overrideSaving ? 'Guardando…' : 'Confirmar Decisión'}
                  </button>
                  <button
                    onClick={() => setOverrideTarget(null)}
                    style={{ background: 'none', border: '1px solid #1e1e1e', color: '#64748b', padding: '8px 14px', borderRadius: '0.5rem', cursor: 'pointer', fontSize: '0.82rem' }}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {/* Footer */}
            <div style={{ padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '0.72rem', color: '#374151' }}>
                {application.evaluated_at ? `Evaluado: ${new Date(application.evaluated_at).toLocaleString('es-PE')}` : 'Sin evaluación previa'}
              </div>
              <button
                onClick={onClose}
                style={{
                  background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.2)',
                  color: '#dc2626', padding: '8px 18px', borderRadius: '0.5rem',
                  cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem',
                }}
              >
                Cerrar
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default EvaluationModal;
