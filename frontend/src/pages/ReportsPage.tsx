import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import { MetricCard } from '../components/ui/MetricCard';
import { StatusBadge } from '../components/ui/StatusBadge';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  PieChart,
  Percent,
  Download,
  Calendar,
  Building2,
  RefreshCw,
  Filter,
  FileText,
  CheckCircle2,
  Clock,
  XCircle,
  Users,
} from 'lucide-react';

const STAGE_COLORS: Record<string, string> = {
  DRAFT: 'bg-charcoal-100 text-charcoal-700',
  PENDING_APPROVAL: 'bg-amber-100 text-amber-800',
  APPROVED: 'bg-emerald-100 text-emerald-800',
  READY_FOR_FULFILLMENT: 'bg-blue-100 text-blue-800',
  FULFILLED: 'bg-purple-100 text-purple-800',
  CLOSED: 'bg-charcoal-200 text-charcoal-900',
  REJECTED: 'bg-rose-100 text-rose-800',
  CANCELLED: 'bg-rose-50 text-rose-500',
};

export const ReportsPage: React.FC<{
  onNavigate: (page: string, id?: string) => void;
}> = ({ onNavigate }) => {
  const { role } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [salesData, setSalesData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'sales' | 'approvals' | 'billing'>('overview');

  // Filters
  const [periodFilter, setPeriodFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [stageFilter, setStageFilter] = useState<string>('ALL');

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      const [dashRes, salesRes] = await Promise.all([
        api.getDashboardReports(),
        api.getSalesReport(),
      ]);
      if (dashRes.data.success) setStats(dashRes.data.data);
      if (salesRes.data.success) setSalesData(salesRes.data.data || []);
    } catch (err) {
      console.error('Error fetching reports:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const kpi = stats?.kpi || {};
  const stageBreakdown = stats?.stageBreakdown || [];

  const formatCurrency = (val: number) => `₹${Number(val || 0).toLocaleString('en-IN')}`;

  // Derived filtered data
  const filteredSales = salesData.filter((q: any) => {
    const matchStage = stageFilter === 'ALL' || q.stage === stageFilter;
    let matchPeriod = true;
    if (periodFilter !== 'all' && q.createdAt) {
      const created = new Date(q.createdAt);
      const now = new Date();
      if (periodFilter === 'today') {
        matchPeriod = created.toDateString() === now.toDateString();
      } else if (periodFilter === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
        matchPeriod = created >= weekAgo;
      } else if (periodFilter === 'month') {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 3600 * 1000);
        matchPeriod = created >= monthAgo;
      }
    }
    return matchStage && matchPeriod;
  });

  // CSV Export
  const exportCSV = () => {
    const headers = ['Quote #', 'Customer', 'Sales Rep', 'Stage', 'Total (₹)', 'Margin %', 'Date'];
    const rows = filteredSales.map((q: any) => [
      q.quoteNumber || '',
      q.customerId?.companyName || '',
      q.salesRepId?.name || '',
      q.stage || '',
      (q.totalAmount || 0).toFixed(2),
      (q.grossMarginPct || 0).toFixed(1) + '%',
      q.createdAt ? new Date(q.createdAt).toLocaleDateString('en-IN') : '',
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dealflow360_report_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-cream-300 border-t-brand-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-cream-border">
        <div>
          <div className="text-[10px] font-mono tracking-widest text-charcoal-400 uppercase font-bold mb-1">
            EXECUTIVE / INTELLIGENCE &amp; METRICS
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-charcoal-900 flex items-center gap-2.5">
            <BarChart3 className="w-6 h-6 text-brand-500" />
            <span>Sales &amp; Operations Intelligence</span>
          </h1>
          <p className="text-xs sm:text-sm text-charcoal-600 mt-1">
            Aggregated metrics from live database transactions — pipeline velocity, margin distributions, and cash receipts.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={fetchStats}
            className="inline-flex items-center gap-2 bg-white hover:bg-cream-50 text-charcoal-800 text-xs font-bold px-3 py-2 rounded-xl border border-cream-border shadow-subtle transition-all"
            title="Refresh Reports"
          >
            <RefreshCw className="w-3.5 h-3.5 text-brand-600" />
            <span className="hidden sm:inline">Reload Data</span>
          </button>
          <button
            onClick={exportCSV}
            className="inline-flex items-center gap-2 bg-white hover:bg-cream-50 text-charcoal-800 text-xs font-bold px-3 py-2 rounded-xl border border-cream-border shadow-subtle transition-all"
          >
            <Download className="w-3.5 h-3.5 text-charcoal-500" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 bg-white hover:bg-cream-50 text-charcoal-800 text-xs font-bold px-3 py-2 rounded-xl border border-cream-border shadow-subtle transition-all"
          >
            <FileText className="w-3.5 h-3.5 text-charcoal-500" />
            <span className="hidden sm:inline">Print</span>
          </button>
        </div>
      </div>

      {/* Top Financial Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Pipeline Value"
          value={formatCurrency(kpi.totalPipelineValue)}
          subtext="Across active quotations"
          trend={{ value: `${kpi.totalQuotesCount || 0} active deals`, isPositive: true }}
          icon={DollarSign}
          color="amber"
        />
        <MetricCard
          title="Total Realized Cash"
          value={formatCurrency(kpi.invoiceRevenue)}
          subtext="Paid invoice receipts"
          icon={TrendingUp}
          color="emerald"
        />
        <MetricCard
          title="Monthly Recurring Run-Rate"
          value={formatCurrency(kpi.monthlyRecurringRevenue)}
          subtext={`Annualized: ${formatCurrency((kpi.monthlyRecurringRevenue || 0) * 12)}`}
          icon={BarChart3}
          color="purple"
        />
        <MetricCard
          title="Average Gross Margin"
          value={`${kpi.overallGrossMarginPct || 0}%`}
          subtext="Blended book margin"
          trend={{
            value: kpi.overallGrossMarginPct >= 20 ? 'Target met (>20%)' : 'Below target',
            isPositive: kpi.overallGrossMarginPct >= 20,
          }}
          icon={Percent}
          color="blue"
        />
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-cream-border rounded-2xl p-4 shadow-subtle text-center">
          <p className="text-[10px] font-mono uppercase tracking-wider text-charcoal-400 mb-1">Pending Approvals</p>
          <p className="text-2xl font-black text-amber-700 font-mono">{kpi.pendingApprovalsCount || 0}</p>
        </div>
        <div className="bg-white border border-cream-border rounded-2xl p-4 shadow-subtle text-center">
          <p className="text-[10px] font-mono uppercase tracking-wider text-charcoal-400 mb-1">Approved Quotes</p>
          <p className="text-2xl font-black text-emerald-700 font-mono">{kpi.approvedQuotesCount || 0}</p>
        </div>
        <div className="bg-white border border-cream-border rounded-2xl p-4 shadow-subtle text-center">
          <p className="text-[10px] font-mono uppercase tracking-wider text-charcoal-400 mb-1">Outstanding AR</p>
          <p className="text-2xl font-black text-rose-700 font-mono tabular-nums" style={{ fontSize: '1rem' }}>{formatCurrency(kpi.invoiceOutstanding)}</p>
        </div>
        <div className="bg-white border border-cream-border rounded-2xl p-4 shadow-subtle text-center">
          <p className="text-[10px] font-mono uppercase tracking-wider text-charcoal-400 mb-1">Open Backorders</p>
          <p className="text-2xl font-black text-purple-700 font-mono">{kpi.openBackordersCount || 0}</p>
        </div>
      </div>

      {/* Stage Breakdown */}
      <div className="bg-white border border-cream-border rounded-2xl p-6 space-y-5 shadow-subtle">
        <h3 className="font-bold text-sm text-charcoal-900 pb-3 border-b border-cream-border flex items-center gap-2">
          <PieChart className="w-4 h-4 text-brand-500" />
          Deal Distribution by Stage
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {stageBreakdown.map((st: any, idx: number) => (
            <div key={idx} className="bg-cream-50/50 p-4 rounded-xl border border-cream-border space-y-2">
              <div className="flex items-center justify-between">
                <StatusBadge status={st._id} size="xs" />
                <span className="text-xs font-mono font-bold text-charcoal-800 bg-cream-100 px-2 py-0.5 rounded-md border border-cream-border">
                  {st.count}
                </span>
              </div>
              <div className="text-base font-black text-charcoal-900 font-mono tabular-nums">
                ₹{Number(st.totalValue || 0).toLocaleString('en-IN')}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quotation Report with Filters */}
      <div className="bg-white border border-cream-border rounded-2xl p-6 space-y-4 shadow-subtle">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-cream-border">
          <h3 className="font-bold text-sm text-charcoal-900 flex items-center gap-2">
            <Filter className="w-4 h-4 text-brand-500" />
            Quotation Detail Report
            <span className="text-[10px] font-mono text-charcoal-400 bg-cream-100 px-2 py-0.5 rounded-full border border-cream-border ml-1">
              {filteredSales.length} records
            </span>
          </h3>

          {/* Filter Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs font-bold text-charcoal-600">
              <Calendar className="w-3.5 h-3.5" />
              <span>Period:</span>
            </div>
            {(['all', 'today', 'week', 'month'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriodFilter(p)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  periodFilter === p
                    ? 'bg-brand-500 text-charcoal-950'
                    : 'bg-cream-100 text-charcoal-600 hover:bg-cream-200 border border-cream-border'
                }`}
              >
                {p === 'all' ? 'All Time' : p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}

            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="bg-cream-50 border border-cream-border text-[11px] font-bold text-charcoal-800 px-2 py-1 rounded-lg focus:outline-none focus:border-brand-500"
            >
              <option value="ALL">All Stages</option>
              <option value="DRAFT">Draft</option>
              <option value="PENDING_APPROVAL">Pending Approval</option>
              <option value="APPROVED">Approved</option>
              <option value="READY_FOR_FULFILLMENT">Ready for Fulfillment</option>
              <option value="FULFILLED">Fulfilled</option>
              <option value="CLOSED">Closed</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>

        {/* Filtered Table */}
        <div className="overflow-x-auto rounded-xl border border-cream-border">
          <table className="w-full text-xs">
            <thead className="bg-cream-100 border-b border-cream-border">
              <tr>
                <th className="text-left px-4 py-3 font-mono font-bold text-charcoal-500 uppercase tracking-wider whitespace-nowrap">Quote #</th>
                <th className="text-left px-4 py-3 font-mono font-bold text-charcoal-500 uppercase tracking-wider whitespace-nowrap">Customer</th>
                <th className="text-left px-4 py-3 font-mono font-bold text-charcoal-500 uppercase tracking-wider whitespace-nowrap">Rep</th>
                <th className="text-left px-4 py-3 font-mono font-bold text-charcoal-500 uppercase tracking-wider whitespace-nowrap">Stage</th>
                <th className="text-right px-4 py-3 font-mono font-bold text-charcoal-500 uppercase tracking-wider whitespace-nowrap">Total</th>
                <th className="text-right px-4 py-3 font-mono font-bold text-charcoal-500 uppercase tracking-wider whitespace-nowrap">Margin</th>
                <th className="text-right px-4 py-3 font-mono font-bold text-charcoal-500 uppercase tracking-wider whitespace-nowrap">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-border">
              {filteredSales.slice(0, 25).map((q: any, i: number) => (
                <tr
                  key={q._id || i}
                  className="hover:bg-brand-50/30 cursor-pointer transition-colors"
                  onClick={() => onNavigate('quotations')}
                >
                  <td className="px-4 py-2.5 font-mono font-bold text-charcoal-900 whitespace-nowrap">{q.quoteNumber}</td>
                  <td className="px-4 py-2.5 font-medium text-charcoal-800 whitespace-nowrap">{q.customerId?.companyName || '—'}</td>
                  <td className="px-4 py-2.5 text-charcoal-600 whitespace-nowrap">{q.salesRepId?.name || '—'}</td>
                  <td className="px-4 py-2.5">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${STAGE_COLORS[q.stage] || 'bg-cream-100 text-charcoal-600'}`}>
                      {q.stage?.replace(/_/g, ' ') || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono font-bold text-charcoal-900 whitespace-nowrap">
                    ₹{Number(q.totalAmount || 0).toLocaleString('en-IN')}
                  </td>
                  <td className={`px-4 py-2.5 text-right font-mono font-bold whitespace-nowrap ${
                    (q.grossMarginPct || 0) >= 20 ? 'text-emerald-700' : 'text-amber-700'
                  }`}>
                    {(q.grossMarginPct || 0).toFixed(1)}%
                  </td>
                  <td className="px-4 py-2.5 text-right text-charcoal-500 whitespace-nowrap">
                    {q.createdAt ? new Date(q.createdAt).toLocaleDateString('en-IN') : '—'}
                  </td>
                </tr>
              ))}
              {filteredSales.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-charcoal-400 font-medium text-xs">
                    No records match the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {filteredSales.length > 25 && (
          <p className="text-[11px] text-charcoal-400 font-medium text-right">
            Showing 25 of {filteredSales.length} records. Use Export CSV for full data.
          </p>
        )}
      </div>
    </div>
  );
};
