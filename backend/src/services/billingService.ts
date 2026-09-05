import { Invoice, IInvoice } from '../models/Invoice';
import { Subscription, ISubscription } from '../models/Subscription';
import { Payment, IPayment } from '../models/Payment';
import { Quotation, IQuotation } from '../models/Quotation';
import { Product } from '../models/Product';
import { AuditService } from './auditService';
import mongoose from 'mongoose';

export interface BillingGenerationResult {
  invoices: IInvoice[];
  subscriptions: ISubscription[];
  oneTimeTotal: number;
  recurringMonthlyTotal: number;
}

export class BillingService {
  public static async generateBillingForQuotation(
    quotationId: string,
    userId?: string,
    userName: string = 'System'
  ): Promise<BillingGenerationResult> {
    let quotation;
    if (mongoose.Types.ObjectId.isValid(quotationId)) {
      quotation = await Quotation.findById(quotationId);
    }
    if (!quotation) {
      quotation = await Quotation.findOne({ quoteNumber: quotationId.trim() });
    }
    if (!quotation) {
      throw new Error(`Quotation '${quotationId}' not found`);
    }

    const oneTimeItems = quotation.items.filter((i) => i.billingType === 'ONE_TIME');
    const recurringItems = quotation.items.filter((i) => i.billingType === 'RECURRING');

    const generatedInvoices: IInvoice[] = [];
    const generatedSubscriptions: ISubscription[] = [];

    // 1. Generate One-Time Invoice if one-time items exist
    if (oneTimeItems.length > 0) {
      const invoiceSubtotal = oneTimeItems.reduce((sum, i) => sum + (i.quantity * i.unitPrice), 0);
      const invoiceDiscount = oneTimeItems.reduce((sum, i) => sum + i.discountAmount, 0);
      const invoiceTaxable = oneTimeItems.reduce((sum, i) => sum + i.taxableAmount, 0);
      const invoiceTax = oneTimeItems.reduce((sum, i) => sum + i.taxAmount, 0);
      const invoiceTotal = invoiceTaxable + invoiceTax;

      const invoiceItems = oneTimeItems.map((i) => ({
        productId: i.productId,
        productName: i.productName,
        sku: i.sku,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        discountAmount: i.discountAmount,
        taxableAmount: i.taxableAmount,
        taxAmount: i.taxAmount,
        lineTotal: i.lineTotal,
        billingType: 'ONE_TIME' as const,
      }));

      const invoice = await Invoice.create({
        invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
        quotationId: quotation._id,
        customerId: quotation.customerId,
        type: 'ONE_TIME',
        status: 'ISSUED',
        items: invoiceItems,
        subtotal: Math.round(invoiceSubtotal * 100) / 100,
        discountAmount: Math.round(invoiceDiscount * 100) / 100,
        taxableAmount: Math.round(invoiceTaxable * 100) / 100,
        taxAmount: Math.round(invoiceTax * 100) / 100,
        totalAmount: Math.round(invoiceTotal * 100) / 100,
        paidAmount: 0,
        dueBalance: Math.round(invoiceTotal * 100) / 100,
        issueDate: new Date(),
        dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        notes: `Generated from Quotation ${quotation.quoteNumber}`,
      });

      generatedInvoices.push(invoice);
    }

    // 2. Generate Recurring Subscription records
    for (const item of recurringItems) {
      const subNumber = `SUB-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
      const subscription = await Subscription.create({
        subscriptionNumber: subNumber,
        customerId: quotation.customerId,
        quotationId: quotation._id,
        productId: item.productId,
        productName: item.productName,
        billingFrequency: 'MONTHLY',
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        recurringAmount: item.taxableAmount,
        taxAmount: item.taxAmount,
        totalRecurringAmount: item.lineTotal,
        status: 'ACTIVE',
        startDate: new Date(),
        nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        renewalDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      });

      generatedSubscriptions.push(subscription);
    }

    quotation.stage = 'BILLING_IN_PROGRESS';
    await quotation.save();

    await AuditService.log({
      actorId: userId,
      actorName: userName,
      actorRole: 'FINANCE_OPS',
      action: 'BILLING_GENERATED',
      entityType: 'INVOICE',
      entityId: quotation._id.toString(),
      entityNumber: quotation.quoteNumber,
      afterState: {
        invoicesCreated: generatedInvoices.length,
        subscriptionsCreated: generatedSubscriptions.length,
      },
      notes: `Hybrid billing generated: ${generatedInvoices.length} invoice(s), ${generatedSubscriptions.length} subscription(s).`,
    });

    const oneTimeTotal = generatedInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
    const recurringMonthlyTotal = generatedSubscriptions.reduce((sum, sub) => sum + sub.totalRecurringAmount, 0);

    return {
      invoices: generatedInvoices,
      subscriptions: generatedSubscriptions,
      oneTimeTotal,
      recurringMonthlyTotal,
    };
  }

  public static async recordPayment(
    invoiceId: string,
    amount: number,
    paymentMethod: 'CASH' | 'BANK_TRANSFER' | 'CREDIT_NOTE' | 'CHEQUE',
    referenceNumber: string = '',
    userId?: string,
    userName: string = 'Finance'
  ): Promise<{ payment: IPayment; invoice: IInvoice }> {
    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      throw new Error(`Invoice ${invoiceId} not found`);
    }

    if (amount <= 0) {
      throw new Error('Payment amount must be greater than 0');
    }

    if (amount > invoice.dueBalance) {
      throw new Error(`Payment amount (₹${amount}) exceeds remaining due balance (₹${invoice.dueBalance})`);
    }

    const paymentNumber = `PAY-${Date.now().toString().slice(-6)}`;
    const payment = await Payment.create({
      paymentNumber,
      invoiceId: invoice._id,
      customerId: invoice.customerId,
      amount: Math.round(amount * 100) / 100,
      paymentMethod,
      referenceNumber: referenceNumber || `REF-${Math.floor(100000 + Math.random() * 900000)}`,
      recordedById: userId ? new mongoose.Types.ObjectId(userId) : null,
      paidAt: new Date(),
    });

    const beforeBalance = invoice.dueBalance;
    invoice.paidAmount = Math.round((invoice.paidAmount + amount) * 100) / 100;
    invoice.dueBalance = Math.max(0, Math.round((invoice.totalAmount - invoice.paidAmount) * 100) / 100);

    if (invoice.dueBalance === 0) {
      invoice.status = 'PAID';
      invoice.paidDate = new Date();
    } else {
      invoice.status = 'PARTIALLY_PAID';
    }

    await invoice.save();

    // If quotation associated and all invoices paid -> update quotation status
    if (invoice.quotationId && invoice.status === 'PAID') {
      const remainingUnpaid = await Invoice.countDocuments({
        quotationId: invoice.quotationId,
        status: { $ne: 'PAID' },
      });
      if (remainingUnpaid === 0) {
        await Quotation.findByIdAndUpdate(invoice.quotationId, {
          stage: 'CLOSED',
        });
      }
    }

    await AuditService.log({
      actorId: userId,
      actorName: userName,
      actorRole: 'FINANCE_OPS',
      action: 'PAYMENT_RECORDED',
      entityType: 'INVOICE',
      entityId: invoice._id.toString(),
      entityNumber: invoice.invoiceNumber,
      beforeState: { dueBalance: beforeBalance },
      afterState: { paidAmount: invoice.paidAmount, dueBalance: invoice.dueBalance, status: invoice.status },
      notes: `Recorded ₹${amount} via ${paymentMethod}. Reference: ${payment.referenceNumber}`,
    });

    return { payment, invoice };
  }

  public static calculateProration(
    currentMonthlyRate: number,
    newMonthlyRate: number,
    dayOfChangeInMonth: number = 15,
    daysInMonth: number = 30
  ): {
    daysRemaining: number;
    proratedAmountDelta: number;
    explanation: string;
  } {
    const daysRemaining = Math.max(1, daysInMonth - dayOfChangeInMonth);
    const rateDifference = newMonthlyRate - currentMonthlyRate;
    const proratedAmountDelta = Math.round((rateDifference * (daysRemaining / daysInMonth)) * 100) / 100;

    const explanation = `Change applied on day ${dayOfChangeInMonth} of ${daysInMonth} (${daysRemaining} days remaining). ` +
      `Rate delta: ₹${rateDifference}/mo -> Prorated delta: ₹${proratedAmountDelta}`;

    return {
      daysRemaining,
      proratedAmountDelta,
      explanation,
    };
  }

  public static async modifySubscription(
    subscriptionId: string,
    newUnitPrice: number,
    newQuantity: number,
    notes: string = '',
    userId?: string,
    userName: string = 'Finance'
  ): Promise<ISubscription> {
    const subscription = await Subscription.findById(subscriptionId);
    if (!subscription) {
      throw new Error(`Subscription ${subscriptionId} not found`);
    }

    const oldTotal = subscription.totalRecurringAmount;
    const newSubtotal = newUnitPrice * newQuantity;
    const tax = Math.round((newSubtotal * 0.18) * 100) / 100;
    const newTotal = newSubtotal + tax;

    const now = new Date();
    const dayOfMonth = now.getDate();
    const daysInCurrentMonth = 30;
    const proration = this.calculateProration(oldTotal, newTotal, dayOfMonth, daysInCurrentMonth);

    subscription.prorationHistory.push({
      changeType: newTotal > oldTotal ? 'UPGRADE' : 'DOWNGRADE',
      oldRate: oldTotal,
      newRate: newTotal,
      effectiveDate: now,
      daysRemainingInCycle: proration.daysRemaining,
      totalDaysInCycle: daysInCurrentMonth,
      proratedDeltaAmount: proration.proratedAmountDelta,
      creditNoteGenerated: proration.proratedAmountDelta < 0,
      notes: notes || proration.explanation,
    });

    subscription.unitPrice = newUnitPrice;
    subscription.quantity = newQuantity;
    subscription.recurringAmount = newSubtotal;
    subscription.taxAmount = tax;
    subscription.totalRecurringAmount = newTotal;
    subscription.status = 'MODIFIED';

    await subscription.save();

    await AuditService.log({
      actorId: userId,
      actorName: userName,
      actorRole: 'FINANCE_OPS',
      action: 'SUBSCRIPTION_MODIFIED',
      entityType: 'SUBSCRIPTION',
      entityId: subscription._id.toString(),
      entityNumber: subscription.subscriptionNumber,
      beforeState: { rate: oldTotal },
      afterState: { rate: newTotal, proratedDelta: proration.proratedAmountDelta },
      notes: proration.explanation,
    });

    return subscription;
  }
}
