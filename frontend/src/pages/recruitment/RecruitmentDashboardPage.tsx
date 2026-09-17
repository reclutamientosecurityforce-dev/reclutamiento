import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import {
  Users,
  Briefcase,
  Award,
  Calendar,
  ArrowRight,
  TrendingUp,
  CheckCircle2,
  Clock,
} from 'lucide-react';

interface SummaryData {
  totalCandidates: number;
  openVacancies: number;
  inEvaluation: number;
  approvedCount: number;
  hiredCount: number;
  activeRecruiters: number;
  pipelineCounts: {
    registered: number;
    phone_screening: number;
    psychological_eval: number;
    background_check: number;
    interview: number;
    medical_exam: number;
    approved: number;
    hired: number;
    rejected: number;
  };
}

interface InterviewItem {
  id: string;
  interview_date: string;
  location_type: string;
  location_notes?: string;
  candidate_name: string;
  candidate_phone: string;
  job_title: string;
  interviewer_name?: string;
}

export const RecruitmentDashboardPage: React.FC = () => {
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [interviews, setInterviews] = useState<InterviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [sumRes, intRes] = await Promise.all([
          api.get<SummaryData>('/recruitment/summary'),
          api.get<InterviewItem[]>('/recruitment/interviews'),
        ]);
        setSummary(sumRes);
        setInterviews(intRes);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Error al cargar dashboard');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '4rem', textAlign: 'center', color: '#1a1a1a' }}>
        Cargando panel de reclutamiento y selecciÃ³n...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', borderRadius: 'var(--radius-lg)' }}>
        Error: {error}
      </div>
    );
  }

  const pCounts = summary?.pipelineCounts || {
    registered: 0,
    phone_screening: 0,
    psychological_eval: 0,
    background_check: 0,
    interview: 0,
    medical_exam: 0,
    approved: 0,
    hired: 0,
    rejected: 0,
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.08em', background: 'rgba(99, 102, 241, 0.15)', padding: '0.2rem 0.6rem', borderRadius: '4px' }}>
              Security Force S.A.C.
            </span>
            <span style={{ fontSize: '0.75rem', color: '#1a1a1a' }}>â€¢ GestiÃ³n del Talento</span>
          </div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 800, color: '#1a1a1a' }}>
            Panel de Reclutamiento y SelecciÃ³n
          </h1>
          <p style={{ fontSize: '0.9rem', color: '#1a1a1a', marginTop: '0.25rem' }}>
            Control de vacantes operativas, flujo de evaluaciÃ³n y contrataciÃ³n de agentes
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn-secondary" onClick={() => navigate('/recruitment/openings')}>
            <Briefcase size={18} />
            <span>Ver Convocatorias</span>
          </button>
          <button className="btn-primary" onClick={() => navigate('/recruitment/candidates')}>
            <Users size={18} />
            <span>Nuevo Postulante</span>
          </button>
        </div>
      </div>

      {/* â”€â”€â”€ KPIs PRINCIPALES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        {/* Total Postulantes */}
        <div className="stat-card" style={{ borderLeft: '4px solid #6366f1' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="stat-label">Total Postulantes</span>
            <Users size={20} color="#818cf8" />
          </div>
          <div className="stat-value" style={{ color: '#1a1a1a' }}>
            {summary?.totalCandidates ?? 0}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#818cf8' }}>Base de datos activa</span>
        </div>

        {/* Vacantes Disponibles */}
        <div className="stat-card" style={{ borderLeft: '4px solid #38bdf8' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="stat-label">Vacantes Requeridas</span>
            <Briefcase size={20} color="#38bdf8" />
          </div>
          <div className="stat-value" style={{ color: '#38bdf8' }}>
            {summary?.openVacancies ?? 0}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#1a1a1a' }}>Por cubrir en unidades</span>
        </div>

        {/* En EvaluaciÃ³n */}
        <div className="stat-card" style={{ borderLeft: '4px solid #f59e0b' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="stat-label">En Proceso</span>
            <Clock size={20} color="#f59e0b" />
          </div>
          <div className="stat-value" style={{ color: '#fbbf24' }}>
            {summary?.inEvaluation ?? 0}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#fbbf24' }}>En filtro o evaluaciÃ³n</span>
        </div>

        {/* Aprobados Listos para Contrato */}
        <div className="stat-card" style={{ borderLeft: '4px solid #10b981' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="stat-label">Aprobados Aptos</span>
            <CheckCircle2 size={20} color="#10b981" />
          </div>
          <div className="stat-value" style={{ color: '#34d399' }}>
            {summary?.approvedCount ?? 0}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#34d399' }}>Listos para asignaciÃ³n</span>
        </div>

        {/* Contratados */}
        <div className="stat-card" style={{ borderLeft: '4px solid #a855f7' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="stat-label">Contratados</span>
            <Award size={20} color="#c084fc" />
          </div>
          <div className="stat-value" style={{ color: '#c084fc' }}>
            {summary?.hiredCount ?? 0}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#a855f7' }}>Ingresos a planilla</span>
        </div>
      </div>

      {/* â”€â”€â”€ EMBUDO DE SELECCIÃ“N (PIPELINE VISUAL) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="glass-panel" style={{ padding: '1.75rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <TrendingUp size={20} color="#818cf8" />
            <h3 style={{ fontSize: '1.15rem', color: '#1a1a1a' }}>Embudo de SelecciÃ³n de Personal</h3>
          </div>
          <button
            onClick={() => navigate('/recruitment/pipeline')}
            style={{ background: 'transparent', color: '#818cf8', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <span>Ver Tablero Pipeline Completo</span>
            <ArrowRight size={14} />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.85rem' }}>
          {/* Etapa 1: Registrados */}
          <div style={{ background: 'var(--bg-surface-elevated)', padding: '1rem', borderRadius: 'var(--radius-md)', textAlign: 'center', border: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: '0.7rem', color: '#1a1a1a', textTransform: 'uppercase', fontWeight: 700 }}>1. Registrados</span>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1a1a1a', margin: '0.25rem 0' }}>{pCounts.registered}</div>
            <span style={{ fontSize: '0.68rem', color: '#0f1419' }}>PostulaciÃ³n</span>
          </div>

          {/* Etapa 2: Filtro TelefÃ³nico */}
          <div style={{ background: 'var(--bg-surface-elevated)', padding: '1rem', borderRadius: 'var(--radius-md)', textAlign: 'center', border: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: '0.7rem', color: '#1a1a1a', textTransform: 'uppercase', fontWeight: 700 }}>2. Filtro Tel.</span>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#818cf8', margin: '0.25rem 0' }}>{pCounts.phone_screening}</div>
            <span style={{ fontSize: '0.68rem', color: '#0f1419' }}>Requisitos mÃ­n.</span>
          </div>

          {/* Etapa 3: PsicolÃ³gico */}
          <div style={{ background: 'var(--bg-surface-elevated)', padding: '1rem', borderRadius: 'var(--radius-md)', textAlign: 'center', border: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: '0.7rem', color: '#1a1a1a', textTransform: 'uppercase', fontWeight: 700 }}>3. PsicologÃ­a</span>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#38bdf8', margin: '0.25rem 0' }}>{pCounts.psychological_eval}</div>
            <span style={{ fontSize: '0.68rem', color: '#0f1419' }}>Test y porte</span>
          </div>

          {/* Etapa 4: Antecedentes */}
          <div style={{ background: 'var(--bg-surface-elevated)', padding: '1rem', borderRadius: 'var(--radius-md)', textAlign: 'center', border: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: '0.7rem', color: '#1a1a1a', textTransform: 'uppercase', fontWeight: 700 }}>4. Antecedentes</span>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fbbf24', margin: '0.25rem 0' }}>{pCounts.background_check}</div>
            <span style={{ fontSize: '0.68rem', color: '#0f1419' }}>SUCAMEC/Pol.</span>
          </div>

          {/* Etapa 5: Entrevista */}
          <div style={{ background: 'var(--bg-surface-elevated)', padding: '1rem', borderRadius: 'var(--radius-md)', textAlign: 'center', border: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: '0.7rem', color: '#1a1a1a', textTransform: 'uppercase', fontWeight: 700 }}>5. Entrevista</span>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f59e0b', margin: '0.25rem 0' }}>{pCounts.interview}</div>
            <span style={{ fontSize: '0.68rem', color: '#0f1419' }}>Con Reclutador</span>
          </div>

          {/* Etapa 6: MÃ©dico */}
          <div style={{ background: 'var(--bg-surface-elevated)', padding: '1rem', borderRadius: 'var(--radius-md)', textAlign: 'center', border: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: '0.7rem', color: '#1a1a1a', textTransform: 'uppercase', fontWeight: 700 }}>6. Ex. MÃ©dico</span>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f43f5e', margin: '0.25rem 0' }}>{pCounts.medical_exam}</div>
            <span style={{ fontSize: '0.68rem', color: '#0f1419' }}>Ocupacional</span>
          </div>

          {/* Etapa 7: Aprobados */}
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '1rem', borderRadius: 'var(--radius-md)', textAlign: 'center', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
            <span style={{ fontSize: '0.7rem', color: '#34d399', textTransform: 'uppercase', fontWeight: 700 }}>7. Aprobados</span>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#34d399', margin: '0.25rem 0' }}>{pCounts.approved}</div>
            <span style={{ fontSize: '0.68rem', color: '#10b981' }}>Listos</span>
          </div>

          {/* Etapa 8: Contratados */}
          <div style={{ background: 'rgba(168, 85, 247, 0.1)', padding: '1rem', borderRadius: 'var(--radius-md)', textAlign: 'center', border: '1px solid rgba(168, 85, 247, 0.3)' }}>
            <span style={{ fontSize: '0.7rem', color: '#c084fc', textTransform: 'uppercase', fontWeight: 700 }}>8. Contratados</span>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#c084fc', margin: '0.25rem 0' }}>{pCounts.hired}</div>
            <span style={{ fontSize: '0.68rem', color: '#a855f7' }}>En planilla</span>
          </div>
        </div>
      </div>

      {/* â”€â”€â”€ PRÃ“XIMAS ENTREVISTAS PROGRAMADAS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="glass-panel" style={{ padding: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Calendar size={20} color="#818cf8" />
            <h3 style={{ fontSize: '1.15rem', color: '#1a1a1a' }}>Agenda de Entrevistas y Evaluaciones</h3>
          </div>
          <button
            onClick={() => navigate('/recruitment/interviews')}
            style={{ background: 'transparent', color: '#818cf8', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <span>Ver Agenda Completa</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {interviews.length === 0 ? (
          <p style={{ color: '#0f1419', fontSize: '0.875rem' }}>No hay entrevistas programadas para hoy.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {interviews.slice(0, 5).map((item) => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.85rem 1.25rem',
                  background: 'var(--bg-surface-elevated)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      background: 'rgba(99, 102, 241, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#818cf8',
                    }}
                  >
                    <Calendar size={20} />
                  </div>
                  <div>
                    <p style={{ fontSize: '0.925rem', fontWeight: 700, color: '#1a1a1a' }}>
                      {item.candidate_name}{' '}
                      <span style={{ fontSize: '0.8rem', fontWeight: 400, color: '#1a1a1a' }}>
                        ({item.candidate_phone})
                      </span>
                    </p>
                    <p style={{ fontSize: '0.78rem', color: '#1a1a1a', marginTop: '2px' }}>
                      Puesto: <strong>{item.job_title}</strong> â€¢ Entrevistador: {item.interviewer_name || 'Reclutador'}
                    </p>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#38bdf8' }}>
                    {new Date(item.interview_date).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <span style={{ fontSize: '0.72rem', color: '#1a1a1a' }}>
                    {new Date(item.interview_date).toLocaleDateString('es-PE')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};




