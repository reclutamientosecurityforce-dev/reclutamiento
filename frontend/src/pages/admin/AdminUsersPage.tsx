import React, { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { UserPlus, Shield, User, X } from 'lucide-react';

interface UserData {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'user';
  full_name?: string;
  is_active: boolean;
  last_login_at?: string;
  created_at: string;
}

export const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form state
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'admin' | 'user'>('user');

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get<{ data: UserData[] }>('/admin/users');
      setUsers(res.data || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormLoading(true);

    try {
      await api.post('/admin/users', { username, email, password, fullName, role });
      setModalOpen(false);
      setUsername('');
      setEmail('');
      setPassword('');
      setFullName('');
      setRole('user');
      fetchUsers();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Error al crear usuario');
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggleStatus = async (user: UserData) => {
    try {
      if (user.is_active) {
        if (!confirm(`¿Desactivar al usuario ${user.username}?`)) return;
        await api.delete(`/admin/users/${user.id}`);
      } else {
        await api.put(`/admin/users/${user.id}`, { isActive: true });
      }
      fetchUsers();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error al cambiar estado');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 800, color: '#f8fafc' }}>
            Gestión de Usuarios
          </h1>
          <p style={{ fontSize: '0.9rem', color: '#94a3b8', marginTop: '0.25rem' }}>
            Administración de cuentas y roles con aislamiento multi-tenant
          </p>
        </div>
        <button className="btn-primary" onClick={() => setModalOpen(true)}>
          <UserPlus size={18} />
          <span>Nuevo Usuario</span>
        </button>
      </div>

      {error && (
        <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ padding: '4rem', textAlign: 'center', color: '#94a3b8' }}>
          Cargando usuarios...
        </div>
      ) : (
        <div className="glass-panel" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: '#94a3b8', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <th style={{ padding: '1rem 1.25rem' }}>Usuario</th>
                <th style={{ padding: '1rem 1.25rem' }}>Email</th>
                <th style={{ padding: '1rem 1.25rem' }}>Rol</th>
                <th style={{ padding: '1rem 1.25rem' }}>Estado</th>
                <th style={{ padding: '1rem 1.25rem' }}>Último Acceso</th>
                <th style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, idx) => (
                <tr key={u.id || `user-${idx}-${u.username}`} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div
                        style={{
                          width: '34px',
                          height: '34px',
                          borderRadius: '50%',
                          background: u.role === 'admin' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                          color: u.role === 'admin' ? '#818cf8' : '#34d399',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                        }}
                      >
                        {u.role === 'admin' ? <Shield size={16} /> : <User size={16} />}
                      </div>
                      <div>
                        <p style={{ fontWeight: 600, color: '#f8fafc' }}>{u.full_name || u.username}</p>
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>@{u.username}</span>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '1rem 1.25rem', color: '#cbd5e1' }}>{u.email}</td>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <span
                      className="badge"
                      style={{
                        background: u.role === 'admin' ? 'rgba(99, 102, 241, 0.15)' : 'rgba(100, 116, 139, 0.15)',
                        color: u.role === 'admin' ? '#818cf8' : '#cbd5e1',
                      }}
                    >
                      {u.role === 'admin' ? 'Administrador' : 'Operador'}
                    </span>
                  </td>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <span className={`badge ${u.is_active ? 'badge-available' : 'badge-cancelled'}`}>
                      {u.is_active ? '🟢 Activo' : '⚫ Inactivo'}
                    </span>
                  </td>
                  <td style={{ padding: '1rem 1.25rem', color: '#94a3b8', fontSize: '0.8rem' }}>
                    {u.last_login_at ? new Date(u.last_login_at).toLocaleString('es-PE') : 'Nunca'}
                  </td>
                  <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                    <button
                      onClick={() => handleToggleStatus(u)}
                      className={u.is_active ? 'btn-danger' : 'btn-secondary'}
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
                    >
                      {u.is_active ? 'Desactivar' : 'Activar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Crear Usuario */}
      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', color: '#f8fafc' }}>Registrar Nuevo Usuario</h3>
              <button onClick={() => setModalOpen(false)} style={{ background: 'transparent', color: '#94a3b8' }}>
                <X size={20} />
              </button>
            </div>

            {formError && (
              <div style={{ padding: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateUser}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.4rem' }}>
                  Nombre Completo
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ej: Carlos Alberto Pérez"
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.4rem' }}>
                    Usuario <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="carlos.perez"
                    required
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.4rem' }}>
                    Email <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="carlos@empresa.com"
                    required
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.4rem' }}>
                    Contraseña <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    required
                    minLength={8}
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.4rem' }}>
                    Rol
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as 'admin' | 'user')}
                    style={{ width: '100%' }}
                  >
                    <option value="user">Operador</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={formLoading}>
                  {formLoading ? 'Guardando...' : 'Crear Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
