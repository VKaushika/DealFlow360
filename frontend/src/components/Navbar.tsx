import React, { useState, useEffect, useRef } from 'react';
import { useAuth, RoleType } from '../context/AuthContext';
import { api } from '../api/apiClient';
import {
  Layers,
  Bell,
  ChevronDown,
  User,
  ShieldCheck,
  Building,
  Sparkles,
  Lock,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ExternalLink,
  X,
  LogOut,
} from 'lucide-react';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'approval' | 'health' | 'order' | 'info';
  timestamp: string;
  targetPage: string;
  targetId?: string;
  isRead?: boolean;
}

interface NavbarProps {
  onNavigate: (page: string, id?: string) => void;
  activePage: string;

  // Used when entering Customer Portal so App.tsx
  // can remember the previous internal workspace.
  onCustomerPortal?: () => Promise<void>;
}

export const Navbar: React.FC<NavbarProps> = ({
  onNavigate,
  activePage,
  onCustomerPortal,
}) => {
  const {
    user,
    role,
    switchPersona,
    logout,
  } = useAuth();

  const [showNotifications, setShowNotifications] =
    useState<boolean>(false);

  const [notifications, setNotifications] =
    useState<NotificationItem[]>([]);

  const [isSwitchingPersona, setIsSwitchingPersona] =
    useState<boolean>(false);

  const notifRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    logout();
    onNavigate('login');
  };

  const personas: Array<{
    role: RoleType;
    label: string;
    userName: string;
    badge: string;
  }> = [
    {
      role: 'SALES_REP',
      label: 'Sales Rep',
      userName: 'Sarah Miller',
      badge: 'Sales',
    },
    {
      role: 'SALES_MANAGER',
      label: 'Sales Manager',
      userName: 'Marcus Sterling',
      badge: 'Manager',
    },
    {
      role: 'FINANCE_OPS',
      label: 'Finance & Ops',
      userName: 'Fiona Vance',
      badge: 'Finance',
    },
    {
      role: 'CUSTOMER',
      label: 'Customer Portal',
      userName: 'David Miller',
      badge: 'Buyer',
    },
    {
      role: 'ADMIN',
      label: 'Administrator',
      userName: 'Alexander Cross',
      badge: 'Admin',
    },
  ];

  const currentPersona =
    personas.find((p) => p.role === role) || personas[0];

  const pageTitleMap: Record<string, string> = {
    dashboard: 'Dashboard',
    quotations: 'Quotations & Deals',
    'quotation-builder': 'Quote Builder',
    customers: 'Customers & Tiers',
    approvals: 'Approvals Queue',
    fulfillment: 'Orders & Fulfillment',
    backorders: 'Backorders',
    billing: 'Invoices & Billing',
    invoices: 'Invoices',
    subscriptions: 'Recurring Contracts',
    'deal-health': 'Deal Health Radar',
    products: 'Product Catalog',
    governance: 'Discount Rules',
    audit: 'Activity Log',
    reports: 'Reports & Analytics',
    portal: 'Customer Portal',
    login: 'Security & Access (RBAC)',
  };

  /*
   * ============================================================
   * PERSONA SWITCH
   * ============================================================
   *
   * Important:
   * We WAIT for switchPersona() to finish before navigating.
   *
   * Customer:
   *   App.tsx handles remembering the previous internal page.
   *
   * Internal role:
   *   Switch persona first, then open Dashboard.
   */
  const handlePersonaChange = async (
    newRole: RoleType
  ) => {
    if (isSwitchingPersona || newRole === role) {
      return;
    }

    setIsSwitchingPersona(true);

    try {
      /*
       * CUSTOMER PORTAL
       *
       * Let App.tsx handle:
       * 1. Saving previous role
       * 2. Saving previous page
       * 3. Switching to CUSTOMER
       * 4. Navigating to portal
       */
      if (newRole === 'CUSTOMER') {
        if (onCustomerPortal) {
          await onCustomerPortal();
        } else {
          await switchPersona('CUSTOMER');
          onNavigate('portal');
        }

        return;
      }

      /*
       * INTERNAL USER
       */
      await switchPersona(newRole);

      /*
       * Always open the internal dashboard after
       * changing internal persona.
       */
      onNavigate('dashboard');
    } catch (error) {
      console.error(
        'Failed to switch persona:',
        error
      );
    } finally {
      setIsSwitchingPersona(false);
    }
  };

  /*
   * ============================================================
   * NOTIFICATIONS
   * ============================================================
   *
   * Do not call internal approval APIs for CUSTOMER.
   *
   * This prevents:
   *   GET /api/approvals → 403
   *
   * Customer Portal has its own isolated UI.
   */
  useEffect(() => {
    if (role === 'CUSTOMER') {
      setNotifications([]);
      return;
    }

    const fetchNotifs = async () => {
      try {
        const [
          appRes,
          healthRes,
        ] = await Promise.all([
          api.getApprovals(),
          api.getDealHealth(),
        ]);

        const items: NotificationItem[] = [];

        if (
          appRes.data.success &&
          appRes.data.data
        ) {
          const pending =
            appRes.data.data
              .filter(
                (a: any) =>
                  a.status === 'PENDING'
              )
              .slice(0, 3);

          pending.forEach((a: any) => {
            items.push({
              id: a._id,
              title: `Pending Approval: ${
                a.quotationId?.quoteNumber ||
                'QT-Deal'
              }`,
              message: `${
                a.customerId?.companyName ||
                'Account'
              } has ${
                a.riskLevel
              } risk discount ceiling breach.`,
              type: 'approval',
              timestamp: 'Just now',
              targetPage: 'approvals',
              targetId: a._id,
            });
          });
        }

        if (
          healthRes.data.success &&
          healthRes.data.data
        ) {
          const anomalies =
            healthRes.data.data.slice(0, 2);

          anomalies.forEach((h: any) => {
            items.push({
              id: h._id,
              title: `Radar Alert: ${h.title}`,
              message: h.description,
              type: 'health',
              timestamp: '15m ago',
              targetPage: 'deal-health',
            });
          });
        }

        if (items.length === 0) {
          items.push({
            id: 'welcome',
            title: 'Workspace Active',
            message:
              'Deterministic pricing rules and warehouse routing engine active.',
            type: 'info',
            timestamp: 'Now',
            targetPage: 'dashboard',
          });
        }

        setNotifications(items);
      } catch (err) {
        console.error(
          'Error fetching notifications:',
          err
        );
      }
    };

    fetchNotifs();
  }, [role, activePage]);

  /*
   * Click outside notification popup.
   */
  useEffect(() => {
    const handleClickOutside = (
      event: MouseEvent
    ) => {
      if (
        notifRef.current &&
        !notifRef.current.contains(
          event.target as Node
        )
      ) {
        setShowNotifications(false);
      }
    };

    document.addEventListener(
      'mousedown',
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        'mousedown',
        handleClickOutside
      );
    };
  }, []);

  return (
    <header className="bg-cream-100 border-b border-cream-border text-charcoal-900 px-5 sm:px-8 py-3 sticky top-0 z-40">
      <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-4">

        {/* =====================================================
            LEFT SIDE
        ====================================================== */}
        <div className="flex items-center gap-4 sm:gap-6">

          {/* Brand */}
          <div
            className="flex items-center gap-2.5 cursor-pointer group"
            onClick={() =>
              onNavigate(
                role === 'CUSTOMER'
                  ? 'portal'
                  : 'dashboard'
              )
            }
          >
            <div className="w-8 h-8 rounded-xl bg-brand-500 flex items-center justify-center text-charcoal-950 font-black text-xs shadow-subtle group-hover:bg-brand-400 transition-colors">
              DF
            </div>

            <span className="font-black text-base tracking-tight text-charcoal-900">
              DealFlow360
            </span>
          </div>

          {/* Universal Back Arrow */}
          {activePage !== 'dashboard' &&
            activePage !== 'portal' && (
              <button
                type="button"
                onClick={() =>
                  onNavigate('dashboard')
                }
                className="inline-flex items-center gap-1.5 text-xs font-bold text-charcoal-700 hover:text-charcoal-950 px-2.5 py-1 rounded-xl bg-white border border-cream-border shadow-subtle hover:bg-cream-50 transition-all"
                title="Return to Dashboard"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-brand-600" />
                <span className="hidden md:inline">
                  Back
                </span>
              </button>
            )}

          {/* Breadcrumb */}
          <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-charcoal-400 uppercase tracking-wider pl-3 border-l border-cream-border">
            <span>Workspace</span>
            <span>/</span>

            <span className="text-charcoal-800 font-bold">
              {pageTitleMap[activePage] ||
                'Dashboard'}
            </span>
          </div>
        </div>

        {/* =====================================================
            RIGHT SIDE
        ====================================================== */}
        <div className="flex items-center gap-3">

          {/* ===================================================
              DESKTOP ROLE SWITCHER
          ==================================================== */}
          <div className="hidden lg:flex items-center gap-1 bg-white border border-cream-border p-1 rounded-xl shadow-subtle">

            {personas.map((p) => {
              const isActive =
                role === p.role;

              return (
                <button
                  key={p.role}
                  type="button"
                  disabled={isSwitchingPersona}
                  onClick={() =>
                    handlePersonaChange(
                      p.role
                    )
                  }
                  className={`text-xs px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-brand-500 text-charcoal-950 shadow-subtle font-black'
                      : 'text-charcoal-500 hover:text-charcoal-900 hover:bg-cream-100'
                  } ${
                    isSwitchingPersona
                      ? 'opacity-60 cursor-wait'
                      : 'cursor-pointer'
                  }`}
                  title={`Switch persona to ${p.userName}`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isActive
                        ? 'bg-charcoal-950'
                        : 'bg-charcoal-400'
                    }`}
                  />

                  <span>
                    {p.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* ===================================================
              MOBILE ROLE SWITCHER
          ==================================================== */}
          <div className="lg:hidden">
            <select
              value={role}
              disabled={isSwitchingPersona}
              onChange={(e) => {
                const newRole =
                  e.target.value as RoleType;

                handlePersonaChange(
                  newRole
                );
              }}
              className="bg-white border border-cream-border text-xs text-charcoal-800 font-bold rounded-xl px-2.5 py-1.5 focus:outline-none disabled:opacity-60"
            >
              {personas.map((p) => (
                <option
                  key={p.role}
                  value={p.role}
                >
                  {p.label} ({p.userName})
                </option>
              ))}
            </select>
          </div>

          {/* ===================================================
              LOGIN
          ==================================================== */}
          <button
            type="button"
            onClick={() =>
              onNavigate('login')
            }
            className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border shadow-subtle transition-all ${
              activePage === 'login'
                ? 'bg-charcoal-900 text-white border-charcoal-900'
                : 'bg-white text-charcoal-700 border-cream-border hover:bg-cream-50'
            }`}
            title="Access Security & RBAC Login Portal"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-brand-500" />

            <span className="hidden sm:inline">
              RBAC Login
            </span>
          </button>

          {/* ===================================================
              NOTIFICATIONS
          ==================================================== */}
          <div
            className="relative"
            ref={notifRef}
          >
            <button
              type="button"
              onClick={() =>
                setShowNotifications(
                  !showNotifications
                )
              }
              className="w-8 h-8 rounded-xl bg-white border border-cream-border flex items-center justify-center text-charcoal-600 hover:text-charcoal-950 hover:bg-cream-50 shadow-subtle transition-colors relative"
              title="View live notifications"
            >
              <Bell className="w-4 h-4" />

              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-brand-500 text-charcoal-950 text-[10px] font-black flex items-center justify-center font-mono shadow-sm">
                  {notifications.length}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-cream-border rounded-2xl shadow-2xl z-50 p-4 space-y-3 animate-fade-in">

                <div className="flex items-center justify-between pb-2 border-b border-cream-border">

                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-brand-500" />

                    <h4 className="font-bold text-xs text-charcoal-900">
                      Active Notifications
                    </h4>

                    <span className="text-[10px] font-mono font-bold bg-brand-100 text-brand-900 px-2 py-0.2 rounded-full">
                      {notifications.length} New
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setShowNotifications(false)
                    }
                    className="text-charcoal-400 hover:text-charcoal-800 p-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">

                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => {
                        setShowNotifications(false);
                        onNavigate(
                          n.targetPage,
                          n.targetId
                        );
                      }}
                      className="p-3 bg-cream-50/60 hover:bg-brand-50/60 border border-cream-border hover:border-brand-300 rounded-xl cursor-pointer transition-all space-y-1 text-xs"
                    >
                      <div className="flex items-center justify-between">

                        <span className="font-bold text-charcoal-900 text-xs flex items-center gap-1.5">

                          {n.type === 'approval' ? (
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                          ) : (
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          )}

                          <span>
                            {n.title}
                          </span>
                        </span>

                        <span className="text-[10px] font-mono text-charcoal-400">
                          {n.timestamp}
                        </span>
                      </div>

                      <p className="text-[11px] text-charcoal-600 font-medium leading-snug">
                        {n.message}
                      </p>
                    </div>
                  ))}

                </div>

                <div className="pt-2 border-t border-cream-border flex justify-between items-center text-[11px]">

                  <button
                    type="button"
                    onClick={() => {
                      setShowNotifications(false);
                      onNavigate(
                        'approvals'
                      );
                    }}
                    className="font-bold text-brand-600 hover:text-brand-700"
                  >
                    View Approvals Queue ➔
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowNotifications(false);
                      onNavigate(
                        'deal-health'
                      );
                    }}
                    className="text-charcoal-500 hover:text-charcoal-800"
                  >
                    Deal Radar
                  </button>

                </div>
              </div>
            )}
          </div>

          {/* ===================================================
              USER PROFILE
          ==================================================== */}
          <div
            onClick={() =>
              onNavigate('login')
            }
            className="flex items-center gap-2.5 pl-2 cursor-pointer group"
            title="Click to manage session and personas"
          >
            <div className="text-right hidden sm:block">

              <p className="text-xs font-bold text-charcoal-900 leading-tight group-hover:text-brand-600 transition-colors">
                {user?.name ||
                  currentPersona.userName}
              </p>

              <p className="text-[10px] text-charcoal-400 font-medium">
                {role.replace('_', ' ')}
              </p>

            </div>

            <div className="w-8 h-8 rounded-xl bg-brand-500 text-charcoal-950 flex items-center justify-center text-xs font-black font-mono shadow-subtle group-hover:scale-105 transition-transform">
              {user?.name
                ? user.name
                    .slice(0, 1)
                    .toUpperCase()
                : 'D'}
            </div>
          </div>

          {/* ===================================================
              LOGOUT
          ==================================================== */}
          <button
            type="button"
            onClick={handleLogout}
            className="w-8 h-8 rounded-xl bg-white border border-cream-border flex items-center justify-center text-charcoal-500 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-300 shadow-subtle transition-all"
            title="Logout — End Session"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>

        </div>
      </div>
    </header>
  );
};