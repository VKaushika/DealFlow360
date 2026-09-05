import mongoose, { Document, Schema } from 'mongoose';

export interface INotification extends Document {
  recipientRole?: 'ADMIN' | 'SALES_REP' | 'SALES_MANAGER' | 'FINANCE_OPS' | 'CUSTOMER';
  recipientUserId?: mongoose.Types.ObjectId;
  title: string;
  message: string;
  type: 'INFO' | 'WARNING' | 'ALERT' | 'SUCCESS';
  link?: string;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    recipientRole: {
      type: String,
      enum: ['ADMIN', 'SALES_REP', 'SALES_MANAGER', 'FINANCE_OPS', 'CUSTOMER'],
      default: null,
    },
    recipientUserId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: ['INFO', 'WARNING', 'ALERT', 'SUCCESS'],
      default: 'INFO',
    },
    link: { type: String, default: '' },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);
