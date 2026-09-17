import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { PublicHeader } from './PublicHeader';
import {
  Briefcase,
  MapPin,
  Clock,
  DollarSign,
  Users,
  ShieldCheck,
  ChevronRight,
  Search,
  CheckCircle2,
  Sparkles,
  Shield,
  FileText,
  Camera,
  User,
  Phone,
  Mail,
  MapPin as MapPinIcon,
  Facebook,
  Instagram,
  Linkedin,
} from 'lucide-react';

interface PublicOpening {
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
    sucamec_required?: boolean;
    gun_license_required?: boolean;
    driver_license_required?: boolean;
    experience_years?: number;
    benefits?: string[];
  };
  description?: string;
}

export const PublicJobsPage: React.FC = () => {
  const [openings, setOpenings] = useState<PublicOpening[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [positionFilter, setPositionFilter] = useState('');
  const navigate = useNavigate();

  // CMS Dynamic Content States
  const [heroCms, setHeroCms] = useState({
    eyebrow: 'ÃšNETE A NUESTRO EQUIPO',
    title: 'PROTEGEMOS',
    subtitle: 'LO QUE MÃS IMPORTA',
    description: 'Buscamos personas comprometidas, responsables y con vocaciÃ³n de servicio para formar parte de nuestro equipo.',
    primary_cta_text: 'VER CONVOCATORIAS',
    primary_cta_url: '#convocatorias',
    secondary_cta_text: 'CONOCE MÃS DE NOSOTROS',
    secondary_cta_url: '/postular/nosotros',
  });

  const [howToApplyCms, setHowToApplyCms] = useState({
    title: 'Â¿CÃ“MO PUEDES POSTULAR?',
    description: 'Nuestro proceso de postulaciÃ³n es simple y rÃ¡pido. Sigue estos pasos para aplicar a cualquier vacante.',
    steps: [
      { step_number: '01', title: 'Elige tu vacante', description: 'Explora nuestras convocatorias y selecciona el puesto que mejor se adapte a tu perfil.' },
      { step_number: '02', title: 'Presenta tu informaciÃ³n', description: 'Completa el formulario con tus datos personales y profesionales.' },
      { step_number: '03', title: 'Completa tu perfil', description: 'Agrega tu experiencia, educaciÃ³n y cualquier informaciÃ³n relevante.' },
      { step_number: '04', title: 'Revisa y envÃ­a', description: 'Verifica toda la informaciÃ³n antes de enviar tu postulaciÃ³n.' },
      { step_number: '05', title: 'Recibe tu cÃ³digo', description: 'ObtÃ©n un cÃ³digo de seguimiento para monitorear el estado de tu postulaciÃ³n.' },
    ],
  });

  const [footerCms, setFooterCms] = useState({
    description: 'Security Force P&V S.A.C. â€” Empresa lÃ­der en servicios de seguridad y vigilancia privada armada y desarmada a nivel nacional.',
    copyright: `Â© ${new Date().getFullYear()} Security Force P&V S.A.C. Todos los derechos reservados.`,
  });

  const [contactInfo, setContactInfo] = useState<{
    phone?: string;
    email?: string;
    address?: string;
    whatsapp?: string;
  }>({});

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [openingsRes, heroRes, applyRes, footerRes, contactRes] = await Promise.allSettled([
          api.get<PublicOpening[]>('/public/openings'),
          api.get<any>('/public/content/hero'),
          api.get<any>('/public/content/how_to_apply'),
          api.get<any>('/public/content/footer'),
          api.get<any>('/public/contact-info'),
        ]);

        if (openingsRes.status === 'fulfilled' && openingsRes.value) {
          setOpenings(openingsRes.value || []);
        }

        if (heroRes.status === 'fulfilled' && heroRes.value) {
          const h = heroRes.value;
          const c = h.content_data || {};
          setHeroCms((prev) => ({
            eyebrow: c.eyebrow || prev.eyebrow,
            title: h.title || prev.title,
            subtitle: h.subtitle || prev.subtitle,
            description: h.description || prev.description,
            primary_cta_text: c.primary_cta_text || prev.primary_cta_text,
            primary_cta_url: c.primary_cta_url || prev.primary_cta_url,
            secondary_cta_text: c.secondary_cta_text || prev.secondary_cta_text,
            secondary_cta_url: c.secondary_cta_url || prev.secondary_cta_url,
          }));
        }

        if (applyRes.status === 'fulfilled' && applyRes.value) {
          const a = applyRes.value;
          const c = a.content_data || {};
          setHowToApplyCms((prev) => ({
            title: a.title || prev.title,
            description: a.description || prev.description,
            steps: c.steps && c.steps.length > 0 ? c.steps : prev.steps,
          }));
        }

        if (footerRes.status === 'fulfilled' && footerRes.value) {
          const f = footerRes.value;
          const c = f.content_data || {};
          setFooterCms((prev) => ({
            description: f.description || prev.description,
            copyright: c.copyright || prev.copyright,
          }));
        }

        if (contactRes.status === 'fulfilled' && contactRes.value) {
          setContactInfo(contactRes.value || {});
        }
      } catch (err) {
        console.error('Error al cargar datos del portal:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filteredOpenings = openings.filter((op) => {
    const matchSearch =
      op.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      op.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      op.position_type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchPosition = positionFilter ? op.position_type === positionFilter : true;
    return matchSearch && matchPosition;
  });

  const positionTypes = Array.from(new Set(openings.map((o) => o.position_type)));

  return (
    <div style={{ minHeight: '100vh', background: '#FFFFFF' }}>
      <PublicHeader />

      {/* HERO SECTION (BLACK) */}
      <section
        className="public-hero-section"
        style={{
          background: '#f5f5f7',
          minHeight: '75vh',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          className="public-hero-content"
          style={{
            maxWidth: '1600px',
            margin: '0 auto',
            padding: '3rem 2rem',
            display: 'grid',
            gridTemplateColumns: '45% 55%',
            gap: '3rem',
            alignItems: 'center',
            position: 'relative',
            zIndex: 2,
          }}
        >
          <style>
            {`
              @media (max-width: 1024px) {
                .public-hero-content {
                  grid-template-columns: 50% 50% !important;
                  gap: 2rem !important;
                }
              }
              @media (max-width: 768px) {
                .public-hero-content {
                  grid-template-columns: 1fr !important;
                  gap: 2rem !important;
                  padding: 2rem 1.5rem !important;
                }
                .public-hero-image {
                  minHeight: 400px !important;
                  maxHeight: 500px !important;
                }
              }
            `}
          </style>
          {/* Left Side - Content */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Small red line */}
            <div style={{ width: '80px', height: '4px', background: '#DC2626', borderRadius: '2px' }} />

            {/* Tag */}
            <div style={{ color: '#DC2626', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em' }}>
              {heroCms.eyebrow}
            </div>

            {/* Main Title */}
            <div>
              <h1
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: 'clamp(2.8rem, 5.5vw, 4.5rem)',
                  fontWeight: 900,
                  letterSpacing: '0.03em',
                  textTransform: 'uppercase',
                  lineHeight: 1.1,
                  color: '#FFFFFF',
                  marginBottom: '0.5rem',
                }}
              >
                {heroCms.title}
              </h1>
              <h1
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: 'clamp(2.8rem, 5.5vw, 4.5rem)',
                  fontWeight: 900,
                  letterSpacing: '0.03em',
                  textTransform: 'uppercase',
                  lineHeight: 1.1,
                  color: '#DC2626',
                }}
              >
                {heroCms.subtitle}
              </h1>
            </div>

            {/* Description */}
            <p style={{ fontSize: '1.15rem', color: '#E5E5E5', lineHeight: 1.7, maxWidth: '550px', fontWeight: '400' }}>
              {heroCms.description}
            </p>

            {/* Search Bar */}
            <div className="search-bar" style={{ position: 'relative', maxWidth: '480px' }}>
              <Search
                size={22}
                style={{
                  position: 'absolute',
                  left: '1.2rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#888',
                }}
              />
              <input
                type="text"
                placeholder="Buscar por puesto, ubicaciÃ³n o palabra clave..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '1.1rem 1.2rem 1.1rem 3.2rem',
                  fontSize: '0.95rem',
                  borderRadius: '6px',
                  background: '#e8e8f0',
                  border: '1px solid rgba(220, 38, 38, 0.4)',
                  color: '#FFFFFF',
                  transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#DC2626';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(220, 38, 38, 0.1)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(220, 38, 38, 0.4)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* CTA Buttons */}
            <div className="cta-buttons" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <button
                onClick={() => {
                  if (heroCms.primary_cta_url.startsWith('#')) {
                    const el = document.getElementById(heroCms.primary_cta_url.substring(1));
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  } else {
                    navigate(heroCms.primary_cta_url);
                  }
                }}
                style={{
                  padding: '1rem 2rem',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  borderRadius: '4px',
                  background: '#DC2626',
                  border: '1px solid #DC2626',
                  color: '#FFFFFF',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                {heroCms.primary_cta_text}
                <ChevronRight size={16} />
              </button>

              <button
                onClick={() => {
                  if (heroCms.secondary_cta_url.startsWith('#')) {
                    const el = document.getElementById(heroCms.secondary_cta_url.substring(1));
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  } else {
                    navigate(heroCms.secondary_cta_url);
                  }
                }}
                style={{
                  padding: '1rem 2rem',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  borderRadius: '4px',
                  background: 'transparent',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  color: '#FFFFFF',
                  cursor: 'pointer',
                }}
              >
                {heroCms.secondary_cta_text}
              </button>
            </div>

            {/* Attribute Icons */}
            <div style={{ display: 'flex', gap: '2rem', paddingTop: '1.5rem', borderTop: '1px solid #d8d8e0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldCheck size={20} color="#DC2626" />
                <div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    SEGURIDAD
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#888' }}>ProtecciÃ³n profesional</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Users size={20} color="#DC2626" />
                <div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    CONFIANZA
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#888' }}>Compromiso y tranquilidad</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sparkles size={20} color="#DC2626" />
                <div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    PROFESIONALISMO
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#888' }}>Personal capacitado</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Agent Image/Video - Premium Extended Layout */}
          <div
            className="public-hero-image"
            style={{
              position: 'relative',
              width: '100%',
              height: '100%',
              minHeight: '550px',
              maxHeight: '800px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* Main image/video container - extends to edges */}
            <div
              style={{
                position: 'relative',
                width: '100%',
                height: '100%',
                overflow: 'hidden',
                borderRadius: '8px',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4)',
              }}
            >
              {/* Video support with image fallback */}
              <video
                autoPlay
                muted
                loop
                playsInline
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: 'center right',
                }}
                onError={(e) => {
                  // If video fails to load, hide it and show image
                  const videoElement = e.target as HTMLVideoElement;
                  videoElement.style.display = 'none';
                  const imageElement = videoElement.nextElementSibling as HTMLImageElement;
                  if (imageElement) {
                    imageElement.style.display = 'block';
                  }
                }}
              >
                <source src="/portada.mp4" type="video/mp4" />
              </video>

              {/* Fallback image if video not available */}
              <img
                src="/portada.png"
                alt="Agente de Seguridad - Security Force P&V"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: 'center right',
                  display: 'none', // Hidden by default, shown if video fails
                }}
                onError={(e) => {
                  // Fallback if image also fails
                  console.error('Error loading hero image:', e);
                }}
              />

              {/* Ultimate fallback image - always shown as default */}
              <img
                src="/portada.png"
                alt="Agente de Seguridad - Security Force P&V"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: 'center right',
                  display: 'block',
                  zIndex: 0,
                }}
              />

              {/* Premium overlay gradients for depth and text integration */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(to right, rgba(8, 8, 8, 0.5) 0%, rgba(8, 8, 8, 0.15) 35%, transparent 65%), linear-gradient(to top, rgba(8, 8, 8, 0.3) 0%, transparent 55%)',
                  pointerEvents: 'none',
                }}
              />

              {/* Subtle red accent overlay */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'radial-gradient(circle at 75% 45%, rgba(220, 38, 38, 0.06) 0%, transparent 45%)',
                  pointerEvents: 'none',
                }}
              />

              {/* Corporate red accent line on right edge */}
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '8%',
                  width: '3px',
                  height: '84%',
                  background: 'linear-gradient(to bottom, transparent, #DC2626 15%, #DC2626 85%, transparent)',
                  pointerEvents: 'none',
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* CONVOCATORIAS SECTION (WHITE) */}
      <section id="convocatorias" style={{ background: '#FFFFFF', padding: '4rem 2rem' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          {/* Section Header */}
          <div style={{ marginBottom: '3rem' }}>
            <div style={{ width: '60px', height: '3px', background: '#DC2626', marginBottom: '1rem' }} />
            <h2
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: '2.5rem',
                fontWeight: 900,
                color: '#f5f5f7',
                textTransform: 'uppercase',
                letterSpacing: '0.02em',
                marginBottom: '0.5rem',
              }}
            >
              ENCUENTRA TU OPORTUNIDAD
            </h2>
            <p style={{ fontSize: '1rem', color: '#666', maxWidth: '600px' }}>
              Explora nuestras convocatorias activas y encuentra el puesto ideal para ti.
            </p>
          </div>

          {/* Filters */}
          {positionTypes.length > 0 && (
            <div className="filter-buttons" style={{ marginBottom: '2rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: '#666', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
                Filtrar por:
              </span>
              <button
                onClick={() => setPositionFilter('')}
                style={{
                  padding: '0.5rem 1.25rem',
                  fontSize: '0.85rem',
                  borderRadius: '4px',
                  background: positionFilter === '' ? '#f5f5f7' : '#FFFFFF',
                  border: positionFilter === '' ? '1px solid #f5f5f7' : '1px solid #E5E5E5',
                  color: positionFilter === '' ? '#FFFFFF' : '#f5f5f7',
                  cursor: 'pointer',
                  fontWeight: 600,
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  if (positionFilter !== '') {
                    e.currentTarget.style.borderColor = '#DC2626';
                  }
                }}
                onMouseLeave={(e) => {
                  if (positionFilter !== '') {
                    e.currentTarget.style.borderColor = '#E5E5E5';
                  }
                }}
              >
                Todos ({openings.length})
              </button>
              {positionTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => setPositionFilter(type)}
                  style={{
                    padding: '0.5rem 1.25rem',
                    fontSize: '0.85rem',
                    borderRadius: '4px',
                    background: positionFilter === type ? '#f5f5f7' : '#FFFFFF',
                    border: positionFilter === type ? '1px solid #f5f5f7' : '1px solid #E5E5E5',
                    color: positionFilter === type ? '#FFFFFF' : '#f5f5f7',
                    cursor: 'pointer',
                    fontWeight: 600,
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (positionFilter !== type) {
                      e.currentTarget.style.borderColor = '#DC2626';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (positionFilter !== type) {
                      e.currentTarget.style.borderColor = '#E5E5E5';
                    }
                  }}
                >
                  {type}
                </button>
              ))}
            </div>
          )}

          {/* Job Cards */}
          {loading ? (
            <div style={{ padding: '5rem 0', textAlign: 'center', color: '#888' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  border: '3px solid rgba(220, 38, 38, 0.2)',
                  borderTopColor: '#dc2626',
                  borderRadius: '50%',
                  margin: '0 auto 1rem',
                  animation: 'spin 1s linear infinite',
                }}
              />
              Cargando convocatorias activas...
            </div>
          ) : filteredOpenings.length === 0 ? (
            <div
              style={{
                padding: '4rem 1.5rem',
                textAlign: 'center',
                background: '#F9F9F9',
                border: '1px solid #E5E5E5',
                borderRadius: '8px',
              }}
            >
              <Briefcase size={40} color="#999" style={{ margin: '0 auto 1rem' }} />
              <h3 style={{ fontSize: '1.25rem', color: '#f5f5f7' }}>No se encontraron convocatorias</h3>
              <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.25rem' }}>
                Intenta con otro tÃ©rmino de bÃºsqueda o limpia los filtros.
              </p>
            </div>
          ) : (
            <div className="job-cards-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem' }}>
              {filteredOpenings.map((op) => {
                const reqs = op.requirements || {};
                const remainingVacancies = Math.max(0, op.vacancies_count - op.filled_count);

                return (
                  <div
                    key={op.id}
                    style={{
                      background: '#FFFFFF',
                      border: '1px solid #E5E5E5',
                      borderRadius: '8px',
                      padding: '2rem',
                      display: 'flex',
                      flexDirection: 'column',
                      boxShadow: '0 2px 8px #f5f5f7',
                      transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = '0 4px 16px #e8e8f0';
                      e.currentTarget.style.borderColor = '#DC2626';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = '0 2px 8px #f5f5f7';
                      e.currentTarget.style.borderColor = '#E5E5E5';
                    }}
                  >
                    <div>
                      {/* Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontFamily: "'Barlow Condensed', sans-serif",
                            fontWeight: 800,
                            color: '#DC2626',
                            textTransform: 'uppercase',
                            letterSpacing: '0.08em',
                          }}
                        >
                          {op.position_type}
                        </span>
                        <span
                          style={{
                            background: '#f5f5f7',
                            color: '#FFFFFF',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            padding: '0.25rem 0.75rem',
                            borderRadius: '4px',
                          }}
                        >
                          {remainingVacancies} vacante{remainingVacancies === 1 ? '' : 's'}
                        </span>
                      </div>

                      <h3
                        style={{
                          fontFamily: "'Barlow Condensed', sans-serif",
                          fontSize: '1.5rem',
                          fontWeight: 900,
                          color: '#f5f5f7',
                          lineHeight: 1.2,
                          textTransform: 'uppercase',
                          marginBottom: '1rem',
                        }}
                      >
                        {op.title}
                      </h3>

                      {/* Metadata */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: '0.85rem', color: '#666', marginBottom: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <MapPin size={16} color="#DC2626" />
                          <span>{op.location}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <Clock size={16} color="#DC2626" />
                          <span>{op.shift_type || '12x12'}</span>
                        </div>
                        {op.salary_offered && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#f5f5f7', fontWeight: 700 }}>
                            <DollarSign size={16} />
                            <span>S/. {op.salary_offered.toLocaleString()}</span>
                          </div>
                        )}
                      </div>

                      {/* Requirements */}
                      <div
                        style={{
                          background: '#F9F9F9',
                          border: '1px solid #E5E5E5',
                          borderRadius: '6px',
                          padding: '1rem',
                          marginBottom: '1.5rem',
                          fontSize: '0.8rem',
                          color: '#666',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
                          <CheckCircle2 size={14} color="#DC2626" />
                          <span>SUCAMEC: <strong>{reqs.sucamec_required ? 'Obligatorio Vigente' : 'No indispensable'}</strong></span>
                        </div>
                        {reqs.min_height && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <CheckCircle2 size={14} color="#DC2626" />
                            <span>Estatura mÃ­nima: <strong>{reqs.min_height} cm</strong></span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: 'auto' }}>
                      <button
                        onClick={() => navigate(`/postular/${op.id}`)}
                        style={{
                          flex: 1,
                          padding: '0.75rem',
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          borderRadius: '4px',
                          background: '#FFFFFF',
                          border: '1px solid #E5E5E5',
                          color: '#f5f5f7',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = '#DC2626';
                          e.currentTarget.style.color = '#DC2626';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = '#E5E5E5';
                          e.currentTarget.style.color = '#f5f5f7';
                        }}
                      >
                        Ver Detalle
                      </button>
                      <button
                        onClick={() => navigate(`/postular/${op.id}/flujo`)}
                        style={{
                          flex: 1.5,
                          padding: '0.75rem',
                          fontSize: '0.9rem',
                          fontWeight: 700,
                          borderRadius: '4px',
                          background: '#DC2626',
                          border: '1px solid #DC2626',
                          color: '#FFFFFF',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.4rem',
                          transition: 'background 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#B91C1C';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#DC2626';
                        }}
                      >
                        <span>Postular</span>
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* QUIÃ‰NES SOMOS SECTION (BLACK) */}
      <section id="quienes-somos" style={{ background: '#f5f5f7', padding: '5rem 2rem' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ marginBottom: '3rem' }}>
            <div style={{ width: '60px', height: '3px', background: '#DC2626', marginBottom: '1rem' }} />
            <h2
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: '2.5rem',
                fontWeight: 900,
                color: '#FFFFFF',
                textTransform: 'uppercase',
                letterSpacing: '0.02em',
                marginBottom: '1rem',
              }}
            >
              Â¿QUIÃ‰NES SOMOS?
            </h2>
            <p style={{ fontSize: '1.1rem', color: '#E5E5E5', lineHeight: 1.6, maxWidth: '700px' }}>
              Security Force P&V es una empresa lÃ­der en seguridad privada, especializada en resguardo corporativo, vigilancia y protecciÃ³n integral. Contamos con mÃ¡s de una dÃ©cada de experiencia brindando servicios de excelencia a empresas e instituciones en todo el paÃ­s.
            </p>
          </div>

          {/* Stats */}
          <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', fontWeight: 900, color: '#DC2626', fontFamily: "'Barlow Condensed', sans-serif" }}>
                +10
              </div>
              <div style={{ fontSize: '0.85rem', color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '0.5rem' }}>
                AÃ±os de experiencia
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', fontWeight: 900, color: '#DC2626', fontFamily: "'Barlow Condensed', sans-serif" }}>
                +5000
              </div>
              <div style={{ fontSize: '0.85rem', color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '0.5rem' }}>
                Colaboradores
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', fontWeight: 900, color: '#DC2626', fontFamily: "'Barlow Condensed', sans-serif" }}>
                +300
              </div>
              <div style={{ fontSize: '0.85rem', color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '0.5rem' }}>
                Clientes satisfechos
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', fontWeight: 900, color: '#DC2626', fontFamily: "'Barlow Condensed', sans-serif" }}>
                24/7
              </div>
              <div style={{ fontSize: '0.85rem', color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '0.5rem' }}>
                Servicio operativo
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CÃ“MO POSTULAR SECTION (WHITE) */}
      <section id="como-postular" style={{ background: '#FFFFFF', padding: '5rem 2rem' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ marginBottom: '3rem' }}>
            <div style={{ width: '60px', height: '3px', background: '#DC2626', marginBottom: '1rem' }} />
            <h2
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: '2.5rem',
                fontWeight: 900,
                color: '#f5f5f7',
                textTransform: 'uppercase',
                letterSpacing: '0.02em',
                marginBottom: '1rem',
              }}
            >
              {howToApplyCms.title}
            </h2>
            <p style={{ fontSize: '1.1rem', color: '#666', lineHeight: 1.6, maxWidth: '700px' }}>
              {howToApplyCms.description}
            </p>
          </div>

          {/* Process Steps */}
          <div className="process-steps" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem', marginBottom: '4rem' }}>
            {howToApplyCms.steps.map((item: any, index: number) => (
              <div key={index} style={{ position: 'relative' }}>
                <div
                  style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '50%',
                    background: '#DC2626',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.2rem',
                    fontWeight: 900,
                    marginBottom: '1rem',
                  }}
                >
                  {item.step_number || item.step || `0${index + 1}`}
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f5f5f7', marginBottom: '0.5rem' }}>
                  {item.title}
                </h3>
                <p style={{ fontSize: '0.9rem', color: '#666', lineHeight: 1.5 }}>
                  {item.description || item.desc}
                </p>
              </div>
            ))}
          </div>

          {/* CV Options */}
          <div
            style={{
              background: '#F9F9F9',
              border: '1px solid #E5E5E5',
              borderRadius: '8px',
              padding: '2.5rem',
              textAlign: 'center',
            }}
          >
            <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f5f5f7', marginBottom: '0.5rem' }}>
              Â¿NO TIENES UN CV?
            </h3>
            <p style={{ fontSize: '1rem', color: '#666', marginBottom: '2rem' }}>
              NO TE PREOCUPES. Puedes presentar tu informaciÃ³n de diferentes maneras:
            </p>
            <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem', color: '#f5f5f7' }}>
                <FileText size={20} color="#DC2626" />
                <span>Tengo mi CV</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem', color: '#f5f5f7' }}>
                <FileText size={20} color="#DC2626" />
                <span>Crear mi CV</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem', color: '#f5f5f7' }}>
                <Camera size={20} color="#DC2626" />
                <span>Tengo fotos de mis documentos</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem', color: '#f5f5f7' }}>
                <User size={20} color="#DC2626" />
                <span>Ya tengo un perfil</span>
              </div>
            </div>
            <p style={{ fontSize: '0.9rem', color: '#666', fontStyle: 'italic', marginBottom: '1.5rem' }}>
              "Te ayudamos a organizar tu informaciÃ³n para que puedas completar tu postulaciÃ³n."
            </p>
            <button
              onClick={() => {
                const element = document.getElementById('convocatorias');
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              style={{
                padding: '1rem 2.5rem',
                fontSize: '1rem',
                fontWeight: 700,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                borderRadius: '4px',
                background: '#DC2626',
                border: '1px solid #DC2626',
                color: '#FFFFFF',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'background 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#B91C1C';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#DC2626';
              }}
            >
              COMENZAR A POSTULAR
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </section>

      {/* CONSULTAR POSTULACIÃ“N SECTION (RED) */}
      <section style={{ background: '#DC2626', padding: '4rem 2rem' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', textAlign: 'center' }}>
          <h2
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: '2.5rem',
              fontWeight: 900,
              color: '#FFFFFF',
              textTransform: 'uppercase',
              letterSpacing: '0.02em',
              marginBottom: '1rem',
            }}
          >
            Â¿YA POSTULASTE?
          </h2>
          <p style={{ fontSize: '1.2rem', color: '#FFFFFF', marginBottom: '2rem', maxWidth: '600px', margin: '0 auto 2rem' }}>
            Consulta el estado de tu postulaciÃ³n con tu cÃ³digo de seguimiento.
          </p>
          <button
            onClick={() => navigate('/postular/consultar')}
            style={{
              padding: '1rem 2.5rem',
              fontSize: '1rem',
              fontWeight: 700,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              borderRadius: '4px',
              background: '#FFFFFF',
              border: '1px solid #FFFFFF',
              color: '#DC2626',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'background 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#F5F5F5';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#FFFFFF';
            }}
          >
            CONSULTAR ESTADO
            <ChevronRight size={18} />
          </button>
        </div>
      </section>

      {/* FOOTER (BLACK) */}
      <footer id="contacto" style={{ background: '#f5f5f7', padding: '4rem 2rem 2rem' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div className="footer-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '3rem', marginBottom: '3rem' }}>
            {/* Brand */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: '#FFFFFF',
                    border: '2px solid #DC2626',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                  }}
                >
                  <img
                    src="/logo.png"
                    alt="Security Force P&V Logo"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      padding: '3px',
                    }}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const fallback = target.nextElementSibling as HTMLDivElement;
                      if (fallback) {
                        fallback.style.display = 'flex';
                      }
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      background: '#DC2626',
                      display: 'none',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Shield size={24} color="#FFFFFF" />
                  </div>
                </div>
                <div>
                  <div
                    style={{
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontSize: '1.2rem',
                      fontWeight: 900,
                      color: '#FFFFFF',
                      letterSpacing: '0.02em',
                      textTransform: 'uppercase',
                    }}
                  >
                    SECURITY FORCE <span style={{ color: '#DC2626' }}>P&V</span>
                  </div>
                </div>
              </div>
              <p style={{ fontSize: '0.9rem', color: '#888', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                Protegemos lo que mÃ¡s importa. Empresa especializada en resguardo, vigilancia privada y seguridad integral.
              </p>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <a
                  href="https://facebook.com/securityforce"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ cursor: 'pointer' }}
                >
                  <Facebook size={20} color="#888" />
                </a>
                <a
                  href="https://instagram.com/securityforce"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ cursor: 'pointer' }}
                >
                  <Instagram size={20} color="#888" />
                </a>
                <a
                  href="https://linkedin.com/company/securityforce"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ cursor: 'pointer' }}
                >
                  <Linkedin size={20} color="#888" />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#FFFFFF', marginBottom: '1.5rem', textTransform: 'uppercase' }}>
                Enlaces RÃ¡pidos
              </h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                <li style={{ marginBottom: '0.75rem' }}>
                  <a
                    href="/postular"
                    onClick={(e) => {
                      e.preventDefault();
                      navigate('/postular');
                    }}
                    style={{ color: '#888', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 0.2s ease', cursor: 'pointer' }}
                  >
                    Inicio
                  </a>
                </li>
                <li style={{ marginBottom: '0.75rem' }}>
                  <a
                    href="/postular/nosotros"
                    onClick={(e) => {
                      e.preventDefault();
                      navigate('/postular/nosotros');
                    }}
                    style={{ color: '#888', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 0.2s ease', cursor: 'pointer' }}
                  >
                    QuiÃ©nes Somos
                  </a>
                </li>
                <li style={{ marginBottom: '0.75rem' }}>
                  <a
                    href="/postular#convocatorias"
                    onClick={(e) => {
                      e.preventDefault();
                      navigate('/postular');
                      setTimeout(() => {
                        const element = document.getElementById('convocatorias');
                        if (element) {
                          element.scrollIntoView({ behavior: 'smooth' });
                        }
                      }, 100);
                    }}
                    style={{ color: '#888', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 0.2s ease', cursor: 'pointer' }}
                  >
                    Convocatorias
                  </a>
                </li>
                <li style={{ marginBottom: '0.75rem' }}>
                  <a
                    href="/postular#como-postular"
                    onClick={(e) => {
                      e.preventDefault();
                      navigate('/postular');
                      setTimeout(() => {
                        const element = document.getElementById('como-postular');
                        if (element) {
                          element.scrollIntoView({ behavior: 'smooth' });
                        }
                      }, 100);
                    }}
                    style={{ color: '#888', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 0.2s ease', cursor: 'pointer' }}
                  >
                    CÃ³mo Postular
                  </a>
                </li>
              </ul>
            </div>

            {/* Information */}
            <div>
              <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#FFFFFF', marginBottom: '1.5rem', textTransform: 'uppercase' }}>
                InformaciÃ³n
              </h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                <li style={{ marginBottom: '0.75rem' }}>
                  <a
                    href="/postular/contacto"
                    onClick={(e) => {
                      e.preventDefault();
                      navigate('/postular/contacto');
                    }}
                    style={{ color: '#888', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 0.2s ease', cursor: 'pointer' }}
                  >
                    Contacto
                  </a>
                </li>
                <li style={{ marginBottom: '0.75rem' }}>
                  <a
                    href="/postular/beneficios"
                    onClick={(e) => {
                      e.preventDefault();
                      navigate('/postular/beneficios');
                    }}
                    style={{ color: '#888', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 0.2s ease', cursor: 'pointer' }}
                  >
                    Beneficios
                  </a>
                </li>
                <li style={{ marginBottom: '0.75rem' }}>
                  <a
                    href="/postular/consultar"
                    onClick={(e) => {
                      e.preventDefault();
                      navigate('/postular/consultar');
                    }}
                    style={{ color: '#888', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 0.2s ease', cursor: 'pointer' }}
                  >
                    Consultar PostulaciÃ³n
                  </a>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#FFFFFF', marginBottom: '1.5rem', textTransform: 'uppercase' }}>
                Contacto
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#888', fontSize: '0.9rem', cursor: 'pointer' }}
                  onClick={() => window.open('tel:+5112345678')}
                >
                  <Phone size={16} color="#DC2626" />
                  <span>+51 1 234 5678</span>
                </div>
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#888', fontSize: '0.9rem', cursor: 'pointer' }}
                  onClick={() => window.open('mailto:info@securityforce.pe')}
                >
                  <Mail size={16} color="#DC2626" />
                  <span>info@securityforce.pe</span>
                </div>
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#888', fontSize: '0.9rem', cursor: 'pointer' }}
                  onClick={() => navigate('/postular/contacto')}
                >
                  <MapPinIcon size={16} color="#DC2626" />
                  <span>Ver informaciÃ³n de contacto</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#888', fontSize: '0.9rem' }}>
                  <MapPinIcon size={16} color="#DC2626" />
                  <span>Lima, PerÃº</span>
                  <span>{contactInfo.address}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div style={{ borderTop: '1px solid #d8d8e0', paddingTop: '2rem', textAlign: 'center' }}>
            <p style={{ fontSize: '0.85rem', color: '#666' }}>
              {footerCms.copyright}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

