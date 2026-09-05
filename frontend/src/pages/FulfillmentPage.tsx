import React, { useState, useEffect } from 'react';
import { api } from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/ui/StatusBadge';
import {
  Truck,
  Warehouse as WarehouseIcon,
  Package,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Layers,
  DollarSign,
  Send,
} from 'lucide-react';

export const FulfillmentPage: React.FC<{
  onNavigate: (page: string, id?: string) => void;
}> = ({ onNavigate }) => {
  const { role, user } = useAuth();
  const [fulfillments, setFulfillments] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [stockSummary, setStockSummary] = useState<any[]>([]);
  const [approvedQuotations, setApprovedQuotations] = useState<any[]>([]);
  const [selectedQuotationId, setSelectedQuotationId] = useState<string>('');
  const [allocationPlan, setAllocationPlan] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [allocating, setAllocating] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [fulRes, whRes, stockRes, quoteRes] = await Promise.all([
        api.getFulfillments(),
        api.getWarehouses(),
        api.getStockSummary(),
        api.getQuotations({ stage: 'APPROVED' }),
      ]);

      if (fulRes.data.success) setFulfillments(fulRes.data.data);
      if (whRes.data.success) setWarehouses(whRes.data.data);
      if (stockRes.data.success) setStockSummary(stockRes.data.data);
      if (quoteRes.data.success) {
        setApprovedQuotations(quoteRes.data.data);
        if (quoteRes.data.data.length > 0 && !selectedQuotationId) {
          setSelectedQuotationId(quoteRes.data.data[0]._id);
        }
      }
    } catch (err) {
      console.error('Error fetching fulfillment data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const fetchPlan = async () => {
      if (!selectedQuotationId) {
        setAllocationPlan(null);
        return;
      }
      try {
        const res = await api.getFulfillmentPlan(selectedQuotationId);
        if (res.data.success) {
          setAllocationPlan(res.data.data);
        }
      } catch (err: any) {
        setErrorMessage(err.response?.data?.message || 'Failed to calculate allocation plan.');
      }
    };
    fetchPlan();
  }, [selectedQuotationId]);

  const handleExecuteFulfillment = async () => {
    if (!selectedQuotationId) return;
    try {
      setAllocating(true);
      setSuccessMessage('');
      setErrorMessage('');

      const res = await api.allocateFulfillment({ quotationId: selectedQuotationId });
      if (res.data.success) {
        setSuccessMessage(res.data.message);
        await fetchData();
        setAllocationPlan(null);
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || err.message);
    } finally {
      setAllocating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-cream-darkBorder border-t-brand-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-cream-border">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-charcoal-900 flex items-center gap-2">
            <Truck className="w-6 h-6 text-brand-500" />
            <span>Orders & Fulfillment Allocation</span>
          </h1>
          <p className="text-xs sm:text-sm text-charcoal-500 mt-1">
            Real-time stock checking, automated multi-warehouse split dispatch, and backorder mitigation.
          </p>
        </div>

        <button
          onClick={() => onNavigate('backorders')}
          className="inline-flex items-center gap-2 bg-white hover:bg-cream-50 text-charcoal-800 text-xs font-bold px-4 py-2.5 rounded-2xl border border-cream-border shadow-subtle transition-colors"
        >
          <Package className="w-4 h-4 text-rose-500" />
          <span>View Backorders Queue</span>
        </button>
      </div>

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-center gap-2.5 font-semibold">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}
      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs flex items-center gap-2.5 font-semibold">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Warehouse Stock Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {warehouses.map((wh) => {
          const whStocks = stockSummary.filter((s) => s.warehouseId?._id === wh._id);
          const totalAvail = whStocks.reduce((acc, s) => acc + (s.quantityAvailable || 0), 0);
          return (
            <div key={wh._id} className="bg-white border border-cream-border p-5 rounded-2xl shadow-subtle">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <WarehouseIcon className="w-4 h-4 text-charcoal-500" />
                  <span className="font-extrabold text-xs text-charcoal-900">{wh.name}</span>
                </div>
                {wh.isDefault && (
                  <span className="text-[10px] font-mono font-bold bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full border border-brand-200">
                    Primary Hub
                  </span>
                )}
              </div>
              <p className="text-[11px] text-charcoal-500">{wh.location}</p>
              <div className="mt-3.5 pt-2.5 border-t border-cream-border flex items-center justify-between text-xs">
                <span className="text-charcoal-400 text-[11px] font-mono">Available Units:</span>
                <span className="font-extrabold text-charcoal-900 font-mono tabular-nums">{totalAvail}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Allocation Engine Workspace */}
      <div className="bg-white border border-cream-border rounded-2xl p-6 space-y-5 shadow-subtle">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-cream-border">
          <div>
            <h3 className="font-extrabold text-base text-charcoal-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-500" />
              <span>Multi-Warehouse Auto-Split Allocator</span>
            </h3>
            <p className="text-xs text-charcoal-500 mt-0.5">
              Select an approved quotation to calculate optimal stock allocations.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <select
              value={selectedQuotationId}
              onChange={(e) => setSelectedQuotationId(e.target.value)}
              className="bg-cream-50 border border-cream-border text-xs text-charcoal-900 font-semibold rounded-xl px-3 py-2 focus:border-brand-500 focus:outline-none font-mono"
            >
              <option value="">-- Select Approved Quotation --</option>
              {approvedQuotations.map((q) => (
                <option key={q._id} value={q._id}>
                  {q.quoteNumber} — {q.customerId?.companyName} (₹{q.totalAmount?.toLocaleString('en-IN')})
                </option>
              ))}
            </select>

            <button
              onClick={handleExecuteFulfillment}
              disabled={allocating || !selectedQuotationId || !allocationPlan}
              className="inline-flex items-center gap-2 bg-charcoal-900 hover:bg-black text-white text-xs font-bold px-4 py-2 rounded-xl shadow-subtle transition-all disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5 text-brand-400" />
              <span>Execute Allocation</span>
            </button>
          </div>
        </div>

        {/* Live Plan Preview */}
        {allocationPlan ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 text-xs">
            {/* Split Shipments Plan */}
            <div className="lg:col-span-2 space-y-3.5">
              <h4 className="font-extrabold text-xs uppercase tracking-wider text-charcoal-500 font-mono">
                Calculated Warehouse Allocations
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {allocationPlan.allocations.map((alloc: any, aIdx: number) => (
                  <div key={aIdx} className="bg-cream-50 p-4 rounded-2xl border border-cream-border space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-charcoal-900 flex items-center gap-1.5">
                        <WarehouseIcon className="w-4 h-4 text-charcoal-500" />
                        {alloc.warehouseName}
                      </span>
                      <span className="text-[10px] bg-white text-charcoal-700 px-2 py-0.5 rounded-md font-mono font-bold border border-cream-border">
                        Shipment #{aIdx + 1}
                      </span>
                    </div>

                    <div className="space-y-1.5 pt-1">
                      {alloc.items.map((it: any, itIdx: number) => (
                        <div key={itIdx} className="flex items-center justify-between text-[11px] text-charcoal-700">
                          <span>{it.productName}</span>
                          <span className="font-mono font-extrabold text-charcoal-900 bg-white px-2 py-0.5 rounded-md border border-cream-border">
                            {it.quantity} Units
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2.5 border-t border-cream-border flex items-center justify-between text-[10px] text-charcoal-500">
                      <span>Freight Cost: ₹{alloc.estimatedCost}</span>
                      <span className="text-emerald-700 font-bold">Stock Reserved</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Backorders Notification */}
              {allocationPlan.hasBackorders && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-1.5">
                  <div className="flex items-center gap-2 text-rose-800 font-bold text-xs">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>Inventory Shortage — Backorders Generated:</span>
                  </div>
                  {allocationPlan.backorders.map((bo: any, bIdx: number) => (
                    <div key={bIdx} className="text-[11px] text-rose-900 flex items-center justify-between font-mono font-bold">
                      <span>{bo.productName}</span>
                      <span>-{bo.quantityBackordered} Units Deficit</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Shipment Summary KPI Box */}
            <div className="bg-cream-50 p-5 rounded-2xl border border-cream-border flex flex-col justify-between space-y-4">
              <div>
                <h4 className="font-extrabold text-xs uppercase tracking-wider text-charcoal-500 mb-3 font-mono">
                  Dispatch Summary
                </h4>
                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between text-charcoal-600">
                    <span>Total Shipments:</span>
                    <strong className="text-charcoal-900 font-mono font-bold">{allocationPlan.totalShipments}</strong>
                  </div>
                  <div className="flex justify-between text-charcoal-600">
                    <span>Estimated Shipping:</span>
                    <strong className="text-emerald-700 font-mono font-bold">₹{allocationPlan.totalEstimatedCost}</strong>
                  </div>
                  <div className="flex justify-between text-charcoal-600">
                    <span>Backorder Status:</span>
                    <strong className={allocationPlan.hasBackorders ? 'text-rose-700 font-bold' : 'text-emerald-700 font-bold'}>
                      {allocationPlan.hasBackorders ? 'Stock Shortage' : '100% Available'}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="text-[10px] text-charcoal-500 bg-white p-3 rounded-xl border border-cream-border leading-relaxed">
                * Auto-split optimization balances inventory availability with minimal multi-hub freight costs.
              </div>
            </div>
          </div>
        ) : (
          <p className="text-charcoal-400 text-xs">
            Select an approved quotation above to preview warehouse auto-split.
          </p>
        )}
      </div>

      {/* Dispatched Fulfillments Table */}
      <div className="bg-white border border-cream-border rounded-2xl p-6 shadow-subtle">
        <h3 className="font-extrabold text-base text-charcoal-900 mb-4 pb-3 border-b border-cream-border">
          Dispatched Fulfillment Orders
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-[11px] uppercase tracking-wider text-charcoal-400 border-b border-cream-border font-mono">
              <tr>
                <th className="py-3 px-3">Quotation #</th>
                <th className="py-3 px-3">Customer</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Shipments</th>
                <th className="py-3 px-3">Warehouse Hubs</th>
                <th className="py-3 px-3 text-right">Allocated Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-border">
              {fulfillments.map((f) => (
                <tr key={f._id} className="hover:bg-cream-50 transition-colors">
                  <td className="py-3 px-3 font-mono font-bold text-charcoal-900">
                    {f.quotationId?.quoteNumber || 'QT-Deal'}
                  </td>
                  <td className="py-3 px-3 font-bold text-charcoal-900">
                    {f.customerId?.companyName || 'ABC Corporation'}
                  </td>
                  <td className="py-3 px-3">
                    <StatusBadge status={f.status} size="xs" />
                  </td>
                  <td className="py-3 px-3 font-mono text-charcoal-600">{f.totalShipments} Shipment(s)</td>
                  <td className="py-3 px-3 text-charcoal-700">
                    {f.allocations?.map((a: any) => a.warehouseName).join(' + ') || 'Main Hub'}
                  </td>
                  <td className="py-3 px-3 text-right text-charcoal-500 font-mono">
                    {new Date(f.allocatedAt || f.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
