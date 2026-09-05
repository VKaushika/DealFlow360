import mongoose, { Document, Schema } from 'mongoose';

export type CustomerTier = 'BRONZE' | 'SILVER' | 'GOLD';

export interface ICustomer extends Document {
  name: string;
  code: string;
  email: string;
  phone: string;
  companyName: string;
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
  };
  tier: CustomerTier;
  industry: string;
  creditLimit: number;
  assignedSalesRepId?: mongoose.Types.ObjectId;
  portalAccessEnabled: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CustomerSchema = new Schema<ICustomer>(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, default: '' },
    companyName: { type: String, required: true, trim: true },
    address: {
      street: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      country: { type: String, default: 'India' },
      zipCode: { type: String, default: '' },
    },
    tier: {
      type: String,
      enum: ['BRONZE', 'SILVER', 'GOLD'],
      default: 'BRONZE',
      required: true,
    },
    industry: { type: String, default: 'Technology' },
    creditLimit: { type: Number, default: 500000 },
    assignedSalesRepId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    portalAccessEnabled: { type: Boolean, default: true },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

export const Customer = mongoose.model<ICustomer>('Customer', CustomerSchema);
