import React, { useState, useEffect } from 'react';
import { api } from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/ui/StatusBadge';
import {
  Package,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Clock,
  Calendar,
  Building2,
  Layers,
} from 'lucide-react';

export const BackordersPage: React.FC<{
  onNavigate: (page: string, id?: string) => void;
}> = ({ onNavigate }) => {
  const { role } = useAuth();
  const [backorders, setBackorders] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string>('');

  const fetchBackorders = async () => {
    try {
      setLoading(true);
      const res = await api.getBackorders();
      if (res.data.success) {
        setBackorders(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching backorders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBackorders();
  }, []);

  const handleResolve = async (id: string) => {
    try {
      setResolvingId(id);
      const res = await api.resolveBackorder(id);
      if (res.data.success) {
        setSuccessMessage('Backorder fulfilled from replenishment shipment.');
        await fetchBackorders();
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err) {
      console.error('Failed to resolve backorder:', err);
    } finally {
      setResolvingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-cream-border">
        <div>
          <div className="text-[10px] font-mono tracking-widest text-charcoal-400 uppercase font-bold mb-1">
            SUPPLY CHAIN / DEFICITS
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-charcoal-900 flex items-center gap-2.5">
            <Package className="w-6 h-6 text-rose-500" />
            <span>Backorders & Supply Shortages</span>
          </h1>
          <p className="text-xs sm:text-sm text-charcoal-600 mt-1">
            Track unfulfilled quantities when order demand exceeds physical warehouse stock.
          </p>
        </div>

        <button
          onClick={() => onNavigate('fulfillment')}
          className="inline-flex items-center gap-2 bg-charcoal-900 hover:bg-black text-white text-xs font-bold px-4 py-2.5 rounded-2xl shadow-subtle transition-all active:scale-[0.98]"
        >
          <span>Fulfillment Allocator</span>
        </button>
      </div>

      {successMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-center gap-2.5 font-bold shadow-subtle">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      <div className="bg-white border border-cream-border rounded-2xl overflow-hidden shadow-subtle">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-cream-300 border-t-brand-500"></div>
          </div>
        ) : backorders.length === 0 ? (
          <div className="text-center py-16 text-charcoal-500 text-xs font-medium">
            <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-600 opacity-80" />
            No open backorders. All warehouse demands are fully stocked.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] uppercase tracking-wider text-charcoal-500 bg-cream-50/60 border-b border-cream-border">
                <tr>
                  <th className="py-3 px-4 font-bold">Backorder #</th>
                  <th className="py-3 px-4 font-bold">Quotation #</th>
                  <th className="py-3 px-4 font-bold">Customer</th>
                  <th className="py-3 px-4 font-bold">Product</th>
                  <th className="py-3 px-4 font-bold text-right">Quantity Deficit</th>
                  <th className="py-3 px-4 font-bold">Restock ETA</th>
                  <th className="py-3 px-4 font-bold">Status</th>
                  <th className="py-3 px-4 font-bold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-border/60">
                {backorders.map((bo) => (
                  <tr key={bo._id} className="hover:bg-cream-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-charcoal-900">{bo.backorderNumber}</td>
                    <td className="py-3.5 px-4 font-mono font-medium text-charcoal-600">
                      {bo.quotationId?.quoteNumber || 'QT-Deal'}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-charcoal-900">
                      {bo.customerId?.companyName || 'ABC Corp'}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-charcoal-800">{bo.productName}</td>
                    <td className="py-3.5 px-4 text-right font-bold text-rose-600 font-mono tabular-nums">
                      {bo.quantityBackordered} Units
                    </td>
                    <td className="py-3.5 px-4 text-charcoal-600 font-mono font-medium">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-charcoal-400" />
                        {new Date(bo.estimatedRestockDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={bo.status} size="xs" />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {bo.status === 'OPEN' && (
                        <button
                          onClick={() => handleResolve(bo._id)}
                          disabled={resolvingId === bo._id}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3 py-1.5 rounded-xl shadow-subtle transition-all disabled:opacity-50"
                        >
                          <span>{resolvingId === bo._id ? 'Resolving...' : 'Receive & Fulfill'}</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
