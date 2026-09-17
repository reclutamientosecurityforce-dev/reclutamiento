import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Shield, Menu, X } from 'lucide-react';

interface PublicHeaderProps {
  showBackToJobs?: boolean;
}

export const PublicHeader: React.FC<PublicHeaderProps> = ({ showBackToJobs = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Determine active item based on current path
  const getActiveItem = (path: string) => {
    const currentPath = location.pathname;
    const currentHash = location.hash;
    
    if (path === '/postular' && currentPath === '/postular' && !currentHash) {
      return true;
    }
    if (path === '/postular/nosotros' && currentPath === '/postular/nosotros') {
      return true;
    }
    if (path === '/postular/beneficios' && currentPath === '/postular/beneficios') {
      return true;
    }
    if (path === '/postular/contacto' && currentPath === '/postular/contacto') {
      return true;
    }
    if (path === '/postular#convocatorias' && currentHash === '#convocatorias') {
      return true;
    }
    return false;
  };

  const navItems = [
    { label: 'INICIO', path: '/postular' },
    { label: 'QUIÃ‰NES SOMOS', path: '/postular/nosotros' },
    { label: 'CONVOCATORIAS', path: '/postular#convocatorias' },
    { label: 'BENEFICIOS', path: '/postular/beneficios' },
    { label: 'CONTACTO', path: '/postular/contacto' },
  ];

  return (
    <header
      style={{
        background: '#FFFFFF',
        borderBottom: '1px solid #E5E5E5',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        height: '80px',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '0 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
        }}
      >
        {/* Logo & Brand */}
        <Link
          to="/postular"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            textDecoration: 'none',
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: '#FFFFFF',
              border: '3px solid #DC2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(220, 38, 38, 0.2)',
              overflow: 'hidden',
            }}
          >
            <img
              src="/logo.png"
              alt="Security Force P&V Logo"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                padding: '4px',
              }}
              onError={(e) => {
                // Fallback to shield icon if logo fails to load
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const fallback = target.nextElementSibling as HTMLDivElement;
                if (fallback) {
                  fallback.style.display = 'flex';
                }
              }}
            />
            <div
              style={{
                position: 'absolute',
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: '#DC2626',
                display: 'none', // Hidden by default, shown if logo fails
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Shield size={28} color="#FFFFFF" />
            </div>
          </div>
          <div className="header-brand-text">
            <div
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: '1.4rem',
                fontWeight: 900,
                color: '#f5f5f7',
                letterSpacing: '0.02em',
                lineHeight: 1,
                textTransform: 'uppercase',
              }}
            >
              SECURITY FORCE <span style={{ color: '#DC2626' }}>P&V</span>
            </div>
            <div
              style={{
                fontSize: '0.7rem',
                color: '#666',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                fontWeight: 600,
              }}
            >
              Protegemos lo que mÃ¡s importa
            </div>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav
          className="desktop-nav"
          style={{
            display: 'none',
            alignItems: 'center',
            gap: '1.5rem',
          }}
        >
          {navItems.map((item) => {
            const isActive = getActiveItem(item.path);
            const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
              if (item.path.includes('#')) {
                e.preventDefault();
                const [path, hash] = item.path.split('#');
                navigate(path);
                setTimeout(() => {
                  const element = document.getElementById(hash);
                  if (element) {
                    element.scrollIntoView({ behavior: 'smooth' });
                  }
                }, 100);
              }
            };
            
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={handleClick}
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: isActive ? '#DC2626' : '#f5f5f7',
                  textDecoration: 'none',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  position: 'relative',
                  paddingBottom: '4px',
                  whiteSpace: 'nowrap',
                  transition: 'color 0.2s ease',
                }}
              >
                {item.label}
                {isActive && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: '2px',
                      background: '#DC2626',
                    }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* CTA Button */}
        <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={() => navigate('/postular/consultar')}
            className="header-secondary-btn"
            style={{
              padding: '0.6rem 1rem',
              fontSize: '0.75rem',
              fontWeight: 700,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              borderRadius: '4px',
              background: 'transparent',
              border: '1px solid #DC2626',
              color: '#DC2626',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(220, 38, 38, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            CONSULTAR
          </button>
          <button
            onClick={() => {
              navigate('/postular');
              setTimeout(() => {
                const element = document.getElementById('convocatorias');
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth' });
                }
              }, 100);
            }}
            className="header-primary-btn"
            style={{
              padding: '0.6rem 1rem',
              fontSize: '0.75rem',
              fontWeight: 700,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              borderRadius: '4px',
              background: '#DC2626',
              border: '1px solid #DC2626',
              color: '#FFFFFF',
              cursor: 'pointer',
              transition: 'background 0.2s ease',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#B91C1C';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#DC2626';
            }}
          >
            POSTULAR
          </button>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="mobile-menu-toggle"
            style={{
              display: 'none',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '0.5rem',
            }}
          >
            {mobileMenuOpen ? <X size={24} color="#f5f5f7" /> : <Menu size={24} color="#f5f5f7" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div
          style={{
            position: 'absolute',
            top: '80px',
            left: 0,
            right: 0,
            background: '#FFFFFF',
            borderBottom: '1px solid #E5E5E5',
            padding: '1rem 2rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            zIndex: 999,
          }}
        >
          {navItems.map((item) => {
            const isActive = getActiveItem(item.path);
            const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
              setMobileMenuOpen(false);
              if (item.path.includes('#')) {
                e.preventDefault();
                const [path, hash] = item.path.split('#');
                navigate(path);
                setTimeout(() => {
                  const element = document.getElementById(hash);
                  if (element) {
                    element.scrollIntoView({ behavior: 'smooth' });
                  }
                }, 100);
              }
            };
            
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={handleClick}
                style={{
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  color: isActive ? '#DC2626' : '#f5f5f7',
                  textDecoration: 'none',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  padding: '0.5rem 0',
                  borderLeft: isActive ? '3px solid #DC2626' : '3px solid transparent',
                  paddingLeft: '0.75rem',
                  transition: 'all 0.2s ease',
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
};

