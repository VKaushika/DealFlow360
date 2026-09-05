import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../models/User';

export enum Permission {
  DASHBOARD_VIEW = 'dashboard:view',
  QUOTATION_CREATE = 'quotation:create',
  QUOTATION_VIEW = 'quotation:view',
  QUOTATION_UPDATE = 'quotation:update',
  QUOTATION_DELETE = 'quotation:delete',
  QUOTATION_SUBMIT = 'quotation:submit',
  QUOTATION_CONFIRM = 'quotation:confirm',
  APPROVAL_VIEW = 'approval:view',
  APPROVAL_APPROVE = 'approval:approve',
  APPROVAL_REJECT = 'approval:reject',
  APPROVAL_REQUEST_REVISION = 'approval:request_revision',
  CUSTOMER_VIEW = 'customer:view',
  CUSTOMER_CREATE = 'customer:create',
  CUSTOMER_UPDATE = 'customer:update',
  PRODUCT_VIEW = 'product:view',
  PRODUCT_CREATE = 'product:create',
  PRODUCT_UPDATE = 'product:update',
  WAREHOUSE_VIEW = 'warehouse:view',
  WAREHOUSE_UPDATE = 'warehouse:update',
  FULFILLMENT_VIEW = 'fulfillment:view',
  FULFILLMENT_ALLOCATE = 'fulfillment:allocate',
  BACKORDER_VIEW = 'backorder:view',
  BACKORDER_RESOLVE = 'backorder:resolve',
  BILLING_VIEW = 'billing:view',
  BILLING_GENERATE = 'billing:generate',
  PAYMENT_RECORD = 'payment:record',
  SUBSCRIPTION_VIEW = 'subscription:view',
  SUBSCRIPTION_MODIFY = 'subscription:modify',
  PORTAL_VIEW = 'portal:view',
  PORTAL_COUNTER_DISCOUNT = 'portal:counter_discount',
  PORTAL_CONFIRM = 'portal:confirm',
  DEAL_HEALTH_VIEW = 'deal_health:view',
  DEAL_HEALTH_RESOLVE = 'deal_health:resolve',
  GOVERNANCE_VIEW = 'governance:view',
  GOVERNANCE_MANAGE = 'governance:manage',
  AUDIT_VIEW = 'audit:view',
  REPORTS_VIEW = 'reports:view',
  USER_MANAGE = 'user:manage',
}

export const rolePermissions: Record<UserRole, Permission[]> = {
  ADMIN: Object.values(Permission),
  SALES_REP: [
    Permission.DASHBOARD_VIEW,
    Permission.QUOTATION_VIEW,
    Permission.QUOTATION_CREATE,
    Permission.QUOTATION_UPDATE,
    Permission.QUOTATION_SUBMIT,
    Permission.CUSTOMER_VIEW,
    Permission.PRODUCT_VIEW,
    Permission.WAREHOUSE_VIEW,
    Permission.FULFILLMENT_VIEW,
    Permission.BACKORDER_VIEW,
    Permission.BILLING_VIEW,
    Permission.SUBSCRIPTION_VIEW,
    Permission.PORTAL_VIEW,
    Permission.DEAL_HEALTH_VIEW,
    Permission.GOVERNANCE_VIEW,
    Permission.REPORTS_VIEW,
  ],
  SALES_MANAGER: [
    Permission.DASHBOARD_VIEW,
    Permission.QUOTATION_VIEW,
    Permission.QUOTATION_CREATE,
    Permission.QUOTATION_UPDATE,
    Permission.QUOTATION_SUBMIT,
    Permission.QUOTATION_DELETE,
    Permission.APPROVAL_VIEW,
    Permission.APPROVAL_APPROVE,
    Permission.APPROVAL_REJECT,
    Permission.APPROVAL_REQUEST_REVISION,
    Permission.CUSTOMER_VIEW,
    Permission.CUSTOMER_CREATE,
    Permission.PRODUCT_VIEW,
    Permission.WAREHOUSE_VIEW,
    Permission.FULFILLMENT_VIEW,
    Permission.BACKORDER_VIEW,
    Permission.BILLING_VIEW,
    Permission.SUBSCRIPTION_VIEW,
    Permission.PORTAL_VIEW,
    Permission.PORTAL_COUNTER_DISCOUNT,
    Permission.PORTAL_CONFIRM,
    Permission.DEAL_HEALTH_VIEW,
    Permission.DEAL_HEALTH_RESOLVE,
    Permission.GOVERNANCE_VIEW,
    Permission.REPORTS_VIEW,
  ],
  FINANCE_OPS: [
    Permission.DASHBOARD_VIEW,
    Permission.QUOTATION_VIEW,
    Permission.APPROVAL_VIEW,
    Permission.APPROVAL_APPROVE,
    Permission.APPROVAL_REJECT,
    Permission.APPROVAL_REQUEST_REVISION,
    Permission.CUSTOMER_VIEW,
    Permission.PRODUCT_VIEW,
    Permission.WAREHOUSE_VIEW,
    Permission.FULFILLMENT_VIEW,
    Permission.FULFILLMENT_ALLOCATE,
    Permission.BACKORDER_VIEW,
    Permission.BACKORDER_RESOLVE,
    Permission.BILLING_VIEW,
    Permission.BILLING_GENERATE,
    Permission.PAYMENT_RECORD,
    Permission.SUBSCRIPTION_VIEW,
    Permission.SUBSCRIPTION_MODIFY,
    Permission.DEAL_HEALTH_VIEW,
    Permission.REPORTS_VIEW,
  ],
  CUSTOMER: [
    Permission.PORTAL_VIEW,
    Permission.QUOTATION_VIEW,
    Permission.PORTAL_COUNTER_DISCOUNT,
    Permission.PORTAL_CONFIRM,
    Permission.BILLING_VIEW,
  ],
};

export const requirePermission = (permission: Permission) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as any).user as { role: UserRole } | undefined;
    if (!user) {
      res.status(401).json({ success: false, message: 'Unauthorized. User not authenticated.' });
      return;
    }

    const permissions = rolePermissions[user.role] || [];
    if (!permissions.includes(permission)) {
      res.status(403).json({
        success: false,
        message: `Forbidden. Role ${user.role} does not have permission: ${permission}`,
      });
      return;
    }

    next();
  };
};

export const hasPermission = (role: UserRole, permission: Permission): boolean => {
  const permissions = rolePermissions[role] || [];
  return permissions.includes(permission);
};
