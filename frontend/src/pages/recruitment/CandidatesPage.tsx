import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../../api/client';
import {
  Search,
  UserPlus,
  Phone,
  MapPin,
  ChevronLeft,
  ChevronRight,
  X,
  CheckCircle2,
  Eye,
} from 'lucide-react';

interface CandidateItem {
  id: string;
  document_type: string;
  document_number: string;
  first_name: string;
  last_name: string;
  phone: string;
  email?: string;
  district?: string;
  city?: string;
  height_cm?: number;
  weight_kg?: number;
  sucamec_status: 'valid' | 'in_process' | 'none' | 'expired';
  sucamec_code?: string;
  gun_license?: boolean;
  gun_license_type?: string;
  driver_license?: boolean;
  driver_license_type?: string;
  military_service?: boolean;
  security_experience_years?: number;
  notes?: string;
  current_stage?: string;
  job_opening_title?: string;
  application_id?: string;
  prefilter_status?: 'eligible' | 'review' | 'ineligible' | 'pending';
  prefilter_score?: number;
  discrepancies_count?: number;
  created_at: string;
}

interface OpeningsSelect {
  id: string;
  title: string;
}

import { EvaluationModal } from './EvaluationModal';
import { CandidateExpedienteModal } from '../../components/CandidateExpedienteModal';

