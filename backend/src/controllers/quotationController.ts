import { Request, Response } from 'express';
import { Quotation, IQuotation } from '../models/Quotation';
import { Customer } from '../models/Customer';
import { DiscountService } from '../services/discountService';
import { ApprovalService } from '../services/approvalService';
import { AuditService } from '../services/auditService';
import { AuthRequest } from '../middleware/authMiddleware';
import mongoose from 'mongoose';

export class QuotationController {
  private static canAccessQuotation(
    req: AuthRequest,
    quotation: IQuotation
  ): boolean {
    const user = req.user;

    if (!user) {
      return false;
    }

    // Admin has full access
    if (user.role === 'ADMIN') {
      return true;
    }

    // Customer can access only quotations belonging to their customer account
    if (user.role === 'CUSTOMER') {
      return (
        !!user.customerId &&
        quotation.customerId.toString() === user.customerId
      );
    }

    // Sales Rep can access only quotations assigned to them
    if (user.role === 'SALES_REP') {
      return quotation.salesRepId.toString() === user.id;
    }

    // Sales Manager and Finance Ops have organization-level
    // quotation access according to the existing RBAC permissions.
    if (
      user.role === 'SALES_MANAGER' ||
      user.role === 'FINANCE_OPS'
    ) {
      return true;
    }

    return false;
  }

