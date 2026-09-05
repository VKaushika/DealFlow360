import { Request, Response } from 'express';
import { UpsellService } from '../services/upsellService';

export class RecommendationController {
  public static async getRecommendations(req: Request, res: Response): Promise<void> {
    try {
      const { productIds } = req.body;
      const ids = Array.isArray(productIds) ? productIds : [productIds].filter(Boolean);
      const recommendations = await UpsellService.getRecommendationsForItems(ids);
      res.json({ success: true, count: recommendations.length, data: recommendations });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}
