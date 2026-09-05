import mongoose, { Document, Schema } from 'mongoose';

export type FulfillmentStatus = 'PENDING' | 'ALLOCATED' | 'PARTIALLY_SHIPPED' | 'FULFILLED' | 'CANCELLED';

export interface IShipmentAllocation {
  _id?: mongoose.Types.ObjectId;
  warehouseId: mongoose.Types.ObjectId;
  warehouseName: string;
  items: Array<{
    productId: mongoose.Types.ObjectId;
    productName: string;
    quantity: number;
  }>;
  status: 'ALLOCATED' | 'DISPATCHED' | 'DELIVERED';
  trackingNumber?: string;
  estimatedCost: number;
  dispatchedAt?: Date;
  deliveredAt?: Date;
}

export interface IFulfillment extends Document {
  quotationId: mongoose.Types.ObjectId;
  customerId: mongoose.Types.ObjectId;
  status: FulfillmentStatus;
  allocations: IShipmentAllocation[];
  totalShipments: number;
  totalEstimatedCost: number;
  hasBackorders: boolean;
  notes?: string;
  allocatedBy?: mongoose.Types.ObjectId;
  allocatedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ShipmentItemSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    productName: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const ShipmentAllocationSchema = new Schema<IShipmentAllocation>(
  {
    warehouseId: { type: Schema.Types.ObjectId, ref: 'Warehouse', required: true },
    warehouseName: { type: String, required: true },
    items: [ShipmentItemSchema],
    status: {
      type: String,
      enum: ['ALLOCATED', 'DISPATCHED', 'DELIVERED'],
      default: 'ALLOCATED',
    },
    trackingNumber: { type: String, default: '' },
    estimatedCost: { type: Number, default: 0 },
    dispatchedAt: { type: Date, default: null },
    deliveredAt: { type: Date, default: null },
  },
  { _id: true }
);

const FulfillmentSchema = new Schema<IFulfillment>(
  {
    quotationId: { type: Schema.Types.ObjectId, ref: 'Quotation', required: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
    status: {
      type: String,
      enum: ['PENDING', 'ALLOCATED', 'PARTIALLY_SHIPPED', 'FULFILLED', 'CANCELLED'],
      default: 'PENDING',
      required: true,
    },
    allocations: [ShipmentAllocationSchema],
    totalShipments: { type: Number, default: 0 },
    totalEstimatedCost: { type: Number, default: 0 },
    hasBackorders: { type: Boolean, default: false },
    notes: { type: String, default: '' },
    allocatedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    allocatedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const Fulfillment = mongoose.model<IFulfillment>('Fulfillment', FulfillmentSchema);
