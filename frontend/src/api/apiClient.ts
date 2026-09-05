import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for Bearer token and active persona role
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('dealflow_token');
  const demoRole = localStorage.getItem('dealflow_role');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (demoRole) {
    config.headers['x-demo-role'] = demoRole;
  }
  return config;
});

// API Service Functions
export const api = {
  // Auth
  login: (data: any) => apiClient.post('/auth/login', data),
  register: (data: any) => apiClient.post('/auth/register', data),
  getMe: () => apiClient.get('/auth/me'),
  getDemoToken: (role?: string, email?: string) => apiClient.get('/auth/demo-token', { params: { role, email } }),

  // Customers
  getCustomers: (params?: any) => apiClient.get('/customers', { params }),
  getCustomerById: (id: string) => apiClient.get(`/customers/${id}`),
  createCustomer: (data: any) => apiClient.post('/customers', data),
  updateCustomer: (id: string, data: any) => apiClient.put(`/customers/${id}`, data),

  // Products
  getProducts: (params?: any) => apiClient.get('/products', { params }),
  getCategories: () => apiClient.get('/products/categories'),
  getProductById: (id: string) => apiClient.get(`/products/${id}`),
  createProduct: (data: any) => apiClient.post('/products', data),

  // Warehouses & Stock
  getWarehouses: () => apiClient.get('/warehouses'),
  getWarehouseStock: (id: string) => apiClient.get(`/warehouses/${id}/stock`),
  getStockSummary: () => apiClient.get('/warehouses/stock/summary'),
  updateStock: (data: any) => apiClient.post('/warehouses/stock', data),

  // Quotations
  getQuotations: (params?: any) => apiClient.get('/quotations', { params }),
  getQuotationById: (id: string) => apiClient.get(`/quotations/${id}`),
  createQuotation: (data: any) => apiClient.post('/quotations', data),
  updateQuotation: (id: string, data: any) => apiClient.put(`/quotations/${id}`, data),
  evaluateDiscount: (data: any) => apiClient.post('/quotations/evaluate-discount', data),
  submitQuotation: (id: string) => apiClient.post(`/quotations/${id}/submit`),
  confirmQuotation: (id: string) => apiClient.post(`/quotations/${id}/confirm`),
  getRecommendations: (productIds: string[]) => apiClient.post('/quotations/recommendations', { productIds }),

  // Approvals
  getApprovals: (params?: any) => apiClient.get('/approvals', { params }),
  getApprovalById: (id: string) => apiClient.get(`/approvals/${id}`),
  approveDeal: (id: string, notes?: string) => apiClient.post(`/approvals/${id}/approve`, { notes }),
  rejectDeal: (id: string, notes?: string) => apiClient.post(`/approvals/${id}/reject`, { notes }),
  requestRevision: (id: string, notes?: string) => apiClient.post(`/approvals/${id}/revision`, { notes }),

  // Fulfillment & Backorders
  getFulfillments: () => apiClient.get('/fulfillments'),
  getFulfillmentPlan: (quotationId: string) => apiClient.get(`/fulfillments/plan/${quotationId}`),
  allocateFulfillment: (data: any) => apiClient.post('/fulfillments/allocate', data),
  getBackorders: (params?: any) => apiClient.get('/fulfillments/backorders', { params }),
  resolveBackorder: (id: string) => apiClient.post(`/fulfillments/backorders/${id}/resolve`),

  // Billing & Subscriptions
  generateBilling: (quotationId: string) => apiClient.post('/billing/generate', { quotationId }),
  getInvoices: (params?: any) => apiClient.get('/billing/invoices', { params }),
  getInvoiceById: (id: string) => apiClient.get(`/billing/invoices/${id}`),
  recordPayment: (id: string, data: any) => apiClient.post(`/billing/invoices/${id}/payment`, data),
  getSubscriptions: (params?: any) => apiClient.get('/billing/subscriptions', { params }),
  modifySubscription: (id: string, data: any) => apiClient.post(`/billing/subscriptions/${id}/modify`, data),
  getSubscriptionPlans: () => apiClient.get('/billing/plans'),

  // Customer Portal (Restricted)
  getPortalQuotation: (id: string) => apiClient.get(`/portal/quotations/${id}`),
  submitCounterDiscount: (id: string, data: any) => apiClient.post(`/portal/quotations/${id}/counter-discount`, data),
  confirmByCustomer: (id: string) => apiClient.post(`/portal/quotations/${id}/confirm`),

  // Deal Health & Anomaly Radar
  getDealHealth: () => apiClient.get('/deal-health'),
  resolveHealthEvent: (id: string) => apiClient.post(`/deal-health/resolve/${id}`),
  triggerNudge: (data: any) => apiClient.post('/deal-health/nudge', data),

  // Reports
  getDashboardReports: () => apiClient.get('/reports/dashboard'),
  getSalesReport: () => apiClient.get('/reports/sales'),
  getApprovalsReport: () => apiClient.get('/reports/approvals'),
  getFulfillmentReport: () => apiClient.get('/reports/fulfillment'),
  getBillingReport: () => apiClient.get('/reports/billing'),

  // Governance & Admin
  getDiscountTiers: () => apiClient.get('/governance/tiers'),
  updateDiscountTier: (id: string, data: any) => apiClient.put(`/governance/tiers/${id}`, data),
  getDiscountRules: () => apiClient.get('/governance/discount-rules'),
  createDiscountRule: (data: any) => apiClient.post('/governance/discount-rules', data),
  getApprovalRules: () => apiClient.get('/governance/approval-rules'),
  updateApprovalRule: (id: string, data: any) => apiClient.put(`/governance/approval-rules/${id}`, data),

  // Audit Logs
  getAuditLogs: (params?: any) => apiClient.get('/audit-logs', { params }),
};
