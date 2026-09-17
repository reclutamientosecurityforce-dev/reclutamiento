/**
 * ═══════════════════════════════════════════════════════════════════════════
 * POLÍTICA CENTRALIZADA DE VIGENCIA DOCUMENTAL (DocumentValidityPolicy)
 * Security Force P&V S.A.C.
 * Timezone Oficial: America/Lima (UTC-5)
 * ═══════════════════════════════════════════════════════════════════════════
 */
export interface ValidityEvaluationResult {
    status: 'valid' | 'expired' | 'expiring_soon' | 'undetermined';
    isExpired: boolean;
    isExpiringSoon: boolean;
    daysRemaining: number | null;
    normalizedExpiryDate: string | null;
    notes: string;
}
export declare class DocumentValidityPolicy {
    static readonly TIMEZONE = "America/Lima";
    static readonly DEFAULT_EXPIRING_SOON_DAYS = 30;
    /**
     * Obtiene la fecha/hora actual normalizada en la zona horaria de Lima (UTC-5).
     */
    static getNowLima(referenceDate?: Date): Date;
    /**
     * Convierte un string de fecha (YYYY-MM-DD o ISO) a la medianoche final del día (23:59:59.999) en hora de Lima.
     * Semántica: Un documento que vence el 19/08/2026 sigue vigente durante todo el 19 de agosto.
     */
    static parseEndOfDayLima(dateInput?: string | Date | null): Date | null;
    /**
     * Evalúa de forma estricta y auditable la vigencia de un documento o carnet regulatorio.
     */
    static evaluateValidity(expiresAtInput?: string | Date | null, options?: {
        referenceDate?: Date;
        thresholdDays?: number;
        documentName?: string;
    }): ValidityEvaluationResult;
}
//# sourceMappingURL=document-validity.policy.d.ts.map