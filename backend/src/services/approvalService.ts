import { Approval, IApproval, ApprovalStatus } from '../models/Approval';
import { Quotation, IQuotation } from '../models/Quotation';
import { User, IUser } from '../models/User';
import { AuditService } from './auditService';
import mongoose from 'mongoose';

export class ApprovalService {
  public static async createApprovalForQuotation(
    quotation: IQuotation,
    approvalChain: Array<{ role: 'SALES_MANAGER' | 'FINANCE_OPS'; stepOrder: number }>,
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
    riskScore: number,
    riskReasons: string[],
    violations: any[]
  ): Promise<IApproval> {
    const steps = approvalChain.map((c, idx) => ({
      stepOrder: c.stepOrder || idx + 1,
      role: c.role,
      status: 'PENDING' as const,
      approverId: undefined,
      approverName: '',
      actionDate: undefined,
      notes: '',
    }));

    const approval = await Approval.create({
      quotationId: quotation._id,
      customerId: quotation.customerId,
      salesRepId: quotation.salesRepId,
      status: 'PENDING',
      currentStepIndex: 0,
      totalSteps: steps.length,
      steps,
      riskLevel,
      riskScore,
      riskSummary: riskReasons.join('; '),
      violations,
      requestedAt: new Date(),
    });

    quotation.currentApprovalId = approval._id as any;
    quotation.stage = 'PENDING_APPROVAL';
    await quotation.save();

    await AuditService.log({
      actorId: quotation.salesRepId,
      actorName: 'System / Sales Rep',
      actorRole: 'SALES_REP',
      action: 'APPROVAL_REQUEST_CREATED',
      entityType: 'APPROVAL',
      entityId: approval._id.toString(),
      entityNumber: quotation.quoteNumber,
      afterState: { status: 'PENDING', riskLevel, totalSteps: steps.length },
      notes: `Approval required with ${steps.length} step(s) due to ${riskLevel} risk.`,
    });

    return approval;
  }

  public static async processApprovalDecision(
    approvalId: string,
    approverUser: IUser,
    action: 'APPROVE' | 'REJECT' | 'REVISION_REQUESTED',
    notes: string = ''
  ): Promise<{ approval: IApproval; quotation: IQuotation }> {
    const approval = await Approval.findById(approvalId);
    if (!approval) {
      throw new Error(`Approval with ID ${approvalId} not found`);
    }

    if (approval.status !== 'PENDING') {
      throw new Error(`Approval is already finalized with status: ${approval.status}`);
    }

    const currentStep = approval.steps[approval.currentStepIndex];
    if (!currentStep) {
      throw new Error('No active approval step found');
    }

    // Role verification
    const isAuthorized =
      approverUser.role === 'ADMIN' ||
      approverUser.role === currentStep.role;

    if (!isAuthorized) {
      throw new Error(
        `Unauthorized: Current step requires ${currentStep.role} role, but user has ${approverUser.role}`
      );
    }

    const quotation = await Quotation.findById(approval.quotationId);
    if (!quotation) {
      throw new Error('Associated quotation not found');
    }

    const beforeState = {
      approvalStatus: approval.status,
      currentStepIndex: approval.currentStepIndex,
      quotationStage: quotation.stage,
    };

    // Update current step
    currentStep.approverId = approverUser._id as any;
    currentStep.approverName = approverUser.name;
    currentStep.actionDate = new Date();
    currentStep.notes = notes;

    if (action === 'REJECT') {
      currentStep.status = 'REJECTED';
      approval.status = 'REJECTED';
      approval.completedAt = new Date();
      quotation.stage = 'REJECTED';
    } else if (action === 'REVISION_REQUESTED') {
      currentStep.status = 'REJECTED';
      approval.status = 'REVISION_REQUESTED';
      approval.completedAt = new Date();
      quotation.stage = 'REVISION_REQUESTED';
    } else if (action === 'APPROVE') {
      currentStep.status = 'APPROVED';
      const isLastStep = approval.currentStepIndex >= approval.steps.length - 1;

      if (isLastStep) {
        approval.status = 'APPROVED';
        approval.completedAt = new Date();
        quotation.stage = 'APPROVED';
      } else {
        // Advance to next step (e.g., Step 2 Finance)
        approval.currentStepIndex += 1;
        quotation.stage = 'PENDING_APPROVAL';
      }
    }

    await approval.save();
    await quotation.save();

    await AuditService.log({
      actorId: approverUser._id as any,
      actorName: approverUser.name,
      actorRole: approverUser.role,
      action: `APPROVAL_${action}`,
      entityType: 'APPROVAL',
      entityId: approval._id.toString(),
      entityNumber: quotation.quoteNumber,
      beforeState,
      afterState: {
        approvalStatus: approval.status,
        currentStepIndex: approval.currentStepIndex,
        quotationStage: quotation.stage,
      },
      notes: notes || `Step ${currentStep.stepOrder} decided as ${action}`,
    });

    return { approval, quotation };
  }
}
