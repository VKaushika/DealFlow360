import mongoose, { Document, Schema } from 'mongoose';

export type BillingFrequency = 'MONTHLY' | 'QUARTERLY' | 'YEARLY';

export interface ISubscriptionPlan extends Document {
  name: string;
  code: string;
  billingFrequency: BillingFrequency;
  durationMonths: number; // 1 for monthly, 3 for quarterly, 12 for yearly
  discountPct: number; // e.g., 10% discount for annual plans
  description: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionPlanSchema = new Schema<ISubscriptionPlan>(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    billingFrequency: {
      type: String,
      enum: ['MONTHLY', 'QUARTERLY', 'YEARLY'],
      default: 'MONTHLY',
      required: true,
    },
    durationMonths: { type: Number, required: true, default: 1 },
    discountPct: { type: Number, default: 0 },
    description: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const SubscriptionPlan = mongoose.model<ISubscriptionPlan>('SubscriptionPlan', SubscriptionPlanSchema);
