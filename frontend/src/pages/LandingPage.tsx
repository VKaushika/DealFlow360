import React from 'react';

interface LandingPageProps {
  onNavigate: (page: string, id?: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-cream-100 flex items-center justify-center px-6">
      <div className="max-w-5xl w-full text-center">

        <div className="bg-white border border-cream-border rounded-3xl p-10 sm:p-16 shadow-subtle">

          <h1 className="text-4xl sm:text-6xl font-black text-charcoal-900">
            Welcome to DealFlow360
          </h1>

          <p className="mt-5 text-base sm:text-lg text-charcoal-500 max-w-2xl mx-auto">
            Manage your sales, quotations, approvals, fulfillment,
            billing and customer relationships in one powerful platform.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8">

            <button
              type="button"
              onClick={() => onNavigate('login')}
              className="px-7 py-3 bg-brand-500 hover:bg-brand-600 text-charcoal-950 font-black rounded-xl shadow-subtle transition-all"
            >
              Sign In
            </button>

            <button
              type="button"
              onClick={() => onNavigate('login')}
              className="px-7 py-3 bg-cream-100 hover:bg-cream-200 text-charcoal-900 font-bold rounded-xl border border-cream-border transition-all"
            >
              Create Account
            </button>

          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-12">

            <div className="p-5 bg-cream-50 rounded-2xl border border-cream-border">
              <h3 className="font-black text-charcoal-900">
                Sales Management
              </h3>
              <p className="text-xs text-charcoal-500 mt-2">
                Manage your complete sales workflow.
              </p>
            </div>

            <div className="p-5 bg-cream-50 rounded-2xl border border-cream-border">
              <h3 className="font-black text-charcoal-900">
                Quotation Management
              </h3>
              <p className="text-xs text-charcoal-500 mt-2">
                Create and manage quotations easily.
              </p>
            </div>

            <div className="p-5 bg-cream-50 rounded-2xl border border-cream-border">
              <h3 className="font-black text-charcoal-900">
                Customer Portal
              </h3>
              <p className="text-xs text-charcoal-500 mt-2">
                Give customers a secure experience.
              </p>
            </div>

          </div>

        </div>

        <p className="text-xs text-charcoal-400 mt-6">
          © DealFlow360
        </p>

      </div>
    </div>
  );
};