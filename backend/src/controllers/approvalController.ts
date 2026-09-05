import { Request, Response } from 'express';
import { Approval } from '../models/Approval';
import { Quotation } from '../models/Quotation';
import { User } from '../models/User';
import { ApprovalService } from '../services/approvalService';
import { AuthRequest } from '../middleware/authMiddleware';

export class ApprovalController {
  public static async getAll(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { status, riskLevel } = req.query;
      const query: any = {};
      if (status) query.status = status;
      if (riskLevel) query.riskLevel = riskLevel;

      const approvals = await Approval.find(query)
        .populate('quotationId')
        .populate('customerId', 'name companyName email tier')
        .populate('salesRepId', 'name email')
        .sort({ createdAt: -1 });

      res.json({ success: true, count: approvals.length, data: approvals });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async getById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const approval = await Approval.findById(req.params.id)
        .populate({
          path: 'quotationId',
          populate: { path: 'items.productId customerId salesRepId' },
        })
        .populate('customerId')
        .populate('salesRepId', 'name email');

      if (!approval) {
        res.status(404).json({ success: false, message: 'Approval not found' });
        return;
      }
      res.json({ success: true, data: approval });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async approve(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { notes } = req.body;
      const user = await User.findById(req.user?.id);
      if (!user) {
        res.status(401).json({ success: false, message: 'User not found' });
        return;
      }

      const result = await ApprovalService.processApprovalDecision(
        req.params.id,
        user,
        'APPROVE',
        notes
      );

      res.json({
        success: true,
        message: 'Approval decision recorded successfully',
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  public static async reject(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { notes } = req.body;
      const user = await User.findById(req.user?.id);
      if (!user) {
        res.status(401).json({ success: false, message: 'User not found' });
        return;
      }

      const result = await ApprovalService.processApprovalDecision(
        req.params.id,
        user,
        'REJECT',
        notes
      );

      res.json({
        success: true,
        message: 'Quotation rejected by reviewer',
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  public static async requestRevision(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { notes } = req.body;
      const user = await User.findById(req.user?.id);
      if (!user) {
        res.status(401).json({ success: false, message: 'User not found' });
        return;
      }

      const result = await ApprovalService.processApprovalDecision(
        req.params.id,
        user,
        'REVISION_REQUESTED',
        notes
      );

      res.json({
        success: true,
        message: 'Revision requested from Sales Representative',
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
}
