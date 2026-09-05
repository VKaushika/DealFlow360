import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, IUser, UserRole } from '../models/User';
import { Permission, requirePermission } from './rbacMiddleware';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
    name: string;
    customerId?: string;
  };
}

const JWT_SECRET = process.env.JWT_SECRET || 'dealflow360_super_secret_jwt_key_2026_hackathon';

export const authenticateJwt = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ success: false, message: 'Authentication required. Please provide a valid Bearer token.' });
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
      res.status(401).json({ success: false, message: 'User not found or account deactivated.' });
      return;
    }

    req.user = {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      name: user.name,
      customerId: user.customerId?.toString(),
    };

    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
};

export const requireRoles = (allowedRoles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized. User not authenticated.' });
      return;
    }

    if (!allowedRoles.includes(req.user.role) && req.user.role !== 'ADMIN') {
      res.status(403).json({
        success: false,
        message: `Forbidden. Role ${req.user.role} does not have permission for this resource. Required: [${allowedRoles.join(', ')}]`,
      });
      return;
    }

    next();
  };
};

export const enforceCustomerIsolation = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (req.user?.role === 'CUSTOMER') {
    if (!req.user.customerId) {
      res.status(403).json({ success: false, message: 'Customer account has no associated customer entity.' });
      return;
    }
  }
  next();
};

export { requirePermission };
