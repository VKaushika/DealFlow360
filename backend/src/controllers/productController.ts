import { Request, Response } from 'express';
import { Product } from '../models/Product';
import { Category } from '../models/Category';
import { WarehouseStock } from '../models/WarehouseStock';
import { AuthRequest } from '../middleware/authMiddleware';

export class ProductController {
  public static async getAll(req: Request, res: Response): Promise<void> {
    try {
      const { search, category, type, billingType } = req.query;
      const query: any = { isActive: true };

      if (search) {
        query.$or = [
          { name: { $regex: String(search), $options: 'i' } },
          { sku: { $regex: String(search), $options: 'i' } },
          { description: { $regex: String(search), $options: 'i' } },
        ];
      }
      if (category) query.categoryId = category;
      if (type) query.type = type;
      if (billingType) query.billingType = billingType;

      const products = await Product.find(query).populate('categoryId').sort({ name: 1 });

      // Fetch stock availability for each product
      const enrichedProducts = await Promise.all(
        products.map(async (p) => {
          const stocks = await WarehouseStock.find({ productId: p._id }).populate('warehouseId');
          const totalOnHand = stocks.reduce((sum, s) => sum + s.quantityOnHand, 0);
          const totalAvailable = stocks.reduce((sum, s) => sum + s.quantityAvailable, 0);
          const marginAmount = p.unitPrice - p.unitCost;
          const marginPct = p.unitPrice > 0 ? Math.round((marginAmount / p.unitPrice) * 100) : 0;

          return {
            ...p.toObject(),
            totalOnHand,
            totalAvailable,
            marginAmount,
            marginPct,
            stockByWarehouse: stocks.map((s) => ({
              warehouseId: (s.warehouseId as any)?._id,
              warehouseName: (s.warehouseId as any)?.name || 'Warehouse',
              quantityOnHand: s.quantityOnHand,
              quantityAvailable: s.quantityAvailable,
            })),
          };
        })
      );

      res.json({ success: true, count: enrichedProducts.length, data: enrichedProducts });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async getById(req: Request, res: Response): Promise<void> {
    try {
      const product = await Product.findById(req.params.id).populate('categoryId');
      if (!product) {
        res.status(404).json({ success: false, message: 'Product not found' });
        return;
      }
      const stocks = await WarehouseStock.find({ productId: product._id }).populate('warehouseId');
      res.json({
        success: true,
        data: {
          ...product.toObject(),
          stockByWarehouse: stocks,
        },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      const product = await Product.create(req.body);
      res.status(201).json({ success: true, data: product });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async update(req: AuthRequest, res: Response): Promise<void> {
    try {
      const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
      if (!product) {
        res.status(404).json({ success: false, message: 'Product not found' });
        return;
      }
      res.json({ success: true, data: product });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async getCategories(req: Request, res: Response): Promise<void> {
    try {
      const categories = await Category.find({ isActive: true }).sort({ name: 1 });
      res.json({ success: true, data: categories });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}
