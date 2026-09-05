import mongoose, { Document, Schema } from 'mongoose';

export interface IUpsellRule extends Document {
  name: string;
  triggerProductId: mongoose.Types.ObjectId;
  recommendedProductId: mongoose.Types.ObjectId;
  reason: string;
  marginBenefitNotes: string;
  isPromoted: boolean;
  minGrossMarginPct?: number;
  priority: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UpsellRuleSchema = new Schema<IUpsellRule>(
  {
    name: { type: String, required: true, trim: true },
    triggerProductId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    recommendedProductId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    reason: { type: String, required: true },
    marginBenefitNotes: { type: String, default: '' },
    isPromoted: { type: Boolean, default: false },
    minGrossMarginPct: { type: Number, default: 20 },
    priority: { type: Number, default: 1 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const UpsellRule = mongoose.model<IUpsellRule>('UpsellRule', UpsellRuleSchema);

// CrossSellRule
export interface ICrossSellRule extends Document {
  name: string;
  triggerCategoryId?: mongoose.Types.ObjectId;
  triggerProductId?: mongoose.Types.ObjectId;
  recommendedProductId: mongoose.Types.ObjectId;
  reason: string;
  priority: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CrossSellRuleSchema = new Schema<ICrossSellRule>(
  {
    name: { type: String, required: true, trim: true },
    triggerCategoryId: { type: Schema.Types.ObjectId, ref: 'Category', default: null },
    triggerProductId: { type: Schema.Types.ObjectId, ref: 'Product', default: null },
    recommendedProductId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    reason: { type: String, required: true },
    priority: { type: Number, default: 1 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const CrossSellRule = mongoose.model<ICrossSellRule>('CrossSellRule', CrossSellRuleSchema);
