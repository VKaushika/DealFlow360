import { Router } from 'express';
import { ProductController } from '../controllers/productController';
import { authenticateJwt, requirePermission } from '../middleware/authMiddleware';
import { Permission } from '../middleware/rbacMiddleware';

const router = Router();

router.get('/', ProductController.getAll);
router.get('/categories', ProductController.getCategories);
router.get('/:id', ProductController.getById);
router.post('/', authenticateJwt, requirePermission(Permission.PRODUCT_CREATE), ProductController.create);
router.put('/:id', authenticateJwt, requirePermission(Permission.PRODUCT_UPDATE), ProductController.update);

export default router;
