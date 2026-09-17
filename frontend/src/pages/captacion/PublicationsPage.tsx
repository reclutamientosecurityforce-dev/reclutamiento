import React, { useEffect, useState } from 'react';
import { api } from '../../api/client';
import {
  Megaphone,
  Plus,
  Copy,
  Check,
  Edit2,
  ExternalLink,
  Eye,
  BarChart2,
  PlayCircle,
  PauseCircle,
  StopCircle,
  Archive,
  QrCode,
  Share2,
  X,
  AlertCircle,
  Layers,
  Briefcase,
  MapPin,
  Clock,
  DollarSign,
  Users,
  CheckCircle2,
  Calendar,
  Sparkles,
} from 'lucide-react';

interface PublicationItem {
  id: string;
  job_opening_id: string;
  campaign_id?: string;
  channel_id?: string;
  slug: string;
  title: string;
  description?: string;
  banner_url?: string;
  benefits: string[];
  requirement_version_at_publish?: number;
  status: 'draft' | 'published' | 'paused' | 'closed' | 'archived';
  published_at?: string;
  closes_at?: string;
  og_title?: string;
  og_description?: string;
  og_image_url?: string;
  calculated_views: number;
  calculated_unique_views: number;
  calculated_started: number;
  calculated_completed: number;
  apt_count: number;
  hired_count: number;
  job_title: string;
  job_location: string;
  job_vacancies: number;
  category_name?: string;
  campaign_name?: string;
  channel_name?: string;
}

