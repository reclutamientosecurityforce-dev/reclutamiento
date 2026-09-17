import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { PublicHeader } from './PublicHeader';
import { ShieldCheck, Calendar, Heart, Award, Briefcase, Users, ChevronRight, Check } from 'lucide-react';

export const BenefitsPage: React.FC = () => {
  const navigate = useNavigate();

  const [cmsData, setCmsData] = useState({
    title: 'BENEFICIOS PARA NUESTROS COLABORADORES',
    subtitle: 'CONDICIONES LABORALES DE EXCELENCIA',
    description: 'En Security Force P&V valoramos a nuestro equipo y ofrecemos un paquete de beneficios competitivos para garantizar tu bienestar y desarrollo profesional.',
    items: [
      { id: '1', title: 'Seguridad Social', description: 'Afiliación completa al sistema de seguridad social y beneficios de ley desde el primer día.', icon: 'ShieldCheck', order: 1, is_active: true },
      { id: '2', title: 'Vacaciones Pagadas', description: '30 días de vacaciones anuales remuneradas conforme a ley.', icon: 'Calendar', order: 2, is_active: true },
      { id: '3', title: 'Seguro de Salud', description: 'Plan de salud integral para ti y tus derechohabientes.', icon: 'Heart', order: 3, is_active: true },
      { id: '4', title: 'Capacitación Continua', description: 'Programas de formación, reentrenamiento y desarrollo profesional constante.', icon: 'Award', order: 4, is_active: true },
      { id: '5', title: 'Uniforme y Equipo', description: 'Dotación completa de uniforme reglamentario y equipo de protección provisto por la empresa.', icon: 'Briefcase', order: 5, is_active: true },
      { id: '6', title: 'Ambiente de Trabajo', description: 'Cultura organizacional basada en el respeto, reconocimiento y trabajo en equipo.', icon: 'Users', order: 6, is_active: true },
      { id: '7', title: 'Bonos por Desempeño', description: 'Reconocimiento y bonificaciones por puntualidad y excelencia operativa.', icon: 'Sparkles', order: 7, is_active: true },
    ],
    professional_development: [
      'Capacitación técnica continua y cursos SUCAMEC',
      'Programas de liderazgo y formación de supervisores',
      'Certificaciones y acreditaciones oficiales',
      'Oportunidades de línea de carrera y crecimiento interno',
      'Mentoría operativa personalizada',
    ],
    wellness: [
      'Plan de salud y cobertura familiar',
      'Seguro de vida ley desde el primer día',
      'Programa de bienestar y salud ocupacional',
      'Actividades de integración y reconocimientos',
      'Apoyo y asesoría social',
    ],
  });

  useEffect(() => {
    async function loadCmsContent() {
      try {
        const res = await api.get<any>('/public/content/benefits');
        if (res) {
          const c = res.content_data || {};
          setCmsData((prev) => ({
            title: res.title || prev.title,
            subtitle: res.subtitle || prev.subtitle,
            description: res.description || prev.description,
            items: c.items && c.items.length > 0 ? c.items : prev.items,
            professional_development: c.professional_development && c.professional_development.length > 0 ? c.professional_development : prev.professional_development,
            wellness: c.wellness && c.wellness.length > 0 ? c.wellness : prev.wellness,
          }));
        }
      } catch (err) {
        console.warn('Usando fallback para sección Benefits:', err);
      }
    }
    loadCmsContent();
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#FFFFFF' }}>
      <PublicHeader />

      {/* HERO SECTION */}
      <section style={{ background: '#080808', padding: '4rem 2rem' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ width: '60px', height: '3px', background: '#DC2626', marginBottom: '1rem', margin: '0 auto' }} />
          <h1
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: '3rem',
              fontWeight: 900,
              color: '#FFFFFF',
              textTransform: 'uppercase',
              letterSpacing: '0.02em',
              marginBottom: '1rem',
            }}
          >
            BENEFICIOS
          </h1>
          <p style={{ fontSize: '1.2rem', color: '#E5E5E5', lineHeight: 1.6, maxWidth: '700px', margin: '0 auto 2rem' }}>
            {cmsData.description}
          </p>
          <button
            onClick={() => navigate('/postular')}
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
            }}
          >
            VER CONVOCATORIAS
            <ChevronRight size={18} />
          </button>
        </div>
      </section>

      {/* BENEFITS GRID */}
      <section style={{ background: '#FFFFFF', padding: '5rem 2rem' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ marginBottom: '3rem' }}>
            <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '2rem', fontWeight: 900, color: '#080808', textTransform: 'uppercase', marginBottom: '1rem' }}>
              {cmsData.title}
            </h2>
            <div style={{ width: '60px', height: '3px', background: '#DC2626' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
            {cmsData.items.map((benefit, index) => (
              <div
                key={benefit.id || index}
                style={{
                  background: '#F8F9FA',
                  padding: '2rem',
                  borderRadius: '8px',
                  border: '1px solid #E5E5E5',
                  transition: 'all 0.3s ease',
                }}
              >
                <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                  <ShieldCheck size={24} color="#FFFFFF" />
                </div>
                <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.3rem', fontWeight: 900, color: '#080808', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                  {benefit.title}
                </h3>
                <p style={{ fontSize: '0.95rem', color: '#666', lineHeight: 1.6 }}>
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ADDITIONAL SECTIONS */}
      <section style={{ background: '#F8F9FA', padding: '5rem 2rem' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '3rem' }}>
            {/* Professional Development */}
            <div>
              <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.8rem', fontWeight: 900, color: '#080808', textTransform: 'uppercase', marginBottom: '1.5rem' }}>
                DESARROLLO PROFESIONAL
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {cmsData.professional_development.map((item, index) => (
                  <div key={index} style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                    <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                      <Check size={12} color="#FFFFFF" />
                    </div>
                    <span style={{ fontSize: '1rem', color: '#666' }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Wellness */}
            <div>
              <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.8rem', fontWeight: 900, color: '#080808', textTransform: 'uppercase', marginBottom: '1.5rem' }}>
                BIENESTAR Y SALUD
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {cmsData.wellness.map((item, index) => (
                  <div key={index} style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                    <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                      <Check size={12} color="#FFFFFF" />
                    </div>
                    <span style={{ fontSize: '1rem', color: '#666' }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section style={{ background: '#080808', padding: '5rem 2rem' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ width: '60px', height: '3px', background: '#DC2626', margin: '0 auto 1rem' }} />
          <h2
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: '2.5rem',
              fontWeight: 900,
              color: '#FFFFFF',
              textTransform: 'uppercase',
              letterSpacing: '0.02em',
              marginBottom: '1.5rem',
            }}
          >
            ¿LISTO PARA FORMAR PARTE DE NUESTRO EQUIPO?
          </h2>
          <p style={{ fontSize: '1.15rem', color: '#E5E5E5', lineHeight: 1.8, maxWidth: '800px', margin: '0 auto 3rem' }}>
            Explora nuestras convocatorias abiertas y postula hoy mismo para iniciar tu camino con nosotros.
          </p>
          <button
            onClick={() => navigate('/postular')}
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
            }}
          >
            VER CONVOCATORIAS ACTIVAS
            <ChevronRight size={18} />
          </button>
        </div>
      </section>
    </div>
  );
};
