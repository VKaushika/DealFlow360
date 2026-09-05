import mongoose, { Document, Schema } from 'mongoose';

export type ProductType = 'GOODS' | 'SERVICE' | 'COMBO';
export type BillingType = 'ONE_TIME' | 'RECURRING';

export interface IProduct extends Document {
  name: string;
  sku: string;
  categoryId: mongoose.Types.ObjectId;
  type: ProductType;
  billingType: BillingType;
  unitPrice: number;
  unitCost: number;
  taxRate: number; // percentage, e.g., 18 for 18% GST
  description: string;
  unitOfMeasure: string;
  maxDiscountCeiling?: number; // Optional product-level override
  isPromoted: boolean; // For upsell ranking
  isActive: boolean;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, trim: true },
    sku: { type: String, required: true, unique: true, uppercase: true, trim: true },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    type: {
      type: String,
      enum: ['GOODS', 'SERVICE', 'COMBO'],
      default: 'GOODS',
      required: true,
    },
    billingType: {
      type: String,
      enum: ['ONE_TIME', 'RECURRING'],
      default: 'ONE_TIME',
      required: true,
    },
    unitPrice: { type: Number, required: true, min: 0 },
    unitCost: { type: Number, required: true, min: 0 },
    taxRate: { type: Number, default: 18, min: 0 },
    description: { type: String, default: '' },
    unitOfMeasure: { type: String, default: 'Unit' },
    maxDiscountCeiling: { type: Number, default: null },
    isPromoted: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    imageUrl: { type: String, default: '' },
  },
  { timestamps: true }
);

export const Product = mongoose.model<IProduct>('Product', ProductSchema);
