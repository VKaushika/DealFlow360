import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { JudgeDemoBanner } from './components/JudgeDemoBanner';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';

import { DashboardPage } from './pages/DashboardPage';
import { QuotationsListPage } from './pages/QuotationsListPage';
import { QuotationBuilderPage } from './pages/QuotationBuilderPage';
import { ApprovalsPage } from './pages/ApprovalsPage';
import { FulfillmentPage } from './pages/FulfillmentPage';
import { BackordersPage } from './pages/BackordersPage';
import { BillingPage } from './pages/BillingPage';
import { SubscriptionsPage } from './pages/SubscriptionsPage';
import { CustomerPortalPage } from './pages/CustomerPortalPage';
import { DealHealthPage } from './pages/DealHealthPage';
import { CustomersPage } from './pages/CustomersPage';
import { ProductsPage } from './pages/ProductsPage';
import { GovernancePage } from './pages/GovernancePage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { ReportsPage } from './pages/ReportsPage';
import { LoginPage } from './pages/LoginPage';

const parseHash = (): { page: string; id?: string } => {
  const hash = window.location.hash.replace(/^#\/?/, '');
  if (!hash) return { page: 'dashboard' };

  const [pathPart, queryPart] = hash.split('?');
  const page = pathPart || 'dashboard';
  let id: string | undefined = undefined;

  if (queryPart) {
    const params = new URLSearchParams(queryPart);
    id = params.get('id') || undefined;
  }

  return { page, id };
};

const MainLayout: React.FC = () => {
  const { role, user } = useAuth();
  const initialRoute = parseHash();
  const [activePage, setActivePage] = useState<string>(initialRoute.page);
  const [selectedEntityId, setSelectedEntityId] = useState<string | undefined>(initialRoute.id);

  // Sync state with URL hash
  const handleNavigate = (page: string, id?: string) => {
    setSelectedEntityId(id);
    setActivePage(page);

    const newHash = id ? `#/${page}?id=${id}` : `#/${page}`;
    if (window.location.hash !== newHash) {
      window.location.hash = newHash;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Listen for browser Back/Forward buttons and direct hash changes
  useEffect(() => {
    const handleHashChange = () => {
      const { page, id } = parseHash();
      setActivePage(page);
      setSelectedEntityId(id);
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // ── RBAC: page-level access control ──
  const ALL_INTERNAL = ['ADMIN', 'SALES_REP', 'SALES_MANAGER', 'FINANCE_OPS'];
  const PAGE_ACCESS: Record<string, string[]> = {
    'login':              [...ALL_INTERNAL, 'CUSTOMER'],
    'dashboard':          ALL_INTERNAL,
    'quotations':         ['ADMIN', 'SALES_REP', 'SALES_MANAGER'],
    'quotation-builder':  ['ADMIN', 'SALES_REP', 'SALES_MANAGER'],
    'approvals':          ['ADMIN', 'SALES_MANAGER', 'FINANCE_OPS'],
    'fulfillment':        ALL_INTERNAL,
    'backorders':         ['ADMIN', 'FINANCE_OPS'],
    'billing':            ['ADMIN', 'FINANCE_OPS', 'SALES_MANAGER'],
    'invoices':           ['ADMIN', 'FINANCE_OPS', 'SALES_MANAGER', 'CUSTOMER'],
    'subscriptions':      ['ADMIN', 'FINANCE_OPS', 'SALES_MANAGER'],
    'portal':             [...ALL_INTERNAL, 'CUSTOMER'],
    'deal-health':        ['ADMIN', 'SALES_MANAGER', 'FINANCE_OPS'],
    'customers':          ['ADMIN', 'SALES_REP', 'SALES_MANAGER'],
    'products':           ALL_INTERNAL,
    'governance':         ['ADMIN', 'SALES_MANAGER'],
    'audit':              ['ADMIN', 'SALES_MANAGER', 'FINANCE_OPS'],
    'reports':            ['ADMIN', 'SALES_MANAGER', 'FINANCE_OPS'],
  };

  const isAllowed = (page: string): boolean => {
    const allowed = PAGE_ACCESS[page];
    if (!allowed) return false;
    return allowed.includes(role);
  };

  const renderActivePage = () => {
    // Login is always accessible
    if (activePage === 'login') {
      return <LoginPage onNavigate={handleNavigate} />;
    }

    // CUSTOMER can only access portal / invoices / login — redirect everything else
    if (role === 'CUSTOMER') {
      if (activePage === 'portal' || activePage === 'invoices') {
        return activePage === 'invoices'
          ? <BillingPage onNavigate={handleNavigate} />
          : <CustomerPortalPage onNavigate={handleNavigate} />;
      }
      // Unauthorized → force to portal
      return <CustomerPortalPage onNavigate={handleNavigate} />;
    }

    // Internal roles — check permission
    if (!isAllowed(activePage)) {
      // Redirect to dashboard with an "Access Denied" message
      return (
        <div className="max-w-lg mx-auto mt-20 text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-100 border border-rose-300 flex items-center justify-center">
            <span className="text-2xl">🔒</span>
          </div>
          <h2 className="text-xl font-black text-charcoal-900">Access Denied</h2>
          <p className="text-sm text-charcoal-500">
            Your role <span className="font-mono font-bold bg-cream-200 px-2 py-0.5 rounded-lg">{role}</span> does not have permission to access <span className="font-mono font-bold bg-cream-200 px-2 py-0.5 rounded-lg">{activePage}</span>.
          </p>
          <button
            onClick={() => handleNavigate('dashboard')}
            className="mt-4 px-5 py-2.5 bg-charcoal-900 text-white text-xs font-bold rounded-xl shadow-subtle hover:bg-black transition-all"
          >
            Return to Dashboard
          </button>
        </div>
      );
    }

    switch (activePage) {
      case 'dashboard':
        return <DashboardPage onNavigate={handleNavigate} />;
      case 'quotations':
        return <QuotationsListPage onNavigate={handleNavigate} />;
      case 'quotation-builder':
        return <QuotationBuilderPage quotationId={selectedEntityId} onNavigate={handleNavigate} />;
      case 'approvals':
        return <ApprovalsPage approvalId={selectedEntityId} onNavigate={handleNavigate} />;
      case 'fulfillment':
        return <FulfillmentPage onNavigate={handleNavigate} />;
      case 'backorders':
        return <BackordersPage onNavigate={handleNavigate} />;
      case 'billing':
      case 'invoices':
        return <BillingPage onNavigate={handleNavigate} />;
      case 'subscriptions':
        return <SubscriptionsPage onNavigate={handleNavigate} />;
      case 'portal':
        return <CustomerPortalPage onNavigate={handleNavigate} />;
      case 'deal-health':
        return <DealHealthPage onNavigate={handleNavigate} />;
      case 'customers':
        return <CustomersPage onNavigate={handleNavigate} />;
      case 'products':
        return <ProductsPage onNavigate={handleNavigate} />;
      case 'governance':
        return <GovernancePage onNavigate={handleNavigate} />;
      case 'audit':
        return <AuditLogsPage onNavigate={handleNavigate} />;
      case 'reports':
        return <ReportsPage onNavigate={handleNavigate} />;
      default:
        return <DashboardPage onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="min-h-screen bg-cream-100 flex flex-col font-sans text-charcoal-900">
      {/* Top Guided Demo Banner */}
      <JudgeDemoBanner onNavigate={handleNavigate} />

      {/* Main Header & Persona Switcher */}
      <Navbar onNavigate={handleNavigate} activePage={activePage} />

      {/* App Body with Sidebar & Grid Canvas Content */}
      <div className="flex-1 flex max-w-[1600px] w-full mx-auto">
        {activePage !== 'login' && <Sidebar activePage={activePage} onNavigate={handleNavigate} />}
        <main className={`flex-1 p-6 sm:p-8 lg:p-10 overflow-x-hidden min-h-[calc(100vh-4rem)] bg-grid-canvas ${activePage === 'login' ? 'max-w-5xl mx-auto' : ''}`}>
          {renderActivePage()}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}
