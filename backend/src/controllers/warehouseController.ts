import { Request, Response } from 'express';
import { Warehouse } from '../models/Warehouse';
import { WarehouseStock } from '../models/WarehouseStock';
import { Product } from '../models/Product';
import { AuthRequest } from '../middleware/authMiddleware';

export class WarehouseController {
  public static async getAll(req: Request, res: Response): Promise<void> {
    try {
      const warehouses = await Warehouse.find({ isActive: true }).sort({ isDefault: -1, name: 1 });
      res.json({ success: true, count: warehouses.length, data: warehouses });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async getStockByWarehouse(req: Request, res: Response): Promise<void> {
    try {
      const stocks = await WarehouseStock.find({ warehouseId: req.params.id })
        .populate({
          path: 'productId',
          populate: { path: 'categoryId' },
        })
        .populate('warehouseId');

      res.json({ success: true, count: stocks.length, data: stocks });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async updateStock(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { warehouseId, productId, quantityOnHand, replenishmentThreshold } = req.body;
      let stock = await WarehouseStock.findOne({ warehouseId, productId });

      if (stock) {
        stock.quantityOnHand = quantityOnHand;
        stock.quantityAvailable = Math.max(0, quantityOnHand - stock.quantityReserved);
        if (replenishmentThreshold !== undefined) {
          stock.replenishmentThreshold = replenishmentThreshold;
        }
        stock.lastRestockedAt = new Date();
        await stock.save();
      } else {
        stock = await WarehouseStock.create({
          warehouseId,
          productId,
          quantityOnHand,
          quantityReserved: 0,
          quantityAvailable: quantityOnHand,
          replenishmentThreshold: replenishmentThreshold || 5,
          lastRestockedAt: new Date(),
        });
      }

      res.json({ success: true, data: stock });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async getAllStockSummary(req: Request, res: Response): Promise<void> {
    try {
      const stocks = await WarehouseStock.find()
        .populate('warehouseId', 'name code location')
        .populate('productId', 'name sku type unitPrice unitCost');

      res.json({ success: true, count: stocks.length, data: stocks });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}
