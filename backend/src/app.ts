import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDatabase } from './config/database';

import authRoutes from './routes/authRoutes';
import customerRoutes from './routes/customerRoutes';
import productRoutes from './routes/productRoutes';
import warehouseRoutes from './routes/warehouseRoutes';
import quotationRoutes from './routes/quotationRoutes';
import approvalRoutes from './routes/approvalRoutes';
import fulfillmentRoutes from './routes/fulfillmentRoutes';
import billingRoutes from './routes/billingRoutes';
import portalRoutes from './routes/portalRoutes';
import dealHealthRoutes from './routes/dealHealthRoutes';
import reportsRoutes from './routes/reportsRoutes';
import governanceRoutes from './routes/governanceRoutes';
import auditRoutes from './routes/auditRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(
  cors({
    origin: '*',
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/api/health-check', (req: Request, res: Response) => {
  res.json({ status: 'healthy', platform: 'DealFlow360 API', timestamp: new Date() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/products', productRoutes);
app.use('/api/warehouses', warehouseRoutes);
app.use('/api/quotations', quotationRoutes);
app.use('/api/approvals', approvalRoutes);
app.use('/api/fulfillments', fulfillmentRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/portal', portalRoutes);
app.use('/api/deal-health', dealHealthRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/governance', governanceRoutes);
app.use('/api/audit-logs', auditRoutes);

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[DealFlow360 Global Error]:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
});

// Start Server
if (process.env.NODE_ENV !== 'test') {
  connectDatabase().then(() => {
    app.listen(PORT, () => {
      console.log(`=======================================================`);
      console.log(` 🚀 DealFlow360 Server running on port ${PORT}`);
      console.log(` 📡 REST API Base: http://localhost:${PORT}/api`);
      console.log(`=======================================================`);
    });
  });
}

export default app;
