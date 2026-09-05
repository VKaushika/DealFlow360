import { Request, Response } from 'express';
import { Fulfillment } from '../models/Fulfillment';
import { Backorder } from '../models/Backorder';
import { Quotation } from '../models/Quotation';
import { FulfillmentService } from '../services/fulfillmentService';
import { AuthRequest } from '../middleware/authMiddleware';

export class FulfillmentController {
  public static async getAll(req: AuthRequest, res: Response): Promise<void> {
    try {
      const fulfillments = await Fulfillment.find()
        .populate('quotationId')
        .populate('customerId', 'name companyName email tier')
        .sort({ createdAt: -1 });

      res.json({ success: true, count: fulfillments.length, data: fulfillments });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async getById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const fulfillment = await Fulfillment.findById(req.params.id)
        .populate('quotationId')
        .populate('customerId')
        .populate('allocatedBy', 'name email');

      if (!fulfillment) {
        res.status(404).json({ success: false, message: 'Fulfillment not found' });
        return;
      }
      res.json({ success: true, data: fulfillment });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async getPlan(req: AuthRequest, res: Response): Promise<void> {
    try {
      const plan = await FulfillmentService.calculateAllocationPlan(req.params.quotationId);
      res.json({ success: true, data: plan });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  public static async allocate(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { quotationId, overrideAllocations } = req.body;
      const result = await FulfillmentService.executeFulfillment(
        quotationId || req.params.id,
        overrideAllocations,
        req.user?.id,
        req.user?.name
      );

      res.status(201).json({
        success: true,
        message: 'Warehouse fulfillment allocation processed successfully',
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  public static async getBackorders(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { status } = req.query;
      const query: any = {};
      if (status) query.status = status;

      const backorders = await Backorder.find(query)
        .populate('quotationId', 'quoteNumber stage totalAmount')
        .populate('customerId', 'name companyName email')
        .populate('productId', 'name sku unitPrice')
        .sort({ createdAt: -1 });

      res.json({ success: true, count: backorders.length, data: backorders });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async resolveBackorder(req: AuthRequest, res: Response): Promise<void> {
    try {
      const backorder = await Backorder.findById(req.params.id);
      if (!backorder) {
        res.status(404).json({ success: false, message: 'Backorder not found' });
        return;
      }

      backorder.status = 'RESOLVED';
      backorder.quantityFulfilled = backorder.quantityBackordered;
      backorder.resolvedAt = new Date();
      await backorder.save();

      res.json({ success: true, message: 'Backorder marked as resolved', data: backorder });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}
