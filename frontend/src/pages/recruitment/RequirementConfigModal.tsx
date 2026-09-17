import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../../api/client';
import {
  X,
  Plus,
  Trash2,
  Save,
  Sliders,
  AlertCircle,
  CheckCircle2,
  Layers,
  HelpCircle,
  GripVertical,
} from 'lucide-react';

interface RequirementConfig {
  id?: string;
  code: string;
  title: string;
  description?: string;
  requirement_type: 'eliminatory' | 'scoreable' | 'documental' | 'eliminatory_scoreable' | 'informative';
  rule_type: 'range' | 'min' | 'max' | 'boolean' | 'exists' | 'validity' | 'text_category' | 'experience_total' | 'experience_specific' | 'document_evidence' | 'date_range' | 'numeric' | 'list_contains';
  rule_config: Record<string, any>;
  weight_score: number;
  required_document_type?: string;
  order_index: number;
  is_active: boolean;
}

interface RequirementConfigModalProps {
  openingId: string;
  openingTitle: string;
  onClose: () => void;
  onSaved?: () => void;
}

const REQUIREMENT_TYPES = [
  { value: 'eliminatory', label: '🔴 Eliminatorio (Descalifica si no cumple)' },
  { value: 'scoreable', label: '⭐ Puntuable (Aporta puntos al ranking)' },
  { value: 'eliminatory_scoreable', label: '⚡ Eliminatorio + Puntuable (Exige mínimo y da puntos extras)' },
  { value: 'documental', label: '📄 Documental (Requiere evidencia válida)' },
  { value: 'informative', label: 'ℹ️ Informativo (Solo registro de datos)' },
];

const RULE_TYPES = [
  { value: 'range', label: 'Rango Numérico (ej: Edad 21 a 55)' },
  { value: 'min', label: 'Mínimo Numérico (ej: Estatura >= 172 cm)' },
  { value: 'validity', label: 'Vigencia de Estado (ej: SUCAMEC Vigente)' },
  { value: 'experience_total', label: 'Experiencia Total (Meses en seguridad)' },
  { value: 'experience_specific', label: 'Experiencia Específica (Supervisor, Conductor, CCTV)' },
  { value: 'document_evidence', label: 'Evidencia Documental (CUL, DNI, Certificados)' },
  { value: 'boolean', label: 'Booleano Sí/No (Armas L1/L2, Brevete, FFAA)' },
  { value: 'exists', label: 'Existencia de Registro' },
];

const DOCUMENT_TYPES = [
  { value: '', label: '-- Ningún documento requerido --' },
  { value: 'dni', label: 'DNI / Carné de Extranjería' },
  { value: 'cul', label: 'Certificado Único Laboral (CUL / Certiadulto)' },
  { value: 'sucamec', label: 'Carné SUCAMEC' },
  { value: 'cert_trabajo', label: 'Certificado Laboral de Trabajo' },
  { value: 'cert_estudios', label: 'Certificado de Estudios (Secundaria/Técnico)' },
  { value: 'lic_armas', label: 'Licencia de Porte de Armas (L1/L2)' },
  { value: 'brevete', label: 'Brevete de Conducir (A1/A2B)' },
  { value: 'cv', label: 'Curriculum Vitae Documentado' },
];

