import { Router } from 'express';
import { CustomerController } from '../controllers/customerController';
import { authenticateJwt, requirePermission } from '../middleware/authMiddleware';
import { Permission } from '../middleware/rbacMiddleware';

const router = Router();

router.use(authenticateJwt);

router.get('/', requirePermission(Permission.CUSTOMER_VIEW), CustomerController.getAll);
router.get('/:id', requirePermission(Permission.CUSTOMER_VIEW), CustomerController.getById);
router.post('/', requirePermission(Permission.CUSTOMER_CREATE), CustomerController.create);
router.put('/:id', requirePermission(Permission.CUSTOMER_UPDATE), CustomerController.update);
router.delete('/:id', requirePermission(Permission.USER_MANAGE), CustomerController.delete);

export default router;
