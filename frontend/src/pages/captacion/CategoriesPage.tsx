import React, { useEffect, useState } from 'react';
import { api } from '../../api/client';
import {
  Layers,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Shield,
  UserCheck,
  Eye,
  Truck,
  Briefcase,
  Grid,
  X,
  AlertCircle,
  FileText,
  Sliders,
} from 'lucide-react';

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  color_hex?: string;
  description?: string;
  template_requirements: any[];
  is_active: boolean;
  order_index: number;
  openings_count?: number;
  active_publications_count?: number;
}

const AVAILABLE_ICONS = [
  { label: 'Escudo / Seguridad', value: 'Shield', icon: Shield },
  { label: 'Supervisor / Liderazgo', value: 'UserCheck', icon: UserCheck },
  { label: 'CCTV / Monitoreo', value: 'Eye', icon: Eye },
  { label: 'Transporte / Conductor', value: 'Truck', icon: Truck },
  { label: 'Administrativo / Oficina', value: 'Briefcase', icon: Briefcase },
  { label: 'General / Otros', value: 'Grid', icon: Grid },
];

const PRESET_COLORS = ['#2563eb', '#7c3aed', '#0284c7', '#d97706', '#059669', '#dc2626', '#64748b'];

export const CategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [icon, setIcon] = useState('Shield');
  const [colorHex, setColorHex] = useState('#2563eb');
  const [description, setDescription] = useState('');
  const [orderIndex, setOrderIndex] = useState(0);
  const [templateReqsJson, setTemplateReqsJson] = useState('[]');
  const [formLoading, setFormLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function loadCategories() {
    try {
      setLoading(true);
      const data = await api.get<CategoryItem[]>('/recruitment/captacion/categories?includeInactive=true');
      setCategories(data || []);
    } catch (err) {
      console.error('Error al cargar categorÃ­as:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCategories();
  }, []);

  function handleOpenCreate() {
    setEditingCategory(null);
    setName('');
    setSlug('');
    setIcon('Shield');
    setColorHex('#2563eb');
    setDescription('');
    setOrderIndex(categories.length + 1);
    setTemplateReqsJson(
      JSON.stringify(
        [
          {
            code: 'REQ_AGE',
            title: 'Rango de Edad (19-55 aÃ±os)',
            requirement_type: 'eliminatory',
            rule_type: 'range',
            rule_config: { min: 19, max: 55, field: 'birth_date' },
            weight_score: 0,
            order_index: 1,
          },
          {
            code: 'REQ_SUCAMEC',
            title: 'CarnÃ© SUCAMEC Vigente',
            requirement_type: 'eliminatory',
            rule_type: 'validity',
            rule_config: { expectedStatus: 'valid', allowInProcess: true },
            weight_score: 0,
            order_index: 2,
          },
          {
            code: 'REQ_EXP_TOTAL',
            title: 'Experiencia en Seguridad',
            requirement_type: 'eliminatory_scoreable',
            rule_type: 'experience_total',
            rule_config: { minMonths: 6, maxScoreMonths: 36 },
            weight_score: 50,
            order_index: 3,
          },
          {
            code: 'REQ_DOC_CUL',
            title: 'Certificado Ãšnico Laboral (CUL)',
            requirement_type: 'documental',
            rule_type: 'document_evidence',
            rule_config: { documentType: 'cul', maxAgeDays: 90 },
            weight_score: 50,
            order_index: 4,
          },
        ],
        null,
        2
      )
    );
    setErrorMsg(null);
    setModalOpen(true);
  }

  function handleOpenEdit(cat: CategoryItem) {
    setEditingCategory(cat);
    setName(cat.name);
    setSlug(cat.slug);
    setIcon(cat.icon || 'Shield');
    setColorHex(cat.color_hex || '#2563eb');
    setDescription(cat.description || '');
    setOrderIndex(cat.order_index || 0);
    setTemplateReqsJson(JSON.stringify(cat.template_requirements || [], null, 2));
    setErrorMsg(null);
    setModalOpen(true);
  }

  async function handleToggleActive(id: string) {
    try {
      await api.patch(`/recruitment/captacion/categories/${id}/toggle`, {});
      loadCategories();
    } catch (err) {
      console.error('Error al cambiar estado de categorÃ­a:', err);
    }
  }

  async function handleSubmitForm(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('El nombre de la categorÃ­a es obligatorio.');
      return;
    }

    let parsedTemplate = [];
    try {
      parsedTemplate = JSON.parse(templateReqsJson);
      if (!Array.isArray(parsedTemplate)) {
        throw new Error('La plantilla debe ser un arreglo de requisitos.');
      }
    } catch (err: any) {
      setErrorMsg(`Error en el formato JSON de requisitos sugeridos: ${err.message}`);
      return;
    }

    try {
      setFormLoading(true);
      setErrorMsg(null);

      const payload = {
        name: name.trim(),
        slug: slug.trim() || undefined,
        icon,
        colorHex,
        description: description.trim() || undefined,
        templateRequirements: parsedTemplate,
        orderIndex,
        isActive: true,
      };

      if (editingCategory) {
        await api.put(`/recruitment/captacion/categories/${editingCategory.id}`, payload);
      } else {
        await api.post('/recruitment/captacion/categories', payload);
      }

      setModalOpen(false);
      loadCategories();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al guardar la categorÃ­a.');
    } finally {
      setFormLoading(false);
    }
  }

  const renderIcon = (iconName?: string) => {
    switch (iconName) {
      case 'UserCheck':
        return <UserCheck size={18} />;
      case 'Eye':
        return <Eye size={18} />;
      case 'Truck':
        return <Truck size={18} />;
      case 'Briefcase':
        return <Briefcase size={18} />;
      case 'Grid':
        return <Grid size={18} />;
      default:
        return <Shield size={18} />;
    }
  };

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1300px', margin: '0 auto', color: '#1a1a1a' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
            <div style={{ padding: '0.5rem', borderRadius: '8px', background: 'rgba(37,99,235,0.15)', border: '1px solid rgba(37,99,235,0.4)', color: '#60a5fa' }}>
              <Layers size={22} />
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: '#1a1a1a' }}>
              CategorÃ­as de Puesto y Plantillas
            </h1>
          </div>
          <p style={{ color: '#1a1a1a', fontSize: '0.875rem', margin: 0 }}>
            ConfiguraciÃ³n multi-tenant de categorÃ­as de seguridad y plantillas de requisitos base sugeridos.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.65rem 1.25rem',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
            border: 'none',
            color: '#fff',
            fontWeight: 700,
            fontSize: '0.875rem',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(37,99,235,0.3)',
          }}
        >
          <Plus size={16} />
          <span>Nueva CategorÃ­a</span>
        </button>
      </div>

      {/* Categories Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem 0', color: '#1a1a1a' }}>Cargando categorÃ­as...</div>
      ) : categories.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 0', background: '#e8e8f0827', borderRadius: '12px', border: '1px solid #d8d8e0' }}>
          <Layers size={36} color="#64748b" style={{ margin: '0 auto 0.75rem', display: 'block' }} />
          <p style={{ color: '#1a1a1a', fontWeight: 600 }}>No hay categorÃ­as registradas en esta empresa.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.25rem' }}>
          {categories.map((cat, idx) => (
            <div
              key={cat.id || `category-${idx}-${cat.slug || 'cat'}`}
              style={{
                background: '#e8e8f0827',
                border: '1px solid #d8d8e0',
                borderRadius: '12px',
                padding: '1.25rem',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                opacity: cat.is_active ? 1 : 0.6,
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '8px',
                        background: `${cat.color_hex || '#2563eb'}22`,
                        border: `1px solid ${cat.color_hex || '#2563eb'}66`,
                        color: cat.color_hex || '#2563eb',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {renderIcon(cat.icon)}
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: '#1a1a1a' }}>{cat.name}</h3>
                      <span style={{ fontSize: '0.75rem', color: '#0f1419', fontFamily: 'monospace' }}>slug: {cat.slug}</span>
                    </div>
                  </div>

                  <span
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      padding: '0.2rem 0.5rem',
                      borderRadius: '999px',
                      background: cat.is_active ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                      color: cat.is_active ? '#4ade80' : '#f87171',
                      border: `1px solid ${cat.is_active ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
                    }}
                  >
                    {cat.is_active ? 'Activa' : 'Inactiva'}
                  </span>
                </div>

                <p style={{ fontSize: '0.83rem', color: '#1a1a1a', lineHeight: 1.4, margin: '0 0 1rem 0' }}>
                  {cat.description || 'Sin descripciÃ³n detallada.'}
                </p>

                {/* Plantilla info */}
                <div
                  style={{
                    background: 'rgba(100,100,100,0.02)',
                    border: '1px solid #d8d8e0',
                    borderRadius: '8px',
                    padding: '0.65rem 0.85rem',
                    marginBottom: '1rem',
                    fontSize: '0.78rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#1a1a1a', marginBottom: '0.25rem' }}>
                    <span>Requisitos en Plantilla:</span>
                    <strong style={{ color: '#60a5fa' }}>{Array.isArray(cat.template_requirements) ? cat.template_requirements.length : 0} reglas</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#0f1419' }}>
                    <span>Convocatorias Vinculadas:</span>
                    <span>{cat.openings_count || 0}</span>
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px solid #d8d8e0' }}>
                <button
                  onClick={() => handleToggleActive(cat.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: cat.is_active ? '#666666' : '#4ade80',
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    fontWeight: 600,
                  }}
                >
                  {cat.is_active ? <XCircle size={14} /> : <CheckCircle2 size={14} />}
                  <span>{cat.is_active ? 'Desactivar' : 'Activar'}</span>
                </button>

                <button
                  onClick={() => handleOpenEdit(cat)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.35rem 0.75rem',
                    borderRadius: '6px',
                    background: 'rgba(100,100,100,0.05)',
                    border: '1px solid #374151',
                    color: '#1a1a1a',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  <Edit2 size={13} />
                  <span>Editar y Plantilla</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Crear/Editar CategorÃ­a */}
      {modalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(100,100,100,0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999,
            padding: '1rem',
          }}
        >
          <div
            style={{
              background: '#e8e8f0827',
              border: '1px solid #374151',
              borderRadius: '14px',
              maxWidth: '620px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '1.5rem',
              boxShadow: '0 20px 40px rgba(100,100,100,0.5)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Layers size={20} color="#3b82f6" />
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: '#1a1a1a' }}>
                  {editingCategory ? 'Editar CategorÃ­a de Puesto' : 'Crear Nueva CategorÃ­a'}
                </h2>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#1a1a1a', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {errorMsg && (
              <div
                style={{
                  background: 'rgba(239,68,68,0.1)',
                  border: '1px solid rgba(239,68,68,0.3)',
                  borderRadius: '8px',
                  padding: '0.75rem',
                  color: '#f87171',
                  fontSize: '0.85rem',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <AlertCircle size={16} />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmitForm} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#1a1a1a', marginBottom: '0.35rem' }}>
                  Nombre de la CategorÃ­a *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="ej: Agentes de Seguridad, Operadores CCTV, Escoltas..."
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    background: '#d8d8e0',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '0.9rem',
                  }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#1a1a1a', marginBottom: '0.35rem' }}>
                    Icono
                  </label>
                  <select
                    value={icon}
                    onChange={(e) => setIcon(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      background: '#d8d8e0',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '0.85rem',
                    }}
                  >
                    {AVAILABLE_ICONS.map((i) => (
                      <option key={i.value} value={i.value}>
                        {i.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#1a1a1a', marginBottom: '0.35rem' }}>
                    Color Distintivo
                  </label>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.35rem' }}>
                    {PRESET_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setColorHex(c)}
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background: c,
                          border: colorHex === c ? '2px solid #fff' : 'none',
                          cursor: 'pointer',
                          boxShadow: colorHex === c ? '0 0 8px ' + c : 'none',
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#1a1a1a', marginBottom: '0.35rem' }}>
                  DescripciÃ³n Operativa
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="Funciones generales y perfil de esta categorÃ­a..."
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    background: '#d8d8e0',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '0.85rem',
                    resize: 'vertical',
                  }}
                />
              </div>

              {/* Requisitos Plantilla (JSON configurable) */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1a1a1a' }}>
                    Plantilla de Requisitos Sugeridos (JSON)
                  </label>
                  <span style={{ fontSize: '0.72rem', color: '#1a1a1a' }}>Se sugerirÃ¡ al crear convocatorias de esta categorÃ­a</span>
                </div>
                <textarea
                  value={templateReqsJson}
                  onChange={(e) => setTemplateReqsJson(e.target.value)}
                  rows={7}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    background: '#0f172a',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#38bdf8',
                    fontFamily: 'monospace',
                    fontSize: '0.78rem',
                    resize: 'vertical',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  style={{
                    padding: '0.65rem 1.1rem',
                    borderRadius: '8px',
                    background: 'transparent',
                    border: '1px solid #374151',
                    color: '#1a1a1a',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  style={{
                    padding: '0.65rem 1.25rem',
                    borderRadius: '8px',
                    background: '#2563eb',
                    border: 'none',
                    color: '#fff',
                    cursor: formLoading ? 'not-allowed' : 'pointer',
                    fontWeight: 700,
                  }}
                >
                  {formLoading ? 'Guardando...' : editingCategory ? 'Guardar Cambios' : 'Crear CategorÃ­a'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};