export const RequirementConfigModal: React.FC<RequirementConfigModalProps> = ({
  openingId,
  openingTitle,
  onClose,
  onSaved,
}) => {
  const [requirements, setRequirements] = useState<RequirementConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadRequirements = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.get<RequirementConfig[]>(`/recruitment/openings/${openingId}/requirements`);
      if (data && data.length > 0) {
        setRequirements(data);
      } else {
        // Requisitos plantilla por defecto
        setRequirements([
          {
            code: 'REQ_AGE',
            title: 'Edad Permitida (21 a 55 años)',
            requirement_type: 'eliminatory',
            rule_type: 'range',
            rule_config: { min: 21, max: 55 },
            weight_score: 0,
            required_document_type: 'dni',
            order_index: 1,
            is_active: true,
          },
          {
            code: 'REQ_EXP_MIN',
            title: 'Experiencia Total en Seguridad',
            requirement_type: 'eliminatory_scoreable',
            rule_type: 'experience_total',
            rule_config: { minMonths: 12, maxScoreMonths: 36 },
            weight_score: 35,
            required_document_type: 'cert_trabajo',
            order_index: 2,
            is_active: true,
          },
          {
            code: 'REQ_SUCAMEC',
            title: 'Carné SUCAMEC Vigente',
            requirement_type: 'eliminatory',
            rule_type: 'validity',
            rule_config: { expectedStatus: 'valid', allowInProcess: true },
            weight_score: 0,
            required_document_type: 'sucamec',
            order_index: 3,
            is_active: true,
          },
          {
            code: 'REQ_CUL',
            title: 'Certificado Único Laboral (CUL)',
            requirement_type: 'documental',
            rule_type: 'document_evidence',
            rule_config: { documentType: 'cul', maxAgeDays: 90 },
            weight_score: 35,
            required_document_type: 'cul',
            order_index: 4,
            is_active: true,
          },
          {
            code: 'REQ_MILITARY',
            title: 'Licenciado de Fuerzas Armadas (FFAA)',
            requirement_type: 'scoreable',
            rule_type: 'boolean',
            rule_config: { field: 'military_service', targetValue: true },
            weight_score: 30,
            required_document_type: '',
            order_index: 5,
            is_active: true,
          },
        ]);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Error al cargar requisitos.');
    } finally {
      setLoading(false);
    }
  }, [openingId]);

  useEffect(() => {
    loadRequirements();
  }, [loadRequirements]);

  const addRequirement = () => {
    const newIdx = requirements.length + 1;
    const newReq: RequirementConfig = {
      code: `REQ_CUSTOM_${Date.now().toString().slice(-4)}`,
      title: 'Nuevo Requisito Personalizado',
      requirement_type: 'scoreable',
      rule_type: 'min',
      rule_config: { min: 1 },
      weight_score: 10,
      order_index: newIdx,
      is_active: true,
    };
    setRequirements([...requirements, newReq]);
  };

  const removeRequirement = (index: number) => {
    const updated = requirements.filter((_, i) => i !== index);
    setRequirements(updated);
  };

  const updateRequirement = (index: number, field: keyof RequirementConfig, value: any) => {
    const updated = [...requirements];
    updated[index] = { ...updated[index], [field]: value };
    setRequirements(updated);
  };

  const updateRuleConfig = (index: number, key: string, value: any) => {
    const updated = [...requirements];
    const currentConfig = updated[index].rule_config || {};
    updated[index] = {
      ...updated[index],
      rule_config: { ...currentConfig, [key]: value },
    };
    setRequirements(updated);
  };

  // Cálculo de pesos totales
  const totalScoreableWeight = requirements
    .filter((r) => r.is_active && (r.requirement_type === 'scoreable' || r.requirement_type === 'eliminatory_scoreable' || r.requirement_type === 'documental'))
    .reduce((sum, r) => sum + Number(r.weight_score || 0), 0);

  const saveAll = async () => {
    try {
      setSaving(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      const payload = {
        requirements: requirements.map((r, idx) => ({
          ...r,
          order_index: idx + 1,
          weight_score: Number(r.weight_score) || 0,
        })),
      };

      const res = await api.post<{ message: string; totalScoreableWeight: number }>(
        `/recruitment/openings/${openingId}/requirements`,
        payload
      );

      setSuccessMsg(res.message);
      if (onSaved) onSaved();
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Error al guardar los requisitos.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0,0,0,0.8)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '2rem 1rem',
        overflowY: 'auto',
      }}
    >
      <div
        style={{
          background: '#0d0d0d',
          border: '1px solid #222',
          borderRadius: '1rem',
          width: '100%',
          maxWidth: '960px',
          color: '#e2e8f0',
          boxShadow: '0 25px 80px rgba(0,0,0,0.9)',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1.5rem 2rem',
            borderBottom: '1px solid #1e1e1e',
            background: 'linear-gradient(135deg, #111, #1a0505)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: '50%',
                background: 'rgba(220,38,38,0.15)',
                border: '1px solid rgba(220,38,38,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Sliders size={20} color="#dc2626" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#fff' }}>
                Configuración de Requisitos y Pesos del Prefiltro
              </div>
              <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 2 }}>
                Convocatoria: <span style={{ color: '#dc2626', fontWeight: 600 }}>{openingTitle}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 4 }}
          >
            <X size={22} />
          </button>
        </div>

        {/* Banner de Información y Pesos */}
        <div
          style={{
            padding: '1rem 2rem',
            background: '#111',
            borderBottom: '1px solid #1e1e1e',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 6 }}>
            <HelpCircle size={16} color="#64748b" />
            <span>
              Los requisitos <b style={{ color: '#dc2626' }}>Eliminatorios</b> descalifican automáticamente si no se cumplen. Los <b style={{ color: '#f59e0b' }}>Puntuables</b> definen el ranking (0-100 pts).
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 14px',
              borderRadius: '20px',
              background: totalScoreableWeight === 100 ? 'rgba(22,163,74,0.15)' : 'rgba(217,119,6,0.15)',
              border: `1px solid ${totalScoreableWeight === 100 ? '#16a34a' : '#d97706'}`,
            }}
          >
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>PESO TOTAL PUNTUABLE:</span>
            <span style={{ fontSize: '0.95rem', fontWeight: 800, color: totalScoreableWeight === 100 ? '#22c55e' : '#f59e0b' }}>
              {totalScoreableWeight} / 100 pts
            </span>
            {totalScoreableWeight === 100 ? (
              <CheckCircle2 size={16} color="#22c55e" />
            ) : (
              <span style={{ fontSize: '0.7rem', color: '#f59e0b' }}>(Se normalizará a 100)</span>
            )}
          </div>
        </div>

        {/* Mensajes de Alerta */}
        {errorMsg && (
          <div style={{ margin: '1rem 2rem 0', padding: '0.75rem 1rem', background: 'rgba(220,38,38,0.15)', border: '1px solid #dc2626', borderRadius: '0.5rem', color: '#ef4444', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertCircle size={16} /> {errorMsg}
          </div>
        )}
        {successMsg && (
          <div style={{ margin: '1rem 2rem 0', padding: '0.75rem 1rem', background: 'rgba(22,163,74,0.15)', border: '1px solid #16a34a', borderRadius: '0.5rem', color: '#22c55e', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <CheckCircle2 size={16} /> {successMsg}
          </div>
        )}

        {/* Lista de Requisitos */}
        <div style={{ padding: '1.5rem 2rem', maxHeight: '55vh', overflowY: 'auto' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
              Cargando reglas y requisitos...
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {requirements.map((req, index) => (
                <div
                  key={index}
                  style={{
                    background: '#141414',
                    border: '1px solid #242424',
                    borderRadius: '0.75rem',
                    padding: '1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.875rem',
                  }}
                >
                  {/* Fila 1: Título y Acciones */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ color: '#475569', display: 'flex', alignItems: 'center' }}>
                      <GripVertical size={16} />
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, marginLeft: 4 }}>#{index + 1}</span>
                    </div>

                    <input
                      type="text"
                      value={req.title}
                      onChange={(e) => updateRequirement(index, 'title', e.target.value)}
                      placeholder="Nombre del requisito (ej: Edad Permitida, SUCAMEC Vigente)"
                      style={{
                        flex: 1,
                        background: '#0d0d0d',
                        border: '1px solid #2b2b2b',
                        borderRadius: '0.5rem',
                        padding: '0.625rem 0.875rem',
                        color: '#fff',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                      }}
                    />

                    <input
                      type="text"
                      value={req.code}
                      onChange={(e) => updateRequirement(index, 'code', e.target.value.toUpperCase())}
                      placeholder="CÓDIGO (ej: REQ_AGE)"
                      style={{
                        width: '140px',
                        background: '#0d0d0d',
                        border: '1px solid #2b2b2b',
                        borderRadius: '0.5rem',
                        padding: '0.625rem 0.75rem',
                        color: '#94a3b8',
                        fontSize: '0.75rem',
                        fontFamily: 'monospace',
                      }}
                    />

                    <button
                      onClick={() => removeRequirement(index)}
                      style={{
                        background: 'rgba(220,38,38,0.1)',
                        border: '1px solid rgba(220,38,38,0.2)',
                        color: '#dc2626',
                        padding: '0.5rem',
                        borderRadius: '0.5rem',
                        cursor: 'pointer',
                      }}
                      title="Eliminar requisito"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  {/* Fila 2: Tipo de Requisito, Tipo de Regla y Peso */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                    {/* Tipo de Requisito */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.7rem', color: '#64748b', marginBottom: 4, textTransform: 'uppercase', fontWeight: 600 }}>
                        Tipo de Requisito
                      </label>
                      <select
                        value={req.requirement_type}
                        onChange={(e) => updateRequirement(index, 'requirement_type', e.target.value)}
                        style={{
                          width: '100%',
                          background: '#0d0d0d',
                          border: '1px solid #2b2b2b',
                          borderRadius: '0.5rem',
                          padding: '0.5rem 0.75rem',
                          color: '#e2e8f0',
                          fontSize: '0.8rem',
                        }}
                      >
                        {REQUIREMENT_TYPES.map((t) => (
                          <option key={t.value} value={t.value}>
                            {t.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Tipo de Regla */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.7rem', color: '#64748b', marginBottom: 4, textTransform: 'uppercase', fontWeight: 600 }}>
                        Regla de Validación
                      </label>
                      <select
                        value={req.rule_type}
                        onChange={(e) => updateRequirement(index, 'rule_type', e.target.value)}
                        style={{
                          width: '100%',
                          background: '#0d0d0d',
                          border: '1px solid #2b2b2b',
                          borderRadius: '0.5rem',
                          padding: '0.5rem 0.75rem',
                          color: '#e2e8f0',
                          fontSize: '0.8rem',
                        }}
                      >
                        {RULE_TYPES.map((r) => (
                          <option key={r.value} value={r.value}>
                            {r.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Peso en Puntos */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.7rem', color: '#64748b', marginBottom: 4, textTransform: 'uppercase', fontWeight: 600 }}>
                        Peso (Puntos: 0 - 100)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={req.weight_score}
                        onChange={(e) => updateRequirement(index, 'weight_score', Number(e.target.value))}
                        disabled={req.requirement_type === 'eliminatory' || req.requirement_type === 'informative'}
                        style={{
                          width: '100%',
                          background: '#0d0d0d',
                          border: '1px solid #2b2b2b',
                          borderRadius: '0.5rem',
                          padding: '0.5rem 0.75rem',
                          color: req.requirement_type === 'eliminatory' ? '#475569' : '#f59e0b',
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>

                    {/* Documento Requerido */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.7rem', color: '#64748b', marginBottom: 4, textTransform: 'uppercase', fontWeight: 600 }}>
                        Documento Requerido
                      </label>
                      <select
                        value={req.required_document_type || ''}
                        onChange={(e) => updateRequirement(index, 'required_document_type', e.target.value)}
                        style={{
                          width: '100%',
                          background: '#0d0d0d',
                          border: '1px solid #2b2b2b',
                          borderRadius: '0.5rem',
                          padding: '0.5rem 0.75rem',
                          color: '#e2e8f0',
                          fontSize: '0.8rem',
                        }}
                      >
                        {DOCUMENT_TYPES.map((d) => (
                          <option key={d.value} value={d.value}>
                            {d.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Fila 3: Parámetros específicos de la regla */}
                  <div style={{ background: '#0a0a0a', padding: '0.75rem 1rem', borderRadius: '0.5rem', border: '1px solid #1a1a1a' }}>
                    <div style={{ fontSize: '0.68rem', color: '#64748b', marginBottom: 6, fontWeight: 700, textTransform: 'uppercase' }}>
                      ⚙️ Parámetros de la Regla: {req.rule_type}
                    </div>

                    {req.rule_type === 'range' && (
                      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Mínimo:</span>
                          <input
                            type="number"
                            value={req.rule_config?.min || 20}
                            onChange={(e) => updateRuleConfig(index, 'min', Number(e.target.value))}
                            style={{ width: 70, background: '#111', border: '1px solid #333', color: '#fff', padding: '4px 8px', borderRadius: 4, fontSize: '0.8rem' }}
                          />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Máximo:</span>
                          <input
                            type="number"
                            value={req.rule_config?.max || 55}
                            onChange={(e) => updateRuleConfig(index, 'max', Number(e.target.value))}
                            style={{ width: 70, background: '#111', border: '1px solid #333', color: '#fff', padding: '4px 8px', borderRadius: 4, fontSize: '0.8rem' }}
                          />
                        </div>
                      </div>
                    )}

                    {req.rule_type === 'min' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Valor Mínimo Exigido:</span>
                        <input
                          type="number"
                          value={req.rule_config?.min || 1}
                          onChange={(e) => updateRuleConfig(index, 'min', Number(e.target.value))}
                          style={{ width: 90, background: '#111', border: '1px solid #333', color: '#fff', padding: '4px 8px', borderRadius: 4, fontSize: '0.8rem' }}
                        />
                      </div>
                    )}

                    {req.rule_type === 'experience_total' && (
                      <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Mínimo Meses:</span>
                          <input
                            type="number"
                            value={req.rule_config?.minMonths || 12}
                            onChange={(e) => updateRuleConfig(index, 'minMonths', Number(e.target.value))}
                            style={{ width: 70, background: '#111', border: '1px solid #333', color: '#fff', padding: '4px 8px', borderRadius: 4, fontSize: '0.8rem' }}
                          />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Meses para Puntaje Máximo:</span>
                          <input
                            type="number"
                            value={req.rule_config?.maxScoreMonths || 36}
                            onChange={(e) => updateRuleConfig(index, 'maxScoreMonths', Number(e.target.value))}
                            style={{ width: 70, background: '#111', border: '1px solid #333', color: '#fff', padding: '4px 8px', borderRadius: 4, fontSize: '0.8rem' }}
                          />
                        </div>
                      </div>
                    )}

                    {req.rule_type === 'experience_specific' && (
                      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Patrón de Cargo (Regex):</span>
                          <input
                            type="text"
                            value={req.rule_config?.positionPattern || 'supervisor|escolta|resguardo'}
                            onChange={(e) => updateRuleConfig(index, 'positionPattern', e.target.value)}
                            style={{ width: 180, background: '#111', border: '1px solid #333', color: '#fff', padding: '4px 8px', borderRadius: 4, fontSize: '0.8rem' }}
                          />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Mínimo Meses Específicos:</span>
                          <input
                            type="number"
                            value={req.rule_config?.minMonths || 24}
                            onChange={(e) => updateRuleConfig(index, 'minMonths', Number(e.target.value))}
                            style={{ width: 70, background: '#111', border: '1px solid #333', color: '#fff', padding: '4px 8px', borderRadius: 4, fontSize: '0.8rem' }}
                          />
                        </div>
                      </div>
                    )}

                    {req.rule_type === 'validity' && (
                      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: '#94a3b8', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={req.rule_config?.allowInProcess ?? true}
                            onChange={(e) => updateRuleConfig(index, 'allowInProcess', e.target.checked)}
                          />
                          Permitir estado &quot;En Trámite&quot; como Revisión (🟡)
                        </label>
                      </div>
                    )}

                    {req.rule_type === 'boolean' && (
                      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Campo evaluado:</span>
                        <select
                          value={req.rule_config?.field || 'gun_license'}
                          onChange={(e) => updateRuleConfig(index, 'field', e.target.value)}
                          style={{ background: '#111', border: '1px solid #333', color: '#fff', padding: '4px 8px', borderRadius: 4, fontSize: '0.8rem' }}
                        >
                          <option value="gun_license">Licencia de Armas (gun_license)</option>
                          <option value="driver_license">Brevete de Conducir (driver_license)</option>
                          <option value="military_service">Servicio Militar / FFAA (military_service)</option>
                        </select>
                      </div>
                    )}

                    {req.rule_type === 'document_evidence' && (
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                        Valida la presencia física del documento cargado en la postulación.
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '1.25rem 2rem',
            borderTop: '1px solid #1e1e1e',
            background: '#111',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <button
            onClick={addRequirement}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: '#1e1e1e',
              border: '1px solid #333',
              color: '#e2e8f0',
              padding: '8px 16px',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.82rem',
            }}
          >
            <Plus size={15} /> Agregar Requisito
          </button>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: '1px solid #2b2b2b',
                color: '#64748b',
                padding: '8px 16px',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontSize: '0.82rem',
              }}
            >
              Cancelar
            </button>

            <button
              onClick={saveAll}
              disabled={saving}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: '#dc2626',
                border: 'none',
                color: '#fff',
                padding: '8px 22px',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.85rem',
                boxShadow: '0 4px 15px rgba(220,38,38,0.4)',
                opacity: saving ? 0.7 : 1,
              }}
            >
              <Save size={15} /> {saving ? 'Guardando...' : 'Guardar y Versionar Requisitos'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequirementConfigModal;
