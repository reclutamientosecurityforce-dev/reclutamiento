import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { PublicHeader } from './PublicHeader';
import { Shield, Users, Award, Target, Eye, Heart, ChevronRight, UserCheck, Clock, Building } from 'lucide-react';

export const AboutPage: React.FC = () => {
  const navigate = useNavigate();

  const [cmsData, setCmsData] = useState({
    title: 'QUIÉNES SOMOS',
    subtitle: 'LIDERAZGO EN SEGURIDAD INTEGRAL',
    description: 'Security Force P&V es una empresa líder en seguridad privada, especializada en resguardo corporativo, vigilancia y protección integral. Contamos con más de una década de experiencia brindando servicios de excelencia a empresas e instituciones en todo el país.',
    mission: 'Brindar servicios de seguridad privada de excelencia, protegiendo personas, bienes e instalaciones con personal altamente capacitado y tecnología de vanguardia, garantizando la tranquilidad de nuestros clientes.',
    vision: 'Ser la empresa líder en seguridad privada del país, reconocida por nuestra profesionalidad, innovación y compromiso con la seguridad integral de nuestros clientes y el bienestar de nuestros colaboradores.',
    commitment: 'En Security Force P&V nos comprometemos a brindar un ambiente de trabajo seguro, respetuoso y con oportunidades de crecimiento para todos nuestros colaboradores. Valoramos el talento y la dedicación de cada miembro de nuestro equipo.',
    stats: [
      { value: '+10', label: 'Años de experiencia', icon: 'Award', order: 1, is_active: true },
      { value: '+5000', label: 'Colaboradores', icon: 'Users', order: 2, is_active: true },
      { value: '+300', label: 'Clientes satisfechos', icon: 'Building', order: 3, is_active: true },
      { value: '24/7', label: 'Servicio operativo', icon: 'Clock', order: 4, is_active: true },
    ],
    values: [
      { title: 'SEGURIDAD', desc: 'Compromiso inquebrantable con la protección de nuestros clientes y sus activos.', icon: 'Shield', order: 1 },
      { title: 'PROFESIONALISMO', desc: 'Personal capacitado y certificado para brindar servicios de alta calidad.', icon: 'UserCheck', order: 2 },
      { title: 'INTEGRIDAD', desc: 'Actuamos con honestidad, ética y transparencia en todas nuestras operaciones.', icon: 'Heart', order: 3 },
      { title: 'EXCELENCIA', desc: 'Buscamos continuamente la mejora en nuestros procesos y servicios.', icon: 'Award', order: 4 },
    ],
  });

  useEffect(() => {
    async function loadCmsContent() {
      try {
        const res = await api.get<any>('/public/content/about');
        if (res) {
          const c = res.content_data || {};
          setCmsData((prev) => ({
            title: res.title || prev.title,
            subtitle: res.subtitle || prev.subtitle,
            description: res.description || prev.description,
            mission: c.mission || prev.mission,
            vision: c.vision || prev.vision,
            commitment: c.commitment || prev.commitment,
            stats: c.stats && c.stats.length > 0 ? c.stats : prev.stats,
            values: c.values && c.values.length > 0 ? c.values : prev.values,
          }));
        }
      } catch (err) {
        console.warn('Usando fallback para sección About:', err);
      }
    }
    loadCmsContent();
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#FFFFFF' }}>
      <PublicHeader />

      {/* QUIENES SOMOS SECTION */}
      <section style={{ background: '#080808', padding: '5rem 2rem' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ marginBottom: '3rem' }}>
            <div style={{ width: '60px', height: '3px', background: '#DC2626', marginBottom: '1rem' }} />
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
              {cmsData.title}
            </h1>
            <p style={{ fontSize: '1.2rem', color: '#E5E5E5', lineHeight: 1.6, maxWidth: '800px' }}>
              {cmsData.description}
            </p>
          </div>

          {/* Stats */}
          <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem', marginBottom: '4rem' }}>
            {cmsData.stats.map((st, idx) => (
              <div key={idx} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', fontWeight: 900, color: '#DC2626', fontFamily: "'Barlow Condensed', sans-serif" }}>
                  {st.value}
                </div>
                <div style={{ fontSize: '0.85rem', color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '0.5rem' }}>
                  {st.label}
                </div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="cta-buttons" style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate('/postular')}
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
              POSTULA AHORA
              <ChevronRight size={16} />
            </button>
            <button
              onClick={() => navigate('/postular')}
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
              VER CONVOCATORIAS
            </button>
          </div>
        </div>
      </section>

      {/* MISION Y VISION SECTION */}
      <section style={{ background: '#FFFFFF', padding: '5rem 2rem' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '3rem' }}>
            {/* Mision */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Target size={24} color="#FFFFFF" />
                </div>
                <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.8rem', fontWeight: 900, color: '#080808', textTransform: 'uppercase' }}>
                  MISIÓN
                </h2>
              </div>
              <p style={{ fontSize: '1rem', color: '#666', lineHeight: 1.6 }}>
                {cmsData.mission}
              </p>
            </div>

            {/* Vision */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Eye size={24} color="#FFFFFF" />
                </div>
                <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.8rem', fontWeight: 900, color: '#080808', textTransform: 'uppercase' }}>
                  VISIÓN
                </h2>
              </div>
              <p style={{ fontSize: '1rem', color: '#666', lineHeight: 1.6 }}>
                {cmsData.vision}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* VALORES SECTION */}
      <section style={{ background: '#F8F9FA', padding: '5rem 2rem' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <div style={{ width: '60px', height: '3px', background: '#DC2626', margin: '0 auto 1rem' }} />
            <h2
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: '2.5rem',
                fontWeight: 900,
                color: '#080808',
                textTransform: 'uppercase',
                letterSpacing: '0.02em',
                marginBottom: '1rem',
              }}
            >
              NUESTROS VALORES
            </h2>
            <p style={{ fontSize: '1.1rem', color: '#666', maxWidth: '600px', margin: '0 auto' }}>
              Los principios que guian cada una de nuestras acciones y decisiones
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
            {cmsData.values.map((v, i) => (
              <div key={i} style={{ background: '#FFFFFF', padding: '2.5rem 2rem', borderRadius: '8px', border: '1px solid #E5E5E5', textAlign: 'center' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(220, 38, 38, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                  <Shield size={28} color="#DC2626" />
                </div>
                <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.4rem', fontWeight: 900, color: '#080808', textTransform: 'uppercase', marginBottom: '1rem' }}>
                  {v.title}
                </h3>
                <p style={{ fontSize: '0.95rem', color: '#666', lineHeight: 1.6 }}>
                  {v.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMPROMISO SECTION */}
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
            NUESTRO COMPROMISO
          </h2>
          <p style={{ fontSize: '1.15rem', color: '#E5E5E5', lineHeight: 1.8, maxWidth: '800px', margin: '0 auto 3rem' }}>
            {cmsData.commitment}
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
            UNETE A NUESTRO EQUIPO
            <ChevronRight size={18} />
          </button>
        </div>
      </section>
    </div>
  );
};
