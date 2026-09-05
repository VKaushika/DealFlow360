import mongoose, { Document, Schema } from 'mongoose';

export interface ICategory extends Document {
  name: string;
  code: string;
  description?: string;
  defaultDiscountCeiling: number; // e.g., 15 for 15%
  color?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    description: { type: String, default: '' },
    defaultDiscountCeiling: { type: Number, required: true, default: 10 },
    color: { type: String, default: '#4f46e5' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Category = mongoose.model<ICategory>('Category', CategorySchema);
