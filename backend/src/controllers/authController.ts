import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User, IUser, UserRole } from '../models/User';
import { Customer } from '../models/Customer';
import { AuthRequest } from '../middleware/authMiddleware';
import { Permission, requirePermission } from '../middleware/rbacMiddleware';
import { createAuditLog } from '../services/auditService';

const JWT_SECRET = process.env.JWT_SECRET || 'dealflow360_super_secret_jwt_key_2026_hackathon';

export class AuthController {
  public static async register(req: Request, res: Response): Promise<void> {
    try {
      const { name, email, password, role, department } = req.body;
      if (!name || !email || !password) {
        res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
        return;
      }

      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        res.status(409).json({ success: false, message: 'User with this email already exists.' });
        return;
      }

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      const user = await User.create({
        name,
        email: email.toLowerCase(),
        passwordHash,
        role: role || 'SALES_REP',
        department: department || 'Sales',
      });

      await createAuditLog({
        actorId: user._id.toString(),
        actorName: user.name,
        actorRole: user.role,
        action: 'USER_REGISTERED',
        entityType: 'USER',
        entityId: user._id.toString(),
        afterState: { email: user.email, role: user.role, name: user.name },
        notes: 'New user registered via self-service signup.',
      });

      const token = jwt.sign(
        { id: user._id, email: user.email, role: user.role, name: user.name },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.status(201).json({
        success: true,
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department,
        },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        res.status(400).json({ success: false, message: 'Email and password are required.' });
        return;
      }

      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        await createAuditLog({
          actorId: 'anonymous',
          actorName: 'Anonymous',
          actorRole: 'UNKNOWN',
          action: 'LOGIN_FAILED',
          entityType: 'USER',
          entityId: 'unknown',
          notes: `Failed login attempt for email: ${email.toLowerCase()}`,
        });
        res.status(401).json({ success: false, message: 'Invalid credentials.' });
        return;
      }

      if (!user.isActive) {
        res.status(403).json({ success: false, message: 'Account is deactivated. Contact administrator.' });
        return;
      }

      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        await createAuditLog({
          actorId: user._id.toString(),
          actorName: user.name,
          actorRole: user.role,
          action: 'LOGIN_FAILED',
          entityType: 'USER',
          entityId: user._id.toString(),
          notes: 'Failed login attempt - invalid password.',
        });
        res.status(401).json({ success: false, message: 'Invalid credentials.' });
        return;
      }

