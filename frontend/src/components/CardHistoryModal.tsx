import React, { useEffect, useState } from 'react';
import { History, X, Clock, User, FileText } from 'lucide-react';
import { api } from '../api/client';

interface HistoryItem {
  id: string;
  action: string;
  old_status?: string;
  new_status?: string;
  observations?: string;
  created_at: string;
  user_full_name?: string;
  username?: string;
  metadata?: Record<string, unknown>;
}

interface CardHistoryModalProps {
  isOpen: boolean;
  cardId: string;
  cardNumber: number;
  onClose: () => void;
}

export const CardHistoryModal: React.FC<CardHistoryModalProps> = ({
  isOpen,
  cardId,
  cardNumber,
  onClose,
}) => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && cardId) {
      setLoading(true);
      setError(null);
      api
        .get<HistoryItem[]>(`/cards/${cardId}/history`)
        .then((data) => setHistory(data))
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    }
  }, [isOpen, cardId]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ padding: '2rem', maxWidth: '650px' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'rgba(99, 102, 241, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#6366f1',
              }}
            >
              <History size={24} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', color: '#f8fafc' }}>Trazabilidad e Historial</h3>
              <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Carta N.º {cardNumber}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', color: '#94a3b8', padding: '0.25rem' }}>
            <X size={20} />
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
            Cargando historial de la carta...
          </div>
        ) : error ? (
          <div style={{ padding: '1.5rem', background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', borderRadius: 'var(--radius-md)' }}>
            {error}
          </div>
        ) : history.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
            No hay registros en el historial para esta carta.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative' }}>
            {history.map((item, index) => (
              <div
                key={item.id || index}
                style={{
                  background: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span
                      style={{
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        padding: '0.2rem 0.5rem',
                        borderRadius: '4px',
                        background:
                          item.action === 'card_used'
                            ? 'rgba(239, 68, 68, 0.2)'
                            : item.action === 'card_reserved'
                            ? 'rgba(245, 158, 11, 0.2)'
                            : item.action === 'card_corrected'
                            ? 'rgba(99, 102, 241, 0.2)'
                            : 'rgba(100, 116, 139, 0.2)',
                        color:
                          item.action === 'card_used'
                            ? '#f87171'
                            : item.action === 'card_reserved'
                            ? '#fbbf24'
                            : item.action === 'card_corrected'
                            ? '#818cf8'
                            : '#94a3b8',
                      }}
                    >
                      {item.action === 'card_used'
                        ? 'Utilizada'
                        : item.action === 'card_reserved'
                        ? 'Reservada'
                        : item.action === 'card_corrected'
                        ? 'Corregida'
                        : item.action}
                    </span>
                    {item.old_status && item.new_status && (
                      <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                        ({item.old_status} → {item.new_status})
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#64748b', fontSize: '0.78rem' }}>
                    <Clock size={14} />
                    <span>{new Date(item.created_at).toLocaleString('es-PE')}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#cbd5e1', fontSize: '0.85rem' }}>
                  <User size={15} color="#818cf8" />
                  <span>Responsable: <strong>{item.user_full_name || item.username || 'Sistema'}</strong></span>
                </div>

                {item.observations && (
                  <div
                    style={{
                      background: 'rgba(0, 0, 0, 0.2)',
                      padding: '0.6rem 0.85rem',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.825rem',
                      color: '#94a3b8',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.5rem',
                      marginTop: '0.25rem',
                    }}
                  >
                    <FileText size={15} style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span>{item.observations}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
