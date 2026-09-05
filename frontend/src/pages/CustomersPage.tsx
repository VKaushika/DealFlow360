import React, { useState, useEffect } from 'react';
import { api } from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/ui/StatusBadge';
import {
  Users,
  Search,
  Plus,
  Building2,
  Phone,
  Mail,
  MapPin,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

export const CustomersPage: React.FC<{
  onNavigate: (page: string, id?: string) => void;
}> = ({ onNavigate }) => {
  const { role } = useAuth();
  const [customers, setCustomers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await api.getCustomers({ search: searchTerm });
      if (res.data.success) {
        setCustomers(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-cream-border">
        <div>
          <div className="text-[10px] font-mono tracking-widest text-charcoal-400 uppercase font-bold mb-1">
            ACCOUNTS / CUSTOMERS
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-charcoal-900 flex items-center gap-2.5">
            <Users className="w-6 h-6 text-brand-500" />
            <span>Customers & Governance Tiers</span>
          </h1>
          <p className="text-xs sm:text-sm text-charcoal-600 mt-1">
            Enterprise customer directory with assigned discount governance tiers (Bronze, Silver, Gold, Platinum).
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchCustomers();
          }}
          className="flex items-center gap-2"
        >
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-charcoal-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search company or contact..."
              className="bg-white border border-cream-border text-xs text-charcoal-900 font-medium pl-9 pr-3 py-2 rounded-xl focus:border-brand-500 focus:outline-none w-64 shadow-subtle"
            />
          </div>
          <button
            type="submit"
            className="bg-charcoal-900 hover:bg-black text-white text-xs font-bold px-4 py-2 rounded-xl border border-charcoal-800 transition-colors shadow-subtle"
          >
            Search
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-full flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-cream-300 border-t-brand-500"></div>
          </div>
        ) : customers.length === 0 ? (
          <div className="col-span-full text-center py-16 text-charcoal-500 text-xs font-medium">
            No customer accounts found.
          </div>
        ) : (
          customers.map((c) => (
            <div
              key={c._id}
              className="bg-white border border-cream-border p-5 rounded-2xl space-y-4 hover:shadow-subtle transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-cream-100 border border-cream-border flex items-center justify-center font-mono font-black text-xs text-charcoal-800">
                    {c.companyName.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-charcoal-900 line-clamp-1">{c.companyName}</h4>
                    <span className="text-[10px] text-charcoal-400 font-mono font-semibold">{c.code}</span>
                  </div>
                </div>

                <StatusBadge status={c.tier} size="xs" />
              </div>

              <div className="space-y-2 text-xs text-charcoal-600 pt-1">
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-charcoal-400" />
                  <span className="truncate font-medium">{c.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building2 className="w-3.5 h-3.5 text-charcoal-400" />
                  <span>Industry: <strong className="text-charcoal-800 font-semibold">{c.industry}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-charcoal-400" />
                  <span>{c.address?.city || 'Bangalore'}, {c.address?.country || 'India'}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-cream-border flex items-center justify-between text-xs">
                <span className="text-charcoal-500 text-[11px] font-mono font-semibold">
                  Credit: ₹{(c.creditLimit || 0).toLocaleString('en-IN')}
                </span>
                <button
                  onClick={() => onNavigate('quotation-builder')}
                  className="text-brand-600 hover:text-brand-700 font-bold text-xs flex items-center gap-1 transition-colors"
                >
                  <span>New Quote</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
