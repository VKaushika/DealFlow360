import mongoose, { Document, Schema } from 'mongoose';

export type InvoiceStatus = 'DRAFT' | 'ISSUED' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE' | 'CANCELLED';
export type InvoiceType = 'ONE_TIME' | 'SUBSCRIPTION_RECURRING' | 'COMBINED';

export interface IInvoiceItem {
  _id?: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  taxableAmount: number;
  taxAmount: number;
  lineTotal: number;
  billingType: 'ONE_TIME' | 'RECURRING';
}

export interface IInvoice extends Document {
  invoiceNumber: string;
  quotationId?: mongoose.Types.ObjectId;
  customerId: mongoose.Types.ObjectId;
  type: InvoiceType;
  status: InvoiceStatus;
  items: IInvoiceItem[];
  subtotal: number;
  discountAmount: number;
  taxableAmount: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  dueBalance: number;
  issueDate: Date;
  dueDate: Date;
  paidDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const InvoiceItemSchema = new Schema<IInvoiceItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    productName: { type: String, required: true },
    sku: { type: String, required: true },
    quantity: { type: Number, required: true },
    unitPrice: { type: Number, required: true },
    discountAmount: { type: Number, default: 0 },
    taxableAmount: { type: Number, required: true },
    taxAmount: { type: Number, default: 0 },
    lineTotal: { type: Number, required: true },
    billingType: { type: String, enum: ['ONE_TIME', 'RECURRING'], default: 'ONE_TIME' },
  },
  { _id: true }
);

const InvoiceSchema = new Schema<IInvoice>(
  {
    invoiceNumber: { type: String, required: true, unique: true, uppercase: true },
    quotationId: { type: Schema.Types.ObjectId, ref: 'Quotation', default: null },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
    type: {
      type: String,
      enum: ['ONE_TIME', 'SUBSCRIPTION_RECURRING', 'COMBINED'],
      default: 'ONE_TIME',
    },
    status: {
      type: String,
      enum: ['DRAFT', 'ISSUED', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED'],
      default: 'ISSUED',
    },
    items: [InvoiceItemSchema],
    subtotal: { type: Number, required: true },
    discountAmount: { type: Number, default: 0 },
    taxableAmount: { type: Number, required: true },
    taxAmount: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    paidAmount: { type: Number, default: 0 },
    dueBalance: { type: Number, required: true },
    issueDate: { type: Date, default: Date.now },
    dueDate: {
      type: Date,
      default: () => new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
    },
    paidDate: { type: Date, default: null },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

export const Invoice = mongoose.model<IInvoice>('Invoice', InvoiceSchema);
