import mongoose, { Document, Schema } from 'mongoose';

export interface IDiscountRule extends Document {
  name: string;
  categoryId?: mongoose.Types.ObjectId;
  productId?: mongoose.Types.ObjectId;
  customerTier?: 'BRONZE' | 'SILVER' | 'GOLD';
  maxDiscountPct: number;
  managerApprovalThresholdPct: number; // e.g. if discount is up to max + 5% -> manager
  financeApprovalThresholdPct: number; // e.g. if discount exceeds manager threshold -> finance
  priority: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const DiscountRuleSchema = new Schema<IDiscountRule>(
  {
    name: { type: String, required: true, trim: true },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', default: null },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', default: null },
    customerTier: { type: String, enum: ['BRONZE', 'SILVER', 'GOLD'], default: null },
    maxDiscountPct: { type: Number, required: true },
    managerApprovalThresholdPct: { type: Number, default: 5 },
    financeApprovalThresholdPct: { type: Number, default: 10 },
    priority: { type: Number, default: 1 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const DiscountRule = mongoose.model<IDiscountRule>('DiscountRule', DiscountRuleSchema);
