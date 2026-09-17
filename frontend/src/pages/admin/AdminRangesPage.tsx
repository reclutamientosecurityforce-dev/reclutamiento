import React, { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { Layers, Plus, Sparkles, X, CheckCircle2 } from 'lucide-react';

interface RangeData {
  id: string;
  name: string;
  prefix?: string;
  range_start: number;
  range_end: number;
  is_active: boolean;
  total_count: string;
  available_count: string;
  used_count: string;
}

export const AdminRangesPage: React.FC = () => {
  const [ranges, setRanges] = useState<RangeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [createRangeModal, setCreateRangeModal] = useState(false);
  const [generateModal, setGenerateModal] = useState(false);
  const [selectedRange, setSelectedRange] = useState<RangeData | null>(null);

  // Create range form
  const [rangeName, setRangeName] = useState('');
  const [rangePrefix, setRangePrefix] = useState('');
  const [rangeStart, setRangeStart] = useState<number>(1);
  const [rangeEnd, setRangeEnd] = useState<number>(1000);

  // Generate cards form
  const [genStart, setGenStart] = useState<number>(1);
  const [genEnd, setGenEnd] = useState<number>(1000);
  const [actionLoading, setActionLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchRanges = async () => {
    try {
      setLoading(true);
      const res = await api.get<RangeData[]>('/admin/ranges');
      setRanges(res || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRanges();
  }, []);

  const handleCreateRange = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await api.post('/admin/ranges', {
        name: rangeName,
        prefix: rangePrefix || undefined,
        rangeStart: Number(rangeStart),
        rangeEnd: Number(rangeEnd),
      });
      setCreateRangeModal(false);
      setRangeName('');
      setRangePrefix('');
      fetchRanges();
      setSuccessMsg('Rango creado exitosamente.');
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error al crear rango');
    } finally {
      setActionLoading(false);
    }
  };

  const handleGenerateCards = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRange) return;
    setActionLoading(true);
    try {
      const res = await api.post<{ message: string; inserted: number }>('/admin/cards/generate', {
        rangeId: selectedRange.id,
        rangeStart: Number(genStart),
        rangeEnd: Number(genEnd),
      });
      setGenerateModal(false);
      fetchRanges();
      setSuccessMsg(res.message || 'Cartas generadas exitosamente.');
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error al generar cartas');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 800, color: '#f8fafc' }}>
            Rangos de Numeración
          </h1>
          <p style={{ fontSize: '0.9rem', color: '#94a3b8', marginTop: '0.25rem' }}>
            Definición de correlativos y generación masiva de cartas
          </p>
        </div>
        <button className="btn-primary" onClick={() => setCreateRangeModal(true)}>
          <Plus size={18} />
          <span>Nuevo Rango</span>
        </button>
      </div>

      {successMsg && (
        <div style={{ padding: '1rem', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {loading ? (
        <div style={{ padding: '4rem', textAlign: 'center', color: '#94a3b8' }}>
          Cargando rangos...
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {ranges.map((r) => (
            <div key={r.id} className="glass-panel" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Layers size={20} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.15rem', color: '#f8fafc' }}>{r.name}</h3>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                      Rango: {r.range_start} - {r.range_end}
                    </span>
                  </div>
                </div>
                <span className="badge badge-available">🟢 Activo</span>
              </div>

              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', background: 'var(--bg-surface-elevated)', padding: '0.85rem', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                <div>
                  <span style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase' }}>Generadas</span>
                  <p style={{ fontWeight: 800, color: '#f8fafc', fontSize: '1.1rem' }}>{r.total_count || 0}</p>
                </div>
                <div>
                  <span style={{ fontSize: '0.7rem', color: '#34d399', textTransform: 'uppercase' }}>Disponibles</span>
                  <p style={{ fontWeight: 800, color: '#34d399', fontSize: '1.1rem' }}>{r.available_count || 0}</p>
                </div>
                <div>
                  <span style={{ fontSize: '0.7rem', color: '#f87171', textTransform: 'uppercase' }}>Usadas</span>
                  <p style={{ fontWeight: 800, color: '#f87171', fontSize: '1.1rem' }}>{r.used_count || 0}</p>
                </div>
              </div>

              {/* Action */}
              <button
                className="btn-secondary"
                onClick={() => {
                  setSelectedRange(r);
                  setGenStart(r.range_start);
                  setGenEnd(r.range_end);
                  setGenerateModal(true);
                }}
                style={{ marginTop: 'auto', justifyContent: 'center' }}
              >
                <Sparkles size={16} color="#818cf8" />
                <span>Generar Cartas en Rango</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Modal Crear Rango */}
      {createRangeModal && (
        <div className="modal-overlay" onClick={() => setCreateRangeModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', color: '#f8fafc' }}>Crear Nuevo Rango de Numeración</h3>
              <button onClick={() => setCreateRangeModal(false)} style={{ background: 'transparent', color: '#94a3b8' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateRange}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.4rem' }}>
                  Nombre del Rango
                </label>
                <input
                  type="text"
                  value={rangeName}
                  onChange={(e) => setRangeName(e.target.value)}
                  placeholder="Ej: Rango Operativo 2026-A"
                  required
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.4rem' }}>
                    Número Inicial
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={rangeStart}
                    onChange={(e) => setRangeStart(Number(e.target.value))}
                    required
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.4rem' }}>
                    Número Final
                  </label>
                  <input
                    type="number"
                    min={rangeStart}
                    value={rangeEnd}
                    onChange={(e) => setRangeEnd(Number(e.target.value))}
                    required
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setCreateRangeModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={actionLoading}>
                  {actionLoading ? 'Creando...' : 'Crear Rango'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Generar Cartas */}
      {generateModal && selectedRange && (
        <div className="modal-overlay" onClick={() => setGenerateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', color: '#f8fafc' }}>Generar Cartas Masivas</h3>
                <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>{selectedRange.name}</p>
              </div>
              <button onClick={() => setGenerateModal(false)} style={{ background: 'transparent', color: '#94a3b8' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleGenerateCards}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.4rem' }}>
                    Desde el N.º
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={genStart}
                    onChange={(e) => setGenStart(Number(e.target.value))}
                    required
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.4rem' }}>
                    Hasta el N.º
                  </label>
                  <input
                    type="number"
                    min={genStart}
                    value={genEnd}
                    onChange={(e) => setGenEnd(Number(e.target.value))}
                    required
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '1.5rem' }}>
                Las cartas ya existentes no serán duplicadas gracias a la restricción UNIQUE(company_id, number).
              </p>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setGenerateModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={actionLoading}>
                  {actionLoading ? 'Generando...' : 'Generar Cartas'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
