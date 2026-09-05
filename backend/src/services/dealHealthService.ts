import { DealHealthEvent, IDealHealthEvent } from '../models/DealHealthEvent';
import { Quotation } from '../models/Quotation';
import { Approval } from '../models/Approval';
import { Backorder } from '../models/Backorder';
import { Negotiation } from '../models/Negotiation';
import mongoose from 'mongoose';

export class DealHealthService {
  public static async scanAndSyncDealHealth(): Promise<IDealHealthEvent[]> {
    const activeQuotations = await Quotation.find({
      stage: { $nin: ['CLOSED', 'CANCELLED', 'REJECTED'] },
    }).populate('customerId salesRepId');

    const now = Date.now();

    for (const quote of activeQuotations) {
      const cust = quote.customerId as any;

      // 1. Check for STALLED deals (Pending approval > 24 hours or inactive draft > 5 days)
      if (quote.stage === 'PENDING_APPROVAL' && quote.currentApprovalId) {
        const approval = await Approval.findById(quote.currentApprovalId);
        if (approval && approval.status === 'PENDING') {
          const hoursPending = (now - new Date(approval.requestedAt).getTime()) / (1000 * 60 * 60);
          if (hoursPending > 12) {
            await DealHealthEvent.findOneAndUpdate(
              { quotationId: quote._id, eventType: 'STALLED', isResolved: false },
              {
                customerId: quote.customerId,
                eventType: 'STALLED',
                severity: hoursPending > 48 ? 'CRITICAL' : 'HIGH',
                title: `Deal ${quote.quoteNumber} Stalled in Approval Queue`,
                description: `Pending ${approval.steps[approval.currentStepIndex]?.role || 'Approver'} sign-off for ${Math.round(hoursPending)} hours.`,
                metrics: { daysInactive: Math.round((hoursPending / 24) * 10) / 10 },
                suggestedAction: 'Send automated escalation nudge to Sales Manager / Finance.',
              },
              { upsert: true, new: true }
            );
          }
        }
      }

      // 2. Check for DISCOUNT_ANOMALY
      if (quote.riskLevel === 'HIGH' || quote.riskLevel === 'CRITICAL' || quote.discountAmount > 50000) {
        await DealHealthEvent.findOneAndUpdate(
          { quotationId: quote._id, eventType: 'DISCOUNT_ANOMALY', isResolved: false },
          {
            customerId: quote.customerId,
            eventType: 'DISCOUNT_ANOMALY',
            severity: quote.riskLevel === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
            title: `Discount Anomaly on ${quote.quoteNumber}`,
            description: `Significant margin leakage risk: ${quote.discountAmount > 0 ? `₹${quote.discountAmount} discounted` : ''} (Risk Score: ${quote.riskScore}/100, Margin: ${quote.grossMarginPct}%).`,
            metrics: {
              discountPct: Math.round((quote.discountAmount / (quote.subtotal || 1)) * 100),
              marginLossAmount: quote.discountAmount,
            },
            suggestedAction: 'Review line item discount ceilings and verify customer volume justification.',
          },
          { upsert: true, new: true }
        );
      }

      // 3. Check for DELIVERY_RISK (Backorders exist)
      const openBackorders = await Backorder.find({
        quotationId: quote._id,
        status: { $in: ['OPEN', 'IN_REPLENISHMENT'] },
      });

      if (openBackorders.length > 0) {
        const totalBackorderedUnits = openBackorders.reduce((acc, bo) => acc + bo.quantityBackordered, 0);
        await DealHealthEvent.findOneAndUpdate(
          { quotationId: quote._id, eventType: 'DELIVERY_RISK', isResolved: false },
          {
            customerId: quote.customerId,
            eventType: 'DELIVERY_RISK',
            severity: totalBackorderedUnits > 10 ? 'HIGH' : 'MEDIUM',
            title: `Inventory Shortfall / Delivery Risk on ${quote.quoteNumber}`,
            description: `${openBackorders.length} product(s) backordered with total ${totalBackorderedUnits} units pending warehouse restock.`,
            metrics: { backorderedCount: totalBackorderedUnits },
            suggestedAction: 'Expedite replenishment purchase order or consolidate stock from regional depots.',
          },
          { upsert: true, new: true }
        );
      }

      // 4. Check for NEGOTIATION_DELAY
      const neg = await Negotiation.findOne({ quotationId: quote._id, status: 'COUNTER_PROPOSED' });
      if (neg) {
        const lastMsg = neg.messages[neg.messages.length - 1];
        if (lastMsg && lastMsg.senderRole === 'CUSTOMER') {
          const hoursAwaiting = (now - new Date(lastMsg.timestamp).getTime()) / (1000 * 60 * 60);
          if (hoursAwaiting > 12) {
            await DealHealthEvent.findOneAndUpdate(
              { quotationId: quote._id, eventType: 'NEGOTIATION_DELAY', isResolved: false },
              {
                customerId: quote.customerId,
                eventType: 'NEGOTIATION_DELAY',
                severity: 'MEDIUM',
                title: `Customer Counter-Offer Awaiting Action on ${quote.quoteNumber}`,
                description: `Customer submitted a counter discount proposal (${lastMsg.proposedDiscountPct}%) ${Math.round(hoursAwaiting)} hours ago with no response.`,
                metrics: { daysInactive: Math.round((hoursAwaiting / 24) * 10) / 10 },
                suggestedAction: 'Respond to customer counter-proposal or re-evaluate quote terms.',
              },
              { upsert: true, new: true }
            );
          }
        }
      }
    }

    return await DealHealthEvent.find({ isResolved: false })
      .populate('quotationId customerId')
      .sort({ severity: -1, createdAt: -1 });
  }

  public static async resolveHealthEvent(eventId: string, userId?: string): Promise<IDealHealthEvent | null> {
    return await DealHealthEvent.findByIdAndUpdate(
      eventId,
      {
        isResolved: true,
        resolvedAt: new Date(),
        resolvedBy: userId ? new mongoose.Types.ObjectId(userId) : null,
      },
      { new: true }
    );
  }
}
