import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { AppError, asyncHandler } from '../utils/errors.js';
export const authenticate = asyncHandler(async (req, _res, next) => { const token = req.cookies?.accessToken || req.headers.authorization?.replace('Bearer ', ''); if (!token)
    throw new AppError(401, 'Authentication required'); const payload = jwt.verify(token, env.JWT_ACCESS_SECRET); const user = await User.findById(payload.sub); if (!user || user.status !== 'active')
    throw new AppError(401, 'Session is no longer valid'); req.user = user; next(); });
export const allow = (...roles) => (req, _res, next) => { if (!req.user || (!roles.includes(req.user.role) && req.user.role !== 'owner'))
    return next(new AppError(403, 'You do not have permission for this action')); next(); };
//# sourceMappingURL=auth.js.map