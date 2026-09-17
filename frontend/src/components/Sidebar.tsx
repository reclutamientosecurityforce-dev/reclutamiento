import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  TrendingUp,
  Calendar,
  FileSpreadsheet,
  UserCheck,
  LogOut,
  Megaphone,
  Layers,
  Target,
  Share2,
  ExternalLink,
  Building2,
  Globe,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const isAdmin = user?.role === 'admin';

  const navLinkStyle = ({ isActive }: { isActive: boolean }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.6rem 0.85rem',
    borderRadius: 'var(--radius-md, 8px)',
    color: isActive ? '#fff' : '#94a3b8',
    background: isActive ? 'rgba(220, 38, 38, 0.12)' : 'transparent',
    borderLeft: isActive ? '3px solid #dc2626' : '3px solid transparent',
    fontWeight: isActive ? 600 : 500,
    fontSize: '0.85rem',
    textDecoration: 'none',
    transition: 'all 0.15s ease',
  });

  return (
    <aside className="sidebar" style={{ width: '260px', background: '#0b0f19', borderRight: '1px solid #1f2937', padding: '1.25rem 1rem', display: 'flex', flexDirection: 'column', height: '100vh', boxSizing: 'border-box' }}>
      {/* Brand Header */}
      <div style={{ marginBottom: '1.25rem', padding: '0 0.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'radial-gradient(circle at center, #1a0000 0%, #0a0a0a 100%)',
              border: '1.5px solid rgba(220, 38, 38, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 0 12px rgba(220, 38, 38, 0.25)',
            }}
          >
            <img
              src="/logo.png"
              alt="Security Force"
              style={{ height: '32px', width: '32px', borderRadius: '50%', objectFit: 'cover' }}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          </div>
          <div>
            <h2
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: '1.05rem',
                fontWeight: 900,
                letterSpacing: '0.04em',
                color: '#ffffff',
                lineHeight: 1.1,
                margin: 0,
                textTransform: 'uppercase',
              }}
            >
              SECURITY FORCE
            </h2>
            <span
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: '0.8rem',
                color: '#dc2626',
                fontWeight: 800,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              P&V — Atracción & Selección
            </span>
          </div>
        </div>

        <div
          style={{
            height: '1px',
            background: 'linear-gradient(90deg, rgba(220, 38, 38, 0.6), transparent)',
            marginTop: '0.6rem',
          }}
        />
      </div>

      {/* User Profile Badge */}
      <div
        style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid #1f2937',
          borderRadius: '8px',
          padding: '0.65rem',
          marginBottom: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
        }}
      >
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: isAdmin ? 'linear-gradient(135deg, #dc2626, #991b1b)' : 'linear-gradient(135deg, #374151, #1f2937)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '0.85rem',
            color: '#fff',
            border: isAdmin ? '1px solid rgba(220, 38, 38, 0.4)' : '1px solid rgba(255,255,255,0.1)',
            flexShrink: 0,
          }}
        >
          {user?.fullName ? user.fullName[0].toUpperCase() : user?.username[0].toUpperCase()}
        </div>
        <div style={{ overflow: 'hidden', flex: 1 }}>
          <p style={{ fontSize: '0.82rem', fontWeight: 600, color: '#ffffff', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', margin: 0 }}>
            {user?.fullName || user?.username}
          </p>
          <span
            style={{
              fontSize: '0.68rem',
              color: isAdmin ? '#f87171' : '#94a3b8',
              fontWeight: 700,
              textTransform: 'uppercase',
            }}
          >
            {isAdmin ? '🛡️ Jefe de Selección' : '👤 Reclutador'}
          </span>
        </div>
      </div>

      {/* Navigation Links (Scrollable area) */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1, overflowY: 'auto' }}>
        {/* SECCIÓN 1: CENTRO DE CAPTACIÓN */}
        <div style={{ fontSize: '0.68rem', color: '#f87171', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0.4rem 0.65rem 0.2rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <Megaphone size={12} />
          <span>Centro de Captación</span>
        </div>

        <NavLink to="/recruitment/captacion" end style={navLinkStyle}>
          <LayoutDashboard size={17} />
          <span>Resumen Captación</span>
        </NavLink>

        <NavLink to="/recruitment/captacion/publicaciones" style={navLinkStyle}>
          <Megaphone size={17} />
          <span>Publicaciones</span>
        </NavLink>

        <NavLink to="/recruitment/captacion/categorias" style={navLinkStyle}>
          <Layers size={17} />
          <span>Categorías & Plantillas</span>
        </NavLink>

        <NavLink to="/recruitment/captacion/campanias" style={navLinkStyle}>
          <Target size={17} />
          <span>Campañas</span>
        </NavLink>

        <NavLink to="/recruitment/captacion/canales" style={navLinkStyle}>
          <Share2 size={17} />
          <span>Canales & UTM</span>
        </NavLink>

        {/* SECCIÓN 2: SELECCIÓN Y PROCESO */}
        <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0.75rem 0.65rem 0.2rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <Briefcase size={12} />
          <span>Selección y Evaluación</span>
        </div>

        <NavLink to="/recruitment/openings" style={navLinkStyle}>
          <Briefcase size={17} />
          <span>Convocatorias / Vacantes</span>
        </NavLink>

        <NavLink to="/recruitment/candidates" style={navLinkStyle}>
          <Users size={17} />
          <span>Postulantes</span>
        </NavLink>

        <NavLink to="/recruitment/pipeline" style={navLinkStyle}>
          <TrendingUp size={17} />
          <span>Tablero de Selección</span>
        </NavLink>

        <NavLink to="/recruitment/interviews" style={navLinkStyle}>
          <Calendar size={17} />
          <span>Agenda Entrevistas</span>
        </NavLink>

        <NavLink to="/recruitment/reports" style={navLinkStyle}>
          <FileSpreadsheet size={17} />
          <span>Reportes y Padrón</span>
        </NavLink>

        {/* SECCIÓN 3: ADMINISTRACIÓN */}
        {isAdmin && (
          <>
            <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0.75rem 0.65rem 0.2rem' }}>
              Administración
            </div>
            <NavLink to="/admin/users" style={navLinkStyle}>
              <UserCheck size={17} />
              <span>Equipo de Selección</span>
            </NavLink>
            <NavLink to="/admin/company-settings" style={navLinkStyle}>
              <Building2 size={17} />
              <span>Datos de Empresa</span>
            </NavLink>
            <NavLink to="/admin/portal" style={navLinkStyle}>
              <Globe size={17} />
              <span>CMS Portal Público</span>
            </NavLink>
          </>
        )}
      </nav>

      {/* Portal Público Link & Logout */}
      <div style={{ marginTop: 'auto', paddingTop: '0.75rem', borderTop: '1px solid #1f2937', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <a
          href="/postular"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            padding: '0.55rem',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid #374151',
            borderRadius: '6px',
            color: '#94a3b8',
            fontSize: '0.8rem',
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          <ExternalLink size={14} />
          <span>Abrir Portal Postulante</span>
        </a>

        <button
          onClick={() => logout()}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            padding: '0.6rem',
            background: 'rgba(239, 68, 68, 0.08)',
            color: '#f87171',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: '6px',
            fontWeight: 700,
            fontSize: '0.82rem',
            cursor: 'pointer',
          }}
        >
          <LogOut size={15} />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
};
