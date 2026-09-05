import { Request, Response } from 'express';
import { AuditService } from '../services/auditService';
import { AuthRequest } from '../middleware/authMiddleware';

export class AuditController {
  public static async getLogs(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { entityType, entityId, actorRole, limit } = req.query;
      const logs = await AuditService.getLogs({
        entityType: entityType ? String(entityType) : undefined,
        entityId: entityId ? String(entityId) : undefined,
        actorRole: actorRole ? String(actorRole) : undefined,
        limit: limit ? Number(limit) : 150,
      });

      res.json({ success: true, count: logs.length, data: logs });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}
