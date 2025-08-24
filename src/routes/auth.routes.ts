// src/routes/auth.routes.ts
import { Router } from 'express';
import { register, login, refresh } from '../controllers/auth.controller';
import { asyncHandler, validateRegister } from '../middlewares/auth';

const router = Router();
router.post('/register', validateRegister, asyncHandler(register));
router.post('/login', asyncHandler(login));
router.post('/refresh', asyncHandler(refresh));
export default router;
