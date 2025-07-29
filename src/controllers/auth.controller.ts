import { Request, Response } from 'express';
import { loginService } from '../services/auth.service';

export const login = async (
    req: Request,
    res: Response
): Promise<Response> => {
    const { id, password } = req.body;
    if (!id || !password) {
        return res.status(400).json({ message: 'ID and password are required.' });
    }
    try {
        const result = await loginService(id, password);
        return res.status(200).json(result);
    } catch (err: any) {
        if (err.message === 'Invalid credentials') {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }
        console.error('Login error:', err);
        return res.status(500).json({ message: 'Server error.' });
    }
};