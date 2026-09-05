# DealFlow360 — Intelligent B2B Sales Operations Platform Implementation Plan

## Goal Description
Build **DealFlow360**, an intelligent, self-governing B2B Sales Operations platform that manages the complete deal lifecycle from quotation creation through discount governance, automatic approval routing, live upsell/cross-sell suggestions, multi-warehouse fulfillment splitting & backorders, hybrid billing (one-time + recurring subscriptions with proration), customer portal negotiation, re-approval loops, payment recording, deal health monitoring, and dynamic admin reporting.

The system uses **MongoDB Local (`mongodb://127.0.0.1:27017/dealflow360`)** with **Mongoose ODM**, a **Node.js + Express TypeScript** backend, a **React + Vite + Tailwind CSS** frontend, strict JWT-based Role-Based Access Control (Admin, Sales Rep, Sales Manager, Finance/Ops, Customer), and real deterministic business logic services.

---

## User Review Required

> [!IMPORTANT]
> - **Tech Stack Confirmed**:
>   - Frontend: **React + Vite + TypeScript + Tailwind CSS + Lucide Icons**
>   - Backend: **Node.js + Express.js + TypeScript**
>   - Database: **MongoDB Local** (`mongodb://127.0.0.1:27017/dealflow360`) with **Mongoose ODM**
>   - Authentication: **JWT + bcryptjs**
> - **Data Volume**: Comprehensive seed script (`npm run seed`) creating **150 to 200 realistic records across collections** (Users, Customers, Products, Warehouses, WarehouseStock, Quotations, Approvals, Invoices, Subscriptions, DealHealth, AuditLogs) while guaranteeing the exact **Judge Demo dataset** (`ABC Corporation`, Gold Tier, Laptops, Setup Service, Monthly Support, Main Warehouse: 6, East Depot: 4, etc.).
> - **Role Switcher & Quick Demo Bar**: 1-click persona switcher (`Sales Rep`, `Sales Manager`, `Finance / Ops`, `Customer Portal`, `Admin`) to let judges evaluate real RBAC and isolated portal workflows seamlessly.

---

## Architecture & Data Flow

```mermaid
graph TD
    UI[Frontend: React + Vite + TypeScript + Tailwind CSS]
    API[Backend API: Express.js TypeScript + REST Endpoints]
    DB[(Database: MongoDB Local + Mongoose ODM)]
    
    subgraph Backend Services & Decision Engines
        DE[Discount Governance & Blended Risk Engine]
        AE[Approval State Machine Service]
        UE[Upsell & Cross-Sell Engine]
        FE[Multi-Warehouse Allocation & Backorders]
        BE[Hybrid Billing & Proration Engine]
        DHE[Deal Health & Anomaly Detector]
        ALE[Audit Log Engine]
    end

    UI -->|JWT Auth / REST Requests| API
    API --> DE
    API --> AE
    API --> UE
    API --> FE
    API --> BE
    API --> DHE
    API --> ALE
    Backend Services & Decision Engines --> DB
```

---

## Proposed Changes

### 1. Backend Architecture (`backend/`)

#### Directory Structure:
```
backend/
├── src/
│   ├── config/
│   │   └── database.ts          # MongoDB connection (MONGODB_URI)
│   ├── models/                  # Mongoose Schemas & TypeScript interfaces
│   │   ├── User.ts
│   │   ├── Customer.ts
│   │   ├── Category.ts
│   │   ├── Product.ts
│   │   ├── Warehouse.ts
│   │   ├── WarehouseStock.ts
│   │   ├── Quotation.ts
│   │   ├── Approval.ts
│   │   ├── DiscountRule.ts
│   │   ├── DiscountTier.ts
│   │   ├── ApprovalRule.ts
│   │   ├── UpsellRule.ts
│   │   ├── CrossSellRule.ts
│   │   ├── Fulfillment.ts
│   │   ├── Backorder.ts
│   │   ├── SubscriptionPlan.ts
│   │   ├── Subscription.ts
│   │   ├── Invoice.ts
│   │   ├── Payment.ts
│   │   ├── Negotiation.ts
│   │   ├── DealHealthEvent.ts
│   │   ├── Notification.ts
│   │   └── AuditLog.ts
│   ├── services/
│   │   ├── discountService.ts   # Line ceilings + deterministic blended risk score
│   │   ├── approvalService.ts   # Multi-tier approval chain & state transitions
│   │   ├── upsellService.ts     # Explainable recommendations with margin impact
│   │   ├── fulfillmentService.ts# Multi-warehouse allocation & backorder computation
│   │   ├── billingService.ts    # Hybrid split, invoice lifecycle, day-based proration
│   │   ├── dealHealthService.ts # Stalled, discount anomaly, delivery risk detection
│   │   └── auditService.ts      # Immutable state mutation logging
│   ├── controllers/             # Request handlers for each module
│   ├── routes/                  # REST route definitions
│   ├── middleware/              # JWT verification, RBAC role guard, error handler
│   ├── validators/              # Input validation schemas
│   ├── seed/                    # 150-200 realistic records + Judge Demo dataset
│   └── app.ts                   # Express server entry point
├── package.json
├── tsconfig.json
└── .env.example
```

---

### 2. Core Business Logic Engines

1. **Quotation Calculations**:
   - `Subtotal = sum(quantity * unit_price)`
   - `Discount Amount = applicable discount`
   - `Taxable Amount = Subtotal - Discount Amount`
   - `Total = Taxable Amount + Tax`
   - `Cost = sum(quantity * unit_cost)`
   - `Gross Margin = Total - Cost`
   - `Margin % = (Gross Margin / Total) * 100`

