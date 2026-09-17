/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SERVICIO CMS DEL PORTAL PÚBLICO INSTITUCIONAL (Fase 2.8)
 * Security Force P&V S.A.C.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import db from '../../../../db';

export interface PortalSectionRecord {
  id: string;
  company_id: string;
  section_key: string;
  status: 'draft' | 'published' | 'archived';
  version: number;
  title: string | null;
  subtitle: string | null;
  description: string | null;
  content_data: any;
  media_urls: any;
  created_by?: string | null;
  updated_by?: string | null;
  published_by?: string | null;
  created_at: string;
  updated_at: string;
  published_at?: string | null;
}

export interface PortalSectionHistoryRecord {
  id: string;
  company_id: string;
  section_key: string;
  version: number;
  title: string | null;
  subtitle: string | null;
  description: string | null;
  content_data: any;
  media_urls: any;
  published_by?: string | null;
  published_at: string;
  restored_at?: string | null;
}

export interface PortalMediaRecord {
  id: string;
  company_id: string;
  file_name: string;
  original_name: string;
  mime_type: string;
  file_size: number;
  storage_provider: string;
  storage_key: string;
  public_url: string;
  file_hash: string | null;
  alt_text: string | null;
  section_key: string | null;
  uploaded_by?: string | null;
  created_at: string;
}

export class CmsService {
  /**
   * Obtiene la lista de todas las secciones registradas para una empresa con sus estados
   */
  static async getSections(companyId: string): Promise<any[]> {
    const knownKeys = ['hero', 'about', 'benefits', 'how_to_apply', 'footer'];

    const result = await db.query<PortalSectionRecord>(
      `SELECT * FROM portal_sections
       WHERE company_id = $1
       ORDER BY section_key ASC, status ASC`,
      [companyId]
    );

    const sectionsMap = new Map<string, { draft?: PortalSectionRecord; published?: PortalSectionRecord }>();

    for (const row of result.rows) {
      if (!sectionsMap.has(row.section_key)) {
        sectionsMap.set(row.section_key, {});
      }
      const entry = sectionsMap.get(row.section_key)!;
      if (row.status === 'draft') entry.draft = row;
      if (row.status === 'published') entry.published = row;
    }

    // Unir con las claves conocidas
    return knownKeys.map((key) => {
      const entry = sectionsMap.get(key) || {};
      const fallback = this.getInstitutionalFallback(key);
      return {
        section_key: key,
        has_draft: Boolean(entry.draft),
        has_published: Boolean(entry.published),
        current_version: entry.published?.version || 1,
        last_updated_at: entry.draft?.updated_at || entry.published?.updated_at || null,
        last_published_at: entry.published?.published_at || null,
        draft: entry.draft || null,
        published: entry.published || { ...fallback, is_fallback: true },
      };
    });
  }

  /**
   * Obtiene una sección específica para administración (permite preferDraft)
   */
  static async getAdminSection(
    companyId: string,
    sectionKey: string,
    preferDraft = true
  ): Promise<{ data: any; status: 'draft' | 'published' | 'fallback'; version: number; has_draft: boolean }> {
    const draftRes = await db.query<PortalSectionRecord>(
      `SELECT * FROM portal_sections
       WHERE company_id = $1 AND section_key = $2 AND status = 'draft'`,
      [companyId, sectionKey]
    );

    const pubRes = await db.query<PortalSectionRecord>(
      `SELECT * FROM portal_sections
       WHERE company_id = $1 AND section_key = $2 AND status = 'published'`,
      [companyId, sectionKey]
    );

    const draft = draftRes.rows[0];
    const published = pubRes.rows[0];
    const fallback = this.getInstitutionalFallback(sectionKey);

    if (preferDraft && draft) {
      return {
        data: {
          title: draft.title ?? (published?.title ?? fallback.title),
          subtitle: draft.subtitle ?? (published?.subtitle ?? fallback.subtitle),
          description: draft.description ?? (published?.description ?? fallback.description),
          content_data: draft.content_data && Object.keys(draft.content_data).length > 0 ? draft.content_data : (published?.content_data ?? fallback.content_data),
          media_urls: draft.media_urls && Object.keys(draft.media_urls).length > 0 ? draft.media_urls : (published?.media_urls ?? fallback.media_urls),
          updated_at: draft.updated_at,
        },
        status: 'draft',
        version: published?.version || 1,
        has_draft: true,
      };
    }

    if (published) {
      return {
        data: {
          title: published.title ?? fallback.title,
          subtitle: published.subtitle ?? fallback.subtitle,
          description: published.description ?? fallback.description,
          content_data: published.content_data && Object.keys(published.content_data).length > 0 ? published.content_data : fallback.content_data,
          media_urls: published.media_urls && Object.keys(published.media_urls).length > 0 ? published.media_urls : fallback.media_urls,
          published_at: published.published_at,
        },
        status: 'published',
        version: published.version,
        has_draft: Boolean(draft),
      };
    }

    return {
      data: fallback,
      status: 'fallback',
      version: 1,
      has_draft: Boolean(draft),
    };
  }

