import mongoose, { Document, Schema } from 'mongoose';

export type SubscriptionStatus = 'ACTIVE' | 'PAUSED' | 'MODIFIED' | 'CANCELLED' | 'EXPIRED';

export interface IProrationEntry {
  _id?: mongoose.Types.ObjectId;
  changeType: 'UPGRADE' | 'DOWNGRADE' | 'QUANTITY_CHANGE' | 'CANCELLATION';
  oldRate: number;
  newRate: number;
  effectiveDate: Date;
  daysRemainingInCycle: number;
  totalDaysInCycle: number;
  proratedDeltaAmount: number;
  creditNoteGenerated: boolean;
  notes: string;
}

export interface ISubscription extends Document {
  subscriptionNumber: string;
  customerId: mongoose.Types.ObjectId;
  quotationId: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  productName: string;
  planId?: mongoose.Types.ObjectId;
  billingFrequency: 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  quantity: number;
  unitPrice: number;
  recurringAmount: number; // recurring subtotal
  taxAmount: number;
  totalRecurringAmount: number;
  status: SubscriptionStatus;
  startDate: Date;
  nextBillingDate: Date;
  renewalDate: Date;
  prorationHistory: IProrationEntry[];
  cancellationDate?: Date;
  cancellationReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ProrationSchema = new Schema<IProrationEntry>(
  {
    changeType: {
      type: String,
      enum: ['UPGRADE', 'DOWNGRADE', 'QUANTITY_CHANGE', 'CANCELLATION'],
      required: true,
    },
    oldRate: { type: Number, required: true },
    newRate: { type: Number, required: true },
    effectiveDate: { type: Date, default: Date.now },
    daysRemainingInCycle: { type: Number, required: true },
    totalDaysInCycle: { type: Number, required: true },
    proratedDeltaAmount: { type: Number, required: true },
    creditNoteGenerated: { type: Boolean, default: false },
    notes: { type: String, default: '' },
  },
  { _id: true }
);

const SubscriptionSchema = new Schema<ISubscription>(
  {
    subscriptionNumber: { type: String, required: true, unique: true, uppercase: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
    quotationId: { type: Schema.Types.ObjectId, ref: 'Quotation', required: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    productName: { type: String, required: true },
    planId: { type: Schema.Types.ObjectId, ref: 'SubscriptionPlan', default: null },
    billingFrequency: {
      type: String,
      enum: ['MONTHLY', 'QUARTERLY', 'YEARLY'],
      default: 'MONTHLY',
    },
    quantity: { type: Number, default: 1, min: 1 },
    unitPrice: { type: Number, required: true },
    recurringAmount: { type: Number, required: true },
    taxAmount: { type: Number, default: 0 },
    totalRecurringAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: ['ACTIVE', 'PAUSED', 'MODIFIED', 'CANCELLED', 'EXPIRED'],
      default: 'ACTIVE',
    },
    startDate: { type: Date, default: Date.now },
    nextBillingDate: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
    renewalDate: {
      type: Date,
      default: () => new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    },
    prorationHistory: [ProrationSchema],
    cancellationDate: { type: Date, default: null },
    cancellationReason: { type: String, default: '' },
  },
  { timestamps: true }
);

export const Subscription = mongoose.model<ISubscription>('Subscription', SubscriptionSchema);
