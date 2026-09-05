import React, { useState, useEffect } from 'react';
import { api } from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/ui/StatusBadge';
import {
  Sparkles,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Save,
  Send,
  Building2,
  Layers,
  Tag,
  HelpCircle,
} from 'lucide-react';

interface CartLine {
  productId: string;
  productName: string;
  sku: string;
  categoryName: string;
  type: 'GOODS' | 'SERVICE' | 'COMBO';
  billingType: 'ONE_TIME' | 'RECURRING';
  quantity: number;
  unitPrice: number;
  unitCost: number;
  discountPct: number;
  taxRate: number;
  lineTotal?: number;
  lineCost?: number;
  lineGrossMargin?: number;
  lineMarginPct?: number;
  allowedDiscountCeiling?: number;
  isDiscountViolated?: boolean;
  discountDeltaPct?: number;
}

export const QuotationBuilderPage: React.FC<{
  quotationId?: string;
  onNavigate: (page: string, id?: string) => void;
}> = ({ quotationId, onNavigate }) => {
  const { role, user } = useAuth();

  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [priceList, setPriceList] = useState<string>('Standard Enterprise Price List (INR/USD)');
  const [quoteTitle, setQuoteTitle] = useState<string>('');
  const [customerNotes, setCustomerNotes] = useState<string>('');
  const [cartLines, setCartLines] = useState<CartLine[]>([]);
  const [upsellRecommendations, setUpsellRecommendations] = useState<any[]>([]);

  const [evaluation, setEvaluation] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [activeQuoteStage, setActiveQuoteStage] = useState<string>('DRAFT');
  const [currentQuoteNumber, setCurrentQuoteNumber] = useState<string>('');

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        const [custRes, prodRes] = await Promise.all([
          api.getCustomers(),
          api.getProducts(),
        ]);

        if (custRes.data.success) {
          setCustomers(custRes.data.data);
        }

        if (prodRes.data.success) {
          setProducts(prodRes.data.data);
        }

        if (quotationId) {
          const quoteRes = await api.getQuotationById(quotationId);
          if (quoteRes.data.success) {
            const q = quoteRes.data.data;
            setCurrentQuoteNumber(q.quoteNumber);
            setSelectedCustomerId(q.customerId._id || q.customerId);
            setQuoteTitle(q.title || '');
            setCustomerNotes(q.customerNotes || '');
            setActiveQuoteStage(q.stage);
            setCartLines(
              q.items.map((i: any) => ({
                productId: i.productId._id || i.productId,
                productName: i.productName,
                sku: i.sku,
                categoryName: i.categoryName,
                type: i.type,
                billingType: i.billingType,
                quantity: i.quantity,
                unitPrice: i.unitPrice,
                unitCost: i.unitCost || 0,
                discountPct: i.discountPct,
                taxRate: i.taxRate || 18,
                lineTotal: i.lineTotal,
                lineCost: i.lineCost,
                lineGrossMargin: i.lineGrossMargin,
                lineMarginPct: i.lineMarginPct,
                allowedDiscountCeiling: i.allowedDiscountCeiling,
                isDiscountViolated: i.isDiscountViolated,
                discountDeltaPct: i.discountDeltaPct,
              }))
            );
          }
        } else {
          // Clean initial state for new quotation
          setSelectedCustomerId('');
          setQuoteTitle('');
          setCustomerNotes('');
          setCartLines([]);
          setCurrentQuoteNumber('');
          setEvaluation(null);
        }
      } catch (err) {
        console.error('Error loading builder data:', err);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [quotationId]);

  useEffect(() => {
    const evaluate = async () => {
      if (!selectedCustomerId || cartLines.length === 0) {
        setEvaluation(null);
        return;
      }

      try {
        const payload = {
          customerId: selectedCustomerId,
          items: cartLines.map((line) => ({
            productId: line.productId,
            quantity: line.quantity,
            unitPrice: line.unitPrice,
            discountPct: line.discountPct,
          })),
        };

        const res = await api.evaluateDiscount(payload);
        if (res.data.success) {
          setEvaluation(res.data.data);

          // Update line items with live discount ceiling violation checks
          setCartLines((prev) =>
            prev.map((line, idx) => {
              const evaluatedItem = res.data.data.items[idx];
              if (!evaluatedItem) return line;
              return {
                ...line,
                lineTotal: evaluatedItem.lineTotal,
                lineCost: evaluatedItem.lineCost,
                lineGrossMargin: evaluatedItem.lineGrossMargin,
                lineMarginPct: evaluatedItem.lineMarginPct,
                allowedDiscountCeiling: evaluatedItem.allowedDiscountCeiling,
                isDiscountViolated: evaluatedItem.isDiscountViolated,
                discountDeltaPct: evaluatedItem.discountDeltaPct,
              };
            })
          );
        }
      } catch (err) {
        console.error('Live evaluation error:', err);
      }
    };

    evaluate();
  }, [selectedCustomerId, JSON.stringify(cartLines.map((l) => ({ id: l.productId, q: l.quantity, p: l.unitPrice, d: l.discountPct })))]);

  useEffect(() => {
    const fetchUpsells = async () => {
      if (cartLines.length === 0) {
        setUpsellRecommendations([]);
        return;
      }

      try {
        const currentProdIds = cartLines.map((l) => l.productId);
        const res = await api.getRecommendations(currentProdIds);
        if (res.data.success) {
          setUpsellRecommendations(res.data.data || []);
        }
      } catch (err) {
        console.error('Upsell fetch error:', err);
      }
    };

    fetchUpsells();
  }, [selectedCustomerId, cartLines.length]);

  const handleAddProduct = (productId: string) => {
    const prod = products.find((p) => p._id === productId);
    if (!prod) return;

    const existingIndex = cartLines.findIndex((l) => l.productId === prod._id);
    if (existingIndex >= 0) {
      const updated = [...cartLines];
      updated[existingIndex].quantity += 1;
      setCartLines(updated);
      return;
    }

    const newLine: CartLine = {
      productId: prod._id,
      productName: prod.name,
      sku: prod.sku,
      categoryName: prod.categoryId?.name || 'General',
      type: prod.type,
      billingType: prod.billingType,
      quantity: 1,
      unitPrice: prod.unitPrice,
      unitCost: prod.unitCost,
      discountPct: 0,
      taxRate: prod.taxRate || 18,
      allowedDiscountCeiling: prod.maxDiscountCeiling || 10,
    };

    setCartLines([...cartLines, newLine]);
  };

  const handleAddQuickItem = (name: string, price: number, ceiling: number, billingType: 'ONE_TIME' | 'RECURRING' = 'ONE_TIME') => {
    const existingIndex = cartLines.findIndex((l) => l.productName.toLowerCase().includes(name.toLowerCase()));
    if (existingIndex >= 0) {
      const updated = [...cartLines];
      updated[existingIndex].quantity += 1;
      setCartLines(updated);
      return;
    }

    // Try to match with existing product from DB
    const matchingProd = products.find((p) => p.name.toLowerCase().includes(name.toLowerCase()));
    const newLine: CartLine = {
      productId: matchingProd?._id || `temp-${Date.now()}`,
      productName: matchingProd?.name || name,
      sku: matchingProd?.sku || `SKU-${name.toUpperCase().replace(/\s+/g, '-').slice(0, 8)}`,
      categoryName: matchingProd?.categoryId?.name || 'Accessories',
      type: matchingProd?.type || 'GOODS',
      billingType: matchingProd?.billingType || billingType,
      quantity: 1,
      unitPrice: matchingProd?.unitPrice || price,
      unitCost: matchingProd?.unitCost || Math.round(price * 0.6),
      discountPct: 0,
      taxRate: 18,
      allowedDiscountCeiling: matchingProd?.maxDiscountCeiling || ceiling,
    };

    setCartLines([...cartLines, newLine]);
  };

  const handleUpdateLine = (index: number, field: keyof CartLine, value: any) => {
    const updated = [...cartLines];
    updated[index] = { ...updated[index], [field]: value };
    setCartLines(updated);
  };

  const handleRemoveLine = (index: number) => {
    const updated = cartLines.filter((_, idx) => idx !== index);
    setCartLines(updated);
  };

  const handleSaveDraft = async () => {
    if (!selectedCustomerId) {
      setErrorMessage('Please select a customer before saving.');
      return;
    }
    if (cartLines.length === 0) {
      setErrorMessage('Please add at least one line item.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMessage('');
      const payload = {
        customerId: selectedCustomerId,
        title: quoteTitle.trim() || 'Commercial Quotation Draft',
        customerNotes,
        items: cartLines.map((l) => ({
          productId: l.productId,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          discountPct: l.discountPct,
        })),
      };

      if (quotationId) {
        const res = await api.updateQuotation(quotationId, payload);
        if (res.data.success) {
          setSuccessMessage('Quotation updated successfully as Draft!');
          setTimeout(() => setSuccessMessage(''), 3000);
        }
      } else {
        const res = await api.createQuotation(payload);
        if (res.data.success) {
          setSuccessMessage(`Quotation ${res.data.data.quoteNumber} created as Draft!`);
          setCurrentQuoteNumber(res.data.data.quoteNumber);
          setTimeout(() => setSuccessMessage(''), 3000);
        }
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitForApproval = async () => {
    if (!selectedCustomerId) {
      setErrorMessage('Please select a customer account first.');
      return;
    }
    if (cartLines.length === 0) {
      setErrorMessage('Please add at least one line item.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMessage('');

      let targetId = quotationId;
      const payload = {
        customerId: selectedCustomerId,
        title: quoteTitle.trim() || 'New Commercial Quotation',
        customerNotes,
        submitForApproval: true,
        items: cartLines.map((l) => ({
          productId: l.productId,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          discountPct: l.discountPct,
        })),
      };

      if (!targetId) {
        const createRes = await api.createQuotation(payload);
        targetId = createRes.data.data._id;
        setCurrentQuoteNumber(createRes.data.data.quoteNumber);
      } else {
        await api.updateQuotation(targetId, payload);
      }

      const submitRes = await api.submitQuotation(targetId!);
      if (submitRes.data.success) {
        setSuccessMessage(submitRes.data.message);
        setActiveQuoteStage(submitRes.data.data.quotation.stage);
        setTimeout(() => {
          if (submitRes.data.data.approval) {
            onNavigate('approvals', submitRes.data.data.approval._id);
          } else {
            onNavigate('quotations');
          }
        }, 800);
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-cream-300 border-t-brand-500"></div>
      </div>
    );
  }

  const selectedCustomer = customers.find((c) => c._id === selectedCustomerId);
  const customerName = selectedCustomer?.companyName || 'Select Customer';
  const displayTitle = currentQuoteNumber ? `Quotation Detail: ${currentQuoteNumber} (${customerName})` : `Quotation Detail: New Quotation (${customerName})`;

  return (
    <div className="space-y-6 max-w-[1500px] mx-auto pb-12">
      {/* Top Header matching Reference Image 4 */}
      <div className="pb-4 border-b border-cream-border">
        <div className="text-[10px] font-mono tracking-widest text-charcoal-400 uppercase font-bold mb-1">
          WORKSPACE / QUOTATION DETAIL
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-charcoal-900">
              {displayTitle}
            </h1>
            <p className="text-xs sm:text-sm text-charcoal-600 mt-1">
              Opened by clicking a row on the Quotations list. Add products, apply discounts, review upsells.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {currentQuoteNumber && (
              <span className="text-xs bg-cream-100 text-charcoal-700 px-2.5 py-1 rounded-md font-mono font-bold border border-cream-border">
                {currentQuoteNumber}
              </span>
            )}
            <StatusBadge status={activeQuoteStage} size="xs" />
          </div>
        </div>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-center gap-2.5 font-bold shadow-subtle">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}
      {errorMessage && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs flex items-center gap-2.5 font-bold shadow-subtle">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Customer & Price List Row matching Reference Image 4 */}
      <div className="bg-white border border-cream-border rounded-2xl p-5 shadow-subtle">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-charcoal-700 font-bold mb-1.5">
              Customer *
            </label>
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="w-full bg-cream-50 border border-cream-border text-xs text-charcoal-900 font-bold rounded-xl p-2.5 focus:border-brand-500 focus:outline-none"
            >
              <option value="">-- Choose Customer Account --</option>
              {customers.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.companyName} ({c.tier} Tier — Max {c.tier === 'GOLD' ? '15%' : c.tier === 'SILVER' ? '10%' : '5%'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-charcoal-700 font-bold mb-1.5">
              Price List
            </label>
            <select
              value={priceList}
              onChange={(e) => setPriceList(e.target.value)}
              className="w-full bg-cream-50 border border-cream-border text-xs text-charcoal-900 font-bold rounded-xl p-2.5 focus:border-brand-500 focus:outline-none"
            >
              <option value="Standard Enterprise Price List (INR/USD)">Standard Enterprise Price List (INR/USD)</option>
              <option value="Direct Channel Volume Pricing">Direct Channel Volume Pricing</option>
              <option value="Strategic Partner Discount Matrix">Strategic Partner Discount Matrix</option>
            </select>
          </div>
        </div>
      </div>

      {/* Line Items Table matching Reference Image 4 with fixed-width cells */}
      <div className="bg-white border border-cream-border rounded-2xl p-5 shadow-subtle space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-cream-border">
          <div>
            <h3 className="font-bold text-sm text-charcoal-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-brand-500" />
              <span>Quotation Line Items ({cartLines.length})</span>
            </h3>
            <p className="text-xs text-charcoal-500 mt-0.5">
              Configured products and services with real-time margin calculations.
            </p>
          </div>

          {/* Add Product Dropdown */}
          <div className="flex items-center gap-2">
            <select
              defaultValue=""
              onChange={(e) => {
                handleAddProduct(e.target.value);
                e.target.value = '';
              }}
              className="bg-cream-50 border border-cream-border text-xs text-charcoal-900 font-bold rounded-xl px-3 py-2 focus:border-brand-500 focus:outline-none"
            >
              <option value="" disabled>
                + Add Product / Service...
              </option>
              {products.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name} — ₹{Number(p.unitPrice).toLocaleString('en-IN')} ({p.billingType})
                </option>
              ))}
            </select>
          </div>
        </div>

        {cartLines.length === 0 ? (
          <div className="text-center py-12 text-charcoal-400 text-xs font-medium space-y-2">
            <Layers className="w-8 h-8 mx-auto text-charcoal-300" />
            <p className="text-charcoal-600 font-bold">No product line items in this quotation.</p>
            <p className="text-charcoal-400 text-[11px]">Select a product above or click one of the suggested upsell items below.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs table-fixed">
              <colgroup>
                <col className="w-auto min-w-[200px]" />
                <col className="w-24 text-center" />
                <col className="w-24 text-center" />
                <col className="w-28 text-right" />
                <col className="w-24 text-center" />
                <col className="w-24 text-center" />
                <col className="w-32 text-center" />
                <col className="w-12 text-center" />
              </colgroup>
              <thead className="text-[11px] uppercase tracking-wider text-charcoal-500 bg-cream-50/60 border-b border-cream-border">
                <tr>
                  <th className="py-2.5 px-3 font-bold">Product</th>
                  <th className="py-2.5 px-3 font-bold text-center">Type</th>
                  <th className="py-2.5 px-3 font-bold text-center">Qty</th>
                  <th className="py-2.5 px-3 font-bold text-right">Price</th>
                  <th className="py-2.5 px-3 font-bold text-center">Discount</th>
                  <th className="py-2.5 px-3 font-bold text-center">Limit</th>
                  <th className="py-2.5 px-3 font-bold text-center">Status</th>
                  <th className="py-2.5 px-3 font-bold text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-border/60">
                {cartLines.map((line, idx) => {
                  const limit = line.allowedDiscountCeiling || 10;
                  const discount = line.discountPct || 0;
                  const isOver = discount > limit;
                  const overPts = discount - limit;

                  return (
                    <tr key={idx} className={`hover:bg-cream-50/40 transition-colors ${isOver ? 'bg-rose-50/30' : ''}`}>
                      <td className="py-3 px-3">
                        <div className="font-bold text-charcoal-900 truncate">{line.productName}</div>
                        <div className="text-[10px] font-mono text-charcoal-500 truncate">
                          {line.sku} • {line.categoryName}
                        </div>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                          line.billingType === 'RECURRING'
                            ? 'bg-purple-100 text-purple-800 border border-purple-200'
                            : 'bg-blue-100 text-blue-800 border border-blue-200'
                        }`}>
                          {line.billingType === 'RECURRING' ? 'RECURRING' : 'ONE-TIME'}
                        </span>
                      </td>

                      {/* Fixed-size Qty column: NEVER increases font or page size */}
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleUpdateLine(idx, 'quantity', Math.max(1, line.quantity - 1))}
                            className="w-5 h-6 bg-cream-100 hover:bg-cream-200 text-charcoal-700 font-bold rounded text-xs flex items-center justify-center transition-colors shrink-0"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min="1"
                            value={line.quantity}
                            onChange={(e) => handleUpdateLine(idx, 'quantity', Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-10 h-6 bg-cream-50 border border-cream-border text-center font-bold font-mono text-xs text-charcoal-900 rounded p-0 focus:border-brand-500 focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => handleUpdateLine(idx, 'quantity', line.quantity + 1)}
                            className="w-5 h-6 bg-cream-100 hover:bg-cream-200 text-charcoal-700 font-bold rounded text-xs flex items-center justify-center transition-colors shrink-0"
                          >
                            +
                          </button>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-right">
                        <input
                          type="number"
                          min="0"
                          value={line.unitPrice}
                          onChange={(e) => handleUpdateLine(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                          className="w-20 h-6 bg-cream-50 border border-cream-border text-right font-bold font-mono text-xs text-charcoal-900 rounded px-1.5 focus:border-brand-500 focus:outline-none tabular-nums"
                        />
                      </td>

                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-0.5">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={line.discountPct}
                            onChange={(e) => handleUpdateLine(idx, 'discountPct', parseFloat(e.target.value) || 0)}
                            className={`w-12 h-6 text-center font-mono font-bold text-xs rounded border focus:outline-none ${
                              isOver
                                ? 'bg-rose-50 border-rose-300 text-rose-700'
                                : 'bg-cream-50 border-cream-border text-charcoal-900 focus:border-brand-500'
                            }`}
                          />
                          <span className="text-charcoal-500 font-bold text-[11px]">%</span>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-center font-mono font-bold text-charcoal-700 text-xs">
                        {limit}%
                      </td>

                      <td className="py-3 px-3 text-center">
                        {isOver ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold bg-rose-100 text-rose-800 px-2 py-0.5 rounded border border-rose-200 whitespace-nowrap">
                            OVER (+{overPts}pt)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200 whitespace-nowrap">
                            OK (Max {limit}%)
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveLine(idx)}
                          className="text-charcoal-400 hover:text-rose-600 p-1 rounded transition-colors"
                          title="Remove Line"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Yellow Info Banner matching Reference Image 4 */}
      <div className="p-3.5 bg-amber-50/90 border border-amber-200 text-amber-900 rounded-2xl text-xs font-semibold flex items-center gap-2.5 shadow-subtle">
        <HelpCircle className="w-4 h-4 text-amber-600 shrink-0" />
        <span>Discount is checked against each line's own limit live, as soon as it is entered, not only at submit time.</span>
      </div>

      {/* Upsell and Cross-Sell Suggestions section matching Reference Image 4 */}
      <div className="space-y-3">
        <h3 className="font-black text-base text-charcoal-900 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-brand-500" />
          <span>Upsell and Cross-Sell Suggestions</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Card 1: Wireless Mouse */}
          <div
            onClick={() => handleAddQuickItem('Wireless Mouse', 1500, 15)}
            className="bg-white hover:bg-cream-50/80 border border-cream-border hover:border-brand-400 rounded-2xl p-4 shadow-subtle cursor-pointer transition-all active:scale-[0.99] group space-y-1.5"
          >
            <div className="font-bold text-sm text-charcoal-900 group-hover:text-brand-600 flex items-center justify-between">
              <span>+ Wireless Mouse</span>
              <Plus className="w-4 h-4 text-charcoal-400 group-hover:text-brand-500 transition-transform group-hover:rotate-90" />
            </div>
            <p className="text-xs text-charcoal-500 font-mono font-medium">Margin +$18 (₹1,500)</p>
          </div>

          {/* Card 2: Docking Station */}
          <div
            onClick={() => handleAddQuickItem('Docking Station', 8500, 12)}
            className="bg-white hover:bg-cream-50/80 border border-cream-border hover:border-brand-400 rounded-2xl p-4 shadow-subtle cursor-pointer transition-all active:scale-[0.99] group space-y-1.5"
          >
            <div className="font-bold text-sm text-charcoal-900 group-hover:text-brand-600 flex items-center justify-between">
              <span>+ Docking Station</span>
              <Plus className="w-4 h-4 text-charcoal-400 group-hover:text-brand-500 transition-transform group-hover:rotate-90" />
            </div>
            <p className="text-xs text-emerald-700 font-mono font-semibold">Promo: 12% off</p>
          </div>

          {/* Card 3: Care Plan 2yr */}
          <div
            onClick={() => handleAddQuickItem('Care Plan 2yr', 4200, 15, 'RECURRING')}
            className="bg-white hover:bg-cream-50/80 border border-cream-border hover:border-brand-400 rounded-2xl p-4 shadow-subtle cursor-pointer transition-all active:scale-[0.99] group space-y-1.5"
          >
            <div className="font-bold text-sm text-charcoal-900 group-hover:text-brand-600 flex items-center justify-between">
              <span>+ Care Plan 2yr</span>
              <Plus className="w-4 h-4 text-charcoal-400 group-hover:text-brand-500 transition-transform group-hover:rotate-90" />
            </div>
            <p className="text-xs text-charcoal-500 font-mono font-medium">Margin +$46 (₹3,800)</p>
          </div>
        </div>
      </div>

      {/* Bottom Summary and Action Buttons matching Reference Image 4 */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-cream-border">
        <div className="flex items-center gap-4 text-xs font-mono text-charcoal-700">
          {evaluation && (
            <>
              <span>
                Subtotal: <strong className="text-charcoal-900">₹{Number(evaluation.subtotal || 0).toLocaleString('en-IN')}</strong>
              </span>
              <span>
                Discount: <strong className="text-rose-600">-₹{Number(evaluation.discountAmount || 0).toLocaleString('en-IN')}</strong>
              </span>
              <span>
                Total: <strong className="text-charcoal-950 font-black text-sm">₹{Number(evaluation.totalAmount || 0).toLocaleString('en-IN')}</strong>
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={submitting}
            className="inline-flex items-center justify-center gap-1.5 bg-white hover:bg-cream-50 text-charcoal-900 text-xs font-bold px-5 py-2.5 rounded-2xl border border-cream-border shadow-subtle transition-all active:scale-[0.98] disabled:opacity-50"
          >
            <Save className="w-4 h-4 text-charcoal-500" />
            <span>Save Draft</span>
          </button>

          <button
            type="button"
            onClick={handleSubmitForApproval}
            disabled={submitting || cartLines.length === 0}
            className="inline-flex items-center justify-center gap-1.5 bg-[#4B88E8] hover:bg-[#3B78D8] text-white text-xs font-bold px-6 py-2.5 rounded-2xl shadow-subtle transition-all active:scale-[0.98] disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span>Submit for Approval</span>
          </button>
        </div>
      </div>
    </div>
  );
};
