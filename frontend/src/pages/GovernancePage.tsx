import React, { useState, useEffect } from 'react';
import { api } from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/ui/StatusBadge';
import {
  Sliders,
  ShieldCheck,
  Percent,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Sparkles,
} from 'lucide-react';

export const GovernancePage: React.FC<{
  onNavigate: (page: string, id?: string) => void;
}> = ({ onNavigate }) => {
  const { role } = useAuth();
  const [tiers, setTiers] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [approvalRules, setApprovalRules] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saveSuccess, setSaveSuccess] = useState<string>('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tierRes, catRes, appRes] = await Promise.all([
        api.getDiscountTiers(),
        api.getCategories(),
        api.getApprovalRules(),
      ]);

      if (tierRes.data.success) setTiers(tierRes.data.data);
      if (catRes.data.success) setCategories(catRes.data.data);
      if (appRes.data.success) setApprovalRules(appRes.data.data);
    } catch (err) {
      console.error('Error fetching governance data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateTier = async (id: string, maxDiscountPct: number) => {
    try {
      const res = await api.updateDiscountTier(id, { maxDiscountPct });
      if (res.data.success) {
        setSaveSuccess('Discount tier ceiling saved.');
        await fetchData();
        setTimeout(() => setSaveSuccess(''), 3000);
      }
    } catch (err) {
      console.error('Failed to update tier:', err);
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
            GOVERNANCE & CONTROLS / POLICIES
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-charcoal-900 flex items-center gap-2.5">
            <Sliders className="w-6 h-6 text-brand-500" />
            <span>Discount & Governance Rules</span>
          </h1>
          <p className="text-xs sm:text-sm text-charcoal-600 mt-1">
            Configure customer tier ceilings, category maximums, and deterministic multi-tier approval routing rules.
          </p>
        </div>

        <span className="text-xs font-mono font-bold bg-white text-charcoal-700 border border-cream-border px-3.5 py-2 rounded-xl shadow-subtle">
          Admin Governance Engine
        </span>
      </div>

      {saveSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-center gap-2.5 font-bold shadow-subtle">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{saveSuccess}</span>
        </div>
      )}

      {/* 1. Customer Tiers Configuration */}
      <div className="bg-white border border-cream-border rounded-2xl p-6 space-y-5 shadow-subtle">
        <h3 className="font-bold text-sm text-charcoal-900 flex items-center gap-2 pb-3 border-b border-cream-border">
          <Percent className="w-4 h-4 text-brand-500" />
          <span>Customer Tier Discount Ceilings</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {tiers.map((tier) => (
            <div key={tier._id} className="bg-cream-50/50 p-4 rounded-xl border border-cream-border space-y-3">
              <div className="flex items-center justify-between">
                <StatusBadge status={tier.tierName} size="xs" />
                <span className="text-xs font-bold text-charcoal-900 font-mono">{tier.maxDiscountPct}% Limit</span>
              </div>

              <p className="text-xs text-charcoal-600 font-medium">{tier.description}</p>

              <div className="pt-2.5 border-t border-cream-border flex items-center justify-between gap-2">
                <label className="text-[11px] font-bold text-charcoal-600">Max Discount %:</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  defaultValue={tier.maxDiscountPct}
                  onBlur={(e) => handleUpdateTier(tier._id, parseFloat(e.target.value) || tier.maxDiscountPct)}
                  className="w-20 bg-white border border-cream-border text-center font-bold text-charcoal-900 rounded-lg p-1.5 text-xs font-mono focus:border-brand-500 focus:outline-none"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Category Discount Ceilings */}
      <div className="bg-white border border-cream-border rounded-2xl p-6 space-y-5 shadow-subtle">
        <h3 className="font-bold text-sm text-charcoal-900 flex items-center gap-2 pb-3 border-b border-cream-border">
          <Layers className="w-4 h-4 text-brand-500" />
          <span>Category-Specific Discount Limits</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {categories.map((cat) => (
            <div key={cat._id} className="bg-cream-50/50 p-4 rounded-xl border border-cream-border space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-charcoal-900">{cat.name}</span>
                <span className="text-xs font-mono font-black text-brand-600">{cat.defaultDiscountCeiling}%</span>
              </div>
              <p className="text-[11px] text-charcoal-600 font-medium leading-snug">{cat.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Multi-Tier Approval Chain Rules */}
      <div className="bg-white border border-cream-border rounded-2xl p-6 space-y-5 shadow-subtle">
        <h3 className="font-bold text-sm text-charcoal-900 flex items-center gap-2 pb-3 border-b border-cream-border">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Configured Approval Routing Logic</span>
        </h3>

        <div className="space-y-3">
          {approvalRules.map((rule, idx) => (
            <div
              key={rule._id || idx}
              className="bg-cream-50/50 p-4 rounded-xl border border-cream-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-charcoal-900 text-xs">{rule.name}</span>
                  <span className="bg-cream-100 text-charcoal-800 px-2 py-0.5 rounded font-mono font-bold text-[10px] border border-cream-border">
                    Step {rule.stepOrder}: {rule.requiredRole}
                  </span>
                </div>
                <p className="text-charcoal-600 font-medium text-[11px]">{rule.description}</p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200">
                  Active in Engine
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