export const PublicationsPage: React.FC = () => {
  const [publications, setPublications] = useState<PublicationItem[]>([]);
  const [openings, setOpenings] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [channels, setChannels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal Crear / Editar
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPub, setEditingPub] = useState<PublicationItem | null>(null);

  // Wizard Form State
  const [step, setStep] = useState(1);
  const [jobOpeningId, setJobOpeningId] = useState('');
  const [campaignId, setCampaignId] = useState('');
  const [channelId, setChannelId] = useState('');
  const [customSlug, setCustomSlug] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [benefitInput, setBenefitInput] = useState('');
  const [benefitsList, setBenefitsList] = useState<string[]>([
    'Ingreso inmediato a planilla completa con beneficios de ley',
    'Pagos puntuales quincena y fin de mes',
    'Seguro Vida Ley y EsSalud',
    'Uniformes y equipamiento completo sin costo',
  ]);
  const [closesAt, setClosesAt] = useState('');
  const [ogTitle, setOgTitle] = useState('');
  const [ogDescription, setOgDescription] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Modal QR / Compartir
  const [qrModalPub, setQrModalPub] = useState<PublicationItem | null>(null);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  // Modal MÃ©tricas
  const [metricsModalPubId, setMetricsModalPubId] = useState<string | null>(null);
  const [metricsData, setMetricsData] = useState<any>(null);
  const [metricsLoading, setMetricsLoading] = useState(false);

  async function loadData() {
    try {
      setLoading(true);
      const [pubsRes, opensRes, campsRes, chansRes] = await Promise.all([
        api.get<PublicationItem[]>('/recruitment/captacion/publications'),
        api.get<any[]>('/recruitment/openings?status=open'),
        api.get<any[]>('/recruitment/captacion/campaigns'),
        api.get<any[]>('/recruitment/captacion/channels'),
      ]);
      setPublications(pubsRes || []);
      setOpenings(opensRes || []);
      setCampaigns(campsRes || []);
      setChannels(chansRes || []);
    } catch (err) {
      console.error('Error al cargar publicaciones:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function handleOpenCreate() {
    setEditingPub(null);
    setStep(1);
    setJobOpeningId(openings.length > 0 ? openings[0].id : '');
    setCampaignId('');
    setChannelId('');
    setCustomSlug('');
    setTitle('');
    setDescription(
      'En Security Force P&V seleccionamos al mejor talento para integrarse a nuestro equipo operativo de seguridad y vigilancia privada.'
    );
    setBannerUrl('');
    setBenefitsList([
      'Ingreso inmediato a planilla completa con beneficios de ley',
      'Pagos puntuales quincena y fin de mes',
      'Seguro Vida Ley y EsSalud',
      'Uniformes y equipamiento completo sin costo',
    ]);
    setClosesAt('');
    setOgTitle('');
    setOgDescription('');
    setErrorMsg(null);
    setModalOpen(true);
  }

  function handleOpenEdit(pub: PublicationItem) {
    setEditingPub(pub);
    setStep(2);
    setJobOpeningId(pub.job_opening_id);
    setCampaignId(pub.campaign_id || '');
    setChannelId(pub.channel_id || '');
    setCustomSlug(pub.slug);
    setTitle(pub.title);
    setDescription(pub.description || '');
    setBannerUrl(pub.banner_url || '');
    setBenefitsList(Array.isArray(pub.benefits) ? pub.benefits : []);
    setClosesAt(pub.closes_at ? pub.closes_at.slice(0, 10) : '');
    setOgTitle(pub.og_title || '');
    setOgDescription(pub.og_description || '');
    setErrorMsg(null);
    setModalOpen(true);
  }

  async function handleDuplicate(pub: PublicationItem) {
    if (!window.confirm(`Â¿Desea duplicar la publicaciÃ³n "${pub.title}"? Se crearÃ¡ una copia en borrador con nueva URL.`)) {
      return;
    }
    try {
      await api.post(`/recruitment/captacion/publications/${pub.id}/duplicate`, {});
      loadData();
    } catch (err: any) {
      alert(err.message || 'Error al duplicar publicaciÃ³n.');
    }
  }

  async function handleStatusChange(pubId: string, newStatus: string) {
    try {
      await api.post(`/recruitment/captacion/publications/${pubId}/status`, { status: newStatus });
      loadData();
    } catch (err: any) {
      alert(err.message || 'Error al cambiar estado.');
    }
  }

  async function handleOpenMetrics(pub: PublicationItem) {
    setMetricsModalPubId(pub.id);
    try {
      setMetricsLoading(true);
      const res = await api.get(`/recruitment/captacion/publications/${pub.id}/metrics`);
      setMetricsData(res);
    } catch (err) {
      console.error('Error al cargar mÃ©tricas:', err);
    } finally {
      setMetricsLoading(false);
    }
  }

  function handleAddBenefit() {
    if (benefitInput.trim()) {
      setBenefitsList([...benefitsList, benefitInput.trim()]);
      setBenefitInput('');
    }
  }

  function handleRemoveBenefit(idx: number) {
    setBenefitsList(benefitsList.filter((_, i) => i !== idx));
  }

  function copyShareUrl(slug: string) {
    const fullUrl = `${window.location.origin}/postular/p/${slug}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2000);
  }

  async function handleSubmitForm(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('El tÃ­tulo de la publicaciÃ³n es obligatorio.');
      return;
    }
    if (!jobOpeningId) {
      setErrorMsg('Debe seleccionar una convocatoria.');
      return;
    }

    try {
      setFormLoading(true);
      setErrorMsg(null);

      const payload = {
        jobOpeningId,
        campaignId: campaignId || null,
        channelId: channelId || null,
        slug: customSlug.trim() || undefined,
        title: title.trim(),
        description: description.trim() || undefined,
        bannerUrl: bannerUrl.trim() || null,
        benefits: benefitsList,
        closesAt: closesAt || null,
        ogTitle: ogTitle.trim() || title.trim(),
        ogDescription: ogDescription.trim() || description.slice(0, 180),
        ogImageUrl: bannerUrl.trim() || null,
      };

      if (editingPub) {
        await api.put(`/recruitment/captacion/publications/${editingPub.id}`, payload);
      } else {
        const created = await api.post<PublicationItem>('/recruitment/captacion/publications', payload);
        // Preguntar si desea publicar inmediatamente
        if (window.confirm('PublicaciÃ³n creada en borrador. Â¿Desea activarla pÃºblicamente ahora?')) {
          await api.post(`/recruitment/captacion/publications/${created.id}/status`, { status: 'published' });
        }
      }

      setModalOpen(false);
      loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al guardar la publicaciÃ³n.');
    } finally {
      setFormLoading(false);
    }
  }

  const filteredPubs =
    statusFilter === 'all'
      ? publications
      : publications.filter((p) => p.status === statusFilter);

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1400px', margin: '0 auto', color: '#e8e8f0' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
            <div style={{ padding: '0.5rem', borderRadius: '8px', background: 'rgba(220,38,38,0.15)', border: '1px solid rgba(220,38,38,0.4)', color: '#f87171' }}>
              <Megaphone size={22} />
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: '#e8e8f0' }}>
              Publicaciones y Canales de CaptaciÃ³n
            </h1>
          </div>
          <p style={{ color: '#1a1a1a', fontSize: '0.875rem', margin: 0 }}>
            DifusiÃ³n multicanal: una misma convocatoria con mÃºltiples mensajes, enlaces pÃºblicos (/postular/p/...) y cÃ³digos QR.
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
            background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
            border: '1px solid rgba(220,38,38,0.6)',
            color: '#fff',
            fontWeight: 800,
            fontSize: '0.875rem',
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(220,38,38,0.3)',
          }}
        >
          <Plus size={16} />
          <span>+ Crear PublicaciÃ³n</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {['all', 'published', 'draft', 'paused', 'closed', 'archived'].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            style={{
              padding: '0.45rem 0.9rem',
              borderRadius: '6px',
              border: statusFilter === st ? '1px solid #dc2626' : '1px solid #374151',
              background: statusFilter === st ? 'rgba(220,38,38,0.2)' : 'rgba(100,100,100,0.02)',
              color: statusFilter === st ? '#e8e8f0' : '#666666',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              textTransform: 'uppercase',
            }}
          >
            {st === 'all' ? 'Todas' : st}
          </button>
        ))}
      </div>

      {/* Publications Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem 0', color: '#1a1a1a' }}>Cargando publicaciones...</div>
      ) : filteredPubs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 0', background: '#e8e8f0827', borderRadius: '12px', border: '1px solid #d8d8e0' }}>
          <Megaphone size={36} color="#64748b" style={{ margin: '0 auto 0.75rem', display: 'block' }} />
          <p style={{ color: '#1a1a1a', fontWeight: 600 }}>No hay publicaciones para el filtro seleccionado.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '1.25rem' }}>
          {filteredPubs.map((pub, idx) => {
            const publicUrl = `/postular/p/${pub.slug}`;
            return (
              <div
                key={pub.id || `pub-${idx}-${pub.slug}`}
                style={{
                  background: '#e8e8f0827',
                  border: '1px solid #d8d8e0',
                  borderRadius: '12px',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  position: 'relative',
                }}
              >
                <div>
                  {/* Status chip & Slug */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: 800,
                          padding: '0.2rem 0.5rem',
                          borderRadius: '999px',
                          background:
                            pub.status === 'published'
                              ? 'rgba(34,197,94,0.15)'
                              : pub.status === 'paused'
                              ? 'rgba(234,179,8,0.15)'
                              : pub.status === 'draft'
                              ? 'rgba(99,102,241,0.15)'
                              : 'rgba(100,116,139,0.15)',
                          color:
                            pub.status === 'published'
                              ? '#4ade80'
                              : pub.status === 'paused'
                              ? '#facc15'
                              : pub.status === 'draft'
                              ? '#818cf8'
                              : '#666666',
                          border: `1px solid ${
                            pub.status === 'published' ? 'rgba(34,197,94,0.3)' : 'rgba(100,116,139,0.3)'
                          }`,
                          textTransform: 'uppercase',
                        }}
                      >
                        {pub.status}
                      </span>
                      {pub.category_name && (
                        <span style={{ fontSize: '0.72rem', color: '#60a5fa', fontWeight: 600 }}>
                          â€¢ {pub.category_name}
                        </span>
                      )}
                    </div>

                    <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#1a1a1a', fontWeight: 700, background: '#0f172a', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                      /p/{pub.slug}
                    </span>
                  </div>

                  {/* Title & Opening info */}
                  <h3 style={{ fontSize: '1.08rem', fontWeight: 800, color: '#e8e8f0', margin: '0 0 0.35rem 0', lineHeight: 1.3 }}>
                    {pub.title}
                  </h3>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: '#1a1a1a', marginBottom: '0.75rem' }}>
                    <Briefcase size={13} />
                    <span>Convocatoria: <strong>{pub.job_title}</strong> ({pub.job_location})</span>
                  </div>

                  {/* Canal & CampaÃ±a */}
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1rem', fontSize: '0.72rem' }}>
                    {pub.channel_name && (
                      <span style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', background: 'rgba(16,185,129,0.1)', color: '#34d399', border: '1px solid rgba(16,185,129,0.2)' }}>
                        Canal: {pub.channel_name}
                      </span>
                    )}
                    {pub.campaign_name && (
                      <span style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', background: 'rgba(234,179,8,0.1)', color: '#facc15', border: '1px solid rgba(234,179,8,0.2)' }}>
                        CampaÃ±a: {pub.campaign_name}
                      </span>
                    )}
                  </div>

                  {/* Metrics Mini-Bar */}
                  <div
                    style={{
                      background: 'rgba(100,100,100,0.02)',
                      border: '1px solid #d8d8e0',
                      borderRadius: '8px',
                      padding: '0.65rem 0.75rem',
                      display: 'grid',
                      gridTemplateColumns: 'repeat(4, 1fr)',
                      gap: '0.35rem',
                      textAlign: 'center',
                      marginBottom: '1rem',
                    }}
                  >
                    <div>
                      <span style={{ fontSize: '0.65rem', color: '#0f1419', textTransform: 'uppercase', display: 'block' }}>Vistas</span>
                      <strong style={{ fontSize: '0.95rem', color: '#e8e8f0' }}>{pub.calculated_unique_views || 0}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.65rem', color: '#0f1419', textTransform: 'uppercase', display: 'block' }}>Iniciadas</span>
                      <strong style={{ fontSize: '0.95rem', color: '#e8e8f0' }}>{pub.calculated_started || 0}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.65rem', color: '#0f1419', textTransform: 'uppercase', display: 'block' }}>Completas</span>
                      <strong style={{ fontSize: '0.95rem', color: '#e8e8f0' }}>{pub.calculated_completed || 0}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.65rem', color: '#f87171', textTransform: 'uppercase', display: 'block', fontWeight: 700 }}>Aptos</span>
                      <strong style={{ fontSize: '0.95rem', color: '#4ade80' }}>{pub.apt_count || 0}</strong>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div style={{ paddingTop: '0.75rem', borderTop: '1px solid #d8d8e0', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {/* Share & Copy Link */}
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => copyShareUrl(pub.slug)}
                      style={{
                        flex: 1,
                        padding: '0.45rem',
                        background: 'rgba(100,100,100,0.05)',
                        border: '1px solid #374151',
                        borderRadius: '6px',
                        color: copiedSlug === pub.slug ? '#4ade80' : '#555555',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.35rem',
                      }}
                    >
                      {copiedSlug === pub.slug ? <Check size={13} /> : <Copy size={13} />}
                      <span>{copiedSlug === pub.slug ? 'Â¡Enlace Copiado!' : 'Copiar URL'}</span>
                    </button>

                    <a
                      href={publicUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        padding: '0.45rem 0.65rem',
                        background: 'rgba(100,100,100,0.05)',
                        border: '1px solid #374151',
                        borderRadius: '6px',
                        color: '#60a5fa',
                        fontSize: '0.78rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textDecoration: 'none',
                      }}
                      title="Ver pÃ¡gina pÃºblica"
                    >
                      <ExternalLink size={14} />
                    </a>

                    <button
                      onClick={() => setQrModalPub(pub)}
                      style={{
                        padding: '0.45rem 0.65rem',
                        background: 'rgba(100,100,100,0.05)',
                        border: '1px solid #374151',
                        borderRadius: '6px',
                        color: '#c084fc',
                        fontSize: '0.78rem',
                        cursor: 'pointer',
                      }}
                      title="Ver cÃ³digo QR"
                    >
                      <QrCode size={14} />
                    </button>
                  </div>

                  {/* State & Management Actions */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem' }}>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      {pub.status === 'draft' && (
                        <button
                          onClick={() => handleStatusChange(pub.id, 'published')}
                          style={{ background: 'none', border: 'none', color: '#4ade80', cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                        >
                          <PlayCircle size={13} /> Publicar
                        </button>
                      )}
                      {pub.status === 'published' && (
                        <button
                          onClick={() => handleStatusChange(pub.id, 'paused')}
                          style={{ background: 'none', border: 'none', color: '#facc15', cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                        >
                          <PauseCircle size={13} /> Pausar
                        </button>
                      )}
                      {pub.status === 'paused' && (
                        <button
                          onClick={() => handleStatusChange(pub.id, 'published')}
                          style={{ background: 'none', border: 'none', color: '#4ade80', cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                        >
                          <PlayCircle size={13} /> Reactivar
                        </button>
                      )}
                      {(pub.status === 'published' || pub.status === 'paused') && (
                        <button
                          onClick={() => handleStatusChange(pub.id, 'closed')}
                          style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                        >
                          <StopCircle size={13} /> Cerrar
                        </button>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => handleOpenMetrics(pub)}
                        style={{ background: 'none', border: 'none', color: '#38bdf8', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                      >
                        <BarChart2 size={13} /> MÃ©tricas
                      </button>
                      <button
                        onClick={() => handleDuplicate(pub)}
                        style={{ background: 'none', border: 'none', color: '#eab308', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                      >
                        <Copy size={13} /> Duplicar
                      </button>
                      <button
                        onClick={() => handleOpenEdit(pub)}
                        style={{ background: 'none', border: 'none', color: '#1a1a1a', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                      >
                        <Edit2 size={13} /> Editar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Wizard Crear / Editar PublicaciÃ³n */}
      {modalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(100,100,100,0.8)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999,
            padding: '1rem',
          }}
        >
          <div
            style={{
              background: '#e8e8f0827',
              border: '1px solid #374151',
              borderRadius: '16px',
              maxWidth: '680px',
              width: '100%',
              maxHeight: '92vh',
              overflowY: 'auto',
              padding: '1.75rem',
              boxShadow: '0 25px 50px rgba(100,100,100,0.6)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Megaphone size={22} color="#dc2626" />
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#e8e8f0' }}>
                  {editingPub ? 'Editar PublicaciÃ³n' : 'Crear Nueva PublicaciÃ³n de CaptaciÃ³n'}
                </h2>
              </div>
              <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', color: '#1a1a1a', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {/* Steps indicator */}
            {!editingPub && (
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                {[
                  { n: 1, label: '1. Convocatoria y Canal' },
                  { n: 2, label: '2. Contenido y Portada' },
                  { n: 3, label: '3. Beneficios y Cierre' },
                ].map((s) => (
                  <button
                    key={s.n}
                    type="button"
                    onClick={() => setStep(s.n)}
                    style={{
                      flex: 1,
                      padding: '0.5rem',
                      borderRadius: '6px',
                      background: step === s.n ? 'rgba(220,38,38,0.2)' : '#d8d8e0',
                      border: step === s.n ? '1px solid #dc2626' : '1px solid transparent',
                      color: step === s.n ? '#e8e8f0' : '#666666',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            )}

            {errorMsg && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '0.75rem', color: '#f87171', fontSize: '0.85rem', marginBottom: '1rem' }}>
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmitForm} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              {/* STEP 1: Convocatoria + Canal */}
              {(step === 1 || editingPub) && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#1a1a1a', marginBottom: '0.35rem' }}>
                      Convocatoria Oficial Asociada *
                    </label>
                    <select
                      value={jobOpeningId}
                      onChange={(e) => {
                        setJobOpeningId(e.target.value);
                        const sel = openings.find((o) => o.id === e.target.value);
                        if (sel && !title) setTitle(`Â¡Convocatoria: ${sel.title}!`);
                      }}
                      style={{ width: '100%', padding: '0.7rem 0.85rem', background: '#d8d8e0', border: '1px solid #374151', borderRadius: '8px', color: '#fff', fontSize: '0.9rem' }}
                      required
                    >
                      <option value="">-- Seleccione Convocatoria --</option>
                      {openings.map((o, idx) => (
                        <option key={o.id || `op-pub-${idx}`} value={o.id}>
                          {o.title} â€” {o.location} ({o.vacancies_count} vacantes)
                        </option>
                      ))}
                    </select>
                    <span style={{ fontSize: '0.72rem', color: '#1a1a1a', marginTop: '0.25rem', display: 'block' }}>
                      La publicaciÃ³n heredarÃ¡ los requisitos eliminatorios y de evaluaciÃ³n vigentes de esta convocatoria.
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#1a1a1a', marginBottom: '0.35rem' }}>
                        Canal de DifusiÃ³n (Opcional)
                      </label>
                      <select
                        value={channelId}
                        onChange={(e) => setChannelId(e.target.value)}
                        style={{ width: '100%', padding: '0.65rem 0.85rem', background: '#d8d8e0', border: '1px solid #374151', borderRadius: '8px', color: '#fff', fontSize: '0.85rem' }}
                      >
                        <option value="">-- Sin Canal Fijo / Multicanal --</option>
                        {channels.map((ch, idx) => (
                          <option key={ch.id || `chan-pub-${idx}`} value={ch.id}>
                            {ch.name} ({ch.type})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#1a1a1a', marginBottom: '0.35rem' }}>
                        CampaÃ±a (Opcional)
                      </label>
                      <select
                        value={campaignId}
                        onChange={(e) => setCampaignId(e.target.value)}
                        style={{ width: '100%', padding: '0.65rem 0.85rem', background: '#d8d8e0', border: '1px solid #374151', borderRadius: '8px', color: '#fff', fontSize: '0.85rem' }}
                      >
                        <option value="">-- Sin CampaÃ±a --</option>
                        {campaigns.map((ca, idx) => (
                          <option key={ca.id || `camp-pub-${idx}`} value={ca.id}>
                            {ca.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#1a1a1a', marginBottom: '0.35rem' }}>
                      CÃ³digo / Slug de la URL PÃºblica (Opcional)
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', background: '#0f172a', border: '1px solid #374151', borderRadius: '8px', padding: '0 0.75rem' }}>
                      <span style={{ color: '#0f1419', fontSize: '0.85rem', fontFamily: 'monospace' }}>/postular/p/</span>
                      <input
                        type="text"
                        value={customSlug}
                        onChange={(e) => setCustomSlug(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''))}
                        placeholder="AUTO (ej: SEC-TRU26)"
                        style={{ flex: 1, padding: '0.65rem 0.5rem', background: 'transparent', border: 'none', color: '#38bdf8', fontSize: '0.9rem', fontFamily: 'monospace', fontWeight: 700 }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: Contenido */}
              {(step === 2 || editingPub) && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#1a1a1a', marginBottom: '0.35rem' }}>
                      TÃ­tulo Atractivo para Postulantes *
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="ej: Â¡Ãšnete como Agente de Seguridad para Sede Financiera en San Isidro!"
                      style={{ width: '100%', padding: '0.65rem 0.85rem', background: '#d8d8e0', border: '1px solid #374151', borderRadius: '8px', color: '#fff', fontSize: '0.9rem', fontWeight: 600 }}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#1a1a1a', marginBottom: '0.35rem' }}>
                      DescripciÃ³n / Mensaje de AtracciÃ³n
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      placeholder="RedacciÃ³n motivadora para candidatos sobre el puesto y las condiciones..."
                      style={{ width: '100%', padding: '0.65rem 0.85rem', background: '#d8d8e0', border: '1px solid #374151', borderRadius: '8px', color: '#fff', fontSize: '0.85rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#1a1a1a', marginBottom: '0.35rem' }}>
                      URL de Imagen / Banner de Portada (Opcional)
                    </label>
                    <input
                      type="url"
                      value={bannerUrl}
                      onChange={(e) => setBannerUrl(e.target.value)}
                      placeholder="https://... /banner.jpg"
                      style={{ width: '100%', padding: '0.65rem 0.85rem', background: '#d8d8e0', border: '1px solid #374151', borderRadius: '8px', color: '#fff', fontSize: '0.85rem' }}
                    />
                  </div>
                </div>
              )}

              {/* STEP 3: Beneficios + Open Graph */}
              {(step === 3 || editingPub) && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#1a1a1a', marginBottom: '0.35rem' }}>
                      Beneficios Destacados
                    </label>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <input
                        type="text"
                        value={benefitInput}
                        onChange={(e) => setBenefitInput(e.target.value)}
                        placeholder="ej: Bono de puntualidad, capacitaciones pagadas..."
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddBenefit();
                          }
                        }}
                        style={{ flex: 1, padding: '0.55rem 0.75rem', background: '#d8d8e0', border: '1px solid #374151', borderRadius: '6px', color: '#fff', fontSize: '0.85rem' }}
                      />
                      <button
                        type="button"
                        onClick={handleAddBenefit}
                        style={{ padding: '0.55rem 0.9rem', background: '#374151', border: 'none', borderRadius: '6px', color: '#fff', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
                      >
                        + Agregar
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      {benefitsList.map((b, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0.75rem', background: '#0f172a', borderRadius: '6px', fontSize: '0.8rem', color: '#1a1a1a' }}>
                          <span>âœ“ {b}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveBenefit(idx)}
                            style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer' }}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#1a1a1a', marginBottom: '0.35rem' }}>
                      Fecha LÃ­mite de Cierre de PublicaciÃ³n (Opcional)
                    </label>
                    <input
                      type="date"
                      value={closesAt}
                      onChange={(e) => setClosesAt(e.target.value)}
                      style={{ width: '100%', padding: '0.65rem 0.85rem', background: '#d8d8e0', border: '1px solid #374151', borderRadius: '8px', color: '#fff', fontSize: '0.85rem' }}
                    />
                  </div>

                  {/* Open Graph Preview Mini */}
                  <div style={{ background: '#0f172a', border: '1px solid #374151', borderRadius: '8px', padding: '0.85rem' }}>
                    <span style={{ fontSize: '0.72rem', color: '#0f1419', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: '0.35rem' }}>
                      Vista Previa Open Graph (Facebook / WhatsApp)
                    </span>
                    <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#38bdf8' }}>
                      {ogTitle || title || 'Agentes de Seguridad â€” Security Force P&V'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#1a1a1a', marginTop: '0.2rem' }}>
                      {ogDescription || description.slice(0, 120) || 'Postula online a las mejores vacantes de seguridad.'}
                    </div>
                  </div>
                </div>
              )}

              {/* Wizard Nav & Submit Buttons */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #d8d8e0' }}>
                {!editingPub && step > 1 ? (
                  <button
                    type="button"
                    onClick={() => setStep(step - 1)}
                    style={{ padding: '0.65rem 1.1rem', borderRadius: '8px', background: 'transparent', border: '1px solid #374151', color: '#1a1a1a', cursor: 'pointer', fontWeight: 600 }}
                  >
                    â† Anterior
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    style={{ padding: '0.65rem 1.1rem', borderRadius: '8px', background: 'transparent', border: '1px solid #374151', color: '#1a1a1a', cursor: 'pointer', fontWeight: 600 }}
                  >
                    Cancelar
                  </button>
                )}

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {!editingPub && step < 3 && (
                    <button
                      type="button"
                      onClick={() => setStep(step + 1)}
                      style={{ padding: '0.65rem 1.25rem', borderRadius: '8px', background: '#3b82f6', border: 'none', color: '#fff', cursor: 'pointer', fontWeight: 700 }}
                    >
                      Siguiente â†’
                    </button>
                  )}

                  {(step === 3 || editingPub) && (
                    <button
                      type="submit"
                      disabled={formLoading}
                      style={{ padding: '0.65rem 1.35rem', borderRadius: '8px', background: '#dc2626', border: 'none', color: '#fff', cursor: formLoading ? 'not-allowed' : 'pointer', fontWeight: 800 }}
                    >
                      {formLoading ? 'Guardando...' : editingPub ? 'Guardar Cambios' : 'Guardar y Publicar'}
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal QR Code */}
      {qrModalPub && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(100,100,100,0.8)',
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
              background: '#e8e8f0827',
              border: '1px solid #374151',
              borderRadius: '16px',
              maxWidth: '420px',
              width: '100%',
              padding: '1.75rem',
              textAlign: 'center',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <QrCode size={20} color="#c084fc" />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: '#e8e8f0' }}>CÃ³digo QR para Afiches</h3>
              </div>
              <button onClick={() => setQrModalPub(null)} style={{ background: 'none', border: 'none', color: '#1a1a1a', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '0.82rem', color: '#1a1a1a', marginBottom: '1.25rem' }}>
              Escanea directamente para abrir la postulaciÃ³n en celulares sin instalar aplicaciones:
            </p>

            {/* QR Visual */}
            <div
              style={{
                width: '200px',
                height: '200px',
                margin: '0 auto 1.25rem',
                background: '#e8e8f0',
                padding: '12px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 24px rgba(100,100,100,0.5)',
              }}
            >
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                  `${window.location.origin}/postular/p/${qrModalPub.slug}`
                )}`}
                alt={`QR ${qrModalPub.slug}`}
                style={{ width: '100%', height: '100%' }}
              />
            </div>

            <div style={{ background: '#0f172a', border: '1px solid #d8d8e0', borderRadius: '8px', padding: '0.65rem', marginBottom: '1.25rem', fontFamily: 'monospace', fontSize: '0.78rem', color: '#38bdf8' }}>
              {window.location.origin}/postular/p/{qrModalPub.slug}
            </div>

            <button
              onClick={() => copyShareUrl(qrModalPub.slug)}
              style={{
                width: '100%',
                padding: '0.65rem',
                borderRadius: '8px',
                background: '#dc2626',
                border: 'none',
                color: '#fff',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              Copiar Enlace de PostulaciÃ³n
            </button>
          </div>
        </div>
      )}

      {/* Modal MÃ©tricas de PublicaciÃ³n */}
      {metricsModalPubId && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(100,100,100,0.8)',
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
              background: '#e8e8f0827',
              border: '1px solid #374151',
              borderRadius: '16px',
              maxWidth: '720px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '1.75rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <BarChart2 size={22} color="#38bdf8" />
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: '#e8e8f0' }}>
                  MÃ©tricas de Rendimiento y Calidad
                </h2>
              </div>
              <button onClick={() => setMetricsModalPubId(null)} style={{ background: 'none', border: 'none', color: '#1a1a1a', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {metricsLoading ? (
              <div style={{ textAlign: 'center', padding: '3rem 0', color: '#1a1a1a' }}>Cargando analÃ­tica...</div>
            ) : metricsData ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {/* Resumen KPIs */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
                  <div style={{ background: '#0f172a', padding: '0.85rem', borderRadius: '8px', textAlign: 'center', border: '1px solid #d8d8e0' }}>
                    <span style={{ fontSize: '0.68rem', color: '#0f1419', textTransform: 'uppercase', display: 'block' }}>Vistas Ãšnicas</span>
                    <strong style={{ fontSize: '1.2rem', color: '#e8e8f0' }}>{metricsData.summary?.unique_views || 0}</strong>
                  </div>
                  <div style={{ background: '#0f172a', padding: '0.85rem', borderRadius: '8px', textAlign: 'center', border: '1px solid #d8d8e0' }}>
                    <span style={{ fontSize: '0.68rem', color: '#0f1419', textTransform: 'uppercase', display: 'block' }}>Postulaciones</span>
                    <strong style={{ fontSize: '1.2rem', color: '#e8e8f0' }}>{metricsData.summary?.completed_count || 0}</strong>
                  </div>
                  <div style={{ background: '#0f172a', padding: '0.85rem', borderRadius: '8px', textAlign: 'center', border: '1px solid #d8d8e0' }}>
                    <span style={{ fontSize: '0.68rem', color: '#f87171', textTransform: 'uppercase', display: 'block', fontWeight: 700 }}>Aptos Prefiltro</span>
                    <strong style={{ fontSize: '1.2rem', color: '#4ade80' }}>{metricsData.summary?.apt_count || 0}</strong>
                  </div>
                  <div style={{ background: '#0f172a', padding: '0.85rem', borderRadius: '8px', textAlign: 'center', border: '1px solid #d8d8e0' }}>
                    <span style={{ fontSize: '0.68rem', color: '#0f1419', textTransform: 'uppercase', display: 'block' }}>Contratados</span>
                    <strong style={{ fontSize: '1.2rem', color: '#60a5fa' }}>{metricsData.summary?.hired_count || 0}</strong>
                  </div>
                </div>

                {/* Desglose por Canal */}
                <div>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#1a1a1a', marginBottom: '0.6rem' }}>
                    Desglose de TrÃ¡fico y Calidad por Canal
                  </h4>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #d8d8e0', color: '#0f1419', textTransform: 'uppercase', fontSize: '0.7rem' }}>
                        <th style={{ padding: '0.5rem' }}>Canal</th>
                        <th style={{ padding: '0.5rem', textAlign: 'center' }}>Vistas</th>
                        <th style={{ padding: '0.5rem', textAlign: 'center' }}>Postulaciones</th>
                        <th style={{ padding: '0.5rem', textAlign: 'center' }}>Aptos</th>
                        <th style={{ padding: '0.5rem', textAlign: 'center' }}>Calidad</th>
                      </tr>
                    </thead>
                    <tbody>
                      {metricsData.channelsBreakdown?.map((ch: any, idx: number) => (
                        <tr key={idx} style={{ borderBottom: '1px solid rgba(100,100,100,0.03)' }}>
                          <td style={{ padding: '0.6rem 0.5rem', fontWeight: 700, color: '#e8e8f0' }}>{ch.channel_name}</td>
                          <td style={{ padding: '0.6rem 0.5rem', textAlign: 'center' }}>{ch.unique_views}</td>
                          <td style={{ padding: '0.6rem 0.5rem', textAlign: 'center' }}>{ch.completed}</td>
                          <td style={{ padding: '0.6rem 0.5rem', textAlign: 'center', color: '#4ade80', fontWeight: 800 }}>{ch.apt}</td>
                          <td style={{ padding: '0.6rem 0.5rem', textAlign: 'center', fontWeight: 700 }}>{ch.quality_rate_pct}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Serie de tiempo Ãºltimos 14 dÃ­as */}
                <div>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#1a1a1a', marginBottom: '0.6rem' }}>
                    EvoluciÃ³n Diaria (Ãšltimos 14 dÃ­as)
                  </h4>
                  <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'flex-end', height: '90px', background: '#0f172a', padding: '0.75rem', borderRadius: '8px', border: '1px solid #d8d8e0' }}>
                    {metricsData.timeline?.map((day: any, idx: number) => {
                      const maxV = Math.max(...metricsData.timeline.map((t: any) => t.views || 1), 10);
                      const heightPct = Math.round((day.views / maxV) * 100);
                      return (
                        <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }} title={`${day.date_str}: ${day.views} vistas, ${day.applications} postulaciones`}>
                          <div style={{ width: '80%', height: `${Math.max(heightPct, 8)}%`, background: day.applications > 0 ? '#22c55e' : '#3b82f6', borderRadius: '2px 2px 0 0' }} />
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: '#0f1419', marginTop: '0.35rem' }}>
                    <span>Hace 14 dÃ­as</span>
                    <span style={{ color: '#22c55e' }}>â–  Con postulaciones</span>
                    <span>Hoy</span>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};





