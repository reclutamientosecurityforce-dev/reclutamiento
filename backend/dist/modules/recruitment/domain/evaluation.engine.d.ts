/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * MOTOR INTELIGENTE DE PREFILTRO, EVALUACIÓN DOCUMENTAL Y RANKING
 * Security Force P&V S.A.C.
 *
 * Principios:
 * 1. Cero porcentajes inventados — Puntaje 100% explicable y auditable.
 * 2. 3 Fuentes separadas: Declarado vs Extraído vs Acreditado.
 * 3. Cálculo de experiencia laboral con fusión de intervalos (cero doble conteo).
 * 4. Detección de discrepancias con severidad (Low/Med/High) que disparan 'review'.
 * 5. Requisitos eliminatorios prioritarios: Un fallo eliminatorio excluye del ranking de aptos.
 * ═══════════════════════════════════════════════════════════════════════════════
 */
import { Candidate, JobOpening, Application, ApplicationDocument, OpeningRequirement, ApplicationEvaluation, PrefilterStatus, PrefilterScoreBreakdown, DiscrepancyDetail, WorkExperience } from '../../../types';
export interface EvaluationInput {
    application: Application;
    candidate: Candidate;
    opening: JobOpening;
    requirements: OpeningRequirement[];
    documents: ApplicationDocument[];
}
export interface EvaluationOutput {
    prefilterStatus: PrefilterStatus;
    prefilterScore: number;
    expedienteScore: number;
    prefilterBreakdown: PrefilterScoreBreakdown;
    evaluations: Omit<ApplicationEvaluation, 'id' | 'created_at'>[];
    totalAccreditedMonths: number;
    totalDeclaredMonths: number;
    discrepanciesCount: number;
    discrepancies: DiscrepancyDetail[];
    snapshot: Record<string, any>;
    rejectionReason?: string;
}
export interface DateInterval {
    start: Date;
    end: Date;
    company: string;
    position: string;
    isAccredited?: boolean;
}
/**
 * Convierte un string de fecha (YYYY-MM, YYYY-MM-DD o 'Actual') a Date.
 */
export declare function parseExperienceDate(dateStr?: string, isEnd?: boolean): Date;
/**
 * Calcula la diferencia en meses entre dos fechas de forma precisa.
 */
export declare function diffMonths(d1: Date, d2: Date): number;
/**
 * Fusiona intervalos superpuestos para evitar duplicidad de meses laborados.
 */
export declare function mergeIntervals(intervals: {
    start: Date;
    end: Date;
}[]): {
    start: Date;
    end: Date;
}[];
/**
 * Calcula el total de meses laborados sin duplicidad.
 */
export declare function calculateNonOverlappingMonths(experiences: WorkExperience[], positionFilter?: RegExp): number;
/**
 * Calcula la edad exacta en años a partir de una fecha de nacimiento.
 */
export declare function calculateAge(birthDateStr?: string | Date): number;
export declare class EvaluationEngine {
    /**
     * Ejecuta el prefiltro completo sobre una postulación.
     */
    static evaluate(input: EvaluationInput): EvaluationOutput;
    /**
     * Evalúa la completitud, legibilidad y vigencia documental del expediente del candidato (0 a 100).
     */
    static calculateExpedienteScore(documents: ApplicationDocument[]): number;
    private static evaluateSingleRequirement;
}
//# sourceMappingURL=evaluation.engine.d.ts.map