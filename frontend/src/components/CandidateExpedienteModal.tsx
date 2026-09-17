import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import {
  X,
  User,
  Shield,
  FileText,
  Calendar,
  Award,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Briefcase,
  Phone,
  Mail,
  MapPin,
  ExternalLink,
  Hash,
} from 'lucide-react';

interface Props {
  candidateId: string;
  onClose: () => void;
}

export const CandidateExpedienteModal: React.FC<Props> = ({ candidateId, onClose }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadExpediente() {
      try {
        setLoading(true);
        const res = await api.get<any>(`/recruitment/candidates/${candidateId}/expediente`);
        setData(res);
      } catch (err) {
        console.error('Error al cargar expediente:', err);
      } finally {
        setLoading(false);
      }
    }
    loadExpediente();
  }, [candidateId]);

  if (loading) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
        <div style={{ color: '#fff', fontSize: '1rem' }}>Cargando expediente digital...</div>
      </div>
    );
  }

  if (!data?.candidate) {
    return null;
  }

  const { candidate, applications, documents, interviews, validities } = data;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#e8e8f0827',
          border: '1px solid #374151',
          borderRadius: '16px',
          maxWidth: '900px',
          width: '100%',
          maxHeight: '92vh',
          overflowY: 'auto',
          padding: '1.75rem',
          color: '#f8fafc',
          boxShadow: '0 25px 50px rgba(0,0,0,0.6)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', borderBottom: '1px solid #d8d8e0', paddingBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(220,38,38,0.15)', border: '1px solid rgba(220,38,38,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f87171' }}>
              <User size={26} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0, color: '#ffffff' }}>
                  {candidate.first_name} {candidate.last_name}
                </h2>
                <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '4px', background: '#0f172a', color: '#38bdf8', fontFamily: 'monospace', fontWeight: 700 }}>
                  {candidate.document_type}: {candidate.document_number}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                Expediente Digital Unificado â€¢ Security Force P&V
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
            <X size={22} />
          </button>
        </div>

        {/* SemÃ¡foro de Vigencias Documentales (Fase 2.5) */}
        <div style={{ marginBottom: '1.5rem' }}>
          <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.05em', display: 'block', marginBottom: '0.5rem' }}>
            Vigencia y Acreditaciones Regulatorias
          </span>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem' }}>
            {/* SUCAMEC */}
            <div style={{ background: '#0f172a', border: '1px solid #d8d8e0', borderRadius: '10px', padding: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f8fafc' }}>Carnet SUCAMEC</span>
                <span
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    padding: '0.15rem 0.45rem',
                    borderRadius: '999px',
                    background: validities?.sucamec?.status === 'valid' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                    color: validities?.sucamec?.status === 'valid' ? '#4ade80' : '#f87171',
                  }}
                >
                  {validities?.sucamec?.status === 'valid' ? 'VIGENTE' : validities?.sucamec?.status?.toUpperCase() || 'NO POSEE'}
                </span>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                CÃ³digo: <strong style={{ color: '#cbd5e1' }}>{validities?.sucamec?.code || 'N/D'}</strong>
              </div>
            </div>

            {/* Licencia de Armas */}
            <div style={{ background: '#0f172a', border: '1px solid #d8d8e0', borderRadius: '10px', padding: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f8fafc' }}>Licencia de Armas</span>
                <span
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    padding: '0.15rem 0.45rem',
                    borderRadius: '999px',
                    background: validities?.gunLicense?.hasLicense ? 'rgba(34,197,94,0.15)' : 'rgba(100,116,139,0.15)',
                    color: validities?.gunLicense?.hasLicense ? '#4ade80' : '#94a3b8',
                  }}
                >
                  {validities?.gunLicense?.hasLicense ? `TIPO ${validities?.gunLicense?.type || 'L1'}` : 'NO TIENE'}
                </span>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                Estado: <strong style={{ color: '#cbd5e1' }}>{validities?.gunLicense?.hasLicense ? 'Acreditado' : 'Sin licencia'}</strong>
              </div>
            </div>

            {/* Licencia de Conducir */}
            <div style={{ background: '#0f172a', border: '1px solid #d8d8e0', borderRadius: '10px', padding: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f8fafc' }}>Brevete / Licencia</span>
                <span
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    padding: '0.15rem 0.45rem',
                    borderRadius: '999px',
                    background: validities?.driverLicense?.hasLicense ? 'rgba(34,197,94,0.15)' : 'rgba(100,116,139,0.15)',
                    color: validities?.driverLicense?.hasLicense ? '#4ade80' : '#94a3b8',
                  }}
                >
                  {validities?.driverLicense?.hasLicense ? `CLASE ${validities?.driverLicense?.type || 'A1'}` : 'NO TIENE'}
                </span>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                Estado: <strong style={{ color: '#cbd5e1' }}>{validities?.driverLicense?.hasLicense ? 'Vigente' : 'Sin brevete'}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Datos Personales & BiomÃ©tricos */}
        <div style={{ background: '#0f172a', border: '1px solid #d8d8e0', borderRadius: '12px', padding: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem', fontSize: '0.82rem' }}>
            <div>
              <span style={{ color: '#64748b', display: 'block', fontSize: '0.7rem' }}>TELÃ‰FONO</span>
              <strong style={{ color: '#f8fafc' }}>{candidate.phone || 'N/D'}</strong>
            </div>
            <div>
              <span style={{ color: '#64748b', display: 'block', fontSize: '0.7rem' }}>EMAIL</span>
              <strong style={{ color: '#f8fafc' }}>{candidate.email || 'N/D'}</strong>
            </div>
            <div>
              <span style={{ color: '#64748b', display: 'block', fontSize: '0.7rem' }}>UBICACIÃ“N / DISTRITO</span>
              <strong style={{ color: '#f8fafc' }}>{candidate.district || candidate.city || 'Lima'}</strong>
            </div>
            <div>
              <span style={{ color: '#64748b', display: 'block', fontSize: '0.7rem' }}>ESTATURA / PESO</span>
              <strong style={{ color: '#f8fafc' }}>{candidate.height_cm ? `${candidate.height_cm} cm` : 'N/D'} / {candidate.weight_kg ? `${candidate.weight_kg} kg` : 'N/D'}</strong>
            </div>
            <div>
              <span style={{ color: '#64748b', display: 'block', fontSize: '0.7rem' }}>EXP. SEGURIDAD</span>
              <strong style={{ color: '#34d399' }}>{candidate.security_experience_years || 0} aÃ±os</strong>
            </div>
            <div>
              <span style={{ color: '#64748b', display: 'block', fontSize: '0.7rem' }}>SERV. MILITAR</span>
              <strong style={{ color: candidate.military_service ? '#4ade80' : '#94a3b8' }}>
                {candidate.military_service ? 'ACREDITADO' : 'NO'}
              </strong>
            </div>
          </div>
        </div>

        {/* Tarjeta Comparativa de Experiencia y Discrepancias (Fase 2.6) */}
        {data.experienceBreakdown && (
          <div
            style={{
              background: data.experienceBreakdown.status === 'DISCREPANCIA' ? 'rgba(234, 179, 8, 0.08)' : 'rgba(16, 185, 129, 0.08)',
              border: data.experienceBreakdown.status === 'DISCREPANCIA' ? '1px solid rgba(234, 179, 8, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '12px',
              padding: '1rem 1.25rem',
              marginBottom: '1.5rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Briefcase size={17} color={data.experienceBreakdown.status === 'DISCREPANCIA' ? '#facc15' : '#34d399'} />
                <strong style={{ fontSize: '0.85rem', color: '#ffffff' }}>AuditorÃ­a de Experiencia Laboral (Interval Merging)</strong>
              </div>
              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  padding: '0.15rem 0.5rem',
                  borderRadius: '999px',
                  background: data.experienceBreakdown.status === 'DISCREPANCIA' ? 'rgba(234, 179, 8, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                  color: data.experienceBreakdown.status === 'DISCREPANCIA' ? '#facc15' : '#4ade80',
                }}
              >
                {data.experienceBreakdown.status}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem', fontSize: '0.8rem' }}>
              <div>
                <span style={{ color: '#94a3b8', fontSize: '0.7rem', display: 'block' }}>EXP. DECLARADA</span>
                <strong style={{ color: '#f8fafc' }}>
                  {data.experienceBreakdown.declaredMonths} meses ({data.experienceBreakdown.declaredYears} aÃ±os)
                </strong>
              </div>
              <div>
                <span style={{ color: '#94a3b8', fontSize: '0.7rem', display: 'block' }}>EXP. ACREDITADA</span>
                <strong style={{ color: '#38bdf8' }}>
                  {data.experienceBreakdown.accreditedMonths} meses netos
                </strong>
              </div>
              <div>
                <span style={{ color: '#94a3b8', fontSize: '0.7rem', display: 'block' }}>DIFERENCIA / BRECHA</span>
                <strong style={{ color: data.experienceBreakdown.discrepancyMonths > 6 ? '#f87171' : '#4ade80' }}>
                  {data.experienceBreakdown.discrepancyMonths} meses
                </strong>
              </div>
              <div>
                <span style={{ color: '#94a3b8', fontSize: '0.7rem', display: 'block' }}>SUPERPOSICIONES</span>
                <strong style={{ color: data.experienceBreakdown.hasOverlap ? '#facc15' : '#94a3b8' }}>
                  {data.experienceBreakdown.hasOverlap ? 'Detectadas (fusionadas)' : 'Sin traslapes'}
                </strong>
              </div>
            </div>
          </div>
        )}

        {/* Historial de Postulaciones y Resultado de Prefiltro (Doble Score) */}
        <div style={{ marginBottom: '1.5rem' }}>
          <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.05em', display: 'block', marginBottom: '0.5rem' }}>
            Historial de Postulaciones y EvaluaciÃ³n Dual (Fit vs Expediente)
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {applications?.map((app: any) => (
              <div
                key={app.id}
                style={{
                  background: '#0f172a',
                  border: '1px solid #d8d8e0',
                  borderRadius: '10px',
                  padding: '0.85rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <strong style={{ fontSize: '0.9rem', color: '#ffffff' }}>{app.job_title}</strong>
                    <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>({app.job_location})</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>
                    Postulado: {app.created_at ? new Date(app.created_at).toLocaleDateString() : 'N/D'}
                    {app.channel_name && ` â€¢ Canal: ${app.channel_name}`}
                    {app.campaign_name && ` â€¢ CampaÃ±a: ${app.campaign_name}`}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.65rem', color: '#94a3b8', display: 'block' }}>FITSCORE PUESTO</span>
                    <strong style={{ fontSize: '0.92rem', color: app.prefilter_score >= 70 ? '#4ade80' : '#facc15' }}>
                      {app.prefilter_score || 0}/100
                    </strong>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.65rem', color: '#94a3b8', display: 'block' }}>EXPEDIENTE</span>
                    <strong style={{ fontSize: '0.92rem', color: (app.expediente_score || 70) >= 70 ? '#38bdf8' : '#f87171' }}>
                      {app.expediente_score || 70}/100
                    </strong>
                  </div>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      padding: '0.25rem 0.6rem',
                      borderRadius: '6px',
                      background:
                        app.prefilter_status === 'eligible'
                          ? 'rgba(34,197,94,0.15)'
                          : app.prefilter_status === 'review'
                          ? 'rgba(234,179,8,0.15)'
                          : 'rgba(239,68,68,0.15)',
                      color:
                        app.prefilter_status === 'eligible'
                          ? '#4ade80'
                          : app.prefilter_status === 'review'
                          ? '#facc15'
                          : '#f87171',
                      textTransform: 'uppercase',
                    }}
                  >
                    {app.prefilter_status || 'REGISTRADO'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Documentos y Evidencias con Hash SHA-256 */}
        <div>
          <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.05em', display: 'block', marginBottom: '0.5rem' }}>
            Evidencias y Documentos Acreditados ({documents?.length || 0})
          </span>
          {documents?.length === 0 ? (
            <div style={{ padding: '1rem', background: '#0f172a', borderRadius: '8px', color: '#64748b', fontSize: '0.8rem', textAlign: 'center' }}>
              No hay documentos cargados en el expediente.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.6rem' }}>
              {documents?.map((doc: any) => {
                const docStatusColors: Record<string, { bg: string; color: string; label: string }> = {
                  legible:    { bg: 'rgba(34,197,94,0.15)',   color: '#4ade80', label: 'âœ” LEGIBLE' },
                  vigente:    { bg: 'rgba(34,197,94,0.15)',   color: '#4ade80', label: 'âœ” VIGENTE' },
                  verified:   { bg: 'rgba(34,197,94,0.15)',   color: '#4ade80', label: 'âœ” VERIFICADO' },
                  uploaded:   { bg: 'rgba(100,116,139,0.15)', color: '#94a3b8', label: 'Â· SUBIDO' },
                  pendiente:  { bg: 'rgba(100,116,139,0.15)', color: '#94a3b8', label: 'â³ PENDIENTE' },
                  incompleto: { bg: 'rgba(234,179,8,0.15)',   color: '#facc15', label: 'âš  INCOMPLETO' },
                  observado:  { bg: 'rgba(234,179,8,0.15)',   color: '#facc15', label: 'âš  OBSERVADO' },
                  observed:   { bg: 'rgba(234,179,8,0.15)',   color: '#facc15', label: 'âš  OBSERVADO' },
                  ilegible:   { bg: 'rgba(239,68,68,0.15)',   color: '#f87171', label: 'âœ— ILEGIBLE' },
                  vencido:    { bg: 'rgba(239,68,68,0.15)',   color: '#f87171', label: 'âœ— VENCIDO' },
                  rejected:   { bg: 'rgba(239,68,68,0.15)',   color: '#f87171', label: 'âœ— RECHAZADO' },
                };
                const docStyle = docStatusColors[doc.status] || docStatusColors['uploaded'];
                return (
                  <div
                    key={doc.id}
                    style={{
                      background: '#0f172a',
                      border: '1px solid #d8d8e0',
                      borderRadius: '8px',
                      padding: '0.75rem',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <FileText size={15} color="#60a5fa" />
                        <strong style={{ fontSize: '0.82rem', color: '#f8fafc' }}>{doc.document_type?.toUpperCase()}</strong>
                      </div>
                      <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '0.1rem 0.4rem', borderRadius: '999px', background: docStyle.bg, color: docStyle.color }}>
                        {docStyle.label}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {doc.file_name}
                      {doc.file_size ? <span style={{ marginLeft: '0.5rem', color: '#475569' }}>({Math.round(doc.file_size / 1024)} KB)</span> : null}
                    </div>
                    {doc.file_hash && (
                      <div style={{ fontSize: '0.65rem', color: '#38bdf8', fontFamily: 'monospace', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }} title={`SHA-256 â€” Garantiza integridad del archivo. No es verificaciÃ³n jurÃ­dica: ${doc.file_hash}`}>
                        <Hash size={11} />
                        <span>{doc.file_hash.slice(0, 18)}â€¦</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

