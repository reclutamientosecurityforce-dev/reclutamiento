import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { api } from '../../api/client';
import { PublicHeader } from './PublicHeader';
import {
  Shield,
  MapPin,
  Clock,
  DollarSign,
  Users,
  CheckCircle2,
  Gift,
  FileText,
  ArrowRight,
  AlertTriangle,
  Award,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';

interface PublicPublicationDetail {
  publication: {
    publication_id: string;
    slug: string;
    publication_title: string;
    publication_description?: string;
    banner_url?: string;
    benefits: string[];
    status: string;
    published_at?: string;
    closes_at?: string;
    og_title?: string;
    og_description?: string;
    og_image_url?: string;
    opening_id: string;
    opening_title: string;
    position_type: string;
    location: string;
    client_name?: string;
    vacancies_count: number;
    filled_count: number;
    salary_offered?: number;
    shift_type?: string;
    opening_description?: string;
    category_id?: string;
    category_name?: string;
    category_color?: string;
    company_name: string;
    company_phone?: string;
    company_email?: string;
  };
  requirements: Array<{
    id: string;
    code: string;
    title: string;
    description?: string;
    requirement_type: string;
    rule_type: string;
    required_document_type?: string;
  }>;
  isAvailable: boolean;
  statusMessage: string;
  otherOpenings: Array<{
    slug: string;
    title: string;
    location: string;
    position_type: string;
    shift_type?: string;
  }>;
}

export const PublicationPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [data, setData] = useState<PublicPublicationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadPublication() {
      if (!slug) return;
      try {
        setLoading(true);
        setErrorMsg(null);

        const res = await api.get<PublicPublicationDetail>(`/public/p/${slug}`);
        setData(res);

        // Actualizar título y Meta Tags de Open Graph dinámicamente
        if (res?.publication) {
          const pub = res.publication;
          document.title = `${pub.og_title || pub.publication_title} | Security Force P&V`;

          // Registrar visualización de manera transparente con UTMs
          const utmSource = searchParams.get('utm_source') || searchParams.get('source') || undefined;
          const utmMedium = searchParams.get('utm_medium') || searchParams.get('medium') || undefined;
          const utmCampaign = searchParams.get('utm_campaign') || searchParams.get('campaign') || undefined;
          const channelId = searchParams.get('channel_id') || searchParams.get('c') || undefined;

          api
            .post(`/public/p/${slug}/view`, {
              utmSource,
              utmMedium,
              utmCampaign,
              channelId,
            })
            .catch(() => {});
        }
      } catch (err: any) {
        console.error('Error al cargar publicación:', err);
        setErrorMsg(err.message || 'La publicación solicitada no existe o no está disponible.');
      } finally {
        setLoading(false);
      }
    }

    loadPublication();
  }, [slug, searchParams]);

  function handleStartApply() {
    if (!data?.publication) return;
    const pub = data.publication;

    // Preservar UTMs en la redirección al asistente
    const qParams = new URLSearchParams(searchParams);
    qParams.set('publicationSlug', pub.slug);

    navigate(`/postular/${pub.opening_id}/flujo?${qParams.toString()}`);
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#090d16', color: '#f8fafc' }}>
        <PublicHeader />
        <div style={{ textAlign: 'center', padding: '6rem 1rem', color: '#94a3b8' }}>
          <Shield size={36} color="#dc2626" style={{ margin: '0 auto 1rem', display: 'block' }} className="animate-pulse" />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffffff' }}>Cargando convocatoria oficial...</h2>
        </div>
      </div>
    );
  }

  if (errorMsg || !data) {
    return (
      <div style={{ minHeight: '100vh', background: '#090d16', color: '#f8fafc' }}>
        <PublicHeader />
        <div style={{ maxWidth: '600px', margin: '4rem auto', padding: '2rem', background: '#111827', borderRadius: '16px', border: '1px solid #1f2937', textAlign: 'center' }}>
          <AlertTriangle size={48} color="#f87171" style={{ margin: '0 auto 1rem', display: 'block' }} />
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.75rem' }}>
            Convocatoria no encontrada
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            {errorMsg || 'El enlace puede haber caducado o la publicación ya no está disponible.'}
          </p>
          <button
            onClick={() => navigate('/postular')}
            style={{ padding: '0.75rem 1.5rem', background: '#dc2626', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
          >
            Ver todas las vacantes abiertas
          </button>
        </div>
      </div>
    );
  }

  const pub = data.publication;
  const isAvailable = data.isAvailable;

  return (
    <div style={{ minHeight: '100vh', background: '#090d16', color: '#f8fafc', paddingBottom: '4rem' }}>
      <PublicHeader />

      <div style={{ maxWidth: '1080px', margin: '0 auto', padding: '1.5rem 1rem' }}>
        {/* Banner / Portada */}
        {pub.banner_url && (
          <div style={{ width: '100%', height: '260px', borderRadius: '16px', overflow: 'hidden', marginBottom: '1.5rem', border: '1px solid #1f2937' }}>
            <img src={pub.banner_url} alt={pub.publication_title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        )}

        {/* Hero Card */}
        <div
          style={{
            background: 'linear-gradient(180deg, #111827 0%, #0c121e 100%)',
            border: '1px solid #1f2937',
            borderRadius: '20px',
            padding: '2rem',
            marginBottom: '1.75rem',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, #dc2626, #f97316, #ef4444)' }} />

          {/* Badges bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              {pub.category_name && (
                <span
                  style={{
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    padding: '0.3rem 0.75rem',
                    borderRadius: '999px',
                    background: `${pub.category_color || '#2563eb'}22`,
                    color: pub.category_color || '#60a5fa',
                    border: `1px solid ${pub.category_color || '#2563eb'}55`,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  {pub.category_name}
                </span>
              )}
              <span
                style={{
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  padding: '0.3rem 0.75rem',
                  borderRadius: '999px',
                  background: isAvailable ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                  color: isAvailable ? '#4ade80' : '#f87171',
                  border: `1px solid ${isAvailable ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
                }}
              >
                {data.statusMessage}
              </span>
            </div>

            <span style={{ fontSize: '0.75rem', color: '#64748b', fontFamily: 'monospace' }}>
              Cód. Ref: {pub.slug}
            </span>
          </div>

          {/* Title */}
          <h1 style={{ fontSize: '2rem', fontWeight: 900, color: '#ffffff', lineHeight: 1.25, margin: '0 0 1rem 0', letterSpacing: '-0.02em' }}>
            {pub.publication_title}
          </h1>

          {/* Main Attributes Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', background: '#0f172a', border: '1px solid #1f2937', borderRadius: '12px', padding: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ padding: '0.5rem', borderRadius: '8px', background: 'rgba(220,38,38,0.15)', color: '#f87171' }}>
                <MapPin size={18} />
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', display: 'block', fontWeight: 700 }}>Ubicación</span>
                <strong style={{ fontSize: '0.9rem', color: '#f8fafc' }}>{pub.location}</strong>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ padding: '0.5rem', borderRadius: '8px', background: 'rgba(59,130,246,0.15)', color: '#60a5fa' }}>
                <Clock size={18} />
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', display: 'block', fontWeight: 700 }}>Régimen / Turno</span>
                <strong style={{ fontSize: '0.9rem', color: '#f8fafc' }}>{pub.shift_type || '12x12 Rotativo'}</strong>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ padding: '0.5rem', borderRadius: '8px', background: 'rgba(16,185,129,0.15)', color: '#34d399' }}>
                <DollarSign size={18} />
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', display: 'block', fontWeight: 700 }}>Remuneración</span>
                <strong style={{ fontSize: '0.9rem', color: '#f8fafc' }}>
                  {pub.salary_offered ? `S/ ${pub.salary_offered.toFixed(2)}` : 'Planilla Completa'}
                </strong>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ padding: '0.5rem', borderRadius: '8px', background: 'rgba(234,179,8,0.15)', color: '#facc15' }}>
                <Users size={18} />
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', display: 'block', fontWeight: 700 }}>Vacantes Disponibles</span>
                <strong style={{ fontSize: '0.9rem', color: '#f8fafc' }}>{pub.vacancies_count} vacantes</strong>
              </div>
            </div>
          </div>

          {/* Description */}
          {pub.publication_description && (
            <div style={{ fontSize: '0.95rem', color: '#cbd5e1', lineHeight: 1.65, marginBottom: '1.75rem' }}>
              {pub.publication_description}
            </div>
          )}

          {/* CTA Button */}
          {isAvailable ? (
            <button
              onClick={handleStartApply}
              style={{
                width: '100%',
                padding: '1.1rem 2rem',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: '#ffffff',
                fontSize: '1.15rem',
                fontWeight: 900,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.75rem',
                boxShadow: '0 10px 25px rgba(220,38,38,0.4)',
                transition: 'transform 0.15s ease',
              }}
            >
              <span>POSTULAR AHORA A ESTA VACANTE</span>
              <ArrowRight size={22} />
            </button>
          ) : (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', padding: '1rem', textAlign: 'center', color: '#f87171', fontWeight: 700 }}>
              Esta convocatoria ha cerrado sus postulaciones. Te invitamos a revisar nuestras otras convocatorias activas abajo.
            </div>
          )}
        </div>

        {/* 2-Columns Body: Beneficios y Requisitos Oficiales */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          {/* Beneficios */}
          <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '16px', padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
              <div style={{ padding: '0.4rem', borderRadius: '6px', background: 'rgba(234,179,8,0.15)', color: '#facc15' }}>
                <Gift size={18} />
              </div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: '#ffffff' }}>
                Beneficios de Security Force P&V
              </h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {(Array.isArray(pub.benefits) && pub.benefits.length > 0
                ? pub.benefits
                : [
                    'Ingreso inmediato a planilla con todos los beneficios de ley',
                    'Pagos puntuales quincena y fin de mes',
                    'Seguro Vida Ley y cobertura de EsSalud',
                    'Uniformes y equipamiento completo sin costo',
                  ]
              ).map((ben, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem', fontSize: '0.88rem', color: '#cbd5e1' }}>
                  <CheckCircle2 size={16} color="#22c55e" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span>{ben}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Requisitos Oficiales */}
          <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '16px', padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
              <div style={{ padding: '0.4rem', borderRadius: '6px', background: 'rgba(59,130,246,0.15)', color: '#60a5fa' }}>
                <FileText size={18} />
              </div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: '#ffffff' }}>
                Requisitos y Perfil Evaluado
              </h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {data.requirements && data.requirements.length > 0 ? (
                data.requirements.map((req) => (
                  <div
                    key={req.id}
                    style={{
                      padding: '0.75rem',
                      background: '#0f172a',
                      borderRadius: '8px',
                      border: '1px solid #1f2937',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                      <strong style={{ fontSize: '0.88rem', color: '#f8fafc' }}>{req.title}</strong>
                      {req.requirement_type === 'eliminatory' && (
                        <span style={{ fontSize: '0.65rem', padding: '0.15rem 0.4rem', borderRadius: '4px', background: 'rgba(220,38,38,0.15)', color: '#f87171', fontWeight: 700 }}>
                          Obligatorio
                        </span>
                      )}
                    </div>
                    {req.description && (
                      <p style={{ fontSize: '0.78rem', color: '#94a3b8', margin: 0 }}>{req.description}</p>
                    )}
                  </div>
                ))
              ) : (
                <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                  • Secundaria completa acreditada
                  <br />
                  • DNI vigente y sin antecedentes policiales
                  <br />
                  • Deseable experiencia previa en seguridad o servicio militar
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sugerencias de otras convocatorias si esta cerró */}
        {!isAvailable && data.otherOpenings && data.otherOpenings.length > 0 && (
          <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '16px', padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#ffffff', marginBottom: '1rem' }}>
              Otras convocatorias abiertas que te pueden interesar:
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
              {data.otherOpenings.map((other, idx) => (
                <Link
                  key={idx}
                  to={`/postular/p/${other.slug}`}
                  style={{
                    display: 'block',
                    padding: '1rem',
                    background: '#0f172a',
                    border: '1px solid #1f2937',
                    borderRadius: '10px',
                    textDecoration: 'none',
                    color: 'inherit',
                  }}
                >
                  <strong style={{ fontSize: '0.9rem', color: '#38bdf8', display: 'block', marginBottom: '0.35rem' }}>
                    {other.title}
                  </strong>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                    📍 {other.location} | 🕒 {other.shift_type || '12x12'}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
