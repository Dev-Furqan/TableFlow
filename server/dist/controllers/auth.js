import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { User } from '../models/User.js';
import { env } from '../config/env.js';
import { AppError, asyncHandler } from '../utils/errors.js';
const credentials = z.object({ email: z.string().email(), password: z.string().min(6) });
const access = (id) => jwt.sign({ sub: id }, env.JWT_ACCESS_SECRET, { expiresIn: `${env.ACCESS_TOKEN_MINUTES}m` });
const refresh = (id) => jwt.sign({ sub: id }, env.JWT_REFRESH_SECRET, { expiresIn: `${env.REFRESH_TOKEN_DAYS}d` });
const cookie = { httpOnly: true, sameSite: 'lax', secure: env.NODE_ENV === 'production' };
export const login = asyncHandler(async (req, res) => { const input = credentials.parse(req.body); const user = await User.findOne({ email: input.email }).select('+passwordHash +refreshTokenHash'); if (!user || !(await user.verifyPassword(input.password)))
    throw new AppError(401, 'Invalid email or password'); const refreshToken = refresh(user.id); user.refreshTokenHash = await bcrypt.hash(refreshToken, 10); await user.save(); res.cookie('accessToken', access(user.id), { ...cookie, maxAge: env.ACCESS_TOKEN_MINUTES * 60000 }).cookie('refreshToken', refreshToken, { ...cookie, maxAge: env.REFRESH_TOKEN_DAYS * 86400000 }).json({ user: { id: user.id, name: user.name, email: user.email, role: user.role, permissions: user.permissions } }); });
export const refreshToken = asyncHandler(async (req, res) => { const token = req.cookies?.refreshToken; if (!token)
    throw new AppError(401, 'Refresh token required'); const payload = jwt.verify(token, env.JWT_REFRESH_SECRET); const user = await User.findById(payload.sub).select('+refreshTokenHash'); if (!user || !user.refreshTokenHash || !(await bcrypt.compare(token, user.refreshTokenHash)))
    throw new AppError(401, 'Refresh token is invalid'); res.cookie('accessToken', access(user.id), { ...cookie, maxAge: env.ACCESS_TOKEN_MINUTES * 60000 }).json({ ok: true }); });
export const me = asyncHandler(async (req, res) => res.json({ user: { id: req.user.id, name: req.user.name, email: req.user.email, role: req.user.role, permissions: req.user.permissions } }));
export const logout = asyncHandler(async (req, res) => { if (req.user)
    await User.findByIdAndUpdate(req.user.id, { $unset: { refreshTokenHash: 1 } }); res.clearCookie('accessToken').clearCookie('refreshToken').status(204).end(); });
//# sourceMappingURL=auth.js.map