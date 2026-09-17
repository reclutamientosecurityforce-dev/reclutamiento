import React, { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { UserCheck, Monitor, XCircle } from 'lucide-react';

interface SessionData {
  id: string;
  user_id: string;
  is_active: boolean;
  ip_address?: string;
  user_agent?: string;
  expires_at: string;
  created_at: string;
  last_seen_at: string;
  username: string;
  full_name?: string;
  email: string;
}

export const AdminSessionsPage: React.FC = () => {
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const res = await api.get<{ data: SessionData[] }>('/admin/sessions');
      setSessions(res.data || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al cargar sesiones');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleTerminateSession = async (sessionId: string, username: string) => {
    if (!confirm(`¿Desea cerrar remotamente la sesión de ${username}?`)) return;
    try {
      await api.delete(`/admin/sessions/${sessionId}`);
      fetchSessions();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error al terminar sesión');
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 800, color: '#f8fafc' }}>
          Sesiones Activas
        </h1>
        <p style={{ fontSize: '0.9rem', color: '#94a3b8', marginTop: '0.25rem' }}>
          Control y terminación remota de sesiones concurrentes en PostgreSQL
        </p>
      </div>

      {error && (
        <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ padding: '4rem', textAlign: 'center', color: '#94a3b8' }}>
          Cargando sesiones activas...
        </div>
      ) : sessions.length === 0 ? (
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
          No hay sesiones activas en este momento.
        </div>
      ) : (
        <div className="glass-panel" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: '#94a3b8', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <th style={{ padding: '1rem 1.25rem' }}>Usuario</th>
                <th style={{ padding: '1rem 1.25rem' }}>IP / Dispositivo</th>
                <th style={{ padding: '1rem 1.25rem' }}>Inicio de Sesión</th>
                <th style={{ padding: '1rem 1.25rem' }}>Última Actividad</th>
                <th style={{ padding: '1rem 1.25rem' }}>Expira En</th>
                <th style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => (
                <tr key={s.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: 'rgba(99, 102, 241, 0.15)',
                          color: '#818cf8',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <UserCheck size={16} />
                      </div>
                      <div>
                        <p style={{ fontWeight: 600, color: '#f8fafc' }}>{s.full_name || s.username}</p>
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>@{s.username}</span>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#cbd5e1', fontSize: '0.825rem' }}>
                      <Monitor size={14} color="#94a3b8" />
                      <span>{s.ip_address || 'IP no registrada'}</span>
                    </div>
                    <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.user_agent || 'Browser standard'}
                    </span>
                  </td>
                  <td style={{ padding: '1rem 1.25rem', color: '#94a3b8', fontSize: '0.8rem' }}>
                    {new Date(s.created_at).toLocaleString('es-PE')}
                  </td>
                  <td style={{ padding: '1rem 1.25rem', color: '#34d399', fontSize: '0.8rem', fontWeight: 600 }}>
                    {new Date(s.last_seen_at).toLocaleTimeString('es-PE')}
                  </td>
                  <td style={{ padding: '1rem 1.25rem', color: '#94a3b8', fontSize: '0.8rem' }}>
                    {new Date(s.expires_at).toLocaleString('es-PE')}
                  </td>
                  <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                    <button
                      onClick={() => handleTerminateSession(s.id, s.username)}
                      className="btn-danger"
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
                    >
                      <XCircle size={14} />
                      <span>Cerrar Sesión</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
