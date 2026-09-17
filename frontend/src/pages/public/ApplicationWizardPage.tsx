import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../../api/client';
import { PublicHeader } from './PublicHeader';
import {
  FileText,
  Camera,
  Edit3,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Upload,
  ArrowLeft,
  ArrowRight,
  Shield,
  Download,
  Check,
  HelpCircle,
  Sparkles,
  Briefcase,
  FolderOpen,
} from 'lucide-react';

// Componente para mostrar tarjetas de documentos (legacy)
const DocumentCard = ({ doc, uploadedDocs, uploadProgress, onUpload, draftToken }: any) => {
  const isUploaded = uploadedDocs.some((d: any) => d.document_type === doc.type);
  const isUploading = uploadProgress[doc.type];
  const uploadedDocsForType = uploadedDocs.filter((d: any) => d.document_type === doc.type);
  
  // Estado visual
  let statusIndicator = '🟡 PENDIENTE';
  let statusColor = '#fbbf24';
  let statusBg = 'rgba(251, 191, 36, 0.1)';
  let statusBorder = 'rgba(251, 191, 36, 0.3)';
  
  if (isUploaded) {
    statusIndicator = '🟢 RECIBIDO';
    statusColor = '#34d399';
    statusBg = 'rgba(16, 185, 129, 0.1)';
    statusBorder = 'rgba(16, 185, 129, 0.3)';
  }

  return (
    <div
      style={{
        background: statusBg,
        border: `1px solid ${statusBorder}`,
        borderRadius: '12px',
        padding: '1.25rem',
        transition: 'all 0.2s ease',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <FolderOpen size={20} color={statusColor} />
          <div>
            <h4 style={{ color: '#ffffff', fontSize: '1rem', fontWeight: 700, margin: 0 }}>
              {doc.label}
            </h4>
            {doc.description && (
              <p style={{ color: '#888', fontSize: '0.8rem', margin: '0.25rem 0 0' }}>
                {doc.description}
              </p>
            )}
          </div>
        </div>
        <div style={{ 
          background: statusBg, 
          border: `1px solid ${statusBorder}`, 
          borderRadius: '20px', 
          padding: '0.25rem 0.75rem',
          fontSize: '0.75rem',
          fontWeight: 700,
          color: statusColor
        }}>
          {statusIndicator}
        </div>
      </div>

      {uploadedDocsForType.length > 0 && (
        <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: '#34d399' }}>
          {uploadedDocsForType.length} documento{uploadedDocsForType.length > 1 ? 's' : ''} adjunto{uploadedDocsForType.length > 1 ? 's' : ''}
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
        <label style={{ 
          flex: 1,
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          gap: '0.5rem',
          background: 'rgba(220, 38, 38, 0.1)', 
          border: '1px solid rgba(220, 38, 38, 0.3)', 
          borderRadius: '8px', 
          padding: '0.6rem 1rem',
          fontSize: '0.85rem',
          fontWeight: 600,
          color: '#dc2626',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(220, 38, 38, 0.2)'}
           onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(220, 38, 38, 0.1)'}>
          <Camera size={16} />
          <span>{isUploading ? 'Subiendo...' : 'Tomar Foto'}</span>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => onUpload(e, doc.type)}
            disabled={isUploading}
            style={{ display: 'none' }}
          />
        </label>

        <label style={{ 
          flex: 1,
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          gap: '0.5rem',
          background: 'rgba(255, 255, 255, 0.05)', 
          border: '1px solid rgba(255, 255, 255, 0.1)', 
          borderRadius: '8px', 
          padding: '0.6rem 1rem',
          fontSize: '0.85rem',
          fontWeight: 600,
          color: '#ffffff',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
           onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}>
          <Upload size={16} />
          <span>{isUploading ? 'Subiendo...' : 'Subir Archivo'}</span>
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp"
            onChange={(e) => onUpload(e, doc.type)}
            disabled={isUploading}
            style={{ display: 'none' }}
          />
        </label>
      </div>
    </div>
  );
};

// Componente mejorado para expediente digital
const ExpedienteDigitalCard = ({ 
  requirement, 
  documents, 
  uploadProgress, 
  onUpload, 
  onConfirmClassification,
  onDelete,
  draftToken 
}: any) => {
  const reqDocs = documents.filter((d: any) => d.requirement_id === requirement.id || d.document_type_typed === requirement.document_type);
  const isUploading = uploadProgress[requirement.id];
  
  // Determinar estado
  let statusIndicator = '🟡 PENDIENTE';
  let statusColor = '#fbbf24';
  let statusBg = 'rgba(251, 191, 36, 0.1)';
  let statusBorder = 'rgba(251, 191, 36, 0.3)';
  
  if (reqDocs.length > 0) {
    const hasVerified = reqDocs.some((d: any) => d.verification_status === 'verified' || d.verification_status === 'approved');
    const hasObserved = reqDocs.some((d: any) => d.verification_status === 'observed');
    
    if (hasObserved) {
      statusIndicator = '🔴 OBSERVADO';
      statusColor = '#ef4444';
      statusBg = 'rgba(239, 68, 68, 0.1)';
      statusBorder = 'rgba(239, 68, 68, 0.3)';
    } else if (hasVerified) {
      statusIndicator = '🟢 RECIBIDO';
      statusColor = '#34d399';
      statusBg = 'rgba(16, 185, 129, 0.1)';
      statusBorder = 'rgba(16, 185, 129, 0.3)';
    } else {
      statusIndicator = '🟡 PENDIENTE';
      statusColor = '#fbbf24';
      statusBg = 'rgba(251, 191, 36, 0.1)';
      statusBorder = 'rgba(251, 191, 36, 0.3)';
    }
  }

  const requiredLabel = requirement.is_required ? '🔴 OBLIGATORIO' : '🟢 ADICIONAL';
  const requiredColor = requirement.is_required ? '#ef4444' : '#34d399';

  return (
    <div
      style={{
        background: statusBg,
        border: `1px solid ${statusBorder}`,
        borderRadius: '12px',
        padding: '1.25rem',
        transition: 'all 0.2s ease',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <FolderOpen size={20} color={statusColor} />
          <div>
            <h4 style={{ color: '#ffffff', fontSize: '1rem', fontWeight: 700, margin: 0 }}>
              {requirement.title}
            </h4>
            {requirement.description && (
              <p style={{ color: '#888', fontSize: '0.8rem', margin: '0.25rem 0 0' }}>
                {requirement.description}
              </p>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <div style={{ 
            background: requirement.is_required ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', 
            border: `1px solid ${requirement.is_required ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`, 
            borderRadius: '20px', 
            padding: '0.25rem 0.75rem',
            fontSize: '0.7rem',
            fontWeight: 700,
            color: requiredColor
          }}>
            {requiredLabel}
          </div>
          <div style={{ 
            background: statusBg, 
            border: `1px solid ${statusBorder}`, 
            borderRadius: '20px', 
            padding: '0.25rem 0.75rem',
            fontSize: '0.75rem',
            fontWeight: 700,
            color: statusColor
          }}>
            {statusIndicator}
          </div>
        </div>
      </div>

      {reqDocs.length > 0 && (
        <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: '#34d399' }}>
          {reqDocs.length} documento{reqDocs.length > 1 ? 's' : ''} adjunto{reqDocs.length > 1 ? 's' : ''}
        </div>
      )}

      {/* Lista de documentos */}
      {reqDocs.length > 0 && (
        <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {reqDocs.map((doc: any) => (
            <div key={doc.id} style={{ 
              background: 'rgba(0, 0, 0, 0.2)', 
              borderRadius: '8px', 
              padding: '0.5rem 0.75rem',
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              fontSize: '0.75rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileText size={14} color="#888" />
                <span style={{ color: '#ccc' }}>{doc.file_name}</span>
                {doc.classification_confidence && doc.classification_confidence < 0.9 && (
                  <span style={{ color: '#fbbf24', fontSize: '0.7rem' }}>
                    ⚠️ Verificar tipo
                  </span>
                )}
              </div>
              <button
                onClick={() => onDelete(doc.id)}
                style={{ 
                  background: 'rgba(239, 68, 68, 0.1)', 
                  border: '1px solid rgba(239, 68, 68, 0.3)', 
                  borderRadius: '4px', 
                  padding: '0.25rem 0.5rem',
                  color: '#ef4444',
                  cursor: 'pointer',
                  fontSize: '0.7rem'
                }}
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
        <label style={{ 
          flex: 1,
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          gap: '0.5rem',
          background: 'rgba(220, 38, 38, 0.1)', 
          border: '1px solid rgba(220, 38, 38, 0.3)', 
          borderRadius: '8px', 
          padding: '0.6rem 1rem',
          fontSize: '0.85rem',
          fontWeight: 600,
          color: '#dc2626',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(220, 38, 38, 0.2)'}
           onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(220, 38, 38, 0.1)'}>
          <Camera size={16} />
          <span>{isUploading ? 'Subiendo...' : 'Tomar Foto'}</span>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => onUpload(e, requirement.id, requirement.document_type, requirement.document_category)}
            disabled={isUploading}
            style={{ display: 'none' }}
          />
        </label>

        <label style={{ 
          flex: 1,
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          gap: '0.5rem',
          background: 'rgba(255, 255, 255, 0.05)', 
          border: '1px solid rgba(255, 255, 255, 0.1)', 
          borderRadius: '8px', 
          padding: '0.6rem 1rem',
          fontSize: '0.85rem',
          fontWeight: 600,
          color: '#ffffff',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
           onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}>
          <Upload size={16} />
          <span>{isUploading ? 'Subiendo...' : 'Subir Archivo'}</span>
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp"
            onChange={(e) => onUpload(e, requirement.id, requirement.document_type, requirement.document_category)}
            disabled={isUploading}
            style={{ display: 'none' }}
          />
        </label>
      </div>
    </div>
  );
};

interface WorkExp {
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  current: boolean;
  city: string;
  functions: string;
}

interface EduItem {
  institution: string;
  degree: string;
  level: string;
  year: string;
  status: string;
}

interface RequiredDoc {
  type: string;
  label: string;
  required: boolean;
}

interface OpeningRequirement {
  id: string;
  code: string;
  title: string;
  description?: string;
  requirement_type: string;
  rule_type: string;
  rule_config: any;
  weight_score: number;
  required_document_type?: string;
  order_index: number;
}

interface OpeningData {
  id: string;
  title: string;
  position_type: string;
  location: string;
  requirements?: OpeningRequirement[];
  // Mantener compatibilidad con estructura anterior
  min_height?: number;
  sucamec_required?: boolean;
  gun_license_required?: boolean;
  driver_license_required?: boolean;
  experience_years?: number;
  required_documents?: RequiredDoc[];
}

interface UploadedDoc {
  id: string;
  document_type: string;
  file_name: string;
  file_size?: number;
}

export const ApplicationWizardPage: React.FC = () => {
  const { openingId } = useParams<{ openingId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const publicationSlug = searchParams.get('publicationSlug') || undefined;
  const utmSource = searchParams.get('utm_source') || searchParams.get('source') || undefined;
  const utmMedium = searchParams.get('utm_medium') || searchParams.get('medium') || undefined;
  const utmCampaign = searchParams.get('utm_campaign') || searchParams.get('campaign') || undefined;
  const channelId = searchParams.get('channel_id') || searchParams.get('c') || undefined;

  // Step state (1: Initial, 2: Method Choice, 3: Profile/CV Builder, 4: Dynamic Docs, 5: Review & Submit, 6: Success)
  const [step, setStep] = useState(1);
  const [opening, setOpening] = useState<OpeningData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Application session
  const [draftToken, setDraftToken] = useState<string>('');
  const [applicationCode, setApplicationCode] = useState<string>('');
  const [hasPreviousProfile, setHasPreviousProfile] = useState(false);
  const [compatibilityScore, setCompatibilityScore] = useState<number>(85);

  // Análisis de requisitos de la convocatoria
  const [openingRequirements, setOpeningRequirements] = useState<OpeningRequirement[]>([]);
  const [requiresSucamec, setRequiresSucamec] = useState(false);
  const [requiresGunLicense, setRequiresGunLicense] = useState(false);
  const [requiredGunLicenseType, setRequiredGunLicenseType] = useState<string | null>(null);
  const [requiresDriverLicense, setRequiresDriverLicense] = useState(false);
  const [requiredDriverLicenseType, setRequiredDriverLicenseType] = useState<string | null>(null);
  const [requiresMilitaryService, setRequiresMilitaryService] = useState(false);
  const [requiresExperience, setRequiresExperience] = useState(false);
  const [minExperienceYears, setMinExperienceYears] = useState<number | null>(null);
  
  // Estado para advertencias de compatibilidad
  const [licenseWarning, setLicenseWarning] = useState<string | null>(null);
  const [driverLicenseWarning, setDriverLicenseWarning] = useState<string | null>(null);

  // Step 1: Basic Identity Form
  const [docType, setDocType] = useState('DNI');
  const [docNumber, setDocNumber] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [birthPlace, setBirthPlace] = useState('');

  // Step 2: Method selection
  const [method, setMethod] = useState<'upload_cv' | 'photos' | 'create_cv' | 'existing'>('create_cv');

  // Step 3: Structured Profile / CV Builder
  const [district, setDistrict] = useState('Lima');
  const [heightCm, setHeightCm] = useState<number | ''>(174);
  const [weightKg, setWeightKg] = useState<number | ''>(76);
  const [sucamecStatus, setSucamecStatus] = useState<'valid' | 'in_process' | 'none' | 'expired'>('valid');
  const [sucamecCode, setSucamecCode] = useState('');
  const [gunLicense, setGunLicense] = useState(false);
  const [gunLicenseType, setGunLicenseType] = useState('L1');
  const [driverLicense, setDriverLicense] = useState(false);
  const [driverLicenseType, setDriverLicenseType] = useState('A1');
  const [militaryService, setMilitaryService] = useState(false);
  const [militaryBranch, setMilitaryBranch] = useState('');
  const [securityExpYears, setSecurityExpYears] = useState<number>(1);

  // Dynamic arrays
  const [experiences, setExperiences] = useState<WorkExp[]>([
    { company: '', position: 'Agente de Seguridad', startDate: '', endDate: '', current: false, city: 'Lima', functions: '' }
  ]);
  const [educationList, setEducationList] = useState<EduItem[]>([
    { institution: '', degree: 'Secundaria Completa', level: 'Secundaria', year: '2020', status: 'Culminado' }
  ]);

  // Step 4: Documents
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDoc[]>([]);
  const [uploadProgress, setUploadProgress] = useState<Record<string, boolean>>({});

  // Step 5: Confirmation & Consent LOPD
  const [confirmedTruth, setConfirmedTruth] = useState(false);
  const [consentLopd, setConsentLopd] = useState(true);
  const [lastAutoSaved, setLastAutoSaved] = useState<string | null>(null);
  const [fitScoreData, setFitScoreData] = useState<any>(null);
  
  // Expediente documental
  const [documentRequirements, setDocumentRequirements] = useState<any>(null);
  const [expedienteStatus, setExpedienteStatus] = useState<any>(null);
  const [expedienteProgress, setExpedienteProgress] = useState<any>(null);
  const [applicationDocuments, setApplicationDocuments] = useState<any[]>([]);
  const [classificationModal, setClassificationModal] = useState<any>(null);

  // Load opening data on mount
  useEffect(() => {
    async function loadOpening() {
      if (!openingId) return;
      try {
        setLoading(true);
        const data = await api.get<OpeningData>(`/public/openings/${openingId}`);
        setOpening(data);

        // Cargar requisitos de documentos del expediente digital
        try {
          const docReqs = await api.get(`/public/openings/${openingId}/expediente-requirements`);
          setDocumentRequirements(docReqs);
        } catch (err) {
          console.log('No se pudieron cargar requisitos de expediente digital:', err);
          // Fallback a requisitos antiguos
          try {
            const legacyReqs = await api.get(`/public/openings/${openingId}/document-requirements`);
            setDocumentRequirements(legacyReqs);
          } catch (legacyErr) {
            console.log('No se pudieron cargar requisitos legacy:', legacyErr);
          }
        }

        // Analizar requisitos dinámicos
        if (data.requirements && Array.isArray(data.requirements)) {
          setOpeningRequirements(data.requirements);
          analyzeRequirements(data.requirements);
        } else {
          // Compatibilidad con estructura anterior
          analyzeLegacyRequirements(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadOpening();
  }, [openingId]);

  // Cargar estado del expediente cuando hay draftToken
  useEffect(() => {
    async function loadExpedienteStatus() {
      if (!draftToken) return;
      try {
        // Intentar cargar nuevo estado del expediente
        const status = await api.get(`/public/apply/${draftToken}/expediente-status-new`);
        setExpedienteStatus(status);
        
        // Cargar progreso del expediente
        const progress = await api.get(`/public/apply/${draftToken}/expediente-status-new`);
        setExpedienteProgress((progress as any)?.expediente_progress);
        
        // Cargar documentos de la aplicación
        const docs = await api.get(`/public/apply/${draftToken}/documents`);
        setApplicationDocuments(docs as any[]);
      } catch (err) {
        console.log('No se pudo cargar estado del expediente nuevo:', err);
        // Fallback a expediente antiguo
        try {
          const legacyStatus = await api.get(`/public/apply/${draftToken}/expediente-status`);
          setExpedienteStatus(legacyStatus);
        } catch (legacyErr) {
          console.log('No se pudo cargar estado del expediente legacy:', legacyErr);
        }
      }
    }
    loadExpedienteStatus();
  }, [draftToken]);

  // Analizar requisitos dinámicos del backend
  const analyzeRequirements = (requirements: OpeningRequirement[]) => {
    requirements.forEach(req => {
      const code = req.code.toLowerCase();
      const config = req.rule_config || {};

      switch (code) {
        case 'sucamec':
        case 'req_sucamec':
        case 'sucamec_required':
          setRequiresSucamec(true);
          break;
        case 'gun_license':
        case 'req_gun_license':
        case 'licencia_armas':
        case 'req_licencia_armas':
          setRequiresGunLicense(true);
          if (config.license_type) {
            setRequiredGunLicenseType(config.license_type);
          }
          break;
        case 'driver_license':
        case 'req_driver_license':
        case 'brevete':
        case 'req_brevete':
        case 'licencia_conducir':
          setRequiresDriverLicense(true);
          if (config.license_category) {
            setRequiredDriverLicenseType(config.license_category);
          }
          break;
        case 'military_service':
        case 'req_military':
        case 'servicio_militar':
          setRequiresMilitaryService(true);
          break;
        case 'experience':
        case 'req_exp_min':
        case 'req_experience':
        case 'experiencia':
        case 'security_experience':
          setRequiresExperience(true);
          if (config.min_years) {
            setMinExperienceYears(config.min_years);
          }
          if (config.min_months) {
            setMinExperienceYears(Math.ceil(config.min_months / 12));
          }
          break;
      }
    });
  };

  // Compatibilidad con estructura anterior (JSON en requirements)
  const analyzeLegacyRequirements = (data: OpeningData) => {
    if (data.sucamec_required) setRequiresSucamec(true);
    if (data.gun_license_required) setRequiresGunLicense(true);
    if (data.driver_license_required) setRequiresDriverLicense(true);
    if (data.experience_years) {
      setRequiresExperience(true);
      setMinExperienceYears(data.experience_years);
    }
  };

  // ─── HANDLERS ─────────────────────────────────────────────────────────────

  // Paso 1: Iniciar postulación sin login con trazabilidad de captación
  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setActionLoading(true);

    try {
      const res = await api.post<{
        status: string;
        draftToken?: string;
        applicationCode?: string;
        hasPreviousProfile?: boolean;
        candidate?: any;
        structuredProfile?: any;
        submittedAt?: string;
      }>('/public/apply/init', {
        openingId,
        publicationSlug,
        channelId,
        utmSource,
        utmMedium,
        utmCampaign,
        documentType: docType,
        documentNumber: docNumber.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        birthDate: birthDate || undefined,
      });

      if (res.status === 'already_submitted') {
        setApplicationCode(res.applicationCode || '');
        setStep(6); // Ir directo a pantalla de confirmación
        return;
      }

      if (res.draftToken) {
        setDraftToken(res.draftToken);
        setApplicationCode(res.applicationCode || '');
        setHasPreviousProfile(!!res.hasPreviousProfile);

        // Si ya tenía perfil previo, rellenar los datos
        if (res.candidate) {
          if (res.candidate.height_cm) setHeightCm(res.candidate.height_cm);
          if (res.candidate.weight_kg) setWeightKg(res.candidate.weight_kg);
          if (res.candidate.district) setDistrict(res.candidate.district);
          if (res.candidate.sucamec_status) setSucamecStatus(res.candidate.sucamec_status);
          if (res.candidate.sucamec_code) setSucamecCode(res.candidate.sucamec_code);
          if (res.candidate.gun_license) setGunLicense(res.candidate.gun_license);
          if (res.candidate.gun_license_type) setGunLicenseType(res.candidate.gun_license_type);
          if (res.candidate.driver_license) setDriverLicense(res.candidate.driver_license);
          if (res.candidate.driver_license_type) setDriverLicenseType(res.candidate.driver_license_type);
          if (res.candidate.military_service) setMilitaryService(res.candidate.military_service);
          if (res.candidate.military_branch) setMilitaryBranch(res.candidate.military_branch);
          if (res.candidate.security_experience_years) setSecurityExpYears(res.candidate.security_experience_years);
        }

        if (res.structuredProfile) {
          if (res.structuredProfile.experiences?.length > 0) setExperiences(res.structuredProfile.experiences);
          if (res.structuredProfile.education?.length > 0) setEducationList(res.structuredProfile.education);
        }

        setStep(2);
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Error al iniciar postulación.');
    } finally {
      setActionLoading(false);
    }
  };

  // Paso 2: Selección de Método
  const handleSelectMethod = (selected: 'upload_cv' | 'photos' | 'create_cv' | 'existing') => {
    setMethod(selected);
    setStep(3);
  };

  // Experiencias dinámicas
  const handleAddExperience = () => {
    setExperiences([
      ...experiences,
      { company: '', position: 'Agente de Seguridad', startDate: '', endDate: '', current: false, city: 'Lima', functions: '' }
    ]);
  };

  // Validación de licencia de armas vs requisito
  const handleGunLicenseTypeChange = (value: string) => {
    setGunLicenseType(value);
    
    if (requiredGunLicenseType && value !== requiredGunLicenseType && value !== 'OTRA') {
      setLicenseWarning(`Esta convocatoria requiere licencia ${requiredGunLicenseType}. La licencia seleccionada (${value}) no coincide con el requisito.`);
    } else {
      setLicenseWarning(null);
    }
  };

  // Validación de brevete vs requisito
  const handleDriverLicenseTypeChange = (value: string) => {
    setDriverLicenseType(value);
    
    if (requiredDriverLicenseType && value !== requiredDriverLicenseType && value !== 'OTRA') {
      setDriverLicenseWarning(`Esta convocatoria requiere brevete ${requiredDriverLicenseType}. La categoría seleccionada (${value}) no coincide con el requisito.`);
    } else {
      setDriverLicenseWarning(null);
    }
  };

  const handleRemoveExperience = (idx: number) => {
    setExperiences(experiences.filter((_, i) => i !== idx));
  };

  const handleUpdateExperience = (idx: number, field: keyof WorkExp, val: any) => {
    const updated = [...experiences];
    updated[idx] = { ...updated[idx], [field]: val };
    setExperiences(updated);
  };

  // Subir CV en archivo (legacy)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, docTypeKey: string) => {
    const file = e.target.files?.[0];
    if (!file || !draftToken) return;

    setUploadProgress((p) => ({ ...p, [docTypeKey]: true }));

    try {
      const formData = new FormData();
      if (docTypeKey === 'cv') {
        formData.append('cvFile', file);
        console.log('Uploading CV:', file.name, file.type, file.size);
        const res = await api.post<{ document: UploadedDoc }>(`/public/apply/${draftToken}/upload-cv`, formData);
        if (res.document) {
          setUploadedDocs((d) => [...d.filter((item) => item.document_type !== 'cv'), res.document]);
        }
      } else {
        formData.append('photos', file);
        formData.append('documentType', docTypeKey);
        const res = await api.post<{ documents: UploadedDoc[] }>(`/public/apply/${draftToken}/upload-photos`, formData);
        if (res.documents) {
          setUploadedDocs((d) => [...d.filter((item) => item.document_type !== docTypeKey), ...res.documents]);
          // Recargar estado del expediente después de subir
          if (draftToken) {
            api.get(`/public/apply/${draftToken}/expediente-status`)
              .then((status) => setExpedienteStatus(status))
              .catch(() => {});
          }
        }
      }
    } catch (err: unknown) {
      console.error('Upload error:', err);
      alert(err instanceof Error ? err.message : 'Error al subir archivo');
    } finally {
      setUploadProgress((p) => ({ ...p, [docTypeKey]: false }));
    }
  };

  // Subir documento con clasificación automática (nuevo expediente digital)
  const handleExpedienteUpload = async (
    e: React.ChangeEvent<HTMLInputElement>, 
    requirementId: string, 
    documentType: string, 
    documentCategory: string
  ) => {
    const file = e.target.files?.[0];
    if (!file || !draftToken) return;

    setUploadProgress((p) => ({ ...p, [requirementId]: true }));

    try {
      const formData = new FormData();
      formData.append('document', file);
      formData.append('documentType', documentType);
      formData.append('documentCategory', documentCategory);
      formData.append('requirementId', requirementId);

      const res = await api.post<{
        document: any;
        classification: any;
      }>(`/public/apply/${draftToken}/upload-document`, formData);

      if (res.document) {
        setApplicationDocuments((d) => [...d, res.document]);
        
        // Si la clasificación necesita confirmación
        if (res.classification && res.classification.needsConfirmation) {
          setClassificationModal({
            document: res.document,
            classification: res.classification,
          });
        }

        // Recargar estado del expediente
        api.get(`/public/apply/${draftToken}/expediente-status-new`)
          .then((status) => {
            setExpedienteStatus(status);
            setExpedienteProgress((status as any)?.expediente_progress);
          })
          .catch(() => {});
      }
    } catch (err: unknown) {
      console.error('Expediente upload error:', err);
      alert(err instanceof Error ? err.message : 'Error al subir documento');
    } finally {
      setUploadProgress((p) => ({ ...p, [requirementId]: false }));
    }
  };

  // Confirmar clasificación de documento
  const handleConfirmClassification = async (confirmedType: string, confirmedCategory: string) => {
    if (!classificationModal || !draftToken) return;

    try {
      await api.put(`/public/apply/${draftToken}/documents/${classificationModal.document.id}/confirm-classification`, {
        confirmedType,
        confirmedCategory,
      });

      // Actualizar documento localmente
      setApplicationDocuments((d) =>
        d.map((doc) =>
          doc.id === classificationModal.document.id
            ? { ...doc, document_type_typed: confirmedType, document_category: confirmedCategory }
            : doc
        )
      );

      setClassificationModal(null);
    } catch (err: unknown) {
      console.error('Classification confirmation error:', err);
      alert(err instanceof Error ? err.message : 'Error al confirmar clasificación');
    }
  };

  // Eliminar documento del expediente
  const handleDeleteDocument = async (documentId: string) => {
    if (!draftToken) return;

    if (!confirm('¿Estás seguro de eliminar este documento?')) return;

    try {
      await api.delete(`/public/apply/${draftToken}/documents/${documentId}`);
      
      setApplicationDocuments((d) => d.filter((doc) => doc.id !== documentId));

      // Recargar estado del expediente
      api.get(`/public/apply/${draftToken}/expediente-status-new`)
        .then((status) => {
          setExpedienteStatus(status);
          setExpedienteProgress((status as any)?.expediente_progress);
        })
        .catch(() => {});
    } catch (err: unknown) {
      console.error('Delete document error:', err);
      alert(err instanceof Error ? err.message : 'Error al eliminar documento');
    }
  };

  // Guardar perfil y avanzar a Documentos
  const handleSaveProfileAndNext = async () => {
    if (!draftToken) return;
    setActionLoading(true);

    try {
      await api.put(`/public/apply/${draftToken}/profile`, {
        district,
        city: birthPlace, // Using city field for birth place
        heightCm: heightCm ? Number(heightCm) : undefined,
        weightKg: weightKg ? Number(weightKg) : undefined,
        sucamecStatus,
        sucamecCode: sucamecCode || undefined,
        gunLicense,
        gunLicenseType: gunLicense ? gunLicenseType : undefined,
        driverLicense,
        driverLicenseType: driverLicense ? driverLicenseType : undefined,
        militaryService,
        militaryBranch: militaryService ? militaryBranch : undefined,
        securityExperienceYears: Number(securityExpYears),
        structuredProfile: {
          experiences: experiences.filter((e) => e.company.trim() !== ''),
          education: educationList.filter((e) => e.institution.trim() !== ''),
          courses: [],
          skills: [],
        },
      });

      // Consultar FitScore en vivo al avanzar
      api.get<any>(`/public/apply/${draftToken}/fit-score`)
        .then((res) => setFitScoreData(res))
        .catch(() => {});

      setStep(4);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error al guardar perfil');
    } finally {
      setActionLoading(false);
    }
  };

  // Paso 5: Envío final con registro de consentimiento LOPD
  const handleSubmitFinal = async () => {
    if (!confirmedTruth) {
      alert('Debe confirmar la veracidad de la información.');
      return;
    }
    if (!consentLopd) {
      alert('Debe aceptar el consentimiento de tratamiento de datos personales.');
      return;
    }
    if (!draftToken) return;
    setActionLoading(true);

    try {
      // Registrar consentimiento explícito
      await api.post(`/public/apply/${draftToken}/consent`, {
        consentGiven: true,
        consentVersion: '1.0',
      }).catch(() => {});

      const res = await api.post<{ applicationCode: string; compatibilityScore: number }>(
        `/public/apply/${draftToken}/submit`,
        {}
      );
      setApplicationCode(res.applicationCode);
      setCompatibilityScore(res.compatibilityScore || 90);
      setStep(6);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error al enviar postulación');
    } finally {
      setActionLoading(false);
    }
  };

  // Descargar PDF del CV generado
  const handleDownloadCvPdf = async () => {
    if (!draftToken) return;
    try {
      const blob = await api.get<Blob>(`/public/apply/${draftToken}/generate-cv-pdf`);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `CV_${docNumber}_${firstName}_${lastName}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#080808', color: '#fff' }}>
        <PublicHeader showBackToJobs />
        <div style={{ padding: '5rem 0', textAlign: 'center', color: '#888' }}>
          Cargando asistente de postulación...
        </div>
      </div>
    );
  }

  const reqDocs = (opening?.requirements as any)?.required_documents || [
    { type: 'dni', label: 'DNI / Carné de Extranjería', required: true },
    { type: 'cul', label: 'Certificado Único Laboral (CUL)', required: true },
    { type: 'sucamec', label: 'Carné SUCAMEC Vigente', required: true },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#080808', color: '#ffffff' }}>
      <PublicHeader showBackToJobs />

      {/* Progress Bar Top */}
      {step < 6 && (
        <div className="wizard-progress-container" style={{ background: '#101010', borderBottom: '1px solid rgba(220, 38, 38, 0.2)', padding: '1rem 1.5rem' }}>
          <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#aaa', marginBottom: '0.75rem', fontWeight: 600 }}>
              <span style={{ color: '#dc2626', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Postulando a: {opening?.title}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>Paso {step} de 5</span>
                {lastAutoSaved && (
                  <span style={{ color: '#34d399', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <CheckCircle2 size={12} />
                    Guardado
                  </span>
                )}
              </div>
            </div>
            
            {/* Visual Step Indicators */}
            <div className="wizard-progress-indicators" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
              {[
                { id: 1, label: 'Identificación' },
                { id: 2, label: 'Método' },
                { id: 3, label: 'Perfil' },
                { id: 4, label: 'Documentos' },
                { id: 5, label: 'Enviar' },
              ].map((item, index) => {
                const isCompleted = step > item.id;
                const isCurrent = step === item.id;
                const isUpcoming = step < item.id;
                
                return (
                  <div key={item.id} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div
                      className="wizard-progress-circle"
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: isCompleted ? '#34d399' : isCurrent ? '#DC2626' : '#2a2a2a',
                        border: isCurrent ? '2px solid #DC2626' : isCompleted ? '2px solid #34d399' : '2px solid #3a3a3a',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        color: isCompleted ? '#080808' : isCurrent ? '#FFFFFF' : '#666',
                        marginBottom: '0.5rem',
                        transition: 'all 0.3s ease',
                      }}
                    >
                      {isCompleted ? '✓' : item.id}
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Progress Line */}
            <div style={{ height: '3px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '9999px', overflow: 'hidden', marginTop: '0.5rem' }}>
              <div
                style={{
                  height: '100%',
                  width: `${((step - 1) / 4) * 100}%`,
                  background: 'linear-gradient(90deg, #dc2626, #ef4444)',
                  borderRadius: '9999px',
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
          </div>
        </div>
      )}

      <main style={{ maxWidth: '780px', margin: '0 auto', padding: '2rem 1.5rem 5rem' }}>
        {/* ══════════════════════════════════════════════════════════════════════
            PASO 1: DATOS BÁSICOS INMEDIATOS (SIN LOGIN)
        ══════════════════════════════════════════════════════════════════════ */}
        {step === 1 && (
          <div
            style={{
              background: '#0d0d0d',
              border: '1px solid rgba(220, 38, 38, 0.25)',
              borderRadius: '20px',
              padding: '2.5rem 2rem',
              boxShadow: '0 20px 60px rgba(0,0,0,0.85)',
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <span style={{ fontSize: '0.75rem', color: '#dc2626', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Paso 1 de 5 • Identificación Rápida
              </span>
              <h2
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: '1.9rem',
                  fontWeight: 900,
                  color: '#ffffff',
                  textTransform: 'uppercase',
                  marginTop: '0.2rem',
                }}
              >
                Comienza tu Postulación
              </h2>
              <p style={{ fontSize: '0.85rem', color: '#888', marginTop: '0.25rem' }}>
                Ingresa tus datos básicos para generar tu código de postulación. No necesitas contraseña.
              </p>
            </div>

            {errorMsg && (
              <div style={{ background: 'rgba(220, 38, 38, 0.1)', border: '1px solid rgba(220, 38, 38, 0.3)', color: '#f87171', padding: '0.85rem 1rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertCircle size={16} />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleStep1Submit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#aaa', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                    Tipo Doc. <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <select value={docType} onChange={(e) => setDocType(e.target.value)}>
                    <option value="DNI">DNI</option>
                    <option value="CE">Carné Extranjería (CE)</option>
                    <option value="PTP">PTP</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#aaa', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                    Número de Documento <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={docNumber}
                    onChange={(e) => setDocNumber(e.target.value)}
                    placeholder="8 dígitos"
                    required
                    maxLength={15}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#aaa', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                    Nombres <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Ej: Carlos Alberto"
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#aaa', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                    Apellidos <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Ej: Pérez Quispe"
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#aaa', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                    Celular / WhatsApp <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="987654321"
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#aaa', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                    Fecha de Nacimiento
                  </label>
                  <input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#aaa', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                    Lugar de Nacimiento
                  </label>
                  <input
                    type="text"
                    value={birthPlace}
                    onChange={(e) => setBirthPlace(e.target.value)}
                    placeholder="Ciudad, Departamento"
                  />
                </div>
              </div>

              <div style={{ marginBottom: '2rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#aaa', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                  Correo Electrónico (Opcional)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@correo.com"
                />
              </div>

              <button
                type="submit"
                className="btn-primary"
                disabled={actionLoading}
                style={{ width: '100%', padding: '0.95rem', fontSize: '1.05rem', letterSpacing: '0.06em' }}
              >
                <span>{actionLoading ? 'VERIFICANDO...' : 'CONTINUAR CON LA POSTULACIÓN'}</span>
                <ArrowRight size={18} />
              </button>
            </form>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            PASO 2: ¿CÓMO QUIERES PRESENTAR TU INFORMACIÓN?
        ══════════════════════════════════════════════════════════════════════ */}
        {step === 2 && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
              <span style={{ fontSize: '0.75rem', color: '#dc2626', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Paso 2 de 5 • Método de Postulación
              </span>
              <h2
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: '2rem',
                  fontWeight: 900,
                  color: '#ffffff',
                  textTransform: 'uppercase',
                  marginTop: '0.2rem',
                }}
              >
                ¿Cómo deseas presentar tu información?
              </h2>
              <p style={{ fontSize: '0.9rem', color: '#ccc', marginTop: '0.5rem', maxWidth: '500px', margin: '0.5rem auto 0', lineHeight: 1.5 }}>
                Elige la forma más fácil para ti. Puedes subir tu CV, crear uno desde cero o presentar tus documentos.
              </p>
            </div>

            {hasPreviousProfile && (
              <div
                style={{
                  background: 'rgba(56, 189, 248, 0.1)',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  marginBottom: '2rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'rgba(56, 189, 248, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <UserCheck size={26} color="#38bdf8" />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '1rem', color: '#fff', marginBottom: '0.25rem' }}>Encontramos información registrada anteriormente</h4>
                    <p style={{ fontSize: '0.8rem', color: '#aaa', lineHeight: 1.4 }}>Puedes usar tus datos anteriores y postular más rápido.</p>
                  </div>
                </div>
                <button
                  onClick={() => handleSelectMethod('existing')}
                  className="btn-primary"
                  style={{ padding: '0.75rem 1.5rem', fontSize: '0.9rem', background: '#0284c7', minWidth: '140px' }}
                >
                  CONTINUAR
                </button>
              </div>
            )}

            <div className="wizard-step-cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
              {/* Opción 1: TENGO MI CV */}
              <div
                onClick={() => handleSelectMethod('upload_cv')}
                className="wizard-step-card card-lift"
                style={{
                  background: '#0d0d0d',
                  border: '1px solid rgba(220, 38, 38, 0.25)',
                  borderRadius: '16px',
                  padding: '2rem',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.7)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#DC2626';
                  e.currentTarget.style.transform = 'translateY(-4px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(220, 38, 38, 0.25)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: 'rgba(220, 38, 38, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#dc2626', marginBottom: '1.25rem' }}>
                  <FileText size={28} />
                </div>
                <h3 style={{ fontSize: '1.35rem', color: '#fff', marginBottom: '0.5rem', fontWeight: 700 }}>TENGO MI CV</h3>
                <p style={{ fontSize: '0.85rem', color: '#aaa', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                  Sube tu CV y extraemos automáticamente la información para completar tu perfil.
                </p>
                <button
                  style={{
                    width: '100%',
                    padding: '0.85rem',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    borderRadius: '6px',
                    background: '#DC2626',
                    border: '1px solid #DC2626',
                    color: '#FFFFFF',
                    cursor: 'pointer',
                    transition: 'background 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#B91C1C';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#DC2626';
                  }}
                >
                  SUBIR MI CV
                </button>
              </div>

              {/* Opción 2: CREAR MI CV - VISIBILIDAD ALTA */}
              <div
                onClick={() => handleSelectMethod('create_cv')}
                className="wizard-step-card card-lift"
                style={{
                  background: 'linear-gradient(135deg, #0d0d0d 0%, #111 100%)',
                  border: '2px solid rgba(220, 38, 38, 0.6)',
                  borderRadius: '16px',
                  padding: '2rem',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 10px 40px rgba(220, 38, 38, 0.2)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#DC2626';
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 15px 50px rgba(220, 38, 38, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(220, 38, 38, 0.6)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 10px 40px rgba(220, 38, 38, 0.2)';
                }}
              >
                <div style={{ position: 'absolute', top: 0, right: 0, background: 'rgba(220, 38, 38, 0.2)', color: '#fff', fontSize: '0.7rem', fontWeight: 700, padding: '0.4rem 0.8rem', borderBottomLeftRadius: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  ★ Recomendado
                </div>
                <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: 'rgba(220, 38, 38, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#DC2626', marginBottom: '1.25rem' }}>
                  <Sparkles size={28} />
                </div>
                <h3 style={{ fontSize: '1.35rem', color: '#fff', marginBottom: '0.5rem', fontWeight: 700 }}>CREAR MI CV</h3>
                <p style={{ fontSize: '0.85rem', color: '#aaa', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                  ¿No tienes CV? Te ayudamos a crear uno paso a paso desde tu celular.
                </p>
                <button
                  style={{
                    width: '100%',
                    padding: '0.85rem',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    borderRadius: '6px',
                    background: '#DC2626',
                    border: '1px solid #DC2626',
                    color: '#FFFFFF',
                    cursor: 'pointer',
                    transition: 'background 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#B91C1C';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#DC2626';
                  }}
                >
                  CREAR MI CV
                </button>
              </div>

              {/* Opción 3: TENGO MIS DOCUMENTOS */}
              <div
                onClick={() => handleSelectMethod('photos')}
                className="wizard-step-card card-lift"
                style={{
                  background: '#0d0d0d',
                  border: '1px solid rgba(220, 38, 38, 0.25)',
                  borderRadius: '16px',
                  padding: '2rem',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.7)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#DC2626';
                  e.currentTarget.style.transform = 'translateY(-4px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(220, 38, 38, 0.25)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: 'rgba(251, 191, 36, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fbbf24', marginBottom: '1.25rem' }}>
                  <Camera size={28} />
                </div>
                <h3 style={{ fontSize: '1.35rem', color: '#fff', marginBottom: '0.5rem', fontWeight: 700 }}>TENGO MIS DOCUMENTOS</h3>
                <p style={{ fontSize: '0.85rem', color: '#aaa', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                  Puedes tomar fotos o subir archivos. Nosotros te ayudamos a organizarlos.
                </p>
                <button
                  style={{
                    width: '100%',
                    padding: '0.85rem',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    borderRadius: '6px',
                    background: '#fbbf24',
                    border: '1px solid #fbbf24',
                    color: '#080808',
                    cursor: 'pointer',
                    transition: 'background 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#f59e0b';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#fbbf24';
                  }}
                >
                  SUBIR DOCUMENTOS
                </button>
              </div>

              {/* Opción 4: YA POSTULÉ ANTES */}
              {!hasPreviousProfile && (
                <div
                  onClick={() => handleSelectMethod('existing')}
                  className="wizard-step-card card-lift"
                  style={{
                    background: '#0d0d0d',
                    border: '1px solid rgba(220, 38, 38, 0.25)',
                    borderRadius: '16px',
                    padding: '2rem',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.7)',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#DC2626';
                    e.currentTarget.style.transform = 'translateY(-4px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(220, 38, 38, 0.25)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: 'rgba(56, 189, 248, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8', marginBottom: '1.25rem' }}>
                    <Briefcase size={28} />
                  </div>
                  <h3 style={{ fontSize: '1.35rem', color: '#fff', marginBottom: '0.5rem', fontWeight: 700 }}>YA POSTULÉ ANTES</h3>
                  <p style={{ fontSize: '0.85rem', color: '#aaa', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                    Usa tus datos anteriores y postula más rápido.
                  </p>
                  <button
                    style={{
                      width: '100%',
                      padding: '0.85rem',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase',
                      borderRadius: '6px',
                      background: '#38bdf8',
                      border: '1px solid #38bdf8',
                      color: '#080808',
                      cursor: 'pointer',
                      transition: 'background 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#0284c7';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#38bdf8';
                    }}
                  >
                    CONTINUAR
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            PASO 3: CONSTRUCTOR / EDITOR DE PERFIL Y CV
        ══════════════════════════════════════════════════════════════════════ */}
        {step === 3 && (
          <div
            style={{
              background: '#0d0d0d',
              border: '1px solid rgba(220, 38, 38, 0.25)',
              borderRadius: '20px',
              padding: '2.5rem 2rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#dc2626', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Paso 3 de 5 • Perfil Laboral y Seguridad
                </span>
                <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.85rem', fontWeight: 900, color: '#ffffff', textTransform: 'uppercase' }}>
                  {method === 'upload_cv' ? 'Verifica y Completa tus Datos' : 'Construye tu Perfil Laboral'}
                </h2>
              </div>
            </div>

            {/* Resumen de requisitos de la convocatoria */}
            <div style={{ 
              background: 'rgba(220, 38, 38, 0.08)', 
              border: '1px solid rgba(220, 38, 38, 0.3)', 
              borderRadius: '12px', 
              padding: '1.25rem 1.5rem', 
              marginBottom: '2rem' 
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <CheckCircle2 size={18} color="#dc2626" />
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Completa solo la información que necesitamos para esta vacante
                </span>
              </div>
              <div style={{ fontSize: '0.8rem', color: '#aaa', marginBottom: '1rem' }}>
                REQUISITOS DE ESTA VACANTE
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {requiresSucamec && (
                  <span style={{ 
                    background: 'rgba(52, 211, 153, 0.15)', 
                    color: '#34d399', 
                    padding: '0.3rem 0.75rem', 
                    borderRadius: '4px', 
                    fontSize: '0.75rem', 
                    fontWeight: 600 
                  }}>
                    ✓ SUCAMEC
                  </span>
                )}
                {requiresGunLicense && (
                  <span style={{ 
                    background: 'rgba(220, 38, 38, 0.15)', 
                    color: '#dc2626', 
                    padding: '0.3rem 0.75rem', 
                    borderRadius: '4px', 
                    fontSize: '0.75rem', 
                    fontWeight: 600 
                  }}>
                    ✓ Licencia de Armas{requiredGunLicenseType ? ` ${requiredGunLicenseType}` : ''}
                  </span>
                )}
                {requiresDriverLicense && (
                  <span style={{ 
                    background: 'rgba(251, 191, 36, 0.15)', 
                    color: '#fbbf24', 
                    padding: '0.3rem 0.75rem', 
                    borderRadius: '4px', 
                    fontSize: '0.75rem', 
                    fontWeight: 600 
                  }}>
                    ✓ Brevete{requiredDriverLicenseType ? ` ${requiredDriverLicenseType}` : ''}
                  </span>
                )}
                {requiresMilitaryService && (
                  <span style={{ 
                    background: 'rgba(56, 189, 248, 0.15)', 
                    color: '#38bdf8', 
                    padding: '0.3rem 0.75rem', 
                    borderRadius: '4px', 
                    fontSize: '0.75rem', 
                    fontWeight: 600 
                  }}>
                    ✓ Servicio Militar
                  </span>
                )}
                {requiresExperience && (
                  <span style={{ 
                    background: 'rgba(168, 162, 158, 0.15)', 
                    color: '#a8a2a2', 
                    padding: '0.3rem 0.75rem', 
                    borderRadius: '4px', 
                    fontSize: '0.75rem', 
                    fontWeight: 600 
                  }}>
                    ✓ Experiencia{minExperienceYears ? ` (mín. ${minExperienceYears} años)` : ''}
                  </span>
                )}
                {!requiresSucamec && !requiresGunLicense && !requiresDriverLicense && !requiresMilitaryService && !requiresExperience && (
                  <span style={{ 
                    background: 'rgba(52, 211, 153, 0.1)', 
                    color: '#34d399', 
                    padding: '0.5rem 1rem', 
                    borderRadius: '4px', 
                    fontSize: '0.8rem', 
                    fontWeight: 600 
                  }}>
                    ✓ Requisitos básicos únicamente
                  </span>
                )}
              </div>
              {(!requiresSucamec && !requiresGunLicense && !requiresDriverLicense && !requiresMilitaryService && !requiresExperience) && (
                <p style={{ fontSize: '0.75rem', color: '#888', marginTop: '0.75rem', fontStyle: 'italic' }}>
                  Esta convocatoria no requiere requisitos especiales. Solo completa tus datos básicos y documentos.
                </p>
              )}
            </div>

            {/* Si eligió subir archivo de CV en paso 2 */}
            {method === 'upload_cv' && (
              <div style={{ background: 'rgba(220, 38, 38, 0.08)', border: '1px dashed rgba(220, 38, 38, 0.4)', borderRadius: '12px', padding: '1.5rem', textAlign: 'center', marginBottom: '2rem' }}>
                <Upload size={28} color="#dc2626" style={{ margin: '0 auto 0.5rem' }} />
                <h4 style={{ fontSize: '1rem', color: '#fff' }}>Adjunta tu archivo de CV</h4>
                <p style={{ fontSize: '0.78rem', color: '#888', marginBottom: '1rem' }}>Aceptamos PDF, DOC, DOCX (Máx. 10MB)</p>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => handleFileUpload(e, 'cv')}
                  style={{ display: 'none' }}
                  id="cv-upload-input"
                />
                <label htmlFor="cv-upload-input" className="btn-primary" style={{ cursor: 'pointer', display: 'inline-flex' }}>
                  {uploadProgress['cv'] ? 'Subiendo y procesando...' : 'Seleccionar Archivo de CV'}
                </label>
                {uploadedDocs.some((d) => d.document_type === 'cv') && (
                  <div style={{ marginTop: '0.75rem', color: '#34d399', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                    <CheckCircle2 size={15} />
                    <span>CV adjuntado correctamente</span>
                  </div>
                )}
              </div>
            )}

            {/* 1. Datos Físicos y de Seguridad - Simplificado UX */}
            <div style={{ borderBottom: '1px solid rgba(220, 38, 38, 0.2)', paddingBottom: '1.5rem', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', color: '#fff', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Shield size={18} color="#dc2626" />
                <span>Perfil Operativo y Seguridad</span>
              </h3>

              {/* Datos físicos básicos - siempre visibles */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#aaa', marginBottom: '0.3rem', textTransform: 'uppercase' }}>
                    Estatura (cm) <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="number"
                    value={heightCm}
                    onChange={(e) => setHeightCm(e.target.value ? Number(e.target.value) : '')}
                    placeholder="175"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#aaa', marginBottom: '0.3rem', textTransform: 'uppercase' }}>
                    Peso Aprox. (kg)
                  </label>
                  <input
                    type="number"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value ? Number(e.target.value) : '')}
                    placeholder="75"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#aaa', marginBottom: '0.3rem', textTransform: 'uppercase' }}>
                    Distrito de Residencia
                  </label>
                  <input
                    type="text"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    placeholder="San Juan de Lurigancho / Los Olivos"
                  />
                </div>
              </div>

              {/* SUCAMEC - Solo si es requerido por la convocatoria */}
              {requiresSucamec && (
                <div style={{ 
                  background: '#0a0a0a', 
                  border: '1px solid rgba(220, 38, 38, 0.2)', 
                  borderRadius: '12px', 
                  padding: '1.25rem', 
                  marginBottom: '1.5rem' 
                }}>
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#fff', marginBottom: '0.5rem' }}>
                      ¿Tienes carné SUCAMEC?
                    </label>
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                      {[
                        { value: 'valid', label: '🟢 Vigente', color: '#34d399' },
                        { value: 'in_process', label: '🟡 En Trámite', color: '#fbbf24' },
                        { value: 'none', label: '⚫ No Tengo', color: '#888' },
                        { value: 'expired', label: '🔴 Vencido', color: '#f87171' }
                      ].map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setSucamecStatus(option.value as any)}
                          style={{
                            flex: 1,
                            minWidth: '100px',
                            padding: '0.75rem 1rem',
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            borderRadius: '6px',
                            background: sucamecStatus === option.value ? option.color : '#1a1a1a',
                            border: sucamecStatus === option.value ? `1px solid ${option.color}` : '1px solid rgba(255,255,255,0.1)',
                            color: sucamecStatus === option.value ? '#080808' : '#ccc',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Código SUCAMEC condicional */}
                  {(sucamecStatus === 'valid' || sucamecStatus === 'in_process') && (
                    <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#aaa', marginBottom: '0.3rem', textTransform: 'uppercase' }}>
                        Código SUCAMEC (opcional)
                      </label>
                      <input
                        type="text"
                        value={sucamecCode}
                        onChange={(e) => setSucamecCode(e.target.value)}
                        placeholder="SUC-2026-..."
                        style={{ fontSize: '0.9rem' }}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Experiencia en seguridad - Solo si es requerido por la convocatoria */}
              {requiresExperience && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#fff', marginBottom: '0.5rem' }}>
                    ¿Cuántos años de experiencia tienes en seguridad?
                    {minExperienceYears && <span style={{ color: '#dc2626', marginLeft: '0.5rem' }}>(mínimo {minExperienceYears} años)</span>}
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={securityExpYears}
                    onChange={(e) => setSecurityExpYears(Number(e.target.value))}
                    placeholder="Ej: 2"
                    style={{ maxWidth: '200px' }}
                  />
                  <p style={{ fontSize: '0.75rem', color: '#888', marginTop: '0.5rem' }}>
                    Este dato nos ayuda a entender tu perfil. El sistema calculará tu experiencia acreditada based on tu historial laboral.
                  </p>
                </div>
              )}

              {/* Licencias condicionales - Solo mostrar si son requeridas */}
              {(requiresGunLicense || requiresDriverLicense || requiresMilitaryService) && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                  
                  {/* Licencia de Armas - Solo si es requerida */}
                  {requiresGunLicense && (
                    <div style={{ 
                      background: '#0a0a0a', 
                      border: '1px solid rgba(220, 38, 38, 0.2)', 
                      borderRadius: '12px', 
                      padding: '1.25rem' 
                    }}>
                      <div style={{ marginBottom: '0.75rem' }}>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#fff', marginBottom: '0.5rem' }}>
                          🔫 ¿Tienes licencia de armas?
                          {requiredGunLicenseType && <span style={{ color: '#dc2626', marginLeft: '0.5rem' }}>(Requerido: {requiredGunLicenseType})</span>}
                        </label>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            type="button"
                            onClick={() => setGunLicense(true)}
                            style={{
                              flex: 1,
                              padding: '0.6rem 1rem',
                              fontSize: '0.85rem',
                              fontWeight: 600,
                              borderRadius: '6px',
                              background: gunLicense ? '#DC2626' : '#1a1a1a',
                              border: gunLicense ? '1px solid #DC2626' : '1px solid rgba(255,255,255,0.1)',
                              color: gunLicense ? '#fff' : '#ccc',
                              cursor: 'pointer'
                            }}
                          >
                            SÍ
                          </button>
                          <button
                            type="button"
                            onClick={() => setGunLicense(false)}
                            style={{
                              flex: 1,
                              padding: '0.6rem 1rem',
                              fontSize: '0.85rem',
                              fontWeight: 600,
                              borderRadius: '6px',
                              background: !gunLicense ? '#34d399' : '#1a1a1a',
                              border: !gunLicense ? '1px solid #34d399' : '1px solid rgba(255,255,255,0.1)',
                              color: !gunLicense ? '#080808' : '#ccc',
                              cursor: 'pointer'
                            }}
                          >
                            NO
                          </button>
                        </div>
                      </div>

                      {/* Tipo de licencia condicional */}
                      {gunLicense && (
                        <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#aaa', marginBottom: '0.3rem', textTransform: 'uppercase' }}>
                            Tipo de licencia
                          </label>
                          <select 
                            value={gunLicenseType} 
                            onChange={(e) => handleGunLicenseTypeChange(e.target.value)}
                            style={{ fontSize: '0.9rem' }}
                          >
                            <option value="L1">L1 - Guardia Armado</option>
                            <option value="L2">L2 - Escolta</option>
                            <option value="L3">L3 - Seguridad Privada</option>
                            <option value="L4">L4 - Transporte de Valores</option>
                            <option value="OTRA">Otra</option>
                          </select>
                          {licenseWarning && (
                            <div style={{ marginTop: '0.5rem', padding: '0.5rem', background: 'rgba(251, 191, 36, 0.1)', border: '1px solid rgba(251, 191, 36, 0.3)', borderRadius: '4px', fontSize: '0.75rem', color: '#fbbf24' }}>
                              ⚠️ {licenseWarning}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Licencia de Conducir - Solo si es requerida */}
                  {requiresDriverLicense && (
                    <div style={{ 
                      background: '#0a0a0a', 
                      border: '1px solid rgba(220, 38, 38, 0.2)', 
                      borderRadius: '12px', 
                      padding: '1.25rem' 
                    }}>
                      <div style={{ marginBottom: '0.75rem' }}>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#fff', marginBottom: '0.5rem' }}>
                          🚗 ¿Tienes licencia de conducir?
                          {requiredDriverLicenseType && <span style={{ color: '#dc2626', marginLeft: '0.5rem' }}>(Requerido: {requiredDriverLicenseType})</span>}
                        </label>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            type="button"
                            onClick={() => setDriverLicense(true)}
                            style={{
                              flex: 1,
                              padding: '0.6rem 1rem',
                              fontSize: '0.85rem',
                              fontWeight: 600,
                              borderRadius: '6px',
                              background: driverLicense ? '#DC2626' : '#1a1a1a',
                              border: driverLicense ? '1px solid #DC2626' : '1px solid rgba(255,255,255,0.1)',
                              color: driverLicense ? '#fff' : '#ccc',
                              cursor: 'pointer'
                            }}
                          >
                            SÍ
                          </button>
                          <button
                            type="button"
                            onClick={() => setDriverLicense(false)}
                            style={{
                              flex: 1,
                              padding: '0.6rem 1rem',
                              fontSize: '0.85rem',
                              fontWeight: 600,
                              borderRadius: '6px',
                              background: !driverLicense ? '#34d399' : '#1a1a1a',
                              border: !driverLicense ? '1px solid #34d399' : '1px solid rgba(255,255,255,0.1)',
                              color: !driverLicense ? '#080808' : '#ccc',
                              cursor: 'pointer'
                            }}
                          >
                            NO
                          </button>
                        </div>
                      </div>

                      {/* Tipo de brevete condicional */}
                      {driverLicense && (
                        <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#aaa', marginBottom: '0.3rem', textTransform: 'uppercase' }}>
                            Categoría de brevete
                          </label>
                          <select 
                            value={driverLicenseType} 
                            onChange={(e) => handleDriverLicenseTypeChange(e.target.value)}
                            style={{ fontSize: '0.9rem' }}
                          >
                            <option value="A1">A1 - Motocicleta</option>
                            <option value="A2">A2 - Motocicleta</option>
                            <option value="B">B - Automóvil</option>
                            <option value="C">C - Camioneta</option>
                            <option value="D">D - Camión</option>
                            <option value="OTRA">Otra</option>
                          </select>
                          {driverLicenseWarning && (
                            <div style={{ marginTop: '0.5rem', padding: '0.5rem', background: 'rgba(251, 191, 36, 0.1)', border: '1px solid rgba(251, 191, 36, 0.3)', borderRadius: '4px', fontSize: '0.75rem', color: '#fbbf24' }}>
                              ⚠️ {driverLicenseWarning}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Servicio Militar - Solo si es requerido */}
                  {requiresMilitaryService && (
                    <div style={{ 
                      background: '#0a0a0a', 
                      border: '1px solid rgba(220, 38, 38, 0.2)', 
                      borderRadius: '12px', 
                      padding: '1.25rem' 
                    }}>
                      <div style={{ marginBottom: '0.75rem' }}>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#fff', marginBottom: '0.5rem' }}>
                          ⚔️ ¿Realizaste servicio militar?
                        </label>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            type="button"
                            onClick={() => setMilitaryService(true)}
                            style={{
                              flex: 1,
                              padding: '0.6rem 1rem',
                              fontSize: '0.85rem',
                              fontWeight: 600,
                              borderRadius: '6px',
                              background: militaryService ? '#DC2626' : '#1a1a1a',
                              border: militaryService ? '1px solid #DC2626' : '1px solid rgba(255,255,255,0.1)',
                              color: militaryService ? '#fff' : '#ccc',
                              cursor: 'pointer'
                            }}
                          >
                            SÍ
                          </button>
                          <button
                            type="button"
                            onClick={() => setMilitaryService(false)}
                            style={{
                              flex: 1,
                              padding: '0.6rem 1rem',
                              fontSize: '0.85rem',
                              fontWeight: 600,
                              borderRadius: '6px',
                              background: !militaryService ? '#34d399' : '#1a1a1a',
                              border: !militaryService ? '1px solid #34d399' : '1px solid rgba(255,255,255,0.1)',
                              color: !militaryService ? '#080808' : '#ccc',
                              cursor: 'pointer'
                            }}
                          >
                            NO
                          </button>
                        </div>
                      </div>

                      {/* Información militar condicional */}
                      {militaryService && (
                        <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#aaa', marginBottom: '0.3rem', textTransform: 'uppercase' }}>
                            Institución
                          </label>
                          <select 
                            value={militaryBranch}
                            onChange={(e) => setMilitaryBranch(e.target.value)}
                            style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}
                          >
                            <option value="">Seleccionar...</option>
                            <option value="EJERCITO">Ejército</option>
                            <option value="MARINA">Marina</option>
                            <option value="FUERZA_AEREA">Fuerza Aérea</option>
                            <option value="POLICIA">Policía</option>
                            <option value="OTRA">Otra</option>
                          </select>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 2. Experiencia Laboral Dinámica - Pregunta Progresiva */}
            {requiresExperience && (
              <div style={{ borderBottom: '1px solid rgba(220, 38, 38, 0.2)', paddingBottom: '1.5rem', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.1rem', color: '#fff', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Briefcase size={18} color="#dc2626" />
                  <span>Experiencia Laboral</span>
                </h3>

                {/* Mensaje si viene de CV parser con experiencia encontrada */}
                {method === 'upload_cv' && experiences.some(e => e.company) && (
                  <div style={{ 
                    background: 'rgba(52, 211, 153, 0.1)', 
                    border: '1px solid rgba(52, 211, 153, 0.3)', 
                    borderRadius: '8px', 
                    padding: '1rem 1.25rem', 
                    marginBottom: '1.5rem',
                    fontSize: '0.85rem',
                    color: '#34d399',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem'
                  }}>
                    <CheckCircle2 size={20} />
                    <div>
                      <span style={{ fontWeight: 700 }}>Encontramos {experiences.filter(e => e.company).length} experiencia{experiences.filter(e => e.company).length !== 1 ? 's' : ''} en tu CV.</span>
                      <span style={{ color: '#aaa', marginLeft: '0.5rem' }}>Puedes editarla o agregar más.</span>
                    </div>
                  </div>
                )}

                {/* Pregunta inicial progresiva - Solo si no hay experiencia del CV */}
                {(method !== 'upload_cv' || !experiences.some(e => e.company)) && (
                  <div style={{ 
                    background: '#0a0a0a', 
                    border: '1px solid rgba(220, 38, 38, 0.2)', 
                    borderRadius: '12px', 
                    padding: '1.25rem', 
                    marginBottom: '1.5rem' 
                  }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#fff', marginBottom: '0.5rem' }}>
                      ¿Has trabajado anteriormente?
                    </label>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      <button
                        type="button"
                        onClick={() => {
                          if (experiences.length === 0 || (experiences.length === 1 && !experiences[0].company)) {
                            handleAddExperience();
                          }
                        }}
                        style={{
                          flex: 1,
                          padding: '0.75rem 1.25rem',
                          fontSize: '0.9rem',
                          fontWeight: 600,
                          borderRadius: '6px',
                          background: experiences.some(e => e.company) ? '#DC2626' : '#1a1a1a',
                          border: experiences.some(e => e.company) ? '1px solid #DC2626' : '1px solid rgba(255,255,255,0.1)',
                          color: experiences.some(e => e.company) ? '#fff' : '#ccc',
                          cursor: 'pointer'
                        }}
                      >
                        SÍ
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setExperiences([{ company: '', position: 'Agente de Seguridad', startDate: '', endDate: '', current: false, city: 'Lima', functions: '' }]);
                        }}
                        style={{
                          flex: 1,
                          padding: '0.75rem 1.25rem',
                          fontSize: '0.9rem',
                          fontWeight: 600,
                          borderRadius: '6px',
                          background: !experiences.some(e => e.company) ? '#34d399' : '#1a1a1a',
                          border: !experiences.some(e => e.company) ? '1px solid #34d399' : '1px solid rgba(255,255,255,0.1)',
                          color: !experiences.some(e => e.company) ? '#080808' : '#ccc',
                          cursor: 'pointer'
                        }}
                      >
                        NO
                      </button>
                    </div>
                  </div>
                )}

                {/* Formulario de experiencia - solo si respondió SÍ o viene de CV */}
                {experiences.some(e => e.company) && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <span style={{ fontSize: '0.8rem', color: '#888', fontWeight: 600 }}>
                        {experiences.filter(e => e.company).length} experiencia{experiences.filter(e => e.company).length !== 1 ? 's' : ''} registrada{experiences.filter(e => e.company).length !== 1 ? 's' : ''}
                      </span>
                      <button
                        type="button"
                        onClick={handleAddExperience}
                        className="btn-secondary"
                        style={{ padding: '0.4rem 0.85rem', fontSize: '0.78rem', color: '#34d399', borderColor: 'rgba(16, 185, 129, 0.3)' }}
                      >
                        <Plus size={14} />
                        <span>+ Agregar</span>
                      </button>
                    </div>

                    {experiences.filter(e => e.company).map((exp, idx) => {
                      const originalIndex = experiences.indexOf(exp);
                      return (
                        <div
                          key={originalIndex}
                          style={{
                            background: 'rgba(255, 255, 255, 0.02)',
                            border: '1px solid rgba(255, 255, 255, 0.06)',
                            borderRadius: '12px',
                            padding: '1.25rem',
                            marginBottom: '1rem',
                            position: 'relative',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#dc2626', textTransform: 'uppercase' }}>
                              Experiencia #{idx + 1}
                            </span>
                            {experiences.filter(e => e.company).length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveExperience(originalIndex)}
                                style={{ background: 'transparent', color: '#f87171', padding: '0.2rem' }}
                              >
                                <Trash2 size={15} />
                              </button>
                            )}
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginBottom: '0.85rem' }}>
                            <div>
                              <label style={{ display: 'block', fontSize: '0.72rem', color: '#888', marginBottom: '0.25rem' }}>Empresa</label>
                              <input
                                type="text"
                                value={exp.company}
                                onChange={(e) => handleUpdateExperience(originalIndex, 'company', e.target.value)}
                                placeholder="Ej: Prosegur / Liderman"
                              />
                            </div>
                            <div>
                              <label style={{ display: 'block', fontSize: '0.72rem', color: '#888', marginBottom: '0.25rem' }}>Cargo</label>
                              <input
                                type="text"
                                value={exp.position}
                                onChange={(e) => handleUpdateExperience(originalIndex, 'position', e.target.value)}
                                placeholder="Ej: Agente de Seguridad"
                              />
                            </div>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.85rem', marginBottom: '0.85rem' }}>
                            <div>
                              <label style={{ display: 'block', fontSize: '0.72rem', color: '#888', marginBottom: '0.25rem' }}>Desde</label>
                              <input
                                type="text"
                                value={exp.startDate}
                                onChange={(e) => handleUpdateExperience(originalIndex, 'startDate', e.target.value)}
                                placeholder="2022-01"
                              />
                            </div>
                            <div>
                              <label style={{ display: 'block', fontSize: '0.72rem', color: '#888', marginBottom: '0.25rem' }}>Hasta</label>
                              <input
                                type="text"
                                value={exp.endDate}
                                onChange={(e) => handleUpdateExperience(originalIndex, 'endDate', e.target.value)}
                                placeholder="2024-06 o Actual"
                              />
                            </div>
                            <div>
                              <label style={{ display: 'block', fontSize: '0.72rem', color: '#888', marginBottom: '0.25rem' }}>Ciudad</label>
                              <input
                                type="text"
                                value={exp.city}
                                onChange={(e) => handleUpdateExperience(originalIndex, 'city', e.target.value)}
                                placeholder="Lima"
                              />
                            </div>
                          </div>

                          <div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.72rem', color: '#888', marginBottom: '0.25rem', cursor: 'pointer' }}>
                              <input 
                                type="checkbox" 
                                checked={exp.current} 
                                onChange={(e) => handleUpdateExperience(originalIndex, 'current', e.target.checked)} 
                              />
                              <span>Actualmente trabajo aquí</span>
                            </label>
                          </div>

                          <div style={{ marginTop: '0.5rem' }}>
                            <label style={{ display: 'block', fontSize: '0.72rem', color: '#888', marginBottom: '0.25rem' }}>Funciones principales</label>
                            <input
                              type="text"
                              value={exp.functions}
                              onChange={(e) => handleUpdateExperience(originalIndex, 'functions', e.target.value)}
                              placeholder="Control de accesos, vigilancia perimétrica y rondas"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
            )}

            {/* Navigation */}
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', marginTop: '2rem' }}>
              <button type="button" className="btn-secondary" onClick={() => setStep(2)}>
                <ArrowLeft size={16} />
                <span>Atrás</span>
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={handleSaveProfileAndNext}
                disabled={actionLoading}
                style={{ padding: '0.85rem 1.75rem' }}
              >
                <span>{actionLoading ? 'Guardando...' : 'Continuar a Documentos'}</span>
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            PASO 4: EXPEDIENTE DIGITAL DEL POSTULANTE
        ══════════════════════════════════════════════════════════════════════ */}
        {step === 4 && (
          <div
            style={{
              background: '#0d0d0d',
              border: '1px solid rgba(220, 38, 38, 0.25)',
              borderRadius: '20px',
              padding: '2.5rem 2rem',
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <span style={{ fontSize: '0.75rem', color: '#dc2626', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Paso 4 de 5 • Expediente Digital
              </span>
              <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '2rem', fontWeight: 900, color: '#ffffff', textTransform: 'uppercase' }}>
                📂 Completa tu Expediente
              </h2>
              <p style={{ fontSize: '0.85rem', color: '#888', marginTop: '0.25rem' }}>
                Para esta convocatoria necesitamos los siguientes documentos:
              </p>
            </div>

            {/* Indicador de Progreso del Expediente */}
            {expedienteProgress && (
              <div style={{ 
                background: 'rgba(220, 38, 38, 0.08)', 
                border: '1px solid rgba(220, 38, 38, 0.3)', 
                borderRadius: '12px', 
                padding: '1.5rem', 
                marginBottom: '2rem' 
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <div>
                    <h3 style={{ color: '#ffffff', fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>
                      EXPEDIENTE
                    </h3>
                    <p style={{ color: '#888', fontSize: '0.85rem', margin: '0.25rem 0 0' }}>
                      {expedienteProgress.required_completed} / {expedienteProgress.total_required} obligatorios
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ color: '#34d399', fontSize: '1.5rem', fontWeight: 900 }}>
                      {expedienteProgress.progress_percentage}%
                    </span>
                  </div>
                </div>
                
                {/* Barra de progreso */}
                <div style={{ 
                  background: 'rgba(255, 255, 255, 0.1)', 
                  borderRadius: '8px', 
                  height: '12px', 
                  overflow: 'hidden',
                  marginBottom: '1rem'
                }}>
                  <div style={{ 
                    background: 'linear-gradient(90deg, #dc2626, #ef4444)', 
                    height: '100%', 
                    width: `${expedienteProgress.progress_percentage}%`,
                    borderRadius: '8px',
                    transition: 'width 0.3s ease'
                  }} />
                </div>

                {/* Estado de documentos */}
                <div style={{ 
                  display: 'flex', 
                  gap: '2rem', 
                  paddingTop: '1rem', 
                  borderTop: '1px solid rgba(255, 255, 255, 0.1)' 
                }}>
                  <div>
                    <span style={{ color: '#34d399', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                      Verificados
                    </span>
                    <p style={{ color: '#ffffff', fontSize: '1rem', fontWeight: 700, margin: '0.25rem 0 0' }}>
                      {expedienteStatus?.documents_verified || 0}
                    </p>
                  </div>
                  <div>
                    <span style={{ color: '#fbbf24', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                      Pendientes
                    </span>
                    <p style={{ color: '#ffffff', fontSize: '1rem', fontWeight: 700, margin: '0.25rem 0 0' }}>
                      {expedienteStatus?.documents_pending || 0}
                    </p>
                  </div>
                  {expedienteProgress.required_pending > 0 && (
                    <div>
                      <span style={{ color: '#ef4444', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                        Faltantes
                      </span>
                      <p style={{ color: '#ef4444', fontSize: '1rem', fontWeight: 700, margin: '0.25rem 0 0' }}>
                        {expedienteProgress.required_pending}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Documentos del Expediente Digital */}
            {documentRequirements && Array.isArray(documentRequirements) && documentRequirements.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {/* Documentos Obligatorios */}
                <div>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.5rem', 
                    marginBottom: '1rem' 
                  }}>
                    <span style={{ color: '#dc2626', fontSize: '1.2rem' }}>🔴</span>
                    <h3 style={{ color: '#ffffff', fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>
                      OBLIGATORIOS
                    </h3>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {documentRequirements
                      .filter((req: any) => req.is_required)
                      .map((requirement: any) => (
                        <ExpedienteDigitalCard 
                          key={requirement.id}
                          requirement={requirement}
                          documents={applicationDocuments}
                          uploadProgress={uploadProgress}
                          onUpload={handleExpedienteUpload}
                          onConfirmClassification={handleConfirmClassification}
                          onDelete={handleDeleteDocument}
                          draftToken={draftToken}
                        />
                      ))}
                  </div>
                </div>

                {/* Documentos Opcionales */}
                {documentRequirements.some((req: any) => !req.is_required) && (
                  <div>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.5rem', 
                      marginBottom: '1rem' 
                    }}>
                      <span style={{ color: '#34d399', fontSize: '1.2rem' }}>🟢</span>
                      <h3 style={{ color: '#ffffff', fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>
                        ADICIONALES
                      </h3>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {documentRequirements
                        .filter((req: any) => !req.is_required)
                        .map((requirement: any) => (
                          <ExpedienteDigitalCard 
                            key={requirement.id}
                            requirement={requirement}
                            documents={applicationDocuments}
                            uploadProgress={uploadProgress}
                            onUpload={handleExpedienteUpload}
                            onConfirmClassification={handleConfirmClassification}
                            onDelete={handleDeleteDocument}
                            draftToken={draftToken}
                          />
                        ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Fallback para compatibilidad con sistema anterior */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                {reqDocs.map((docItem: RequiredDoc) => {
                  const isUploaded = uploadedDocs.some((d) => d.document_type === docItem.type);
                  const isUploading = uploadProgress[docItem.type];
                  
                  // Estado visual
                  let statusIndicator = '🟡 PENDIENTE';
                  let statusColor = '#fbbf24';
                  let statusBg = 'rgba(251, 191, 36, 0.1)';
                  let statusBorder = 'rgba(251, 191, 36, 0.3)';
                  
                  if (isUploaded) {
                    statusIndicator = '🟢 RECIBIDO';
                    statusColor = '#34d399';
                    statusBg = 'rgba(16, 185, 129, 0.1)';
                    statusBorder = 'rgba(16, 185, 129, 0.3)';
                  }

                  return (
                    <div
                      key={docItem.type}
                      className="wizard-document-item"
                      style={{
                        background: statusBg,
                        border: `1px solid ${statusBorder}`,
                        borderRadius: '12px',
                        padding: '1.25rem',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <FolderOpen size={20} color={statusColor} />
                          <div>
                            <h4 style={{ color: '#ffffff', fontSize: '1rem', fontWeight: 700, margin: 0 }}>
                              {docItem.label}
                            </h4>
                            <p style={{ color: '#888', fontSize: '0.8rem', margin: '0.25rem 0 0' }}>
                              {docItem.required ? 'Obligatorio' : 'Opcional'}
                            </p>
                          </div>
                        </div>
                        <div style={{ 
                          background: statusBg, 
                          border: `1px solid ${statusBorder}`, 
                          borderRadius: '20px', 
                          padding: '0.25rem 0.75rem',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          color: statusColor
                        }}>
                          {statusIndicator}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                        <label style={{ 
                          flex: 1,
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          gap: '0.5rem',
                          background: 'rgba(220, 38, 38, 0.1)', 
                          border: '1px solid rgba(220, 38, 38, 0.3)', 
                          borderRadius: '8px', 
                          padding: '0.6rem 1rem',
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          color: '#dc2626',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                        }} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(220, 38, 38, 0.2)'}
                           onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(220, 38, 38, 0.1)'}>
                          <Camera size={16} />
                          <span>{isUploading ? 'Subiendo...' : 'Tomar Foto'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            onChange={(e) => handleFileUpload(e, docItem.type)}
                            disabled={isUploading}
                            style={{ display: 'none' }}
                          />
                        </label>

                        <label style={{ 
                          flex: 1,
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          gap: '0.5rem',
                          background: 'rgba(255, 255, 255, 0.05)', 
                          border: '1px solid rgba(255, 255, 255, 0.1)', 
                          borderRadius: '8px', 
                          padding: '0.6rem 1rem',
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          color: '#ffffff',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                        }} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
                           onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}>
                          <Upload size={16} />
                          <span>{isUploading ? 'Subiendo...' : 'Subir Archivo'}</span>
                          <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png,.webp"
                            onChange={(e) => handleFileUpload(e, docItem.type)}
                            disabled={isUploading}
                            style={{ display: 'none' }}
                          />
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Navigation */}
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
              <button type="button" className="btn-secondary" onClick={() => setStep(3)}>
                <ArrowLeft size={16} />
                <span>Atrás</span>
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={() => setStep(5)}
                disabled={!expedienteProgress?.is_complete}
                style={{ 
                  padding: '0.85rem 1.75rem',
                  opacity: !expedienteProgress?.is_complete ? 0.5 : 1
                }}
              >
                <span>{!expedienteProgress?.is_complete ? 'Completa los obligatorios' : 'Revisar y Enviar'}</span>
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* Modal de Confirmación de Clasificación */}
        {classificationModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}>
            <div style={{
              background: '#0d0d0d',
              border: '1px solid rgba(220, 38, 38, 0.3)',
              borderRadius: '16px',
              padding: '2rem',
              maxWidth: '500px',
              width: '90%',
            }}>
              <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <div style={{ 
                  width: '60px', 
                  height: '60px', 
                  borderRadius: '50%', 
                  background: 'rgba(251, 191, 36, 0.2)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  margin: '0 auto 1rem'
                }}>
                  <HelpCircle size={30} color="#fbbf24" />
                </div>
                <h3 style={{ color: '#ffffff', fontSize: '1.3rem', fontWeight: 700, margin: '0 0 0.5rem' }}>
                  ¿Confirmar tipo de documento?
                </h3>
                <p style={{ color: '#888', fontSize: '0.9rem', margin: 0 }}>
                  El sistema sugiere que este documento es:
                </p>
              </div>

              <div style={{ 
                background: 'rgba(251, 191, 36, 0.1)', 
                border: '1px solid rgba(251, 191, 36, 0.3)', 
                borderRadius: '12px', 
                padding: '1rem', 
                marginBottom: '1.5rem',
                textAlign: 'center'
              }}>
                <p style={{ color: '#fbbf24', fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>
                  {classificationModal.classification.suggestedType}
                </p>
                <p style={{ color: '#888', fontSize: '0.8rem', margin: '0.25rem 0 0' }}>
                  Confianza: {Math.round(classificationModal.classification.confidence * 100)}%
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <button
                  onClick={() => handleConfirmClassification(
                    classificationModal.classification.suggestedType,
                    classificationModal.classification.suggestedCategory
                  )}
                  style={{
                    background: '#34d399',
                    border: '1px solid #34d399',
                    borderRadius: '8px',
                    padding: '0.75rem 1rem',
                    color: '#080808',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#10b981'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#34d399'}
                >
                  <Check size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.5rem' }} />
                  Confirmar Sugerencia
                </button>

                <button
                  onClick={() => setClassificationModal(null)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    padding: '0.75rem 1rem',
                    color: '#ffffff',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
                >
                  Cambiar Tipo Manualmente
                </button>
              </div>

              <button
                onClick={() => setClassificationModal(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#888',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  width: '100%',
                  padding: '0.5rem',
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            PASO 5: REVISIÓN, PREEVALUACIÓN Y CONFIRMACIÓN
        ══════════════════════════════════════════════════════════════════════ */}
        {step === 5 && (
          <div
            style={{
              background: '#0d0d0d',
              border: '1px solid rgba(220, 38, 38, 0.25)',
              borderRadius: '20px',
              padding: '2.5rem 2rem',
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <span style={{ fontSize: '0.75rem', color: '#dc2626', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Paso 5 de 5 • Revisión Final
              </span>
              <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '2rem', fontWeight: 900, color: '#ffffff', textTransform: 'uppercase' }}>
                Revisa tu Postulación
              </h2>
              <p style={{ fontSize: '0.85rem', color: '#888', marginTop: '0.25rem' }}>
                Verifica tus datos antes de enviar la postulación a Security Force P&V.
              </p>
            </div>

            {/* Preevaluación de Compatibilidad FitScore */}
            <div
              style={{
                background: `
                  radial-gradient(circle at 10% 20%, rgba(16, 185, 129, 0.1) 0%, transparent 60%),
                  #101010
                `,
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '16px',
                padding: '1.5rem',
                marginBottom: '1.75rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Sparkles size={20} color="#34d399" />
                  <h4 style={{ fontSize: '1.05rem', color: '#ffffff' }}>Compatibilidad Preliminar con la Vacante</h4>
                </div>
                <span style={{ fontSize: '1.35rem', fontWeight: 900, color: '#34d399', fontFamily: "'Barlow Condensed', sans-serif" }}>
                  {fitScoreData?.fitScore ? `${fitScoreData.fitScore}% Cumplimiento` : '~92% Cumplimiento'}
                </span>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#aaa', lineHeight: 1.5, margin: 0 }}>
                {fitScoreData?.isEligible !== false
                  ? `Tu perfil cumple con los requisitos principales de estatura, SUCAMEC y experiencia solicitados para ${opening?.title}.`
                  : `Atención: Revisa los requisitos de la vacante. Algunos requisitos eliminatorios podrían requerir convalidación.`}
              </p>
            </div>

            {/* Resumen de Datos */}
            <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginBottom: '0.85rem' }}>
                <div>
                  <span style={{ color: '#888', fontSize: '0.72rem' }}>Postulante:</span>
                  <p style={{ color: '#fff', fontWeight: 700 }}>{firstName} {lastName}</p>
                </div>
                <div>
                  <span style={{ color: '#888', fontSize: '0.72rem' }}>DNI / Documento:</span>
                  <p style={{ color: '#fff', fontWeight: 700 }}>{docNumber}</p>
                </div>
                <div>
                  <span style={{ color: '#888', fontSize: '0.72rem' }}>WhatsApp / Teléfono:</span>
                  <p style={{ color: '#34d399', fontWeight: 700 }}>{phone}</p>
                </div>
                <div>
                  <span style={{ color: '#888', fontSize: '0.72rem' }}>SUCAMEC:</span>
                  <p style={{ color: '#fff', fontWeight: 700 }}>{sucamecStatus === 'valid' ? '🟢 Carné Vigente' : sucamecStatus}</p>
                </div>
                <div>
                  <span style={{ color: '#888', fontSize: '0.72rem' }}>Estatura:</span>
                  <p style={{ color: '#fff', fontWeight: 700 }}>{heightCm} cm</p>
                </div>
                <div>
                  <span style={{ color: '#888', fontSize: '0.72rem' }}>Documentos Adjuntados:</span>
                  <p style={{ color: '#34d399', fontWeight: 700 }}>{uploadedDocs.length} archivo(s)</p>
                </div>
              </div>
            </div>

            {/* Declaración Jurada y Consentimiento LOPD */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem' }}>
              <div style={{ background: 'rgba(220, 38, 38, 0.08)', border: '1px solid rgba(220, 38, 38, 0.3)', borderRadius: '12px', padding: '1.25rem' }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={confirmedTruth}
                    onChange={(e) => setConfirmedTruth(e.target.checked)}
                    style={{ marginTop: '3px', accentColor: '#dc2626' }}
                  />
                  <span style={{ fontSize: '0.85rem', color: '#eee', lineHeight: 1.5 }}>
                    <strong>Declaración Jurada:</strong> Confirmo bajo juramento que toda la información ingresada y los documentos adjuntos son legítimos y verídicos. Autorizo a Security Force P&V a verificar mis antecedentes.
                  </span>
                </label>
              </div>

              <div style={{ background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '12px', padding: '1.25rem' }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={consentLopd}
                    onChange={(e) => setConsentLopd(e.target.checked)}
                    style={{ marginTop: '3px', accentColor: '#3b82f6' }}
                  />
                  <span style={{ fontSize: '0.85rem', color: '#eee', lineHeight: 1.5 }}>
                    <strong>Consentimiento LOPD (Ley N° 29733):</strong> Autorizo el tratamiento de mis datos personales para fines de postulación, evaluación y selección por parte de Security Force P&V S.A.C.
                  </span>
                </label>
              </div>
            </div>

            {/* Submit Action */}
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
              <button type="button" className="btn-secondary" onClick={() => setStep(4)}>
                <ArrowLeft size={16} />
                <span>Atrás</span>
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={handleSubmitFinal}
                disabled={actionLoading || !confirmedTruth}
                style={{ padding: '0.95rem 2.25rem', fontSize: '1.05rem', letterSpacing: '0.06em' }}
              >
                <span>{actionLoading ? 'ENVIANDO...' : 'ENVIAR MI POSTULACIÓN AHORA'}</span>
                <CheckCircle2 size={18} />
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            PASO 6: ÉXITO Y CÓDIGO OFICIAL DE SEGUIMIENTO
        ══════════════════════════════════════════════════════════════════════ */}
        {step === 6 && (
          <div
            style={{
              background: `
                radial-gradient(circle at 50% 30%, rgba(220, 38, 38, 0.15) 0%, transparent 70%),
                #0d0d0d
              `,
              border: '1px solid rgba(220, 38, 38, 0.4)',
              borderRadius: '24px',
              padding: '3rem 2rem',
              textAlign: 'center',
              boxShadow: '0 30px 80px rgba(0,0,0,0.9)',
            }}
          >
            {/* Success Icon */}
            <div
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '2px solid #34d399',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#34d399',
                marginBottom: '1.5rem',
              }}
            >
              <CheckCircle2 size={42} />
            </div>

            <h1
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: '2.4rem',
                fontWeight: 900,
                color: '#ffffff',
                textTransform: 'uppercase',
                marginBottom: '0.5rem',
              }}
            >
              ¡POSTULACIÓN RECIBIDA CON ÉXITO!
            </h1>

            <p style={{ fontSize: '0.95rem', color: '#ccc', maxWidth: '540px', margin: '0 auto 2rem', lineHeight: 1.5 }}>
              Gracias por postular a <strong>{opening?.title}</strong>. Tu postulación ha ingresado directamente a la bandeja de nuestro equipo de Selección.
            </p>

            {/* Official Code Card */}
            <div
              style={{
                background: '#121212',
                border: '2px dashed #dc2626',
                borderRadius: '16px',
                padding: '1.75rem',
                maxWidth: '460px',
                margin: '0 auto 2rem',
                boxShadow: '0 0 30px rgba(220, 38, 38, 0.2)',
              }}
            >
              <span style={{ fontSize: '0.75rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
                Tu Código Oficial de Postulación
              </span>
              <div
                style={{
                  fontFamily: "'Barlow Condensed', monospace",
                  fontSize: '2.5rem',
                  fontWeight: 900,
                  color: '#dc2626',
                  letterSpacing: '0.08em',
                  margin: '0.5rem 0',
                }}
              >
                {applicationCode}
              </div>
              <p style={{ fontSize: '0.78rem', color: '#aaa' }}>
                Guarda este código. Lo necesitarás para consultar el estado de tu evaluación en <strong>/postular/consultar</strong>.
              </p>
            </div>

            {/* Actions: Download CV PDF or return */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', maxWidth: '420px', margin: '0 auto' }}>
              <button
                onClick={handleDownloadCvPdf}
                className="btn-secondary"
                style={{ width: '100%', padding: '0.9rem', fontSize: '0.95rem', borderColor: 'rgba(56, 189, 248, 0.4)', color: '#38bdf8' }}
              >
                <Download size={18} />
                <span>Descargar mi CV Oficial en PDF</span>
              </button>

              <button
                onClick={() => navigate('/postular')}
                className="btn-primary"
                style={{ width: '100%', padding: '0.95rem', fontSize: '1rem' }}
              >
                Ver Más Convocatorias
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
