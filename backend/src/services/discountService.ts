import { Customer } from '../models/Customer';
import { Product } from '../models/Product';
import { Category } from '../models/Category';
import { DiscountTier } from '../models/DiscountTier';
import { DiscountRule } from '../models/DiscountRule';
import mongoose from 'mongoose';

export interface DiscountEvaluationItemInput {
  productId: string;
  quantity: number;
  unitPrice: number;
  discountPct: number;
}

export interface EvaluatedLineItem {
  productId: string;
  productName: string;
  sku: string;
  categoryName: string;
  type: 'GOODS' | 'SERVICE' | 'COMBO';
  billingType: 'ONE_TIME' | 'RECURRING';
  quantity: number;
  unitPrice: number;
  unitCost: number;
  discountPct: number;
  discountAmount: number;
  taxableAmount: number;
  taxRate: number;
  taxAmount: number;
  lineTotal: number;
  lineCost: number;
  lineGrossMargin: number;
  lineMarginPct: number;
  allowedDiscountCeiling: number;
  isDiscountViolated: boolean;
  discountDeltaPct: number;
}

export interface DiscountEvaluationResult {
  items: EvaluatedLineItem[];
  subtotal: number;
  discountAmount: number;
  taxableAmount: number;
  taxAmount: number;
  totalAmount: number;
  totalCost: number;
  grossMarginAmount: number;
  grossMarginPct: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  riskScore: number; // 0 to 100
  riskReasons: string[];
  approvalRequired: boolean;
  approvalChain: Array<{
    role: 'SALES_MANAGER' | 'FINANCE_OPS';
    stepOrder: number;
  }>;
  violationsCount: number;
  customerTier: string;
  customerMaxDiscountPct: number;
}

