import React, { useState, useEffect } from 'react';
import { api } from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/ui/StatusBadge';
import {
  Receipt,
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  Plus,
  ArrowRight,
  Clock,
  Building2,
  CreditCard,
  Layers,
  Sparkles,
  ExternalLink,
  X,
} from 'lucide-react';

export const BillingPage: React.FC<{
  onNavigate: (page: string, id?: string) => void;
}> = ({ onNavigate }) => {
  const { role, user } = useAuth();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [approvedQuotations, setApprovedQuotations] = useState<any[]>([]);
  const [selectedQuotationId, setSelectedQuotationId] = useState<string>('');
  const [searchQuoteQuery, setSearchQuoteQuery] = useState<string>('');
  const [allQuotations, setAllQuotations] = useState<any[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'BANK_TRANSFER' | 'CASH' | 'CREDIT_NOTE'>('BANK_TRANSFER');
  const [paymentRef, setPaymentRef] = useState<string>('HDFC-NEFT-998822');
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [invRes, quoteRes] = await Promise.all([
        api.getInvoices(),
        api.getQuotations(),
      ]);

      if (invRes.data.success) setInvoices(invRes.data.data);
      if (quoteRes.data.success) {
        setAllQuotations(quoteRes.data.data);
        const approved = quoteRes.data.data.filter((q: any) =>
          ['APPROVED', 'READY_FOR_FULFILLMENT', 'FULFILLED', 'BILLING_IN_PROGRESS', 'CUSTOMER_CONFIRMED', 'CLOSED'].includes(q.stage)
        );
        setApprovedQuotations(approved.length > 0 ? approved : quoteRes.data.data);
        if (approved.length > 0 && !selectedQuotationId) {
          setSelectedQuotationId(approved[0]._id);
        } else if (quoteRes.data.data.length > 0 && !selectedQuotationId) {
          setSelectedQuotationId(quoteRes.data.data[0]._id);
        }
      }
    } catch (err) {
      console.error('Error fetching billing data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleGenerateBilling = async () => {
    const targetQuote = selectedQuotationId || searchQuoteQuery.trim();
    if (!targetQuote) {
      setErrorMessage('Please enter or select a Quotation QT ID to generate invoices.');
      return;
    }
    try {
      setActionLoading(true);
      setSuccessMessage('');
      setErrorMessage('');

      const res = await api.generateBilling(targetQuote);
      if (res.data.success) {
        setSuccessMessage(res.data.message || 'Hybrid billing invoices and subscriptions generated successfully!');
        await fetchData();
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredQuotes = (allQuotations.length > 0 ? allQuotations : approvedQuotations).filter((q) => {
    if (!searchQuoteQuery) return true;
    const query = searchQuoteQuery.toLowerCase();
    return (
      (q.quoteNumber && q.quoteNumber.toLowerCase().includes(query)) ||
      (q.customerId?.companyName && q.customerId.companyName.toLowerCase().includes(query)) ||
      (q.title && q.title.toLowerCase().includes(query))
    );
  });

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    if (paymentAmount <= 0 || paymentAmount > selectedInvoice.dueBalance) {
      setErrorMessage('Enter a payment amount greater than 0 and no more than the remaining balance.');
      return;
    }
    try {
      setActionLoading(true);
      setSuccessMessage('');
      setErrorMessage('');

      const res = await api.recordPayment(selectedInvoice._id, {
        amount: paymentAmount,
        paymentMethod,
        referenceNumber: paymentRef,
      });

      if (res.data.success) {
        setSuccessMessage(`Payment of ₹${paymentAmount.toLocaleString('en-IN')} recorded successfully!`);
        setSelectedInvoice(null);
        await fetchData();
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || err.message);
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-cream-border">
        <div>
          <div className="text-[10px] font-mono tracking-widest text-charcoal-400 uppercase font-bold mb-1">
            FINANCE / INVOICES & COLLECTIONS
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-charcoal-900 flex items-center gap-2.5">
            <Receipt className="w-6 h-6 text-brand-500" />
            <span>Invoices & Revenue Collections</span>
          </h1>
          <p className="text-xs sm:text-sm text-charcoal-600 mt-1">
            Automated split of deals into One-Time Invoices and Recurring Contracts with real-time balance tracking.
          </p>
        </div>

        <button
          onClick={() => onNavigate('subscriptions')}
          className="inline-flex items-center gap-2 bg-white hover:bg-cream-50 text-charcoal-800 text-xs font-bold px-4 py-2.5 rounded-2xl border border-cream-border shadow-subtle transition-all active:scale-[0.98]"
        >
          <Sparkles className="w-4 h-4 text-brand-600" />
          <span>Subscriptions Manager</span>
        </button>
      </div>

      {successMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-center gap-2.5 font-bold shadow-subtle">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}
      {errorMessage && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs flex items-center gap-2.5 font-bold shadow-subtle">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Generator Control Bar */}
      <div className="bg-white border border-cream-border p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-subtle">
        <div>
          <h4 className="font-bold text-xs uppercase tracking-wider text-charcoal-900">
            Generate Hybrid Billing Schedule
          </h4>
          <p className="text-xs text-charcoal-600 mt-0.5 font-medium">
            Automatically isolates one-time goods from recurring subscription line items.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
          <input
            type="text"
            value={searchQuoteQuery}
            onChange={(e) => {
              setSearchQuoteQuery(e.target.value);
              const matched = allQuotations.find(q => q.quoteNumber?.toLowerCase() === e.target.value.trim().toLowerCase());
              if (matched) setSelectedQuotationId(matched._id);
            }}
            placeholder="Search / Enter QT ID (e.g. QT-20153)..."
            className="bg-cream-50 border border-cream-border text-xs text-charcoal-900 font-mono font-medium rounded-xl px-3.5 py-2 focus:border-brand-500 focus:outline-none w-full sm:w-64 placeholder:text-charcoal-400 placeholder:font-sans"
          />

          <select
            value={selectedQuotationId}
            onChange={(e) => {
              setSelectedQuotationId(e.target.value);
              const found = allQuotations.find(q => q._id === e.target.value);
              if (found) setSearchQuoteQuery(found.quoteNumber);
            }}
            className="bg-cream-50 border border-cream-border text-xs text-charcoal-900 font-medium rounded-xl px-3.5 py-2 focus:border-brand-500 focus:outline-none w-full sm:w-72 font-mono"
          >
            <option value="">-- Or Select Quotation --</option>
            {filteredQuotes.map((q) => (
              <option key={q._id} value={q._id}>
                {q.quoteNumber} — {q.customerId?.companyName} (₹{q.totalAmount?.toLocaleString('en-IN')})
              </option>
            ))}
          </select>

          <button
            onClick={handleGenerateBilling}
            disabled={actionLoading || (!selectedQuotationId && !searchQuoteQuery.trim())}
            className="inline-flex items-center justify-center gap-1.5 bg-charcoal-900 hover:bg-black text-white text-xs font-bold px-4 py-2 rounded-xl shadow-subtle transition-all active:scale-[0.98] disabled:opacity-50 whitespace-nowrap"
          >
            <span>{actionLoading ? 'Generating...' : 'Generate Invoices'}</span>
          </button>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white border border-cream-border rounded-2xl overflow-hidden shadow-subtle">
        <div className="p-4 border-b border-cream-border flex items-center justify-between">
          <h3 className="font-bold text-sm text-charcoal-900">Invoices & Collections</h3>
          <span className="text-xs font-mono font-bold text-charcoal-500">{invoices.length} invoice(s)</span>
        </div>

        {invoices.length === 0 ? (
          <div className="text-center py-16 text-charcoal-500 text-xs font-medium">
            <Receipt className="w-8 h-8 mx-auto mb-2 text-charcoal-300" />
            No invoices generated yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] uppercase tracking-wider text-charcoal-500 bg-cream-50/60 border-b border-cream-border">
                <tr>
                  <th className="py-3 px-4 font-bold">Invoice #</th>
                  <th className="py-3 px-4 font-bold">Customer</th>
                  <th className="py-3 px-4 font-bold">Type</th>
                  <th className="py-3 px-4 font-bold text-right">Total Amount</th>
                  <th className="py-3 px-4 font-bold text-right">Paid Amount</th>
                  <th className="py-3 px-4 font-bold text-right">Due Balance</th>
                  <th className="py-3 px-4 font-bold">Status</th>
                  <th className="py-3 px-4 font-bold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-border/60">
                {invoices.map((inv) => (
                  <tr key={inv._id} className="hover:bg-cream-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-charcoal-900">{inv.invoiceNumber}</td>
                    <td className="py-3.5 px-4 font-bold text-charcoal-900">
                      {inv.customerId?.companyName || 'ABC Corporation'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-[10px] bg-cream-100 text-charcoal-800 px-2 py-0.5 rounded font-mono font-bold border border-cream-border">
                        {inv.type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-charcoal-900 tabular-nums">
                      ₹{Number(inv.totalAmount || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-600 tabular-nums">
                      ₹{Number(inv.paidAmount || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-rose-600 tabular-nums">
                      ₹{Number(inv.dueBalance || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={inv.status} size="xs" />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {inv.dueBalance > 0 && (
                        <button
                          onClick={() => {
                            setSelectedInvoice(inv);
                            setPaymentAmount(inv.dueBalance);
                          }}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3 py-1.5 rounded-xl shadow-subtle transition-all"
                        >
                          Record Payment
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

      {/* Record Payment Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-charcoal-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-cream-border rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-cream-border">
              <div>
                <h3 className="font-bold text-sm text-charcoal-900">Record Invoice Payment</h3>
                <p className="text-xs text-charcoal-500 font-mono mt-0.5">{selectedInvoice.invoiceNumber}</p>
              </div>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="text-charcoal-400 hover:text-charcoal-800 p-1.5 rounded-lg hover:bg-cream-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] text-charcoal-700 mb-1 font-bold">Payment Amount (₹)</label>
                <input
                  type="number"
                  max={selectedInvoice.dueBalance}
                  min={0.01}
                  step="0.01"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                  className="w-full bg-cream-50 border border-cream-border text-charcoal-900 rounded-xl p-2.5 font-mono font-bold text-sm focus:border-brand-500 focus:outline-none"
                  required
                />
                <span className="text-[10px] text-charcoal-500 mt-1 block font-mono font-semibold">
                  Remaining Balance: ₹{selectedInvoice.dueBalance.toLocaleString('en-IN')}
                </span>
              </div>

              <div>
                <label className="block text-[11px] text-charcoal-700 mb-1 font-bold">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e: any) => setPaymentMethod(e.target.value)}
                  className="w-full bg-cream-50 border border-cream-border text-charcoal-900 font-medium rounded-xl p-2.5 focus:border-brand-500 focus:outline-none"
                >
                  <option value="BANK_TRANSFER">Bank Wire / NEFT</option>
                  <option value="CASH">Cash Deposit</option>
                  <option value="CREDIT_NOTE">Credit Note Adjustment</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-charcoal-700 mb-1 font-bold">Transaction / Reference #</label>
                <input
                  type="text"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  className="w-full bg-cream-50 border border-cream-border text-charcoal-900 font-medium rounded-xl p-2.5 font-mono focus:border-brand-500 focus:outline-none"
                  placeholder="e.g. HDFC-NEFT-998822"
                  required
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-cream-border">
                <button
                  type="button"
                  onClick={() => setSelectedInvoice(null)}
                  className="bg-cream-100 hover:bg-cream-200 text-charcoal-800 font-bold px-4 py-2 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl shadow-subtle disabled:opacity-50"
                >
                  Confirm Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
