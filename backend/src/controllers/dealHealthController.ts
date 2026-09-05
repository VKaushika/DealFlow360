import { Request, Response } from 'express';
import { DealHealthService } from '../services/dealHealthService';
import { Notification } from '../models/Notification';
import { AuthRequest } from '../middleware/authMiddleware';

export class DealHealthController {
  public static async getHealthOverview(req: AuthRequest, res: Response): Promise<void> {
    try {
      const activeEvents = await DealHealthService.scanAndSyncDealHealth();
      const stalledCount = activeEvents.filter((e) => e.eventType === 'STALLED').length;
      const discountAnomaliesCount = activeEvents.filter((e) => e.eventType === 'DISCOUNT_ANOMALY').length;
      const deliveryRiskCount = activeEvents.filter((e) => e.eventType === 'DELIVERY_RISK').length;
      const negotiationDelayCount = activeEvents.filter((e) => e.eventType === 'NEGOTIATION_DELAY').length;

      res.json({
        success: true,
        summary: {
          totalActiveAnomalies: activeEvents.length,
          stalledCount,
          discountAnomaliesCount,
          deliveryRiskCount,
          negotiationDelayCount,
        },
        data: activeEvents,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async resolveEvent(req: AuthRequest, res: Response): Promise<void> {
    try {
      const event = await DealHealthService.resolveHealthEvent(req.params.id, req.user?.id);
      if (!event) {
        res.status(404).json({ success: false, message: 'Health event not found' });
        return;
      }
      res.json({ success: true, message: 'Health event resolved', data: event });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async triggerNudge(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { recipientRole, title, message, link } = req.body;
      const notification = await Notification.create({
        recipientRole: recipientRole || 'SALES_REP',
        title: title || 'Deal Health Alert / Action Required',
        message: message || 'Please take action on your pending deal items.',
        type: 'ALERT',
        link: link || '',
      });

      res.status(201).json({ success: true, message: 'Automated nudge dispatched', data: notification });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}
