import mongoose, { Document, Schema } from 'mongoose';

export interface IDiscountTier extends Document {
  tierName: 'BRONZE' | 'SILVER' | 'GOLD';
  maxDiscountPct: number; // e.g. 5, 10, 15
  description: string;
  badgeColor: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const DiscountTierSchema = new Schema<IDiscountTier>(
  {
    tierName: {
      type: String,
      enum: ['BRONZE', 'SILVER', 'GOLD'],
      required: true,
      unique: true,
    },
    maxDiscountPct: { type: Number, required: true },
    description: { type: String, default: '' },
    badgeColor: { type: String, default: '#6b7280' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const DiscountTier = mongoose.model<IDiscountTier>('DiscountTier', DiscountTierSchema);