  /**
   * Guarda o actualiza un borrador (draft) de una sección
   */
  static async saveDraft(
    companyId: string,
    sectionKey: string,
    data: {
      title?: string;
      subtitle?: string;
      description?: string;
      content_data?: any;
      media_urls?: any;
    },
    userId: string
  ): Promise<PortalSectionRecord> {
    const result = await db.query<PortalSectionRecord>(
      `INSERT INTO portal_sections (
        company_id, section_key, status, version,
        title, subtitle, description, content_data, media_urls,
        created_by, updated_by, created_at, updated_at
      ) VALUES ($1, $2, 'draft', 1, $3, $4, $5, $6, $7, $8, $8, NOW(), NOW())
      ON CONFLICT (company_id, section_key, status)
      DO UPDATE SET
        title = EXCLUDED.title,
        subtitle = EXCLUDED.subtitle,
        description = EXCLUDED.description,
        content_data = EXCLUDED.content_data,
        media_urls = EXCLUDED.media_urls,
        updated_by = EXCLUDED.updated_by,
        updated_at = NOW()
      RETURNING *`,
      [
        companyId,
        sectionKey,
        data.title ?? null,
        data.subtitle ?? null,
        data.description ?? null,
        JSON.stringify(data.content_data ?? {}),
        JSON.stringify(data.media_urls ?? {}),
        userId,
      ]
    );

    // Registrar en audit_logs
    await this.logAudit({
      companyId,
      userId,
      action: 'cms_draft_saved',
      resourceId: result.rows[0].id,
      metadata: { sectionKey, title: data.title },
    });

    return result.rows[0];
  }

