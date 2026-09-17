import React, { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface AdminEditCardModalProps {
  isOpen: boolean;
  cardNumber: number;
  currentStatus: string;
  onSave: (data: { newStatus: 'available' | 'cancelled'; correctionReason: string; observations?: string }) => Promise<void>;
  onClose: () => void;
  loading: boolean;
}

export const AdminEditCardModal: React.FC<AdminEditCardModalProps> = ({
  isOpen,
  cardNumber,
  currentStatus,
  onSave,
  onClose,
  loading,
}) => {
  const [newStatus, setNewStatus] = useState<'available' | 'cancelled'>('available');
  const [correctionReason, setCorrectionReason] = useState('');
  const [observations, setObservations] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!correctionReason.trim()) {
      setError('El motivo de corrección es obligatorio.');
      return;
    }

    setError(null);
    try {
      await onSave({ newStatus, correctionReason, observations });
      setCorrectionReason('');
      setObservations('');
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al corregir carta');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'rgba(245, 158, 11, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#f59e0b',
              }}
            >
              <AlertTriangle size={24} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', color: '#f8fafc' }}>Corrección Administrativa</h3>
              <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Carta N.º {cardNumber} (Estado actual: {currentStatus})</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', color: '#94a3b8', padding: '0.25rem' }}>
            <X size={20} />
          </button>
        </div>

        {error && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#f87171',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              marginBottom: '1.25rem',
              fontSize: '0.875rem',
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.5rem' }}>
              Nuevo Estado
            </label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as 'available' | 'cancelled')}
              style={{ width: '100%' }}
            >
              <option value="available">🟢 Disponible (Liberar y limpiar asignación)</option>
              <option value="cancelled">⚫ Anulada (Marcar como cancelada / inutilizable)</option>
            </select>
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.5rem' }}>
              Motivo de Corrección <span style={{ color: '#ef4444' }}>* (Obligatorio)</span>
            </label>
            <input
              type="text"
              value={correctionReason}
              onChange={(e) => setCorrectionReason(e.target.value)}
              placeholder="Ej: Error de digitación / Carta duplicada / Solicitud de gerencia"
              required
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.5rem' }}>
              Observaciones Adicionales
            </label>
            <textarea
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              placeholder="Detalles complementarios de la corrección..."
              rows={3}
              style={{ width: '100%', resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Guardando...' : 'Aplicar Corrección'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
