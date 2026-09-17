import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { PublicHeader } from './PublicHeader';
import {
  MapPin,
  Clock,
  DollarSign,
  Briefcase,
  CheckCircle2,
  FileText,
  Gift,
  ArrowRight,
  Shield,
  AlertTriangle,
} from 'lucide-react';

interface PublicOpeningDetail {
  id: string;
  title: string;
  position_type: string;
  location: string;
  client_name?: string;
  vacancies_count: number;
  filled_count: number;
  salary_offered?: number;
  shift_type?: string;
  status: string;
  requirements?: {
    min_height?: number;
    min_age?: number;
    max_age?: number;
    sucamec_required?: boolean;
    gun_license_required?: boolean;
    driver_license_required?: boolean;
    driver_license_type?: string;
    experience_years?: number;
    required_documents?: { type: string; label: string; required: boolean }[];
    benefits?: string[];
  };
  description?: string;
}

export const JobDetailPage: React.FC = () => {
  const { openingId } = useParams<{ openingId: string }>();
  const [opening, setOpening] = useState<PublicOpeningDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadDetail() {
      if (!openingId) return;
      try {
        setLoading(true);
        const data = await api.get<PublicOpeningDetail>(`/public/openings/${openingId}`);
        setOpening(data);
      } catch (err) {
        console.error('Error al cargar detalle:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDetail();
  }, [openingId]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f5f5f7', color: '#fff' }}>
        <PublicHeader showBackToJobs />
        <div style={{ padding: '5rem 0', textAlign: 'center', color: '#888' }}>
          Cargando detalles de la vacante...
        </div>
      </div>
    );
  }

  if (!opening) {
    return (
      <div style={{ minHeight: '100vh', background: '#f5f5f7', color: '#fff' }}>
        <PublicHeader showBackToJobs />
        <div style={{ padding: '4rem 1.5rem', textAlign: 'center' }}>
          <AlertTriangle size={40} color="#f87171" style={{ margin: '0 auto 1rem' }} />
          <h2>Convocatoria no encontrada</h2>
          <p style={{ color: '#888', marginTop: '0.5rem' }}>Esta vacante ya no se encuentra activa o el enlace es incorrecto.</p>
          <button className="btn-primary" onClick={() => navigate('/postular')} style={{ marginTop: '1.5rem' }}>
            Ver Convocatorias Disponibles
          </button>
        </div>
      </div>
    );
  }

  const reqs = opening.requirements || {};
  const remaining = Math.max(0, opening.vacancies_count - opening.filled_count);

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f7', color: '#ffffff' }}>
      <PublicHeader showBackToJobs />

      {/* Main Content */}
      <main style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem 1.5rem 5rem' }}>
        {/* Header Card */}
        <div
          style={{
            background: `
              radial-gradient(circle at 10% 20%, rgba(220, 38, 38, 0.15) 0%, transparent 60%),
              #f5f5f7
            `,
            border: '1px solid rgba(220, 38, 38, 0.3)',
            borderRadius: '20px',
            padding: '2.5rem 2rem',
            marginBottom: '2rem',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontWeight: 800,
                  color: '#dc2626',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              >
                {opening.position_type} â€¢ Security Force P&V
              </span>
              <h1
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: 'clamp(1.8rem, 4vw, 2.5rem)',
                  fontWeight: 900,
                  color: '#ffffff',
                  textTransform: 'uppercase',
                  lineHeight: 1.1,
                  marginTop: '0.3rem',
                }}
              >
                {opening.title}
              </h1>
            </div>

            <span
              style={{
                background: 'rgba(16, 185, 129, 0.12)',
                color: '#34d399',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                fontSize: '0.78rem',
                fontWeight: 700,
                padding: '0.35rem 0.85rem',
                borderRadius: '9999px',
              }}
            >
              ðŸŸ¢ {remaining} Vacante{remaining === 1 ? '' : 's'} Disponibles
            </span>
          </div>

          {/* Quick Metrics */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', fontSize: '0.9rem', color: '#ccc', margin: '1.5rem 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <MapPin size={16} color="#dc2626" />
              <span>Sede: <strong>{opening.location}</strong></span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Clock size={16} color="#dc2626" />
              <span>Jornada: <strong>{opening.shift_type || '12x12'}</strong></span>
            </div>
            {opening.salary_offered && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#34d399', fontWeight: 800 }}>
                <DollarSign size={16} />
                <span>S/. {opening.salary_offered.toLocaleString()} netos</span>
              </div>
            )}
          </div>

          {/* CTA Button */}
          <button
            onClick={() => navigate(`/postular/${opening.id}/flujo`)}
            className="btn-primary"
            style={{
              width: '100%',
              padding: '1rem',
              fontSize: '1.15rem',
              letterSpacing: '0.08em',
              gap: '0.6rem',
              marginTop: '0.5rem',
            }}
          >
            <span>POSTULAR AHORA A ESTA VACANTE</span>
            <ArrowRight size={20} />
          </button>
        </div>

        {/* DescripciÃ³n del Puesto */}
        {opening.description && (
          <div style={{ background: '#0e0e0e', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', padding: '1.75rem', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.2rem', color: '#ffffff', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Briefcase size={18} color="#dc2626" />
              <span>DescripciÃ³n y Funciones del Puesto</span>
            </h3>
            <p style={{ fontSize: '0.925rem', color: '#ccc', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
              {opening.description}
            </p>
          </div>
        )}

        {/* Requisitos Indispensables */}
        <div style={{ background: '#0e0e0e', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', padding: '1.75rem', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.2rem', color: '#ffffff', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Shield size={18} color="#dc2626" />
            <span>Requisitos para Postular</span>
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.85rem' }}>
            <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '0.85rem 1rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <CheckCircle2 size={16} color="#dc2626" />
              <span style={{ fontSize: '0.875rem' }}>
                SUCAMEC: <strong>{reqs.sucamec_required ? 'CarnÃ© Vigente Obligatorio' : 'No indispensable'}</strong>
              </span>
            </div>

            {reqs.min_height && (
              <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '0.85rem 1rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <CheckCircle2 size={16} color="#dc2626" />
                <span style={{ fontSize: '0.875rem' }}>
                  Estatura MÃ­nima: <strong>{reqs.min_height} cm</strong>
                </span>
              </div>
            )}

            <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '0.85rem 1rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <CheckCircle2 size={16} color="#dc2626" />
              <span style={{ fontSize: '0.875rem' }}>
                Experiencia MÃ­nima: <strong>{reqs.experience_years ? `${reqs.experience_years} aÃ±o(s)` : 'Sin experiencia previa requerida'}</strong>
              </span>
            </div>

            {reqs.gun_license_required && (
              <div style={{ background: 'rgba(251, 191, 36, 0.08)', border: '1px solid rgba(251, 191, 36, 0.2)', padding: '0.85rem 1rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <CheckCircle2 size={16} color="#fbbf24" />
                <span style={{ fontSize: '0.875rem', color: '#fbbf24' }}>
                  <strong>Porte de Armas L1/L2 Requerido</strong>
                </span>
              </div>
            )}

            {reqs.driver_license_required && (
              <div style={{ background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.2)', padding: '0.85rem 1rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <CheckCircle2 size={16} color="#38bdf8" />
                <span style={{ fontSize: '0.875rem', color: '#38bdf8' }}>
                  <strong>Brevete {reqs.driver_license_type || 'A2B'} Requerido</strong>
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Documentos DinÃ¡micos Solicitados */}
        {reqs.required_documents && reqs.required_documents.length > 0 && (
          <div style={{ background: '#0e0e0e', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', padding: '1.75rem', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.2rem', color: '#ffffff', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileText size={18} color="#dc2626" />
              <span>Documentos que SolicitarÃ¡ la Convocatoria</span>
            </h3>
            <p style={{ fontSize: '0.825rem', color: '#888', marginBottom: '1rem' }}>
              PodrÃ¡s subirlos en formato PDF, foto desde tu celular o crearlos directamente en la plataforma:
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {reqs.required_documents.map((doc, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.875rem', color: '#ccc' }}>
                  <span style={{ color: '#dc2626', fontWeight: 800 }}>â€¢</span>
                  <span>{doc.label}</span>
                  {doc.required ? (
                    <span style={{ fontSize: '0.68rem', color: '#f87171', background: 'rgba(220, 38, 38, 0.1)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>Obligatorio</span>
                  ) : (
                    <span style={{ fontSize: '0.68rem', color: '#888' }}>Opcional</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Beneficios */}
        {reqs.benefits && reqs.benefits.length > 0 && (
          <div style={{ background: '#0e0e0e', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', padding: '1.75rem', marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.2rem', color: '#ffffff', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Gift size={18} color="#dc2626" />
              <span>Beneficios y Condiciones Laborales</span>
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {reqs.benefits.map((b, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', fontSize: '0.875rem', color: '#ccc' }}>
                  <CheckCircle2 size={16} color="#34d399" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span>{b}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bottom CTA */}
        <div style={{ textAlign: 'center', padding: '1rem 0' }}>
          <button
            onClick={() => navigate(`/postular/${opening.id}/flujo`)}
            className="btn-primary"
            style={{
              padding: '1.1rem 2.5rem',
              fontSize: '1.2rem',
              letterSpacing: '0.08em',
              gap: '0.6rem',
            }}
          >
            <span>POSTULAR AHORA A ESTA VACANTE</span>
            <ArrowRight size={22} />
          </button>
        </div>
      </main>
    </div>
  );
};

