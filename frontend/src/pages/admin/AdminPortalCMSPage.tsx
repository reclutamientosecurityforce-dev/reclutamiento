import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../../api/client';
import {
  Layout,
  Globe,
  Save,
  Send,
  Eye,
  RotateCcw,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Layers,
  FileText,
  Users,
  Shield,
  Award,
  Briefcase,
  Upload,
  ExternalLink,
  ChevronRight,
  UserCheck,
  Heart,
  Calendar,
  Building,
  Camera,
  User,
  ShieldCheck,
  X,
  Info,
} from 'lucide-react';

type SectionTab = 'hero' | 'about' | 'benefits' | 'how_to_apply' | 'footer' | 'history';

export const AdminPortalCMSPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SectionTab>('hero');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Section States
  const [sectionStatus, setSectionStatus] = useState<'draft' | 'published' | 'fallback'>('fallback');
  const [currentVersion, setCurrentVersion] = useState<number>(1);
  const [hasDraft, setHasDraft] = useState<boolean>(false);
  const [previewOpen, setPreviewOpen] = useState<boolean>(false);

  // History State
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // â”€â”€â”€ HERO STATE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [heroData, setHeroData] = useState({
    eyebrow: 'ÃšNETE A NUESTRO EQUIPO',
    title: 'PROTEGEMOS',
    subtitle: 'LO QUE MÃS IMPORTA',
    description: 'Buscamos personas comprometidas, responsables y con vocaciÃ³n de servicio para formar parte de nuestro equipo.',
    primary_cta_text: 'VER CONVOCATORIAS',
    primary_cta_url: '#convocatorias',
    secondary_cta_text: 'CONOCE MÃS DE NOSOTROS',
    secondary_cta_url: '/postular/nosotros',
    desktop_image: '',
    mobile_image: '',
    video_url: '',
  });

  // â”€â”€â”€ ABOUT STATE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [aboutData, setAboutData] = useState({
    title: 'QUIÃ‰NES SOMOS',
    subtitle: 'LIDERAZGO EN SEGURIDAD INTEGRAL',
    description: 'Security Force P&V es una empresa lÃ­der en seguridad privada, especializada en resguardo corporativo, vigilancia y protecciÃ³n integral.',
    mission: '',
    vision: '',
    commitment: '',
    stats: [
      { value: '+10', label: 'AÃ±os de experiencia', icon: 'Award', order: 1, is_active: true },
      { value: '+5000', label: 'Colaboradores', icon: 'Users', order: 2, is_active: true },
      { value: '+300', label: 'Clientes satisfechos', icon: 'Building', order: 3, is_active: true },
      { value: '24/7', label: 'Servicio operativo', icon: 'Clock', order: 4, is_active: true },
    ],
    values: [
      { title: 'SEGURIDAD', desc: 'Compromiso inquebrantable con la protecciÃ³n de nuestros clientes.', icon: 'Shield', order: 1 },
      { title: 'PROFESIONALISMO', desc: 'Personal capacitado y certificado para brindar servicios de alta calidad.', icon: 'UserCheck', order: 2 },
      { title: 'INTEGRIDAD', desc: 'Actuamos con honestidad, Ã©tica y transparencia en todas nuestras operaciones.', icon: 'Heart', order: 3 },
      { title: 'EXCELENCIA', desc: 'Buscamos continuamente la mejora en nuestros procesos y servicios.', icon: 'Award', order: 4 },
    ],
  });

  // â”€â”€â”€ BENEFITS STATE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [benefitsData, setBenefitsData] = useState({
    title: 'BENEFICIOS PARA NUESTROS COLABORADORES',
    subtitle: 'CONDICIONES LABORALES DE EXCELENCIA',
    description: 'En Security Force P&V valoramos a nuestro equipo y ofrecemos un paquete de beneficios competitivos.',
    items: [] as any[],
    professional_development: [] as string[],
    wellness: [] as string[],
  });

  // â”€â”€â”€ HOW TO APPLY STATE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [howToApplyData, setHowToApplyData] = useState({
    title: 'Â¿CÃ“MO POSTULAR?',
    subtitle: 'PROCESO 100% DIGITAL Y ÃGIL',
    description: 'Sigue estos sencillos pasos para presentar tu postulaciÃ³n.',
    steps: [] as any[],
  });

  // â”€â”€â”€ FOOTER STATE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [footerData, setFooterData] = useState({
    title: 'Security Force P&V S.A.C.',
    subtitle: 'AtracciÃ³n & SelecciÃ³n',
    description: 'Empresa lÃ­der en servicios de seguridad privada a nivel nacional.',
    copyright: '',
    terms_and_conditions: '',
    privacy_policy: '',
  });

  // â”€â”€â”€ CARGAR DATOS DE SECCIÃ“N â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const loadSection = useCallback(async (tab: SectionTab) => {
    if (tab === 'history') {
      loadHistory('hero');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await api.get<{ data: any; status: 'draft' | 'published' | 'fallback'; version: number; has_draft: boolean }>(
        `/admin/portal/sections/${tab}?preferDraft=true`
      );

      setSectionStatus(res.status);
      setCurrentVersion(res.version || 1);
      setHasDraft(res.has_draft);

      const d = res.data || {};
      const c = d.content_data || {};
      const m = d.media_urls || {};

      if (tab === 'hero') {
        setHeroData({
          eyebrow: d.eyebrow || d.title || 'ÃšNETE A NUESTRO EQUIPO',
          title: d.title || 'PROTEGEMOS',
          subtitle: d.subtitle || 'LO QUE MÃS IMPORTA',
          description: d.description || '',
          primary_cta_text: c.primary_cta_text || 'VER CONVOCATORIAS',
          primary_cta_url: c.primary_cta_url || '#convocatorias',
          secondary_cta_text: c.secondary_cta_text || 'CONOCE MÃS DE NOSOTROS',
          secondary_cta_url: c.secondary_cta_url || '/postular/nosotros',
          desktop_image: m.desktop_image || '',
          mobile_image: m.mobile_image || '',
          video_url: m.video_url || '',
        });
      } else if (tab === 'about') {
        setAboutData({
          title: d.title || 'QUIÃ‰NES SOMOS',
          subtitle: d.subtitle || 'LIDERAZGO EN SEGURIDAD INTEGRAL',
          description: d.description || '',
          mission: c.mission || '',
          vision: c.vision || '',
          commitment: c.commitment || '',
          stats: c.stats || [
            { value: '+10', label: 'AÃ±os de experiencia', icon: 'Award', order: 1, is_active: true },
            { value: '+5000', label: 'Colaboradores', icon: 'Users', order: 2, is_active: true },
            { value: '+300', label: 'Clientes satisfechos', icon: 'Building', order: 3, is_active: true },
            { value: '24/7', label: 'Servicio operativo', icon: 'Clock', order: 4, is_active: true },
          ],
          values: c.values || [],
        });
      } else if (tab === 'benefits') {
        setBenefitsData({
          title: d.title || 'BENEFICIOS PARA NUESTROS COLABORADORES',
          subtitle: d.subtitle || '',
          description: d.description || '',
          items: c.items || [],
          professional_development: c.professional_development || [],
          wellness: c.wellness || [],
        });
      } else if (tab === 'how_to_apply') {
        setHowToApplyData({
          title: d.title || 'Â¿CÃ“MO POSTULAR?',
          subtitle: d.subtitle || '',
          description: d.description || '',
          steps: c.steps || [],
        });
      } else if (tab === 'footer') {
        setFooterData({
          title: d.title || 'Security Force P&V S.A.C.',
          subtitle: d.subtitle || '',
          description: d.description || '',
          copyright: c.copyright || '',
          terms_and_conditions: c.terms_and_conditions || '',
          privacy_policy: c.privacy_policy || '',
        });
      }
    } catch (err: any) {
      console.error('Error al cargar secciÃ³n CMS:', err);
      setErrorMsg(err.message || 'Error al cargar datos del CMS');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadHistory = async (sectionKey: string) => {
    try {
      setHistoryLoading(true);
      const data = await api.get<any[]>(`/admin/portal/sections/${sectionKey}/history`);
      setHistoryList(data || []);
    } catch (err: any) {
      console.error('Error al cargar historial:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    loadSection(activeTab);
  }, [activeTab, loadSection]);

  // â”€â”€â”€ GUARDAR BORRADOR â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleSaveDraft = async () => {
    try {
      setSaving(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      let payload: any = {};

      if (activeTab === 'hero') {
        payload = {
          title: heroData.title,
          subtitle: heroData.subtitle,
          description: heroData.description,
          content_data: {
            eyebrow: heroData.eyebrow,
            primary_cta_text: heroData.primary_cta_text,
            primary_cta_url: heroData.primary_cta_url,
            secondary_cta_text: heroData.secondary_cta_text,
            secondary_cta_url: heroData.secondary_cta_url,
          },
          media_urls: {
            desktop_image: heroData.desktop_image,
            mobile_image: heroData.mobile_image,
            video_url: heroData.video_url,
          },
        };
      } else if (activeTab === 'about') {
        payload = {
          title: aboutData.title,
          subtitle: aboutData.subtitle,
          description: aboutData.description,
          content_data: {
            mission: aboutData.mission,
            vision: aboutData.vision,
            commitment: aboutData.commitment,
            stats: aboutData.stats,
            values: aboutData.values,
          },
        };
      } else if (activeTab === 'benefits') {
        payload = {
          title: benefitsData.title,
          subtitle: benefitsData.subtitle,
          description: benefitsData.description,
          content_data: {
            items: benefitsData.items,
            professional_development: benefitsData.professional_development,
            wellness: benefitsData.wellness,
          },
        };
      } else if (activeTab === 'how_to_apply') {
        payload = {
          title: howToApplyData.title,
          subtitle: howToApplyData.subtitle,
          description: howToApplyData.description,
          content_data: {
            steps: howToApplyData.steps,
          },
        };
      } else if (activeTab === 'footer') {
        payload = {
          title: footerData.title,
          subtitle: footerData.subtitle,
          description: footerData.description,
          content_data: {
            copyright: footerData.copyright,
            terms_and_conditions: footerData.terms_and_conditions,
            privacy_policy: footerData.privacy_policy,
          },
        };
      }

      await api.put(`/admin/portal/sections/${activeTab}`, payload);
      setSuccessMsg('Borrador guardado exitosamente. No afectarÃ¡ el portal hasta que lo publiques.');
      setHasDraft(true);
      setSectionStatus('draft');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      console.error('Error al guardar borrador:', err);
      setErrorMsg(err.message || 'Error al guardar borrador');
    } finally {
      setSaving(false);
    }
  };

  // â”€â”€â”€ PUBLICAR EN VIVO â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handlePublish = async () => {
    if (!confirm('Â¿Deseas publicar estos cambios en el portal pÃºblico inmediatamente?')) {
      return;
    }

    try {
      setPublishing(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      // Guardar borrador primero para asegurar que los Ãºltimos cambios se publiquen
      await handleSaveDraft();

      const res = await api.post<any>(`/admin/portal/sections/${activeTab}/publish`);
      setSuccessMsg(`Â¡Publicado con Ã©xito! Nueva versiÃ³n activa: v${res.published?.version || currentVersion + 1}`);
      setHasDraft(false);
      setSectionStatus('published');
      setCurrentVersion(res.published?.version || currentVersion + 1);
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err: any) {
      console.error('Error al publicar:', err);
      setErrorMsg(err.message || 'Error al publicar cambios');
    } finally {
      setPublishing(false);
    }
  };

  // â”€â”€â”€ RESTAURAR VERSIÃ“N ANTERIOR â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleRestore = async (sectionKey: string, version: number) => {
    if (!confirm(`Â¿Restaurar la versiÃ³n ${version} como nuevo borrador activo?`)) {
      return;
    }

    try {
      setLoading(true);
      await api.post(`/admin/portal/sections/${sectionKey}/restore/${version}`);
      setSuccessMsg(`VersiÃ³n ${version} cargada en borrador. Revisa y haz clic en Publicar para activarla.`);
      setActiveTab(sectionKey as SectionTab);
      loadSection(sectionKey as SectionTab);
    } catch (err: any) {
      console.error('Error al restaurar versiÃ³n:', err);
      setErrorMsg(err.message || 'Error al restaurar versiÃ³n');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', paddingBottom: '4rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
            <Globe size={24} style={{ color: '#dc2626' }} />
            <h1 style={{ fontSize: '1.85rem', fontWeight: 900, color: '#1a1a1a', fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: '0.04em', textTransform: 'uppercase', margin: 0 }}>
              CMS del Portal PÃºblico
            </h1>
          </div>
          <p style={{ fontSize: '0.875rem', color: '#1a1a1a', margin: 0 }}>
            Administra los textos institucionales, secciones, misiÃ³n, valores, beneficios y footer sin modificar cÃ³digo.
          </p>
        </div>

        {activeTab !== 'history' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.85rem', background: 'rgba(255, 255, 255, 0.04)', borderRadius: '6px', border: '1px solid #374151', fontSize: '0.8rem' }}>
              <span style={{ color: '#888' }}>VersiÃ³n Actual:</span>
              <strong style={{ color: '#fff' }}>v{currentVersion}</strong>
              <span style={{ margin: '0 0.3rem', color: '#444' }}>|</span>
              <span style={{ color: sectionStatus === 'published' ? '#34d399' : '#fbbf24', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.72rem' }}>
                {hasDraft ? 'ðŸŸ¡ Borrador Pendiente' : 'ðŸŸ¢ Publicado'}
              </span>
            </div>

            <button
              onClick={() => setPreviewOpen(true)}
              className="btn-secondary"
              style={{ padding: '0.6rem 1rem', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', borderColor: '#38bdf8', color: '#38bdf8' }}
            >
              <Eye size={16} />
              <span>Previsualizar</span>
            </button>

            <button
              onClick={handleSaveDraft}
              disabled={saving || publishing}
              className="btn-secondary"
              style={{ padding: '0.6rem 1rem', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <Save size={16} />
              <span>{saving ? 'Guardando...' : 'Guardar Borrador'}</span>
            </button>

            <button
              onClick={handlePublish}
              disabled={saving || publishing}
              className="btn-primary"
              style={{ padding: '0.6rem 1.25rem', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <Send size={16} />
              <span>{publishing ? 'Publicando...' : 'Publicar Cambios'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Alerts */}
      {successMsg && (
        <div style={{ background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.4)', color: '#34d399', padding: '0.85rem 1.2rem', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.875rem' }}>
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div style={{ background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#f87171', padding: '0.85rem 1.2rem', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.875rem' }}>
          <AlertCircle size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #d8d8e0', gap: '0.5rem', marginBottom: '2rem', overflowX: 'auto', paddingBottom: '0.2rem' }}>
        {[
          { key: 'hero', label: 'Inicio / Hero', icon: Layout },
          { key: 'about', label: 'QuiÃ©nes Somos & MisiÃ³n', icon: Users },
          { key: 'benefits', label: 'Beneficios', icon: Award },
          { key: 'how_to_apply', label: 'CÃ³mo Postular', icon: CheckCircle2 },
          { key: 'footer', label: 'Footer & TÃ©rminos', icon: FileText },
          { key: 'history', label: 'Historial & Restaurar', icon: Clock },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as SectionTab)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.25rem',
                background: isActive ? 'rgba(220, 38, 38, 0.12)' : 'transparent',
                border: 'none',
                borderBottom: isActive ? '3px solid #dc2626' : '3px solid transparent',
                color: isActive ? '#e8e8f0' : '#666666',
                fontWeight: isActive ? 700 : 500,
                fontSize: '0.875rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap',
              }}
            >
              <Icon size={16} style={{ color: isActive ? '#dc2626' : 'inherit' }} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div style={{ padding: '4rem', textAlign: 'center', color: '#1a1a1a' }}>
          Cargando configuraciÃ³n CMS...
        </div>
      ) : (
        <div>
          {/* TAB 1: HERO */}
          {activeTab === 'hero' && (
            <div style={{ background: '#121212', border: '1px solid #d8d8e0', borderRadius: '12px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ borderBottom: '1px solid #d8d8e0', paddingBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', margin: 0 }}>SecciÃ³n Hero Principal</h3>
                <p style={{ fontSize: '0.825rem', color: '#888', margin: '0.25rem 0 0' }}>Controla el encabezado de bienvenida y llamado a la acciÃ³n del portal.</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#aaa', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                    Eyebrow / Etiqueta Superior
                  </label>
                  <input
                    type="text"
                    value={heroData.eyebrow}
                    onChange={(e) => setHeroData({ ...heroData, eyebrow: e.target.value })}
                    placeholder="Ej: ÃšNETE A NUESTRO EQUIPO"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#aaa', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                    TÃ­tulo Principal (Blanco)
                  </label>
                  <input
                    type="text"
                    value={heroData.title}
                    onChange={(e) => setHeroData({ ...heroData, title: e.target.value })}
                    placeholder="Ej: PROTEGEMOS"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#aaa', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                    TÃ­tulo Destacado (Rojo #DC2626)
                  </label>
                  <input
                    type="text"
                    value={heroData.subtitle}
                    onChange={(e) => setHeroData({ ...heroData, subtitle: e.target.value })}
                    placeholder="Ej: LO QUE MÃS IMPORTA"
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#aaa', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                  DescripciÃ³n del Hero
                </label>
                <textarea
                  rows={3}
                  value={heroData.description}
                  onChange={(e) => setHeroData({ ...heroData, description: e.target.value })}
                  placeholder="Texto descriptivo para postulantes..."
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#aaa', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                    Texto BotÃ³n Principal
                  </label>
                  <input
                    type="text"
                    value={heroData.primary_cta_text}
                    onChange={(e) => setHeroData({ ...heroData, primary_cta_text: e.target.value })}
                    placeholder="VER CONVOCATORIAS"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#aaa', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                    Enlace BotÃ³n Principal
                  </label>
                  <input
                    type="text"
                    value={heroData.primary_cta_url}
                    onChange={(e) => setHeroData({ ...heroData, primary_cta_url: e.target.value })}
                    placeholder="#convocatorias"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#aaa', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                    Texto BotÃ³n Secundario
                  </label>
                  <input
                    type="text"
                    value={heroData.secondary_cta_text}
                    onChange={(e) => setHeroData({ ...heroData, secondary_cta_text: e.target.value })}
                    placeholder="CONOCE MÃS DE NOSOTROS"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#aaa', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                    Enlace BotÃ³n Secundario
                  </label>
                  <input
                    type="text"
                    value={heroData.secondary_cta_url}
                    onChange={(e) => setHeroData({ ...heroData, secondary_cta_url: e.target.value })}
                    placeholder="/postular/nosotros"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ABOUT */}
          {activeTab === 'about' && (
            <div style={{ background: '#121212', border: '1px solid #d8d8e0', borderRadius: '12px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
              <div style={{ borderBottom: '1px solid #d8d8e0', paddingBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', margin: 0 }}>SecciÃ³n QuiÃ©nes Somos & MisiÃ³n</h3>
                <p style={{ fontSize: '0.825rem', color: '#888', margin: '0.25rem 0 0' }}>Administra la identidad corporativa y las 4 estadÃ­sticas institucionales.</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#aaa', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                    TÃ­tulo de SecciÃ³n
                  </label>
                  <input
                    type="text"
                    value={aboutData.title}
                    onChange={(e) => setAboutData({ ...aboutData, title: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#aaa', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                    SubtÃ­tulo / Lema
                  </label>
                  <input
                    type="text"
                    value={aboutData.subtitle}
                    onChange={(e) => setAboutData({ ...aboutData, subtitle: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#aaa', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                  DescripciÃ³n Principal
                </label>
                <textarea
                  rows={3}
                  value={aboutData.description}
                  onChange={(e) => setAboutData({ ...aboutData, description: e.target.value })}
                />
              </div>

              {/* EstadÃ­sticas */}
              <div>
                <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#dc2626', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
                  EstadÃ­sticas Destacadas (+10 AÃ±os, +5000 Colaboradores...)
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                  {aboutData.stats.map((st, idx) => (
                    <div key={idx} style={{ background: '#e8e8f0', border: '1px solid #333', padding: '1rem', borderRadius: '8px' }}>
                      <div style={{ marginBottom: '0.5rem' }}>
                        <label style={{ fontSize: '0.7rem', color: '#888', textTransform: 'uppercase', display: 'block', marginBottom: '0.2rem' }}>Cifra / Valor</label>
                        <input
                          type="text"
                          value={st.value}
                          onChange={(e) => {
                            const newStats = [...aboutData.stats];
                            newStats[idx].value = e.target.value;
                            setAboutData({ ...aboutData, stats: newStats });
                          }}
                          placeholder="+10"
                          style={{ fontWeight: 800, color: '#dc2626' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.7rem', color: '#888', textTransform: 'uppercase', display: 'block', marginBottom: '0.2rem' }}>Etiqueta</label>
                        <input
                          type="text"
                          value={st.label}
                          onChange={(e) => {
                            const newStats = [...aboutData.stats];
                            newStats[idx].label = e.target.value;
                            setAboutData({ ...aboutData, stats: newStats });
                          }}
                          placeholder="AÃ±os de experiencia"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* MisiÃ³n y VisiÃ³n */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#aaa', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                    MisiÃ³n
                  </label>
                  <textarea
                    rows={4}
                    value={aboutData.mission}
                    onChange={(e) => setAboutData({ ...aboutData, mission: e.target.value })}
                    placeholder="DeclaraciÃ³n de misiÃ³n..."
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#aaa', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                    VisiÃ³n
                  </label>
                  <textarea
                    rows={4}
                    value={aboutData.vision}
                    onChange={(e) => setAboutData({ ...aboutData, vision: e.target.value })}
                    placeholder="DeclaraciÃ³n de visiÃ³n..."
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#aaa', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                  Nuestro Compromiso
                </label>
                <textarea
                  rows={3}
                  value={aboutData.commitment}
                  onChange={(e) => setAboutData({ ...aboutData, commitment: e.target.value })}
                  placeholder="Compromiso institucional con los colaboradores..."
                />
              </div>
            </div>
          )}

          {/* TAB 3: BENEFITS */}
          {activeTab === 'benefits' && (
            <div style={{ background: '#121212', border: '1px solid #d8d8e0', borderRadius: '12px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #d8d8e0', paddingBottom: '1rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', margin: 0 }}>Beneficios de Ley y Corporativos</h3>
                  <p style={{ fontSize: '0.825rem', color: '#888', margin: '0.25rem 0 0' }}>Administra las tarjetas de beneficios que ven los candidatos.</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const newItems = [
                      ...benefitsData.items,
                      {
                        id: String(Date.now()),
                        title: 'Nuevo Beneficio',
                        description: 'DescripciÃ³n del beneficio...',
                        icon: 'ShieldCheck',
                        order: benefitsData.items.length + 1,
                        is_active: true,
                      },
                    ];
                    setBenefitsData({ ...benefitsData, items: newItems });
                  }}
                  className="btn-primary"
                  style={{ padding: '0.5rem 0.85rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  <Plus size={15} />
                  <span>Agregar Beneficio</span>
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
                {benefitsData.items.map((item, idx) => (
                  <div key={item.id || idx} style={{ background: '#181818', border: '1px solid #c8c8d0', borderRadius: '8px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#dc2626' }}>BENEFICIO #{idx + 1}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const newItems = benefitsData.items.filter((_, i) => i !== idx);
                          setBenefitsData({ ...benefitsData, items: newItems });
                        }}
                        style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div>
                      <label style={{ fontSize: '0.7rem', color: '#888', textTransform: 'uppercase', display: 'block', marginBottom: '0.2rem' }}>TÃ­tulo</label>
                      <input
                        type="text"
                        value={item.title}
                        onChange={(e) => {
                          const newItems = [...benefitsData.items];
                          newItems[idx].title = e.target.value;
                          setBenefitsData({ ...benefitsData, items: newItems });
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.7rem', color: '#888', textTransform: 'uppercase', display: 'block', marginBottom: '0.2rem' }}>DescripciÃ³n</label>
                      <textarea
                        rows={2}
                        value={item.description}
                        onChange={(e) => {
                          const newItems = [...benefitsData.items];
                          newItems[idx].description = e.target.value;
                          setBenefitsData({ ...benefitsData, items: newItems });
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: HOW TO APPLY */}
          {activeTab === 'how_to_apply' && (
            <div style={{ background: '#121212', border: '1px solid #d8d8e0', borderRadius: '12px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
              <div style={{ borderBottom: '1px solid #d8d8e0', paddingBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', margin: 0 }}>Pasos de PostulaciÃ³n (CÃ³mo Postular)</h3>
                <p style={{ fontSize: '0.825rem', color: '#888', margin: '0.25rem 0 0' }}>Administra las explicaciones de los 5 pasos para el postulante.</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
                {howToApplyData.steps.map((st, idx) => (
                  <div key={idx} style={{ background: '#181818', border: '1px solid #c8c8d0', borderRadius: '8px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#dc2626', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.8rem' }}>
                        {st.step_number || `0${idx + 1}`}
                      </span>
                      <strong style={{ color: '#fff', fontSize: '0.9rem' }}>Paso {idx + 1}</strong>
                    </div>

                    <div>
                      <label style={{ fontSize: '0.7rem', color: '#888', textTransform: 'uppercase', display: 'block', marginBottom: '0.2rem' }}>TÃ­tulo del Paso</label>
                      <input
                        type="text"
                        value={st.title}
                        onChange={(e) => {
                          const newSteps = [...howToApplyData.steps];
                          newSteps[idx].title = e.target.value;
                          setHowToApplyData({ ...howToApplyData, steps: newSteps });
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.7rem', color: '#888', textTransform: 'uppercase', display: 'block', marginBottom: '0.2rem' }}>InstrucciÃ³n / Detalle</label>
                      <textarea
                        rows={2}
                        value={st.description}
                        onChange={(e) => {
                          const newSteps = [...howToApplyData.steps];
                          newSteps[idx].description = e.target.value;
                          setHowToApplyData({ ...howToApplyData, steps: newSteps });
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: FOOTER */}
          {activeTab === 'footer' && (
            <div style={{ background: '#121212', border: '1px solid #d8d8e0', borderRadius: '12px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
              <div style={{ borderBottom: '1px solid #d8d8e0', paddingBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', margin: 0 }}>Pie de PÃ¡gina y Textos Legales</h3>
                <p style={{ fontSize: '0.825rem', color: '#888', margin: '0.25rem 0 0' }}>Administra la polÃ­tica de privacidad, tÃ©rminos de consentimiento y copyright.</p>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#aaa', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                  DescripciÃ³n Institucional de Pie de PÃ¡gina
                </label>
                <textarea
                  rows={2}
                  value={footerData.description}
                  onChange={(e) => setFooterData({ ...footerData, description: e.target.value })}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#aaa', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                  Copyright
                </label>
                <input
                  type="text"
                  value={footerData.copyright}
                  onChange={(e) => setFooterData({ ...footerData, copyright: e.target.value })}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#aaa', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                  TÃ©rminos y Condiciones (DeclaraciÃ³n Jurada del Postulante)
                </label>
                <textarea
                  rows={4}
                  value={footerData.terms_and_conditions}
                  onChange={(e) => setFooterData({ ...footerData, terms_and_conditions: e.target.value })}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#aaa', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                  PolÃ­tica de Privacidad y Tratamiento de Datos (Ley NÂ° 29733)
                </label>
                <textarea
                  rows={4}
                  value={footerData.privacy_policy}
                  onChange={(e) => setFooterData({ ...footerData, privacy_policy: e.target.value })}
                />
              </div>
            </div>
          )}

          {/* TAB 6: HISTORY */}
          {activeTab === 'history' && (
            <div style={{ background: '#121212', border: '1px solid #d8d8e0', borderRadius: '12px', padding: '2rem' }}>
              <div style={{ borderBottom: '1px solid #d8d8e0', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', margin: 0 }}>Historial de Versiones Publicadas</h3>
                <p style={{ fontSize: '0.825rem', color: '#888', margin: '0.25rem 0 0' }}>Permite auditar y restaurar versiones anteriores en cualquier momento.</p>
              </div>

              {historyLoading ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>Cargando historial de versiones...</div>
              ) : historyList.length === 0 ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: '#666' }}>
                  No hay versiones archivadas aÃºn. Al realizar publicaciones se generarÃ¡n puntos de restauraciÃ³n automÃ¡ticos.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {historyList.map((hist) => (
                    <div key={hist.id} style={{ background: '#181818', border: '1px solid #c8c8d0', borderRadius: '8px', padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.3rem' }}>
                          <span style={{ background: '#dc2626', color: '#fff', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 800 }}>
                            v{hist.version}
                          </span>
                          <strong style={{ color: '#fff', fontSize: '0.95rem' }}>{hist.title || hist.section_key}</strong>
                        </div>
                        <p style={{ color: '#888', fontSize: '0.8rem', margin: 0 }}>
                          Publicado el {new Date(hist.published_at).toLocaleString('es-PE')} por {hist.published_by_name || 'Administrador'}
                        </p>
                      </div>

                      <button
                        onClick={() => handleRestore(hist.section_key, hist.version)}
                        className="btn-secondary"
                        style={{ padding: '0.5rem 0.9rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', borderColor: '#38bdf8', color: '#38bdf8' }}
                      >
                        <RotateCcw size={14} />
                        <span>Restaurar esta VersiÃ³n</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* MODAL DE PREVISUALIZACIÃ“N */}
      {previewOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(100,100,100,0.85)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
          <div style={{ background: '#f5f5f7', border: '1px solid #dc2626', borderRadius: '16px', width: '100%', maxWidth: '1000px', maxHeight: '90vh', overflowY: 'auto', padding: '2.5rem', position: 'relative', color: '#fff' }}>
            <button
              onClick={() => setPreviewOpen(false)}
              style={{ position: 'absolute', right: '1.5rem', top: '1.5rem', background: 'transparent', border: 'none', color: '#aaa', cursor: 'pointer' }}
            >
              <X size={24} />
            </button>

            <div style={{ marginBottom: '2rem', borderBottom: '1px solid #c8c8d0', paddingBottom: '1rem' }}>
              <span style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                ðŸ‘ï¸ VISTA PREVIA DEL BORRADOR ACTIVO
              </span>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#fff', margin: '0.3rem 0 0' }}>
                PrevisualizaciÃ³n en Vivo de la SecciÃ³n
              </h2>
            </div>

            {/* Render Preview according to activeTab */}
            {activeTab === 'hero' && (
              <div style={{ background: '#f5f5f7', padding: '3rem 2rem', borderRadius: '12px', border: '1px solid #333' }}>
                <div style={{ width: '60px', height: '3px', background: '#DC2626', marginBottom: '1rem' }} />
                <div style={{ color: '#DC2626', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '0.5rem' }}>
                  {heroData.eyebrow}
                </div>
                <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '2.8rem', fontWeight: 900, textTransform: 'uppercase', margin: 0, color: '#fff', lineHeight: 1.1 }}>
                  {heroData.title}
                </h1>
                <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '2.8rem', fontWeight: 900, textTransform: 'uppercase', margin: '0 0 1rem', color: '#DC2626', lineHeight: 1.1 }}>
                  {heroData.subtitle}
                </h1>
                <p style={{ color: '#E5E5E5', fontSize: '1.05rem', lineHeight: 1.6, maxWidth: '600px', marginBottom: '2rem' }}>
                  {heroData.description}
                </p>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <button className="btn-primary" style={{ padding: '0.8rem 1.75rem' }}>
                    {heroData.primary_cta_text}
                  </button>
                  <button className="btn-secondary" style={{ padding: '0.8rem 1.75rem' }}>
                    {heroData.secondary_cta_text}
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'about' && (
              <div style={{ background: '#f5f5f7', padding: '3rem 2rem', borderRadius: '12px', border: '1px solid #333' }}>
                <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '2.5rem', fontWeight: 900, color: '#fff', textTransform: 'uppercase', margin: '0 0 1rem' }}>
                  {aboutData.title}
                </h1>
                <p style={{ color: '#E5E5E5', fontSize: '1.1rem', lineHeight: 1.6, marginBottom: '2.5rem' }}>
                  {aboutData.description}
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
                  {aboutData.stats.map((st, i) => (
                    <div key={i} style={{ textAlign: 'center', background: '#121212', padding: '1.5rem', borderRadius: '8px', border: '1px solid #c8c8d0' }}>
                      <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#dc2626', fontFamily: "'Barlow Condensed', sans-serif" }}>
                        {st.value}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#aaa', textTransform: 'uppercase', marginTop: '0.3rem' }}>
                        {st.label}
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                  <div style={{ background: '#121212', padding: '1.5rem', borderRadius: '8px' }}>
                    <h3 style={{ color: '#dc2626', fontWeight: 800, textTransform: 'uppercase', margin: '0 0 0.5rem' }}>MISIÃ“N</h3>
                    <p style={{ color: '#ccc', fontSize: '0.95rem', lineHeight: 1.5 }}>{aboutData.mission}</p>
                  </div>
                  <div style={{ background: '#121212', padding: '1.5rem', borderRadius: '8px' }}>
                    <h3 style={{ color: '#dc2626', fontWeight: 800, textTransform: 'uppercase', margin: '0 0 0.5rem' }}>VISIÃ“N</h3>
                    <p style={{ color: '#ccc', fontSize: '0.95rem', lineHeight: 1.5 }}>{aboutData.vision}</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'benefits' && (
              <div style={{ background: '#f5f5f7', padding: '2rem', borderRadius: '12px' }}>
                <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '2rem', fontWeight: 900, color: '#fff', textTransform: 'uppercase', marginBottom: '1.5rem' }}>
                  {benefitsData.title}
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                  {benefitsData.items.map((item, i) => (
                    <div key={i} style={{ background: '#121212', border: '1px solid #c8c8d0', padding: '1.5rem', borderRadius: '8px' }}>
                      <h4 style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 700, margin: '0 0 0.5rem' }}>{item.title}</h4>
                      <p style={{ color: '#aaa', fontSize: '0.9rem', lineHeight: 1.5, margin: 0 }}>{item.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'how_to_apply' && (
              <div style={{ background: '#f5f5f7', padding: '2rem', borderRadius: '12px' }}>
                <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '2rem', fontWeight: 900, color: '#fff', textTransform: 'uppercase', marginBottom: '1.5rem' }}>
                  {howToApplyData.title}
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                  {howToApplyData.steps.map((st, i) => (
                    <div key={i} style={{ background: '#121212', border: '1px solid #c8c8d0', padding: '1.25rem', borderRadius: '8px' }}>
                      <span style={{ fontSize: '1.5rem', fontWeight: 900, color: '#dc2626', display: 'block', marginBottom: '0.4rem' }}>
                        {st.step_number || `0${i + 1}`}
                      </span>
                      <h4 style={{ color: '#fff', fontSize: '1rem', margin: '0 0 0.3rem' }}>{st.title}</h4>
                      <p style={{ color: '#888', fontSize: '0.85rem', lineHeight: 1.4, margin: 0 }}>{st.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'footer' && (
              <div style={{ background: '#f5f5f7', padding: '2rem', borderRadius: '12px', border: '1px solid #c8c8d0' }}>
                <p style={{ color: '#aaa', fontSize: '0.9rem', marginBottom: '1.5rem' }}>{footerData.description}</p>
                <div style={{ background: '#121212', padding: '1rem', borderRadius: '6px', marginBottom: '1rem' }}>
                  <strong style={{ color: '#fff', fontSize: '0.85rem', display: 'block', marginBottom: '0.3rem' }}>TÃ©rminos y DeclaraciÃ³n Jurada:</strong>
                  <p style={{ color: '#888', fontSize: '0.8rem', lineHeight: 1.4, margin: 0 }}>{footerData.terms_and_conditions}</p>
                </div>
                <div style={{ background: '#121212', padding: '1rem', borderRadius: '6px', marginBottom: '1rem' }}>
                  <strong style={{ color: '#fff', fontSize: '0.85rem', display: 'block', marginBottom: '0.3rem' }}>PolÃ­tica de Privacidad (Ley NÂ° 29733):</strong>
                  <p style={{ color: '#888', fontSize: '0.8rem', lineHeight: 1.4, margin: 0 }}>{footerData.privacy_policy}</p>
                </div>
                <div style={{ color: '#666', fontSize: '0.8rem', textAlign: 'center', marginTop: '1.5rem' }}>
                  {footerData.copyright}
                </div>
              </div>
            )}

            <div style={{ marginTop: '2rem', textAlign: 'right' }}>
              <button onClick={() => setPreviewOpen(false)} className="btn-secondary" style={{ padding: '0.6rem 1.5rem' }}>
                Cerrar PrevisualizaciÃ³n
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};






