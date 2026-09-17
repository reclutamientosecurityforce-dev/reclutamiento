import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import { ConfirmUseModal } from '../../components/ConfirmUseModal';
import { AdminEditCardModal } from '../../components/AdminEditCardModal';
import { CardHistoryModal } from '../../components/CardHistoryModal';
import {
  Search,
  Filter,
  History,
  Edit,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List,
  RefreshCw,
} from 'lucide-react';

interface CardItem {
  id: string;
  number: number;
  status: 'available' | 'reserved' | 'used' | 'cancelled';
  used_by_name?: string;
  reserved_by_name?: string;
  cancelled_by_name?: string;
  used_at?: string;
  observations?: string;
}

interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface CardsResponse {
  data: CardItem[];
  pagination: PaginationInfo;
}

export const CardsMatrixPage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [cards, setCards] = useState<CardItem[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    limit: 50,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  });

  const [statusFilter, setStatusFilter] = useState<string>('');
  const [exactSearch, setExactSearch] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [selectedCardForUse, setSelectedCardForUse] = useState<CardItem | null>(null);
  const [selectedCardForEdit, setSelectedCardForEdit] = useState<CardItem | null>(null);
  const [selectedCardForHistory, setSelectedCardForHistory] = useState<CardItem | null>(null);

  const fetchCards = useCallback(async (page = 1, limit = 50, status = '', search = '') => {
    try {
      setLoading(true);
      setError(null);

      let url = `/cards?page=${page}&limit=${limit}`;
      if (status) url += `&status=${status}`;
      if (search.trim()) {
        if (/^\d+$/.test(search.trim())) {
          url += `&number=${search.trim()}`;
        } else {
          url += `&search=${encodeURIComponent(search.trim())}`;
        }
      }

      const res = await api.get<CardsResponse>(url);
      setCards(res.data || []);
      setPagination(res.pagination || {
        total: res.data?.length || 0,
        page: 1,
        limit,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al cargar cartas');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCards(pagination.page, pagination.limit, statusFilter, exactSearch);
  }, [fetchCards, pagination.page, pagination.limit, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCards(1, pagination.limit, statusFilter, exactSearch);
  };

  const handleUseConfirm = async (observations: string) => {
    if (!selectedCardForUse) return;
    setActionLoading(true);
    try {
      await api.post(`/cards/${selectedCardForUse.id}/use`, { observations });
      await fetchCards(pagination.page, pagination.limit, statusFilter, exactSearch);
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditConfirm = async (data: { newStatus: 'available' | 'cancelled'; correctionReason: string; observations?: string }) => {
    if (!selectedCardForEdit) return;
    setActionLoading(true);
    try {
      await api.post(`/cards/${selectedCardForEdit.id}/correct`, data);
      await fetchCards(pagination.page, pagination.limit, statusFilter, exactSearch);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: CardItem['status']) => {
    switch (status) {
      case 'available':
        return <span className="badge badge-available">ðŸŸ¢ Disponible</span>;
      case 'reserved':
        return <span className="badge badge-reserved">ðŸŸ¡ Reservada</span>;
      case 'used':
        return <span className="badge badge-used">ðŸ”´ Utilizada</span>;
      case 'cancelled':
        return <span className="badge badge-cancelled">âš« Anulada</span>;
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 800, color: '#1a1a1a' }}>
            Matriz de Control de Cartas
          </h1>
          <p style={{ fontSize: '0.9rem', color: '#1a1a1a', marginTop: '0.25rem' }}>
            VisualizaciÃ³n detallada, uso seguro concurrente y trazabilidad completa
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button
            onClick={() => fetchCards(pagination.page, pagination.limit, statusFilter, exactSearch)}
            className="btn-secondary"
            title="Refrescar"
          >
            <RefreshCw size={16} />
          </button>
          <div style={{ display: 'flex', background: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-md)', padding: '2px', border: '1px solid var(--border-subtle)' }}>
            <button
              onClick={() => setViewMode('grid')}
              style={{
                padding: '0.45rem 0.75rem',
                background: viewMode === 'grid' ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                color: viewMode === 'grid' ? '#818cf8' : '#666666',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              <LayoutGrid size={18} />
            </button>
            <button
              onClick={() => setViewMode('table')}
              style={{
                padding: '0.45rem 0.75rem',
                background: viewMode === 'table' ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                color: viewMode === 'table' ? '#818cf8' : '#666666',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              <List size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* â”€â”€â”€ CONTROLES DE BÃšSQUEDA Y FILTROS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div
        className="glass-panel"
        style={{
          padding: '1.25rem 1.5rem',
          marginBottom: '1.5rem',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
        }}
      >
        {/* Exact search */}
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.5rem', flex: '1 1 300px' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <Search size={18} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#0f1419' }} />
            <input
              type="text"
              placeholder="Buscar por nÃºmero exacto (ej: 573)..."
              value={exactSearch}
              onChange={(e) => setExactSearch(e.target.value)}
              style={{ width: '100%', paddingLeft: '2.5rem' }}
            />
          </div>
          <button type="submit" className="btn-primary" style={{ padding: '0.65rem 1.25rem' }}>
            Buscar
          </button>
          {exactSearch && (
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setExactSearch('');
                fetchCards(1, pagination.limit, statusFilter, '');
              }}
            >
              Limpiar
            </button>
          )}
        </form>

        {/* Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Filter size={16} color="#666666" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              style={{ minWidth: '150px' }}
            >
              <option value="">Todos los Estados</option>
              <option value="available">ðŸŸ¢ Disponibles</option>
              <option value="used">ðŸ”´ Utilizadas</option>
              <option value="reserved">ðŸŸ¡ Reservadas</option>
              <option value="cancelled">âš« Anuladas</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: '#1a1a1a' }}>Por pÃ¡gina:</span>
            <select
              value={pagination.limit}
              onChange={(e) => setPagination((prev) => ({ ...prev, limit: Number(e.target.value), page: 1 }))}
            >
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={200}>200</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div style={{ padding: '1rem 1.5rem', background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      {/* â”€â”€â”€ VISTA CUADRÃCULA / TABLA â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {loading ? (
        <div style={{ padding: '4rem', textAlign: 'center', color: '#1a1a1a' }}>
          Cargando cartas...
        </div>
      ) : cards.length === 0 ? (
        <div className="glass-panel" style={{ padding: '4rem', textAlign: 'center', color: '#0f1419' }}>
          <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>No se encontraron cartas</p>
          <p style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>Ajusta los filtros o busca otro nÃºmero</p>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
            gap: '1rem',
            marginBottom: '2rem',
          }}
        >
          {cards.map((card) => (
            <div
              key={card.id}
              style={{
                background: 'var(--bg-surface-glass)',
                backdropFilter: 'blur(8px)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '1.25rem 1rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                position: 'relative',
                transition: 'all 0.2s ease',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              {/* Card Number */}
              <div
                style={{
                  fontSize: '1.85rem',
                  fontWeight: 800,
                  fontFamily: 'var(--font-heading)',
                  color: '#1a1a1a',
                  letterSpacing: '-0.02em',
                  marginBottom: '0.5rem',
                }}
              >
                N.Âº {card.number}
              </div>

              {/* Status Badge */}
              <div style={{ marginBottom: '0.75rem' }}>{getStatusBadge(card.status)}</div>

              {/* Responsible user if used */}
              {card.used_by_name && (
                <div style={{ fontSize: '0.75rem', color: '#1a1a1a', marginBottom: '0.75rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>
                  ðŸ‘¤ {card.used_by_name}
                </div>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', gap: '0.35rem', marginTop: 'auto', width: '100%' }}>
                {card.status === 'available' && (
                  <button
                    onClick={() => setSelectedCardForUse(card)}
                    style={{
                      flex: 1,
                      padding: '0.45rem',
                      background: 'rgba(16, 185, 129, 0.15)',
                      color: '#34d399',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.25rem',
                    }}
                  >
                    <CheckCircle2 size={13} />
                    <span>Utilizar</span>
                  </button>
                )}

                {isAdmin && card.status !== 'available' && (
                  <button
                    onClick={() => setSelectedCardForEdit(card)}
                    style={{
                      flex: 1,
                      padding: '0.45rem',
                      background: 'rgba(245, 158, 11, 0.15)',
                      color: '#fbbf24',
                      border: '1px solid rgba(245, 158, 11, 0.3)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.25rem',
                    }}
                  >
                    <Edit size={13} />
                    <span>Corregir</span>
                  </button>
                )}

                <button
                  onClick={() => setSelectedCardForHistory(card)}
                  style={{
                    padding: '0.45rem 0.55rem',
                    background: 'var(--bg-surface-elevated)',
                    color: '#1a1a1a',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.75rem',
                  }}
                  title="Ver Historial"
                >
                  <History size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="glass-panel" style={{ overflowX: 'auto', marginBottom: '2rem' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: '#1a1a1a', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <th style={{ padding: '1rem 1.25rem' }}>NÃºmero</th>
                <th style={{ padding: '1rem 1.25rem' }}>Estado</th>
                <th style={{ padding: '1rem 1.25rem' }}>Responsable</th>
                <th style={{ padding: '1rem 1.25rem' }}>Fecha de Uso</th>
                <th style={{ padding: '1rem 1.25rem' }}>Observaciones</th>
                <th style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {cards.map((card) => (
                <tr
                  key={card.id}
                  style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)', transition: 'background 0.15s ease' }}
                >
                  <td style={{ padding: '1rem 1.25rem', fontWeight: 800, fontSize: '1.05rem', color: '#1a1a1a' }}>
                    N.Âº {card.number}
                  </td>
                  <td style={{ padding: '1rem 1.25rem' }}>{getStatusBadge(card.status)}</td>
                  <td style={{ padding: '1rem 1.25rem', color: '#1a1a1a' }}>
                    {card.used_by_name || card.reserved_by_name || '-'}
                  </td>
                  <td style={{ padding: '1rem 1.25rem', color: '#1a1a1a', fontSize: '0.8rem' }}>
                    {card.used_at ? new Date(card.used_at).toLocaleString('es-PE') : '-'}
                  </td>
                  <td style={{ padding: '1rem 1.25rem', color: '#1a1a1a', maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {card.observations || '-'}
                  </td>
                  <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                      {card.status === 'available' && (
                        <button
                          onClick={() => setSelectedCardForUse(card)}
                          className="btn-primary"
                          style={{ padding: '0.4rem 0.75rem', fontSize: '0.78rem' }}
                        >
                          Utilizar
                        </button>
                      )}
                      {isAdmin && card.status !== 'available' && (
                        <button
                          onClick={() => setSelectedCardForEdit(card)}
                          className="btn-secondary"
                          style={{ padding: '0.4rem 0.75rem', fontSize: '0.78rem' }}
                        >
                          Corregir
                        </button>
                      )}
                      <button
                        onClick={() => setSelectedCardForHistory(card)}
                        className="btn-secondary"
                        style={{ padding: '0.4rem 0.65rem' }}
                        title="Ver Historial"
                      >
                        <History size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* â”€â”€â”€ PAGINACIÃ“N â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1rem 0',
          borderTop: '1px solid var(--border-subtle)',
        }}
      >
        <span style={{ fontSize: '0.85rem', color: '#1a1a1a' }}>
          Mostrando pÃ¡gina {pagination.page} de {pagination.totalPages} ({pagination.total} cartas en total)
        </span>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            className="btn-secondary"
            disabled={!pagination.hasPrev || loading}
            onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
            style={{ padding: '0.5rem 0.85rem' }}
          >
            <ChevronLeft size={16} />
            <span>Anterior</span>
          </button>
          <button
            className="btn-secondary"
            disabled={!pagination.hasNext || loading}
            onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
            style={{ padding: '0.5rem 0.85rem' }}
          >
            <span>Siguiente</span>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* â”€â”€â”€ MODALS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {selectedCardForUse && (
        <ConfirmUseModal
          isOpen={true}
          cardNumber={selectedCardForUse.number}
          onConfirm={handleUseConfirm}
          onClose={() => setSelectedCardForUse(null)}
          loading={actionLoading}
        />
      )}

      {selectedCardForEdit && (
        <AdminEditCardModal
          isOpen={true}
          cardNumber={selectedCardForEdit.number}
          currentStatus={selectedCardForEdit.status}
          onSave={handleEditConfirm}
          onClose={() => setSelectedCardForEdit(null)}
          loading={actionLoading}
        />
      )}

      {selectedCardForHistory && (
        <CardHistoryModal
          isOpen={true}
          cardId={selectedCardForHistory.id}
          cardNumber={selectedCardForHistory.number}
          onClose={() => setSelectedCardForHistory(null)}
        />
      )}
    </div>
  );
};




