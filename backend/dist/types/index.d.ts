export type UserRole = 'admin' | 'recruiter' | 'evaluator' | 'user';
export type CardStatus = 'available' | 'reserved' | 'used' | 'cancelled';
export interface PaginationParams {
    page: number;
    limit: number;
    offset: number;
}
export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}
export interface Card {
    id: string;
    company_id: string;
    range_id?: string;
    number: number;
    status: CardStatus;
    used_by?: string;
    used_at?: string;
    reserved_by?: string;
    reserved_at?: string;
    reservation_expires_at?: string;
    cancelled_by?: string;
    cancelled_at?: string;
    observations?: string;
    created_at: string;
    updated_at: string;
}
export type OpeningStatus = 'open' | 'in_progress' | 'filled' | 'cancelled';
export type CandidateStatus = 'registered' | 'phone_screening' | 'psychological_eval' | 'background_check' | 'interview' | 'medical_exam' | 'approved' | 'rejected' | 'hired';
export type SucamecStatus = 'valid' | 'in_process' | 'none' | 'expired';
export type StageResult = 'pending' | 'passed' | 'failed' | 'conditional';
export interface Company {
    id: string;
    name: string;
    ruc?: string;
    address?: string;
    phone?: string;
    email?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}
export interface User {
    id: string;
    company_id: string;
    username: string;
    email: string;
    role: UserRole;
    full_name?: string;
    is_active: boolean;
    last_login_at?: string;
    created_at: string;
    updated_at: string;
}
export type DocumentCategory = 'IDENTIDAD' | 'FORMACION_ACADEMICA' | 'EXPERIENCIA_LABORAL' | 'SEGURIDAD' | 'LICENCIAS' | 'CAPACITACION' | 'OTROS';
export type DocumentType = 'DNI' | 'CE' | 'CUL' | 'CERTIFICADO_ESTUDIOS' | 'CONSTANCIA_ESTUDIOS' | 'CERTIFICADO_SECUNDARIA' | 'CERTIFICADO_INSTITUTO' | 'CERTIFICADO_UNIVERSIDAD' | 'CONSTANCIA_EGRESADO' | 'DIPLOMA' | 'TITULO' | 'CERTIFICADO_TRABAJO' | 'CONSTANCIA_TRABAJO' | 'CERTIFICADO_EXPERIENCIA' | 'SUCAMEC' | 'LICENCIA_ARMAS' | 'BREVETE' | 'CERTIFICADO_CURSO' | 'CERTIFICADO_CAPACITACION' | 'PRIMEROS_AUXILIOS' | 'CCTV' | 'SST' | 'SEGURIDAD' | 'OTRO';
export interface RequiredDocumentSpec {
    type: DocumentType;
    label: string;
    category: DocumentCategory;
    required: boolean;
    description?: string;
    order?: number;
    allowMultiple?: boolean;
    maxFiles?: number;
}
export interface OpeningDocumentRequirement {
    id: string;
    company_id: string;
    job_opening_id: string;
    requirement_id?: string;
    document_type: DocumentType;
    document_category: DocumentCategory;
    title: string;
    description?: string;
    is_required: boolean;
    allow_multiple: boolean;
    max_files: number;
    order_index: number;
    is_active: boolean;
    created_by?: string;
    created_at: string;
    updated_at: string;
}
export interface DocumentClassification {
    id: string;
    company_id: string;
    document_id: string;
    suggested_type?: DocumentType;
    suggested_category?: DocumentCategory;
    confidence_score?: number;
    confirmed_type?: DocumentType;
    confirmed_category?: DocumentCategory;
    confirmed_by?: string;
    confirmed_at?: string;
    classification_method: 'ai' | 'manual' | 'user';
    metadata: Record<string, any>;
    created_at: string;
}
export interface ExpedienteProgress {
    total_required: number;
    total_optional: number;
    required_completed: number;
    optional_completed: number;
    required_pending: number;
    expediente_score: number;
    progress_percentage: number;
    is_complete: boolean;
}
export interface ExpedienteStatus {
    application_id: string;
    company_id: string;
    application_code: string;
    first_name: string;
    last_name: string;
    document_number: string;
    job_title: string;
    expediente_progress: ExpedienteProgress;
    documents_verified: number;
    documents_pending: number;
    documents_observed: number;
    documents_rejected: number;
}
export interface JobOpeningRequirements {
    min_height?: number;
    min_age?: number;
    max_age?: number;
    sucamec_required?: boolean;
    gun_license_required?: boolean;
    driver_license_required?: boolean;
    driver_license_type?: string;
    experience_years?: number;
    required_documents?: RequiredDocumentSpec[];
    benefits?: string[];
}
export interface JobOpening {
    id: string;
    company_id: string;
    category_id?: string;
    title: string;
    position_type: string;
    location: string;
    client_name?: string;
    vacancies_count: number;
    filled_count: number;
    salary_offered?: number;
    shift_type?: string;
    status: OpeningStatus;
    requirements?: JobOpeningRequirements;
    description?: string;
    created_by?: string;
    created_at: string;
    updated_at: string;
    active_candidates_count?: number;
    category_name?: string;
    category_slug?: string;
    publications_count?: number;
}
export type PublicationStatus = 'draft' | 'published' | 'paused' | 'closed' | 'archived';
export type ChannelType = 'facebook' | 'instagram' | 'whatsapp' | 'qr' | 'web' | 'referral' | 'campaign' | 'other';
export interface JobCategory {
    id: string;
    company_id: string;
    name: string;
    slug: string;
    icon?: string;
    color_hex?: string;
    description?: string;
    template_requirements: any[];
    is_active: boolean;
    order_index: number;
    created_by?: string;
    created_at: string;
    updated_at: string;
    openings_count?: number;
    active_publications_count?: number;
}
export interface RecruitmentCampaign {
    id: string;
    company_id: string;
    name: string;
    description?: string;
    utm_campaign?: string;
    status: 'active' | 'paused' | 'ended' | 'archived';
    starts_at?: string;
    ends_at?: string;
    budget_notes?: string;
    total_views: number;
    total_applications: number;
    total_apt: number;
    total_hired: number;
    created_by?: string;
    created_at: string;
    updated_at: string;
    channels_count?: number;
    publications_count?: number;
}
export interface RecruitmentChannel {
    id: string;
    company_id: string;
    campaign_id?: string;
    name: string;
    type: ChannelType | string;
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    description?: string;
    is_active: boolean;
    created_by?: string;
    created_at: string;
    campaign_name?: string;
    views_count?: number;
    applications_count?: number;
    apt_count?: number;
    hired_count?: number;
}
export interface JobPublication {
    id: string;
    company_id: string;
    job_opening_id: string;
    campaign_id?: string;
    channel_id?: string;
    slug: string;
    title: string;
    description?: string;
    banner_url?: string;
    benefits: string[];
    requirement_version_at_publish?: number;
    status: PublicationStatus;
    published_at?: string;
    paused_at?: string;
    closed_at?: string;
    archived_at?: string;
    closes_at?: string;
    og_title?: string;
    og_description?: string;
    og_image_url?: string;
    views_total: number;
    views_unique_estimated: number;
    views_bot: number;
    applications_started: number;
    applications_completed: number;
    created_by?: string;
    created_at: string;
    updated_at: string;
    job_title?: string;
    job_location?: string;
    job_vacancies?: number;
    job_salary?: number;
    job_shift?: string;
    category_name?: string;
    campaign_name?: string;
    channel_name?: string;
    channel_type?: string;
    apt_count?: number;
    hired_count?: number;
}
export interface PublicationView {
    id: string;
    publication_id: string;
    company_id: string;
    channel_id?: string;
    campaign_id?: string;
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    ip_hash?: string;
    user_agent_type: string;
    is_bot: boolean;
    viewed_at: string;
}
export interface ApplicationPublicationSnapshot {
    id: string;
    application_id: string;
    company_id: string;
    publication_id?: string;
    job_opening_id: string;
    requirement_version: number;
    publication_title?: string;
    publication_description?: string;
    requirements_shown: any[];
    benefits_shown: any[];
    channel_id?: string;
    campaign_id?: string;
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    captured_at: string;
}
export interface WorkExperience {
    id?: string;
    company: string;
    position: string;
    startDate: string;
    endDate?: string;
    current?: boolean;
    city?: string;
    jobType?: string;
    functions?: string;
}
export interface EducationItem {
    id?: string;
    institution: string;
    degree: string;
    level: string;
    year?: string;
    status?: string;
}
export interface CourseItem {
    id?: string;
    name: string;
    institution?: string;
    year?: string;
    hours?: number;
}
export interface StructuredProfile {
    experiences: WorkExperience[];
    education: EducationItem[];
    courses: CourseItem[];
    skills: string[];
}
export interface Candidate {
    id: string;
    company_id: string;
    document_type: string;
    document_number: string;
    first_name: string;
    last_name: string;
    email?: string;
    phone: string;
    address?: string;
    district?: string;
    city?: string;
    birth_date?: string;
    gender?: string;
    height_cm?: number;
    weight_kg?: number;
    sucamec_status: SucamecStatus;
    sucamec_code?: string;
    sucamec_expires_at?: string;
    gun_license?: boolean;
    gun_license_type?: string;
    gun_license_expires_at?: string;
    driver_license?: boolean;
    driver_license_type?: string;
    driver_license_expires_at?: string;
    military_service?: boolean;
    security_experience_years?: number;
    notes?: string;
    structured_profile?: StructuredProfile;
    created_by?: string;
    created_at: string;
    updated_at: string;
    current_stage?: CandidateStatus;
    job_opening_title?: string;
    application_id?: string;
}
export type RequirementType = 'eliminatory' | 'scoreable' | 'documental' | 'eliminatory_scoreable' | 'informative';
export type RuleType = 'range' | 'min' | 'max' | 'boolean' | 'exists' | 'validity' | 'text_category' | 'experience_total' | 'experience_specific' | 'document_evidence' | 'date_range' | 'numeric' | 'list_contains';
export type EvaluationResult = 'pass' | 'review' | 'fail' | 'pending';
export type PrefilterStatus = 'eligible' | 'review' | 'ineligible' | 'pending';
export interface OpeningRequirement {
    id: string;
    company_id: string;
    job_opening_id: string;
    version: number;
    code: string;
    title: string;
    description?: string;
    requirement_type: RequirementType;
    rule_type: RuleType;
    rule_config: Record<string, any>;
    weight_score: number;
    required_document_type?: string;
    order_index: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}
