import { Router } from 'express';
import { ReportsController } from '../controllers/reportsController';
import { authenticateJwt, requirePermission } from '../middleware/authMiddleware';
import { Permission } from '../middleware/rbacMiddleware';

const router = Router();

router.use(authenticateJwt);

router.get('/dashboard', requirePermission(Permission.REPORTS_VIEW), ReportsController.getDashboardStats);
router.get('/sales', requirePermission(Permission.REPORTS_VIEW), ReportsController.getSalesReport);
router.get('/approvals', requirePermission(Permission.REPORTS_VIEW), ReportsController.getApprovalsReport);
router.get('/fulfillment', requirePermission(Permission.REPORTS_VIEW), ReportsController.getFulfillmentReport);
router.get('/billing', requirePermission(Permission.REPORTS_VIEW), ReportsController.getBillingReport);

export default router;
