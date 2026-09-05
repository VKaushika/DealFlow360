import { Router } from 'express';
import { FulfillmentController } from '../controllers/fulfillmentController';
import { authenticateJwt, requirePermission } from '../middleware/authMiddleware';
import { Permission } from '../middleware/rbacMiddleware';

const router = Router();

router.use(authenticateJwt);

router.get('/', requirePermission(Permission.FULFILLMENT_VIEW), FulfillmentController.getAll);
router.get('/backorders', requirePermission(Permission.BACKORDER_VIEW), FulfillmentController.getBackorders);
router.get('/plan/:quotationId', requirePermission(Permission.FULFILLMENT_VIEW), FulfillmentController.getPlan);
router.get('/:id', requirePermission(Permission.FULFILLMENT_VIEW), FulfillmentController.getById);
router.post('/allocate', requirePermission(Permission.FULFILLMENT_ALLOCATE), FulfillmentController.allocate);
router.post('/backorders/:id/resolve', requirePermission(Permission.BACKORDER_RESOLVE), FulfillmentController.resolveBackorder);

export default router;
