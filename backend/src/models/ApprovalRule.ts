import mongoose, { Document, Schema } from 'mongoose';

export interface IApprovalRule extends Document {
  name: string;
  conditionType: 'RISK_LEVEL' | 'DISCOUNT_EXCEEDED' | 'TOTAL_VALUE' | 'MARGIN_THRESHOLD';
  minRiskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  minDiscountDeltaPct?: number; // e.g. > 0% over limit
  minTotalAmount?: number;
  minMarginPct?: number; // e.g. if margin drops below 15%
  requiredRole: 'SALES_MANAGER' | 'FINANCE_OPS' | 'ADMIN';
  stepOrder: number; // 1 for Manager, 2 for Finance
  description: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ApprovalRuleSchema = new Schema<IApprovalRule>(
  {
    name: { type: String, required: true, trim: true },
    conditionType: {
      type: String,
      enum: ['RISK_LEVEL', 'DISCOUNT_EXCEEDED', 'TOTAL_VALUE', 'MARGIN_THRESHOLD'],
      required: true,
    },
    minRiskLevel: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: null,
    },
    minDiscountDeltaPct: { type: Number, default: 0 },
    minTotalAmount: { type: Number, default: 0 },
    minMarginPct: { type: Number, default: null },
    requiredRole: {
      type: String,
      enum: ['SALES_MANAGER', 'FINANCE_OPS', 'ADMIN'],
      required: true,
    },
    stepOrder: { type: Number, default: 1 },
    description: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const ApprovalRule = mongoose.model<IApprovalRule>('ApprovalRule', ApprovalRuleSchema);
