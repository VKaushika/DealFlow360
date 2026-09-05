import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { authenticateJwt, requirePermission } from '../middleware/authMiddleware';
import { Permission } from '../middleware/rbacMiddleware';

const router = Router();

router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/logout', authenticateJwt, AuthController.logout);

router.get('/demo-token', AuthController.demoToken);
router.get('/me', authenticateJwt, AuthController.getMe);
router.get('/permissions', authenticateJwt, AuthController.getPermissions);

router.post('/forgot-password', AuthController.forgotPassword);
router.post('/reset-password', AuthController.resetPassword);
router.put('/profile', authenticateJwt, AuthController.updateProfile);
router.put('/change-password', authenticateJwt, AuthController.changePassword);

router.get('/users', authenticateJwt, requirePermission(Permission.USER_MANAGE), AuthController.listUsers);
router.put('/users/:userId/role', authenticateJwt, requirePermission(Permission.USER_MANAGE), AuthController.updateUserRole);
router.put('/users/:userId/deactivate', authenticateJwt, requirePermission(Permission.USER_MANAGE), AuthController.deactivateUser);

export default router;
