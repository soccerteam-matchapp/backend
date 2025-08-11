import express from 'express';
import { register } from '../controllers/register.controller';
import { validateRegister } from '../middlewares/register.middleware';

const router = express.Router();


// POST /api/auth/register  — 회원가입 라우트
router.post('/register', validateRegister, register);
console.log('라우터에서 register 진입'); // 이게 뜨는지 확인


export default router;
