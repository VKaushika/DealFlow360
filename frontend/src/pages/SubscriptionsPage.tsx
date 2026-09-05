import React, { useState, useEffect } from 'react';
import { api } from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/ui/StatusBadge';
import {
  Repeat,
  Sparkles,
  Calendar,
  DollarSign,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Sliders,
  History,
  Building2,
  X,
} from 'lucide-react';

export const SubscriptionsPage: React.FC<{
  onNavigate: (page: string, id?: string) => void;
}> = ({ onNavigate }) => {
  const { role } = useAuth();
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [selectedSub, setSelectedSub] = useState<any>(null);
  const [newUnitPrice, setNewUnitPrice] = useState<number>(0);
  const [newQuantity, setNewQuantity] = useState<number>(1);
  const [changeNotes, setChangeNotes] = useState<string>('Mid-cycle upgrade to enhanced support tier.');
  const [prorationPreview, setProrationPreview] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>('');

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const res = await api.getSubscriptions();
      if (res.data.success) {
        setSubscriptions(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching subscriptions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  // Proration calculation
  useEffect(() => {
    if (selectedSub) {
      const oldRate = selectedSub.totalRecurringAmount || (selectedSub.unitPrice * selectedSub.quantity * 1.18);
      const newSubtotal = newUnitPrice * newQuantity;
      const newTotal = newSubtotal + (newSubtotal * 0.18);
      const daysRemaining = 15;
      const totalDays = 30;
      const rateDiff = newTotal - oldRate;
      const proratedDelta = Math.round((rateDiff * (daysRemaining / totalDays)) * 100) / 100;

      setProrationPreview({
        oldRate: Math.round(oldRate),
        newRate: Math.round(newTotal),
        daysRemaining,
        proratedDelta,
      });
    }
  }, [selectedSub, newUnitPrice, newQuantity]);

  const handleModifySubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSub) return;
    try {
      setActionLoading(true);
      const res = await api.modifySubscription(selectedSub._id, {
        newUnitPrice,
        newQuantity,
        notes: changeNotes,
      });
      if (res.data.success) {
        setSuccessMessage('Subscription modified with day-based proration recorded!');
        setSelectedSub(null);
        await fetchSubscriptions();
        setTimeout(() => setSuccessMessage(''), 4000);
      }
    } catch (err) {
      console.error('Failed to modify subscription:', err);
    } finally {
      setActionLoading(false);
    }
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-cream-border">
        <div>
          <div className="text-[10px] font-mono tracking-widest text-charcoal-400 uppercase font-bold mb-1">
            REVENUE / SUBSCRIPTIONS
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-charcoal-900 flex items-center gap-2.5">
            <Repeat className="w-6 h-6 text-brand-500" />
            <span>Recurring Contracts & Subscriptions</span>
          </h1>
          <p className="text-xs sm:text-sm text-charcoal-600 mt-1">
            Manage recurring SLA contracts, SaaS tiers, and mid-cycle day-based proration adjustments.
          </p>
        </div>

        <button
          onClick={() => onNavigate('billing')}
          className="inline-flex items-center gap-2 bg-white hover:bg-cream-50 text-charcoal-800 text-xs font-bold px-4 py-2.5 rounded-2xl border border-cream-border shadow-subtle transition-all active:scale-[0.98]"
        >
          <span>One-Time Invoices</span>
        </button>
      </div>

      {successMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-center gap-2.5 font-bold shadow-subtle">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Subscriptions Table */}
      <div className="bg-white border border-cream-border rounded-2xl overflow-hidden shadow-subtle">
        <div className="p-4 border-b border-cream-border flex items-center justify-between">
          <h3 className="font-bold text-sm text-charcoal-900">Active Subscriptions</h3>
          <span className="text-xs font-mono font-bold text-charcoal-500">{subscriptions.length} contract(s)</span>
        </div>

        {subscriptions.length === 0 ? (
          <div className="text-center py-16 text-charcoal-500 text-xs font-medium">
            <Repeat className="w-8 h-8 mx-auto mb-2 text-charcoal-300" />
            No active subscriptions found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] uppercase tracking-wider text-charcoal-500 bg-cream-50/60 border-b border-cream-border">
                <tr>
                  <th className="py-3 px-4 font-bold">Subscription #</th>
                  <th className="py-3 px-4 font-bold">Customer</th>
                  <th className="py-3 px-4 font-bold">Service Product</th>
                  <th className="py-3 px-4 font-bold">Cadence</th>
                  <th className="py-3 px-4 font-bold text-right">Monthly Rate</th>
                  <th className="py-3 px-4 font-bold">Next Renewal</th>
                  <th className="py-3 px-4 font-bold">Status</th>
                  <th className="py-3 px-4 font-bold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-border/60">
                {subscriptions.map((sub) => (
                  <tr key={sub._id} className="hover:bg-cream-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-charcoal-900">{sub.subscriptionNumber}</td>
                    <td className="py-3.5 px-4 font-bold text-charcoal-900">
                      {sub.customerId?.companyName || 'ABC Corporation'}
                    </td>
                    <td className="py-3.5 px-4 text-charcoal-700 font-medium">{sub.productName}</td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-charcoal-500">{sub.billingFrequency}</td>
                    <td className="py-3.5 px-4 text-right font-bold text-charcoal-900 font-mono tabular-nums">
                      ₹{Number(sub.totalRecurringAmount || 0).toLocaleString('en-IN')}/mo
                    </td>
                    <td className="py-3.5 px-4 text-charcoal-600 font-mono font-medium">
                      {new Date(sub.nextBillingDate).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={sub.status} size="xs" />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedSub(sub);
                          setNewUnitPrice(sub.unitPrice);
                          setNewQuantity(sub.quantity);
                        }}
                        className="bg-white hover:bg-cream-50 text-charcoal-800 text-xs font-bold px-3 py-1.5 rounded-xl border border-cream-border transition-colors inline-flex items-center gap-1.5 shadow-subtle"
                      >
                        <Sliders className="w-3 h-3 text-brand-600" />
                        <span>Modify / Prorate</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Proration Modal */}
      {selectedSub && (
        <div className="fixed inset-0 bg-charcoal-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-cream-border rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-cream-border">
              <div>
                <h3 className="font-bold text-sm text-charcoal-900 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-brand-500" />
                  <span>Modify Subscription & Proration</span>
                </h3>
                <p className="text-xs text-charcoal-500 font-mono mt-0.5">{selectedSub.subscriptionNumber}</p>
              </div>
              <button
                onClick={() => setSelectedSub(null)}
                className="text-charcoal-400 hover:text-charcoal-800 p-1.5 rounded-lg hover:bg-cream-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleModifySubscription} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-charcoal-700 mb-1 font-bold">New Unit Price (₹)</label>
                  <input
                    type="number"
                    min={100}
                    value={newUnitPrice}
                    onChange={(e) => setNewUnitPrice(parseFloat(e.target.value) || 0)}
                    className="w-full bg-cream-50 border border-cream-border text-charcoal-900 rounded-xl p-2.5 font-mono font-bold focus:border-brand-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-charcoal-700 mb-1 font-bold">Quantity Units</label>
                  <input
                    type="number"
                    min={1}
                    value={newQuantity}
                    onChange={(e) => setNewQuantity(parseInt(e.target.value) || 1)}
                    className="w-full bg-cream-50 border border-cream-border text-charcoal-900 rounded-xl p-2.5 font-mono font-bold focus:border-brand-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* Live Proration Breakdown Box */}
              {prorationPreview && (
                <div className="bg-cream-50/70 border border-cream-border p-4 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-charcoal-900 text-xs">Day-Based Proration Preview</span>
                    <span className="text-[10px] bg-white text-charcoal-700 px-2 py-0.5 rounded font-mono font-bold border border-cream-border">
                      15 Days Remaining
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2.5 text-center pt-1">
                    <div className="bg-white p-2.5 rounded-xl border border-cream-border">
                      <span className="text-[10px] text-charcoal-500 block font-semibold">Current Rate</span>
                      <strong className="text-charcoal-800 font-mono font-bold">₹{prorationPreview.oldRate}</strong>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-cream-border">
                      <span className="text-[10px] text-charcoal-500 block font-semibold">New Rate</span>
                      <strong className="text-emerald-700 font-mono font-bold">₹{prorationPreview.newRate}</strong>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-cream-border">
                      <span className="text-[10px] text-charcoal-500 block font-semibold">Prorated Delta</span>
                      <strong className={prorationPreview.proratedDelta >= 0 ? 'text-amber-700 font-mono font-bold' : 'text-emerald-700 font-mono font-bold'}>
                        {prorationPreview.proratedDelta >= 0 ? `+₹${prorationPreview.proratedDelta}` : `-₹${Math.abs(prorationPreview.proratedDelta)}`}
                      </strong>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[11px] text-charcoal-700 mb-1 font-bold">Change Reason / Audit Note</label>
                <input
                  type="text"
                  value={changeNotes}
                  onChange={(e) => setChangeNotes(e.target.value)}
                  className="w-full bg-cream-50 border border-cream-border text-charcoal-900 font-medium rounded-xl p-2.5 focus:border-brand-500 focus:outline-none"
                  required
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-cream-border">
                <button
                  type="button"
                  onClick={() => setSelectedSub(null)}
                  className="bg-cream-100 hover:bg-cream-200 text-charcoal-800 font-bold px-4 py-2 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="bg-charcoal-900 hover:bg-black text-white font-bold px-4 py-2 rounded-xl shadow-subtle disabled:opacity-50"
                >
                  Apply Modification
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
