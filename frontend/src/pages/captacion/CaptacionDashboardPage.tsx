import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import {
  Megaphone,
  Layers,
  Briefcase,
  Share2,
  TrendingUp,
  Target,
  Users,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Award,
  ArrowRight,
  Filter,
  Plus,
  BarChart3,
  ExternalLink,
  Sparkles,
  RefreshCw,
} from 'lucide-react';

interface CaptacionSummary {
  total_publications: number;
  active_publications: number;
  paused_publications: number;
  closed_publications: number;
  total_views: number;
  unique_views: number;
  bot_views: number;
  views_7d: number;
  views_30d: number;
  total_applications: number;
  completed_applications: number;
  apt_applications: number;
  review_applications: number;
  ineligible_applications: number;
  interviewed_applications: number;
  hired_applications: number;
  apps_7d: number;
  avg_prefilter_score: number;
  global_quality_rate_pct: number;
  global_conversion_rate_pct: number;
}

interface ChannelFunnelItem {
  channel_id: string;
  channel_name: string;
  channel_type: string;
  views: number;
  unique_views: number;
  started: number;
  completed: number;
  apt: number;
  review: number;
  ineligible: number;
  interviewed: number;
  hired: number;
  avg_score: number;
  quality_rate_pct: number;
  conversion_rate_pct: number;
}

interface CategoryStat {
  category_id: string;
  category_name: string;
  category_icon: string;
  category_color: string;
  openings_count: number;
  publications_count: number;
  applications_count: number;
  apt_count: number;
  hired_count: number;
  avg_score: number;
  quality_rate_pct: number;
}

