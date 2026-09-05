import { Router } from 'express';
import { DealHealthController } from '../controllers/dealHealthController';
import { authenticateJwt, requirePermission } from '../middleware/authMiddleware';
import { Permission } from '../middleware/rbacMiddleware';

const router = Router();

router.use(authenticateJwt);

router.get('/', requirePermission(Permission.DEAL_HEALTH_VIEW), DealHealthController.getHealthOverview);
router.post('/resolve/:id', requirePermission(Permission.DEAL_HEALTH_RESOLVE), DealHealthController.resolveEvent);
router.post('/nudge', requirePermission(Permission.DEAL_HEALTH_RESOLVE), DealHealthController.triggerNudge);

export default router;
