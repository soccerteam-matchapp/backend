import { Router } from 'express';
import { login, refresh } from '../controllers/auth.controller';

const router = Router();

// POST /api/auth/login
router.post('/login', login);

// POST /api/auth/refresh
router.post('/refresh', refresh);

export default router;
