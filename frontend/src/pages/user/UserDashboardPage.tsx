import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import {
  CreditCard,
  CheckCircle2,
  Clock,
  ArrowRight,
  Layers,
  FileText,
} from 'lucide-react';

interface MyCardsSummary {
  available: string;
  used_by_me: string;
  last_used_number: string;
  last_used_at: string;
}

interface RecentCard {
  number: number;
  status: string;
  used_at: string;
  observations?: string;
}

interface CurrentRange {
  name: string;
  range_start: number;
  range_end: number;
}

interface UserDashboardData {
  summary: MyCardsSummary;
  recentCards: RecentCard[];
  currentRange: CurrentRange | null;
}

export const UserDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<UserDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadUserData() {
      try {
        setLoading(true);
        // Phase 8: Uses /cards/my (NO /cards?all=true, NO CardGrid in Dashboard)
        const res = await api.get<UserDashboardData>('/cards/my?limit=10');
        setData(res);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Error al cargar dashboard');
      } finally {
        setLoading(false);
      }
    }
    loadUserData();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
        Cargando resumen de usuario...
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
      {/* Header with Call to Action */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 800, color: '#f8fafc' }}>
            Bienvenido, {user?.fullName || user?.username}
          </h1>
          <p style={{ fontSize: '0.9rem', color: '#94a3b8', marginTop: '0.25rem' }}>
            Panel de control operativo — Security Force S.A.C.
          </p>
        </div>

        {/* Primary Action Button */}
        <button
          className="btn-primary"
          onClick={() => navigate('/app/cartas')}
          style={{ padding: '0.85rem 1.75rem', fontSize: '1rem', boxShadow: '0 4px 20px rgba(79, 70, 229, 0.4)' }}
        >
          <CreditCard size={20} />
          <span>IR A LA MATRIZ DE CARTAS →</span>
        </button>
      </div>

      {/* ─── MIS INDICADORES ─────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1.25rem',
          marginBottom: '2rem',
        }}
      >
        {/* Cartas Disponibles */}
        <div className="stat-card" style={{ borderLeft: '4px solid #10b981' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="stat-label">Cartas Disponibles</span>
            <CheckCircle2 size={20} color="#10b981" />
          </div>
          <div className="stat-value" style={{ color: '#34d399' }}>
            {data?.summary?.available ?? 0}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Listas para emisión</span>
        </div>

        {/* Cartas Utilizadas por Mí */}
        <div className="stat-card" style={{ borderLeft: '4px solid #6366f1' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="stat-label">Utilizadas por Mí</span>
            <CreditCard size={20} color="#818cf8" />
          </div>
          <div className="stat-value" style={{ color: '#818cf8' }}>
            {data?.summary?.used_by_me ?? 0}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Mis emisiones</span>
        </div>

        {/* Última Carta Utilizada */}
        <div className="stat-card" style={{ borderLeft: '4px solid #f59e0b' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="stat-label">Última Utilizada</span>
            <Clock size={20} color="#f59e0b" />
          </div>
          <div className="stat-value" style={{ color: '#fbbf24' }}>
            {data?.summary?.last_used_number ? `N.º ${data.summary.last_used_number}` : 'Ninguna'}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
            {data?.summary?.last_used_at
              ? new Date(data.summary.last_used_at).toLocaleDateString('es-PE')
              : 'Sin registros'}
          </span>
        </div>

        {/* Rango Actual */}
        <div className="stat-card" style={{ borderLeft: '4px solid #38bdf8' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="stat-label">Rango Actual</span>
            <Layers size={20} color="#38bdf8" />
          </div>
          <div className="stat-value" style={{ color: '#38bdf8', fontSize: '1.75rem' }}>
            {data?.currentRange ? `${data.currentRange.range_start} - ${data.currentRange.range_end}` : 'N/A'}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
            {data?.currentRange?.name || 'Rango asignado'}
          </span>
        </div>
      </div>

      {/* ─── ACTIVIDAD RECIENTE (MIS ÚLTIMAS CARTAS) ─────────────────────────── */}
      <div className="glass-panel" style={{ padding: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={20} color="#818cf8" />
            <h3 style={{ fontSize: '1.1rem', color: '#f8fafc' }}>Mis Cartas Utilizadas Recientes</h3>
          </div>
          <button
            onClick={() => navigate('/app/cartas')}
            style={{
              background: 'transparent',
              color: '#818cf8',
              fontSize: '0.85rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
            }}
          >
            <span>Ver matriz completa</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {(!data?.recentCards || data.recentCards.length === 0) ? (
          <div style={{ padding: '2.5rem', textAlign: 'center', color: '#64748b' }}>
            <p>Aún no has utilizado ninguna carta de numeración.</p>
            <button
              className="btn-primary"
              onClick={() => navigate('/app/cartas')}
              style={{ marginTop: '1rem', padding: '0.6rem 1.25rem', fontSize: '0.875rem' }}
            >
              Ir a emitir mi primera carta
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: '#94a3b8', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Número</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Fecha</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Hora</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Estado</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Observación</th>
                </tr>
              </thead>
              <tbody>
                {data.recentCards.map((card, idx) => (
                  <tr
                    key={idx}
                    style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}
                  >
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 800, color: '#f8fafc', fontSize: '1.05rem' }}>
                      N.º {card.number}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: '#cbd5e1' }}>
                      {new Date(card.used_at).toLocaleDateString('es-PE')}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: '#94a3b8' }}>
                      {new Date(card.used_at).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span className="badge badge-used">🔴 Utilizada</span>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: '#94a3b8' }}>
                      {card.observations || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
