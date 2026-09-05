import { Router } from 'express';
import { AuditController } from '../controllers/auditController';
import { authenticateJwt, requirePermission } from '../middleware/authMiddleware';
import { Permission } from '../middleware/rbacMiddleware';

const router = Router();

router.use(authenticateJwt);
router.get('/', requirePermission(Permission.AUDIT_VIEW), AuditController.getLogs);

export default router;
