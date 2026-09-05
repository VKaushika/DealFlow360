import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  FileText,
  Users,
  CheckSquare,
  Truck,
  Package,
  Receipt,
  Repeat,
  Activity,
  PackagePlus,
  Sliders,
  History,
  BarChart3,
  ExternalLink,
  ShieldAlert,
  ShieldCheck,
  ChevronDown,
  LogOut,
} from 'lucide-react';

interface SidebarProps {
  activePage: string;
  onNavigate: (page: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activePage, onNavigate }) => {
  const { role, user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    onNavigate('login');
  };

  const isCustomer = role === 'CUSTOMER';

  if (isCustomer) {
    return (
      <aside className="w-64 bg-cream-100 border-r border-cream-border flex flex-col justify-between p-4 shrink-0 min-h-[calc(100vh-4rem)]">
        <div className="space-y-4">
          {/* Workspace Member Header Pill */}
          <div
            onClick={() => onNavigate('login')}
            className="flex items-center justify-between p-3 bg-white border border-cream-border rounded-2xl shadow-subtle cursor-pointer hover:border-brand-400 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-brand-500 text-charcoal-950 flex items-center justify-center text-xs font-black font-mono">
                D
              </div>
              <div>
                <p className="text-xs font-bold text-charcoal-900">David Miller</p>
                <p className="text-[10px] text-charcoal-500 font-mono font-medium">Buyer Portal</p>
              </div>
            </div>
          </div>

          <div className="px-3.5 py-3 bg-amber-50 border border-amber-200 rounded-2xl">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-xs mb-1">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              Customer Workspace
            </div>
            <p className="text-[11px] text-amber-800 font-medium leading-relaxed">
              Isolated buyer portal. Internal costs, margins, and risk scores are redacted.
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-charcoal-400 px-3 mb-2">
              Buyer Portal
            </p>

            <button
              onClick={() => onNavigate('portal')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all text-left ${
                activePage === 'portal'
                  ? 'bg-brand-500 text-charcoal-950 shadow-subtle font-black'
                  : 'text-charcoal-600 hover:text-charcoal-900 hover:bg-cream-100'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Quotations & Review</span>
            </button>

            <button
              onClick={() => onNavigate('invoices')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all text-left ${
                activePage === 'invoices'
                  ? 'bg-brand-500 text-charcoal-950 shadow-subtle font-black'
                  : 'text-charcoal-600 hover:text-charcoal-900 hover:bg-cream-100'
              }`}
            >
              <Receipt className="w-4 h-4" />
              <span>Invoices & Billing</span>
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <div className="p-3.5 bg-white rounded-2xl border border-cream-border text-xs shadow-subtle">
            <p className="font-bold text-charcoal-900">ABC Corporation</p>
            <p className="text-[11px] text-brand-700 font-bold mt-0.5">Tier: GOLD (15% Max)</p>
            <p className="text-[10px] text-charcoal-500 mt-1">Buyer: David Miller</p>
          </div>

          <button
            onClick={() => onNavigate('login')}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-cream-50 hover:bg-white border border-cream-border rounded-xl text-xs font-bold text-charcoal-700 transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-brand-600" />
            <span>Switch Persona</span>
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl text-xs font-bold text-rose-700 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    );
  }

  // ── RBAC: define which roles can see each nav item ──
  type NavItem = { id: string; label: string; icon: any; badge?: string; allowedRoles: string[] };
  type NavSection = { title: string; items: NavItem[] };

  const ALL_INTERNAL = ['ADMIN', 'SALES_REP', 'SALES_MANAGER', 'FINANCE_OPS'];
  const MANAGERS_ONLY = ['ADMIN', 'SALES_MANAGER', 'FINANCE_OPS'];

  const navSections: NavSection[] = [
    {
      title: 'WORKSPACE',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, allowedRoles: ALL_INTERNAL },
        { id: 'quotations', label: 'Quotations', icon: FileText, allowedRoles: ['ADMIN', 'SALES_REP', 'SALES_MANAGER'] },
        { id: 'quotation-builder', label: 'Quote Builder', icon: PackagePlus, allowedRoles: ['ADMIN', 'SALES_REP', 'SALES_MANAGER'] },
        { id: 'approvals', label: 'Approvals', icon: CheckSquare, badge: '4', allowedRoles: ['ADMIN', 'SALES_MANAGER', 'FINANCE_OPS'] },
        { id: 'fulfillment', label: 'Orders & fulfillment', icon: Truck, allowedRoles: ALL_INTERNAL },
        { id: 'customers', label: 'Customers', icon: Users, allowedRoles: ['ADMIN', 'SALES_REP', 'SALES_MANAGER'] },
        { id: 'products', label: 'Product catalog', icon: PackagePlus, allowedRoles: ALL_INTERNAL },
      ],
    },
    {
      title: 'BILLING & REVENUE',
      items: [
        { id: 'billing', label: 'Invoices & payments', icon: Receipt, allowedRoles: ['ADMIN', 'FINANCE_OPS', 'SALES_MANAGER'] },
        { id: 'subscriptions', label: 'Recurring contracts', icon: Repeat, allowedRoles: ['ADMIN', 'FINANCE_OPS', 'SALES_MANAGER'] },
        { id: 'backorders', label: 'Backorders queue', icon: Package, allowedRoles: ['ADMIN', 'FINANCE_OPS'] },
      ],
    },
    {
      title: 'CONTROLS',
      items: [
        { id: 'deal-health', label: 'Deal health radar', icon: Activity, allowedRoles: MANAGERS_ONLY },
        { id: 'governance', label: 'Discount rules', icon: Sliders, allowedRoles: ['ADMIN', 'SALES_MANAGER'] },
        { id: 'audit', label: 'Activity log', icon: History, allowedRoles: ['ADMIN', 'SALES_MANAGER', 'FINANCE_OPS'] },
        { id: 'reports', label: 'Reports & analytics', icon: BarChart3, allowedRoles: MANAGERS_ONLY },
        { id: 'login', label: 'Security & RBAC Access', icon: ShieldCheck, allowedRoles: ALL_INTERNAL },
      ],
    },
  ];

  // Filter nav items to only show what the current role is allowed to see
  const filteredSections = navSections
    .map(section => ({
      ...section,
      items: section.items.filter(item => item.allowedRoles.includes(role)),
    }))
    .filter(section => section.items.length > 0);

  return (
    <aside className="w-64 bg-cream-100 border-r border-cream-border flex flex-col justify-between p-4 shrink-0 min-h-[calc(100vh-4rem)] select-none">
      <div className="space-y-5 overflow-y-auto pr-0.5">
        {/* Workspace Member Header Pill */}
        <div
          onClick={() => onNavigate('login')}
          className="flex items-center justify-between p-2.5 bg-white border border-cream-border rounded-2xl shadow-subtle cursor-pointer hover:border-brand-400 transition-colors"
          title="Click to switch persona or manage session"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-brand-500 text-charcoal-950 flex items-center justify-center text-xs font-black font-mono">
              {user?.name ? user.name.slice(0, 1).toUpperCase() : 'D'}
            </div>
            <div>
              <p className="text-xs font-bold text-charcoal-900 leading-tight">
                {user?.name ? user.name.split(' ')[0] : 'Member'}
              </p>
              <p className="text-[10px] text-charcoal-400 font-mono font-bold leading-tight">{role}</p>
            </div>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-charcoal-400" />
        </div>

        {filteredSections.map((sec) => (
          <div key={sec.title}>
            <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-charcoal-400 px-3 mb-1.5">
              {sec.title}
            </p>
            <div className="space-y-1">
              {sec.items.map((item) => {
                const Icon = item.icon;
                const isActive = activePage === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all text-left ${
                      isActive
                        ? 'bg-brand-500 text-charcoal-950 shadow-subtle font-black'
                        : 'text-charcoal-600 hover:text-charcoal-900 hover:bg-cream-100'
                    }`}
                  >
                    <div className="flex items-center gap-3 truncate">
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-charcoal-950' : 'text-charcoal-500'}`} />
                      <span className="truncate">{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                        isActive
                          ? 'bg-charcoal-950 text-white font-mono'
                          : 'bg-brand-500 text-charcoal-950 font-mono shadow-subtle'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="pt-3 border-t border-cream-border space-y-2">
        <button
          onClick={() => onNavigate('portal')}
          className="w-full flex items-center justify-between px-3.5 py-2.5 bg-white hover:bg-cream-50 border border-cream-border rounded-2xl text-xs font-bold text-charcoal-800 transition-colors shadow-subtle"
        >
          <div className="flex items-center gap-2">
            <ExternalLink className="w-4 h-4 text-brand-600" />
            <span>Customer Portal</span>
          </div>
          <span className="text-[10px] font-bold text-brand-800 bg-brand-50 px-2 py-0.5 rounded-full border border-brand-200">
            Buyer View
          </span>
        </button>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3.5 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-2xl text-xs font-bold text-rose-700 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Logout / End Session</span>
        </button>
      </div>
    </aside>
  );
};
