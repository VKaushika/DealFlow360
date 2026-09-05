import { Router } from 'express';
import { WarehouseController } from '../controllers/warehouseController';
import { authenticateJwt, requirePermission } from '../middleware/authMiddleware';
import { Permission } from '../middleware/rbacMiddleware';

const router = Router();

router.get('/', requirePermission(Permission.WAREHOUSE_VIEW), WarehouseController.getAll);
router.get('/stock/summary', requirePermission(Permission.WAREHOUSE_VIEW), WarehouseController.getAllStockSummary);
router.get('/:id/stock', requirePermission(Permission.WAREHOUSE_VIEW), WarehouseController.getStockByWarehouse);
router.post('/stock', authenticateJwt, requirePermission(Permission.WAREHOUSE_UPDATE), WarehouseController.updateStock);

export default router;
