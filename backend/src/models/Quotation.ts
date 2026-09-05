import mongoose, { Document, Schema } from 'mongoose';

export type QuotationStage =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'REVISION_REQUESTED'
  | 'REJECTED'
  | 'READY_FOR_FULFILLMENT'
  | 'FULFILLMENT_IN_PROGRESS'
  | 'FULFILLED'
  | 'BILLING_IN_PROGRESS'
  | 'CUSTOMER_CONFIRMED'
  | 'CLOSED'
  | 'CANCELLED';

export interface IQuotationItem {
  _id?: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  productName: string;
  sku: string;
  categoryName: string;
  type: 'GOODS' | 'SERVICE' | 'COMBO';
  billingType: 'ONE_TIME' | 'RECURRING';
  quantity: number;
  unitPrice: number;
  unitCost: number;
  discountPct: number;
  discountAmount: number;
  taxableAmount: number;
  taxRate: number;
  taxAmount: number;
  lineTotal: number;
  lineCost: number;
  lineGrossMargin: number;
  lineMarginPct: number;
  allowedDiscountCeiling: number;
  isDiscountViolated: boolean;
  discountDeltaPct: number; // e.g. applied - allowed
}

export interface IQuotation extends Document {
  quoteNumber: string;
  title: string;
  customerId: mongoose.Types.ObjectId;
  salesRepId: mongoose.Types.ObjectId;
  stage: QuotationStage;
  items: IQuotationItem[];
  subtotal: number;
  discountAmount: number;
  taxableAmount: number;
  taxAmount: number;
  totalAmount: number;
  totalCost: number;
  grossMarginAmount: number;
  grossMarginPct: number;
  // Governance / Risk
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  riskScore: number;
  riskReasons: string[];
  approvalRequired: boolean;
  currentApprovalId?: mongoose.Types.ObjectId;
  // Metadata & notes
  customerNotes?: string;
  internalNotes?: string;
  negotiationActive: boolean;
  isCustomerConfirmed: boolean;
  confirmedAt?: Date;
  validUntil: Date;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

const QuotationItemSchema = new Schema<IQuotationItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    productName: { type: String, required: true },
    sku: { type: String, required: true },
    categoryName: { type: String, default: 'General' },
    type: { type: String, enum: ['GOODS', 'SERVICE', 'COMBO'], default: 'GOODS' },
    billingType: { type: String, enum: ['ONE_TIME', 'RECURRING'], default: 'ONE_TIME' },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    unitCost: { type: Number, required: true, min: 0 },
    discountPct: { type: Number, default: 0, min: 0, max: 100 },
    discountAmount: { type: Number, default: 0 },
    taxableAmount: { type: Number, default: 0 },
    taxRate: { type: Number, default: 18 },
    taxAmount: { type: Number, default: 0 },
    lineTotal: { type: Number, default: 0 },
    lineCost: { type: Number, default: 0 },
    lineGrossMargin: { type: Number, default: 0 },
    lineMarginPct: { type: Number, default: 0 },
    allowedDiscountCeiling: { type: Number, default: 0 },
    isDiscountViolated: { type: Boolean, default: false },
    discountDeltaPct: { type: Number, default: 0 },
  },
  { _id: true }
);

const QuotationSchema = new Schema<IQuotation>(
  {
    quoteNumber: { type: String, required: true, unique: true, uppercase: true },
    title: { type: String, default: 'New Deal' },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
    salesRepId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    stage: {
      type: String,
      enum: [
        'DRAFT',
        'SUBMITTED',
        'PENDING_APPROVAL',
        'APPROVED',
        'REVISION_REQUESTED',
        'REJECTED',
        'READY_FOR_FULFILLMENT',
        'FULFILLMENT_IN_PROGRESS',
        'FULFILLED',
        'BILLING_IN_PROGRESS',
        'CUSTOMER_CONFIRMED',
        'CLOSED',
        'CANCELLED',
      ],
      default: 'DRAFT',
      required: true,
    },
    items: [QuotationItemSchema],
    subtotal: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    taxableAmount: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },
    totalCost: { type: Number, default: 0 },
    grossMarginAmount: { type: Number, default: 0 },
    grossMarginPct: { type: Number, default: 0 },
    riskLevel: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'LOW',
    },
    riskScore: { type: Number, default: 0 },
    riskReasons: [{ type: String }],
    approvalRequired: { type: Boolean, default: false },
    currentApprovalId: { type: Schema.Types.ObjectId, ref: 'Approval', default: null },
    customerNotes: { type: String, default: '' },
    internalNotes: { type: String, default: '' },
    negotiationActive: { type: Boolean, default: false },
    isCustomerConfirmed: { type: Boolean, default: false },
    confirmedAt: { type: Date, default: null },
    validUntil: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
    version: { type: Number, default: 1 },
  },
  { timestamps: true }
);

export const Quotation = mongoose.model<IQuotation>('Quotation', QuotationSchema);
