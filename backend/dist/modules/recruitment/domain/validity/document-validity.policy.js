"use strict";
/**
 * ═══════════════════════════════════════════════════════════════════════════
 * POLÍTICA CENTRALIZADA DE VIGENCIA DOCUMENTAL (DocumentValidityPolicy)
 * Security Force P&V S.A.C.
 * Timezone Oficial: America/Lima (UTC-5)
 * ═══════════════════════════════════════════════════════════════════════════
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentValidityPolicy = void 0;
class DocumentValidityPolicy {
    /**
     * Obtiene la fecha/hora actual normalizada en la zona horaria de Lima (UTC-5).
     */
    static getNowLima(referenceDate) {
        const d = referenceDate || new Date();
        return new Date(d.toLocaleString('en-US', { timeZone: this.TIMEZONE }));
    }
    /**
     * Convierte un string de fecha (YYYY-MM-DD o ISO) a la medianoche final del día (23:59:59.999) en hora de Lima.
     * Semántica: Un documento que vence el 19/08/2026 sigue vigente durante todo el 19 de agosto.
     */
    static parseEndOfDayLima(dateInput) {
        if (!dateInput)
            return null;
        let dateStr;
        if (dateInput instanceof Date) {
            if (isNaN(dateInput.getTime()))
                return null;
            dateStr = dateInput.toISOString().slice(0, 10);
        }
        else {
            const clean = dateInput.trim();
            if (!clean)
                return null;
            // Extraer componentes YYYY-MM-DD
            const match = clean.match(/^(\d{4})-(\d{2})-(\d{2})/);
            if (!match) {
                const parsed = new Date(clean);
                if (isNaN(parsed.getTime()))
                    return null;
                dateStr = parsed.toISOString().slice(0, 10);
            }
            else {
                dateStr = `${match[1]}-${match[2]}-${match[3]}`;
            }
        }
        const [year, month, day] = dateStr.split('-').map(Number);
        // Crear fecha a las 23:59:59.999
        const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999);
        return isNaN(endOfDay.getTime()) ? null : endOfDay;
    }
    /**
     * Evalúa de forma estricta y auditable la vigencia de un documento o carnet regulatorio.
     */
    static evaluateValidity(expiresAtInput, options) {
        const docName = options?.documentName || 'Documento';
        const thresholdDays = options?.thresholdDays ?? this.DEFAULT_EXPIRING_SOON_DAYS;
        const nowLima = this.getNowLima(options?.referenceDate);
        if (!expiresAtInput) {
            return {
                status: 'undetermined',
                isExpired: false,
                isExpiringSoon: false,
                daysRemaining: null,
                normalizedExpiryDate: null,
                notes: `${docName} sin fecha de vencimiento especificada (vigencia indeterminada).`,
            };
        }
        const endOfExpiryDay = this.parseEndOfDayLima(expiresAtInput);
        if (!endOfExpiryDay) {
            return {
                status: 'undetermined',
                isExpired: false,
                isExpiringSoon: false,
                daysRemaining: null,
                normalizedExpiryDate: null,
                notes: `${docName} con formato de fecha inválido.`,
            };
        }
        const normalizedExpiryDate = endOfExpiryDay.toISOString().slice(0, 10);
        const diffMs = endOfExpiryDay.getTime() - nowLima.getTime();
        const daysRemaining = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        // Si la fecha actual sobrepasa las 23:59:59 del día de vencimiento -> VENCIDO
        if (diffMs < 0) {
            const daysPassed = Math.abs(daysRemaining);
            return {
                status: 'expired',
                isExpired: true,
                isExpiringSoon: false,
                daysRemaining,
                normalizedExpiryDate,
                notes: `${docName} vencido el ${normalizedExpiryDate} (hace ${daysPassed === 0 ? 'menos de 24 horas' : `${daysPassed} día(s)`}).`,
            };
        }
        // Si le quedan thresholdDays o menos -> POR VENCER PRONTO
        if (daysRemaining <= thresholdDays) {
            return {
                status: 'expiring_soon',
                isExpired: false,
                isExpiringSoon: true,
                daysRemaining,
                normalizedExpiryDate,
                notes: `${docName} vigente hasta el ${normalizedExpiryDate} (vence pronto: quedan ${daysRemaining} día(s)).`,
            };
        }
        // VIGENTE
        return {
            status: 'valid',
            isExpired: false,
            isExpiringSoon: false,
            daysRemaining,
            normalizedExpiryDate,
            notes: `${docName} vigente hasta el ${normalizedExpiryDate} (${daysRemaining} días restantes).`,
        };
    }
}
exports.DocumentValidityPolicy = DocumentValidityPolicy;
DocumentValidityPolicy.TIMEZONE = 'America/Lima';
DocumentValidityPolicy.DEFAULT_EXPIRING_SOON_DAYS = 30;
//# sourceMappingURL=document-validity.policy.js.map