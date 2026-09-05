import { Router } from 'express';
import { PortalController } from '../controllers/portalController';
import { authenticateJwt, requirePermission, enforceCustomerIsolation } from '../middleware/authMiddleware';
import { Permission } from '../middleware/rbacMiddleware';

const router = Router();

router.use(authenticateJwt);
router.use(enforceCustomerIsolation);

router.get('/quotations/:id', requirePermission(Permission.PORTAL_VIEW), PortalController.getCustomerQuotation);
router.post('/quotations/:id/counter-discount', requirePermission(Permission.PORTAL_COUNTER_DISCOUNT), PortalController.submitCounterDiscount);
router.post('/quotations/:id/confirm', requirePermission(Permission.PORTAL_CONFIRM), PortalController.confirmByCustomer);

export default router;
