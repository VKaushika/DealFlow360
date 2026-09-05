import mongoose, { Document, Schema } from 'mongoose';

export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'REVISION_REQUESTED';
export type ApprovalStepStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SKIPPED';

export interface IApprovalStep {
  _id?: mongoose.Types.ObjectId;
  stepOrder: number;
  role: 'SALES_MANAGER' | 'FINANCE_OPS' | 'ADMIN';
  status: ApprovalStepStatus;
  approverId?: mongoose.Types.ObjectId;
  approverName?: string;
  actionDate?: Date;
  notes?: string;
}

export interface IApproval extends Document {
  quotationId: mongoose.Types.ObjectId;
  customerId: mongoose.Types.ObjectId;
  salesRepId: mongoose.Types.ObjectId;
  status: ApprovalStatus;
  currentStepIndex: number;
  totalSteps: number;
  steps: IApprovalStep[];
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  riskScore: number;
  riskSummary: string;
  violations: Array<{
    productName: string;
    appliedDiscountPct: number;
    allowedDiscountPct: number;
    deltaPct: number;
  }>;
  requestedAt: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ApprovalStepSchema = new Schema<IApprovalStep>(
  {
    stepOrder: { type: Number, required: true },
    role: {
      type: String,
      enum: ['SALES_MANAGER', 'FINANCE_OPS', 'ADMIN'],
      required: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED', 'SKIPPED'],
      default: 'PENDING',
    },
    approverId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    approverName: { type: String, default: '' },
    actionDate: { type: Date, default: null },
    notes: { type: String, default: '' },
  },
  { _id: true }
);

const ApprovalSchema = new Schema<IApproval>(
  {
    quotationId: { type: Schema.Types.ObjectId, ref: 'Quotation', required: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
    salesRepId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED', 'REVISION_REQUESTED'],
      default: 'PENDING',
      required: true,
    },
    currentStepIndex: { type: Number, default: 0 },
    totalSteps: { type: Number, default: 1 },
    steps: [ApprovalStepSchema],
    riskLevel: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'MEDIUM',
    },
    riskScore: { type: Number, default: 0 },
    riskSummary: { type: String, default: '' },
    violations: [
      {
        productName: String,
        appliedDiscountPct: Number,
        allowedDiscountPct: Number,
        deltaPct: Number,
      },
    ],
    requestedAt: { type: Date, default: Date.now },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const Approval = mongoose.model<IApproval>('Approval', ApprovalSchema);
