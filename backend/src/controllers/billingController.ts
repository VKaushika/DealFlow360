import { Request, Response } from 'express';
import { Invoice } from '../models/Invoice';
import { Subscription } from '../models/Subscription';
import { Payment } from '../models/Payment';
import { SubscriptionPlan } from '../models/SubscriptionPlan';
import { BillingService } from '../services/billingService';
import { AuthRequest } from '../middleware/authMiddleware';
import { Quotation } from '../models/Quotation';

export class BillingController {
  public static async generate(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { quotationId } = req.body;
      const requestedQuotationId = quotationId || req.params.quotationId;

      if (req.user?.role === 'CUSTOMER') {
        const quotation = await Quotation.findById(requestedQuotationId);
        if (!quotation || quotation.customerId.toString() !== req.user.customerId) {
          res.status(403).json({ success: false, message: 'Forbidden: You cannot generate billing for this quotation.' });
          return;
        }

        if (!quotation.isCustomerConfirmed || quotation.stage !== 'READY_FOR_FULFILLMENT') {
          res.status(400).json({ success: false, message: 'Confirm the quotation before generating a bill.' });
          return;
        }
      }

      const result = await BillingService.generateBillingForQuotation(
        requestedQuotationId,
        req.user?.id,
        req.user?.name
      );

      res.status(201).json({
        success: true,
        message: 'Hybrid billing invoices and subscriptions generated successfully',
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  public static async getInvoices(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { customerId, status, type } = req.query;
      const query: any = {};

      if (req.user?.role === 'CUSTOMER') {
        query.customerId = req.user.customerId;
      } else if (customerId) {
        query.customerId = customerId;
      }

      if (status) query.status = status;
      if (type) query.type = type;

      const invoices = await Invoice.find(query)
        .populate('customerId', 'name companyName email tier')
        .populate('quotationId', 'quoteNumber stage')
        .sort({ createdAt: -1 });

      res.json({ success: true, count: invoices.length, data: invoices });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async getInvoiceById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const invoice = await Invoice.findById(req.params.id)
        .populate('customerId')
        .populate('quotationId');

      if (!invoice) {
        res.status(404).json({ success: false, message: 'Invoice not found' });
        return;
      }

      if (req.user?.role === 'CUSTOMER' && invoice.customerId._id.toString() !== req.user.customerId) {
        res.status(403).json({ success: false, message: 'Forbidden: Access denied to this invoice.' });
        return;
      }

      const payments = await Payment.find({ invoiceId: invoice._id }).sort({ paidAt: -1 });

      res.json({ success: true, data: { ...invoice.toObject(), payments } });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async recordPayment(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { amount, paymentMethod, referenceNumber, notes } = req.body;
      const result = await BillingService.recordPayment(
        req.params.id,
        Number(amount),
        paymentMethod,
        referenceNumber,
        req.user?.id,
        req.user?.name
      );

      res.json({
        success: true,
        message: 'Payment recorded and invoice balance updated successfully',
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  public static async getSubscriptions(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { customerId, status } = req.query;
      const query: any = {};

      if (req.user?.role === 'CUSTOMER') {
        query.customerId = req.user.customerId;
      } else if (customerId) {
        query.customerId = customerId;
      }

      if (status) query.status = status;

      const subscriptions = await Subscription.find(query)
        .populate('customerId', 'name companyName email')
        .populate('quotationId', 'quoteNumber')
        .populate('planId')
        .sort({ createdAt: -1 });

      res.json({ success: true, count: subscriptions.length, data: subscriptions });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async modifySubscription(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { newUnitPrice, newQuantity, notes } = req.body;
      const subscription = await BillingService.modifySubscription(
        req.params.id,
        Number(newUnitPrice),
        Number(newQuantity),
        notes,
        req.user?.id,
        req.user?.name
      );

      res.json({
        success: true,
        message: 'Subscription updated and proration calculated successfully',
        data: subscription,
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  public static async getPlans(req: Request, res: Response): Promise<void> {
    try {
      const plans = await SubscriptionPlan.find({ isActive: true });
      res.json({ success: true, data: plans });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}