2. **Discount Governance & Blended Risk**:
   - Customer Tiers: Bronze (5%), Silver (10%), Gold (15%)
   - Category Ceilings: Hardware (15%), Services (10%), Subscriptions (5%)
   - Line-by-line violation evaluation + aggregated order risk:
     - `No violation` → `LOW` (No approval)
     - `Small single violation (<= 5% over ceiling)` → `MEDIUM` (Manager approval)
     - `Large violation (> 5% over ceiling)` or `Multiple line violations` → `HIGH / CRITICAL` (Manager + Finance approval)

3. **Multi-Warehouse Fulfillment & Backorders**:
   - Live inventory query across all warehouses
   - Greedy optimal stock allocation minimizing shipment count
   - Automatic creation of `Backorder` records for any deficit

4. **Hybrid Billing & Subscriptions**:
   - One-Time products → Generated `Invoice` records
   - Recurring products → Generated `Subscription` records with start date, next billing date, and frequency
   - Day-based proration logic for mid-cycle changes: `Prorated Delta = (New Rate - Old Rate) * (Remaining Days in Cycle / Days in Month)`

5. **Customer Portal Isolation & Negotiation**:
   - Customer endpoint strictly redacts: internal margin, unit cost, internal approval notes, warehouse configs, and admin reports
   - Submitting a counter-discount re-triggers the discount evaluation engine and routes back for re-approval if thresholds are exceeded

6. **Deal Health & Anomaly Radar**:
   - `STALLED`: Quotations pending approval > 24 hours
   - `DISCOUNT_ANOMALY`: Discounts > 18% or significantly above rep historical average
   - `DELIVERY_RISK`: Fulfillment backorders or warehouse delays
   - `NEGOTIATION_DELAY`: Customer counter-offers inactive > 48 hours

---

### 3. Frontend Architecture (`frontend/`)

Built with React, TypeScript, Vite, and Tailwind CSS.

#### Key Views & Features:
1. **Persona / Role Switcher Header**: Instant 1-click role switcher (`Sales Rep`, `Sales Manager`, `Finance / Operations`, `Admin`, `Customer Portal: David @ ABC Corp`) with active token indicator
2. **Sales Dashboard**: Live KPI metric cards (Pipeline Value, Active Subscriptions, Pending Approvals, Gross Margin %, Fulfillment Backlog) + Recent Deals table + Health Radar
3. **Quotation Builder Workspace**:
   - Customer selector with Tier badge
   - Multi-line item editor (Product, qty, price, discount %)
   - Real-time calculations summary (Subtotal, Discount, Tax, Total, Cost, Gross Margin, Margin %)
   - Live **Upsell & Cross-Sell Panel** with margin delta preview and 1-click addition
   - Live **Discount Risk Warning & Approvers Preview**
4. **Approval Queue & Risk Inspector**:
   - Pending approvals table with severity badges (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`)
   - Deal breakdown, violation details, margin leakage indicators
   - One-click Approve, Reject, or Request Revision with audit reason
5. **Warehouse & Fulfillment Split Manager**:
   - Interactive warehouse allocation cards (Main Warehouse, East Depot, etc.)
   - Auto-split vs Manual allocation
   - Backorder status tracker & shipment cost preview
6. **Billing, Subscriptions & Invoices**:
   - Split view of One-Time Invoices vs Recurring Subscriptions
   - Subscription lifecycle management & proration calculator modal
   - Payment registration (Cash / Bank Transfer) updating invoice statuses in real-time
7. **Customer Portal (Strictly Isolated)**:
   - Dedicated clean customer view (cost & margin hidden)
   - Interactive negotiation widget (submit counter discount % + line notes)
   - One-click "Confirm Deal" button
8. **Deal Health & Anomaly Dashboard**: Actionable alerts with direct links to deals and 1-click rep nudges
9. **Admin Settings & Governance Rules**: CRUD for Discount Tiers, Category Ceilings, Approval Chains, Warehouses, and Products
10. **Reports & Analytics**: Visual charts for revenue trends, discount anomalies, rep performance, and fulfillment efficiency
11. **Judge Demo Quick Guide**: Built-in interactive walkthrough checklist guiding judges through the 17-step golden flow

---

## Verification Plan

### 1. Database & Seed Verification
- Run `npm run seed` in backend to populate 150-200 records in MongoDB Local (`dealflow360`)
- Verify all collections have rich data and verify the Judge Demo baseline data exists

### 2. Backend Automated Test Suite
- Run test scripts verifying:
  - Quotation math (Tax, Margin, Cost)
  - Discount evaluation & blended risk score classification
  - Multi-tier approval routing
  - Warehouse stock splitting & backorder creation
  - Hybrid billing separation & proration formulas
  - Customer portal data redaction

### 3. End-to-End Judge Demo Walkthrough
- Test the full 21-step flow directly through the UI:
  1. Login as Sales Rep (Sarah)
  2. Create Quote for ABC Corp (10 Laptops + 1 Setup Service with 18% discount + 1 Monthly Support)
  3. System flags discount violation & routes to Manager
  4. Switch to Sales Manager (Marcus) → Approve
  5. Add recommended Warranty upsell → Margins update
  6. Fulfillment checks stock → Main Warehouse: 6, East Depot: 4
  7. Billing generates One-Time Invoice + Recurring Subscription
  8. Switch to Customer Portal (David @ ABC Corp) → Counter with 20% discount
  9. System automatically restarts Approval (Manager + Finance)
  10. Finance (Fiona) approves → Customer confirms → Payment recorded → Reports & Health updated!

---
Please click **Proceed** to start the implementation.
