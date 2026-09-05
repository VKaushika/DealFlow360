import React, { useState, useEffect } from 'react';
import { api } from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/ui/StatusBadge';
import {
  PackagePlus,
  Search,
  Filter,
  DollarSign,
  TrendingUp,
  Warehouse,
  Sparkles,
  Layers,
} from 'lucide-react';

export const ProductsPage: React.FC<{
  onNavigate: (page: string, id?: string) => void;
}> = ({ onNavigate }) => {
  const { role } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (searchTerm) params.search = searchTerm;
      if (categoryFilter) params.category = categoryFilter;

      const [prodRes, catRes] = await Promise.all([
        api.getProducts(params),
        api.getCategories(),
      ]);

      if (prodRes.data.success) setProducts(prodRes.data.data);
      if (catRes.data.success) setCategories(catRes.data.data);
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [categoryFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-cream-border">
        <div>
          <div className="text-[10px] font-mono tracking-widest text-charcoal-400 uppercase font-bold mb-1">
            CATALOG & INVENTORY / MASTER
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-charcoal-900 flex items-center gap-2.5">
            <PackagePlus className="w-6 h-6 text-brand-500" />
            <span>Product Master & Inventory</span>
          </h1>
          <p className="text-xs sm:text-sm text-charcoal-600 mt-1">
            Complete master catalog with standard pricing, unit costs, live warehouse stock levels, and discount ceilings.
          </p>
        </div>

        <button
          onClick={() => onNavigate('quotation-builder')}
          className="inline-flex items-center gap-2 bg-charcoal-900 hover:bg-black text-white text-xs font-bold px-4 py-2.5 rounded-2xl shadow-subtle transition-all active:scale-[0.98]"
        >
          <span>Create Quote with Products</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-cream-border shadow-subtle">
        <form onSubmit={handleSearch} className="flex items-center gap-2 w-full sm:w-80">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-charcoal-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by product name or SKU..."
              className="w-full bg-cream-50 border border-cream-border text-xs text-charcoal-900 font-medium pl-9 pr-3 py-2 rounded-xl focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500/30"
            />
          </div>
          <button
            type="submit"
            className="bg-cream-100 hover:bg-cream-200 text-charcoal-900 text-xs font-bold px-3.5 py-2 rounded-xl border border-cream-border transition-colors"
          >
            Search
          </button>
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-charcoal-400" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-cream-50 border border-cream-border text-xs text-charcoal-900 font-medium rounded-xl px-3.5 py-2 focus:border-brand-500 focus:outline-none"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name} (Max {c.defaultDiscountCeiling}%)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white border border-cream-border rounded-2xl overflow-hidden shadow-subtle">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-cream-300 border-t-brand-500"></div>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16 text-charcoal-500 text-xs font-medium">
            <PackagePlus className="w-8 h-8 mx-auto mb-2 text-charcoal-300" />
            No products found matching your filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] uppercase tracking-wider text-charcoal-500 bg-cream-50/60 border-b border-cream-border">
                <tr>
                  <th className="py-3 px-4 font-bold">Product Name & SKU</th>
                  <th className="py-3 px-4 font-bold">Category</th>
                  <th className="py-3 px-4 font-bold">Type</th>
                  <th className="py-3 px-4 font-bold">Billing</th>
                  <th className="py-3 px-4 font-bold text-right">Selling Price</th>
                  <th className="py-3 px-4 font-bold text-right">Cost Price</th>
                  <th className="py-3 px-4 font-bold text-right">Margin %</th>
                  <th className="py-3 px-4 font-bold">Total Stock</th>
                  <th className="py-3 px-4 font-bold text-right">Discount Ceiling</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-border/60">
                {products.map((p) => (
                  <tr key={p._id} className="hover:bg-cream-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-charcoal-900 flex items-center gap-1.5">
                        <span>{p.name}</span>
                        {p.isPromoted && (
                          <span className="text-[9px] bg-brand-100 text-brand-800 px-1.5 py-0.5 rounded font-bold border border-brand-200">
                            Promoted
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-mono text-charcoal-500">{p.sku}</span>
                    </td>
                    <td className="py-3.5 px-4 text-charcoal-700 font-medium">
                      {p.categoryId?.name || 'General'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-[10px] bg-cream-100 text-charcoal-700 px-2 py-0.5 rounded font-mono font-bold border border-cream-border">
                        {p.type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                        p.billingType === 'RECURRING'
                          ? 'bg-purple-100 text-purple-800 border border-purple-200'
                          : 'bg-blue-100 text-blue-800 border border-blue-200'
                      }`}>
                        {p.billingType}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-charcoal-900 tabular-nums">
                      ₹{Number(p.unitPrice || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 text-right text-charcoal-500 font-mono font-medium tabular-nums">
                      ₹{Number(p.unitCost || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-600 tabular-nums">
                      {p.marginPct || 25}%
                    </td>
                    <td className="py-3.5 px-4">
                      {p.type === 'GOODS' ? (
                        <div className="flex items-center gap-1.5 font-mono font-bold text-charcoal-800">
                          <Warehouse className="w-3.5 h-3.5 text-charcoal-400" />
                          <span>{p.totalAvailable || 0} Units</span>
                        </div>
                      ) : (
                        <span className="text-charcoal-400 italic text-[11px]">N/A (Service)</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-amber-700 font-mono">
                      {p.maxDiscountCeiling || p.categoryId?.defaultDiscountCeiling || 10}% Max
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
