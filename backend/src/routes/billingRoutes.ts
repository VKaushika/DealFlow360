import { Router } from 'express';
import { BillingController } from '../controllers/billingController';
import { authenticateJwt, requirePermission } from '../middleware/authMiddleware';
import { Permission } from '../middleware/rbacMiddleware';

const router = Router();

router.use(authenticateJwt);

router.get('/plans', requirePermission(Permission.BILLING_VIEW), BillingController.getPlans);
router.post('/generate', requirePermission(Permission.BILLING_GENERATE), BillingController.generate);
router.get('/invoices', requirePermission(Permission.BILLING_VIEW), BillingController.getInvoices);
router.get('/invoices/:id', requirePermission(Permission.BILLING_VIEW), BillingController.getInvoiceById);
router.post('/invoices/:id/payment', requirePermission(Permission.PAYMENT_RECORD), BillingController.recordPayment);
router.get('/subscriptions', requirePermission(Permission.SUBSCRIPTION_VIEW), BillingController.getSubscriptions);
router.post('/subscriptions/:id/modify', requirePermission(Permission.SUBSCRIPTION_MODIFY), BillingController.modifySubscription);

export default router;
