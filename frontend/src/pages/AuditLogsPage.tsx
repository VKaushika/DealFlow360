import React, { useState, useEffect } from 'react';
import { api } from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import {
  History,
  Search,
  Filter,
  ShieldCheck,
  User,
  Clock,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export const AuditLogsPage: React.FC<{
  onNavigate: (page: string, id?: string) => void;
}> = ({ onNavigate }) => {
  const { role } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>('');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (entityTypeFilter) params.entityType = entityTypeFilter;

      const res = await api.getAuditLogs(params);
      if (res.data.success) {
        setLogs(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [entityTypeFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-cream-border">
        <div>
          <div className="text-[10px] font-mono tracking-widest text-charcoal-400 uppercase font-bold mb-1">
            SECURITY & COMPLIANCE / AUDIT
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-charcoal-900 flex items-center gap-2.5">
            <History className="w-6 h-6 text-brand-500" />
            <span>Immutable Audit Trail</span>
          </h1>
          <p className="text-xs sm:text-sm text-charcoal-600 mt-1">
            Complete compliance logging of state transitions, discount decisions, approval events, fulfillment splits, and billing transactions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-charcoal-400" />
          <select
            value={entityTypeFilter}
            onChange={(e) => setEntityTypeFilter(e.target.value)}
            className="bg-white border border-cream-border text-xs text-charcoal-900 rounded-xl px-3.5 py-2 focus:border-brand-500 focus:outline-none font-bold shadow-subtle"
          >
            <option value="">All Entities</option>
            <option value="QUOTATION">Quotation</option>
            <option value="APPROVAL">Approval</option>
            <option value="FULFILLMENT">Fulfillment</option>
            <option value="INVOICE">Invoice</option>
            <option value="SUBSCRIPTION">Subscription</option>
            <option value="NEGOTIATION">Negotiation</option>
          </select>
        </div>
      </div>

      <div className="bg-white border border-cream-border rounded-2xl overflow-hidden shadow-subtle">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-cream-300 border-t-brand-500"></div>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-16 text-charcoal-500 text-xs font-medium">
            No audit log entries recorded.
          </div>
        ) : (
          <div className="divide-y divide-cream-border/60 text-xs">
            {logs.map((log) => {
              const isExpanded = expandedLogId === log._id;
              return (
                <div key={log._id} className="p-5 hover:bg-cream-50/40 transition-colors space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-xs bg-brand-50 text-brand-900 px-2.5 py-0.5 rounded-lg font-mono border border-brand-200">
                        {log.action}
                      </span>
                      <span className="text-[10px] font-bold uppercase bg-cream-100 text-charcoal-700 px-2 py-0.5 rounded-md border border-cream-border font-mono">
                        {log.entityType}
                      </span>
                      {log.entityNumber && (
                        <span className="font-mono text-charcoal-900 font-bold">{log.entityNumber}</span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-charcoal-500">
                      <span className="flex items-center gap-1 font-medium">
                        <User className="w-3.5 h-3.5 text-charcoal-400" />
                        <strong className="text-charcoal-900 font-bold">{log.actorName}</strong> ({log.actorRole})
                      </span>
                      <span className="flex items-center gap-1 text-charcoal-400 font-mono font-medium">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-charcoal-700 font-medium">{log.notes || 'State transition executed successfully.'}</p>

                  {(log.beforeState || log.afterState) && (
                    <div>
                      <button
                        onClick={() => setExpandedLogId(isExpanded ? null : log._id)}
                        className="text-[11px] text-brand-600 hover:text-brand-700 font-bold inline-flex items-center gap-1 mt-1 transition-colors"
                      >
                        <span>{isExpanded ? 'Hide Payload Diff' : 'View Before / After JSON Diff'}</span>
                        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>

                      {isExpanded && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 p-4 bg-cream-50/70 rounded-xl border border-cream-border text-[11px] font-mono">
                          <div>
                            <span className="text-charcoal-600 block mb-1.5 text-[10px] uppercase font-bold">Before State:</span>
                            <pre className="text-amber-800 overflow-x-auto p-3 bg-white rounded-lg border border-cream-border">
                              {JSON.stringify(log.beforeState, null, 2) || 'null'}
                            </pre>
                          </div>
                          <div>
                            <span className="text-charcoal-600 block mb-1.5 text-[10px] uppercase font-bold">After State:</span>
                            <pre className="text-emerald-800 overflow-x-auto p-3 bg-white rounded-lg border border-cream-border">
                              {JSON.stringify(log.afterState, null, 2) || 'null'}
                            </pre>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
