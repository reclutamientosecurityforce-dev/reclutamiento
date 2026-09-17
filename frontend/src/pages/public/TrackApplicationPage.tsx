import React, { useState } from 'react';
import { api } from '../../api/client';
import { PublicHeader } from './PublicHeader';
import {
  Search,
  CheckCircle2,
  Clock,
  Calendar,
  MapPin,
  Video,
  AlertCircle,
  Shield,
  ArrowRight,
} from 'lucide-react';

interface TrackingResult {
  applicationCode: string;
  candidateName: string;
  documentNumber: string;
  jobTitle: string;
  jobLocation: string;
  status: string;
  currentStage: string;
  submittedAt?: string;
  lastUpdate?: string;
  scheduledInterview?: {
    date: string;
    locationType: string;
    notes?: string;
  } | null;
}

export const TrackApplicationPage: React.FC = () => {
  const [docNumber, setDocNumber] = useState('');
  const [appCode, setAppCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TrackingResult | null>(null);

  const handleTrackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);

    try {
      const data = await api.post<TrackingResult>('/public/tracking', {
        documentNumber: docNumber.trim(),
        applicationCode: appCode.trim(),
      });
      setResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'No se encontrÃ³ la postulaciÃ³n.');
    } finally {
      setLoading(false);
    }
  };

  const getStageDisplay = (stage: string) => {
    const map: Record<string, { label: string; color: string; desc: string }> = {
      registered: {
        label: 'PostulaciÃ³n Registrada',
        color: '#38bdf8',
        desc: 'Tu postulaciÃ³n ha sido recibida y se encuentra en cola de prefiltro curricular por el equipo de SelecciÃ³n.',
      },
      phone_screening: {
        label: 'En Filtro TelefÃ³nico',
        color: '#818cf8',
        desc: 'Un reclutador revisarÃ¡ tu perfil y podrÃ­a contactarte vÃ­a WhatsApp o llamada para validar tu disponibilidad.',
      },
      psychological_eval: {
        label: 'EvaluaciÃ³n PsicolÃ³gica',
        color: '#fbbf24',
        desc: 'En proceso de pruebas psicotÃ©cnicas y evaluaciÃ³n de perfil de seguridad.',
      },
      background_check: {
        label: 'VerificaciÃ³n de Antecedentes',
        color: '#f59e0b',
        desc: 'Validando antecedentes policiales, judiciales, penales y carnÃ© SUCAMEC.',
      },
      interview: {
        label: 'Entrevista de SelecciÃ³n',
        color: '#a855f7',
        desc: 'Tienes una entrevista asignada o en proceso de coordinaciÃ³n con nuestro equipo.',
      },
      medical_exam: {
        label: 'Examen MÃ©dico Ocupacional',
        color: '#f43f5e',
        desc: 'Etapa de evaluaciÃ³n mÃ©dica ocupacional previa a la contrataciÃ³n.',
      },
      approved: {
        label: 'ðŸŸ¢ APROBADO APTO',
        color: '#34d399',
        desc: 'Â¡Felicitaciones! Has aprobado todas las etapas y te encuentras apto para asignaciÃ³n y contrataciÃ³n a la unidad.',
      },
      hired: {
        label: 'ðŸŸ£ CONTRATADO',
        color: '#c084fc',
        desc: 'Ingreso confirmado a planilla directa de Security Force P&V S.A.C.',
      },
      rejected: {
        label: 'ðŸ”´ Proceso Concluido',
        color: '#ef4444',
        desc: 'Tu postulaciÃ³n no continuarÃ¡ en esta convocatoria, pero tu perfil queda en nuestra base de datos para futuros requerimientos.',
      },
    };

    return map[stage] || { label: stage, color: '#aaa', desc: 'En revisiÃ³n por el Ã¡rea de Recursos Humanos.' };
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f7', color: '#ffffff' }}>
      <PublicHeader showBackToJobs />

      <main style={{ maxWidth: '680px', margin: '0 auto', padding: '3rem 1.5rem 5rem' }}>
        {/* Search Card */}
        <div
          style={{
            background: '#f5f5f7',
            border: '1px solid rgba(220, 38, 38, 0.25)',
            borderRadius: '20px',
            padding: '2.5rem 2rem',
            marginBottom: '2rem',
            boxShadow: '0 20px 60px rgba(100,100,100,0.85)',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '14px',
                background: 'rgba(220, 38, 38, 0.12)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#dc2626',
                marginBottom: '1rem',
              }}
            >
              <Search size={28} />
            </div>
            <h1
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: '2rem',
                fontWeight: 900,
                color: '#ffffff',
                textTransform: 'uppercase',
              }}
            >
              Consulta el Estado de tu PostulaciÃ³n
            </h1>
            <p style={{ fontSize: '0.85rem', color: '#888', marginTop: '0.25rem' }}>
              Ingresa tu DNI y el CÃ³digo Oficial generado al postular (ej: SF-2026-8K42P).
            </p>
          </div>

          {error && (
            <div style={{ background: 'rgba(220, 38, 38, 0.1)', border: '1px solid rgba(220, 38, 38, 0.3)', color: '#f87171', padding: '0.85rem 1rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleTrackSubmit}>
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#aaa', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                NÃºmero de DNI / Documento <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                type="text"
                value={docNumber}
                onChange={(e) => setDocNumber(e.target.value)}
                placeholder="Ej: 71234567"
                required
                maxLength={15}
              />
            </div>

            <div style={{ marginBottom: '1.75rem' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#aaa', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                CÃ³digo de PostulaciÃ³n <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                type="text"
                value={appCode}
                onChange={(e) => setAppCode(e.target.value.toUpperCase())}
                placeholder="Ej: SF-2026-8K42P"
                required
                style={{ textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}
              />
            </div>

            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
              style={{ width: '100%', padding: '0.95rem', fontSize: '1.05rem', letterSpacing: '0.06em' }}
            >
              <span>{loading ? 'BUSCANDO EXPEDIENTE...' : 'CONSULTAR ESTADO'}</span>
              <Search size={18} />
            </button>
          </form>
        </div>

        {/* Results Card */}
        {result && (
          <div
            style={{
              background: '#f5f5f7',
              border: '1px solid rgba(220, 38, 38, 0.3)',
              borderRadius: '20px',
              padding: '2.5rem 2rem',
              boxShadow: '0 20px 60px rgba(100,100,100,0.85)',
              animation: 'fadeIn 0.3s ease',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Expediente del Postulante
                </span>
                <h3 style={{ fontSize: '1.45rem', color: '#fff', marginTop: '0.1rem' }}>
                  {result.candidateName}
                </h3>
                <p style={{ fontSize: '0.825rem', color: '#dc2626', fontWeight: 700 }}>
                  DNI: {result.documentNumber}
                </p>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.75rem', color: '#888' }}>CÃ³digo:</span>
                <div style={{ fontFamily: "'Barlow Condensed', monospace", fontSize: '1.35rem', fontWeight: 900, color: '#ffffff' }}>
                  {result.applicationCode}
                </div>
              </div>
            </div>

            {/* Puesto al que postula */}
            <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '1rem 1.25rem', borderRadius: '12px', marginBottom: '1.5rem' }}>
              <span style={{ fontSize: '0.72rem', color: '#888', textTransform: 'uppercase' }}>Convocatoria:</span>
              <h4 style={{ fontSize: '1.1rem', color: '#fff', margin: '0.2rem 0' }}>{result.jobTitle}</h4>
              <span style={{ fontSize: '0.8rem', color: '#aaa' }}>ðŸ“ Sede: {result.jobLocation}</span>
            </div>

            {/* Estado Actual */}
            {(() => {
              const sInfo = getStageDisplay(result.currentStage);
              return (
                <div
                  style={{
                    background: 'rgba(220, 38, 38, 0.06)',
                    border: '1px solid ' + sInfo.color,
                    borderRadius: '14px',
                    padding: '1.5rem',
                    marginBottom: '1.5rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: sInfo.color }} />
                    <h4 style={{ fontSize: '1.15rem', color: sInfo.color, fontWeight: 800, textTransform: 'uppercase' }}>
                      {sInfo.label}
                    </h4>
                  </div>
                  <p style={{ fontSize: '0.875rem', color: '#ccc', lineHeight: 1.5 }}>
                    {sInfo.desc}
                  </p>
                </div>
              );
            })()}

            {/* Cita de Entrevista si existe */}
            {result.scheduledInterview && (
              <div
                style={{
                  background: 'rgba(168, 85, 247, 0.1)',
                  border: '1px solid rgba(168, 85, 247, 0.3)',
                  borderRadius: '14px',
                  padding: '1.25rem',
                  marginTop: '1.5rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#c084fc', marginBottom: '0.5rem' }}>
                  <Calendar size={18} />
                  <h4 style={{ fontSize: '1rem', fontWeight: 700 }}>Entrevista de SelecciÃ³n Programada</h4>
                </div>
                <div style={{ fontSize: '0.85rem', color: '#eee', lineHeight: 1.6 }}>
                  <p>
                    ðŸ“… <strong>Fecha y Hora:</strong> {new Date(result.scheduledInterview.date).toLocaleString('es-PE')}
                  </p>
                  <p>
                    {result.scheduledInterview.locationType === 'virtual' ? 'ðŸ’» Modalidad: Virtual' : 'ðŸ¢ Modalidad: Presencial'}
                  </p>
                  {result.scheduledInterview.notes && (
                    <p style={{ color: '#aaa', fontSize: '0.8rem', marginTop: '0.3rem' }}>
                      ðŸ“ Indicaciones: {result.scheduledInterview.notes}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};


