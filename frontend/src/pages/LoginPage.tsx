import React, { useState } from 'react';
import { useAuth, RoleType } from '../context/AuthContext';
import { api } from '../api/apiClient';
import {
  ShieldCheck,
  User,
  Lock,
  ArrowRight,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Users,
  Briefcase,
  HelpCircle,
  X,
  ArrowLeft,
  LogOut,
} from 'lucide-react';

const DEMO_ACCOUNTS: Array<{
  role: RoleType;
  label: string;
  name: string;
  userId: string;
  email: string;
  password: string;
}> = [
  { role: 'SALES_REP', label: 'Sales Rep', name: 'Priya Singh', userId: 'sales.rep', email: 'sarah.rep@dealflow360.com', password: 'password123' },
  { role: 'SALES_MANAGER', label: 'Sales Manager', name: 'Rama Patel', userId: 'sales.manager', email: 'marcus.mgr@dealflow360.com', password: 'password123' },
  { role: 'FINANCE_OPS', label: 'Finance & Ops', name: 'Chimu Rao', userId: 'finance.ops', email: 'fiona.fin@dealflow360.com', password: 'password123' },
  { role: 'CUSTOMER', label: 'Customer Portal', name: 'Ananya Mehta', userId: 'customer.portal', email: 'david@abccorp.com', password: 'password123' },
  { role: 'ADMIN', label: 'Administrator', name: 'Jyoti Sharma', userId: 'administrator', email: 'admin@dealflow360.com', password: 'password123' },
];

