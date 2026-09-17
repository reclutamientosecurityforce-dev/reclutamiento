import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import {
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Clock,
  Ban,
  Users,
  Activity,
  ArrowRight,
  TrendingUp,
  FileSpreadsheet,
  History,
  UserCheck
} from 'lucide-react';

interface SummaryData {
  total: number;
  available: number;
  used: number;
  reserved: number;
  cancelled: number;
  activeSessions: number;
  usedPercentage: number;
  availablePercentage: number;
}

interface RecentActivityItem {
  action: string;
  old_status?: string;
  new_status?: string;
  created_at: string;
  card_number: number;
  user_full_name?: string;
  username?: string;
}

export const AdminDashboardPage: React.FC = () => {
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        // Phase 7: Uses GET /api/cards/summary (aggregated query, NO /cards?all=true)
        const [summaryData, activityData] = await Promise.all([
          api.get<SummaryData>('/cards/summary'),
          api.get<RecentActivityItem[]>('/cards/recent-activity?limit=6'),
        ]);
        setSummary(summaryData);
        setRecentActivity(activityData);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Error al cargar dashboard');
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: '#1a1a1a' }}>
        Cargando resumen ejecutivo...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', borderRadius: 'var(--radius-lg)' }}>
        Error: {error}
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 800, color: '#1a1a1a' }}>
            Dashboard Administrativo
          </h1>
          <p style={{ fontSize: '0.9rem', color: '#1a1a1a', marginTop: '0.25rem' }}>
            Resumen ejecutivo del control de numeraciÃ³n y estado operacional
          </p>
        </div>
        <button
          className="btn-primary"
          onClick={() => navigate('/admin/cartas')}
          style={{ padding: '0.75rem 1.25rem' }}
        >
          <CreditCard size={18} />
          <span>Gestionar Matriz de Cartas</span>
          <ArrowRight size={16} />
        </button>
      </div>

      {/* â”€â”€â”€ KPIs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1.25rem',
          marginBottom: '2rem',
        }}
      >
        {/* Total */}
        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="stat-label">Total Cartas</span>
            <CreditCard size={20} color="#818cf8" />
          </div>
          <div className="stat-value" style={{ color: '#1a1a1a' }}>
            {summary?.total?.toLocaleString() ?? 0}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#0f1419' }}>Rango activo</span>
        </div>

        {/* Disponibles */}
        <div className="stat-card" style={{ borderLeft: '4px solid #10b981' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="stat-label">Disponibles</span>
            <CheckCircle2 size={20} color="#10b981" />
          </div>
          <div className="stat-value" style={{ color: '#34d399' }}>
            {summary?.available?.toLocaleString() ?? 0}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#34d399' }}>
            {summary?.availablePercentage}% del total
          </span>
        </div>

        {/* Utilizadas */}
        <div className="stat-card" style={{ borderLeft: '4px solid #ef4444' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="stat-label">Utilizadas</span>
            <AlertCircle size={20} color="#ef4444" />
          </div>
          <div className="stat-value" style={{ color: '#f87171' }}>
            {summary?.used?.toLocaleString() ?? 0}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#f87171' }}>
            {summary?.usedPercentage}% del total
          </span>
        </div>

        {/* Reservadas */}
        <div className="stat-card" style={{ borderLeft: '4px solid #f59e0b' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="stat-label">Reservadas</span>
            <Clock size={20} color="#f59e0b" />
          </div>
          <div className="stat-value" style={{ color: '#fbbf24' }}>
            {summary?.reserved?.toLocaleString() ?? 0}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#fbbf24' }}>En proceso</span>
        </div>

        {/* Anuladas */}
        <div className="stat-card" style={{ borderLeft: '4px solid #64748b' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="stat-label">Anuladas</span>
            <Ban size={20} color="#64748b" />
          </div>
          <div className="stat-value" style={{ color: '#1a1a1a' }}>
            {summary?.cancelled?.toLocaleString() ?? 0}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#0f1419' }}>Inutilizables</span>
        </div>

        {/* Sesiones Activas */}
        <div className="stat-card" style={{ borderLeft: '4px solid #6366f1' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="stat-label">Sesiones Activas</span>
            <Users size={20} color="#6366f1" />
          </div>
          <div className="stat-value" style={{ color: '#a5b4fc' }}>
            {summary?.activeSessions ?? 0}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#818cf8' }}>Usuarios conectados</span>
        </div>
      </div>

      {/* â”€â”€â”€ PROGRESO & ACCESOS RÃPIDOS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Progreso del Rango */}
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <TrendingUp size={20} color="#818cf8" />
            <h3 style={{ fontSize: '1.1rem', color: '#1a1a1a' }}>Progreso de UtilizaciÃ³n del Rango</h3>
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
              <span style={{ color: '#1a1a1a' }}>Cartas Utilizadas ({summary?.usedPercentage}%)</span>
              <span style={{ color: '#f87171', fontWeight: 700 }}>{summary?.used} / {summary?.total}</span>
            </div>
            <div style={{ height: '10px', background: '#e8e8f0', borderRadius: '9999px', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${summary?.usedPercentage ?? 0}%`,
                  background: 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)',
                  borderRadius: '9999px',
                  transition: 'width 0.5s ease',
                }}
              />
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
              <span style={{ color: '#1a1a1a' }}>Cartas Disponibles ({summary?.availablePercentage}%)</span>
              <span style={{ color: '#34d399', fontWeight: 700 }}>{summary?.available} / {summary?.total}</span>
            </div>
            <div style={{ height: '10px', background: '#e8e8f0', borderRadius: '9999px', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${summary?.availablePercentage ?? 0}%`,
                  background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
                  borderRadius: '9999px',
                  transition: 'width 0.5s ease',
                }}
              />
            </div>
          </div>
        </div>

        {/* Accesos RÃ¡pidos */}
        <div className="glass-panel" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <h3 style={{ fontSize: '1.1rem', color: '#1a1a1a', marginBottom: '0.5rem' }}>
            Accesos RÃ¡pidos
          </h3>
          <button
            onClick={() => navigate('/admin/cartas')}
            className="btn-secondary"
            style={{ justifyContent: 'flex-start', padding: '0.65rem 1rem' }}
          >
            <CreditCard size={18} color="#818cf8" />
            <span>Gestionar Cartas</span>
          </button>
          <button
            onClick={() => navigate('/admin/users')}
            className="btn-secondary"
            style={{ justifyContent: 'flex-start', padding: '0.65rem 1rem' }}
          >
            <Users size={18} color="#34d399" />
            <span>Gestionar Usuarios</span>
          </button>
          <button
            onClick={() => navigate('/admin/audit')}
            className="btn-secondary"
            style={{ justifyContent: 'flex-start', padding: '0.65rem 1rem' }}
          >
            <History size={18} color="#fbbf24" />
            <span>Ver AuditorÃ­a</span>
          </button>
          <button
            onClick={() => navigate('/admin/sessions')}
            className="btn-secondary"
            style={{ justifyContent: 'flex-start', padding: '0.65rem 1rem' }}
          >
            <UserCheck size={18} color="#a5b4fc" />
            <span>Ver Sesiones</span>
          </button>
          <button
            onClick={() => navigate('/admin/reports')}
            className="btn-secondary"
            style={{ justifyContent: 'flex-start', padding: '0.65rem 1rem' }}
          >
            <FileSpreadsheet size={18} color="#38bdf8" />
            <span>Ver Reportes</span>
          </button>
        </div>
      </div>

      {/* â”€â”€â”€ ACTIVIDAD RECIENTE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="glass-panel" style={{ padding: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity size={20} color="#818cf8" />
            <h3 style={{ fontSize: '1.1rem', color: '#1a1a1a' }}>Actividad Reciente del Sistema</h3>
          </div>
          <button
            onClick={() => navigate('/admin/audit')}
            style={{ background: 'transparent', color: '#818cf8', fontSize: '0.85rem', fontWeight: 600 }}
          >
            Ver registro completo â†’
          </button>
        </div>

        {recentActivity.length === 0 ? (
          <p style={{ color: '#0f1419', fontSize: '0.875rem' }}>No hay actividad registrada recientemente.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {recentActivity.map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.85rem 1.25rem',
                  background: 'var(--bg-surface-elevated)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: 'rgba(99, 102, 241, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#818cf8',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                    }}
                  >
                    {item.card_number}
                  </div>
                  <div>
                    <p style={{ fontSize: '0.9rem', fontWeight: 600, color: '#1a1a1a' }}>
                      {item.user_full_name || item.username || 'Usuario'}{' '}
                      <span style={{ fontWeight: 400, color: '#1a1a1a' }}>
                        {item.action === 'card_used'
                          ? `utilizÃ³ la carta N.Âº ${item.card_number}`
                          : item.action === 'card_reserved'
                          ? `reservÃ³ la carta N.Âº ${item.card_number}`
                          : item.action === 'card_corrected'
                          ? `corrigiÃ³ la carta N.Âº ${item.card_number}`
                          : `operÃ³ carta N.Âº ${item.card_number}`}
                      </span>
                    </p>
                    <span style={{ fontSize: '0.75rem', color: '#0f1419' }}>
                      {new Date(item.created_at).toLocaleString('es-PE')}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};





