import React, { useEffect, useState } from 'react';
import { api } from '../../api/client';
import {
  Calendar,
  Plus,
  Clock,
  MapPin,
  Video,
  CheckCircle2,
  X,
  Phone,
} from 'lucide-react';

interface InterviewItem {
  id: string;
  interview_date: string;
  location_type: 'presential' | 'virtual';
  location_notes?: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  candidate_name: string;
  candidate_phone: string;
  job_title: string;
  interviewer_name?: string;
}

interface PipelineCandidate {
  id: string; // application id
  candidate_name: string;
  candidate_dni: string;
  job_title: string;
}

export const InterviewsPage: React.FC = () => {
  const [interviews, setInterviews] = useState<InterviewItem[]>([]);
  const [pipelineApps, setPipelineApps] = useState<PipelineCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form
  const [selectedAppId, setSelectedAppId] = useState('');
  const [interviewDate, setInterviewDate] = useState('');
  const [interviewTime, setInterviewTime] = useState('10:00');
  const [locationType, setLocationType] = useState<'presential' | 'virtual'>('presential');
  const [locationNotes, setLocationNotes] = useState('Sede Central San Isidro - Sala de Entrevistas B');

  const fetchInterviews = async () => {
    try {
      setLoading(true);
      const res = await api.get<InterviewItem[]>('/recruitment/interviews');
      setInterviews(res || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInterviews();
    api.get<PipelineCandidate[]>('/recruitment/pipeline').then(setPipelineApps).catch(() => {});
  }, []);

  const handleScheduleInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppId) {
      alert('Seleccione un postulante');
      return;
    }
    setFormLoading(true);

    try {
      const fullDate = `${interviewDate}T${interviewTime}:00`;
      await api.post('/recruitment/interviews', {
        applicationId: selectedAppId,
        interviewDate: fullDate,
        locationType,
        locationNotes,
      });

      setModalOpen(false);
      setSuccessMsg('Entrevista agendada exitosamente.');
      fetchInterviews();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error al agendar entrevista');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 800, color: '#f8fafc' }}>
            Agenda de Entrevistas y Citas
          </h1>
          <p style={{ fontSize: '0.9rem', color: '#94a3b8', marginTop: '0.25rem' }}>
            Programación de entrevistas presenciales y virtuales de evaluación
          </p>
        </div>
        <button className="btn-primary" onClick={() => setModalOpen(true)}>
          <Plus size={18} />
          <span>Agendar Nueva Cita</span>
        </button>
      </div>

      {successMsg && (
        <div style={{ padding: '1rem 1.25rem', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#34d399', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {loading ? (
        <div style={{ padding: '4rem', textAlign: 'center', color: '#94a3b8' }}>
          Cargando agenda de entrevistas...
        </div>
      ) : interviews.length === 0 ? (
        <div className="glass-panel" style={{ padding: '4rem', textAlign: 'center', color: '#64748b' }}>
          No hay entrevistas programadas actualmente.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.25rem' }}>
          {interviews.map((item, idx) => (
            <div key={item.id || `interview-${idx}`} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ fontSize: '1.15rem', color: '#f8fafc' }}>{item.candidate_name}</h3>
                  <span style={{ fontSize: '0.75rem', color: '#818cf8', fontWeight: 600 }}>
                    Puesto: {item.job_title}
                  </span>
                </div>
                <span className="badge badge-available">Programada</span>
              </div>

              <div style={{ background: 'var(--bg-surface-elevated)', padding: '0.85rem', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.825rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#f8fafc', fontWeight: 700 }}>
                  <Clock size={15} color="#38bdf8" />
                  <span>
                    {new Date(item.interview_date).toLocaleDateString('es-PE')} a las{' '}
                    {new Date(item.interview_date).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#cbd5e1' }}>
                  {item.location_type === 'virtual' ? <Video size={15} color="#c084fc" /> : <MapPin size={15} color="#fbbf24" />}
                  <span>{item.location_notes || 'Sede Central'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#94a3b8' }}>
                  <Phone size={14} />
                  <span>Contacto: {item.candidate_phone}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Agendar Cita */}
      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ padding: '2rem', maxWidth: '540px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Calendar size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', color: '#f8fafc' }}>Agendar Entrevista de Selección</h3>
                  <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Security Force S.A.C.</p>
                </div>
              </div>
              <button onClick={() => setModalOpen(false)} style={{ background: 'transparent', color: '#94a3b8' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleScheduleInterview}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.35rem' }}>
                  Seleccionar Postulante <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select value={selectedAppId} onChange={(e) => setSelectedAppId(e.target.value)} required style={{ width: '100%' }}>
                  <option value="">-- Seleccione candidato en proceso --</option>
                  {pipelineApps.map((app, idx) => (
                    <option key={app.id || `pipeline-app-${idx}`} value={app.id}>
                      {app.candidate_name} (DNI {app.candidate_dni}) — {app.job_title}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.35rem' }}>
                    Fecha <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="date"
                    value={interviewDate}
                    onChange={(e) => setInterviewDate(e.target.value)}
                    required
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.35rem' }}>
                    Hora <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="time"
                    value={interviewTime}
                    onChange={(e) => setInterviewTime(e.target.value)}
                    required
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.35rem' }}>
                  Modalidad de la Entrevista
                </label>
                <select value={locationType} onChange={(e) => setLocationType(e.target.value as any)} style={{ width: '100%' }}>
                  <option value="presential">🏢 Presencial en Sede Central</option>
                  <option value="virtual">💻 Virtual (Google Meet / Zoom / WhatsApp Video)</option>
                </select>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.35rem' }}>
                  Lugar / Enlace / Instrucciones
                </label>
                <input
                  type="text"
                  value={locationNotes}
                  onChange={(e) => setLocationNotes(e.target.value)}
                  placeholder="Ej: Sede Central San Isidro - Sala B"
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={formLoading}>
                  {formLoading ? 'Agendando...' : 'Agendar Cita'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
