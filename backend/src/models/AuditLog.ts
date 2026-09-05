import mongoose, { Document, Schema } from 'mongoose';

export interface IAuditLog extends Document {
  actorId?: mongoose.Types.ObjectId;
  actorName: string;
  actorRole: string;
  action: string; // e.g. "QUOTATION_CREATED", "DISCOUNT_EVALUATED", "APPROVAL_DECIDED", "FULFILLMENT_ALLOCATED", "PAYMENT_RECORDED", "NEGOTIATION_COUNTER"
  entityType: 'QUOTATION' | 'APPROVAL' | 'FULFILLMENT' | 'INVOICE' | 'SUBSCRIPTION' | 'NEGOTIATION' | 'PRODUCT' | 'CUSTOMER' | 'RULE';
  entityId: string;
  entityNumber?: string;
  beforeState?: Record<string, any>;
  afterState?: Record<string, any>;
  notes?: string;
  ipAddress?: string;
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    actorId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    actorName: { type: String, required: true },
    actorRole: { type: String, required: true },
    action: { type: String, required: true },
    entityType: {
      type: String,
      enum: [
        'QUOTATION',
        'APPROVAL',
        'FULFILLMENT',
        'INVOICE',
        'SUBSCRIPTION',
        'NEGOTIATION',
        'PRODUCT',
        'CUSTOMER',
        'RULE',
      ],
      required: true,
    },
    entityId: { type: String, required: true },
    entityNumber: { type: String, default: '' },
    beforeState: { type: Schema.Types.Mixed, default: null },
    afterState: { type: Schema.Types.Mixed, default: null },
    notes: { type: String, default: '' },
    ipAddress: { type: String, default: '127.0.0.1' },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

AuditLogSchema.index({ entityType: 1, entityId: 1 });
AuditLogSchema.index({ timestamp: -1 });

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
