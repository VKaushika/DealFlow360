import React, { useState, useEffect } from 'react';
import { api } from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/ui/StatusBadge';
import { MetricCard } from '../components/ui/MetricCard';
import {
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle2,
  Package,
  Activity,
  Plus,
  ArrowRight,
  ShieldCheck,
  Building2,
  ExternalLink,
  ChevronRight,
  ClipboardList,
  BarChart2,
  Layers,
} from 'lucide-react';

export const DashboardPage: React.FC<{ onNavigate: (page: string, id?: string) => void }> = ({
  onNavigate,
}) => {
  const { role } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [healthAlerts, setHealthAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dashRes, healthRes] = await Promise.all([
          api.getDashboardReports(),
          api.getDealHealth(),
        ]);
        if (dashRes.data.success) {
          setStats(dashRes.data.data);
        }
        if (healthRes.data.success) {
          setHealthAlerts(healthRes.data.data || []);
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-cream-darkBorder border-t-brand-500"></div>
      </div>
    );
  }

  const kpi = stats?.kpi || {
    totalPipelineValue: 0,
    overallGrossMarginPct: 0,
    pendingApprovalsCount: 0,
    totalQuotesCount: 0,
    invoiceRevenue: 0,
    monthlyRecurringRevenue: 0,
    openBackordersCount: 0,
  };

  const formatCurrency = (val: number) => {
    return `₹${Number(val || 0).toLocaleString('en-IN')}`;
  };

  const todayDateString = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).toUpperCase();

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Page Header matching the screenshot */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="text-[11px] font-mono font-bold tracking-widest text-charcoal-500 uppercase mb-2">
            COMMAND CENTER / {todayDateString}
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-charcoal-900 tracking-tight">
            Good morning, deal desk
          </h1>
          <p className="text-sm text-charcoal-500 mt-1.5">
            A live read on commercial momentum, approvals, and downstream risk.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('quotation-builder')}
            className="inline-flex items-center gap-2 bg-charcoal-900 hover:bg-black text-white text-xs font-bold px-5 py-3 rounded-2xl shadow-subtle transition-all transform hover:-translate-y-0.5"
          >
            <Plus className="w-4 h-4" />
            <span>+ New quotation</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid matching the screenshot style */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <MetricCard
          title="Pipeline value"
          value={formatCurrency(kpi.totalPipelineValue)}
          subtext="Across active quotations"
          icon={TrendingUp}
          iconBg="bg-orange-100"
          iconColor="text-brand-600"
        />
        <MetricCard
          title="Pending approvals"
          value={kpi.pendingApprovalsCount || 0}
          subtext="Needs a decision today"
          icon={ClipboardList}
          iconBg="bg-cream-200"
          iconColor="text-charcoal-700"
          onClick={() => onNavigate('approvals')}
          badge={kpi.pendingApprovalsCount > 0 ? `${kpi.pendingApprovalsCount} Pending` : undefined}
        />
        <MetricCard
          title="Active orders & fulfillment"
          value={stats?.stageBreakdown?.find((s: any) => s._id === 'READY_FOR_FULFILLMENT' || s._id === 'FULFILLED')?.count || 0}
          subtext="In execution workflow"
          icon={Package}
          iconBg="bg-emerald-100"
          iconColor="text-emerald-700"
          onClick={() => onNavigate('fulfillment')}
        />
        <MetricCard
          title="Gross margin"
          value={`${kpi.overallGrossMarginPct || 0}%`}
          subtext="Blended book margin"
          icon={BarChart2}
          iconBg="bg-charcoal-900"
          iconColor="text-white"
        />
        <MetricCard
          title="Monthly recurring (MRR)"
          value={formatCurrency(kpi.monthlyRecurringRevenue)}
          subtext="Active subscriptions"
          icon={DollarSign}
          iconBg="bg-purple-100"
          iconColor="text-purple-700"
          onClick={() => onNavigate('subscriptions')}
        />
        <MetricCard
          title="Open backorders"
          value={kpi.openBackordersCount || 0}
          subtext={kpi.openBackordersCount > 0 ? 'Warehouse stock deficits' : 'All warehouses stocked'}
          icon={Layers}
          iconBg={kpi.openBackordersCount > 0 ? "bg-rose-100" : "bg-cream-200"}
          iconColor={kpi.openBackordersCount > 0 ? "text-rose-600" : "text-charcoal-600"}
          onClick={() => onNavigate('backorders')}
        />
      </div>

      {/* Main Sections: Pipeline Posture Table + Deal Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Quotations Table (2 Columns) */}
        <div className="lg:col-span-2 bg-white border border-cream-border rounded-2xl p-6 shadow-subtle">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-cream-border">
            <div>
              <h3 className="font-extrabold text-base text-charcoal-900">
                Pipeline posture
              </h3>
              <p className="text-xs text-charcoal-500 mt-0.5">Quote value by lifecycle state</p>
            </div>
            <button
              onClick={() => onNavigate('quotations')}
              className="text-xs text-charcoal-800 hover:text-black font-bold inline-flex items-center gap-1.5 transition-colors"
            >
              <span>View quotations</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] uppercase tracking-wider text-charcoal-400 border-b border-cream-border font-mono">
                <tr>
                  <th className="py-3 px-3 font-semibold">Quote #</th>
                  <th className="py-3 px-3 font-semibold">Customer</th>
                  <th className="py-3 px-3 font-semibold">Stage</th>
                  <th className="py-3 px-3 font-semibold text-right">Amount</th>
                  <th className="py-3 px-3 font-semibold text-right">Margin</th>
                  <th className="py-3 px-3 font-semibold">Risk</th>
                  <th className="py-3 px-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-border">
                {(stats?.recentQuotes || []).map((quote: any) => (
                  <tr
                    key={quote._id}
                    className="hover:bg-cream-50 transition-colors cursor-pointer group"
                    onClick={() => onNavigate('quotation-builder', quote._id)}
                  >
                    <td className="py-3.5 px-3 font-mono font-bold text-charcoal-900 group-hover:text-brand-600">
                      {quote.quoteNumber}
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="font-bold text-charcoal-900">
                        {quote.customerId?.companyName || 'Customer'}
                      </div>
                      <div className="text-[10px] text-charcoal-400 font-mono">
                        Tier {quote.customerId?.tier}
                      </div>
                    </td>
                    <td className="py-3.5 px-3">
                      <StatusBadge status={quote.stage} size="xs" />
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono font-bold text-charcoal-900 tabular-nums">
                      ₹{Number(quote.totalAmount || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono font-bold tabular-nums">
                      <span className={quote.grossMarginPct >= 20 ? 'text-emerald-700' : 'text-amber-700'}>
                        {quote.grossMarginPct}%
                      </span>
                    </td>
                    <td className="py-3.5 px-3">
                      <StatusBadge status={quote.riskLevel} size="xs" />
                    </td>
                    <td className="py-3.5 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => onNavigate('quotation-builder', quote._id)}
                        className="p-1 text-charcoal-400 hover:text-charcoal-900 hover:bg-cream-100 rounded-lg transition-colors"
                        title="Open Quote Builder"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Deal Health Anomaly Radar (1 Column) */}
        <div className="bg-white border border-cream-border rounded-2xl p-6 flex flex-col justify-between shadow-subtle">
          <div>
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-cream-border">
              <div>
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-brand-600" />
                  <h3 className="font-extrabold text-base text-charcoal-900">Deal health</h3>
                </div>
                <p className="text-xs text-charcoal-500 mt-0.5">Issues requiring attention</p>
              </div>
              <button
                onClick={() => onNavigate('deal-health')}
                className="text-xs text-charcoal-800 hover:text-black font-bold inline-flex items-center gap-1.5 transition-colors"
              >
                <span>View all</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {healthAlerts.slice(0, 4).map((alert: any) => (
                <div
                  key={alert._id}
                  onClick={() => onNavigate('deal-health')}
                  className="p-3.5 bg-cream-50 border border-cream-border rounded-2xl hover:border-cream-darkBorder cursor-pointer transition-all shadow-subtle"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-mono font-bold text-charcoal-500">
                      {alert.quotationId?.quoteNumber || alert.eventType}
                    </span>
                    <StatusBadge status={alert.severity} size="xs" />
                  </div>
                  <h4 className="text-xs font-bold text-charcoal-900 line-clamp-1">{alert.title}</h4>
                  <p className="text-[11px] text-charcoal-500 mt-0.5 line-clamp-1">{alert.description}</p>
                  <div className="mt-2.5 pt-2 border-t border-cream-border flex items-center justify-between text-[11px] text-brand-700 font-bold">
                    <span>View Deal</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              ))}

              {healthAlerts.length === 0 && (
                <div className="text-center py-10 text-charcoal-400 text-xs">
                  <ShieldCheck className="w-8 h-8 mx-auto mb-2 text-emerald-600 opacity-80" />
                  No operational risk anomalies detected.
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-cream-border text-[11px] text-charcoal-400 flex items-center justify-between">
            <span>Automated Rule Scans</span>
            <span className="text-emerald-700 font-bold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
              Live Active
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
