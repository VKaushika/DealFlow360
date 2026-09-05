import { Router } from 'express';
import { QuotationController } from '../controllers/quotationController';
import { RecommendationController } from '../controllers/recommendationController';
import { authenticateJwt, requirePermission } from '../middleware/authMiddleware';
import { Permission } from '../middleware/rbacMiddleware';

const router = Router();

router.use(authenticateJwt);

router.get('/', requirePermission(Permission.QUOTATION_VIEW), QuotationController.getAll);
router.get('/:id', requirePermission(Permission.QUOTATION_VIEW), QuotationController.getById);
router.post('/evaluate-discount', requirePermission(Permission.QUOTATION_VIEW), QuotationController.evaluateDiscount);
router.post('/recommendations', requirePermission(Permission.QUOTATION_VIEW), RecommendationController.getRecommendations);
router.post('/', requirePermission(Permission.QUOTATION_CREATE), QuotationController.create);
router.put('/:id', requirePermission(Permission.QUOTATION_UPDATE), QuotationController.update);
router.post('/:id/submit', requirePermission(Permission.QUOTATION_SUBMIT), QuotationController.submit);
router.post('/:id/confirm', requirePermission(Permission.QUOTATION_CONFIRM), QuotationController.confirm);

export default router;