export interface DiscrepancyDetail {
    field: string;
    declaredValue: any;
    extractedValue?: any;
    accreditedValue?: any;
    differenceDescription: string;
    severity: 'low' | 'medium' | 'high';
}
export interface ApplicationEvaluation {
    id: string;
    company_id: string;
    application_id: string;
    requirement_id: string;
    result: EvaluationResult;
    score_earned: number;
    max_score: number;
    source_type: 'declared' | 'extracted' | 'accredited' | 'verified_human';
    declared_value?: any;
    extracted_value?: any;
    accredited_value?: any;
    evidence_document_id?: string;
    confidence_score?: number;
    discrepancy_detected: boolean;
    discrepancy_details?: DiscrepancyDetail;
    evaluation_notes?: string;
    is_overridden: boolean;
    overridden_by?: string;
    overridden_at?: string;
    override_reason?: string;
    evaluated_at: string;
    requirement_title?: string;
    requirement_code?: string;
    requirement_type?: RequirementType;
    rule_type?: RuleType;
    evidence_file_name?: string;
    evidence_file_path?: string;
}
export interface ScoreRubricItem {
    code: string;
    title: string;
    earned: number;
    max: number;
    weightPercent: number;
    result: EvaluationResult;
    notes?: string;
}
export interface PrefilterScoreBreakdown {
    totalEarned: number;
    maxPossible: number;
    normalizedPercentage: number;
    rubric: ScoreRubricItem[];
    reasons: string[];
    summaryExplanation: string;
    expedienteScore?: number;
}
export interface ApplicationDocument {
    id: string;
    company_id: string;
    application_id: string;
    document_type: string;
    file_name: string;
    file_path: string;
    mime_type?: string;
    file_size?: number;
    status: 'uploaded' | 'verified' | 'observed' | 'rejected' | 'legible' | 'ilegible' | 'incompleto' | 'vigente' | 'vencido' | 'observado' | 'pendiente';
    extracted_data?: Record<string, any>;
    file_hash?: string;
    storage_provider?: 'local' | 's3';
    storage_key?: string;
    original_name?: string;
    uploaded_at: string;
    document_category?: DocumentCategory;
    document_type_typed?: DocumentType;
    requirement_id?: string;
    verification_status?: 'pending' | 'verified' | 'approved' | 'observed' | 'rejected';
    expires_at?: string;
    classification_confidence?: number;
    is_primary?: boolean;
    metadata?: Record<string, any>;
}
export interface Application {
    id: string;
    company_id: string;
    candidate_id: string;
    job_opening_id: string;
    publication_id?: string;
    channel_id?: string;
    campaign_id?: string;
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    application_code?: string;
    draft_token?: string;
    application_status: string;
    progress_percentage: number;
    compatibility_score?: number;
    prefilter_status: PrefilterStatus;
    prefilter_score: number;
    expediente_score?: number;
    prefilter_breakdown?: PrefilterScoreBreakdown;
    total_accredited_exp_months: number;
    total_declared_exp_months: number;
    discrepancies_count: number;
    evaluation_snapshot?: Record<string, any>;
    evaluated_at?: string;
    current_stage: CandidateStatus;
    stage_score?: number;
    assigned_recruiter?: string;
    rejection_reason?: string;
    hired_at?: string;
    hired_notes?: string;
    submitted_at?: string;
    created_at: string;
    updated_at: string;
    candidate_name?: string;
    candidate_dni?: string;
    candidate_phone?: string;
    candidate_sucamec?: SucamecStatus;
    candidate_height_cm?: number;
    candidate_birth_date?: string;
    job_title?: string;
    publication_title?: string;
    channel_name?: string;
    campaign_name?: string;
    documents?: ApplicationDocument[];
    evaluations?: ApplicationEvaluation[];
}
export interface StageEvaluation {
    id: string;
    company_id: string;
    application_id: string;
    stage: CandidateStatus;
    result: StageResult;
    score?: number;
    observations?: string;
    evaluator_id?: string;
    evaluated_at?: string;
    created_at: string;
    evaluator_name?: string;
}
export interface Interview {
    id: string;
    company_id: string;
    application_id: string;
    interview_date: string;
    location_type: 'presential' | 'virtual';
    location_notes?: string;
    interviewer_id?: string;
    status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
    result_notes?: string;
    created_at: string;
    candidate_name?: string;
    candidate_phone?: string;
    job_title?: string;
    interviewer_name?: string;
}
export interface RecruitmentSummary {
    totalCandidates: number;
    openVacancies: number;
    inEvaluation: number;
    approvedCount: number;
    hiredCount: number;
    activeRecruiters: number;
    pipelineCounts: {
        registered: number;
        phone_screening: number;
        psychological_eval: number;
        background_check: number;
        interview: number;
        medical_exam: number;
        approved: number;
        hired: number;
        rejected: number;
    };
}
export interface AuthUser {
    id: string;
    companyId: string;
    username: string;
    email: string;
    role: UserRole;
    fullName?: string;
    sessionId: string;
}
declare global {
    namespace Express {
        interface Request {
            user?: AuthUser;
        }
    }
}
//# sourceMappingURL=index.d.ts.map