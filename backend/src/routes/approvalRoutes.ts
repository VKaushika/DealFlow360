import { Router } from 'express';
import { ApprovalController } from '../controllers/approvalController';
import { authenticateJwt, requirePermission } from '../middleware/authMiddleware';
import { Permission } from '../middleware/rbacMiddleware';

const router = Router();

router.use(authenticateJwt);

router.get('/', requirePermission(Permission.APPROVAL_VIEW), ApprovalController.getAll);
router.get('/:id', requirePermission(Permission.APPROVAL_VIEW), ApprovalController.getById);
router.post('/:id/approve', requirePermission(Permission.APPROVAL_APPROVE), ApprovalController.approve);
router.post('/:id/reject', requirePermission(Permission.APPROVAL_REJECT), ApprovalController.reject);
router.post('/:id/revision', requirePermission(Permission.APPROVAL_REQUEST_REVISION), ApprovalController.requestRevision);

export default router;
