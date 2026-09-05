import mongoose, { Document, Schema } from 'mongoose';

export type BackorderStatus = 'OPEN' | 'IN_REPLENISHMENT' | 'PARTIALLY_FULFILLED' | 'RESOLVED' | 'CANCELLED';

export interface IBackorder extends Document {
  backorderNumber: string;
  quotationId: mongoose.Types.ObjectId;
  customerId: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  productName: string;
  quantityBackordered: number;
  quantityFulfilled: number;
  status: BackorderStatus;
  estimatedRestockDate?: Date;
  resolvedAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BackorderSchema = new Schema<IBackorder>(
  {
    backorderNumber: { type: String, required: true, unique: true, uppercase: true },
    quotationId: { type: Schema.Types.ObjectId, ref: 'Quotation', required: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    productName: { type: String, required: true },
    quantityBackordered: { type: Number, required: true, min: 1 },
    quantityFulfilled: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['OPEN', 'IN_REPLENISHMENT', 'PARTIALLY_FULFILLED', 'RESOLVED', 'CANCELLED'],
      default: 'OPEN',
    },
    estimatedRestockDate: {
      type: Date,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
    resolvedAt: { type: Date, default: null },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

export const Backorder = mongoose.model<IBackorder>('Backorder', BackorderSchema);
