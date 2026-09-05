import { Request, Response } from 'express';
import { Quotation } from '../models/Quotation';
import { Invoice } from '../models/Invoice';
import { Subscription } from '../models/Subscription';
import { Approval } from '../models/Approval';
import { Fulfillment } from '../models/Fulfillment';
import { Backorder } from '../models/Backorder';
import { Product } from '../models/Product';
import { Customer } from '../models/Customer';
import { AuthRequest } from '../middleware/authMiddleware';

export class ReportsController {
  public static async getDashboardStats(req: AuthRequest, res: Response): Promise<void> {
    try {
      const [
        totalQuotesCount,
        pendingApprovalsCount,
        approvedQuotesCount,
        totalInvoices,
        activeSubscriptions,
        openBackordersCount,
        recentQuotes,
      ] = await Promise.all([
        Quotation.countDocuments(),
        Approval.countDocuments({ status: 'PENDING' }),
        Quotation.countDocuments({ stage: { $in: ['APPROVED', 'READY_FOR_FULFILLMENT', 'FULFILLED', 'CLOSED'] } }),
        Invoice.find(),
        Subscription.find({ status: 'ACTIVE' }),
        Backorder.countDocuments({ status: { $in: ['OPEN', 'IN_REPLENISHMENT'] } }),
        Quotation.find().sort({ createdAt: -1 }).limit(5).populate('customerId salesRepId'),
      ]);

      const totalPipelineValue = await Quotation.aggregate([
        { $match: { stage: { $nin: ['REJECTED', 'CANCELLED'] } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' }, cost: { $sum: '$totalCost' }, margin: { $sum: '$grossMarginAmount' } } },
      ]);

      const invoiceRevenue = totalInvoices.reduce((acc, inv) => acc + inv.paidAmount, 0);
      const invoiceOutstanding = totalInvoices.reduce((acc, inv) => acc + inv.dueBalance, 0);
      const monthlyRecurringRevenue = activeSubscriptions.reduce((acc, sub) => acc + sub.totalRecurringAmount, 0);

      const pipelineTotal = totalPipelineValue[0]?.total || 0;
      const pipelineCost = totalPipelineValue[0]?.cost || 0;
      const pipelineMargin = totalPipelineValue[0]?.margin || 0;
      const overallMarginPct = pipelineTotal > 0 ? Math.round((pipelineMargin / pipelineTotal) * 10000) / 100 : 0;

      // Stage breakdown
      const stageBreakdown = await Quotation.aggregate([
        { $group: { _id: '$stage', count: { $sum: 1 }, totalValue: { $sum: '$totalAmount' } } },
      ]);

      res.json({
        success: true,
        data: {
          kpi: {
            totalPipelineValue: Math.round(pipelineTotal),
            overallGrossMarginPct: overallMarginPct,
            pendingApprovalsCount,
            totalQuotesCount,
            approvedQuotesCount,
            invoiceRevenue: Math.round(invoiceRevenue),
            invoiceOutstanding: Math.round(invoiceOutstanding),
            monthlyRecurringRevenue: Math.round(monthlyRecurringRevenue),
            openBackordersCount,
          },
          stageBreakdown,
          recentQuotes,
        },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async getSalesReport(req: AuthRequest, res: Response): Promise<void> {
    try {
      const quotations = await Quotation.find()
        .populate('customerId', 'name tier companyName')
        .populate('salesRepId', 'name email')
        .sort({ createdAt: -1 });

      res.json({ success: true, count: quotations.length, data: quotations });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async getApprovalsReport(req: AuthRequest, res: Response): Promise<void> {
    try {
      const approvals = await Approval.find()
        .populate('quotationId')
        .populate('customerId', 'name companyName tier')
        .populate('salesRepId', 'name email')
        .sort({ requestedAt: -1 });

      res.json({ success: true, count: approvals.length, data: approvals });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async getFulfillmentReport(req: AuthRequest, res: Response): Promise<void> {
    try {
      const fulfillments = await Fulfillment.find()
        .populate('quotationId')
        .populate('customerId', 'name companyName')
        .sort({ createdAt: -1 });

      const backorders = await Backorder.find()
        .populate('quotationId')
        .populate('customerId')
        .populate('productId')
        .sort({ createdAt: -1 });

      res.json({ success: true, data: { fulfillments, backorders } });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async getBillingReport(req: AuthRequest, res: Response): Promise<void> {
    try {
      const invoices = await Invoice.find().populate('customerId quotationId').sort({ createdAt: -1 });
      const subscriptions = await Subscription.find().populate('customerId quotationId').sort({ createdAt: -1 });

      res.json({ success: true, data: { invoices, subscriptions } });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}
