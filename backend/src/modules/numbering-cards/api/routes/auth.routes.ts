import { Router } from 'express';
import { login, logout, me } from '../controllers/auth.controller';
import { authenticate } from '../../../../middleware/auth';

const router = Router();

// POST /api/auth/login
router.post('/login', login);

// POST /api/auth/logout  (requiere auth)
router.post('/logout', authenticate, logout);

// GET /api/auth/me  (requiere auth)
router.get('/me', authenticate, me);

export default router;
