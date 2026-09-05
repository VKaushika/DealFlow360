import mongoose, { Document, Schema } from 'mongoose';

export type PaymentMethod = 'CASH' | 'BANK_TRANSFER' | 'CREDIT_NOTE' | 'CHEQUE';

export interface IPayment extends Document {
  paymentNumber: string;
  invoiceId: mongoose.Types.ObjectId;
  customerId: mongoose.Types.ObjectId;
  amount: number;
  paymentMethod: PaymentMethod;
  referenceNumber: string;
  recordedById?: mongoose.Types.ObjectId;
  notes?: string;
  paidAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    paymentNumber: { type: String, required: true, unique: true, uppercase: true },
    invoiceId: { type: Schema.Types.ObjectId, ref: 'Invoice', required: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
    amount: { type: Number, required: true, min: 0.01 },
    paymentMethod: {
      type: String,
      enum: ['CASH', 'BANK_TRANSFER', 'CREDIT_NOTE', 'CHEQUE'],
      default: 'BANK_TRANSFER',
      required: true,
    },
    referenceNumber: { type: String, default: '' },
    recordedById: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    notes: { type: String, default: '' },
    paidAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const Payment = mongoose.model<IPayment>('Payment', PaymentSchema);
