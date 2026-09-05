import mongoose, { Document, Schema } from 'mongoose';

export interface INegotiationMessage {
  _id?: mongoose.Types.ObjectId;
  senderId?: mongoose.Types.ObjectId;
  senderName: string;
  senderRole: 'CUSTOMER' | 'SALES_REP' | 'SALES_MANAGER' | 'ADMIN';
  proposedDiscountPct?: number;
  itemComments?: Array<{
    productId: mongoose.Types.ObjectId;
    productName: string;
    comment: string;
    requestedQty?: number;
  }>;
  message: string;
  timestamp: Date;
}

export interface INegotiation extends Document {
  quotationId: mongoose.Types.ObjectId;
  customerId: mongoose.Types.ObjectId;
  status: 'OPEN' | 'COUNTER_PROPOSED' | 'ACCEPTED' | 'REJECTED' | 'CLOSED';
  initialDiscountPct: number;
  latestProposedDiscountPct: number;
  messages: INegotiationMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const NegotiationMessageSchema = new Schema<INegotiationMessage>(
  {
    senderId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    senderName: { type: String, required: true },
    senderRole: {
      type: String,
      enum: ['CUSTOMER', 'SALES_REP', 'SALES_MANAGER', 'ADMIN'],
      required: true,
    },
    proposedDiscountPct: { type: Number, default: null },
    itemComments: [
      {
        productId: { type: Schema.Types.ObjectId, ref: 'Product' },
        productName: String,
        comment: String,
        requestedQty: Number,
      },
    ],
    message: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: true }
);

const NegotiationSchema = new Schema<INegotiation>(
  {
    quotationId: { type: Schema.Types.ObjectId, ref: 'Quotation', required: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
    status: {
      type: String,
      enum: ['OPEN', 'COUNTER_PROPOSED', 'ACCEPTED', 'REJECTED', 'CLOSED'],
      default: 'OPEN',
    },
    initialDiscountPct: { type: Number, default: 0 },
    latestProposedDiscountPct: { type: Number, default: 0 },
    messages: [NegotiationMessageSchema],
  },
  { timestamps: true }
);

export const Negotiation = mongoose.model<INegotiation>('Negotiation', NegotiationSchema);
