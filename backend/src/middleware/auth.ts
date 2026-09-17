import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import db from '../db';
import { AuthUser } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || '';

if (!JWT_SECRET) {
  console.error('❌ JWT_SECRET no está configurado en las variables de entorno.');
  process.exit(1);
}

interface JwtPayload {
  userId: string;
  companyId: string;
  role: string;
  sessionId: string;
}

/**
 * Middleware de autenticación JWT.
 * Verifica el token, valida la sesión en PostgreSQL y adjunta req.user.
 */
export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Token de autenticación requerido.' });
      return;
    }

    const token = authHeader.substring(7);
    let payload: JwtPayload;

    try {
      payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
    } catch {
      res.status(401).json({ error: 'Token inválido o expirado.' });
      return;
    }

    // Verificar sesión activa en PostgreSQL
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const { rows } = await db.query<{
      id: string; is_active: boolean; expires_at: string;
    }>(
      `SELECT id, is_active, expires_at FROM sessions
       WHERE token_hash = $1 AND user_id = $2 AND company_id = $3`,
      [tokenHash, payload.userId, payload.companyId]
    );

    if (rows.length === 0 || !rows[0].is_active) {
      res.status(401).json({ error: 'Sesión inactiva o no encontrada.' });
      return;
    }

    if (new Date(rows[0].expires_at) < new Date()) {
      res.status(401).json({ error: 'Sesión expirada.' });
      return;
    }

    // Actualizar last_seen_at
    await db.query(
      'UPDATE sessions SET last_seen_at = NOW() WHERE id = $1',
      [rows[0].id]
    );

    // Obtener datos actualizados del usuario
    const userResult = await db.query<{
      id: string; company_id: string; username: string; email: string;
      role: string; full_name: string; is_active: boolean;
    }>(
      `SELECT id, company_id, username, email, role, full_name, is_active
       FROM users WHERE id = $1 AND company_id = $2`,
      [payload.userId, payload.companyId]
    );

    if (userResult.rows.length === 0 || !userResult.rows[0].is_active) {
      res.status(401).json({ error: 'Usuario inactivo o no encontrado.' });
      return;
    }

    const user = userResult.rows[0];
    req.user = {
      id: user.id,
      companyId: user.company_id,
      username: user.username,
      email: user.email,
      role: user.role as 'admin' | 'user',
      fullName: user.full_name,
      sessionId: rows[0].id,
    } as AuthUser;

    next();
  } catch (err) {
    console.error('Error en authenticate:', err);
    res.status(500).json({ error: 'Error interno de autenticación.' });
  }
}

/**
 * Middleware RBAC — requiere rol de administrador.
 */
export function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({ error: 'Acceso denegado. Se requiere rol de administrador.' });
    return;
  }
  next();
}

/**
 * Middleware RBAC — requiere usuario autenticado (cualquier rol).
 */
export function requireUser(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    res.status(401).json({ error: 'Autenticación requerida.' });
    return;
  }
  next();
}
