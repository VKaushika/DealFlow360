import React, { useState, useEffect } from 'react';
import { api } from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/ui/StatusBadge';
import {
  FileText,
  Search,
  Filter,
  Plus,
  ArrowUpDown,
  ExternalLink,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Send,
  LayoutList,
  Columns,
  RefreshCw,
} from 'lucide-react';

export const QuotationsListPage: React.FC<{
  onNavigate: (page: string, id?: string) => void;
}> = ({ onNavigate }) => {
  const { role } = useAuth();
  const [quotations, setQuotations] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [stageFilter, setStageFilter] = useState<string>('');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');

  const KANBAN_STAGES = [
    { key: 'DRAFT', label: 'Draft', color: 'bg-charcoal-100 border-charcoal-300' },
    { key: 'PENDING_APPROVAL', label: 'Pending Approval', color: 'bg-amber-50 border-amber-300' },
    { key: 'APPROVED', label: 'Approved', color: 'bg-emerald-50 border-emerald-300' },
    { key: 'READY_FOR_FULFILLMENT', label: 'Fulfillment', color: 'bg-blue-50 border-blue-300' },
    { key: 'FULFILLED', label: 'Fulfilled', color: 'bg-purple-50 border-purple-300' },
    { key: 'CLOSED', label: 'Closed', color: 'bg-charcoal-50 border-charcoal-200' },
  ];

  const fetchQuotations = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (stageFilter) params.stage = stageFilter;
      if (searchTerm) params.search = searchTerm;

      const res = await api.getQuotations(params);
      if (res.data.success) {
        setQuotations(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching quotations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotations();
  }, [stageFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchQuotations();
  };

  const handleQuickSubmit = async (e: React.MouseEvent, qId: string) => {
    e.stopPropagation();
    try {
      setActionLoadingId(qId);
      const res = await api.submitQuotation(qId);
      if (res.data.success) {
        await fetchQuotations();
        if (res.data.data.approval) {
          onNavigate('approvals', res.data.data.approval._id);
        }
      }
    } catch (err) {
      console.error('Submit failed:', err);
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-cream-border">
        <div>
          <div className="text-[10px] font-mono tracking-widest text-charcoal-400 uppercase font-bold mb-1">
            WORKSPACE / QUOTATIONS
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-charcoal-900 flex items-center gap-2.5">
            <FileText className="w-6 h-6 text-brand-500" />
            <span>Quotations & Deals Directory</span>
          </h1>
          <p className="text-xs sm:text-sm text-charcoal-600 mt-1">
            Search, filter, and track multi-line quotation lifecycles across all customer tiers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-white border border-cream-border rounded-xl p-0.5 shadow-subtle">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-brand-500 text-charcoal-950' : 'text-charcoal-500 hover:text-charcoal-900'}`}
              title="List View"
            >
              <LayoutList className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'kanban' ? 'bg-brand-500 text-charcoal-950' : 'text-charcoal-500 hover:text-charcoal-900'}`}
              title="Pipeline Kanban View"
            >
              <Columns className="w-3.5 h-3.5" />
            </button>
          </div>
          <button
            onClick={fetchQuotations}
            className="p-2 rounded-xl bg-white border border-cream-border text-charcoal-500 hover:text-brand-600 shadow-subtle transition-all"
            title="Reload Data"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onNavigate('quotation-builder')}
            className="inline-flex items-center gap-2 bg-charcoal-900 hover:bg-black text-white text-xs font-bold px-4 py-2.5 rounded-2xl shadow-subtle transition-all active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>+ New quotation</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-cream-border shadow-subtle">
        <form onSubmit={handleSearch} className="flex items-center gap-2 w-full sm:w-80">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-charcoal-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by quote # or title..."
              className="w-full bg-cream-50 border border-cream-border text-xs text-charcoal-900 font-medium pl-9 pr-3 py-2 rounded-xl focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500/30"
            />
          </div>
          <button
            type="submit"
            className="bg-cream-100 hover:bg-cream-200 text-charcoal-900 text-xs font-bold px-3.5 py-2 rounded-xl border border-cream-border transition-colors"
          >
            Search
          </button>
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-charcoal-400" />
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="bg-cream-50 border border-cream-border text-xs text-charcoal-900 font-medium rounded-xl px-3.5 py-2 focus:border-brand-500 focus:outline-none"
          >
            <option value="">All Stages</option>
            <option value="DRAFT">Draft</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="PENDING_APPROVAL">Pending Approval</option>
            <option value="APPROVED">Approved</option>
            <option value="READY_FOR_FULFILLMENT">Ready For Fulfillment</option>
            <option value="FULFILLED">Fulfilled</option>
            <option value="BILLING_IN_PROGRESS">Billing In Progress</option>
            <option value="CUSTOMER_CONFIRMED">Customer Confirmed</option>
            <option value="CLOSED">Closed / Paid</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      {/* === KANBAN PIPELINE VIEW === */}
      {viewMode === 'kanban' && !loading && (
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-max">
            {KANBAN_STAGES.map((stage) => {
              const stageQuotations = quotations.filter(q => q.stage === stage.key);
              return (
                <div key={stage.key} className={`w-64 flex flex-col rounded-2xl border-2 ${stage.color} overflow-hidden`}>
                  <div className="px-4 py-3 flex items-center justify-between">
                    <span className="text-xs font-black text-charcoal-900">{stage.label}</span>
                    <span className="text-[10px] font-mono font-bold bg-white/80 px-2 py-0.5 rounded-full border border-cream-border">
                      {stageQuotations.length}
                    </span>
                  </div>
                  <div className="flex flex-col gap-2 p-2 min-h-[200px]">
                    {stageQuotations.map((q) => (
                      <div
                        key={q._id}
                        onClick={() => onNavigate('quotation-builder', q._id)}
                        className="bg-white rounded-xl p-3 border border-cream-border shadow-subtle hover:border-brand-400 hover:shadow-card cursor-pointer transition-all space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono font-bold text-brand-700">{q.quoteNumber}</span>
                          <StatusBadge status={q.riskLevel} size="xs" />
                        </div>
                        <p className="text-xs font-bold text-charcoal-900 leading-tight truncate">
                          {q.customerId?.companyName || 'Customer'}
                        </p>
                        <p className="text-[11px] text-charcoal-500 truncate">{q.title}</p>
                        <div className="flex items-center justify-between pt-1 border-t border-cream-border">
                          <span className="text-[11px] font-mono font-bold text-charcoal-900">
                            ₹{Number(q.totalAmount || 0).toLocaleString('en-IN')}
                          </span>
                          <span className={`text-[11px] font-bold font-mono ${
                            (q.grossMarginPct || 0) >= 20 ? 'text-emerald-600' : 'text-amber-600'
                          }`}>
                            {q.grossMarginPct}%
                          </span>
                        </div>
                        {q.stage === 'DRAFT' && (
                          <button
                            onClick={(e) => handleQuickSubmit(e, q._id)}
                            disabled={actionLoadingId === q._id}
                            className="w-full flex items-center justify-center gap-1 bg-charcoal-900 hover:bg-black text-white text-[10px] font-bold py-1 rounded-lg transition-all disabled:opacity-50"
                          >
                            <Send className="w-2.5 h-2.5" />
                            {actionLoadingId === q._id ? 'Submitting...' : 'Submit for Approval'}
                          </button>
                        )}
                      </div>
                    ))}
                    {stageQuotations.length === 0 && (
                      <div className="flex-1 flex items-center justify-center py-8 text-[11px] text-charcoal-300 font-medium">
                        No deals
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* === LIST VIEW === */}
      {viewMode === 'list' && (
      <div className="bg-white border border-cream-border rounded-2xl overflow-hidden shadow-subtle">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-cream-300 border-t-brand-500"></div>
          </div>
        ) : quotations.length === 0 ? (
          <div className="text-center py-16 text-charcoal-500 text-xs font-medium">
            <FileText className="w-8 h-8 mx-auto mb-2 text-charcoal-300" />
            No quotations found matching your filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] uppercase tracking-wider text-charcoal-500 bg-cream-50/60 border-b border-cream-border">
                <tr>
                  <th className="py-3 px-4 font-bold">Quote #</th>
                  <th className="py-3 px-4 font-bold">Customer &amp; Tier</th>
                  <th className="py-3 px-4 font-bold">Deal Title</th>
                  <th className="py-3 px-4 font-bold">Stage</th>
                  <th className="py-3 px-4 font-bold text-right">Total Amount</th>
                  <th className="py-3 px-4 font-bold text-right">Discount</th>
                  <th className="py-3 px-4 font-bold text-right">Margin %</th>
                  <th className="py-3 px-4 font-bold">Risk Level</th>
                  <th className="py-3 px-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-border/60">
                {quotations.map((q) => (
                  <tr
                    key={q._id}
                    className="hover:bg-cream-50/70 transition-colors cursor-pointer group"
                    onClick={() => onNavigate('quotation-builder', q._id)}
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-charcoal-900 group-hover:text-brand-600">
                      {q.quoteNumber}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-charcoal-900">{q.customerId?.companyName || 'Customer'}</div>
                      <span className="text-[10px] text-charcoal-500 font-mono">Tier {q.customerId?.tier}</span>
                    </td>
                    <td className="py-3.5 px-4 font-normal text-charcoal-700 max-w-xs truncate">{q.title}</td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={q.stage} size="xs" />
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-charcoal-900 tabular-nums">
                      ₹{Number(q.totalAmount || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-rose-600 font-semibold tabular-nums">
                      {q.discountAmount > 0 ? `-₹${Number(q.discountAmount).toLocaleString('en-IN')}` : '₹0'}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold tabular-nums">
                      <span className={q.grossMarginPct >= 20 ? 'text-emerald-600' : 'text-amber-600'}>
                        {q.grossMarginPct}%
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={q.riskLevel} size="xs" />
                    </td>
                    <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        {q.stage === 'DRAFT' && (
                          <button
                            onClick={(e) => handleQuickSubmit(e, q._id)}
                            disabled={actionLoadingId === q._id}
                            className="inline-flex items-center gap-1 bg-charcoal-900 hover:bg-black text-white text-[10px] font-bold px-2 py-1 rounded-lg shadow-subtle transition-all disabled:opacity-50"
                            title="Submit for Governance Approval"
                          >
                            <Send className="w-2.5 h-2.5" />
                            <span>{actionLoadingId === q._id ? 'Submitting...' : 'Submit'}</span>
                          </button>
                        )}
                        <button
                          onClick={() => onNavigate('quotation-builder', q._id)}
                          className="p-1.5 text-charcoal-500 hover:text-charcoal-900 hover:bg-cream-100 rounded-lg transition-colors"
                          title="Open Quote Builder"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      )}
    </div>
  );
};
