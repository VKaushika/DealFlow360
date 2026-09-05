import { Request, Response } from 'express';
import { DiscountTier } from '../models/DiscountTier';
import { DiscountRule } from '../models/DiscountRule';
import { ApprovalRule } from '../models/ApprovalRule';
import { Category } from '../models/Category';
import { AuthRequest } from '../middleware/authMiddleware';

export class GovernanceController {
  // Discount Tiers
  public static async getTiers(req: Request, res: Response): Promise<void> {
    try {
      const tiers = await DiscountTier.find().sort({ maxDiscountPct: 1 });
      res.json({ success: true, data: tiers });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async updateTier(req: AuthRequest, res: Response): Promise<void> {
    try {
      const tier = await DiscountTier.findByIdAndUpdate(req.params.id, req.body, { new: true });
      res.json({ success: true, data: tier });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Category & Product Discount Ceilings
  public static async getDiscountRules(req: Request, res: Response): Promise<void> {
    try {
      const rules = await DiscountRule.find().populate('categoryId productId');
      res.json({ success: true, data: rules });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async createDiscountRule(req: AuthRequest, res: Response): Promise<void> {
    try {
      const rule = await DiscountRule.create(req.body);
      res.status(201).json({ success: true, data: rule });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Approval Rules
  public static async getApprovalRules(req: Request, res: Response): Promise<void> {
    try {
      const rules = await ApprovalRule.find().sort({ stepOrder: 1 });
      res.json({ success: true, data: rules });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async updateApprovalRule(req: AuthRequest, res: Response): Promise<void> {
    try {
      const rule = await ApprovalRule.findByIdAndUpdate(req.params.id, req.body, { new: true });
      res.json({ success: true, data: rule });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}