export class DiscountService {
  public static async evaluateQuotation(
    customerId: string,
    rawItems: DiscountEvaluationItemInput[]
  ): Promise<DiscountEvaluationResult> {
    const customer = await Customer.findById(customerId);
    if (!customer) {
      throw new Error(`Customer with id ${customerId} not found`);
    }

    // 1. Fetch customer tier config
    const tierConfig = await DiscountTier.findOne({ tierName: customer.tier, isActive: true });
    const customerTierLimit = tierConfig ? tierConfig.maxDiscountPct : 10;

    let subtotal = 0;
    let totalDiscountAmount = 0;
    let totalTaxableAmount = 0;
    let totalTaxAmount = 0;
    let totalCost = 0;

    const evaluatedItems: EvaluatedLineItem[] = [];
    const violations: Array<{
      productName: string;
      appliedPct: number;
      allowedPct: number;
      deltaPct: number;
    }> = [];
    const riskReasons: string[] = [];

    let maxDeltaPct = 0;
    let violatedLinesCount = 0;

    // 2. Evaluate each item
    for (const item of rawItems) {
      const product = await Product.findById(item.productId).populate('categoryId');
      if (!product) {
        throw new Error(`Product with id ${item.productId} not found`);
      }

      const category = product.categoryId as any;
      const categoryCeiling = category?.defaultDiscountCeiling ?? 15;
      const productCeiling = product.maxDiscountCeiling ?? 100;

      // Effective ceiling is the strictest limit among customer tier, category, and product
      const effectiveCeiling = Math.min(customerTierLimit, categoryCeiling, productCeiling);

      const quantity = Math.max(1, Number(item.quantity) || 1);
      const unitPrice = Number(item.unitPrice) || product.unitPrice;
      const unitCost = product.unitCost || 0;
      const discountPct = Math.max(0, Math.min(100, Number(item.discountPct) || 0));

      const lineSubtotal = quantity * unitPrice;
      const discountAmount = Math.round((lineSubtotal * (discountPct / 100)) * 100) / 100;
      const taxableAmount = Math.max(0, lineSubtotal - discountAmount);
      const taxRate = product.taxRate || 18;
      const taxAmount = Math.round((taxableAmount * (taxRate / 100)) * 100) / 100;
      const lineTotal = taxableAmount + taxAmount;
      const lineCost = quantity * unitCost;
      const lineGrossMargin = lineTotal - lineCost;
      const lineMarginPct = lineTotal > 0 ? Math.round(((lineGrossMargin / lineTotal) * 100) * 100) / 100 : 0;

      const isViolated = discountPct > effectiveCeiling;
      const deltaPct = isViolated ? Math.round((discountPct - effectiveCeiling) * 100) / 100 : 0;

      if (isViolated) {
        violatedLinesCount++;
        if (deltaPct > maxDeltaPct) {
          maxDeltaPct = deltaPct;
        }
        violations.push({
          productName: product.name,
          appliedPct: discountPct,
          allowedPct: effectiveCeiling,
          deltaPct,
        });
        riskReasons.push(
          `[${product.name}] Applied discount ${discountPct}% exceeds ${category?.name || 'Category'} ceiling of ${effectiveCeiling}% (by +${deltaPct}%)`
        );
      }

      subtotal += lineSubtotal;
      totalDiscountAmount += discountAmount;
      totalTaxableAmount += taxableAmount;
      totalTaxAmount += taxAmount;
      totalCost += lineCost;

      evaluatedItems.push({
        productId: product._id.toString(),
        productName: product.name,
        sku: product.sku,
        categoryName: category?.name || 'General',
        type: product.type,
        billingType: product.billingType,
        quantity,
        unitPrice,
        unitCost,
        discountPct,
        discountAmount,
        taxableAmount,
        taxRate,
        taxAmount,
        lineTotal,
        lineCost,
        lineGrossMargin,
        lineMarginPct,
        allowedDiscountCeiling: effectiveCeiling,
        isDiscountViolated: isViolated,
        discountDeltaPct: deltaPct,
      });
    }

    const totalAmount = totalTaxableAmount + totalTaxAmount;
    const grossMarginAmount = totalAmount - totalCost;
    const grossMarginPct = totalAmount > 0 ? Math.round(((grossMarginAmount / totalAmount) * 100) * 100) / 100 : 0;

    // 3. Compute Deterministic Blended Risk Score & Routing
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
    let riskScore = 10; // Baseline low risk
    let approvalRequired = false;
    const approvalChain: Array<{ role: 'SALES_MANAGER' | 'FINANCE_OPS'; stepOrder: number }> = [];

    // Margin health check
    if (grossMarginPct < 15 && totalAmount > 0) {
      riskScore += 30;
      riskReasons.push(`Low Gross Margin warning: Overall deal margin is ${grossMarginPct}%, below target 15% threshold.`);
    }

    if (violatedLinesCount === 0) {
      riskLevel = grossMarginPct < 15 ? 'MEDIUM' : 'LOW';
      riskScore = Math.min(riskScore, 30);
      approvalRequired = grossMarginPct < 15;
      if (approvalRequired) {
        approvalChain.push({ role: 'SALES_MANAGER', stepOrder: 1 });
      }
    } else if (violatedLinesCount === 1 && maxDeltaPct <= 5) {
      // Small single violation (e.g. <= 5% above limit)
      riskLevel = 'MEDIUM';
      riskScore = 55 + Math.round(maxDeltaPct * 2);
      approvalRequired = true;
      approvalChain.push({ role: 'SALES_MANAGER', stepOrder: 1 });
    } else if (violatedLinesCount === 1 && maxDeltaPct > 5) {
      // Large single violation (e.g. Setup Service 18% with 10% limit = 8% delta)
      riskLevel = maxDeltaPct >= 10 ? 'CRITICAL' : 'HIGH';
      riskScore = 75 + Math.min(20, Math.round(maxDeltaPct * 2));
      approvalRequired = true;
      approvalChain.push({ role: 'SALES_MANAGER', stepOrder: 1 });
      approvalChain.push({ role: 'FINANCE_OPS', stepOrder: 2 });
      riskReasons.push(`High discount anomaly detected: Line discount is +${maxDeltaPct}% over configured limit.`);
    } else {
      // Multiple line violations (Blended accumulation)
      riskLevel = maxDeltaPct > 5 ? 'CRITICAL' : 'HIGH';
      riskScore = Math.min(98, 70 + (violatedLinesCount * 10) + Math.round(maxDeltaPct * 1.5));
      approvalRequired = true;
      approvalChain.push({ role: 'SALES_MANAGER', stepOrder: 1 });
      approvalChain.push({ role: 'FINANCE_OPS', stepOrder: 2 });
      riskReasons.push(`Multiple discount ceiling breaches: ${violatedLinesCount} separate items exceed authorized limits.`);
    }

    return {
      items: evaluatedItems,
      subtotal: Math.round(subtotal * 100) / 100,
      discountAmount: Math.round(totalDiscountAmount * 100) / 100,
      taxableAmount: Math.round(totalTaxableAmount * 100) / 100,
      taxAmount: Math.round(totalTaxAmount * 100) / 100,
      totalAmount: Math.round(totalAmount * 100) / 100,
      totalCost: Math.round(totalCost * 100) / 100,
      grossMarginAmount: Math.round(grossMarginAmount * 100) / 100,
      grossMarginPct,
      riskLevel,
      riskScore,
      riskReasons,
      approvalRequired,
      approvalChain,
      violationsCount: violatedLinesCount,
      customerTier: customer.tier,
      customerMaxDiscountPct: customerTierLimit,
    };
  }
}
