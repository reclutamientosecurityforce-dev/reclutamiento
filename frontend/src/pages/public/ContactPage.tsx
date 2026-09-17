import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PublicHeader } from './PublicHeader';
import { Phone, Mail, MapPin, Facebook, Instagram, Linkedin, MessageCircle, ArrowLeft, ChevronRight } from 'lucide-react';
import { api } from '../../api/client';

export const ContactPage: React.FC = () => {
  const navigate = useNavigate();
  const [contactData, setContactData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Cargar datos de contacto desde la API
  useEffect(() => {
    async function loadContactInfo() {
      try {
        const data = await api.get('/public/contact-info');
        setContactData(data);
      } catch (err) {
        console.error('Error al cargar información de contacto:', err);
        // Datos de respaldo en caso de error
        setContactData({
          phone: '+51 1 234 5678',
          whatsapp: '+51 999 888 777',
          email: 'info@securityforce.pe',
          address: 'Av. Principal 123, Lima, Perú',
          hours: 'Lunes a Viernes: 8:00 AM - 6:00 PM',
          facebook_url: 'https://facebook.com/securityforce',
          instagram_url: 'https://instagram.com/securityforce',
          linkedin_url: 'https://linkedin.com/company/securityforce',
        });
      } finally {
        setLoading(false);
      }
    }
    loadContactInfo();
  }, []);

  const handleCall = () => {
    window.open(`tel:${contactData?.phone}`);
  };

  const handleWhatsApp = () => {
    window.open(`https://wa.me/${contactData?.whatsapp?.replace(/\D/g, '')}`);
  };

  const handleEmail = () => {
    window.open(`mailto:${contactData?.email}`);
  };

  const handleMap = () => {
    window.open(`https://maps.google.com/?q=${encodeURIComponent(contactData?.address)}`);
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#FFFFFF' }}>
        <PublicHeader />
        <div style={{ padding: '4rem 2rem', textAlign: 'center', color: '#666' }}>
          Cargando información de contacto...
        </div>
      </div>
    );
  }

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
            CONTACTO
          </h1>
          <p style={{ fontSize: '1.2rem', color: '#E5E5E5', lineHeight: 1.6, maxWidth: '700px', margin: '0 auto 2rem' }}>
            Estamos aquí para ayudarte. Contáctanos por cualquier consulta sobre nuestras convocatorias o servicios.
          </p>
        </div>
      </section>

      {/* CONTACT INFO SECTION */}
      <section style={{ background: '#FFFFFF', padding: '5rem 2rem' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div className="contact-cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
            {/* Phone Card */}
            <div
              style={{
                background: '#FFFFFF',
                border: '1px solid #E5E5E5',
                borderRadius: '8px',
                padding: '2rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.1)';
                e.currentTarget.style.borderColor = '#DC2626';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = '#E5E5E5';
              }}
            >
              <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(220, 38, 38, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Phone size={28} color="#DC2626" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#080808', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                  Teléfono
                </h3>
                <p style={{ fontSize: '1rem', color: '#666', marginBottom: '1rem' }}>
                  {contactData?.phone || 'No configurado'}
                </p>
                <button
                  onClick={handleCall}
                  style={{
                    padding: '0.75rem 1.5rem',
                    fontSize: '0.85rem',
                    fontWeight: 600,
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
                  <Phone size={16} />
                  LLAMAR
                </button>
              </div>
            </div>

            {/* WhatsApp Card */}
            <div
              style={{
                background: '#FFFFFF',
                border: '1px solid #E5E5E5',
                borderRadius: '8px',
                padding: '2rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.1)';
                e.currentTarget.style.borderColor = '#DC2626';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = '#E5E5E5';
              }}
            >
              <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(220, 38, 38, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MessageCircle size={28} color="#DC2626" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#080808', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                  WhatsApp
                </h3>
                <p style={{ fontSize: '1rem', color: '#666', marginBottom: '1rem' }}>
                  {contactData?.whatsapp || 'No configurado'}
                </p>
                <button
                  onClick={handleWhatsApp}
                  style={{
                    padding: '0.75rem 1.5rem',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    borderRadius: '4px',
                    background: '#25D366',
                    border: '1px solid #25D366',
                    color: '#FFFFFF',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'background 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#128C7E';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#25D366';
                  }}
                >
                  <MessageCircle size={16} />
                  WHATSAPP
                </button>
              </div>
            </div>

            {/* Email Card */}
            <div
              style={{
                background: '#FFFFFF',
                border: '1px solid #E5E5E5',
                borderRadius: '8px',
                padding: '2rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.1)';
                e.currentTarget.style.borderColor = '#DC2626';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = '#E5E5E5';
              }}
            >
              <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(220, 38, 38, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Mail size={28} color="#DC2626" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#080808', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                  Correo Electrónico
                </h3>
                <p style={{ fontSize: '1rem', color: '#666', marginBottom: '1rem' }}>
                  {contactData?.email || 'No configurado'}
                </p>
                <button
                  onClick={handleEmail}
                  style={{
                    padding: '0.75rem 1.5rem',
                    fontSize: '0.85rem',
                    fontWeight: 600,
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
                  <Mail size={16} />
                  ENVIAR CORREO
                </button>
              </div>
            </div>
          </div>

          {/* Address Section */}
          <div
            style={{
              background: '#F9F9F9',
              border: '1px solid #E5E5E5',
              borderRadius: '8px',
              padding: '2rem',
              marginTop: '2rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(220, 38, 38, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <MapPin size={28} color="#DC2626" />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#080808', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                  Dirección
                </h3>
                <p style={{ fontSize: '1rem', color: '#666', marginBottom: '0.5rem' }}>
                  {contactData?.address || 'No configurado'}
                </p>
                <p style={{ fontSize: '0.9rem', color: '#888', marginBottom: '1rem' }}>
                  {contactData?.hours || 'No configurado'}
                </p>
                <button
                  onClick={handleMap}
                  style={{
                    padding: '0.75rem 1.5rem',
                    fontSize: '0.85rem',
                    fontWeight: 600,
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
                  <MapPin size={16} />
                  CÓMO LLEGAR
                </button>
              </div>
            </div>
          </div>

          {/* Social Media */}
          <div style={{ marginTop: '3rem', textAlign: 'center' }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#080808', marginBottom: '1.5rem', textTransform: 'uppercase' }}>
              Síguenos en Redes Sociales
            </h3>
            <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center' }}>
              {contactData?.facebook_url && (
                <a
                  href={contactData.facebook_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '50%',
                    background: '#1877F2',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'transform 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  <Facebook size={24} color="#FFFFFF" />
                </a>
              )}
              {contactData?.instagram_url && (
                <a
                  href={contactData.instagram_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '50%',
                    background: '#E4405F',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'transform 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  <Instagram size={24} color="#FFFFFF" />
                </a>
              )}
              {contactData?.linkedin_url && (
                <a
                  href={contactData.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '50%',
                    background: '#0A66C2',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'transform 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  <Linkedin size={24} color="#FFFFFF" />
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section style={{ background: '#DC2626', padding: '4rem 2rem' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '2.5rem', fontWeight: 900, color: '#FFFFFF', textTransform: 'uppercase', marginBottom: '1rem' }}>
            ¿LISTO PARA POSTULAR?
          </h2>
          <p style={{ fontSize: '1.1rem', color: '#FFFFFF', marginBottom: '2rem', maxWidth: '600px', margin: '0 auto 2rem' }}>
            Explora nuestras convocatorias disponibles y comienza tu camino profesional con Security Force P&V.
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
              background: '#FFFFFF',
              border: '1px solid #FFFFFF',
              color: '#DC2626',
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

      {/* BACK BUTTON */}
      <section style={{ background: '#FFFFFF', padding: '2rem' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <button
            onClick={() => navigate('/postular')}
            style={{
              padding: '0.75rem 1.5rem',
              fontSize: '0.85rem',
              fontWeight: 600,
              borderRadius: '4px',
              background: '#FFFFFF',
              border: '1px solid #E5E5E5',
              color: '#080808',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <ArrowLeft size={16} />
            VOLVER A CONVOCATORIAS
          </button>
        </div>
      </section>
    </div>
  );
};
