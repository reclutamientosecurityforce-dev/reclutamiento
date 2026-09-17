import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { 
  Phone, 
  Mail, 
  MapPin, 
  Facebook, 
  Instagram, 
  Linkedin, 
  MessageCircle, 
  Save, 
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  Clock
} from 'lucide-react';

export const CompanySettingsPage: React.FC = () => {
  const [contactData, setContactData] = useState({
    phone: '',
    whatsapp: '',
    email: '',
    address: '',
    hours: '',
    facebook_url: '',
    instagram_url: '',
    linkedin_url: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadContactInfo() {
      try {
        let contactData: any;
        try {
          contactData = await api.get('/recruitment/companies/contact');
        } catch {
          contactData = await api.get('/public/contact-info');
        }
        if (contactData) {
          setContactData({
            phone: contactData.phone || '',
            whatsapp: contactData.whatsapp || '',
            email: contactData.email || '',
            address: contactData.address || '',
            hours: contactData.hours || '',
            facebook_url: contactData.facebook_url || '',
            instagram_url: contactData.instagram_url || '',
            linkedin_url: contactData.linkedin_url || '',
          });
        }
      } catch (err) {
        console.error('Error al cargar informaciÃ³n de contacto:', err);
        setErrorMsg('Error al cargar informaciÃ³n de contacto');
      } finally {
        setLoading(false);
      }
    }
    loadContactInfo();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      await api.put('/recruitment/companies/contact', contactData);
      setSuccessMsg('InformaciÃ³n de contacto actualizada correctamente');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      console.error('Error al guardar:', err);
      setErrorMsg(err.message || 'Error al actualizar informaciÃ³n de contacto');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setContactData({ ...contactData, [field]: value });
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f5f5f7', color: '#333333', padding: '2rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center', paddingTop: '4rem' }}>
          Cargando configuración...
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f7', color: '#333333' }}>
      {/* Header */}
      <div style={{ 
        background: '#f5f5f7', 
        borderBottom: '1px solid rgba(220, 38, 38, 0.2)', 
        padding: '1.5rem 2rem' 
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              onClick={() => window.history.back()}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#888888',
                cursor: 'pointer',
                padding: '0.5rem',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <ArrowLeft size={20} />
            </button>
            <h1 style={{ 
              fontFamily: "'Barlow Condensed', sans-serif", 
              fontSize: '1.8rem', 
              fontWeight: 900, 
              color: '#1a1a1a',
              textTransform: 'uppercase',
              margin: 0
            }}>
              Configuración de Contacto
            </h1>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: '0.75rem 1.5rem',
              fontSize: '0.9rem',
              fontWeight: 600,
              borderRadius: '6px',
              background: saving ? '#c8c8d0' : '#DC2626',
              border: '1px solid #DC2626',
              color: saving ? '#888888' : '#fff',
              cursor: saving ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <Save size={18} />
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </div>

      {/* Messages */}
      {successMsg && (
        <div style={{ 
          maxWidth: '1200px', 
          margin: '2rem auto 0', 
          padding: '1rem 1.5rem', 
          background: 'rgba(16, 185, 129, 0.1)', 
          border: '1px solid rgba(16, 185, 129, 0.3)', 
          borderRadius: '8px', 
          color: '#34d399',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <CheckCircle2 size={20} />
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div style={{ 
          maxWidth: '1200px', 
          margin: '2rem auto 0', 
          padding: '1rem 1.5rem', 
          background: 'rgba(220, 38, 38, 0.1)', 
          border: '1px solid rgba(220, 38, 38, 0.3)', 
          borderRadius: '8px', 
          color: '#f87171',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <AlertCircle size={20} />
          {errorMsg}
        </div>
      )}

      {/* Content */}
      <div style={{ maxWidth: '1200px', margin: '2rem auto', padding: '0 1rem' }}>
        <div style={{ 
          background: '#f5f5f7', 
          border: '1px solid rgba(220, 38, 38, 0.2)', 
          borderRadius: '12px', 
          padding: '2rem' 
        }}>
          <h2 style={{ 
            fontSize: '1.4rem', 
            fontWeight: 700, 
            color: '#fff', 
            marginBottom: '2rem',
            paddingBottom: '1rem',
            borderBottom: '1px solid rgba(220, 38, 38, 0.2)'
          }}>
            InformaciÃ³n de Contacto PÃºblica
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {/* TelÃ©fono */}
            <div>
              <label style={{ 
                display: 'block', 
                fontSize: '0.8rem', 
                fontWeight: 600, 
                color: '#aaa', 
                marginBottom: '0.5rem',
                textTransform: 'uppercase'
              }}>
                <Phone size={16} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
                TelÃ©fono
              </label>
              <input
                type="text"
                value={contactData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="+51 1 234 5678"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: '#f5f5f7',
                  border: '1px solid rgba(100,100,100,0.1)',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '0.9rem',
                }}
              />
            </div>

            {/* WhatsApp */}
            <div>
              <label style={{ 
                display: 'block', 
                fontSize: '0.8rem', 
                fontWeight: 600, 
                color: '#aaa', 
                marginBottom: '0.5rem',
                textTransform: 'uppercase'
              }}>
                <MessageCircle size={16} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
                WhatsApp
              </label>
              <input
                type="text"
                value={contactData.whatsapp}
                onChange={(e) => handleChange('whatsapp', e.target.value)}
                placeholder="+51 999 888 777"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: '#f5f5f7',
                  border: '1px solid rgba(100,100,100,0.1)',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '0.9rem',
                }}
              />
            </div>

            {/* Email */}
            <div>
              <label style={{ 
                display: 'block', 
                fontSize: '0.8rem', 
                fontWeight: 600, 
                color: '#aaa', 
                marginBottom: '0.5rem',
                textTransform: 'uppercase'
              }}>
                <Mail size={16} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
                Correo ElectrÃ³nico
              </label>
              <input
                type="email"
                value={contactData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="info@securityforce.pe"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: '#f5f5f7',
                  border: '1px solid rgba(100,100,100,0.1)',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '0.9rem',
                }}
              />
            </div>
          </div>

          {/* DirecciÃ³n */}
          <div style={{ marginTop: '1.5rem' }}>
            <label style={{ 
              display: 'block', 
              fontSize: '0.8rem', 
              fontWeight: 600, 
              color: '#aaa', 
              marginBottom: '0.5rem',
              textTransform: 'uppercase'
            }}>
              <MapPin size={16} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
              DirecciÃ³n
            </label>
            <input
              type="text"
              value={contactData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              placeholder="Av. Principal 123, Lima, PerÃº"
              style={{
                width: '100%',
                padding: '0.75rem',
                background: '#f5f5f7',
                border: '1px solid rgba(100,100,100,0.1)',
                borderRadius: '6px',
                color: '#fff',
                fontSize: '0.9rem',
              }}
            />
          </div>

          {/* Horario */}
          <div style={{ marginTop: '1.5rem' }}>
            <label style={{ 
              display: 'block', 
              fontSize: '0.8rem', 
              fontWeight: 600, 
              color: '#aaa', 
              marginBottom: '0.5rem',
              textTransform: 'uppercase'
            }}>
              <Clock size={16} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
              Horario de AtenciÃ³n
            </label>
            <input
              type="text"
              value={contactData.hours}
              onChange={(e) => handleChange('hours', e.target.value)}
              placeholder="Lunes a Viernes: 8:00 AM - 6:00 PM"
              style={{
                width: '100%',
                padding: '0.75rem',
                background: '#f5f5f7',
                border: '1px solid rgba(100,100,100,0.1)',
                borderRadius: '6px',
                color: '#fff',
                fontSize: '0.9rem',
              }}
            />
          </div>

          {/* Redes Sociales */}
          <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid rgba(220, 38, 38, 0.2)' }}>
            <h3 style={{ 
              fontSize: '1.2rem', 
              fontWeight: 700, 
              color: '#fff', 
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              Redes Sociales
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
              {/* Facebook */}
              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '0.8rem', 
                  fontWeight: 600, 
                  color: '#aaa', 
                  marginBottom: '0.5rem',
                  textTransform: 'uppercase'
                }}>
                  <Facebook size={16} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
                  Facebook
                </label>
                <input
                  type="url"
                  value={contactData.facebook_url}
                  onChange={(e) => handleChange('facebook_url', e.target.value)}
                  placeholder="https://facebook.com/securityforce"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: '#f5f5f7',
                    border: '1px solid rgba(100,100,100,0.1)',
                    borderRadius: '6px',
                    color: '#fff',
                    fontSize: '0.9rem',
                  }}
                />
              </div>

              {/* Instagram */}
              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '0.8rem', 
                  fontWeight: 600, 
                  color: '#aaa', 
                  marginBottom: '0.5rem',
                  textTransform: 'uppercase'
                }}>
                  <Instagram size={16} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
                  Instagram
                </label>
                <input
                  type="url"
                  value={contactData.instagram_url}
                  onChange={(e) => handleChange('instagram_url', e.target.value)}
                  placeholder="https://instagram.com/securityforce"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: '#f5f5f7',
                    border: '1px solid rgba(100,100,100,0.1)',
                    borderRadius: '6px',
                    color: '#fff',
                    fontSize: '0.9rem',
                  }}
                />
              </div>

              {/* LinkedIn */}
              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '0.8rem', 
                  fontWeight: 600, 
                  color: '#aaa', 
                  marginBottom: '0.5rem',
                  textTransform: 'uppercase'
                }}>
                  <Linkedin size={16} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
                  LinkedIn
                </label>
                <input
                  type="url"
                  value={contactData.linkedin_url}
                  onChange={(e) => handleChange('linkedin_url', e.target.value)}
                  placeholder="https://linkedin.com/company/securityforce"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: '#f5f5f7',
                    border: '1px solid rgba(100,100,100,0.1)',
                    borderRadius: '6px',
                    color: '#fff',
                    fontSize: '0.9rem',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Info */}
          <div style={{ 
            marginTop: '2rem', 
            padding: '1rem', 
            background: 'rgba(52, 211, 153, 0.1)', 
            border: '1px solid rgba(52, 211, 153, 0.3)', 
            borderRadius: '8px',
            fontSize: '0.85rem',
            color: '#34d399'
          }}>
            <CheckCircle2 size={16} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
            Estos datos se mostrarÃ¡n en la pÃ¡gina de contacto pÃºblico en /contacto
          </div>
        </div>
      </div>
    </div>
  );
};