      const token = jwt.sign(
        {
          id: user._id,
          email: user.email,
          role: user.role,
          name: user.name,
          customerId: user.customerId,
        },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      await createAuditLog({
        actorId: user._id.toString(),
        actorName: user.name,
        actorRole: user.role,
        action: 'LOGIN_SUCCESS',
        entityType: 'USER',
        entityId: user._id.toString(),
        notes: 'User logged in successfully.',
      });

      res.json({
        success: true,
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department,
          customerId: user.customerId,
        },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async getMe(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const user = await User.findById(req.user.id).select('-passwordHash').populate('customerId');
      res.json({ success: true, user });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async logout(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (req.user) {
        await createAuditLog({
          actorId: req.user.id,
          actorName: req.user.name,
          actorRole: req.user.role,
          action: 'LOGOUT',
          entityType: 'USER',
          entityId: req.user.id,
          notes: 'User logged out.',
        });
      }
      res.json({ success: true, message: 'Logged out successfully.' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async forgotPassword(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;
      if (!email) {
        res.status(400).json({ success: false, message: 'Email is required.' });
        return;
      }

      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        res.status(404).json({ success: false, message: 'No account found with that email.' });
        return;
      }

      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetExpires = new Date(Date.now() + 3600000);

      user.passwordResetToken = resetToken;
      user.passwordResetExpires = resetExpires;
      await user.save();

      await createAuditLog({
        actorId: user._id.toString(),
        actorName: user.name,
        actorRole: user.role,
        action: 'PASSWORD_RESET_REQUESTED',
        entityType: 'USER',
        entityId: user._id.toString(),
        notes: 'Password reset requested.',
      });

      res.json({
        success: true,
        message: 'Password reset token generated. In production, this would be emailed.',
        resetToken,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const { token, newPassword } = req.body;
      if (!token || !newPassword) {
        res.status(400).json({ success: false, message: 'Token and new password are required.' });
        return;
      }

      const user = await User.findOne({
        passwordResetToken: token,
        passwordResetExpires: { $gt: new Date() },
      });

      if (!user) {
        res.status(400).json({ success: false, message: 'Invalid or expired reset token.' });
        return;
      }

      const salt = await bcrypt.genSalt(10);
      user.passwordHash = await bcrypt.hash(newPassword, salt);
      user.passwordResetToken = '';
      user.passwordResetExpires = null;
      await user.save();

      await createAuditLog({
        actorId: user._id.toString(),
        actorName: user.name,
        actorRole: user.role,
        action: 'PASSWORD_RESET_COMPLETED',
        entityType: 'USER',
        entityId: user._id.toString(),
        notes: 'Password successfully reset.',
      });

      res.json({ success: true, message: 'Password reset successful.' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async updateProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { name, email, department } = req.body;
      const user = await User.findById(req.user.id);
      if (!user) {
        res.status(404).json({ success: false, message: 'User not found.' });
        return;
      }

      if (name) user.name = name;
      if (email) user.email = email.toLowerCase();
      if (department) user.department = department;

      await user.save();

      res.json({
        success: true,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department,
          customerId: user.customerId,
        },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async changePassword(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        res.status(400).json({ success: false, message: 'Current password and new password are required.' });
        return;
      }

      const user = await User.findById(req.user.id);
      if (!user) {
        res.status(404).json({ success: false, message: 'User not found.' });
        return;
      }

      const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isMatch) {
        res.status(401).json({ success: false, message: 'Current password is incorrect.' });
        return;
      }

      const salt = await bcrypt.genSalt(10);
      user.passwordHash = await bcrypt.hash(newPassword, salt);
      await user.save();

      await createAuditLog({
        actorId: user._id.toString(),
        actorName: user.name,
        actorRole: user.role,
        action: 'PASSWORD_CHANGED',
        entityType: 'USER',
        entityId: user._id.toString(),
        notes: 'User changed their password.',
      });

      res.json({ success: true, message: 'Password changed successfully.' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async getPermissions(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { Permission, rolePermissions } = require('../middleware/rbacMiddleware');
      const permissions = rolePermissions[req.user.role] || [];

      res.json({
        success: true,
        role: req.user.role,
        permissions: permissions.map((p: Permission) => ({ key: p, label: p.replace(/_/g, ' ').toUpperCase() })),
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async listUsers(req: AuthRequest, res: Response): Promise<void> {
    try {
      const users = await User.find({}, '-passwordHash').sort({ createdAt: -1 });
      res.json({ success: true, data: users });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async updateUserRole(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { userId, role } = req.body;
      if (!userId || !role) {
        res.status(400).json({ success: false, message: 'User ID and role are required.' });
        return;
      }

      const validRoles: UserRole[] = ['ADMIN', 'SALES_REP', 'SALES_MANAGER', 'FINANCE_OPS', 'CUSTOMER'];
      if (!validRoles.includes(role)) {
        res.status(400).json({ success: false, message: 'Invalid role.' });
        return;
      }

      const user = await User.findById(userId);
      if (!user) {
        res.status(404).json({ success: false, message: 'User not found.' });
        return;
      }

      user.role = role;
      await user.save();

      await createAuditLog({
        actorId: req.user!.id,
        actorName: req.user!.name,
        actorRole: req.user!.role,
        action: 'USER_ROLE_UPDATED',
        entityType: 'USER',
        entityId: userId,
        afterState: { role },
        notes: `Updated user ${user.name} role to ${role}.`,
      });

      res.json({
        success: true,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department,
        },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async deactivateUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { userId } = req.body;
      if (!userId) {
        res.status(400).json({ success: false, message: 'User ID is required.' });
        return;
      }

      const user = await User.findById(userId);
      if (!user) {
        res.status(404).json({ success: false, message: 'User not found.' });
        return;
      }

      if (user._id.toString() === req.user!.id) {
        res.status(400).json({ success: false, message: 'Cannot deactivate your own account.' });
        return;
      }

      user.isActive = false;
      await user.save();

      await createAuditLog({
        actorId: req.user!.id,
        actorName: req.user!.name,
        actorRole: req.user!.role,
        action: 'USER_DEACTIVATED',
        entityType: 'USER',
        entityId: userId,
        notes: `Deactivated user ${user.name}.`,
      });

      res.json({ success: true, message: `User ${user.name} deactivated.` });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async demoToken(req: Request, res: Response): Promise<void> {
    try {
      const { role, email } = req.query;
      const query: any = {};
      if (email) {
        query.email = String(email).toLowerCase();
      } else if (role) {
        query.role = String(role);
      } else {
        res.status(400).json({ success: false, message: 'Role or email is required' });
        return;
      }

      const user = await User.findOne(query);
      if (!user) {
        res.status(404).json({ success: false, message: `Demo user not found for query: ${JSON.stringify(query)}` });
        return;
      }

      const token = jwt.sign(
        {
          id: user._id,
          email: user.email,
          role: user.role,
          name: user.name,
          customerId: user.customerId,
        },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.json({
        success: true,
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department,
          customerId: user.customerId,
        },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}
