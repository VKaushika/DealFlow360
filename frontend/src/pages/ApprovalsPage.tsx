import React, { useState, useEffect } from 'react';
import { api } from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/ui/StatusBadge';
import {
  CheckSquare,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RotateCcw,
  ShieldAlert,
  Clock,
  ExternalLink,
  ChevronRight,
  DollarSign,
  TrendingUp,
  Filter,
  Search,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';

export const ApprovalsPage: React.FC<{
  approvalId?: string;
  onNavigate: (page: string, id?: string) => void;
}> = ({ approvalId, onNavigate }) => {
  const { role, user, switchPersona } = useAuth();
  const [approvals, setApprovals] = useState<any[]>([]);
  const [selectedApproval, setSelectedApproval] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [decisionNotes, setDecisionNotes] = useState<string>('Approved based on strategic commercial criteria.');
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchApprovals = async () => {
    try {
      setLoading(true);
      const res = await api.getApprovals();
      if (res.data.success) {
        setApprovals(res.data.data);
        if (approvalId) {
          const matched = res.data.data.find(
            (a: any) => a._id === approvalId || a.quotationId?._id === approvalId || a.quotationId === approvalId
          );
          if (matched) {
            setSelectedApproval(matched);
            return;
          }
        }
        if (res.data.data.length > 0 && !selectedApproval) {
          setSelectedApproval(res.data.data[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching approvals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, [approvalId]);

  // Handle single-tap full approval or step approval
  const handleDecision = async (action: 'approve' | 'approve_all' | 'reject' | 'revision') => {
    if (!selectedApproval) return;
    try {
      setActionLoading(true);
      setFeedback(null);
      let res;

      if (action === 'approve' || action === 'approve_all') {
        res = await api.approveDeal(selectedApproval._id, decisionNotes);
        // If there are multiple steps remaining, advance through them
        if (res.data.data?.approval?.status === 'PENDING' && action === 'approve_all') {
          res = await api.approveDeal(selectedApproval._id, `${decisionNotes} (Finalized by ${role})`);
        }
      } else if (action === 'reject') {
        res = await api.rejectDeal(selectedApproval._id, decisionNotes);
      } else {
        res = await api.requestRevision(selectedApproval._id, decisionNotes);
      }

      if (res.data.success) {
        setFeedback({ type: 'success', message: res.data.message || 'Quotation approval recorded successfully!' });
        await fetchApprovals();
        const updated = await api.getApprovalById(selectedApproval._id);
        if (updated.data.success) {
          setSelectedApproval(updated.data.data);
        }
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.response?.data?.message || err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const isReviewerRole = role === 'SALES_MANAGER' || role === 'FINANCE_OPS' || role === 'ADMIN';

  const filteredApprovals = approvals.filter((a) => {
    if (statusFilter !== 'ALL' && a.status !== statusFilter) return false;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const quoteNum = (a.quotationId?.quoteNumber || '').toLowerCase();
      const company = (a.customerId?.companyName || '').toLowerCase();
      const rep = (a.salesRepId?.name || '').toLowerCase();
      return quoteNum.includes(term) || company.includes(term) || rep.includes(term);
    }
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Back button */}
      <button
        onClick={() => onNavigate('dashboard')}
        className="inline-flex items-center gap-2 text-xs font-bold text-charcoal-600 hover:text-charcoal-950 px-3 py-1.5 rounded-xl bg-white border border-cream-border shadow-subtle transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>← Back to Dashboard</span>
      </button>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-cream-border">
        <div>
          <div className="text-[10px] font-mono tracking-widest text-charcoal-400 uppercase font-bold mb-1">
            GOVERNANCE / MULTI-TIER APPROVALS
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-charcoal-900 flex items-center gap-2">
            <CheckSquare className="w-6 h-6 text-brand-500" />
            <span>Discount Approval Queue</span>
          </h1>
          <p className="text-xs sm:text-sm text-charcoal-600 mt-1">
            Review quotation exceptions, deterministic policy breaches, and margin constraints across management tiers.
          </p>
        </div>

        {!isReviewerRole && (
          <div className="bg-amber-50 border border-amber-200 px-4 py-2.5 rounded-2xl flex items-center gap-3 text-xs shadow-subtle">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="text-amber-900 font-medium">
              Viewing as <strong className="text-charcoal-900 font-bold">{role}</strong>. Approvals require Manager/Finance role.
            </span>
            <button
              onClick={() => switchPersona('SALES_MANAGER')}
              className="bg-brand-500 hover:bg-brand-600 text-charcoal-950 font-bold px-3 py-1.5 rounded-xl text-xs transition-colors whitespace-nowrap shadow-subtle"
            >
              Switch to Manager
            </button>
          </div>
        )}
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2.5 shadow-subtle ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border border-rose-200 text-rose-800'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Dual Column Layout: Queue List + Approval Dossier */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Approval List with QT Filter */}
        <div className="bg-white border border-cream-border rounded-2xl p-5 shadow-subtle flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-cream-border">
              <h3 className="font-bold text-sm text-charcoal-900">Review Queue</h3>
              <span className="text-xs font-mono font-bold text-charcoal-600 bg-cream-100 px-2.5 py-0.5 rounded-full border border-cream-border">
                {filteredApprovals.length} item(s)
              </span>
            </div>

            {/* QT Search Filter Input (Requirement 4) */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-charcoal-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Filter by QT # or Customer..."
                className="w-full bg-cream-50 border border-cream-border text-xs text-charcoal-900 font-bold pl-8 pr-3 py-1.5 rounded-xl focus:border-brand-500 focus:outline-none"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-cream-50 p-1 rounded-xl border border-cream-border text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setStatusFilter('ALL')}
                className={`flex-1 py-1 rounded-lg transition-colors ${
                  statusFilter === 'ALL' ? 'bg-white text-charcoal-900 shadow-subtle' : 'text-charcoal-500 hover:text-charcoal-900'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('PENDING')}
                className={`flex-1 py-1 rounded-lg transition-colors ${
                  statusFilter === 'PENDING' ? 'bg-white text-brand-600 shadow-subtle' : 'text-charcoal-500 hover:text-charcoal-900'
                }`}
              >
                Pending
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('APPROVED')}
                className={`flex-1 py-1 rounded-lg transition-colors ${
                  statusFilter === 'APPROVED' ? 'bg-white text-emerald-600 shadow-subtle' : 'text-charcoal-500 hover:text-charcoal-900'
                }`}
              >
                Approved
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('REJECTED')}
                className={`flex-1 py-1 rounded-lg transition-colors ${
                  statusFilter === 'REJECTED' ? 'bg-white text-rose-600 shadow-subtle' : 'text-charcoal-500 hover:text-charcoal-900'
                }`}
              >
                Rejected
              </button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-cream-300 border-t-brand-500"></div>
              </div>
            ) : filteredApprovals.length === 0 ? (
              <div className="text-center py-12 text-charcoal-400 text-xs font-medium space-y-1">
                <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-600 opacity-80" />
                <p>No matching requests found.</p>
              </div>
            ) : (
              <div className="space-y-2.5 overflow-y-auto max-h-[520px] pr-1">
                {filteredApprovals.map((app) => {
                  const isSelected = selectedApproval?._id === app._id;
                  return (
                    <div
                      key={app._id}
                      onClick={() => setSelectedApproval(app)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer text-left ${
                        isSelected
                          ? 'bg-brand-50/70 border-brand-500 shadow-subtle ring-2 ring-brand-500/20'
                          : 'bg-cream-50/50 border-cream-border hover:border-cream-border/80'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono font-black text-xs text-charcoal-900">
                          {app.quotationId?.quoteNumber || 'QT-Deal'}
                        </span>
                        <StatusBadge status={app.riskLevel} size="xs" />
                      </div>

                      <div className="font-bold text-xs text-charcoal-800 truncate">
                        {app.customerId?.companyName || 'ABC Corporation'}
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-charcoal-500 mt-2 pt-2 border-t border-cream-border font-mono">
                        <span>
                          Status:{' '}
                          <strong
                            className={
                              app.status === 'APPROVED'
                                ? 'text-emerald-700'
                                : app.status === 'REJECTED'
                                ? 'text-rose-700'
                                : 'text-amber-700'
                            }
                          >
                            {app.status}
                          </strong>
                        </span>
                        <span className="flex items-center gap-1 text-charcoal-400">
                          <Clock className="w-3 h-3" />
                          {new Date(app.requestedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Decision Dossier with 1-Click Approve (Requirement 9) */}
        <div className="lg:col-span-2">
          {selectedApproval ? (
            <div className="bg-white border border-cream-border rounded-2xl p-6 space-y-6 shadow-subtle">
              {/* Header Info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-cream-border">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-xl font-black text-charcoal-900 font-mono">
                      {selectedApproval.quotationId?.quoteNumber || 'Quotation Review'}
                    </h2>
                    <span className="text-xs bg-cream-100 text-charcoal-700 font-bold px-2.5 py-0.5 rounded-full border border-cream-border">
                      {selectedApproval.customerId?.companyName}
                    </span>
                    <StatusBadge status={selectedApproval.customerId?.tier || 'GOLD'} size="xs" />
                  </div>
                  <p className="text-xs text-charcoal-600 mt-1 font-medium">
                    Sales Rep: <strong className="text-charcoal-900">{selectedApproval.salesRepId?.name || 'Priya Singh'}</strong> ({selectedApproval.salesRepId?.email || 'sarah.rep@dealflow360.com'})
                  </p>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-[10px] font-mono text-charcoal-500 font-bold uppercase tracking-wider block">Total Deal Value</span>
                  <span className="text-2xl font-black text-charcoal-900 font-mono tabular-nums">
                    ₹{Number(selectedApproval.quotationId?.totalAmount || 0).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Multi-Tier Approval Steps Progress */}
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider text-charcoal-500 mb-3 font-mono">
                  Multi-Tier Governance Chain
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {selectedApproval.steps.map((step: any, idx: number) => {
                    const isStepApproved = step.status === 'APPROVED';
                    const isCurrentActiveStep = selectedApproval.currentStepIndex === idx && selectedApproval.status === 'PENDING';

                    return (
                      <div
                        key={idx}
                        className={`p-4 rounded-xl border transition-all ${
                          isCurrentActiveStep
                            ? 'bg-brand-50/70 border-brand-500 shadow-subtle'
                            : isStepApproved
                            ? 'bg-emerald-50/60 border-emerald-200'
                            : 'bg-cream-50/50 border-cream-border'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-white text-charcoal-800 border border-cream-border">
                            Step {step.stepOrder}: {step.role === 'SALES_MANAGER' ? 'Sales Manager' : 'Finance Ops'}
                          </span>
                          <StatusBadge status={step.status} size="xs" />
                        </div>

                        {step.approverName && (
                          <p className="text-[11px] text-charcoal-700 mt-1 font-medium">
                            Decided by: <strong className="text-charcoal-900">{step.approverName}</strong> on{' '}
                            {new Date(step.actionDate).toLocaleDateString()}
                          </p>
                        )}
                        {step.notes && (
                          <p className="text-[11px] text-charcoal-600 italic mt-1.5 bg-white p-2 rounded-lg border border-cream-border">
                            "{step.notes}"
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Policy Breaches Analysis */}
              <div className="bg-cream-50/60 p-5 rounded-xl border border-cream-border">
                <div className="flex items-center gap-2 mb-3 text-xs font-bold text-rose-700 uppercase tracking-wider font-mono">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Deterministic Policy Breaches</span>
                </div>

                <div className="space-y-2.5 text-xs">
                  {selectedApproval.violations?.map((v: any, vIdx: number) => (
                    <div
                      key={vIdx}
                      className="p-3.5 bg-white border border-rose-200 rounded-xl flex items-center justify-between shadow-subtle"
                    >
                      <div>
                        <span className="font-bold text-charcoal-900">{v.productName}</span>
                        <div className="text-[11px] text-charcoal-600 mt-0.5 font-mono">
                          Applied: <strong className="text-rose-700">{v.appliedDiscountPct || v.appliedPct}%</strong> | Allowed Ceiling: <strong className="text-emerald-700">{v.allowedDiscountPct || v.allowedPct}%</strong>
                        </div>
                      </div>
                      <span className="text-xs font-mono font-black text-rose-800 bg-rose-100 px-2.5 py-0.5 rounded-md border border-rose-300">
                        +{v.deltaPct}% Breach
                      </span>
                    </div>
                  ))}

                  {(!selectedApproval.violations || selectedApproval.violations.length === 0) && (
                    <p className="text-charcoal-600 text-xs font-medium">
                      {selectedApproval.riskSummary || 'Flagged due to blended risk margin constraints.'}
                    </p>
                  )}
                </div>
              </div>

              {/* Action Decision Form (Single-Tap Complete Approval) */}
              {selectedApproval.status === 'PENDING' && (
                <div className="bg-cream-50/60 p-5 rounded-xl border border-cream-border space-y-3.5">
                  <label className="block text-xs font-bold text-charcoal-900">
                    Decision Justification & Review Notes:
                  </label>
                  <textarea
                    rows={2}
                    value={decisionNotes}
                    onChange={(e) => setDecisionNotes(e.target.value)}
                    className="w-full bg-white border border-cream-border text-xs text-charcoal-900 font-medium p-3 rounded-xl focus:border-brand-500 focus:outline-none"
                    placeholder="Enter approval or rejection justification for the audit trail..."
                  />

                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    {/* 1-Tap Direct Finalize Button (Requirement 9) */}
                    <button
                      type="button"
                      onClick={() => handleDecision('approve_all')}
                      disabled={actionLoading}
                      className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-3 rounded-xl shadow-subtle transition-all active:scale-[0.98] disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>1-Tap Approve & Finalize Deal</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDecision('revision')}
                      disabled={actionLoading}
                      className="flex-1 flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600 text-charcoal-950 font-bold text-xs py-3 rounded-xl transition-all disabled:opacity-50"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Request Revision</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDecision('reject')}
                      disabled={actionLoading}
                      className="flex-1 flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs py-3 rounded-xl transition-all disabled:opacity-50"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Reject Deal</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white border border-cream-border rounded-2xl p-16 text-center text-charcoal-500 text-xs font-medium shadow-subtle">
              Select an approval request from the left queue to inspect governance details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
