import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/user.model'
const JWT_SECRET = process.env.JWT_SECRET!;
const TOKEN_EXPIRES_IN = '1h';

export const login = async (req: Request, res: Response): Promise<Response> => {

    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ message: 'Username and password are required.' });
        }

        const user = await User.findOne({ username }).exec();
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        const payload = { id: user.id, username: user.username };
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRES_IN });

        return res.status(200).json({ token, user: { id: user.id, username: user.username, name: user.name } });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ message: 'Server error.' });
    }
};