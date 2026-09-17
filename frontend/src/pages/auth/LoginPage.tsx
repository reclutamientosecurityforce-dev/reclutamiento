import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import { Shield, Lock, User as UserIcon, AlertCircle } from 'lucide-react';

interface LoginResponse {
  token: string;
  user: {
    id: string;
    companyId: string;
    username: string;
    email: string;
    role: 'admin' | 'user';
    fullName?: string;
  };
}

export const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.post<LoginResponse>('/auth/login', { username, password });
      login(res.token, res.user);
      navigate('/recruitment/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Credenciales inválidas.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        background: `
          radial-gradient(circle at 25% 35%, rgba(220, 38, 38, 0.1) 0%, transparent 55%),
          radial-gradient(circle at 75% 65%, rgba(150, 0, 0, 0.07) 0%, transparent 55%),
          #080808
        `,
      }}
    >
      {/* Left decorative panel */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          width: '4px',
          background: 'linear-gradient(180deg, transparent 0%, #dc2626 30%, #ef4444 50%, #dc2626 70%, transparent 100%)',
          opacity: 0.8,
        }}
      />

      <div
        style={{
          width: '100%',
          maxWidth: '460px',
          background: '#0d0d0d',
          border: '1px solid rgba(220, 38, 38, 0.25)',
          borderRadius: '16px',
          padding: '3rem 2.75rem',
          boxShadow: '0 30px 100px rgba(0,0,0,0.95), 0 0 60px rgba(220, 38, 38, 0.08)',
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          {/* Logo Circle */}
          <div
            style={{
              width: '88px',
              height: '88px',
              borderRadius: '50%',
              background: 'radial-gradient(circle at center, #1a0000 0%, #0d0d0d 70%)',
              border: '2px solid rgba(220, 38, 38, 0.5)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1.5rem',
              boxShadow: '0 0 30px rgba(220, 38, 38, 0.25), inset 0 0 20px rgba(220, 38, 38, 0.08)',
            }}
          >
            <Shield size={40} color="#dc2626" />
          </div>

          <h1
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: '2rem',
              fontWeight: 900,
              color: '#ffffff',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              lineHeight: 1,
              marginBottom: '0.3rem',
            }}
          >
            SECURITY FORCE
          </h1>
          <div
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: '1.1rem',
              fontWeight: 800,
              color: '#dc2626',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              marginBottom: '0.5rem',
            }}
          >
            P&V
          </div>
          <p style={{ fontSize: '0.8rem', color: '#666', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Reclutamiento y Selección de Personal
          </p>

          <div
            style={{
              height: '1px',
              background: 'linear-gradient(90deg, transparent, rgba(220, 38, 38, 0.5), transparent)',
              margin: '1.25rem 0 0',
            }}
          />
        </div>

        {error && (
          <div
            style={{
              background: 'rgba(220, 38, 38, 0.08)',
              border: '1px solid rgba(220, 38, 38, 0.3)',
              color: '#f87171',
              padding: '0.85rem 1rem',
              borderRadius: '8px',
              marginBottom: '1.5rem',
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.25rem' }}>
            <label
              style={{
                display: 'block',
                fontSize: '0.7rem',
                fontWeight: 700,
                color: '#888',
                marginBottom: '0.5rem',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}
            >
              Usuario
            </label>
            <div style={{ position: 'relative' }}>
              <UserIcon
                size={16}
                style={{
                  position: 'absolute',
                  left: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#555',
                }}
              />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin / carlos.perez"
                required
                style={{ paddingLeft: '2.75rem' }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <label
              style={{
                display: 'block',
                fontSize: '0.7rem',
                fontWeight: 700,
                color: '#888',
                marginBottom: '0.5rem',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}
            >
              Contraseña
            </label>
            <div style={{ position: 'relative' }}>
              <Lock
                size={16}
                style={{
                  position: 'absolute',
                  left: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#555',
                }}
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                style={{ paddingLeft: '2.75rem' }}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.95rem',
              fontSize: '1.05rem',
              letterSpacing: '0.1em',
            }}
          >
            {loading ? 'VERIFICANDO CREDENCIALES...' : 'INGRESAR AL SISTEMA'}
          </button>
        </form>

        {/* Footer */}
        <div
          style={{
            marginTop: '2rem',
            textAlign: 'center',
            borderTop: '1px solid rgba(220, 38, 38, 0.1)',
            paddingTop: '1.25rem',
          }}
        >
          <p style={{ fontSize: '0.7rem', color: '#444', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Protegemos lo que más importa
          </p>
        </div>
      </div>
    </div>
  );
};
