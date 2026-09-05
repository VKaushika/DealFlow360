import mongoose, { Document, Schema } from 'mongoose';

export interface IWarehouseStock extends Document {
  warehouseId: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  quantityOnHand: number;
  quantityReserved: number;
  quantityAvailable: number; // calculatedOnHand - reserved
  replenishmentThreshold: number;
  lastRestockedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const WarehouseStockSchema = new Schema<IWarehouseStock>(
  {
    warehouseId: { type: Schema.Types.ObjectId, ref: 'Warehouse', required: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    quantityOnHand: { type: Number, required: true, default: 0, min: 0 },
    quantityReserved: { type: Number, required: true, default: 0, min: 0 },
    quantityAvailable: { type: Number, required: true, default: 0, min: 0 },
    replenishmentThreshold: { type: Number, default: 5 },
    lastRestockedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Ensure fast lookup and uniqueness per warehouse+product
WarehouseStockSchema.index({ warehouseId: 1, productId: 1 }, { unique: true });

export const WarehouseStock = mongoose.model<IWarehouseStock>('WarehouseStock', WarehouseStockSchema);