export const CandidatesPage: React.FC = () => {
  const [candidates, setCandidates] = useState<CandidateItem[]>([]);
  const [openings, setOpenings] = useState<OpeningsSelect[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sucamecFilter, setSucamecFilter] = useState('');
  const [prefilterFilter, setPrefilterFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modals
  const [newModalOpen, setNewModalOpen] = useState(false);
  const [viewModalCand, setViewModalCand] = useState<CandidateItem | null>(null);
  const [evalAppId, setEvalAppId] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form State
  const [docNumber, setDocNumber] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [district, setDistrict] = useState('');
  const [heightCm, setHeightCm] = useState<number | ''>('');
  const [weightKg, setWeightKg] = useState<number | ''>('');
  const [sucamecStatus, setSucamecStatus] = useState<'valid' | 'in_process' | 'none' | 'expired'>('valid');
  const [sucamecCode, setSucamecCode] = useState('');
  const [gunLicense, setGunLicense] = useState(false);
  const [gunLicenseType, setGunLicenseType] = useState('L1');
  const [driverLicense, setDriverLicense] = useState(false);
  const [driverLicenseType, setDriverLicenseType] = useState('A1');
  const [militaryService, setMilitaryService] = useState(false); // eslint-disable-line
  const [experienceYears, setExperienceYears] = useState<number>(1);
  const [selectedOpeningId, setSelectedOpeningId] = useState('');
  const [notes, setNotes] = useState('');

  const fetchCandidates = useCallback(async (currPage = 1, query = '', sucamec = '') => {
    try {
      setLoading(true);
      let url = `/recruitment/candidates?page=${currPage}&limit=20`;
      if (query.trim()) url += `&search=${encodeURIComponent(query.trim())}`;
      if (sucamec) url += `&sucamec=${sucamec}`;

      const res = await api.get<{ data: CandidateItem[]; pagination: { totalPages: number; total: number } }>(url);
      setCandidates(res.data || []);
      setTotalPages(res.pagination?.totalPages || 1);
      setTotalCount(res.pagination?.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCandidates(page, search, sucamecFilter);
    api.get<OpeningsSelect[]>('/recruitment/openings?status=open').then(setOpenings).catch(() => {});
  }, [fetchCandidates, page, sucamecFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchCandidates(1, search, sucamecFilter);
  };

  const handleCreateCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormLoading(true);

    try {
      await api.post('/recruitment/candidates', {
        documentType: 'DNI',
        documentNumber: docNumber.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        district: district.trim() || undefined,
        heightCm: heightCm ? Number(heightCm) : undefined,
        weightKg: weightKg ? Number(weightKg) : undefined,
        sucamecStatus,
        sucamecCode: sucamecCode.trim() || undefined,
        gunLicense,
        gunLicenseType: gunLicense ? gunLicenseType : undefined,
        driverLicense,
        driverLicenseType: driverLicense ? driverLicenseType : undefined,
        militaryService,
        securityExperienceYears: Number(experienceYears),
        jobOpeningId: selectedOpeningId || undefined,
        notes: notes.trim() || undefined,
      });

      setNewModalOpen(false);
      setSuccessMsg(`Postulante ${firstName} ${lastName} (DNI ${docNumber}) registrado exitosamente.`);
      // Reset form
      setDocNumber('');
      setFirstName('');
      setLastName('');
      setPhone('');
      setEmail('');
      setDistrict('');
      setNotes('');
      fetchCandidates(1, search, sucamecFilter);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Error al registrar postulante');
    } finally {
      setFormLoading(false);
    }
  };

  const getSucamecBadge = (status: CandidateItem['sucamec_status']) => {
    switch (status) {
      case 'valid':
        return <span className="badge badge-available">ðŸŸ¢ SUCAMEC Vigente</span>;
      case 'in_process':
        return <span className="badge badge-reserved">ðŸŸ¡ En TrÃ¡mite</span>;
      case 'expired':
        return <span className="badge badge-used">ðŸ”´ Vencido</span>;
      default:
        return <span className="badge badge-cancelled">âš« Sin CarnÃ©</span>;
    }
  };

  const getStageBadge = (stage?: string) => {
    if (!stage) return <span style={{ color: '#0f1419' }}>Sin postulaciÃ³n</span>;
    const map: Record<string, { label: string; color: string }> = {
      registered: { label: 'Registrado', color: '#1a1a1a' },
      phone_screening: { label: 'Filtro Tel.', color: '#818cf8' },
      psychological_eval: { label: 'PsicologÃ­a', color: '#38bdf8' },
      background_check: { label: 'Antecedentes', color: '#fbbf24' },
      interview: { label: 'Entrevista', color: '#f59e0b' },
      medical_exam: { label: 'Ex. MÃ©dico', color: '#f43f5e' },
      approved: { label: 'Aprobado Apto', color: '#34d399' },
      hired: { label: 'Contratado', color: '#c084fc' },
      rejected: { label: 'Descartado', color: '#ef4444' },
    };
    const s = map[stage] || { label: stage, color: '#1a1a1a' };
    return (
      <span style={{ color: s.color, fontWeight: 700, fontSize: '0.8rem', background: 'rgba(100,100,100,0.05)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
        {s.label}
      </span>
    );
  };

  const getPrefilterBadge = (status?: string, score?: number) => {
    if (!status || status === 'pending') {
      return <span style={{ color: '#1a1a1a', fontSize: '0.75rem', background: 'rgba(148,163,184,0.1)', padding: '2px 8px', borderRadius: '12px' }}>âšª Pendiente</span>;
    }
    if (status === 'eligible') {
      return (
        <span style={{ color: '#22c55e', fontWeight: 700, fontSize: '0.75rem', background: 'rgba(34,197,94,0.12)', padding: '2px 8px', borderRadius: '12px', width: 'fit-content' }}>
          ðŸŸ¢ APTO ({score ? Math.round(score) : 0}%)
        </span>
      );
    }
    if (status === 'review') {
      return (
        <span style={{ color: '#f59e0b', fontWeight: 700, fontSize: '0.75rem', background: 'rgba(245,158,11,0.12)', padding: '2px 8px', borderRadius: '12px', width: 'fit-content' }}>
          ðŸŸ¡ REVISAR ({score ? Math.round(score) : 0}%)
        </span>
      );
    }
    return (
      <span style={{ color: '#ef4444', fontWeight: 700, fontSize: '0.75rem', background: 'rgba(239,68,68,0.12)', padding: '2px 8px', borderRadius: '12px', width: 'fit-content' }}>
        ðŸ”´ NO APTO
      </span>
    );
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 800, color: '#1a1a1a' }}>
            Directorio de Postulantes
          </h1>
          <p style={{ fontSize: '0.9rem', color: '#1a1a1a', marginTop: '0.25rem' }}>
            Base de datos y perfiles de seguridad para procesos de selecciÃ³n
          </p>
        </div>
        <button className="btn-primary" onClick={() => setNewModalOpen(true)}>
          <UserPlus size={18} />
          <span>Registrar Nuevo Postulante</span>
        </button>
      </div>

      {successMsg && (
        <div style={{ padding: '1rem 1.25rem', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#34d399', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* â”€â”€â”€ FILTROS Y BÃšSQUEDA â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="glass-panel" style={{ padding: '1.25rem 1.5rem', marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.5rem', flex: '1 1 320px' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <Search size={18} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#0f1419' }} />
            <input
              type="text"
              placeholder="Buscar por DNI o Nombre de postulante..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%', paddingLeft: '2.5rem' }}
            />
          </div>
          <button type="submit" className="btn-primary">Buscar</button>
          {search && (
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setSearch('');
                fetchCandidates(1, '', sucamecFilter);
              }}
            >
              Limpiar
            </button>
          )}
        </form>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.85rem', color: '#1a1a1a' }}>SUCAMEC:</span>
          <select
            value={sucamecFilter}
            onChange={(e) => {
              setSucamecFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Todos</option>
            <option value="valid">ðŸŸ¢ Vigente</option>
            <option value="in_process">ðŸŸ¡ En trÃ¡mite</option>
            <option value="expired">ðŸ”´ Vencido</option>
            <option value="none">âš« Sin carnÃ©</option>
          </select>
        </div>
      </div>

      {/* â”€â”€â”€ TABLA DE POSTULANTES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {loading ? (
        <div style={{ padding: '4rem', textAlign: 'center', color: '#1a1a1a' }}>
          Cargando postulantes...
        </div>
      ) : candidates.length === 0 ? (
        <div className="glass-panel" style={{ padding: '4rem', textAlign: 'center', color: '#0f1419' }}>
          <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>No se encontraron postulantes</p>
          <p style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>Registra un postulante para iniciar su proceso</p>
        </div>
      ) : (
        <div className="glass-panel" style={{ overflowX: 'auto', marginBottom: '1.5rem' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: '#1a1a1a', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <th style={{ padding: '1rem 1.25rem' }}>DNI / Postulante</th>
                <th style={{ padding: '1rem 1.25rem' }}>Contacto</th>
                <th style={{ padding: '1rem 1.25rem' }}>SUCAMEC / Armas</th>
                <th style={{ padding: '1rem 1.25rem' }}>Experiencia</th>
                <th style={{ padding: '1rem 1.25rem' }}>Convocatoria</th>
                <th style={{ padding: '1rem 1.25rem' }}>Prefiltro Motor</th>
                <th style={{ padding: '1rem 1.25rem' }}>Etapa Pipeline</th>
                <th style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {candidates.map((c, idx) => (
                <tr key={c.id || c.application_id || `candidate-${idx}-${c.document_number}`} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)', transition: 'background 0.15s ease' }}>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <div style={{ fontWeight: 800, color: '#1a1a1a', fontSize: '0.95rem' }}>
                      {c.first_name} {c.last_name}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#818cf8', fontWeight: 600 }}>
                      DNI: {c.document_number}
                    </div>
                  </td>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#1a1a1a' }}>
                      <Phone size={13} color="#34d399" />
                      <span>{c.phone}</span>
                    </div>
                    {c.district && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#1a1a1a', fontSize: '0.75rem', marginTop: '2px' }}>
                        <MapPin size={12} />
                        <span>{c.district}</span>
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <div style={{ marginBottom: '4px' }}>{getSucamecBadge(c.sucamec_status)}</div>
                    {c.gun_license && (
                      <span style={{ fontSize: '0.72rem', color: '#fbbf24', fontWeight: 700 }}>
                        ðŸ”« Arma ({c.gun_license_type || 'L1'})
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '1rem 1.25rem', color: '#1a1a1a' }}>
                    <strong>{c.security_experience_years || 0} aÃ±os</strong>
                    {c.military_service && (
                      <div style={{ fontSize: '0.72rem', color: '#38bdf8' }}>ðŸŽ–ï¸ Servicio Militar</div>
                    )}
                  </td>
                  <td style={{ padding: '1rem 1.25rem', color: '#1a1a1a', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {c.job_opening_title || <span style={{ color: '#0f1419' }}>Sin asignar</span>}
                  </td>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    {getPrefilterBadge(c.prefilter_status, c.prefilter_score)}
                  </td>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    {getStageBadge(c.current_stage)}
                  </td>
                  <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                      {c.application_id && (
                        <button
                          onClick={() => setEvalAppId(c.application_id!)}
                          style={{
                            background: 'rgba(220,38,38,0.12)',
                            border: '1px solid rgba(220,38,38,0.3)',
                            color: '#dc2626',
                            padding: '0.4rem 0.65rem',
                            borderRadius: '0.375rem',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                          title="Ver EvaluaciÃ³n y Evidencias"
                        >
                          <span>ðŸ” RÃºbrica</span>
                        </button>
                      )}
                      <button
                        onClick={() => setViewModalCand(c)}
                        className="btn-secondary"
                        style={{ padding: '0.4rem 0.65rem' }}
                        title="Ver Expediente Completo"
                      >
                        <Eye size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* PaginaciÃ³n */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
        <span style={{ fontSize: '0.85rem', color: '#1a1a1a' }}>
          Total {totalCount} postulantes (PÃ¡gina {page} de {totalPages})
        </span>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn-secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            <ChevronLeft size={16} />
            <span>Anterior</span>
          </button>
          <button className="btn-secondary" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            <span>Siguiente</span>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* â”€â”€â”€ MODAL REGISTRAR POSTULANTE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {newModalOpen && (
        <div className="modal-overlay" onClick={() => setNewModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ padding: '2rem', maxWidth: '680px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <UserPlus size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', color: '#1a1a1a' }}>Ficha de Registro de Postulante</h3>
                  <p style={{ fontSize: '0.8rem', color: '#1a1a1a' }}>Security Force S.A.C.</p>
                </div>
              </div>
              <button onClick={() => setNewModalOpen(false)} style={{ background: 'transparent', color: '#1a1a1a' }}>
                <X size={20} />
              </button>
            </div>

            {formError && (
              <div style={{ padding: '0.75rem 1rem', background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem', fontSize: '0.875rem' }}>
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateCandidate}>
              {/* Datos Personales */}
              <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#818cf8', textTransform: 'uppercase', marginBottom: '0.75rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.35rem' }}>
                1. Datos Personales
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.85rem', marginBottom: '0.85rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#1a1a1a', marginBottom: '0.3rem' }}>
                    DNI <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={docNumber}
                    onChange={(e) => setDocNumber(e.target.value)}
                    placeholder="8 dÃ­gitos"
                    required
                    maxLength={12}
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#1a1a1a', marginBottom: '0.3rem' }}>
                    Nombres <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Juan Carlos"
                    required
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#1a1a1a', marginBottom: '0.3rem' }}>
                    Apellidos <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Quispe Flores"
                    required
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.85rem', marginBottom: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#1a1a1a', marginBottom: '0.3rem' }}>
                    Celular / WhatsApp <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="987654321"
                    required
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#1a1a1a', marginBottom: '0.3rem' }}>
                    Distrito de Residencia
                  </label>
                  <input
                    type="text"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    placeholder="San Juan de Lurigancho"
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#1a1a1a', marginBottom: '0.3rem' }}>
                    Correo ElectrÃ³nico
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="postulante@gmail.com"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              {/* Perfil de Seguridad */}
              <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#818cf8', textTransform: 'uppercase', marginBottom: '0.75rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.35rem' }}>
                2. Perfil Operativo y Seguridad
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.85rem', marginBottom: '0.85rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#1a1a1a', marginBottom: '0.3rem' }}>
                    Estado SUCAMEC
                  </label>
                  <select value={sucamecStatus} onChange={(e) => setSucamecStatus(e.target.value as any)} style={{ width: '100%' }}>
                    <option value="valid">ðŸŸ¢ CarnÃ© Vigente</option>
                    <option value="in_process">ðŸŸ¡ En TrÃ¡mite</option>
                    <option value="none">âš« Sin CarnÃ©</option>
                    <option value="expired">ðŸ”´ Vencido</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#1a1a1a', marginBottom: '0.3rem' }}>
                    CÃ³digo SUCAMEC
                  </label>
                  <input
                    type="text"
                    value={sucamecCode}
                    onChange={(e) => setSucamecCode(e.target.value)}
                    placeholder="SUC-2026-..."
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#1a1a1a', marginBottom: '0.3rem' }}>
                    AÃ±os de Experiencia
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={experienceYears}
                    onChange={(e) => setExperienceYears(Number(e.target.value))}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0.85rem', marginBottom: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#1a1a1a', marginBottom: '0.3rem' }}>
                    Estatura (cm)
                  </label>
                  <input
                    type="number"
                    value={heightCm}
                    onChange={(e) => setHeightCm(e.target.value ? Number(e.target.value) : '')}
                    placeholder="175"
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#1a1a1a', marginBottom: '0.3rem' }}>
                    Peso (kg)
                  </label>
                  <input
                    type="number"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value ? Number(e.target.value) : '')}
                    placeholder="75"
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: '#1a1a1a', cursor: 'pointer', marginBottom: '0.2rem' }}>
                    <input
                      type="checkbox"
                      checked={gunLicense}
                      onChange={(e) => setGunLicense(e.target.checked)}
                    />
                    <span>Porte Armas</span>
                  </label>
                  {gunLicense && (
                    <input
                      type="text"
                      value={gunLicenseType}
                      onChange={(e) => setGunLicenseType(e.target.value)}
                      placeholder="L1 / L2"
                      style={{ width: '100%' }}
                    />
                  )}
                </div>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: '#1a1a1a', cursor: 'pointer', marginBottom: '0.2rem' }}>
                    <input
                      type="checkbox"
                      checked={driverLicense}
                      onChange={(e) => setDriverLicense(e.target.checked)}
                    />
                    <span>Brevete</span>
                  </label>
                  {driverLicense && (
                    <input
                      type="text"
                      value={driverLicenseType}
                      onChange={(e) => setDriverLicenseType(e.target.value)}
                      placeholder="A1 / A2B"
                      style={{ width: '100%' }}
                    />
                  )}
                </div>
              </div>

              {/* Convocatoria Inicial */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#1a1a1a', marginBottom: '0.3rem' }}>
                  Postular a Convocatoria / Vacante Inicial
                </label>
                <select value={selectedOpeningId} onChange={(e) => setSelectedOpeningId(e.target.value)} style={{ width: '100%' }}>
                  <option value="">-- Todas las Convocatorias --</option>
                  {openings.map((op, idx) => (
                    <option key={op.id || `op-filter-${idx}`} value={op.id}>
                      {op.title}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#1a1a1a', marginBottom: '0.3rem' }}>
                  Observaciones Iniciales del Reclutador
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Detalles sobre disponibilidad, sede de preferencia o actitud..."
                  rows={2}
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setNewModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={formLoading}>
                  {formLoading ? 'Registrando...' : 'Registrar Postulante'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* â”€â”€â”€ MODAL EXPEDIENTE DIGITAL DEL POSTULANTE (FASE 2.5) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {viewModalCand && (
        <CandidateExpedienteModal
          candidateId={viewModalCand.id}
          onClose={() => setViewModalCand(null)}
        />
      )}

      {/* â”€â”€â”€ MODAL DE EVALUACIÃ“N Y RÃšBRICA EXPLICABLE DEL MOTOR â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {evalAppId && (
        <EvaluationModal
          applicationId={evalAppId}
          onClose={() => {
            setEvalAppId(null);
            fetchCandidates(page, search, sucamecFilter);
          }}
        />
      )}
    </div>
  );
};





