import mongoose, { Document, Schema } from 'mongoose';

export type UserRole = 'ADMIN' | 'SALES_REP' | 'SALES_MANAGER' | 'FINANCE_OPS' | 'CUSTOMER';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  department?: string;
  customerId?: mongoose.Types.ObjectId; // For CUSTOMER role mapping
  isActive: boolean;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ['ADMIN', 'SALES_REP', 'SALES_MANAGER', 'FINANCE_OPS', 'CUSTOMER'],
      default: 'SALES_REP',
      required: true,
    },
    department: { type: String, default: 'Sales' },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', default: null },
    isActive: { type: Boolean, default: true },
    avatar: { type: String, default: '' },
    passwordResetToken: { type: String, default: '' },
    passwordResetExpires: { type: Date, default: null },
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>('User', UserSchema);
