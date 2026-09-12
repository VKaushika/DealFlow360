import React, { useState } from 'react';
import { useAuth, RoleType } from '../context/AuthContext';
import { ChevronDown, ChevronUp, Sparkles, ArrowRight } from 'lucide-react';

interface JudgeStep {
  id: number;
  title: string;
  role: RoleType;
  description: string;
  navTarget: string;
}

const DEMO_STEPS: JudgeStep[] = [
  { id: 1, title: 'Sales Rep: Create Quote for ABC Corp', role: 'SALES_REP', description: 'Select ABC Corp (Gold Tier - 15% limit). Add 10x Laptop, 1x Setup Service, 1x Monthly Support.', navTarget: 'quotation-builder' },
  { id: 2, title: 'Apply Over-Limit Discount (18%)', role: 'SALES_REP', description: 'Apply 18% discount on Setup Service (Allowed: 10%). Discount engine flags +8% violation and HIGH risk.', navTarget: 'quotation-builder' },
  { id: 3, title: 'Submit for Automatic Approval', role: 'SALES_REP', description: 'Submit quote. System auto-routes to Sales Manager and Finance Ops multi-tier chain.', navTarget: 'quotations' },
  { id: 4, title: 'Sales Manager Approves', role: 'SALES_MANAGER', description: 'Switch to Sales Manager persona, inspect risk summary and click Approve.', navTarget: 'approvals' },
  { id: 5, title: 'Upsell & Cross-Sell Additions', role: 'SALES_REP', description: 'Add recommended 3-Year Warranty from the Live Upsell Drawer. Totals and margin update immediately.', navTarget: 'quotation-builder' },
  { id: 6, title: 'Fulfillment Warehouse Auto-Split', role: 'FINANCE_OPS', description: 'Allocate stock for 10 Laptops: Auto-splits Main Warehouse (6) + East Depot (4), Backorders: 0.', navTarget: 'fulfillment' },
  { id: 7, title: 'Hybrid Billing Generation', role: 'FINANCE_OPS', description: 'Generates separated One-Time Invoice (Laptops+Services) and Recurring Subscription (Support).', navTarget: 'billing' },
  { id: 8, title: 'Customer Portal: Counter-Offer', role: 'CUSTOMER', description: 'Customer (Ananya @ ABC Corp) opens restricted portal and counters with 20% discount.', navTarget: 'portal' },
  { id: 9, title: 'Discount Re-evaluation & Re-approval', role: 'SALES_MANAGER', description: 'Counter-discount triggers automatic re-evaluation and restarts approval workflow.', navTarget: 'approvals' },
  { id: 10, title: 'Confirm Deal & Record Payment', role: 'FINANCE_OPS', description: 'Customer confirms. Record Cash/Bank payment on invoice. Deal Health & Reports update dynamically!', navTarget: 'billing' },
];

export const JudgeDemoBanner: React.FC<{ onNavigate: (target: string) => void }> = ({ onNavigate }) => {
  const { role, switchPersona } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [activeStepId, setActiveStepId] = useState(1);

  const handleStepClick = async (step: JudgeStep) => {
    setActiveStepId(step.id);
    if (role !== step.role) {
      await switchPersona(step.role);
    }
    onNavigate(step.navTarget);
  };

  return (
    <div className="bg-cream-200 border-b border-cream-border text-charcoal-700 text-xs">
      <div className="max-w-[1600px] mx-auto px-5 sm:px-8 py-2 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
          <span className="font-bold text-charcoal-900 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-brand-600" />
            Interactive Golden Workflow Tour
          </span>
          <span className="text-cream-darkBorder hidden sm:inline">|</span>
          <span className="text-charcoal-500 hidden sm:inline font-medium">
            Step {activeStepId}/10: <span className="text-charcoal-900 font-semibold">{DEMO_STEPS[activeStepId - 1]?.title}</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-1 text-[11px] font-bold text-charcoal-800 hover:text-black bg-white hover:bg-cream-50 px-2.5 py-1 rounded-xl border border-cream-border shadow-subtle transition-colors"
          >
            <span>{isOpen ? 'Hide Steps' : 'View 10-Step Workflow'}</span>
            {isOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="border-t border-cream-border bg-cream-100 px-5 sm:px-8 py-3 max-w-[1600px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-2.5 max-h-[60vh] overflow-y-auto">
          {DEMO_STEPS.map((step) => {
            const isActive = activeStepId === step.id;
            return (
              <div
                key={step.id}
                onClick={() => handleStepClick(step)}
                className={`p-3 rounded-2xl cursor-pointer border transition-all text-left flex flex-col justify-between ${
                  isActive
                    ? 'bg-white border-brand-500 shadow-card ring-2 ring-brand-500/20'
                    : 'bg-white hover:bg-cream-50 border-cream-border'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full font-mono ${
                      isActive ? 'bg-brand-500 text-charcoal-950' : 'bg-cream-200 text-charcoal-600'
                    }`}>
                      Step {step.id}
                    </span>
                    <span className="text-[10px] font-semibold text-charcoal-500 bg-cream-100 px-1.5 py-0.5 rounded-md">
                      {step.role}
                    </span>
                  </div>
                  <h4 className="font-bold text-xs text-charcoal-900 leading-tight mb-1">{step.title}</h4>
                  <p className="text-[11px] text-charcoal-500 leading-snug">{step.description}</p>
                </div>
                <div className="mt-2.5 pt-2 border-t border-cream-border flex items-center justify-between text-[11px] text-brand-600 font-bold">
                  <span>Switch Role & Run</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