export const LoginPage: React.FC<{
  onNavigate: (page: string, id?: string) => void;
}> = ({ onNavigate }) => {
  const { login, switchPersona, user, role, isLoading, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'LOGIN' | 'SIGNUP'>('LOGIN');

  // Form states
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [fullName, setFullName] = useState<string>('');
  const [companyName, setCompanyName] = useState<string>('ABC Corporation');
  const [selectedRole, setSelectedRole] = useState<RoleType>('SALES_REP');

  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [showForgotModal, setShowForgotModal] = useState<boolean>(false);
  const [forgotEmail, setForgotEmail] = useState<string>('');
  const [forgotSent, setForgotSent] = useState<boolean>(false);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!email || !password) {
      setErrorMsg('Please provide both email and password.');
      return;
    }

    try {
     if (activeTab === 'LOGIN') {
 const loggedInUser = await login(email, password);

setSuccessMsg(
  'Authenticated successfully! Redirecting...'
);

setTimeout(() => {
  if (loggedInUser.role === 'CUSTOMER') {
    onNavigate('portal');
  } else {
    onNavigate('dashboard');
  }
}, 600);
}else {
        // Sign up
        const res = await api.register({
          name: fullName || 'New Team Member',
          email,
          password,
          role: selectedRole,
          department: companyName,
        });

        if (res.data.success) {
          setSuccessMsg('Account created successfully! Authenticating...');
          await login(email, password);
          setTimeout(() => {
            if (selectedRole === 'CUSTOMER') {
              onNavigate('portal');
            } else {
              onNavigate('dashboard');
            }
          }, 600);
        }
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || 'Authentication error. Please check credentials.');
    }
  };

  const handleQuickPersona = async (pRole: RoleType, pEmail?: string) => {
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await switchPersona(pRole, pEmail);
      setSuccessMsg(`Logged in as ${pRole.replace('_', ' ')}`);
      setTimeout(() => {
        if (pRole === 'CUSTOMER') {
          onNavigate('portal');
        } else {
          onNavigate('dashboard');
        }
      }, 500);
    } catch (err) {
      setErrorMsg('Failed to switch persona.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-6">
      {/* Back button */}
      <button
        onClick={() => onNavigate('landing')}
        className="inline-flex items-center gap-2 text-xs font-bold text-charcoal-600 hover:text-charcoal-950 px-3 py-1.5 rounded-xl bg-white border border-cream-border shadow-subtle transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span> Back to Welcome</span>
      </button>

      {/* ─── Active Session Card ─── */}
      {user && (
        <div className="bg-white border border-cream-border rounded-2xl p-5 shadow-subtle flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-500 text-charcoal-950 flex items-center justify-center text-sm font-black font-mono shadow-subtle shrink-0">
              {user.name.slice(0, 1).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-black text-charcoal-900 leading-tight">{user.name}</p>
              <p className="text-[11px] text-charcoal-500 font-mono font-bold">{user.email}</p>
              <span className="inline-flex items-center gap-1 mt-0.5 text-[10px] font-bold font-mono bg-brand-100 text-brand-800 px-2 py-0.5 rounded-full border border-brand-200">
                {role}
              </span>
            </div>
          </div>
          <button
            onClick={() => { logout(); setSuccessMsg('Session ended. You have been logged out.'); }}
            className="flex items-center gap-2 px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            Logout
          </button>
        </div>
      )}
      <div className="bg-white border border-cream-border rounded-2xl p-6 sm:p-8 shadow-subtle space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-charcoal-900">
            Login / Signup
          </h1>
          <p className="text-xs sm:text-sm text-charcoal-500 mt-1">
            Entry point for internal users and customers
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('LOGIN')}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-subtle ${
              activeTab === 'LOGIN'
                ? 'bg-brand-500 text-charcoal-950 font-black ring-2 ring-brand-500/30'
                : 'bg-cream-100 text-charcoal-700 hover:bg-cream-200 border border-cream-border'
            }`}
          >
            Log In
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('SIGNUP')}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-subtle ${
              activeTab === 'SIGNUP'
                ? 'bg-brand-500 text-charcoal-950 font-black ring-2 ring-brand-500/30'
                : 'bg-cream-100 text-charcoal-700 hover:bg-cream-200 border border-cream-border'
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Notifications */}
        {successMsg && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2.5 font-bold shadow-subtle">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}
        {errorMsg && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2.5 font-bold shadow-subtle">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
          {activeTab === 'SIGNUP' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-charcoal-500 font-bold mb-1.5">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Alex Morgan"
                  className="w-full bg-cream-50 border border-cream-border text-xs text-charcoal-900 font-bold p-2.5 rounded-xl focus:border-brand-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-charcoal-500 font-bold mb-1.5">
                  Account Role *
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as RoleType)}
                  className="w-full bg-cream-50 border border-cream-border text-xs text-charcoal-900 font-bold p-2.5 rounded-xl focus:border-brand-500 focus:outline-none"
                >
                  <option value="SALES_REP">Sales Representative</option>
                  <option value="SALES_MANAGER">Sales Manager / Reviewer</option>
                  <option value="FINANCE_OPS">Finance & Operations</option>
                  <option value="CUSTOMER">Customer / Client Buyer</option>
                  <option value="ADMIN">Executive / Admin</option>
                </select>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-charcoal-500 font-bold mb-1.5">
                Email *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full bg-cream-50 border border-cream-border text-xs text-charcoal-900 font-medium p-2.5 rounded-xl placeholder:text-charcoal-400 placeholder:font-normal focus:border-brand-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-charcoal-500 font-bold mb-1.5">
                Password *
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full bg-cream-50 border border-cream-border text-xs text-charcoal-900 font-medium p-2.5 rounded-xl placeholder:text-charcoal-400 placeholder:font-normal focus:border-brand-500 focus:outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-charcoal-500 font-bold mb-1.5">
              Company / Team Selector (Multi-Team Setup)
            </label>
            <select
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full bg-cream-50 border border-cream-border text-xs text-charcoal-900 font-bold p-2.5 rounded-xl focus:border-brand-500 focus:outline-none"
            >
              <option value="DealFlow360 Enterprise HQ">DealFlow360 Enterprise HQ</option>
              <option value="ABC Corporation">ABC Corporation (Customer Tier Gold)</option>
              <option value="Beta Industries Ltd">Beta Industries Ltd (Customer Tier Silver)</option>
              <option value="Acme Technologies">Acme Technologies (Customer Tier Bronze)</option>
            </select>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="bg-brand-500 hover:bg-brand-600 text-charcoal-950 text-xs font-black px-6 py-2.5 rounded-xl shadow-subtle transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {activeTab === 'LOGIN' ? 'Log In' : 'Create Account & Log In'}
            </button>

            <button
              type="button"
              onClick={() => {
                setShowForgotModal(true);
                setForgotSent(false);
              }}
              className="px-4 py-2.5 bg-cream-100 hover:bg-cream-200 text-charcoal-700 text-xs font-bold rounded-xl border border-cream-border transition-colors"
            >
              Forgot Password?
            </button>
          </div>
        </form>

        {/* Yellow/Amber Banner from Reference Image 1 */}
        <div className="p-3.5 bg-amber-50/80 border border-amber-300 rounded-xl text-amber-900 text-xs font-bold">
          After login, internal users land on the Sales Dashboard. Customers land on their Quotation Portal.
        </div>

        {/* Informational bullet points from Reference Image 1 */}
        <div className="text-xs text-charcoal-600 space-y-1 font-medium pt-2 border-t border-cream-border">
          <p>• Company / team selector shown for multi-team setups</p>
          <p>• Basic validation on email and password fields</p>
          <p>• Sign Up link creates a new internal or customer account</p>
        </div>
      </div>

      {/* Demo access reference */}
      <div className="bg-white border border-cream-border rounded-2xl p-6 shadow-subtle space-y-3">
        <h3 className="font-bold text-sm text-charcoal-900 flex items-center justify-between pb-2 border-b border-cream-border">
          <span>Demo access accounts</span>
          <span className="text-xs font-mono text-charcoal-400">Select an account to fill the form</span>
        </h3>

        <div className="grid grid-cols-1 gap-2">
          {DEMO_ACCOUNTS.map((account) => (
            <button
              key={account.email}
              type="button"
              onClick={() => {
                setEmail(account.email);
                setPassword(account.password);
                setSelectedRole(account.role);
                setActiveTab('LOGIN');
              }}
              className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_1.6fr_0.8fr] items-center gap-2 sm:gap-3 p-3 bg-cream-50/70 hover:bg-brand-50 border border-cream-border hover:border-brand-400 rounded-xl text-left transition-all"
            >
              <span>
                <span className="font-bold text-xs text-charcoal-900 block">{account.label}</span>
                <span className="text-[10px] text-charcoal-500 block">{account.name}</span>
              </span>
              <span className="text-[10px] font-mono text-charcoal-500">{account.userId}</span>
              <span className="text-[10px] font-mono text-charcoal-500 break-all">{account.email}</span>
              <span className="text-[10px] font-mono text-charcoal-500">{account.password}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-charcoal-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-cream-border rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-cream-border">
              <h3 className="font-bold text-sm text-charcoal-900">Reset Password</h3>
              <button
                onClick={() => setShowForgotModal(false)}
                className="text-charcoal-400 hover:text-charcoal-800 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {forgotSent ? (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold">
                Password reset instructions dispatched to your registered email!
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setForgotSent(true);
                }}
                className="space-y-3 text-xs"
              >
                <p className="text-charcoal-600 font-medium">
                  Enter your enterprise work email to receive a password reset recovery link.
                </p>
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full bg-cream-50 border border-cream-border text-xs text-charcoal-900 font-bold p-2.5 rounded-xl focus:border-brand-500 focus:outline-none"
                  required
                />
                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="px-3.5 py-2 bg-cream-100 hover:bg-cream-200 text-charcoal-800 font-bold rounded-xl"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-charcoal-900 hover:bg-black text-white font-bold rounded-xl shadow-subtle"
                  >
                    Send Recovery Link
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
