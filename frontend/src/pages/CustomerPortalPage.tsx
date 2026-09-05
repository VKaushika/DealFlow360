import React, { useState, useEffect } from 'react';
import { api } from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/ui/StatusBadge';
import {
  FileText,
  ShieldCheck,
  Building2,
  CheckCircle2,
  Send,
  MessageSquare,
  AlertTriangle,
  Clock,
  Sparkles,
  HelpCircle,
} from 'lucide-react';

export const CustomerPortalPage: React.FC<{
  onNavigate: (page: string, id?: string) => void;
}> = ({ onNavigate }) => {
  const { user, role, switchPersona } = useAuth();
  const [quotations, setQuotations] = useState<any[]>([]);
  const [selectedQuote, setSelectedQuote] = useState<any>(null);
  const [counterDiscountPct, setCounterDiscountPct] = useState<number>(20);
  const [negotiationMessage, setNegotiationMessage] = useState<string>(
    'We are ready to move forward immediately if you can support a 20% discount on this initial deployment.'
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchCustomerData = async () => {
    try {
      setLoading(true);
      const res = await api.getQuotations();
      if (res.data.success) {
        setQuotations(res.data.data);
        if (res.data.data.length > 0) {
          const detailRes = await api.getPortalQuotation(res.data.data[0]._id);
          if (detailRes.data.success) {
            setSelectedQuote(detailRes.data.data);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching portal data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomerData();
  }, [role]);

  const handleSelectQuote = async (id: string) => {
    try {
      setLoading(true);
      const res = await api.getPortalQuotation(id);
      if (res.data.success) {
        setSelectedQuote(res.data.data);
      }
    } catch (err) {
      console.error('Error loading quotation detail:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitCounterOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuote) return;
    try {
      setSubmitting(true);
      setFeedback(null);
      const res = await api.submitCounterDiscount(selectedQuote._id, {
        proposedDiscountPct: counterDiscountPct,
        message: negotiationMessage,
      });

      if (res.data.success) {
        setFeedback({ type: 'success', message: res.data.message });
        await handleSelectQuote(selectedQuote._id);
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.response?.data?.message || err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmQuotation = async () => {
    if (!selectedQuote) return;
    try {
      setSubmitting(true);
      setFeedback(null);
      const res = await api.confirmByCustomer(selectedQuote._id);
      if (res.data.success) {
        setFeedback({ type: 'success', message: res.data.message });
        await handleSelectQuote(selectedQuote._id);
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.response?.data?.message || err.message });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && !selectedQuote) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-cream-300 border-t-brand-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Buyer Portal Isolation Banner */}
      <div className="bg-white border border-cream-border p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-subtle">
        <div>
          <div className="flex items-center gap-3">
            <span className="p-2 bg-brand-100 rounded-xl text-brand-700 border border-brand-200">
              <Building2 className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-lg font-black text-charcoal-900">Customer Workspace — ABC Corporation</h1>
              <p className="text-xs text-charcoal-600 font-medium">
                Buyer Contact: <strong className="text-charcoal-900 font-bold">David Miller</strong> (david@abccorp.com)
              </p>
            </div>
          </div>
          <p className="text-xs text-charcoal-500 mt-2 font-medium">
            Client review interface. Internal margins, vendor cost data, and warehouse logs are redacted.
          </p>
        </div>

        {role !== 'CUSTOMER' && (
          <button
            onClick={() => switchPersona('CUSTOMER')}
            className="bg-charcoal-900 hover:bg-black text-white border border-charcoal-800 text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-subtle whitespace-nowrap self-start sm:self-auto"
          >
            Switch to Buyer Role
          </button>
        )}
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2.5 shadow-subtle ${
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

      {/* Main Grid: My Quotations List + Live Deal Review & Negotiation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Quotations List */}
        <div className="bg-white border border-cream-border rounded-2xl p-5 shadow-subtle">
          <h3 className="font-bold text-sm text-charcoal-900 mb-3 pb-2 border-b border-cream-border flex items-center gap-2">
            <FileText className="w-4 h-4 text-charcoal-500" />
            <span>My Quotations</span>
          </h3>

          {quotations.length === 0 ? (
            <div className="text-center py-12 text-charcoal-500 text-xs font-medium">
              No quotations available for your account.
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
              {quotations.map((q) => {
                const isSelected = selectedQuote?._id === q._id;
                return (
                  <div
                    key={q._id}
                    onClick={() => handleSelectQuote(q._id)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer text-left ${
                      isSelected
                        ? 'bg-brand-50/60 border-brand-500 shadow-subtle'
                        : 'bg-cream-50/50 border-cream-border hover:border-cream-border/80'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono font-bold text-xs text-charcoal-900">{q.quoteNumber}</span>
                      <StatusBadge status={q.stage} size="xs" />
                    </div>

                    <h4 className="font-bold text-xs text-charcoal-800 line-clamp-1">{q.title}</h4>

                    <div className="mt-2 pt-2 border-t border-cream-border flex items-center justify-between text-[11px] font-mono">
                      <span className="text-charcoal-500 font-medium">Total:</span>
                      <span className="font-bold text-charcoal-900 tabular-nums">
                        ₹{Number(q.totalAmount || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Quotation Viewer & Interactive Negotiation */}
        <div className="lg:col-span-2">
          {selectedQuote ? (
            <div className="bg-white border border-cream-border rounded-2xl p-6 space-y-6 shadow-subtle">
              {/* Header Info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-cream-border">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-black text-charcoal-900">{selectedQuote.title}</h2>
                    <span className="text-xs bg-cream-100 text-charcoal-700 px-2.5 py-0.5 rounded-md font-mono font-bold border border-cream-border">
                      {selectedQuote.quoteNumber}
                    </span>
                  </div>
                  <p className="text-xs text-charcoal-600 mt-1 font-medium">
                    Account: <strong>{selectedQuote.customer?.companyName}</strong> | Valid Until:{' '}
                    {new Date(selectedQuote.validUntil).toLocaleDateString()}
                  </p>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-[10px] text-charcoal-500 font-bold uppercase tracking-wider block">Total Amount</span>
                  <span className="text-2xl font-black text-charcoal-900 font-mono tabular-nums">
                    ₹{Number(selectedQuote.totalAmount || 0).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Line Items Table (Redacted: No Cost or Margins) */}
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider text-charcoal-500 mb-2.5">
                  Quotation Line Items
                </h4>
                <div className="bg-white rounded-xl border border-cream-border overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="text-[11px] uppercase tracking-wider text-charcoal-500 border-b border-cream-border bg-cream-50/60">
                      <tr>
                        <th className="py-2.5 px-3 font-bold">Item Description</th>
                        <th className="py-2.5 px-3 font-bold">Billing</th>
                        <th className="py-2.5 px-3 font-bold text-center">Qty</th>
                        <th className="py-2.5 px-3 font-bold text-right">Unit Price</th>
                        <th className="py-2.5 px-3 font-bold text-right">Discount</th>
                        <th className="py-2.5 px-3 font-bold text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-cream-border/60">
                      {selectedQuote.items?.map((item: any) => (
                        <tr key={item._id} className="hover:bg-cream-50/40 transition-colors">
                          <td className="py-2.5 px-3 font-bold text-charcoal-900">{item.productName}</td>
                          <td className="py-2.5 px-3">
                            <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-cream-100 text-charcoal-700 border border-cream-border">
                              {item.billingType === 'RECURRING' ? 'Monthly' : 'One-Time'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono font-bold text-charcoal-900">
                            {item.quantity}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-charcoal-600 tabular-nums font-medium">
                            ₹{Number(item.unitPrice || 0).toLocaleString('en-IN')}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-rose-600 font-bold">
                            {item.discountPct}%
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-charcoal-900 tabular-nums">
                            ₹{Number(item.lineTotal || 0).toLocaleString('en-IN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Total Summary */}
              <div className="bg-cream-50/50 p-4 rounded-xl border border-cream-border grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-charcoal-500 block text-[11px] font-medium">Subtotal:</span>
                  <span className="font-mono text-charcoal-900 font-bold tabular-nums">₹{selectedQuote.subtotal?.toLocaleString('en-IN')}</span>
                </div>
                <div>
                  <span className="text-charcoal-500 block text-[11px] font-medium">Total Discount:</span>
                  <span className="font-mono text-rose-600 font-bold tabular-nums">-₹{selectedQuote.discountAmount?.toLocaleString('en-IN')}</span>
                </div>
                <div>
                  <span className="text-charcoal-500 block text-[11px] font-medium">Tax (GST 18%):</span>
                  <span className="font-mono text-charcoal-900 font-bold tabular-nums">+₹{selectedQuote.taxAmount?.toLocaleString('en-IN')}</span>
                </div>
                <div>
                  <span className="text-charcoal-600 font-bold block text-[11px]">Final Total:</span>
                  <span className="text-base font-black text-charcoal-900 font-mono tabular-nums">₹{selectedQuote.totalAmount?.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Negotiation Thread & Counter-Offer Form */}
              <div className="bg-cream-50/50 p-5 rounded-xl border border-cream-border space-y-3.5">
                <div className="flex items-center gap-2 text-xs font-bold text-charcoal-900 uppercase tracking-wider">
                  <MessageSquare className="w-4 h-4 text-brand-500" />
                  <span>Commercial Counter-Offer & Negotiation</span>
                </div>

                {selectedQuote.negotiation?.messages?.length > 0 && (
                  <div className="space-y-2.5 max-h-40 overflow-y-auto pr-1">
                    {selectedQuote.negotiation.messages.map((m: any, mIdx: number) => (
                      <div
                        key={mIdx}
                        className={`p-3 rounded-xl text-xs ${
                          m.senderRole === 'CUSTOMER'
                            ? 'bg-white border border-cream-border text-charcoal-800'
                            : 'bg-brand-50 border border-brand-200 text-charcoal-900'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px] font-bold mb-1 text-charcoal-500 font-mono">
                          <span>{m.senderName} ({m.senderRole})</span>
                          <span>{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="font-medium">{m.message}</p>
                        {m.proposedDiscountPct !== undefined && (
                          <span className="inline-block mt-1.5 text-[10px] font-mono font-bold bg-brand-100 px-2 py-0.5 rounded text-brand-900 border border-brand-200">
                            Requested Counter Discount: {m.proposedDiscountPct}%
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <form onSubmit={handleSubmitCounterOffer} className="space-y-3.5 text-xs pt-2">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] text-charcoal-700 mb-1 font-bold">
                        Target Counter Discount (%)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="50"
                        value={counterDiscountPct}
                        onChange={(e) => setCounterDiscountPct(parseFloat(e.target.value) || 0)}
                        className="w-full bg-white border border-cream-border text-charcoal-900 font-bold font-mono rounded-xl p-2.5 text-center focus:border-brand-500 focus:outline-none"
                        required
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] text-charcoal-700 mb-1 font-bold">
                        Justification / Purchase Conditions
                      </label>
                      <input
                        type="text"
                        value={negotiationMessage}
                        onChange={(e) => setNegotiationMessage(e.target.value)}
                        className="w-full bg-white border border-cream-border text-charcoal-900 font-medium rounded-xl p-2.5 focus:border-brand-500 focus:outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="inline-flex items-center gap-1.5 bg-white hover:bg-cream-100 text-charcoal-800 text-xs font-bold px-4 py-2.5 rounded-xl border border-cream-border transition-colors disabled:opacity-50 shadow-subtle"
                    >
                      <Send className="w-3.5 h-3.5 text-charcoal-600" />
                      <span>Submit Counter-Offer</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleConfirmQuotation}
                      disabled={submitting || selectedQuote.stage === 'PENDING_APPROVAL'}
                      className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-subtle transition-all disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Accept & Confirm Terms</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-cream-border rounded-2xl p-12 text-center text-charcoal-500 text-xs font-medium shadow-subtle">
              Select a quotation to review and negotiate.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
