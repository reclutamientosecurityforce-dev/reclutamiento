import React, { useEffect, useState } from 'react';
import { api } from '../../api/client';
import {
  Target,
  Plus,
  Edit2,
  Calendar,
  DollarSign,
  TrendingUp,
  Award,
  Users,
  Eye,
  X,
  AlertCircle,
  BarChart2,
  CheckCircle2,
  PauseCircle,
  StopCircle,
} from 'lucide-react';

interface CampaignItem {
  id: string;
  name: string;
  description?: string;
  utm_campaign?: string;
  status: 'active' | 'paused' | 'ended' | 'archived';
  starts_at?: string;
  ends_at?: string;
  budget_notes?: string;
  channels_count: number;
  publications_count: number;
  calculated_views: number;
  calculated_unique_views: number;
  calculated_applications: number;
  calculated_completed: number;
  calculated_apt: number;
  calculated_hired: number;
  quality_rate_pct: number;
}

export const CampaignsPage: React.FC = () => {
  const [campaigns, setCampaigns] = useState<CampaignItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<CampaignItem | null>(null);

  // Form
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [utmCampaign, setUtmCampaign] = useState('');
  const [status, setStatus] = useState<'active' | 'paused' | 'ended' | 'archived'>('active');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [budgetNotes, setBudgetNotes] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function loadCampaigns() {
    try {
      setLoading(true);
      const data = await api.get<CampaignItem[]>('/recruitment/captacion/campaigns');
      setCampaigns(data || []);
    } catch (err) {
      console.error('Error al cargar campañas:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCampaigns();
  }, []);

  function handleOpenCreate() {
    setEditingCampaign(null);
    setName('');
    setDescription('');
    setUtmCampaign('');
    setStatus('active');
    setStartsAt(new Date().toISOString().slice(0, 10));
    setEndsAt('');
    setBudgetNotes('');
    setErrorMsg(null);
    setModalOpen(true);
  }

  function handleOpenEdit(camp: CampaignItem) {
    setEditingCampaign(camp);
    setName(camp.name);
    setDescription(camp.description || '');
    setUtmCampaign(camp.utm_campaign || '');
    setStatus(camp.status);
    setStartsAt(camp.starts_at ? camp.starts_at.slice(0, 10) : '');
    setEndsAt(camp.ends_at ? camp.ends_at.slice(0, 10) : '');
    setBudgetNotes(camp.budget_notes || '');
    setErrorMsg(null);
    setModalOpen(true);
  }

  async function handleStatusChange(id: string, newStatus: string) {
    try {
      await api.patch(`/recruitment/captacion/campaigns/${id}/status`, { status: newStatus });
      loadCampaigns();
    } catch (err) {
      console.error('Error al cambiar estado de campaña:', err);
    }
  }

  async function handleSubmitForm(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('El nombre de la campaña es obligatorio.');
      return;
    }

    try {
      setFormLoading(true);
      setErrorMsg(null);

      const payload = {
        name: name.trim(),
        description: description.trim() || undefined,
        utmCampaign: utmCampaign.trim() || undefined,
        status,
        startsAt: startsAt || undefined,
        endsAt: endsAt || undefined,
        budgetNotes: budgetNotes.trim() || undefined,
      };

      if (editingCampaign) {
        await api.put(`/recruitment/captacion/campaigns/${editingCampaign.id}`, payload);
      } else {
        await api.post('/recruitment/captacion/campaigns', payload);
      }

      setModalOpen(false);
      loadCampaigns();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al guardar la campaña.');
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
            <div style={{ padding: '0.5rem', borderRadius: '8px', background: 'rgba(234,179,8,0.15)', border: '1px solid rgba(234,179,8,0.4)', color: '#facc15' }}>
              <Target size={22} />
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: '#ffffff' }}>
              Campañas de Captación y Reclutamiento
            </h1>
          </div>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem', margin: 0 }}>
            Agrupación estratégica de publicaciones y canales para medir retorno y calidad de atracción.
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
            background: 'linear-gradient(135deg, #eab308, #ca8a04)',
            border: 'none',
            color: '#000',
            fontWeight: 800,
            fontSize: '0.875rem',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(234,179,8,0.3)',
          }}
        >
          <Plus size={16} />
          <span>Nueva Campaña</span>
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem 0', color: '#94a3b8' }}>Cargando campañas...</div>
      ) : campaigns.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 0', background: '#111827', borderRadius: '12px', border: '1px solid #1f2937' }}>
          <Target size={36} color="#64748b" style={{ margin: '0 auto 0.75rem', display: 'block' }} />
          <p style={{ color: '#94a3b8', fontWeight: 600 }}>No hay campañas creadas aún.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '1.25rem' }}>
          {campaigns.map((camp, idx) => (
            <div
              key={camp.id || `campaign-${idx}-${camp.utm_campaign || 'camp'}`}
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.6rem' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: '#ffffff' }}>{camp.name}</h3>
                  <span
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      padding: '0.2rem 0.5rem',
                      borderRadius: '999px',
                      background:
                        camp.status === 'active'
                          ? 'rgba(34,197,94,0.15)'
                          : camp.status === 'paused'
                          ? 'rgba(234,179,8,0.15)'
                          : 'rgba(100,116,139,0.15)',
                      color:
                        camp.status === 'active'
                          ? '#4ade80'
                          : camp.status === 'paused'
                          ? '#facc15'
                          : '#94a3b8',
                      border: `1px solid ${
                        camp.status === 'active' ? 'rgba(34,197,94,0.3)' : 'rgba(100,116,139,0.3)'
                      }`,
                    }}
                  >
                    {camp.status.toUpperCase()}
                  </span>
                </div>

                <p style={{ fontSize: '0.83rem', color: '#94a3b8', margin: '0 0 0.75rem 0', lineHeight: 1.4 }}>
                  {camp.description || 'Sin descripción.'}
                </p>

                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem', fontSize: '0.75rem', color: '#cbd5e1' }}>
                  <span style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', background: '#1f2937', fontFamily: 'monospace' }}>
                    utm: {camp.utm_campaign}
                  </span>
                  <span style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', background: '#1f2937' }}>
                    {camp.channels_count} canales | {camp.publications_count} publicaciones
                  </span>
                </div>

                {/* Metrics Box */}
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
                    <strong style={{ fontSize: '1rem', color: '#f8fafc' }}>{camp.calculated_unique_views}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', display: 'block' }}>Postulaciones</span>
                    <strong style={{ fontSize: '1rem', color: '#f8fafc' }}>{camp.calculated_completed}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.68rem', color: '#f87171', textTransform: 'uppercase', display: 'block', fontWeight: 700 }}>Aptos ({camp.quality_rate_pct}%)</span>
                    <strong style={{ fontSize: '1rem', color: '#4ade80' }}>{camp.calculated_apt}</strong>
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px solid #1f2937' }}>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {camp.status === 'active' && (
                    <button
                      onClick={() => handleStatusChange(camp.id, 'paused')}
                      style={{ background: 'none', border: 'none', color: '#facc15', fontSize: '0.78rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                    >
                      <PauseCircle size={13} />
                      <span>Pausar</span>
                    </button>
                  )}
                  {camp.status === 'paused' && (
                    <button
                      onClick={() => handleStatusChange(camp.id, 'active')}
                      style={{ background: 'none', border: 'none', color: '#4ade80', fontSize: '0.78rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                    >
                      <CheckCircle2 size={13} />
                      <span>Reactivar</span>
                    </button>
                  )}
                  {camp.status !== 'ended' && (
                    <button
                      onClick={() => handleStatusChange(camp.id, 'ended')}
                      style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '0.78rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                    >
                      <StopCircle size={13} />
                      <span>Finalizar</span>
                    </button>
                  )}
                </div>

                <button
                  onClick={() => handleOpenEdit(camp)}
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

      {/* Modal Crear/Editar Campaña */}
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
                <Target size={20} color="#eab308" />
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: '#ffffff' }}>
                  {editingCampaign ? 'Editar Campaña' : 'Crear Nueva Campaña'}
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
                  Nombre de la Campaña *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="ej: Convocatoria Masiva Trujillo Agosto 2026"
                  style={{ width: '100%', padding: '0.65rem 0.85rem', background: '#1f2937', border: '1px solid #374151', borderRadius: '8px', color: '#fff', fontSize: '0.9rem' }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.35rem' }}>
                    Parámetro UTM Campaign
                  </label>
                  <input
                    type="text"
                    value={utmCampaign}
                    onChange={(e) => setUtmCampaign(e.target.value)}
                    placeholder="ej: trujillo_ago_2026"
                    style={{ width: '100%', padding: '0.65rem 0.85rem', background: '#1f2937', border: '1px solid #374151', borderRadius: '8px', color: '#fff', fontSize: '0.85rem', fontFamily: 'monospace' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.35rem' }}>
                    Estado
                  </label>
                  <select
                    value={status}
                    onChange={(e: any) => setStatus(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', background: '#1f2937', border: '1px solid #374151', borderRadius: '8px', color: '#fff', fontSize: '0.85rem' }}
                  >
                    <option value="active">Activa</option>
                    <option value="paused">Pausada</option>
                    <option value="ended">Finalizada</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.35rem' }}>
                  Descripción u Objetivo
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="Meta de candidatos, cobertura de sedes, canales autorizados..."
                  style={{ width: '100%', padding: '0.65rem 0.85rem', background: '#1f2937', border: '1px solid #374151', borderRadius: '8px', color: '#fff', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.35rem' }}>
                    Fecha de Inicio
                  </label>
                  <input
                    type="date"
                    value={startsAt}
                    onChange={(e) => setStartsAt(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', background: '#1f2937', border: '1px solid #374151', borderRadius: '8px', color: '#fff', fontSize: '0.85rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.35rem' }}>
                    Fecha de Cierre
                  </label>
                  <input
                    type="date"
                    value={endsAt}
                    onChange={(e) => setEndsAt(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', background: '#1f2937', border: '1px solid #374151', borderRadius: '8px', color: '#fff', fontSize: '0.85rem' }}
                  />
                </div>
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
                  style={{ padding: '0.65rem 1.25rem', borderRadius: '8px', background: '#eab308', border: 'none', color: '#000', cursor: formLoading ? 'not-allowed' : 'pointer', fontWeight: 800 }}
                >
                  {formLoading ? 'Guardando...' : editingCampaign ? 'Guardar Cambios' : 'Crear Campaña'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
