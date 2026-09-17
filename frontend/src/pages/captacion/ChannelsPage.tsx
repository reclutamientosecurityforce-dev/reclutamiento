import React, { useEffect, useState } from 'react';
import { api } from '../../api/client';
import {
  Share2,
  Plus,
  Edit2,
  TrendingUp,
  Award,
  Users,
  Eye,
  CheckCircle2,
  X,
  AlertCircle,
  Copy,
  Check,
} from 'lucide-react';

interface ChannelItem {
  id: string;
  name: string;
  type: string;
  campaign_id?: string;
  campaign_name?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  description?: string;
  is_active: boolean;
  views_count: number;
  unique_views?: number;
  applications_count: number;
  apt_count: number;
  hired_count: number;
  quality_rate_pct?: number;
}

const CHANNEL_TYPES = [
  { value: 'facebook', label: 'Facebook / Meta Ads' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'whatsapp', label: 'WhatsApp / Grupos' },
  { value: 'qr', label: 'Código QR / Afiches Físicos' },
  { value: 'web', label: 'Web Orgánica / Bolsa Laboral' },
  { value: 'referral', label: 'Programa de Referidos' },
  { value: 'campaign', label: 'Campaña Especial' },
  { value: 'other', label: 'Otro Canal' },
];

export const ChannelsPage: React.FC = () => {
  const [channels, setChannels] = useState<ChannelItem[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingChannel, setEditingChannel] = useState<ChannelItem | null>(null);

  // Form
  const [name, setName] = useState('');
  const [type, setType] = useState('facebook');
  const [campaignId, setCampaignId] = useState<string>('');
  const [utmSource, setUtmSource] = useState('');
  const [utmMedium, setUtmMedium] = useState('social');
  const [utmCampaign, setUtmCampaign] = useState('');
  const [description, setDescription] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function loadData() {
    try {
      setLoading(true);
      const [chanRes, campRes] = await Promise.all([
        api.get<ChannelItem[]>('/recruitment/captacion/channels/quality-metrics'),
        api.get<any[]>('/recruitment/captacion/campaigns'),
      ]);
      setChannels(chanRes || []);
      setCampaigns(campRes || []);
    } catch (err) {
      console.error('Error al cargar canales:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function handleOpenCreate() {
    setEditingChannel(null);
    setName('');
    setType('facebook');
    setCampaignId('');
    setUtmSource('facebook');
    setUtmMedium('paid_social');
    setUtmCampaign('');
    setDescription('');
    setErrorMsg(null);
    setModalOpen(true);
  }

  function handleOpenEdit(chan: ChannelItem) {
    setEditingChannel(chan);
    setName(chan.name);
    setType(chan.type);
    setCampaignId(chan.campaign_id || '');
    setUtmSource(chan.utm_source || '');
    setUtmMedium(chan.utm_medium || '');
    setUtmCampaign(chan.utm_campaign || '');
    setDescription(chan.description || '');
    setErrorMsg(null);
    setModalOpen(true);
  }

  function handleCopyUtmParams(chan: ChannelItem) {
    const params = `utm_source=${chan.utm_source || chan.type}&utm_medium=${chan.utm_medium || 'cpc'}${
      chan.utm_campaign ? `&utm_campaign=${chan.utm_campaign}` : ''
    }`;
    navigator.clipboard.writeText(params);
    setCopiedId(chan.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  async function handleSubmitForm(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('El nombre del canal es obligatorio.');
      return;
    }

    try {
      setFormLoading(true);
      setErrorMsg(null);

      const payload = {
        name: name.trim(),
        type,
        campaignId: campaignId || null,
        utmSource: utmSource.trim() || type,
        utmMedium: utmMedium.trim() || 'cpc',
        utmCampaign: utmCampaign.trim() || undefined,
        description: description.trim() || undefined,
        isActive: true,
      };

      if (editingChannel) {
        await api.put(`/recruitment/captacion/channels/${editingChannel.id}`, payload);
      } else {
        await api.post('/recruitment/captacion/channels', payload);
      }

      setModalOpen(false);
      loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al guardar canal.');
    } finally {
      setFormLoading(false);
    }
  }

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1300px', margin: '0 auto', color: '#f8fafc' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
            <div style={{ padding: '0.5rem', borderRadius: '8px', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.4)', color: '#34d399' }}>
              <Share2 size={22} />
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: '#ffffff' }}>
              Canales de Atracción y Trazabilidad UTM
            </h1>
          </div>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem', margin: 0 }}>
            Medición del origen de cada candidato y comparativa de calidad por fuente de difusión.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.65rem 1.25rem',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #10b981, #059669)',
            border: 'none',
            color: '#fff',
            fontWeight: 700,
            fontSize: '0.875rem',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(16,185,129,0.3)',
          }}
        >
          <Plus size={16} />
          <span>Nuevo Canal</span>
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem 0', color: '#94a3b8' }}>Cargando canales...</div>
      ) : channels.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 0', background: '#111827', borderRadius: '12px', border: '1px solid #1f2937' }}>
          <Share2 size={36} color="#64748b" style={{ margin: '0 auto 0.75rem', display: 'block' }} />
          <p style={{ color: '#94a3b8', fontWeight: 600 }}>No hay canales registrados aún.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.25rem' }}>
          {channels.map((chan, idx) => (
            <div
              key={chan.id || `channel-${idx}-${chan.utm_source || 'default'}`}
              style={{
                background: '#111827',
                border: '1px solid #1f2937',
                borderRadius: '12px',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: '#ffffff' }}>{chan.name}</h3>
                    {chan.campaign_name && (
                      <span style={{ fontSize: '0.75rem', color: '#eab308', fontWeight: 600 }}>
                        Campaña: {chan.campaign_name}
                      </span>
                    )}
                  </div>
                  <span
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      padding: '0.2rem 0.5rem',
                      borderRadius: '999px',
                      background: '#1f2937',
                      color: '#94a3b8',
                      textTransform: 'uppercase',
                    }}
                  >
                    {chan.type}
                  </span>
                </div>

                <p style={{ fontSize: '0.82rem', color: '#94a3b8', margin: '0 0 0.75rem 0', lineHeight: 1.4 }}>
                  {chan.description || 'Sin descripción adicional.'}
                </p>

                {/* Parámetros UTM */}
                <div
                  style={{
                    background: '#0f172a',
                    border: '1px solid #1f2937',
                    borderRadius: '6px',
                    padding: '0.5rem 0.75rem',
                    marginBottom: '1rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ fontFamily: 'monospace', fontSize: '0.72rem', color: '#38bdf8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    source={chan.utm_source || chan.type}&medium={chan.utm_medium || 'cpc'}
                  </span>
                  <button
                    onClick={() => handleCopyUtmParams(chan)}
                    title="Copiar parámetros UTM"
                    style={{ background: 'none', border: 'none', color: copiedId === chan.id ? '#4ade80' : '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                  >
                    {copiedId === chan.id ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>

                {/* Métricas de Calidad */}
                <div
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid #1f2937',
                    borderRadius: '8px',
                    padding: '0.75rem',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '0.5rem',
                    textAlign: 'center',
                    marginBottom: '1rem',
                  }}
                >
                  <div>
                    <span style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', display: 'block' }}>Vistas Únicas</span>
                    <strong style={{ fontSize: '1rem', color: '#f8fafc' }}>{chan.unique_views || 0}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', display: 'block' }}>Postulaciones</span>
                    <strong style={{ fontSize: '1rem', color: '#f8fafc' }}>{chan.applications_count || 0}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.68rem', color: '#f87171', textTransform: 'uppercase', display: 'block', fontWeight: 700 }}>Aptos</span>
                    <strong style={{ fontSize: '1rem', color: '#4ade80' }}>{chan.apt_count || 0}</strong>
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px solid #1f2937' }}>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                  Calidad: <strong style={{ color: '#4ade80' }}>{chan.quality_rate_pct || 0}%</strong>
                </span>

                <button
                  onClick={() => handleOpenEdit(chan)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '0.35rem 0.75rem',
                    borderRadius: '6px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid #374151',
                    color: '#cbd5e1',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  <Edit2 size={13} />
                  <span>Editar</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Crear/Editar Canal */}
      {modalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999,
            padding: '1rem',
          }}
        >
          <div
            style={{
              background: '#111827',
              border: '1px solid #374151',
              borderRadius: '14px',
              maxWidth: '560px',
              width: '100%',
              padding: '1.5rem',
              boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Share2 size={20} color="#10b981" />
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: '#ffffff' }}>
                  {editingChannel ? 'Editar Canal de Atracción' : 'Crear Nuevo Canal'}
                </h2>
              </div>
              <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {errorMsg && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '0.75rem', color: '#f87171', fontSize: '0.85rem', marginBottom: '1rem' }}>
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmitForm} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.35rem' }}>
                  Nombre del Canal *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="ej: Facebook Ads - Trujillanos, QR Volantes Base Central..."
                  style={{ width: '100%', padding: '0.65rem 0.85rem', background: '#1f2937', border: '1px solid #374151', borderRadius: '8px', color: '#fff', fontSize: '0.9rem' }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.35rem' }}>
                    Tipo de Canal
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', background: '#1f2937', border: '1px solid #374151', borderRadius: '8px', color: '#fff', fontSize: '0.85rem' }}
                  >
                    {CHANNEL_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.35rem' }}>
                    Campaña Asociada (Opcional)
                  </label>
                  <select
                    value={campaignId}
                    onChange={(e) => setCampaignId(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', background: '#1f2937', border: '1px solid #374151', borderRadius: '8px', color: '#fff', fontSize: '0.85rem' }}
                  >
                    <option value="">-- Sin Campaña Específica --</option>
                    {campaigns.map((c, idx) => (
                      <option key={c.id || `campaign-${idx}-${c.name}`} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.35rem' }}>
                    utm_source
                  </label>
                  <input
                    type="text"
                    value={utmSource}
                    onChange={(e) => setUtmSource(e.target.value)}
                    placeholder="ej: facebook, qr_afiche, whatsapp"
                    style={{ width: '100%', padding: '0.65rem 0.85rem', background: '#1f2937', border: '1px solid #374151', borderRadius: '8px', color: '#fff', fontSize: '0.85rem', fontFamily: 'monospace' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.35rem' }}>
                    utm_medium
                  </label>
                  <input
                    type="text"
                    value={utmMedium}
                    onChange={(e) => setUtmMedium(e.target.value)}
                    placeholder="ej: paid_social, offline_print"
                    style={{ width: '100%', padding: '0.65rem 0.85rem', background: '#1f2937', border: '1px solid #374151', borderRadius: '8px', color: '#fff', fontSize: '0.85rem', fontFamily: 'monospace' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.35rem' }}>
                  Descripción Operativa
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="Ubicación de afiches, perfil de segmentación o notas del canal..."
                  style={{ width: '100%', padding: '0.65rem 0.85rem', background: '#1f2937', border: '1px solid #374151', borderRadius: '8px', color: '#fff', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  style={{ padding: '0.65rem 1.1rem', borderRadius: '8px', background: 'transparent', border: '1px solid #374151', color: '#94a3b8', cursor: 'pointer', fontWeight: 600 }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  style={{ padding: '0.65rem 1.25rem', borderRadius: '8px', background: '#10b981', border: 'none', color: '#fff', cursor: formLoading ? 'not-allowed' : 'pointer', fontWeight: 700 }}
                >
                  {formLoading ? 'Guardando...' : editingChannel ? 'Guardar Cambios' : 'Crear Canal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
