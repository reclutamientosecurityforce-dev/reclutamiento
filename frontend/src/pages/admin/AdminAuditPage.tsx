import React, { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface AuditItem {
  id: string;
  action: string;
  resource?: string;
  resource_id?: string;
  details?: Record<string, unknown>;
  ip_address?: string;
  success: boolean;
  error_message?: string;
  created_at: string;
  username?: string;
  user_full_name?: string;
}

export const AdminAuditPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchAuditLogs = async (currentPage = 1, action = '') => {
    try {
      setLoading(true);
      let url = `/admin/audit?page=${currentPage}&limit=25`;
      if (action) url += `&action=${action}`;
      const res = await api.get<{ data: AuditItem[]; pagination: { totalPages: number } }>(url);
      setLogs(res.data || []);
      setTotalPages(res.pagination?.totalPages || 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs(page, actionFilter);
  }, [page, actionFilter]);

  const getActionBadge = (action: string) => {
    const colors: Record<string, { bg: string; text: string }> = {
      login: { bg: 'rgba(16, 185, 129, 0.15)', text: '#34d399' },
      logout: { bg: 'rgba(100, 116, 139, 0.15)', text: '#1a1a1a' },
      card_used: { bg: 'rgba(239, 68, 68, 0.15)', text: '#f87171' },
      card_reserved: { bg: 'rgba(245, 158, 11, 0.15)', text: '#fbbf24' },
      card_corrected: { bg: 'rgba(99, 102, 241, 0.15)', text: '#818cf8' },
      user_created: { bg: 'rgba(14, 165, 233, 0.15)', text: '#38bdf8' },
      cards_generated: { bg: 'rgba(168, 85, 247, 0.15)', text: '#c084fc' },
      session_terminated: { bg: 'rgba(239, 68, 68, 0.2)', text: '#ef4444' },
    };

    const style = colors[action] || { bg: '#d8d8e0', text: '#1a1a1a' };

    return (
      <span
        style={{
          background: style.bg,
          color: style.text,
          padding: '0.25rem 0.6rem',
          borderRadius: '4px',
          fontSize: '0.75rem',
          fontWeight: 700,
          textTransform: 'uppercase',
        }}
      >
        {action.replace('_', ' ')}
      </span>
    );
  };

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 800, color: '#1a1a1a' }}>
          Registro de AuditorÃ­a
        </h1>
        <p style={{ fontSize: '0.9rem', color: '#1a1a1a', marginTop: '0.25rem' }}>
          Pista de auditorÃ­a inmutable de todas las operaciones del sistema
        </p>
      </div>

      {/* Filter bar */}
      <div className="glass-panel" style={{ padding: '1rem 1.5rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem' }}>
        <select
          value={actionFilter}
          onChange={(e) => {
            setActionFilter(e.target.value);
            setPage(1);
          }}
          style={{ minWidth: '200px' }}
        >
          <option value="">Todas las acciones</option>
          <option value="card_used">Uso de Carta</option>
          <option value="card_reserved">Reserva de Carta</option>
          <option value="card_corrected">CorrecciÃ³n de Carta</option>
          <option value="user_created">Usuario Creado</option>
          <option value="cards_generated">Cartas Generadas</option>
          <option value="login">Inicio de SesiÃ³n</option>
          <option value="logout">Cierre de SesiÃ³n</option>
          <option value="session_terminated">SesiÃ³n Terminada</option>
        </select>
      </div>

      {loading ? (
        <div style={{ padding: '4rem', textAlign: 'center', color: '#1a1a1a' }}>
          Cargando logs de auditorÃ­a...
        </div>
      ) : (
        <div className="glass-panel" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: '#1a1a1a', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <th style={{ padding: '1rem 1.25rem' }}>Fecha y Hora</th>
                <th style={{ padding: '1rem 1.25rem' }}>Usuario</th>
                <th style={{ padding: '1rem 1.25rem' }}>AcciÃ³n</th>
                <th style={{ padding: '1rem 1.25rem' }}>Recurso</th>
                <th style={{ padding: '1rem 1.25rem' }}>Detalles</th>
                <th style={{ padding: '1rem 1.25rem' }}>IP</th>
                <th style={{ padding: '1rem 1.25rem', textAlign: 'center' }}>Resultado</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                  <td style={{ padding: '1rem 1.25rem', color: '#1a1a1a', fontSize: '0.8rem' }}>
                    {new Date(log.created_at).toLocaleString('es-PE')}
                  </td>
                  <td style={{ padding: '1rem 1.25rem', fontWeight: 600, color: '#1a1a1a' }}>
                    {log.user_full_name || log.username || 'Sistema'}
                  </td>
                  <td style={{ padding: '1rem 1.25rem' }}>{getActionBadge(log.action)}</td>
                  <td style={{ padding: '1rem 1.25rem', color: '#1a1a1a' }}>
                    {log.resource || '-'}
                  </td>
                  <td style={{ padding: '1rem 1.25rem', color: '#1a1a1a', fontSize: '0.78rem', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {log.details ? JSON.stringify(log.details) : '-'}
                  </td>
                  <td style={{ padding: '1rem 1.25rem', color: '#0f1419', fontSize: '0.78rem' }}>
                    {log.ip_address || '-'}
                  </td>
                  <td style={{ padding: '1rem 1.25rem', textAlign: 'center' }}>
                    <span
                      style={{
                        padding: '0.2rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        background: log.success ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                        color: log.success ? '#34d399' : '#f87171',
                      }}
                    >
                      {log.success ? 'Ã‰xito' : 'Fallo'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem' }}>
        <span style={{ fontSize: '0.85rem', color: '#1a1a1a' }}>
          PÃ¡gina {page} de {totalPages}
        </span>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            className="btn-secondary"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            style={{ padding: '0.4rem 0.75rem' }}
          >
            <ChevronLeft size={16} />
            <span>Anterior</span>
          </button>
          <button
            className="btn-secondary"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            style={{ padding: '0.4rem 0.75rem' }}
          >
            <span>Siguiente</span>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};





