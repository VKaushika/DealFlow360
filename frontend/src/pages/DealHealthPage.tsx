import React, { useState, useEffect } from 'react';
import { api } from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/ui/StatusBadge';
import { MetricCard } from '../components/ui/MetricCard';
import {
  Activity,
  AlertTriangle,
  Clock,
  Truck,
  TrendingDown,
  MessageSquare,
  CheckCircle2,
  Bell,
  ArrowRight,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';

export const DealHealthPage: React.FC<{
  onNavigate: (page: string, id?: string) => void;
}> = ({ onNavigate }) => {
  const { role } = useAuth();
  const [healthData, setHealthData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionSuccess, setActionSuccess] = useState<string>('');

  const fetchHealth = async () => {
    try {
      setLoading(true);
      const res = await api.getDealHealth();
      if (res.data.success) {
        setHealthData(res.data);
      }
    } catch (err) {
      console.error('Error fetching deal health:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const handleResolve = async (id: string) => {
    try {
      const res = await api.resolveHealthEvent(id);
      if (res.data.success) {
        setActionSuccess('Health anomaly marked as resolved.');
        await fetchHealth();
        setTimeout(() => setActionSuccess(''), 3000);
      }
    } catch (err) {
      console.error('Failed to resolve anomaly:', err);
    }
  };

  const handleNudge = async (event: any) => {
    try {
      const res = await api.triggerNudge({
        recipientRole: 'SALES_REP',
        title: `Escalation: ${event.title}`,
        message: event.suggestedAction,
        link: `/quotations/${event.quotationId?._id}`,
      });
      if (res.data.success) {
        setActionSuccess('Automated escalation notification dispatched to Sales Rep.');
        setTimeout(() => setActionSuccess(''), 3000);
      }
    } catch (err) {
      console.error('Failed to dispatch nudge:', err);
    }
  };

  const summary = healthData?.summary || {
    totalActiveAnomalies: 0,
    stalledCount: 0,
    discountAnomaliesCount: 0,
    deliveryRiskCount: 0,
    negotiationDelayCount: 0,
  };

  if (loading && !healthData) {
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
            INTELLIGENCE / RADAR
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-charcoal-900 flex items-center gap-2.5">
            <Activity className="w-6 h-6 text-rose-500" />
            <span>Deal Health & Anomaly Radar</span>
          </h1>
          <p className="text-xs sm:text-sm text-charcoal-600 mt-1">
            Automated monitoring of stalled deals, margin violations, inventory bottlenecks, and negotiation latency.
          </p>
        </div>

        <button
          onClick={fetchHealth}
          className="inline-flex items-center gap-2 bg-white hover:bg-cream-50 text-charcoal-800 text-xs font-bold px-4 py-2.5 rounded-2xl border border-cream-border shadow-subtle transition-all active:scale-[0.98]"
        >
          <RefreshCw className="w-4 h-4 text-charcoal-500" />
          <span>Run Diagnostic Scan</span>
        </button>
      </div>

      {actionSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-center gap-2.5 font-bold shadow-subtle">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* 4 Core Metric Categories */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Stalled Deals"
          value={summary.stalledCount}
          subtext="Pending review > 24 hours"
          icon={Clock}
          color="amber"
          trend={{
            value: summary.stalledCount > 0 ? 'Requires attention' : 'On track',
            isPositive: summary.stalledCount === 0,
          }}
        />
        <MetricCard
          title="Discount Anomalies"
          value={summary.discountAnomaliesCount}
          subtext="High margin breach"
          icon={TrendingDown}
          color="rose"
          trend={{
            value: summary.discountAnomaliesCount > 0 ? 'Policy breaches' : 'Zero breaches',
            isPositive: summary.discountAnomaliesCount === 0,
          }}
        />
        <MetricCard
          title="Delivery Risks"
          value={summary.deliveryRiskCount}
          subtext="Inventory backorders"
          icon={Truck}
          color="blue"
          trend={{
            value: summary.deliveryRiskCount > 0 ? 'Stock deficits' : 'Supply healthy',
            isPositive: summary.deliveryRiskCount === 0,
          }}
        />
        <MetricCard
          title="Negotiation Delays"
          value={summary.negotiationDelayCount}
          subtext="Awaiting sales action"
          icon={MessageSquare}
          color="purple"
          trend={{
            value: summary.negotiationDelayCount > 0 ? 'Response pending' : 'Zero delay',
            isPositive: summary.negotiationDelayCount === 0,
          }}
        />
      </div>

      {/* Active Anomalies List */}
      <div className="bg-white border border-cream-border rounded-2xl p-6 space-y-5 shadow-subtle">
        <div className="flex items-center justify-between pb-3 border-b border-cream-border">
          <h3 className="font-bold text-sm text-charcoal-900">
            Active Health Anomalies ({healthData?.data?.length || 0})
          </h3>
          <span className="text-xs font-mono font-bold text-charcoal-500">Deterministic Rule Engine</span>
        </div>

        {(healthData?.data || []).length === 0 ? (
          <div className="text-center py-16 text-charcoal-500 text-xs font-medium">
            <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-600 opacity-80" />
            Zero operational bottlenecks detected. All deal flows healthy.
          </div>
        ) : (
          <div className="space-y-3.5">
            {healthData.data.map((event: any) => (
              <div
                key={event._id}
                className="p-5 bg-cream-50/50 border border-cream-border rounded-xl hover:border-cream-border/80 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <StatusBadge status={event.severity} size="xs" />
                    <span className="text-[10px] font-mono font-bold text-charcoal-600 bg-cream-100 px-2 py-0.5 rounded border border-cream-border">
                      {event.eventType}
                    </span>
                    <span className="text-xs font-mono font-bold text-charcoal-900">
                      {event.quotationId?.quoteNumber || 'QT-Deal'}
                    </span>
                    <span className="text-xs font-medium text-charcoal-600">
                      ({event.customerId?.companyName || 'ABC Corporation'})
                    </span>
                  </div>

                  <h4 className="font-bold text-xs text-charcoal-900">{event.title}</h4>
                  <p className="text-xs text-charcoal-600 font-medium">{event.description}</p>
                  <p className="text-[11px] text-charcoal-800 bg-white px-2.5 py-1.5 rounded-lg border border-cream-border inline-block font-mono font-bold">
                    Suggested Action: {event.suggestedAction}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
                  <button
                    onClick={() => handleNudge(event)}
                    className="inline-flex items-center gap-1.5 bg-brand-500 hover:bg-brand-600 text-charcoal-950 font-bold text-xs px-3.5 py-2 rounded-xl shadow-subtle transition-all"
                  >
                    <Bell className="w-3.5 h-3.5" />
                    <span>Nudge Rep</span>
                  </button>

                  <button
                    onClick={() => handleResolve(event._id)}
                    className="inline-flex items-center gap-1.5 bg-white hover:bg-cream-100 text-charcoal-800 text-xs font-bold px-3.5 py-2 rounded-xl transition-colors border border-cream-border"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Resolve</span>
                  </button>

                  <button
                    onClick={() => onNavigate('quotation-builder', event.quotationId?._id)}
                    className="p-2 bg-white hover:bg-cream-100 text-charcoal-700 rounded-xl border border-cream-border transition-colors"
                    title="Open Deal Workspace"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
