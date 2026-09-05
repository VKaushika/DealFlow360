import { UpsellRule, CrossSellRule } from '../models/UpsellRule';
import { Product } from '../models/Product';
import mongoose from 'mongoose';

export interface UpsellRecommendation {
  ruleId: string;
  ruleType: 'UPSELL' | 'CROSS_SELL';
  triggerProductName: string;
  recommendedProduct: {
    _id: string;
    name: string;
    sku: string;
    unitPrice: number;
    unitCost: number;
    billingType: 'ONE_TIME' | 'RECURRING';
    type: 'GOODS' | 'SERVICE' | 'COMBO';
    marginAmount: number;
    marginPct: number;
  };
  reason: string;
  marginBenefitNotes: string;
  isPromoted: boolean;
  priority: number;
}

export class UpsellService {
  public static async getRecommendationsForItems(
    productIds: string[]
  ): Promise<UpsellRecommendation[]> {
    if (!productIds || productIds.length === 0) return [];

    const existingProductIds = new Set(productIds.map((id) => id.toString()));
    const recommendations: UpsellRecommendation[] = [];

    // 1. Fetch upsell rules for all present products
    const upsellRules = await UpsellRule.find({
      triggerProductId: { $in: productIds.map((id) => new mongoose.Types.ObjectId(id)) },
      isActive: true,
    })
      .populate('triggerProductId')
      .populate('recommendedProductId');

    for (const rule of upsellRules) {
      const recProd = rule.recommendedProductId as any;
      const trigProd = rule.triggerProductId as any;

      if (recProd && !existingProductIds.has(recProd._id.toString())) {
        const marginAmount = recProd.unitPrice - recProd.unitCost;
        const marginPct = recProd.unitPrice > 0 ? Math.round((marginAmount / recProd.unitPrice) * 100) : 0;

        recommendations.push({
          ruleId: rule._id.toString(),
          ruleType: 'UPSELL',
          triggerProductName: trigProd?.name || 'Product',
          recommendedProduct: {
            _id: recProd._id.toString(),
            name: recProd.name,
            sku: recProd.sku,
            unitPrice: recProd.unitPrice,
            unitCost: recProd.unitCost,
            billingType: recProd.billingType,
            type: recProd.type,
            marginAmount,
            marginPct,
          },
          reason: rule.reason,
          marginBenefitNotes: rule.marginBenefitNotes || `Adds ₹${marginAmount} (+${marginPct}% margin) to order.`,
          isPromoted: rule.isPromoted,
          priority: rule.priority || 1,
        });
      }
    }

    // 2. Fetch cross-sell rules
    const crossSellRules = await CrossSellRule.find({
      triggerProductId: { $in: productIds.map((id) => new mongoose.Types.ObjectId(id)) },
      isActive: true,
    })
      .populate('triggerProductId')
      .populate('recommendedProductId');

    for (const rule of crossSellRules) {
      const recProd = rule.recommendedProductId as any;
      const trigProd = rule.triggerProductId as any;

      if (recProd && !existingProductIds.has(recProd._id.toString())) {
        const marginAmount = recProd.unitPrice - recProd.unitCost;
        const marginPct = recProd.unitPrice > 0 ? Math.round((marginAmount / recProd.unitPrice) * 100) : 0;

        recommendations.push({
          ruleId: rule._id.toString(),
          ruleType: 'CROSS_SELL',
          triggerProductName: trigProd?.name || 'Product',
          recommendedProduct: {
            _id: recProd._id.toString(),
            name: recProd.name,
            sku: recProd.sku,
            unitPrice: recProd.unitPrice,
            unitCost: recProd.unitCost,
            billingType: recProd.billingType,
            type: recProd.type,
            marginAmount,
            marginPct,
          },
          reason: rule.reason,
          marginBenefitNotes: `Adds ₹${marginAmount} (+${marginPct}% margin) to order.`,
          isPromoted: false,
          priority: rule.priority || 2,
        });
      }
    }

    // Sort by priority (ascending) and promoted status
    return recommendations.sort((a, b) => {
      if (a.isPromoted && !b.isPromoted) return -1;
      if (!a.isPromoted && b.isPromoted) return 1;
      return a.priority - b.priority;
    });
  }
}
