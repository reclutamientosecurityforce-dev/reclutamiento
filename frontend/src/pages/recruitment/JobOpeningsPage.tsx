import React, { useEffect, useState } from 'react';
import { api } from '../../api/client';
import {
  Briefcase,
  Plus,
  MapPin,
  DollarSign,
  Clock,
  CheckCircle2,
  X,
  Building,
  Sliders,
  Award,
  Users,
  Eye,
} from 'lucide-react';
import { RequirementConfigModal } from './RequirementConfigModal';
import { EvaluationModal } from './EvaluationModal';
import { useNavigate } from 'react-router-dom';
import {
  Megaphone,
  Layers,
} from 'lucide-react';

interface JobOpeningItem {
  id: string;
  category_id?: string;
  category_name?: string;
  title: string;
  position_type: string;
  location: string;
  client_name?: string;
  vacancies_count: number;
  filled_count: number;
  salary_offered?: number;
  shift_type?: string;
  status: 'open' | 'in_progress' | 'filled' | 'cancelled';
  description?: string;
  active_candidates_count?: number;
  publications_count?: number;
}

export const JobOpeningsPage: React.FC = () => {
  const navigate = useNavigate();
  const [openings, setOpenings] = useState<JobOpeningItem[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Prefilter & Ranking Modals State
  const [configOpening, setConfigOpening] = useState<JobOpeningItem | null>(null);
  const [rankingOpening, setRankingOpening] = useState<JobOpeningItem | null>(null);
  const [rankingList, setRankingList] = useState<any[]>([]);
  const [rankingLoading, setRankingLoading] = useState(false);
  const [evalAppId, setEvalAppId] = useState<string | null>(null);

  // Form State
  const [categoryId, setCategoryId] = useState('');
  const [createFromTemplate, setCreateFromTemplate] = useState(true);
  const [title, setTitle] = useState('');
  const [positionType, setPositionType] = useState('Agente de Seguridad');
  const [location, setLocation] = useState('');
  const [clientName, setClientName] = useState('');
  const [vacanciesCount, setVacanciesCount] = useState<number>(5);
  const [salaryOffered, setSalaryOffered] = useState<number | ''>(1800);
  const [shiftType, setShiftType] = useState('12x12 Rotativo');
  const [description, setDescription] = useState('');

  const fetchOpenings = async () => {
    try {
      setLoading(true);
      const [res, catRes] = await Promise.all([
        api.get<JobOpeningItem[]>(`/recruitment/openings${selectedCategoryFilter !== 'all' ? `?categoryId=${selectedCategoryFilter}` : ''}`),
        api.get<any[]>('/recruitment/captacion/categories'),
      ]);
      setOpenings(res || []);
      setCategories(catRes || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenRanking = async (op: JobOpeningItem) => {
    setRankingOpening(op);
    try {
      setRankingLoading(true);
      const data = await api.get<any[]>(`/recruitment/openings/${op.id}/ranking`);
      setRankingList(data || []);
    } catch (err) {
      console.error('Error al cargar ranking:', err);
    } finally {
      setRankingLoading(false);
    }
  };

  useEffect(() => {
    fetchOpenings();
  }, [selectedCategoryFilter]);

  const handleCreateOpening = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      await api.post('/recruitment/openings', {
        categoryId: categoryId || undefined,
        createFromCategoryTemplate: createFromTemplate,
        title,
        positionType,
        location,
        clientName: clientName || undefined,
        vacanciesCount: Number(vacanciesCount),
        salaryOffered: salaryOffered ? Number(salaryOffered) : undefined,
        shiftType,
        description: description || undefined,
        status: 'open',
      });

      setModalOpen(false);
      setSuccessMsg(`Convocatoria "${title}" creada exitosamente.`);
      setTitle('');
      setLocation('');
      setClientName('');
      setDescription('');
      setCategoryId('');
      fetchOpenings();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error al crear convocatoria');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 800, color: '#f8fafc' }}>
            Convocatorias y Requerimientos
          </h1>
          <p style={{ fontSize: '0.9rem', color: '#94a3b8', marginTop: '0.25rem' }}>
            Gestión de vacantes de seguridad por sede y cliente de Security Force S.A.C.
          </p>
        </div>
        <button className="btn-primary" onClick={() => setModalOpen(true)}>
          <Plus size={18} />
          <span>Nueva Convocatoria</span>
        </button>
      </div>

      {successMsg && (
        <div style={{ padding: '1rem 1.25rem', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#34d399', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Filtros por Categoría */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#94a3b8', fontSize: '0.8rem', marginRight: '0.5rem' }}>
          <Layers size={15} />
          <span>Categoría:</span>
        </div>
        <button
          onClick={() => setSelectedCategoryFilter('all')}
          style={{
            padding: '0.4rem 0.85rem',
            borderRadius: '6px',
            border: selectedCategoryFilter === 'all' ? '1px solid #dc2626' : '1px solid #374151',
            background: selectedCategoryFilter === 'all' ? 'rgba(220,38,38,0.2)' : 'rgba(255,255,255,0.02)',
            color: selectedCategoryFilter === 'all' ? '#ffffff' : '#94a3b8',
            fontSize: '0.78rem',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Todas
        </button>
        {categories.map((c, idx) => (
          <button
            key={c.id || `cat-filter-${idx}-${c.slug || 'c'}`}
            onClick={() => setSelectedCategoryFilter(c.id)}
            style={{
              padding: '0.4rem 0.85rem',
              borderRadius: '6px',
              border: selectedCategoryFilter === c.id ? `1px solid ${c.color_hex || '#3b82f6'}` : '1px solid #374151',
              background: selectedCategoryFilter === c.id ? `${c.color_hex || '#3b82f6'}22` : 'rgba(255,255,255,0.02)',
              color: selectedCategoryFilter === c.id ? '#ffffff' : '#94a3b8',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {c.name}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ padding: '4rem', textAlign: 'center', color: '#94a3b8' }}>
          Cargando convocatorias...
        </div>
      ) : openings.length === 0 ? (
        <div className="glass-panel" style={{ padding: '4rem', textAlign: 'center', color: '#64748b' }}>
          No hay convocatorias registradas. Crea la primera para recibir postulantes.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
          {openings.map((op, idx) => {
            const isFilled = op.filled_count >= op.vacancies_count;
            const progress = Math.min(100, Math.round((op.filled_count / op.vacancies_count) * 100));

            return (
              <div key={op.id || `opening-${idx}`} className="glass-panel" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                      <span style={{ fontSize: '0.72rem', color: '#818cf8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {op.position_type}
                      </span>
                      {op.category_name && (
                        <span style={{ fontSize: '0.68rem', padding: '0.15rem 0.4rem', borderRadius: '4px', background: 'rgba(59,130,246,0.15)', color: '#60a5fa', fontWeight: 700 }}>
                          {op.category_name}
                        </span>
                      )}
                    </div>
                    <h3 style={{ fontSize: '1.2rem', color: '#f8fafc' }}>{op.title}</h3>
                  </div>
                  <span className={`badge ${isFilled ? 'badge-cancelled' : 'badge-available'}`}>
                    {isFilled ? '⚫ Cubierta' : '🟢 Abierta'}
                  </span>
                </div>

                {op.client_name && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#cbd5e1', fontSize: '0.85rem' }}>
                    <Building size={15} color="#38bdf8" />
                    <span>Cliente: <strong>{op.client_name}</strong></span>
                  </div>
                )}

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: '0.825rem', color: '#94a3b8' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <MapPin size={14} color="#94a3b8" />
                    <span>{op.location}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Clock size={14} color="#94a3b8" />
                    <span>{op.shift_type || '12x12'}</span>
                  </div>
                  {op.salary_offered && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#34d399', fontWeight: 700 }}>
                      <DollarSign size={14} />
                      <span>S/. {op.salary_offered.toLocaleString()}</span>
                    </div>
                  )}
                </div>

                {/* Progress bar */}
                <div style={{ background: 'var(--bg-surface-elevated)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.4rem' }}>
                    <span style={{ color: '#94a3b8' }}>Vacantes Cubiertas:</span>
                    <strong style={{ color: isFilled ? '#34d399' : '#f8fafc' }}>
                      {op.filled_count} de {op.vacancies_count} ({progress}%)
                    </strong>
                  </div>
                  <div style={{ height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '9999px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${progress}%`, background: isFilled ? '#10b981' : 'linear-gradient(90deg, #4f46e5, #818cf8)', borderRadius: '9999px' }} />
                  </div>
                </div>

                {/* Acciones de Prefiltro, Publicar y Ranking */}
                <div style={{ display: 'flex', gap: '0.4rem', marginTop: 'auto', paddingTop: '0.5rem', borderTop: '1px solid #1e1e1e' }}>
                  <button
                    onClick={() => setConfigOpening(op)}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 4,
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid #2a2a2a',
                      color: '#cbd5e1',
                      padding: '0.45rem',
                      borderRadius: '0.5rem',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                    }}
                    title="Configurar requisitos obligatorios, reglas y pesos puntuables"
                  >
                    <Sliders size={13} color="#dc2626" />
                    <span>Reglas</span>
                  </button>

                  <button
                    onClick={() => navigate('/recruitment/captacion/publicaciones')}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 4,
                      background: 'rgba(37,99,235,0.15)',
                      border: '1px solid rgba(37,99,235,0.3)',
                      color: '#60a5fa',
                      padding: '0.45rem',
                      borderRadius: '0.5rem',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                    }}
                    title="Crear o ver publicaciones de captación para esta convocatoria"
                  >
                    <Megaphone size={13} />
                    <span>Publicar</span>
                  </button>

                  <button
                    onClick={() => handleOpenRanking(op)}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 4,
                      background: 'rgba(220,38,38,0.12)',
                      border: '1px solid rgba(220,38,38,0.3)',
                      color: '#dc2626',
                      padding: '0.45rem',
                      borderRadius: '0.5rem',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                    }}
                    title="Ver Ranking de Mejores Candidatos del Prefiltro"
                  >
                    <Award size={13} />
                    <span>Ranking</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── MODAL NUEVA CONVOCATORIA ────────────────────────────────────────── */}
      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ padding: '2rem', maxWidth: '600px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Briefcase size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', color: '#f8fafc' }}>Crear Requerimiento / Convocatoria</h3>
                  <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Security Force S.A.C.</p>
                </div>
              </div>
              <button onClick={() => setModalOpen(false)} style={{ background: 'transparent', color: '#94a3b8' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateOpening}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.35rem' }}>
                    Categoría de Puesto <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    style={{ width: '100%' }}
                  >
                    <option value="">-- Sin Categoría Específica --</option>
                    {categories.map((c, idx) => (
                      <option key={c.id || `cat-option-${idx}`} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', paddingTop: '1.2rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', color: '#cbd5e1', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={createFromTemplate}
                      onChange={(e) => setCreateFromTemplate(e.target.checked)}
                      style={{ accentColor: '#dc2626' }}
                    />
                    <span>Cargar plantilla de requisitos sugeridos</span>
                  </label>
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.35rem' }}>
                  Título del Puesto / Convocatoria <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej: Agentes de Seguridad - Sede Minera Cusco"
                  required
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.35rem' }}>
                    Tipo de Puesto
                  </label>
                  <select value={positionType} onChange={(e) => setPositionType(e.target.value)} style={{ width: '100%' }}>
                    <option value="Agente de Seguridad">Agente de Seguridad</option>
                    <option value="Conductor Escolta">Conductor Escolta</option>
                    <option value="Operador CCTV">Operador CCTV</option>
                    <option value="Supervisor de Sede">Supervisor de Sede</option>
                    <option value="Resguardo Personal">Resguardo Personal</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.35rem' }}>
                    Cliente / Unidad
                  </label>
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Ej: Banco Continental / Mall Aventura"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.85rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.35rem' }}>
                    Sede / Ubicación <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="San Isidro, Lima"
                    required
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.35rem' }}>
                    Vacantes Requeridas <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={vacanciesCount}
                    onChange={(e) => setVacanciesCount(Number(e.target.value))}
                    required
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.35rem' }}>
                    Salario Ofertado (S/.)
                  </label>
                  <input
                    type="number"
                    min={1000}
                    value={salaryOffered}
                    onChange={(e) => setSalaryOffered(e.target.value ? Number(e.target.value) : '')}
                    placeholder="1800"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.35rem' }}>
                  Jornada / Turno
                </label>
                <input
                  type="text"
                  value={shiftType}
                  onChange={(e) => setShiftType(e.target.value)}
                  placeholder="12x12 Rotativo (4x2) / 6x1"
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.35rem' }}>
                  Descripción y Requisitos del Puesto
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detallar requisitos de carné SUCAMEC, experiencia mínima, etc..."
                  rows={3}
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={formLoading}>
                  {formLoading ? 'Guardando...' : 'Crear Convocatoria'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL DE CONFIGURACIÓN DE REGLAS Y PESOS ────────────────────── */}
      {configOpening && (
        <RequirementConfigModal
          openingId={configOpening.id}
          openingTitle={configOpening.title}
          onClose={() => setConfigOpening(null)}
          onSaved={() => {
            fetchOpenings();
          }}
        />
      )}

      {/* ─── MODAL DE RANKING Y TOP CANDIDATOS ─────────────────────────────── */}
      {rankingOpening && (
        <div className="modal-overlay" onClick={() => setRankingOpening(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ padding: '2rem', maxWidth: '850px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(220,38,38,0.15)', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Award size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', color: '#f8fafc' }}>Ranking Oficial de Candidatos — Prefiltro</h3>
                  <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{rankingOpening.title}</p>
                </div>
              </div>
              <button onClick={() => setRankingOpening(null)} style={{ background: 'transparent', color: '#94a3b8' }}>
                <X size={20} />
              </button>
            </div>

            {rankingLoading ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                Calculando ranking explicable...
              </div>
            ) : rankingList.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                No hay postulantes registrados en esta convocatoria aún.
              </div>
            ) : (
              <div style={{ overflowX: 'auto', maxHeight: '60vh' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                      <th style={{ padding: '0.75rem 1rem' }}>Posición</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Candidato</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Estado Prefiltro</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Compatibilidad</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Exp. Acreditada</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Rúbrica</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rankingList.map((cand, idx) => (
                      <tr key={cand.application_id || `rank-${idx}`} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <span style={{
                            display: 'inline-block',
                            width: 26,
                            height: 26,
                            borderRadius: '50%',
                            textAlign: 'center',
                            lineHeight: '26px',
                            fontWeight: 800,
                            fontSize: '0.8rem',
                            background: cand.rankPosition === 1 ? '#eab308' : cand.rankPosition === 2 ? '#94a3b8' : cand.rankPosition === 3 ? '#b45309' : '#1e1e1e',
                            color: cand.rankPosition <= 3 ? '#000' : '#fff',
                          }}>
                            #{cand.rankPosition}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <div style={{ fontWeight: 700, color: '#fff' }}>{cand.first_name} {cand.last_name}</div>
                          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>DNI: {cand.document_number} · Cel: {cand.phone}</div>
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          {cand.prefilter_status === 'eligible' && <span style={{ color: '#22c55e', fontWeight: 700, fontSize: '0.75rem', background: 'rgba(34,197,94,0.12)', padding: '2px 8px', borderRadius: '12px' }}>🟢 APTO</span>}
                          {cand.prefilter_status === 'review' && <span style={{ color: '#f59e0b', fontWeight: 700, fontSize: '0.75rem', background: 'rgba(245,158,11,0.12)', padding: '2px 8px', borderRadius: '12px' }}>🟡 REVISAR</span>}
                          {cand.prefilter_status === 'ineligible' && <span style={{ color: '#ef4444', fontWeight: 700, fontSize: '0.75rem', background: 'rgba(239,68,68,0.12)', padding: '2px 8px', borderRadius: '12px' }}>🔴 NO APTO</span>}
                          {(!cand.prefilter_status || cand.prefilter_status === 'pending') && <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>⚪ PENDIENTE</span>}
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <strong style={{ fontSize: '1rem', color: '#fff' }}>{cand.prefilter_score || 0}%</strong>
                        </td>
                        <td style={{ padding: '0.75rem 1rem', color: '#cbd5e1' }}>
                          {Math.floor((cand.total_accredited_exp_months || 0) / 12)}a {(cand.total_accredited_exp_months || 0) % 12}m
                        </td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                          <button
                            onClick={() => setEvalAppId(cand.application_id)}
                            style={{
                              background: 'rgba(220,38,38,0.12)',
                              border: '1px solid rgba(220,38,38,0.3)',
                              color: '#dc2626',
                              padding: '4px 10px',
                              borderRadius: '0.375rem',
                              cursor: 'pointer',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                            }}
                          >
                            <Eye size={13} />
                            <span>Ver Rúbrica</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── MODAL DE EVALUACIÓN INDIVIDUAL (RÚBRICA Y OVERRIDES) ─────────────── */}
      {evalAppId && (
        <EvaluationModal
          applicationId={evalAppId}
          onClose={() => setEvalAppId(null)}
        />
      )}
    </div>
  );
};
