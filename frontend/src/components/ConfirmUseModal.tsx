import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';

interface ConfirmUseModalProps {
  isOpen: boolean;
  cardNumber: number;
  onConfirm: (observations: string) => Promise<void>;
  onClose: () => void;
  loading: boolean;
}

export const ConfirmUseModal: React.FC<ConfirmUseModalProps> = ({
  isOpen,
  cardNumber,
  onConfirm,
  onClose,
  loading,
}) => {
  const [observations, setObservations] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await onConfirm(observations);
      setObservations('');
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al utilizar carta');
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
                background: 'rgba(16, 185, 129, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#10b981',
              }}
            >
              <CheckCircle2 size={24} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', color: '#f8fafc' }}>Confirmar Uso de Carta</h3>
              <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Security Force S.A.C.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', color: '#94a3b8', padding: '0.25rem' }}
          >
            <X size={20} />
          </button>
        </div>

        <div
          style={{
            background: 'rgba(79, 70, 229, 0.08)',
            border: '1px solid rgba(79, 70, 229, 0.25)',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem',
            textAlign: 'center',
            marginBottom: '1.5rem',
          }}
        >
          <span style={{ fontSize: '0.85rem', color: '#818cf8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Número de Carta Seleccionado
          </span>
          <div style={{ fontSize: '2.75rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em', marginTop: '0.25rem' }}>
            N.º {cardNumber}
          </div>
          <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.5rem' }}>
            ⚠️ Una vez utilizada, este número quedará asignado a su usuario de forma permanente.
          </p>
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
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.5rem' }}>
              Observaciones / Motivo (Opcional)
            </label>
            <textarea
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              placeholder="Ingrese detalles del servicio, cliente o expediente..."
              rows={3}
              style={{ width: '100%', resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
              style={{ minWidth: '150px' }}
            >
              {loading ? 'Procesando...' : 'Confirmar Uso'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
