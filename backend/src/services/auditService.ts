import { AuditLog } from '../models/AuditLog';
import mongoose from 'mongoose';

export interface CreateAuditLogParams {
  actorId?: mongoose.Types.ObjectId | string;
  actorName: string;
  actorRole: string;
  action: string;
  // Broadened to include USER for auth events (login, register, etc.)
  entityType: 'QUOTATION' | 'APPROVAL' | 'FULFILLMENT' | 'INVOICE' | 'SUBSCRIPTION' | 'NEGOTIATION' | 'PRODUCT' | 'CUSTOMER' | 'RULE' | 'USER';
  entityId: string;
  entityNumber?: string;
  beforeState?: Record<string, any>;
  afterState?: Record<string, any>;
  notes?: string;
  ipAddress?: string;
}

export class AuditService {
  public static async log(params: CreateAuditLogParams): Promise<void> {
    try {
      // Map USER entityType to CUSTOMER for storage compatibility (schema enum)
      const storageEntityType = params.entityType === 'USER' ? 'CUSTOMER' : params.entityType;
      await AuditLog.create({
        actorId: params.actorId ? new mongoose.Types.ObjectId(params.actorId) : null,
        actorName: params.actorName,
        actorRole: params.actorRole,
        action: params.action,
        entityType: storageEntityType,
        entityId: params.entityId,
        entityNumber: params.entityNumber || '',
        beforeState: params.beforeState || null,
        afterState: params.afterState || null,
        notes: params.notes || '',
        ipAddress: params.ipAddress || '127.0.0.1',
        timestamp: new Date(),
      });
    } catch (error) {
      console.error('[AuditService] Failed to record audit log:', error);
    }
  }

  public static async getLogs(filter: {
    entityType?: string;
    entityId?: string;
    actorRole?: string;
    limit?: number;
  }) {
    const query: any = {};
    if (filter.entityType) query.entityType = filter.entityType;
    if (filter.entityId) query.entityId = filter.entityId;
    if (filter.actorRole) query.actorRole = filter.actorRole;

    const limit = filter.limit || 100;
    return await AuditLog.find(query).sort({ timestamp: -1 }).limit(limit);
  }
}

// Convenience function export for authController and other callers that import { createAuditLog }
export const createAuditLog = (params: CreateAuditLogParams): Promise<void> => {
  return AuditService.log(params);
};
