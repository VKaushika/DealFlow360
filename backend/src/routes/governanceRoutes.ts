import { Router } from 'express';
import { GovernanceController } from '../controllers/governanceController';
import { authenticateJwt, requirePermission } from '../middleware/authMiddleware';
import { Permission } from '../middleware/rbacMiddleware';

const router = Router();

router.use(authenticateJwt);

router.get('/tiers', requirePermission(Permission.GOVERNANCE_VIEW), GovernanceController.getTiers);
router.put('/tiers/:id', requirePermission(Permission.GOVERNANCE_MANAGE), GovernanceController.updateTier);

router.get('/discount-rules', requirePermission(Permission.GOVERNANCE_VIEW), GovernanceController.getDiscountRules);
router.post('/discount-rules', requirePermission(Permission.GOVERNANCE_MANAGE), GovernanceController.createDiscountRule);

router.get('/approval-rules', requirePermission(Permission.GOVERNANCE_VIEW), GovernanceController.getApprovalRules);
router.put('/approval-rules/:id', requirePermission(Permission.GOVERNANCE_MANAGE), GovernanceController.updateApprovalRule);

export default router;
