import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth, RoleType } from './context/AuthContext';

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

import { LandingPage } from './pages/LandingPage';
import Chatbot from './components/Chatbot';

const parseHash = (): { page: string; id?: string } => {
  const hash = window.location.hash.replace(/^#\/?/, '');

  if (!hash) {
    return { page: 'landing' };
  }

  const [pathPart, queryPart] = hash.split('?');

  const page = pathPart || 'landing';

  let id: string | undefined;

  if (queryPart) {
    const params = new URLSearchParams(queryPart);
    id = params.get('id') || undefined;
  }

  return { page, id };
};

const INTERNAL_ROLES: RoleType[] = [
  'ADMIN',
  'SALES_REP',
  'SALES_MANAGER',
  'FINANCE_OPS',
];

const MainLayout: React.FC = () => {
  const {
    user,
    role,
    switchPersona,
    logout,
  } = useAuth();

  const initialRoute = parseHash();

  const [activePage, setActivePage] = useState<string>(
    initialRoute.page
  );

  const [selectedEntityId, setSelectedEntityId] =
    useState<string | undefined>(initialRoute.id);

  /*
   * Remember where the internal user came from before
   * entering Customer Portal.
   */
  const [returnRole, setReturnRole] = useState<RoleType>(
    () => {
      const saved = sessionStorage.getItem(
        'dealflow_return_role'
      ) as RoleType | null;

      return saved && INTERNAL_ROLES.includes(saved)
        ? saved
        : 'SALES_MANAGER';
    }
  );

  const [returnPage, setReturnPage] = useState<string>(
    () =>
      sessionStorage.getItem(
        'dealflow_return_page'
      ) || 'dashboard'
  );

  /*
   * Normal application navigation.
   */
  const handleNavigate = (
    page: string,
    id?: string
  ) => {
    setSelectedEntityId(id);
    setActivePage(page);

    const newHash = id
      ? `#/${page}?id=${id}`
      : `#/${page}`;

    if (window.location.hash !== newHash) {
      window.location.hash = newHash;
    }

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  /*
   * Called when entering Customer Portal.
   * Save the internal user's current workspace.
   */
  const handleEnterCustomerPortal = async () => {
    if (INTERNAL_ROLES.includes(role)) {
      sessionStorage.setItem(
        'dealflow_return_role',
        role
      );

      sessionStorage.setItem(
        'dealflow_return_page',
        activePage === 'portal'
          ? 'dashboard'
          : activePage
      );

      setReturnRole(role);

      setReturnPage(
        activePage === 'portal'
          ? 'dashboard'
          : activePage
      );
    }

    await switchPersona('CUSTOMER');

    handleNavigate('portal');
  };

  /*
   * Customer Portal Back button returns to authentication.
   * A customer must explicitly sign in again before entering an internal workspace.
   */
  const handleCustomerBack = () => {
    sessionStorage.removeItem('dealflow_return_role');
    sessionStorage.removeItem('dealflow_return_page');
    logout();
    handleNavigate('login');
  };

  /*
   * Browser Back / Forward and direct hash changes.
   */
  useEffect(() => {
    const handleHashChange = () => {
      const { page, id } = parseHash();

      setActivePage(page);
      setSelectedEntityId(id);
    };

    window.addEventListener(
      'hashchange',
      handleHashChange
    );

    return () => {
      window.removeEventListener(
        'hashchange',
        handleHashChange
      );
    };
  }, []);

  /*
   * If a customer somehow reaches an internal route,
   * keep them inside Customer Portal.
   */
  useEffect(() => {
    if (!user) return;

    if (
      role === 'CUSTOMER' &&
      activePage !== 'portal' &&
      activePage !== 'invoices' &&
      activePage !== 'login' &&
      activePage !== 'landing'
    ) {
      setActivePage('portal');
      setSelectedEntityId(undefined);

      if (window.location.hash !== '#/portal') {
        window.location.hash = '#/portal';
      }
    }
  }, [role, activePage, user]);

  useEffect(() => {
    if (
      !user &&
      activePage !== 'landing' &&
      activePage !== 'login'
    ) {
      setActivePage('landing');
      setSelectedEntityId(undefined);

      if (window.location.hash !== '') {
        window.location.hash = '';
      }
    }
  }, [activePage, user]);

  /*
   * Render pages.
   */
  const renderActivePage = () => {
    /*
     * Public landing page.
     */
    if (!user && activePage === 'landing') {
      return (
        <LandingPage
          onNavigate={handleNavigate}
        />
      );
    }

    if (!user && activePage !== 'login') {
      return (
        <LandingPage
          onNavigate={handleNavigate}
        />
      );
    }

    /*
     * Login.
     */
    if (activePage === 'login') {
      return (
        <LoginPage
          onNavigate={handleNavigate}
        />
      );
    }

    /*
     * Customer Portal.
     */
    if (role === 'CUSTOMER') {
      if (
        activePage === 'portal' ||
        activePage === 'landing'
      ) {
        return (
          <CustomerPortalPage
            onNavigate={handleNavigate}
            onBack={handleCustomerBack}
          />
        );
      }

      if (activePage === 'invoices') {
        return (
          <BillingPage
            onNavigate={handleNavigate}
          />
        );
      }

      return (
        <CustomerPortalPage
          onNavigate={handleNavigate}
          onBack={handleCustomerBack}
        />
      );
    }

    /*
     * Internal users.
     */
    switch (activePage) {
      case 'dashboard':
        return (
          <DashboardPage
            onNavigate={handleNavigate}
          />
        );

      case 'quotations':
        return (
          <QuotationsListPage
            onNavigate={handleNavigate}
          />
        );

      case 'quotation-builder':
        return (
          <QuotationBuilderPage
            quotationId={selectedEntityId}
            onNavigate={handleNavigate}
          />
        );

      case 'approvals':
        return (
          <ApprovalsPage
            approvalId={selectedEntityId}
            onNavigate={handleNavigate}
          />
        );

      case 'fulfillment':
        return (
          <FulfillmentPage
            onNavigate={handleNavigate}
          />
        );

      case 'backorders':
        return (
          <BackordersPage
            onNavigate={handleNavigate}
          />
        );

      case 'billing':
      case 'invoices':
        return (
          <BillingPage
            onNavigate={handleNavigate}
          />
        );

      case 'subscriptions':
        return (
          <SubscriptionsPage
            onNavigate={handleNavigate}
          />
        );

      case 'portal':
        return (
          <CustomerPortalPage
            onNavigate={handleNavigate}
            onBack={handleCustomerBack}
          />
        );

      case 'deal-health':
        return (
          <DealHealthPage
            onNavigate={handleNavigate}
          />
        );

      case 'customers':
        return (
          <CustomersPage
            onNavigate={handleNavigate}
          />
        );

      case 'products':
        return (
          <ProductsPage
            onNavigate={handleNavigate}
          />
        );

      case 'governance':
        return (
          <GovernancePage
            onNavigate={handleNavigate}
          />
        );

      case 'audit':
        return (
          <AuditLogsPage
            onNavigate={handleNavigate}
          />
        );

      case 'reports':
        return (
          <ReportsPage
            onNavigate={handleNavigate}
          />
        );

      default:
        return (
          <DashboardPage
            onNavigate={handleNavigate}
          />
        );
    }
  };

  const isCustomer = role === 'CUSTOMER';

  const isPublic =
    !user &&
    (activePage === 'landing' ||
      activePage === 'login');

  return (
    <div className="min-h-screen bg-cream-100 flex flex-col font-sans text-charcoal-900">

      {/* Internal-only top banner */}
      {!isCustomer && !isPublic && (
        <JudgeDemoBanner
          onNavigate={handleNavigate}
        />
      )}

      {/* Internal Navbar only */}
      {!isCustomer && !isPublic && (
        <Navbar
          onNavigate={handleNavigate}
          activePage={activePage}
          onCustomerPortal={handleEnterCustomerPortal}
        />
      )}

      <div className="flex-1 flex max-w-[1600px] w-full mx-auto">

        {/* Internal Sidebar only */}
        {!isCustomer &&
          !isPublic &&
          activePage !== 'login' && (
            <Sidebar
              activePage={activePage}
              onNavigate={handleNavigate}
            />
          )}

        <main
          className={`flex-1 p-6 sm:p-8 lg:p-10 overflow-x-hidden min-h-[calc(100vh-4rem)] bg-grid-canvas ${
            isPublic
              ? 'max-w-6xl mx-auto w-full'
              : ''
          }`}
        >
          {renderActivePage()}
        </main>

      </div>

      {user && <Chatbot />}
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