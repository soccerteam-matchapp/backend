// src/routes/phone.routes.ts
import { Router } from 'express';
import { requestCode, verifyCode } from '../controllers/phone.controller';
const router = Router();
router.post('/request', requestCode);
router.post('/verify', verifyCode);
export default router;