export const CaptacionDashboardPage: React.FC = () => {
  const [summary, setSummary] = useState<CaptacionSummary | null>(null);
  const [funnel, setFunnel] = useState<ChannelFunnelItem[]>([]);
  const [categories, setCategories] = useState<CategoryStat[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  async function loadData() {
    try {
      setLoading(true);
      const [sumRes, funRes, catRes] = await Promise.all([
        api.get<CaptacionSummary>('/recruitment/captacion/summary'),
        api.get<ChannelFunnelItem[]>('/recruitment/captacion/funnel'),
        api.get<CategoryStat[]>('/recruitment/captacion/category-stats'),
      ]);
      setSummary(sumRes);
      setFunnel(funRes || []);
      setCategories(catRes || []);
    } catch (err) {
      console.error('Error al cargar dashboard de captación:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1400px', margin: '0 auto', color: '#f8fafc' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
            <div style={{ padding: '0.5rem', borderRadius: '10px', background: 'linear-gradient(135deg, rgba(220,38,38,0.2), rgba(185,28,28,0.05))', border: '1px solid rgba(220,38,38,0.4)', color: '#f87171' }}>
              <Megaphone size={22} />
            </div>
            <h1 style={{ fontSize: '1.65rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em', color: '#ffffff' }}>
              Centro de Captación y Atracción de Talento
            </h1>
          </div>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: 0 }}>
            Monitoreo en tiempo real de canales, campañas, calidad de postulantes y conversión empresarial.
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => loadData()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.6rem 0.9rem',
              borderRadius: '8px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#cbd5e1',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.85rem',
            }}
          >
            <RefreshCw size={15} />
            <span>Actualizar</span>
          </button>

          <button
            onClick={() => navigate('/recruitment/captacion/categorias')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.6rem 1rem',
              borderRadius: '8px',
              background: 'rgba(37,99,235,0.15)',
              border: '1px solid rgba(37,99,235,0.4)',
              color: '#60a5fa',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.85rem',
            }}
          >
            <Layers size={16} />
            <span>+ Categoría</span>
          </button>

          <button
            onClick={() => navigate('/recruitment/openings')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.6rem 1rem',
              borderRadius: '8px',
              background: 'rgba(124,58,237,0.15)',
              border: '1px solid rgba(124,58,237,0.4)',
              color: '#c084fc',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.85rem',
            }}
          >
            <Briefcase size={16} />
            <span>+ Convocatoria</span>
          </button>

          <button
            onClick={() => navigate('/recruitment/captacion/publicaciones')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.6rem 1.1rem',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
              border: '1px solid rgba(220,38,38,0.6)',
              color: '#ffffff',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.85rem',
              boxShadow: '0 4px 14px rgba(220,38,38,0.3)',
            }}
          >
            <Plus size={16} />
            <span>+ Crear Publicación</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 0', color: '#94a3b8' }}>
          <RefreshCw size={32} className="animate-spin" style={{ margin: '0 auto 1rem', display: 'block', color: '#dc2626' }} />
          <span>Cargando analítica del centro de captación...</span>
        </div>
      ) : (
        <>
          {/* Main KPI Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
            {/* KPI 1: Publicaciones Activas */}
            <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '12px', padding: '1.2rem', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: '#3b82f6' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Publicaciones Activas</span>
                <Megaphone size={18} color="#3b82f6" />
              </div>
              <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#ffffff', lineHeight: 1.1 }}>
                {summary?.active_publications || 0}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.35rem' }}>
                De un total de {summary?.total_publications || 0} publicaciones
              </div>
            </div>

            {/* KPI 2: Vistas Únicas Estimadas */}
            <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '12px', padding: '1.2rem', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: '#8b5cf6' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Vistas Únicas (Est.)</span>
                <Eye size={18} color="#8b5cf6" />
              </div>
              <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#ffffff', lineHeight: 1.1 }}>
                {summary?.unique_views?.toLocaleString() || 0}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.35rem' }}>
                {summary?.total_views?.toLocaleString() || 0} vistas totales ({summary?.views_7d || 0} en 7d)
              </div>
            </div>

            {/* KPI 3: Postulaciones Completadas */}
            <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '12px', padding: '1.2rem', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: '#10b981' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Postulaciones</span>
                <Users size={18} color="#10b981" />
              </div>
              <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#ffffff', lineHeight: 1.1 }}>
                {summary?.completed_applications || 0}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.35rem' }}>
                {summary?.total_applications || 0} iniciadas ({summary?.global_conversion_rate_pct || 0}% conversión)
              </div>
            </div>

            {/* KPI 4: Candidatos Aptos (Calidad de Captación) */}
            <div style={{ background: '#111827', border: '1px solid rgba(220,38,38,0.3)', borderRadius: '12px', padding: '1.2rem', position: 'relative', overflow: 'hidden', boxShadow: '0 0 15px rgba(220,38,38,0.08)' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: '#dc2626' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.78rem', color: '#f87171', fontWeight: 800, textTransform: 'uppercase' }}>Aptos / Calidad</span>
                <Award size={18} color="#dc2626" />
              </div>
              <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#ffffff', lineHeight: 1.1 }}>
                {summary?.apt_applications || 0}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#fca5a5', marginTop: '0.35rem', fontWeight: 700 }}>
                {summary?.global_quality_rate_pct || 0}% tasa de aptitud global
              </div>
            </div>

            {/* KPI 5: Contratados */}
            <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '12px', padding: '1.2rem', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: '#eab308' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Contratados</span>
                <CheckCircle2 size={18} color="#eab308" />
              </div>
              <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#ffffff', lineHeight: 1.1 }}>
                {summary?.hired_applications || 0}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.35rem' }}>
                {summary?.interviewed_applications || 0} en etapa entrevista
              </div>
            </div>
          </div>

          {/* Section: ¿QUÉ CANAL ME TRAE MEJORES CANDIDATOS? (Comparativa Empresarial) */}
          <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '14px', padding: '1.5rem', marginBottom: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <TrendingUp size={20} color="#dc2626" />
                  <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: '#ffffff' }}>
                    ¿Qué canal genera los mejores candidatos? — Matriz de Calidad y Retorno
                  </h2>
                </div>
                <p style={{ fontSize: '0.82rem', color: '#94a3b8', margin: '0.25rem 0 0 0' }}>
                  Medición empresarial de volumen vs calidad real (candidatos que superan el prefiltro y llegan a contratación).
                </p>
              </div>

              <button
                onClick={() => navigate('/recruitment/captacion/canales')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.45rem 0.8rem',
                  borderRadius: '6px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid #374151',
                  color: '#cbd5e1',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                <span>Administrar Canales</span>
                <ArrowRight size={14} />
              </button>
            </div>

            {funnel.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 0', color: '#64748b', fontSize: '0.9rem' }}>
                Aún no hay suficiente actividad registrada por canales. Crea una publicación y compártela.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #1f2937', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                      <th style={{ padding: '0.75rem 1rem' }}>Canal de Difusión</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Vistas Únicas</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Iniciadas</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Completadas</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Aptos Prefiltro</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>En Revisión</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Contratados</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Tasa de Calidad</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Conversión</th>
                    </tr>
                  </thead>
                  <tbody>
                    {funnel.map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.15s' }}>
                        <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#f8fafc' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <span
                              style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                background:
                                  item.channel_type === 'facebook'
                                    ? '#1877f2'
                                    : item.channel_type === 'qr'
                                    ? '#10b981'
                                    : item.channel_type === 'whatsapp'
                                    ? '#22c55e'
                                    : item.channel_type === 'web'
                                    ? '#0284c7'
                                    : '#8b5cf6',
                              }}
                            />
                            <span>{item.channel_name}</span>
                            <span style={{ fontSize: '0.68rem', padding: '0.15rem 0.4rem', borderRadius: '4px', background: '#1f2937', color: '#94a3b8', textTransform: 'uppercase' }}>
                              {item.channel_type}
                            </span>
                          </div>
                        </td>
                        <td style={{ padding: '0.85rem 1rem', textAlign: 'center', color: '#cbd5e1' }}>
                          {item.unique_views.toLocaleString()}
                        </td>
                        <td style={{ padding: '0.85rem 1rem', textAlign: 'center', color: '#94a3b8' }}>
                          {item.started}
                        </td>
                        <td style={{ padding: '0.85rem 1rem', textAlign: 'center', fontWeight: 600, color: '#f8fafc' }}>
                          {item.completed}
                        </td>
                        <td style={{ padding: '0.85rem 1rem', textAlign: 'center', fontWeight: 800, color: '#4ade80' }}>
                          {item.apt}
                        </td>
                        <td style={{ padding: '0.85rem 1rem', textAlign: 'center', color: '#facc15' }}>
                          {item.review}
                        </td>
                        <td style={{ padding: '0.85rem 1rem', textAlign: 'center', fontWeight: 800, color: '#60a5fa' }}>
                          {item.hired}
                        </td>
                        {/* Calidad: barra visual */}
                        <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ width: '60px', height: '6px', borderRadius: '3px', background: '#1f2937', overflow: 'hidden' }}>
                              <div
                                style={{
                                  width: `${Math.min(item.quality_rate_pct, 100)}%`,
                                  height: '100%',
                                  background: item.quality_rate_pct >= 50 ? '#22c55e' : item.quality_rate_pct >= 30 ? '#eab308' : '#ef4444',
                                }}
                              />
                            </div>
                            <span style={{ fontWeight: 700, color: item.quality_rate_pct >= 50 ? '#4ade80' : '#cbd5e1' }}>
                              {item.quality_rate_pct}%
                            </span>
                          </div>
                        </td>
                        <td style={{ padding: '0.85rem 1rem', textAlign: 'center', color: '#94a3b8', fontWeight: 600 }}>
                          {item.conversion_rate_pct}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Section: Distribución por Categoría */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
            <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '14px', padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Layers size={18} color="#3b82f6" />
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: '#ffffff' }}>
                    Categorías de Puesto — Demanda y Calidad
                  </h3>
                </div>
                <button
                  onClick={() => navigate('/recruitment/captacion/categorias')}
                  style={{ background: 'none', border: 'none', color: '#60a5fa', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 600 }}
                >
                  Ver todas →
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {categories.map((cat) => (
                  <div
                    key={cat.category_id}
                    style={{
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid #1f2937',
                      borderRadius: '8px',
                      padding: '0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: cat.category_color || '#3b82f6' }} />
                        <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#ffffff' }}>{cat.category_name}</span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {cat.openings_count} convocatorias | {cat.publications_count} publicaciones
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#4ade80' }}>
                        {cat.apt_count} aptos <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 500 }}>({cat.applications_count} post.)</span>
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                        Tasa de Calidad: <strong>{cat.quality_rate_pct}%</strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Links / Guide */}
            <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '14px', padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <Sparkles size={18} color="#eab308" />
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: '#ffffff' }}>
                    Arquitectura Empresarial de Captación
                  </h3>
                </div>
                <p style={{ fontSize: '0.82rem', color: '#94a3b8', lineHeight: 1.5, margin: '0 0 1rem 0' }}>
                  El flujo jerárquico asegura que una sola <strong>Convocatoria</strong> pueda difundirse en múltiples <strong>Publicaciones y Canales</strong> (Facebook, QR, WhatsApp, Web), conservando la trazabilidad de origen y alimentando el motor de prefiltro con fuente única de requisitos.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8rem', color: '#cbd5e1' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', background: '#0f172a', borderRadius: '6px' }}>
                    <span style={{ color: '#60a5fa', fontWeight: 700 }}>1. Categoría</span>
                    <span style={{ color: '#64748b' }}>→</span>
                    <span>Plantilla de requisitos sugeridos</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', background: '#0f172a', borderRadius: '6px' }}>
                    <span style={{ color: '#c084fc', fontWeight: 700 }}>2. Convocatoria</span>
                    <span style={{ color: '#64748b' }}>→</span>
                    <span>Necesidad real + versión oficial de requisitos</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', background: '#0f172a', borderRadius: '6px' }}>
                    <span style={{ color: '#f87171', fontWeight: 700 }}>3. Publicación</span>
                    <span style={{ color: '#64748b' }}>→</span>
                    <span>URL pública, QR, Open Graph y Canal</span>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid #1f2937', display: 'flex', gap: '0.75rem' }}>
                <button
                  onClick={() => navigate('/recruitment/captacion/publicaciones')}
                  style={{
                    flex: 1,
                    padding: '0.65rem',
                    background: '#dc2626',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                  }}
                >
                  <Megaphone size={16} />
                  <span>Ver Publicaciones</span>
                </button>
                <button
                  onClick={() => window.open('/postular', '_blank')}
                  style={{
                    padding: '0.65rem 0.9rem',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#cbd5e1',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                  }}
                >
                  <ExternalLink size={15} />
                  <span>Portal Público</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