  public static async getAll(
    req: AuthRequest,
    res: Response
  ): Promise<void> {
    try {
      const { stage, customerId, salesRepId, search } = req.query;
      const query: any = {};

      // Enforce data-level isolation
      if (req.user?.role === 'CUSTOMER') {
        query.customerId = req.user.customerId;
      } else if (req.user?.role === 'SALES_REP') {
        // Sales Rep can see only their own quotations
        query.salesRepId = req.user.id;

        // Ignore customerId/salesRepId supplied by the client
        // so the Sales Rep cannot bypass their scope.
      } else {
        // ADMIN, SALES_MANAGER and FINANCE_OPS
        if (customerId) {
          query.customerId = customerId;
        }

        if (salesRepId) {
          query.salesRepId = salesRepId;
        }
      }

      if (stage) {
        query.stage = stage;
      }

      if (search) {
        query.$or = [
          {
            quoteNumber: {
              $regex: String(search),
              $options: 'i',
            },
          },
          {
            title: {
              $regex: String(search),
              $options: 'i',
            },
          },
        ];
      }

      const quotations = await Quotation.find(query)
        .populate(
          'customerId',
          'name companyName email tier code'
        )
        .populate('salesRepId', 'name email')
        .populate('currentApprovalId')
        .sort({ updatedAt: -1 });

      // Customers must not receive internal financial/governance data
      if (req.user?.role === 'CUSTOMER') {
        const sanitized = quotations.map((q) => {
          const obj = q.toObject();

          delete (obj as any).totalCost;
          delete (obj as any).grossMarginAmount;
          delete (obj as any).grossMarginPct;
          delete (obj as any).internalNotes;
          delete (obj as any).riskReasons;

          if (obj.items) {
            obj.items.forEach((item: any) => {
              delete item.unitCost;
              delete item.lineCost;
              delete item.lineGrossMargin;
              delete item.lineMarginPct;
            });
          }

          return obj;
        });

        res.json({
          success: true,
          count: sanitized.length,
          data: sanitized,
        });

        return;
      }

      res.json({
        success: true,
        count: quotations.length,
        data: quotations,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  public static async getById(
    req: AuthRequest,
    res: Response
  ): Promise<void> {
    try {
      const quotation = await Quotation.findById(req.params.id)
        .populate('customerId')
        .populate('salesRepId', 'name email department')
        .populate('currentApprovalId');

      if (!quotation) {
        res.status(404).json({
          success: false,
          message: 'Quotation not found',
        });

        return;
      }

      // Resource-level authorization
      if (!QuotationController.canAccessQuotation(req, quotation)) {
        res.status(403).json({
          success: false,
          message: 'Forbidden: You do not have access to this quotation.',
        });

        return;
      }

      // Customers must not receive internal financial/governance data
      if (req.user?.role === 'CUSTOMER') {
        const obj = quotation.toObject();

        delete (obj as any).totalCost;
        delete (obj as any).grossMarginAmount;
        delete (obj as any).grossMarginPct;
        delete (obj as any).internalNotes;
        delete (obj as any).riskReasons;

        if (obj.items) {
          obj.items.forEach((item: any) => {
            delete item.unitCost;
            delete item.lineCost;
            delete item.lineGrossMargin;
            delete item.lineMarginPct;
          });
        }

        res.json({
          success: true,
          data: obj,
        });

        return;
      }

      res.json({
        success: true,
        data: quotation,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  public static async evaluateDiscount(
    req: AuthRequest,
    res: Response
  ): Promise<void> {
    try {
      const { customerId, items } = req.body;

      if (!customerId || !items || !Array.isArray(items)) {
        res.status(400).json({
          success: false,
          message: 'customerId and items array are required.',
        });

        return;
      }

      // Customer can evaluate discounts only for their own account
      if (
        req.user?.role === 'CUSTOMER' &&
        req.user.customerId !== customerId
      ) {
        res.status(403).json({
          success: false,
          message:
            'Forbidden: You cannot evaluate discounts for another customer.',
        });

        return;
      }

      const result = await DiscountService.evaluateQuotation(
        customerId,
        items
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  public static async create(
    req: AuthRequest,
    res: Response
  ): Promise<void> {
    try {
      const {
        customerId,
        title,
        items,
        customerNotes,
        internalNotes,
        submitForApproval,
        submit,
      } = req.body;

      if (!customerId || !items || items.length === 0) {
        res.status(400).json({
          success: false,
          message:
            'customerId and at least one item are required.',
        });

        return;
      }

      // Customer cannot create a quotation for another customer.
      // Normally CUSTOMER cannot reach this endpoint because
      // QUOTATION_CREATE is not in the CUSTOMER permissions.
      if (req.user?.role === 'CUSTOMER') {
        if (req.user.customerId !== customerId) {
          res.status(403).json({
            success: false,
            message:
              'Forbidden: You cannot create a quotation for another customer.',
          });

          return;
        }
      }

      const evalResult =
        await DiscountService.evaluateQuotation(
          customerId,
          items
        );

      const quoteNumber = `QT-${Date.now()
        .toString()
        .slice(-6)}`;

      const shouldSubmit =
        submitForApproval === true || submit === true;

      const quotation = await Quotation.create({
        quoteNumber,
        title:
          title ||
          `Quotation for ${evalResult.customerTier} Customer`,
        customerId,
        salesRepId:
          req.user?.id || new mongoose.Types.ObjectId(),
        stage: shouldSubmit
          ? evalResult.approvalRequired
            ? 'PENDING_APPROVAL'
            : 'APPROVED'
          : 'DRAFT',
        items: evalResult.items,
        subtotal: evalResult.subtotal,
        discountAmount: evalResult.discountAmount,
        taxableAmount: evalResult.taxableAmount,
        taxAmount: evalResult.taxAmount,
        totalAmount: evalResult.totalAmount,
        totalCost: evalResult.totalCost,
        grossMarginAmount: evalResult.grossMarginAmount,
        grossMarginPct: evalResult.grossMarginPct,
        riskLevel: evalResult.riskLevel,
        riskScore: evalResult.riskScore,
        riskReasons: evalResult.riskReasons,
        approvalRequired: evalResult.approvalRequired,
        customerNotes: customerNotes || '',
        internalNotes: internalNotes || '',
      });

      let approval = null;

      if (
        shouldSubmit &&
        evalResult.approvalRequired
      ) {
        approval =
          await ApprovalService.createApprovalForQuotation(
            quotation,
            evalResult.approvalChain,
            evalResult.riskLevel,
            evalResult.riskScore,
            evalResult.riskReasons,
            evalResult.items.filter(
              (i) => i.isDiscountViolated
            )
          );

        quotation.currentApprovalId =
          approval._id as any;

        await quotation.save();
      }

      await AuditService.log({
        actorId: req.user?.id,
        actorName: req.user?.name || 'Sales Rep',
        actorRole:
          req.user?.role || 'SALES_REP',
        action: shouldSubmit
          ? evalResult.approvalRequired
            ? 'QUOTATION_SUBMITTED'
            : 'QUOTATION_AUTO_APPROVED'
          : 'QUOTATION_CREATED',
        entityType: 'QUOTATION',
        entityId: quotation._id.toString(),
        entityNumber: quotation.quoteNumber,
        afterState: {
          totalAmount: quotation.totalAmount,
          marginPct: quotation.grossMarginPct,
          stage: quotation.stage,
        },
        notes: `Created quotation with ${items.length} items. Risk: ${evalResult.riskLevel}. Stage: ${quotation.stage}`,
      });

      res.status(201).json({
        success: true,
        data: quotation,
        approval,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  public static async update(
    req: AuthRequest,
    res: Response
  ): Promise<void> {
    try {
      const {
        items,
        title,
        customerNotes,
        internalNotes,
      } = req.body;

      const quotation = await Quotation.findById(
        req.params.id
      );

      if (!quotation) {
        res.status(404).json({
          success: false,
          message: 'Quotation not found',
        });

        return;
      }

      // Resource-level authorization
      if (!QuotationController.canAccessQuotation(req, quotation)) {
        res.status(403).json({
          success: false,
          message:
            'Forbidden: You do not have access to update this quotation.',
        });

        return;
      }

      const beforeState = {
        totalAmount: quotation.totalAmount,
        marginPct: quotation.grossMarginPct,
        stage: quotation.stage,
      };

      if (items && Array.isArray(items)) {
        const evalResult =
          await DiscountService.evaluateQuotation(
            quotation.customerId.toString(),
            items
          );

        quotation.items = evalResult.items as any;
        quotation.subtotal = evalResult.subtotal;
        quotation.discountAmount =
          evalResult.discountAmount;
        quotation.taxableAmount =
          evalResult.taxableAmount;
        quotation.taxAmount = evalResult.taxAmount;
        quotation.totalAmount =
          evalResult.totalAmount;
        quotation.totalCost = evalResult.totalCost;
        quotation.grossMarginAmount =
          evalResult.grossMarginAmount;
        quotation.grossMarginPct =
          evalResult.grossMarginPct;
        quotation.riskLevel =
          evalResult.riskLevel;
        quotation.riskScore =
          evalResult.riskScore;
        quotation.riskReasons =
          evalResult.riskReasons;
        quotation.approvalRequired =
          evalResult.approvalRequired;
      }

      if (title) {
        quotation.title = title;
      }

      if (customerNotes !== undefined) {
        quotation.customerNotes = customerNotes;
      }

      if (internalNotes !== undefined) {
        quotation.internalNotes = internalNotes;
      }

      quotation.version += 1;

      await quotation.save();

      await AuditService.log({
        actorId: req.user?.id,
        actorName:
          req.user?.name || 'Sales Rep',
        actorRole:
          req.user?.role || 'SALES_REP',
        action: 'QUOTATION_UPDATED',
        entityType: 'QUOTATION',
        entityId: quotation._id.toString(),
        entityNumber: quotation.quoteNumber,
        beforeState,
        afterState: {
          totalAmount: quotation.totalAmount,
          marginPct: quotation.grossMarginPct,
        },
        notes: `Updated items and recalculations. New Version: ${quotation.version}`,
      });

      res.json({
        success: true,
        data: quotation,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  public static async submit(
    req: AuthRequest,
    res: Response
  ): Promise<void> {
    try {
      const quotation = await Quotation.findById(
        req.params.id
      );

      if (!quotation) {
        res.status(404).json({
          success: false,
          message: 'Quotation not found',
        });

        return;
      }

      // Resource-level authorization
      if (!QuotationController.canAccessQuotation(req, quotation)) {
        res.status(403).json({
          success: false,
          message:
            'Forbidden: You do not have access to submit this quotation.',
        });

        return;
      }

      // Re-evaluate to make sure latest governance rules apply
      const evalResult =
        await DiscountService.evaluateQuotation(
          quotation.customerId.toString(),
          quotation.items.map((i) => ({
            productId: i.productId.toString(),
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            discountPct: i.discountPct,
          }))
        );

      quotation.riskLevel =
        evalResult.riskLevel;
      quotation.riskScore =
        evalResult.riskScore;
      quotation.riskReasons =
        evalResult.riskReasons;
      quotation.approvalRequired =
        evalResult.approvalRequired;

      if (evalResult.approvalRequired) {
        const approval =
          await ApprovalService.createApprovalForQuotation(
            quotation,
            evalResult.approvalChain,
            evalResult.riskLevel,
            evalResult.riskScore,
            evalResult.riskReasons,
            evalResult.items.filter(
              (i) => i.isDiscountViolated
            )
          );

        quotation.stage = 'PENDING_APPROVAL';
        quotation.currentApprovalId =
          approval._id as any;

        await quotation.save();

        res.json({
          success: true,
          message: `Quotation submitted. Requires ${evalResult.approvalChain
            .map((s) => s.role)
            .join(
              ' -> '
            )} approval due to ${evalResult.riskLevel} risk.`,
          data: {
            quotation,
            approval,
          },
        });
      } else {
        quotation.stage = 'APPROVED';

        await quotation.save();

        await AuditService.log({
          actorId: req.user?.id,
          actorName:
            req.user?.name || 'Sales Rep',
          actorRole:
            req.user?.role || 'SALES_REP',
          action: 'QUOTATION_AUTO_APPROVED',
          entityType: 'QUOTATION',
          entityId:
            quotation._id.toString(),
          entityNumber:
            quotation.quoteNumber,
          afterState: {
            stage: 'APPROVED',
            riskLevel: 'LOW',
          },
          notes:
            'No approval required. Quotation automatically approved.',
        });

        res.json({
          success: true,
          message:
            'Quotation within authorized discount limits. Automatically approved!',
          data: {
            quotation,
          },
        });
      }
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  public static async confirm(
    req: AuthRequest,
    res: Response
  ): Promise<void> {
    try {
      const quotation = await Quotation.findById(
        req.params.id
      );

      if (!quotation) {
        res.status(404).json({
          success: false,
          message: 'Quotation not found',
        });

        return;
      }

      // Only the customer belonging to this quotation,
      // Sales Manager, or Admin can confirm it.
      if (req.user?.role === 'CUSTOMER') {
        if (
          !req.user.customerId ||
          quotation.customerId.toString() !==
            req.user.customerId
        ) {
          res.status(403).json({
            success: false,
            message:
              'Forbidden: You cannot confirm this quotation.',
          });

          return;
        }
      } else if (
        req.user?.role !== 'ADMIN' &&
        req.user?.role !== 'SALES_MANAGER'
      ) {
        res.status(403).json({
          success: false,
          message:
            'Forbidden: Only the customer, Sales Manager, or Admin can confirm this quotation.',
        });

        return;
      }

      quotation.stage = 'READY_FOR_FULFILLMENT';
      quotation.isCustomerConfirmed = true;
      quotation.confirmedAt = new Date();

      await quotation.save();

      await AuditService.log({
        actorId: req.user?.id,
        actorName:
          req.user?.name || 'Customer / Rep',
        actorRole:
          req.user?.role || 'CUSTOMER',
        action: 'QUOTATION_CONFIRMED',
        entityType: 'QUOTATION',
        entityId:
          quotation._id.toString(),
        entityNumber:
          quotation.quoteNumber,
        afterState: {
          stage: 'READY_FOR_FULFILLMENT',
          isCustomerConfirmed: true,
        },
        notes:
          'Quotation confirmed and ready for warehouse fulfillment and billing.',
      });

      res.json({
        success: true,
        data: quotation,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
}