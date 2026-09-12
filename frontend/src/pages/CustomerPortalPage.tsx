import React, { useState, useEffect } from 'react';
import { api } from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/ui/StatusBadge';
import {
  FileText,
  Building2,
  CheckCircle2,
  Send,
  MessageSquare,
  AlertTriangle,
  ArrowLeft,
  Receipt,
  Package,
  ShieldCheck,
  LogOut,
  Plus,
  Trash2,
  X,
} from 'lucide-react';

interface CustomerPortalPageProps {
  onNavigate: (page: string, id?: string) => void;
  onBack?: () => void;
}

export const CustomerPortalPage: React.FC<
  CustomerPortalPageProps
> = ({ onNavigate, onBack }) => {
  const { user, role, switchPersona, logout } = useAuth();

  const [quotations, setQuotations] = useState<any[]>([]);
  const [selectedQuote, setSelectedQuote] =
    useState<any>(null);
  const [catalogProducts, setCatalogProducts] = useState<any[]>([]);
  const [requestItems, setRequestItems] = useState<Array<{ productId: string; quantity: number }>>([]);
  const [showQuotationForm, setShowQuotationForm] = useState(false);
  const [requestTitle, setRequestTitle] = useState('');
  const [requestNotes, setRequestNotes] = useState('');
  const [billReadyForQuote, setBillReadyForQuote] = useState<string | null>(null);
  const [billGenerating, setBillGenerating] = useState(false);

  const [counterDiscountPct, setCounterDiscountPct] =
    useState<number>(20);

  const [negotiationMessage, setNegotiationMessage] =
    useState<string>(
      'We are ready to move forward immediately if you can support a 20% discount on this initial deployment.'
    );

  const [loading, setLoading] =
    useState<boolean>(true);

  const [submitting, setSubmitting] =
    useState<boolean>(false);

  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  /*
   * ============================================================
   * CUSTOMER DATA
   * ============================================================
   */
  const fetchCustomerData = async () => {
    try {
      setLoading(true);

      const res = await api.getQuotations();

      if (res.data.success) {
        const data = res.data.data || [];

        setQuotations(data);

        /*
         * Automatically open the first quotation.
         */
        if (data.length > 0) {
          const detailRes =
            await api.getPortalQuotation(
              data[0]._id
            );

          if (detailRes.data.success) {
            setSelectedQuote(
              detailRes.data.data
            );
          }
        } else {
          setSelectedQuote(null);
        }
      }
    } catch (err) {
      console.error(
        'Error fetching portal data:',
        err
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchCatalog = async () => {
    try {
      const res = await api.getProducts();
      if (res.data.success) {
        setCatalogProducts(res.data.data || []);
      }
    } catch (err) {
      console.error('Error loading product catalog:', err);
    }
  };

  useEffect(() => {
    fetchCustomerData();
    fetchCatalog();
  }, [role]);

  const addRequestItem = (productId: string) => {
    setRequestItems((current) => {
      const existing = current.find((item) => item.productId === productId);
      if (existing) {
        return current.map((item) => item.productId === productId
          ? { ...item, quantity: item.quantity + 1 }
          : item);
      }
      return [...current, { productId, quantity: 1 }];
    });
  };

  const handleGenerateQuotation = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user?.customerId || requestItems.length === 0) {
      setFeedback({ type: 'error', message: 'Select at least one product for your quotation request.' });
      return;
    }

    try {
      setSubmitting(true);
      setFeedback(null);
      const res = await api.createQuotation({
        customerId: user.customerId,
        title: requestTitle.trim() || 'Customer quotation request',
        customerNotes: requestNotes.trim(),
        submitForApproval: true,
        items: requestItems.map((item) => {
          const product = catalogProducts.find((candidate) => candidate._id === item.productId);
          return {
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: product?.unitPrice || 0,
            discountPct: 0,
          };
        }),
      });

      if (res.data.success) {
        setFeedback({ type: 'success', message: `Quotation request ${res.data.data.quoteNumber} sent for review.` });
        setRequestItems([]);
        setRequestTitle('');
        setRequestNotes('');
        setShowQuotationForm(false);
        await fetchCustomerData();
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || err.message || 'Unable to generate quotation request.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  /*
   * ============================================================
   * SELECT QUOTATION
   * ============================================================
   */
  const handleSelectQuote = async (
    id: string
  ) => {
    try {
      setLoading(true);

      const res =
        await api.getPortalQuotation(id);

      if (res.data.success) {
        setSelectedQuote(
          res.data.data
        );
      }
    } catch (err) {
      console.error(
        'Error loading quotation detail:',
        err
      );
    } finally {
      setLoading(false);
    }
  };

  /*
   * ============================================================
   * COUNTER OFFER
   * ============================================================
   */
  const handleSubmitCounterOffer = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (!selectedQuote) return;

    try {
      setSubmitting(true);
      setFeedback(null);

      const res =
        await api.submitCounterDiscount(
          selectedQuote._id,
          {
            proposedDiscountPct:
              counterDiscountPct,
            message:
              negotiationMessage,
          }
        );

      if (res.data.success) {
        setFeedback({
          type: 'success',
          message: res.data.message,
        });

        await handleSelectQuote(
          selectedQuote._id
        );
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message:
          err.response?.data?.message ||
          err.message ||
          'Unable to submit counter-offer.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  /*
   * ============================================================
   * CONFIRM QUOTATION
   * ============================================================
   */
  const handleConfirmQuotation = async () => {
    if (!selectedQuote) return;

    try {
      setSubmitting(true);
      setFeedback(null);

      const res =
        await api.confirmByCustomer(
          selectedQuote._id
        );

      if (res.data.success) {
        setFeedback({
          type: 'success',
          message: res.data.message,
        });

        setBillReadyForQuote(selectedQuote._id);

        await handleSelectQuote(
          selectedQuote._id
        );
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message:
          err.response?.data?.message ||
          err.message ||
          'Unable to confirm quotation.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleGenerateBill = async () => {
    if (!billReadyForQuote) return;

    try {
      setBillGenerating(true);
      const res = await api.generateBilling(billReadyForQuote);
      const invoices = res.data.data?.invoices || [];
      const subscriptions = res.data.data?.subscriptions || [];
      const quote = selectedQuote;
      const invoiceRows = invoices.flatMap((invoice: any) => invoice.items || []).map((item: any) => `
        <tr><td>${item.productName}</td><td>${item.quantity}</td><td>INR ${Number(item.lineTotal || 0).toLocaleString('en-IN')}</td></tr>`).join('');
      const subscriptionRows = subscriptions.map((subscription: any) => `
        <tr><td>${subscription.productName}</td><td>${subscription.quantity}</td><td>INR ${Number(subscription.totalRecurringAmount || 0).toLocaleString('en-IN')} / month</td></tr>`).join('');
      const invoiceNumber = invoices[0]?.invoiceNumber || `STATEMENT-${quote.quoteNumber}`;
      const billHtml = `<!doctype html><html><head><meta charset="utf-8"><title>${invoiceNumber}</title><style>body{font-family:Arial,sans-serif;color:#14202b;max-width:850px;margin:40px auto;padding:0 24px}header{display:flex;justify-content:space-between;border-bottom:3px solid #f59e0b;padding-bottom:20px}h1{margin:0}table{width:100%;border-collapse:collapse;margin-top:24px}th,td{text-align:left;padding:12px;border-bottom:1px solid #ddd}th{background:#fff7e6}.total{margin-top:28px;text-align:right;font-size:20px;font-weight:700}</style></head><body><header><div><h1>DealFlow360</h1><p>Customer Bill</p></div><div><strong>${invoiceNumber}</strong><p>${new Date().toLocaleDateString('en-IN')}</p></div></header><h2>${quote.title}</h2><p>Customer: ${quote.customer?.companyName || 'Customer account'}</p><table><thead><tr><th>Item</th><th>Qty</th><th>Amount</th></tr></thead><tbody>${invoiceRows}${subscriptionRows}</tbody></table><p class="total">Total: INR ${Number(quote.totalAmount || 0).toLocaleString('en-IN')}</p><p>Thank you for choosing DealFlow360.</p></body></html>`;
      const downloadUrl = URL.createObjectURL(new Blob([billHtml], { type: 'text/html' }));
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${invoiceNumber}.html`;
      link.click();
      URL.revokeObjectURL(downloadUrl);
      setFeedback({ type: 'success', message: 'Your bill has been generated and downloaded.' });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.response?.data?.message || err.message || 'Unable to generate the bill.' });
    } finally {
      setBillGenerating(false);
    }
  };

  /*
   * ============================================================
   * LOADING
   * ============================================================
   */
  if (loading && quotations.length === 0) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 mx-auto mb-4 rounded-full border-2 border-cream-300 border-t-brand-500 animate-spin" />

          <p className="text-sm font-bold text-charcoal-800">
            Loading your workspace...
          </p>

          <p className="text-xs text-charcoal-500 mt-1">
            Securely loading your quotations.
          </p>
        </div>
      </div>
    );
  }

  /*
   * ============================================================
   * CUSTOMER DASHBOARD
   * ============================================================
   */
  return (
    <div className="max-w-7xl mx-auto space-y-6">

      {/* ========================================================
          TOP BAR
      ========================================================= */}
      <div className="flex items-center justify-between gap-3">

        <button
          type="button"
          onClick={() => {
            if (onBack) {
              onBack();
            } else {
              logout();
              onNavigate('login');
            }
          }}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-cream-border rounded-xl text-xs font-bold text-charcoal-700 hover:text-charcoal-950 hover:bg-cream-50 shadow-subtle transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back
        </button>

        <button
          type="button"
          onClick={() => {
            logout();
            onNavigate('landing');
          }}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-cream-border rounded-xl text-xs font-bold text-charcoal-600 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition-all"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign Out
        </button>
      </div>

      {/* ========================================================
          WELCOME HERO
      ========================================================= */}
      <section className="bg-white border border-cream-border rounded-3xl p-6 sm:p-8 shadow-subtle">

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">

          <div className="flex items-start gap-4">

            <div className="w-12 h-12 rounded-2xl bg-brand-100 border border-brand-200 flex items-center justify-center shrink-0">
              <Building2 className="w-6 h-6 text-brand-700" />
            </div>

            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] font-black text-brand-600">
                Customer Portal
              </p>

              <h1 className="text-2xl sm:text-3xl font-black text-charcoal-950 mt-1">
                Welcome back
                {user?.name
                  ? `, ${user.name.split(' ')[0]}`
                  : ''}
                ! 👋
              </h1>

              <p className="text-sm text-charcoal-600 mt-2">
                Manage your quotations, review pricing,
                and track your commercial requests.
              </p>

              <div className="flex flex-wrap items-center gap-2 mt-4">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold">
                  <ShieldCheck className="w-3 h-3" />
                  Secure Customer Access
                </span>

                <span className="text-[10px] text-charcoal-400">
                  {user?.email}
                </span>
              </div>
            </div>

          </div>

          <div className="lg:text-right">
            <p className="text-[10px] uppercase tracking-wider text-charcoal-400 font-bold">
              Company
            </p>

            <p className="text-lg font-black text-charcoal-900">
              {user?.department ||
                'ABC Corporation'}
            </p>

            <p className="text-xs text-charcoal-500 mt-1">
              Customer workspace
            </p>
          </div>

        </div>
      </section>

      {/* ========================================================
          QUICK STATS
      ========================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

        <div className="bg-white border border-cream-border rounded-2xl p-5 shadow-subtle">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-charcoal-500">
                My Quotations
              </p>

              <p className="text-3xl font-black text-charcoal-950 mt-2">
                {quotations.length}
              </p>

              <p className="text-[11px] text-charcoal-400 mt-1">
                Available for review
              </p>
            </div>

            <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center">
              <FileText className="w-5 h-5 text-brand-700" />
            </div>
          </div>
        </div>

        <div className="bg-white border border-cream-border rounded-2xl p-5 shadow-subtle">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-charcoal-500">
                Pending Review
              </p>

              <p className="text-3xl font-black text-charcoal-950 mt-2">
                {
                  quotations.filter(
                    (q) =>
                      q.stage ===
                        'PENDING_APPROVAL' ||
                      q.stage === 'DRAFT'
                  ).length
                }
              </p>

              <p className="text-[11px] text-charcoal-400 mt-1">
                Need your attention
              </p>
            </div>

            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
          </div>
        </div>

        <div className="bg-white border border-cream-border rounded-2xl p-5 shadow-subtle">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-charcoal-500">
                Confirmed
              </p>

              <p className="text-3xl font-black text-charcoal-950 mt-2">
                {
                  quotations.filter(
                    (q) =>
                      q.stage ===
                      'READY_FOR_FULFILLMENT'
                  ).length
                }
              </p>

              <p className="text-[11px] text-charcoal-400 mt-1">
                Ready for fulfillment
              </p>
            </div>

            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
        </div>

      </div>

      {/* ========================================================
          QUICK ACTIONS
      ========================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

        <button
          type="button"
          onClick={() => setShowQuotationForm(true)}
          className="bg-brand-500 border border-brand-500 rounded-2xl p-5 text-left hover:bg-brand-600 shadow-subtle transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/80 flex items-center justify-center">
              <Plus className="w-5 h-5 text-brand-700" />
            </div>
            <div>
              <p className="font-black text-sm text-charcoal-950">Generate Quotation</p>
              <p className="text-xs text-charcoal-700 mt-1">Request pricing for new products</p>
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() =>
            document
              .getElementById(
                'customer-quotations'
              )
              ?.scrollIntoView({
                behavior: 'smooth',
              })
          }
          className="bg-white border border-cream-border rounded-2xl p-5 text-left hover:border-brand-300 hover:shadow-md transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center">
              <FileText className="w-5 h-5 text-brand-700" />
            </div>

            <div>
              <p className="font-black text-sm text-charcoal-900">
                Review Quotations
              </p>

              <p className="text-xs text-charcoal-500 mt-1">
                View pricing and commercial terms
              </p>
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() =>
            onNavigate('invoices')
          }
          className="bg-white border border-cream-border rounded-2xl p-5 text-left hover:border-brand-300 hover:shadow-md transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
              <Receipt className="w-5 h-5 text-purple-600" />
            </div>

            <div>
              <p className="font-black text-sm text-charcoal-900">
                My Invoices
              </p>

              <p className="text-xs text-charcoal-500 mt-1">
                View customer billing information
              </p>
            </div>
          </div>
        </button>

      </div>

      {showQuotationForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal-950/40 p-4 backdrop-blur-sm">
          <form onSubmit={handleGenerateQuotation} className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white border border-cream-border rounded-2xl p-6 shadow-2xl space-y-5">
            <div className="flex items-start justify-between gap-4 border-b border-cream-border pb-4">
              <div>
                <p className="text-[10px] uppercase tracking-wider font-black text-brand-600">New request</p>
                <h2 className="text-xl font-black text-charcoal-950 mt-1">Generate a quotation</h2>
                <p className="text-xs text-charcoal-500 mt-1">Choose products and quantities. Our team will review the request and send pricing.</p>
              </div>
              <button type="button" onClick={() => setShowQuotationForm(false)} className="p-2 rounded-lg text-charcoal-400 hover:bg-cream-100" aria-label="Close quotation form">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-wider text-charcoal-500 font-bold mb-1.5">Request title</label>
              <input value={requestTitle} onChange={(event) => setRequestTitle(event.target.value)} placeholder="e.g. Q4 laptop deployment" className="w-full bg-cream-50 border border-cream-border rounded-xl px-3 py-2.5 text-sm placeholder:text-charcoal-400 focus:border-brand-500 focus:outline-none" />
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-wider text-charcoal-500 font-bold mb-1.5">Add products</label>
              <select defaultValue="" onChange={(event) => { if (event.target.value) addRequestItem(event.target.value); event.target.value = ''; }} className="w-full bg-cream-50 border border-cream-border rounded-xl px-3 py-2.5 text-sm text-charcoal-700 focus:border-brand-500 focus:outline-none">
                <option value="">Select a product...</option>
                {catalogProducts.map((product) => <option key={product._id} value={product._id}>{product.name} ({product.sku})</option>)}
              </select>
            </div>

            <div className="space-y-2">
              {requestItems.length === 0 ? (
                <p className="rounded-xl border border-dashed border-cream-border p-4 text-center text-xs text-charcoal-400">No products selected yet.</p>
              ) : requestItems.map((item) => {
                const product = catalogProducts.find((candidate) => candidate._id === item.productId);
                return (
                  <div key={item.productId} className="flex items-center gap-3 rounded-xl border border-cream-border bg-cream-50/60 p-3">
                    <Package className="w-4 h-4 text-brand-600 shrink-0" />
                    <span className="flex-1 text-xs font-bold text-charcoal-800">{product?.name || 'Product'}</span>
                    <input type="number" min="1" value={item.quantity} onChange={(event) => setRequestItems((current) => current.map((entry) => entry.productId === item.productId ? { ...entry, quantity: Math.max(1, Number(event.target.value)) } : entry))} className="w-20 rounded-lg border border-cream-border bg-white px-2 py-1.5 text-xs text-center focus:border-brand-500 focus:outline-none" aria-label={`Quantity for ${product?.name || 'product'}`} />
                    <button type="button" onClick={() => setRequestItems((current) => current.filter((entry) => entry.productId !== item.productId))} className="p-1.5 text-charcoal-400 hover:text-rose-600" aria-label={`Remove ${product?.name || 'product'}`}><Trash2 className="w-4 h-4" /></button>
                  </div>
                );
              })}
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-wider text-charcoal-500 font-bold mb-1.5">Notes for the sales team</label>
              <textarea value={requestNotes} onChange={(event) => setRequestNotes(event.target.value)} rows={3} placeholder="Add delivery timing, configuration, or other requirements" className="w-full resize-none bg-cream-50 border border-cream-border rounded-xl px-3 py-2.5 text-sm placeholder:text-charcoal-400 focus:border-brand-500 focus:outline-none" />
            </div>

            <div className="flex justify-end gap-2 border-t border-cream-border pt-4">
              <button type="button" onClick={() => setShowQuotationForm(false)} className="px-4 py-2.5 rounded-xl border border-cream-border bg-cream-50 text-xs font-bold text-charcoal-700">Cancel</button>
              <button type="submit" disabled={submitting || requestItems.length === 0} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-500 text-xs font-black text-charcoal-950 disabled:opacity-50"><Send className="w-3.5 h-3.5" />{submitting ? 'Sending...' : 'Send quotation request'}</button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================
          FEEDBACK
      ========================================================= */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2.5 shadow-subtle ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border border-rose-200 text-rose-800'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          )}

          {feedback.message}
        </div>
      )}

      {/* ========================================================
          QUOTATIONS
      ========================================================= */}
      <section
        id="customer-quotations"
        className="space-y-4"
      >

        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] font-black text-brand-600">
            Commercial Documents
          </p>

          <h2 className="text-xl font-black text-charcoal-950 mt-1">
            My Quotations
          </h2>

          <p className="text-xs text-charcoal-500 mt-1">
            Select a quotation to review its details and
            respond to the commercial terms.
          </p>
        </div>

        {quotations.length === 0 ? (
          <div className="bg-white border border-cream-border rounded-2xl p-10 shadow-subtle">

            <div className="max-w-md mx-auto text-center">

              <div className="w-14 h-14 mx-auto rounded-2xl bg-cream-100 border border-cream-border flex items-center justify-center">
                <FileText className="w-7 h-7 text-charcoal-400" />
              </div>

              <h3 className="font-black text-lg text-charcoal-900 mt-4">
                No quotations yet
              </h3>

              <p className="text-xs text-charcoal-500 mt-2 leading-relaxed">
                There are currently no quotations available
                for this customer account. Once your sales
                representative creates one, it will appear here.
              </p>

              <div className="mt-5 inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-brand-50 border border-brand-200 text-brand-800 text-[11px] font-bold">
                <ShieldCheck className="w-3.5 h-3.5" />
                Your account is securely isolated
              </div>

            </div>
          </div>
        ) : (

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

            {/* ==================================================
                QUOTATION LIST
            =================================================== */}
            <div className="bg-white border border-cream-border rounded-2xl p-5 shadow-subtle">

              <div className="flex items-center justify-between pb-3 border-b border-cream-border">

                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-brand-600" />

                  <h3 className="font-black text-sm text-charcoal-900">
                    Quotations
                  </h3>
                </div>

                <span className="text-[10px] font-mono font-bold bg-brand-100 text-brand-800 px-2 py-1 rounded-full">
                  {quotations.length}
                </span>

              </div>

              <div className="space-y-2.5 mt-4 max-h-[560px] overflow-y-auto pr-1">

                {quotations.map((q) => {

                  const isSelected =
                    selectedQuote?._id ===
                    q._id;

                  return (
                    <button
                      type="button"
                      key={q._id}
                      onClick={() =>
                        handleSelectQuote(
                          q._id
                        )
                      }
                      className={`w-full p-4 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'bg-brand-50 border-brand-500 shadow-subtle'
                          : 'bg-cream-50/50 border-cream-border hover:border-brand-300 hover:bg-brand-50/30'
                      }`}
                    >

                      <div className="flex items-center justify-between gap-2">

                        <span className="font-mono font-black text-xs text-charcoal-900">
                          {q.quoteNumber}
                        </span>

                        <StatusBadge
                          status={q.stage}
                          size="xs"
                        />

                      </div>

                      <p className="font-bold text-xs text-charcoal-800 mt-2 line-clamp-2">
                        {q.title}
                      </p>

                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-cream-border">

                        <span className="text-[10px] text-charcoal-500">
                          Total
                        </span>

                        <span className="font-mono font-black text-xs text-charcoal-950">
                          ₹
                          {Number(
                            q.totalAmount || 0
                          ).toLocaleString(
                            'en-IN'
                          )}
                        </span>

                      </div>

                    </button>
                  );
                })}

              </div>
            </div>

            {/* ==================================================
                QUOTATION DETAILS
            =================================================== */}
            <div className="lg:col-span-2">

              {selectedQuote ? (
                <div className="bg-white border border-cream-border rounded-2xl p-5 sm:p-6 shadow-subtle space-y-6">

                  {/* Header */}
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-5 border-b border-cream-border">

                    <div>
                      <div className="flex flex-wrap items-center gap-2">

                        <h2 className="text-lg font-black text-charcoal-950">
                          {selectedQuote.title}
                        </h2>

                        <span className="text-[10px] bg-cream-100 text-charcoal-700 px-2 py-1 rounded-md font-mono font-bold border border-cream-border">
                          {selectedQuote.quoteNumber}
                        </span>

                      </div>

                      <p className="text-xs text-charcoal-500 mt-2">
                        Account:{' '}
                        <strong className="text-charcoal-800">
                          {selectedQuote.customer?.companyName ||
                            'Your Company'}
                        </strong>
                      </p>

                    </div>

                    <div className="sm:text-right">

                      <span className="text-[10px] uppercase tracking-wider text-charcoal-400 font-bold block">
                        Final Total
                      </span>

                      <span className="text-2xl font-black text-charcoal-950 font-mono">
                        ₹
                        {Number(
                          selectedQuote.totalAmount ||
                            0
                        ).toLocaleString(
                          'en-IN'
                        )}
                      </span>

                    </div>

                  </div>

                  {/* Line Items */}
                  <div>

                    <h4 className="font-black text-xs uppercase tracking-wider text-charcoal-500 mb-3">
                      Quotation Items
                    </h4>

                    <div className="border border-cream-border rounded-xl overflow-hidden">

                      <div className="overflow-x-auto">

                        <table className="w-full text-xs">

                          <thead className="bg-cream-50 border-b border-cream-border">

                            <tr>
                              <th className="py-3 px-3 text-left font-bold text-charcoal-500">
                                Item
                              </th>

                              <th className="py-3 px-3 text-center font-bold text-charcoal-500">
                                Qty
                              </th>

                              <th className="py-3 px-3 text-right font-bold text-charcoal-500">
                                Unit Price
                              </th>

                              <th className="py-3 px-3 text-right font-bold text-charcoal-500">
                                Discount
                              </th>

                              <th className="py-3 px-3 text-right font-bold text-charcoal-500">
                                Total
                              </th>
                            </tr>

                          </thead>

                          <tbody className="divide-y divide-cream-border">

                            {selectedQuote.items?.map(
                              (item: any) => (
                                <tr
                                  key={item._id}
                                  className="hover:bg-cream-50/40"
                                >
                                  <td className="py-3 px-3 font-bold text-charcoal-900">
                                    {item.productName}
                                  </td>

                                  <td className="py-3 px-3 text-center font-mono">
                                    {item.quantity}
                                  </td>

                                  <td className="py-3 px-3 text-right font-mono">
                                    ₹
                                    {Number(
                                      item.unitPrice ||
                                        0
                                    ).toLocaleString(
                                      'en-IN'
                                    )}
                                  </td>

                                  <td className="py-3 px-3 text-right font-mono text-rose-600 font-bold">
                                    {item.discountPct}%
                                  </td>

                                  <td className="py-3 px-3 text-right font-mono font-black">
                                    ₹
                                    {Number(
                                      item.lineTotal ||
                                        0
                                    ).toLocaleString(
                                      'en-IN'
                                    )}
                                  </td>
                                </tr>
                              )
                            )}

                          </tbody>
                        </table>

                      </div>
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">

                    <div className="bg-cream-50 rounded-xl border border-cream-border p-3">
                      <p className="text-[10px] text-charcoal-500">
                        Subtotal
                      </p>

                      <p className="font-mono font-bold text-xs mt-1">
                        ₹
                        {Number(
                          selectedQuote.subtotal ||
                            0
                        ).toLocaleString(
                          'en-IN'
                        )}
                      </p>
                    </div>

                    <div className="bg-cream-50 rounded-xl border border-cream-border p-3">
                      <p className="text-[10px] text-charcoal-500">
                        Discount
                      </p>

                      <p className="font-mono font-bold text-xs mt-1 text-rose-600">
                        -₹
                        {Number(
                          selectedQuote.discountAmount ||
                            0
                        ).toLocaleString(
                          'en-IN'
                        )}
                      </p>
                    </div>

                    <div className="bg-cream-50 rounded-xl border border-cream-border p-3">
                      <p className="text-[10px] text-charcoal-500">
                        GST
                      </p>

                      <p className="font-mono font-bold text-xs mt-1">
                        ₹
                        {Number(
                          selectedQuote.taxAmount ||
                            0
                        ).toLocaleString(
                          'en-IN'
                        )}
                      </p>
                    </div>

                    <div className="bg-brand-50 rounded-xl border border-brand-200 p-3">
                      <p className="text-[10px] text-brand-700 font-bold">
                        Final Total
                      </p>

                      <p className="font-mono font-black text-sm mt-1 text-charcoal-950">
                        ₹
                        {Number(
                          selectedQuote.totalAmount ||
                            0
                        ).toLocaleString(
                          'en-IN'
                        )}
                      </p>
                    </div>

                  </div>

                  {/* =================================================
                      NEGOTIATION
                  ================================================== */}
                  <div className="bg-cream-50/70 rounded-2xl border border-cream-border p-5">

                    <div className="flex items-center gap-2 mb-4">

                      <MessageSquare className="w-4 h-4 text-brand-600" />

                      <h3 className="text-xs font-black uppercase tracking-wider text-charcoal-900">
                        Commercial Discussion
                      </h3>

                    </div>

                    {selectedQuote.negotiation?.messages?.length > 0 && (
                      <div className="space-y-2.5 max-h-48 overflow-y-auto mb-4">

                        {selectedQuote.negotiation.messages.map(
                          (
                            m: any,
                            index: number
                          ) => (

                            <div
                              key={index}
                              className={`p-3 rounded-xl text-xs ${
                                m.senderRole ===
                                'CUSTOMER'
                                  ? 'bg-white border border-cream-border'
                                  : 'bg-brand-50 border border-brand-200'
                              }`}
                            >

                              <div className="flex justify-between gap-3 text-[10px] font-mono text-charcoal-400 mb-1">

                                <span className="font-bold">
                                  {m.senderName}
                                </span>

                                <span>
                                  {new Date(
                                    m.timestamp
                                  ).toLocaleTimeString(
                                    [],
                                    {
                                      hour: '2-digit',
                                      minute:
                                        '2-digit',
                                    }
                                  )}
                                </span>

                              </div>

                              <p className="font-medium text-charcoal-800">
                                {m.message}
                              </p>

                              {m.proposedDiscountPct !==
                                undefined && (
                                <span className="inline-block mt-2 px-2 py-1 bg-brand-100 border border-brand-200 rounded-md text-[10px] font-bold text-brand-900">
                                  Requested Discount:{' '}
                                  {
                                    m.proposedDiscountPct
                                  }
                                  %
                                </span>
                              )}

                            </div>
                          )
                        )}

                      </div>
                    )}

                    {/* Counter offer form */}
                    <form
                      onSubmit={
                        handleSubmitCounterOffer
                      }
                      className="space-y-3"
                    >

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

                        <div>
                          <label className="block text-[10px] uppercase tracking-wider font-bold text-charcoal-500 mb-1.5">
                            Counter Discount
                          </label>

                          <input
                            type="number"
                            min="1"
                            max="50"
                            value={
                              counterDiscountPct
                            }
                            onChange={(e) =>
                              setCounterDiscountPct(
                                parseFloat(
                                  e.target.value
                                ) || 0
                              )
                            }
                            className="w-full bg-white border border-cream-border rounded-xl p-2.5 text-center font-mono font-bold text-xs focus:outline-none focus:border-brand-500"
                            required
                          />
                        </div>

                        <div className="sm:col-span-2">

                          <label className="block text-[10px] uppercase tracking-wider font-bold text-charcoal-500 mb-1.5">
                            Message
                          </label>

                          <input
                            type="text"
                            value={
                              negotiationMessage
                            }
                            onChange={(e) =>
                              setNegotiationMessage(
                                e.target.value
                              )
                            }
                            className="w-full bg-white border border-cream-border rounded-xl p-2.5 text-xs font-medium focus:outline-none focus:border-brand-500"
                            required
                          />

                        </div>

                      </div>

                      <div className="flex flex-wrap justify-between gap-3 pt-2">

                        <button
                          type="submit"
                          disabled={submitting}
                          className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-cream-border rounded-xl text-xs font-bold text-charcoal-800 hover:bg-cream-100 shadow-subtle disabled:opacity-50"
                        >
                          <Send className="w-3.5 h-3.5" />
                          Submit Counter-Offer
                        </button>

                        <button
                          type="button"
                          onClick={
                            handleConfirmQuotation
                          }
                          disabled={
                            submitting ||
                            selectedQuote.stage ===
                              'PENDING_APPROVAL'
                          }
                          className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-subtle disabled:opacity-50"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Accept & Confirm
                        </button>

                        {(billReadyForQuote === selectedQuote._id || selectedQuote.isCustomerConfirmed) && (
                          <button
                            type="button"
                            onClick={handleGenerateBill}
                            disabled={billGenerating}
                            className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-500 hover:bg-brand-600 text-charcoal-950 rounded-xl text-xs font-black shadow-subtle disabled:opacity-50"
                          >
                            <Receipt className="w-4 h-4" />
                            {billGenerating ? 'Generating Bill...' : 'Generate Bill & Download'}
                          </button>
                        )}

                      </div>

                    </form>

                  </div>

                </div>
              ) : (
                <div className="bg-white border border-cream-border rounded-2xl p-12 text-center shadow-subtle">

                  <div className="w-14 h-14 mx-auto rounded-2xl bg-cream-100 flex items-center justify-center">
                    <Package className="w-7 h-7 text-charcoal-400" />
                  </div>

                  <h3 className="font-black text-lg text-charcoal-900 mt-4">
                    Select a quotation
                  </h3>

                  <p className="text-xs text-charcoal-500 mt-2">
                    Choose a quotation from the list to
                    review its commercial details.
                  </p>

                </div>
              )}

            </div>
          </div>
        )}

      </section>

      {/* ========================================================
          SECURITY FOOTER
      ========================================================= */}
      <div className="flex items-center justify-center gap-2 py-4 text-[10px] text-charcoal-400">
        <ShieldCheck className="w-3.5 h-3.5" />
        Customer data is isolated and internal pricing information
        is protected.
      </div>

    </div>
  );
};