  /**
   * Publica una sección (traslada draft a published, incrementa versión e inserta en historial)
   */
  static async publishSection(
    companyId: string,
    sectionKey: string,
    userId: string
  ): Promise<PortalSectionRecord> {
    // 1. Obtener draft actual o datos para publicar
    const draftRes = await db.query<PortalSectionRecord>(
      `SELECT * FROM portal_sections
       WHERE company_id = $1 AND section_key = $2 AND status = 'draft'`,
      [companyId, sectionKey]
    );

    // 2. Obtener versión publicada actual para calcular la nueva
    const pubRes = await db.query<PortalSectionRecord>(
      `SELECT * FROM portal_sections
       WHERE company_id = $1 AND section_key = $2 AND status = 'published'`,
      [companyId, sectionKey]
    );

    const publishedRecord = pubRes.rows[0];
    const currentVersion = publishedRecord ? publishedRecord.version : 0;
    const nextVersion = currentVersion + 1;

    let titleToPublish: string | null = null;
    let subtitleToPublish: string | null = null;
    let descToPublish: string | null = null;
    let contentToPublish: any = {};
    let mediaToPublish: any = {};

    if (draftRes.rows.length > 0) {
      const draft = draftRes.rows[0];
      titleToPublish = draft.title;
      subtitleToPublish = draft.subtitle;
      descToPublish = draft.description;
      contentToPublish = draft.content_data;
      mediaToPublish = draft.media_urls;
    } else if (publishedRecord) {
      titleToPublish = publishedRecord.title;
      subtitleToPublish = publishedRecord.subtitle;
      descToPublish = publishedRecord.description;
      contentToPublish = publishedRecord.content_data;
      mediaToPublish = publishedRecord.media_urls;
    } else {
      const fallback = this.getInstitutionalFallback(sectionKey);
      titleToPublish = fallback.title;
      subtitleToPublish = fallback.subtitle;
      descToPublish = fallback.description;
      contentToPublish = fallback.content_data;
      mediaToPublish = fallback.media_urls;
    }

    // 3. Archivar versión previa en portal_section_history si existía
    if (publishedRecord) {
      await db.query(
        `INSERT INTO portal_section_history (
          company_id, section_key, version,
          title, subtitle, description, content_data, media_urls,
          published_by, published_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          companyId,
          sectionKey,
          publishedRecord.version,
          publishedRecord.title,
          publishedRecord.subtitle,
          publishedRecord.description,
          JSON.stringify(publishedRecord.content_data || {}),
          JSON.stringify(publishedRecord.media_urls || {}),
          publishedRecord.published_by || userId,
          publishedRecord.published_at || new Date(),
        ]
      );
    }

    // 4. Actualizar o insertar registro publicado con nueva versión
    const publishResult = await db.query<PortalSectionRecord>(
      `INSERT INTO portal_sections (
        company_id, section_key, status, version,
        title, subtitle, description, content_data, media_urls,
        created_by, updated_by, published_by, created_at, updated_at, published_at
      ) VALUES ($1, $2, 'published', $3, $4, $5, $6, $7, $8, $9, $9, $9, NOW(), NOW(), NOW())
      ON CONFLICT (company_id, section_key, status)
      DO UPDATE SET
        version = EXCLUDED.version,
        title = EXCLUDED.title,
        subtitle = EXCLUDED.subtitle,
        description = EXCLUDED.description,
        content_data = EXCLUDED.content_data,
        media_urls = EXCLUDED.media_urls,
        updated_by = EXCLUDED.updated_by,
        published_by = EXCLUDED.published_by,
        updated_at = NOW(),
        published_at = NOW()
      RETURNING *`,
      [
        companyId,
        sectionKey,
        nextVersion,
        titleToPublish,
        subtitleToPublish,
        descToPublish,
        JSON.stringify(contentToPublish),
        JSON.stringify(mediaToPublish),
        userId,
      ]
    );

    // 5. Eliminar el borrador ya publicado
    await db.query(
      `DELETE FROM portal_sections
       WHERE company_id = $1 AND section_key = $2 AND status = 'draft'`,
      [companyId, sectionKey]
    );

    // 6. Registrar en audit_logs
    await this.logAudit({
      companyId,
      userId,
      action: 'cms_published',
      resourceId: publishResult.rows[0].id,
      metadata: { sectionKey, version: nextVersion, title: titleToPublish },
    });

    return publishResult.rows[0];
  }

  /**
   * Obtiene el historial de versiones publicadas de una sección
   */
  static async getSectionHistory(companyId: string, sectionKey: string): Promise<PortalSectionHistoryRecord[]> {
    const result = await db.query<PortalSectionHistoryRecord>(
      `SELECT psh.*, u.full_name AS published_by_name, u.username AS published_by_username
       FROM portal_section_history psh
       LEFT JOIN users u ON psh.published_by = u.id
       WHERE psh.company_id = $1 AND psh.section_key = $2
       ORDER BY psh.version DESC`,
      [companyId, sectionKey]
    );
    return result.rows;
  }

  /**
   * Restaura una versión anterior del historial colocándola como nuevo borrador activo
   */
  static async restoreVersion(
    companyId: string,
    sectionKey: string,
    version: number,
    userId: string
  ): Promise<PortalSectionRecord> {
    const histRes = await db.query<PortalSectionHistoryRecord>(
      `SELECT * FROM portal_section_history
       WHERE company_id = $1 AND section_key = $2 AND version = $3`,
      [companyId, sectionKey, version]
    );

    if (histRes.rows.length === 0) {
      throw new Error(`La versión ${version} no existe en el historial.`);
    }

    const hist = histRes.rows[0];

    // Colocarla como draft para revisión antes de publicar
    const draft = await this.saveDraft(
      companyId,
      sectionKey,
      {
        title: hist.title ?? undefined,
        subtitle: hist.subtitle ?? undefined,
        description: hist.description ?? undefined,
        content_data: hist.content_data,
        media_urls: hist.media_urls,
      },
      userId
    );

    await this.logAudit({
      companyId,
      userId,
      action: 'cms_restored',
      resourceId: draft.id,
      metadata: { sectionKey, restoredVersion: version },
    });

    return draft;
  }

  /**
   * Obtiene el contenido publicado para el portal público (solo status = 'published' o fallback institucional)
   */
  static async getPublicSection(sectionKey: string): Promise<any> {
    const fallback = this.getInstitutionalFallback(sectionKey);

    try {
      const companyRes = await db.query<{ id: string }>(
        `SELECT id FROM companies ORDER BY (is_active = TRUE) DESC, created_at ASC LIMIT 1`
      );

      if (companyRes.rows.length === 0) {
        return fallback;
      }

      const companyId = companyRes.rows[0].id;

      const pubRes = await db.query<PortalSectionRecord>(
        `SELECT * FROM portal_sections
         WHERE company_id = $1 AND section_key = $2 AND status = 'published'`,
        [companyId, sectionKey]
      );

      if (pubRes.rows.length === 0) {
        return fallback;
      }

      const row = pubRes.rows[0];

      return {
        section_key: row.section_key,
        version: row.version,
        title: row.title ?? fallback.title,
        subtitle: row.subtitle ?? fallback.subtitle,
        description: row.description ?? fallback.description,
        content_data: row.content_data && Object.keys(row.content_data).length > 0 ? row.content_data : fallback.content_data,
        media_urls: row.media_urls && Object.keys(row.media_urls).length > 0 ? row.media_urls : fallback.media_urls,
        published_at: row.published_at,
      };
    } catch (err) {
      console.error(`Error en getPublicSection (${sectionKey}):`, err);
      return fallback;
    }
  }

  /**
   * Registra un medio público subido (portal_media)
   */
  static async savePublicMedia(
    companyId: string,
    mediaData: {
      fileName: string;
      originalName: string;
      mimeType: string;
      fileSize: number;
      storageProvider: string;
      storageKey: string;
      publicUrl: string;
      fileHash?: string;
      altText?: string;
      sectionKey?: string;
    },
    userId: string
  ): Promise<PortalMediaRecord> {
    const result = await db.query<PortalMediaRecord>(
      `INSERT INTO portal_media (
        company_id, file_name, original_name, mime_type, file_size,
        storage_provider, storage_key, public_url, file_hash, alt_text,
        section_key, uploaded_by, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
      RETURNING *`,
      [
        companyId,
        mediaData.fileName,
        mediaData.originalName,
        mediaData.mimeType,
        mediaData.fileSize,
        mediaData.storageProvider,
        mediaData.storageKey,
        mediaData.publicUrl,
        mediaData.fileHash || null,
        mediaData.altText || null,
        mediaData.sectionKey || null,
        userId,
      ]
    );

    await this.logAudit({
      companyId,
      userId,
      action: 'cms_media_uploaded',
      resourceId: result.rows[0].id,
      metadata: { originalName: mediaData.originalName, mimeType: mediaData.mimeType },
    });

    return result.rows[0];
  }

  /**
   * Obtiene la galería de medios públicos de una empresa
   */
  static async getPublicMediaGallery(companyId: string, sectionKey?: string): Promise<PortalMediaRecord[]> {
    let query = `SELECT * FROM portal_media WHERE company_id = $1`;
    const params: any[] = [companyId];

    if (sectionKey) {
      query += ` AND (section_key = $2 OR section_key IS NULL)`;
      params.push(sectionKey);
    }

    query += ` ORDER BY created_at DESC`;

    const result = await db.query<PortalMediaRecord>(query, params);
    return result.rows;
  }

  /**
   * Fallback institucional seguro (Idéntico a la identidad actual del portal)
   */
  static getInstitutionalFallback(sectionKey: string): any {
    const fallbacks: Record<string, any> = {
      hero: {
        eyebrow: 'ÚNETE A NUESTRO EQUIPO',
        title: 'PROTEGEMOS',
        subtitle: 'LO QUE MÁS IMPORTA',
        description: 'Buscamos personas comprometidas, responsables y con vocación de servicio para formar parte de nuestro equipo.',
        primary_cta_text: 'VER CONVOCATORIAS',
        primary_cta_url: '#convocatorias',
        secondary_cta_text: 'CONOCE MÁS DE NOSOTROS',
        secondary_cta_url: '/postular/nosotros',
        media_urls: {
          desktop_image: '',
          mobile_image: '',
          video_url: '',
        },
        content_data: {},
      },
      about: {
        title: 'QUIÉNES SOMOS',
        subtitle: 'LIDERAZGO EN SEGURIDAD INTEGRAL',
        description: 'Security Force P&V es una empresa líder en seguridad privada, especializada en resguardo corporativo, vigilancia y protección integral. Contamos con más de una década de experiencia brindando servicios de excelencia a empresas e instituciones en todo el país.',
        content_data: {
          stats: [
            { value: '+10', label: 'Años de experiencia', icon: 'Award', order: 1, is_active: true },
            { value: '+5000', label: 'Colaboradores', icon: 'Users', order: 2, is_active: true },
            { value: '+300', label: 'Clientes satisfechos', icon: 'Building', order: 3, is_active: true },
            { value: '24/7', label: 'Servicio operativo', icon: 'Clock', order: 4, is_active: true },
          ],
          mission: 'Brindar servicios de seguridad privada de excelencia, protegiendo personas, bienes e instalaciones con personal altamente capacitado y tecnología de vanguardia, garantizando la tranquilidad de nuestros clientes.',
          vision: 'Ser la empresa líder en seguridad privada del país, reconocida por nuestra profesionalidad, innovación y compromiso con la seguridad integral de nuestros clientes y el bienestar de nuestros colaboradores.',
          values: [
            { title: 'SEGURIDAD', desc: 'Compromiso inquebrantable con la protección de nuestros clientes y sus activos.', icon: 'Shield', order: 1 },
            { title: 'PROFESIONALISMO', desc: 'Personal capacitado y certificado para brindar servicios de alta calidad.', icon: 'UserCheck', order: 2 },
            { title: 'INTEGRIDAD', desc: 'Actuamos con honestidad, ética y transparencia en todas nuestras operaciones.', icon: 'Heart', order: 3 },
            { title: 'EXCELENCIA', desc: 'Buscamos continuamente la mejora en nuestros procesos y servicios.', icon: 'Award', order: 4 },
          ],
          commitment: 'En Security Force P&V nos comprometemos a brindar un ambiente de trabajo seguro, respetuoso y con oportunidades de crecimiento para todos nuestros colaboradores. Valoramos el talento y la dedicación de cada miembro de nuestro equipo.',
        },
        media_urls: {},
      },
      benefits: {
        title: 'BENEFICIOS PARA NUESTROS COLABORADORES',
        subtitle: 'CONDICIONES LABORALES DE EXCELENCIA',
        description: 'En Security Force P&V valoramos a nuestro equipo y ofrecemos un paquete de beneficios competitivos para garantizar tu bienestar y desarrollo profesional.',
        content_data: {
          items: [
            { id: '1', title: 'Seguridad Social', description: 'Afiliación completa al sistema de seguridad social y beneficios de ley desde el primer día.', icon: 'ShieldCheck', order: 1, is_active: true },
            { id: '2', title: 'Vacaciones Pagadas', description: '30 días de vacaciones anuales remuneradas conforme a ley.', icon: 'Calendar', order: 2, is_active: true },
            { id: '3', title: 'Seguro de Salud', description: 'Plan de salud integral para ti y tus derechohabientes.', icon: 'Heart', order: 3, is_active: true },
            { id: '4', title: 'Capacitación Continua', description: 'Programas de formación, reentrenamiento y desarrollo profesional constante.', icon: 'Award', order: 4, is_active: true },
            { id: '5', title: 'Uniforme y Equipo', description: 'Dotación completa de uniforme reglamentario y equipo de protección provisto por la empresa.', icon: 'Briefcase', order: 5, is_active: true },
            { id: '6', title: 'Ambiente de Trabajo', description: 'Cultura organizacional basada en el respeto, reconocimiento y trabajo en equipo.', icon: 'Users', order: 6, is_active: true },
            { id: '7', title: 'Bonos por Desempeño', description: 'Reconocimiento y bonificaciones por puntualidad y excelencia operativa.', icon: 'Sparkles', order: 7, is_active: true },
          ],
          professional_development: [
            'Capacitación técnica continua y cursos SUCAMEC',
            'Programas de liderazgo y formación de supervisores',
            'Certificaciones y acreditaciones oficiales',
            'Oportunidades de línea de carrera y crecimiento interno',
            'Mentoría operativa personalizada',
          ],
          wellness: [
            'Plan de salud y cobertura familiar',
            'Seguro de vida ley desde el primer día',
            'Programa de bienestar y salud ocupacional',
            'Actividades de integración y reconocimientos',
            'Apoyo y asesoría social',
          ],
        },
        media_urls: {},
      },
      how_to_apply: {
        title: '¿CÓMO POSTULAR?',
        subtitle: 'PROCESO 100% DIGITAL Y ÁGIL',
        description: 'Sigue estos sencillos pasos para presentar tu postulación e ingresar a nuestro proceso de selección.',
        content_data: {
          steps: [
            { step_number: '01', title: 'Elige tu vacante', description: 'Explora nuestras convocatorias activas y selecciona la que se ajuste a tu perfil.', icon: 'Briefcase', order: 1, is_active: true },
            { step_number: '02', title: 'Identifícate', description: 'Ingresa tu DNI y número de celular para iniciar tu postulación de forma segura.', icon: 'User', order: 2, is_active: true },
            { step_number: '03', title: 'Sube tu CV o crea tu perfil', description: 'Adjunta tu currículum o ingresa tu experiencia laboral directamente en el asistente.', icon: 'FileText', order: 3, is_active: true },
            { step_number: '04', title: 'Adjunta tus documentos', description: 'Sube fotos o archivos de tu DNI, CUL, SUCAMEC y certificados solicitados.', icon: 'Camera', order: 4, is_active: true },
            { step_number: '05', title: 'Recibe tu código oficial', description: 'Obtén tu código único para dar seguimiento a tu postulación en tiempo real.', icon: 'ShieldCheck', order: 5, is_active: true },
          ],
        },
        media_urls: {},
      },
      footer: {
        title: 'Security Force P&V S.A.C.',
        subtitle: 'Atracción & Selección',
        description: 'Security Force P&V S.A.C. — Empresa líder en servicios de seguridad y vigilancia privada armada y desarmada a nivel nacional.',
        content_data: {
          copyright: `© ${new Date().getFullYear()} Security Force P&V S.A.C. Todos los derechos reservados.`,
          terms_and_conditions: 'Al postular a través de nuestro portal, usted declara bajo juramento que toda la información y documentación proporcionada es verídica y verificable. La falsedad u omisión de datos constituirá causal de descalificación inmediata del proceso de selección.',
          privacy_policy: 'En cumplimiento de la Ley N° 29733 (Ley de Protección de Datos Personales de Perú), los datos personales y documentos facilitados serán tratados exclusivamente para la evaluación curricular, validación de antecedentes y fines inherentes a los procesos de selección de Security Force P&V S.A.C.',
        },
        media_urls: {},
      },
    };

    return fallbacks[sectionKey] || {
      title: sectionKey.toUpperCase(),
      subtitle: '',
      description: '',
      content_data: {},
      media_urls: {},
    };
  }

  /**
   * Helper de registro de auditoría
   */
  private static async logAudit(entry: {
    companyId: string;
    userId: string;
    action: string;
    resourceId?: string;
    metadata?: Record<string, any>;
  }): Promise<void> {
    try {
      await db.query(
        `INSERT INTO audit_logs (
          company_id, user_id, action, resource, resource_id, details, created_at
        ) VALUES ($1, $2, $3, 'cms_portal', $4, $5, NOW())`,
        [
          entry.companyId,
          entry.userId,
          entry.action,
          entry.resourceId || null,
          JSON.stringify(entry.metadata || {}),
        ]
      );
    } catch (e) {
      console.warn('Error al registrar audit_log de CMS:', e);
    }
  }
}
