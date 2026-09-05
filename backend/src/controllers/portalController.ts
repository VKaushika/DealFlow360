import { Request, Response } from 'express';
import { Quotation } from '../models/Quotation';
import { Negotiation } from '../models/Negotiation';
import { Invoice } from '../models/Invoice';
import { Customer } from '../models/Customer';
import { DiscountService } from '../services/discountService';
import { ApprovalService } from '../services/approvalService';
import { AuditService } from '../services/auditService';
import { AuthRequest } from '../middleware/authMiddleware';
import mongoose from 'mongoose';

export class PortalController {
  // Get Customer's Own Quotation (Redacted internal margins & costs)
  public static async getCustomerQuotation(req: AuthRequest, res: Response): Promise<void> {
    try {
      const quotation = await Quotation.findById(req.params.id)
        .populate('customerId', 'name companyName email phone address tier')
        .populate('salesRepId', 'name email');

      if (!quotation) {
        res.status(404).json({ success: false, message: 'Quotation not found' });
        return;
      }

      // Check customer isolation if customer role
      if (req.user?.role === 'CUSTOMER') {
        const custId = quotation.customerId._id.toString();
        if (req.user.customerId && custId !== req.user.customerId) {
          res.status(403).json({ success: false, message: 'Unauthorized access to this quotation.' });
          return;
        }
      }

      const negotiation = await Negotiation.findOne({ quotationId: quotation._id });

      // Build customer-safe representation
      const safeData = {
        _id: quotation._id,
        quoteNumber: quotation.quoteNumber,
        title: quotation.title,
        customer: quotation.customerId,
        salesRep: quotation.salesRepId,
        stage: quotation.stage,
        subtotal: quotation.subtotal,
        discountAmount: quotation.discountAmount,
        taxableAmount: quotation.taxableAmount,
        taxAmount: quotation.taxAmount,
        totalAmount: quotation.totalAmount,
        customerNotes: quotation.customerNotes,
        validUntil: quotation.validUntil,
        isCustomerConfirmed: quotation.isCustomerConfirmed,
        items: quotation.items.map((i) => ({
          _id: i._id,
          productId: i.productId,
          productName: i.productName,
          sku: i.sku,
          type: i.type,
          billingType: i.billingType,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          discountPct: i.discountPct,
          discountAmount: i.discountAmount,
          taxRate: i.taxRate,
          lineTotal: i.lineTotal,
        })),
        negotiation: negotiation || null,
      };

      res.json({ success: true, data: safeData });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Customer submits a counter discount or comments
  public static async submitCounterDiscount(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { proposedDiscountPct, message, itemComments } = req.body;
      const quotation = await Quotation.findById(req.params.id);
      if (!quotation) {
        res.status(404).json({ success: false, message: 'Quotation not found' });
        return;
      }

      const counterDiscount = Math.max(0, Math.min(100, Number(proposedDiscountPct) || 0));

      // 1. Record or update Negotiation
      let negotiation = await Negotiation.findOne({ quotationId: quotation._id });
      if (!negotiation) {
        negotiation = new Negotiation({
          quotationId: quotation._id,
          customerId: quotation.customerId,
          status: 'COUNTER_PROPOSED',
          initialDiscountPct: quotation.items[0]?.discountPct || 0,
          latestProposedDiscountPct: counterDiscount,
          messages: [],
        });
      }

      negotiation.status = 'COUNTER_PROPOSED';
      negotiation.latestProposedDiscountPct = counterDiscount;
      negotiation.messages.push({
        senderId: req.user?.id ? new mongoose.Types.ObjectId(req.user.id) : undefined,
        senderName: req.user?.name || 'Customer',
        senderRole: 'CUSTOMER',
        proposedDiscountPct: counterDiscount,
        itemComments: itemComments || [],
        message: message || `Customer proposed ${counterDiscount}% discount counter-offer.`,
        timestamp: new Date(),
      });
      await negotiation.save();

      // 2. Re-evaluate quotation lines with the counter discount applied
      const updatedItems = quotation.items.map((i) => ({
        productId: i.productId.toString(),
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        discountPct: counterDiscount, // apply proposed discount across items or specific line
      }));

      const evalResult = await DiscountService.evaluateQuotation(
        quotation.customerId.toString(),
        updatedItems
      );

      quotation.items = evalResult.items as any;
      quotation.subtotal = evalResult.subtotal;
      quotation.discountAmount = evalResult.discountAmount;
      quotation.taxableAmount = evalResult.taxableAmount;
      quotation.taxAmount = evalResult.taxAmount;
      quotation.totalAmount = evalResult.totalAmount;
      quotation.totalCost = evalResult.totalCost;
      quotation.grossMarginAmount = evalResult.grossMarginAmount;
      quotation.grossMarginPct = evalResult.grossMarginPct;
      quotation.riskLevel = evalResult.riskLevel;
      quotation.riskScore = evalResult.riskScore;
      quotation.riskReasons = evalResult.riskReasons;
      quotation.approvalRequired = evalResult.approvalRequired;
      quotation.negotiationActive = true;

      // 3. If counter discount triggers approval -> automatically create Approval & update stage
      if (evalResult.approvalRequired) {
        const approval = await ApprovalService.createApprovalForQuotation(
          quotation,
          evalResult.approvalChain,
          evalResult.riskLevel,
          evalResult.riskScore,
          evalResult.riskReasons,
          evalResult.items.filter((i) => i.isDiscountViolated)
        );
        quotation.stage = 'PENDING_APPROVAL';
        quotation.currentApprovalId = approval._id as any;
      } else {
        quotation.stage = 'APPROVED';
      }

      await quotation.save();

      await AuditService.log({
        actorId: req.user?.id,
        actorName: req.user?.name || 'Customer',
        actorRole: 'CUSTOMER',
        action: 'NEGOTIATION_COUNTER_SUBMITTED',
        entityType: 'NEGOTIATION',
        entityId: quotation._id.toString(),
        entityNumber: quotation.quoteNumber,
        afterState: {
          proposedDiscountPct: counterDiscount,
          riskLevel: evalResult.riskLevel,
          stage: quotation.stage,
        },
        notes: `Customer countered with ${counterDiscount}%. Approval required: ${evalResult.approvalRequired}`,
      });

      res.json({
        success: true,
        message: evalResult.approvalRequired
          ? `Counter discount (${counterDiscount}%) submitted. It exceeds discount ceilings and has been auto-routed for Manager/Finance re-approval.`
          : `Counter discount (${counterDiscount}%) accepted within limits.`,
        data: {
          negotiation,
          quotationStage: quotation.stage,
          riskLevel: evalResult.riskLevel,
          approvalRequired: evalResult.approvalRequired,
        },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Customer confirms the quotation
  public static async confirmByCustomer(req: AuthRequest, res: Response): Promise<void> {
    try {
      const quotation = await Quotation.findById(req.params.id);
      if (!quotation) {
        res.status(404).json({ success: false, message: 'Quotation not found' });
        return;
      }

      if (quotation.stage === 'PENDING_APPROVAL') {
        res.status(400).json({
          success: false,
          message: 'Quotation is currently undergoing internal review/approval. Confirmation is locked until approved.',
        });
        return;
      }

      quotation.isCustomerConfirmed = true;
      quotation.confirmedAt = new Date();
      quotation.stage = 'READY_FOR_FULFILLMENT';
      await quotation.save();

      let negotiation = await Negotiation.findOne({ quotationId: quotation._id });
      if (negotiation) {
        negotiation.status = 'ACCEPTED';
        negotiation.messages.push({
          senderName: req.user?.name || 'Customer',
          senderRole: 'CUSTOMER',
          message: 'Customer accepted and confirmed all final terms.',
          timestamp: new Date(),
        });
        await negotiation.save();
      }

      await AuditService.log({
        actorId: req.user?.id,
        actorName: req.user?.name || 'Customer',
        actorRole: 'CUSTOMER',
        action: 'CUSTOMER_CONFIRMATION',
        entityType: 'QUOTATION',
        entityId: quotation._id.toString(),
        entityNumber: quotation.quoteNumber,
        afterState: { stage: 'READY_FOR_FULFILLMENT', isCustomerConfirmed: true },
        notes: 'Customer confirmed the deal through the customer portal.',
      });

      res.json({
        success: true,
        message: 'Quotation successfully confirmed! Deal has transitioned to fulfillment and billing.',
        data: quotation,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}
