import mongoose, { Document, Schema } from 'mongoose';

export type HealthEventType = 'STALLED' | 'DELIVERY_RISK' | 'DISCOUNT_ANOMALY' | 'NEGOTIATION_DELAY';
export type HealthSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface IDealHealthEvent extends Document {
  quotationId: mongoose.Types.ObjectId;
  customerId: mongoose.Types.ObjectId;
  eventType: HealthEventType;
  severity: HealthSeverity;
  title: string;
  description: string;
  metrics: {
    daysInactive?: number;
    discountPct?: number;
    marginLossAmount?: number;
    delayedDays?: number;
    backorderedCount?: number;
  };
  suggestedAction: string;
  isResolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const DealHealthEventSchema = new Schema<IDealHealthEvent>(
  {
    quotationId: { type: Schema.Types.ObjectId, ref: 'Quotation', required: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
    eventType: {
      type: String,
      enum: ['STALLED', 'DELIVERY_RISK', 'DISCOUNT_ANOMALY', 'NEGOTIATION_DELAY'],
      required: true,
    },
    severity: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'MEDIUM',
    },
    title: { type: String, required: true },
    description: { type: String, required: true },
    metrics: {
      daysInactive: { type: Number, default: 0 },
      discountPct: { type: Number, default: 0 },
      marginLossAmount: { type: Number, default: 0 },
      delayedDays: { type: Number, default: 0 },
      backorderedCount: { type: Number, default: 0 },
    },
    suggestedAction: { type: String, default: '' },
    isResolved: { type: Boolean, default: false },
    resolvedAt: { type: Date, default: null },
    resolvedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

export const DealHealthEvent = mongoose.model<IDealHealthEvent>('DealHealthEvent', DealHealthEventSchema);
