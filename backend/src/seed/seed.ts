import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { connectDatabase, disconnectDatabase } from '../config/database';
import {
  User,
  Customer,
  Category,
  Product,
  Warehouse,
  WarehouseStock,
  DiscountTier,
  DiscountRule,
  ApprovalRule,
  Quotation,
  Approval,
  UpsellRule,
  CrossSellRule,
  Fulfillment,
  Backorder,
  SubscriptionPlan,
  Subscription,
  Invoice,
  Payment,
  Negotiation,
  DealHealthEvent,
  Notification,
  AuditLog,
} from '../models';

dotenv.config();

const seedDatabase = async () => {
  try {
    console.log('[Seed] Connecting to MongoDB...');
    await connectDatabase();

    console.log('[Seed] Clearing existing collections...');
    await Promise.all([
      User.deleteMany({}),
      Customer.deleteMany({}),
      Category.deleteMany({}),
      Product.deleteMany({}),
      Warehouse.deleteMany({}),
      WarehouseStock.deleteMany({}),
      DiscountTier.deleteMany({}),
      DiscountRule.deleteMany({}),
      ApprovalRule.deleteMany({}),
      Quotation.deleteMany({}),
      Approval.deleteMany({}),
      UpsellRule.deleteMany({}),
      CrossSellRule.deleteMany({}),
      Fulfillment.deleteMany({}),
      Backorder.deleteMany({}),
      SubscriptionPlan.deleteMany({}),
      Subscription.deleteMany({}),
      Invoice.deleteMany({}),
      Payment.deleteMany({}),
      Negotiation.deleteMany({}),
      DealHealthEvent.deleteMany({}),
      Notification.deleteMany({}),
      AuditLog.deleteMany({}),
    ]);

    const defaultPasswordHash = await bcrypt.hash('password123', 10);

    // ==========================================
    // 1. DISCOUNT TIERS (BRONZE, SILVER, GOLD)
    // ==========================================
    console.log('[Seed] Creating Discount Tiers...');
    const tierBronze = await DiscountTier.create({
      tierName: 'BRONZE',
      maxDiscountPct: 5,
      description: 'Standard discount ceiling up to 5% for entry-level clients.',
      badgeColor: '#cd7f32',
    });
    const tierSilver = await DiscountTier.create({
      tierName: 'SILVER',
      maxDiscountPct: 10,
      description: 'Mid-tier enterprise clients with up to 10% discount allowance.',
      badgeColor: '#94a3b8',
    });
    const tierGold = await DiscountTier.create({
      tierName: 'GOLD',
      maxDiscountPct: 15,
      description: 'Premier VIP clients with up to 15% discount allowance.',
      badgeColor: '#eab308',
    });

    // ==========================================
    // 2. CATEGORIES (HARDWARE, SERVICES, SUBSCRIPTIONS, SOFTWARE)
    // ==========================================
    console.log('[Seed] Creating Categories...');
    const catHardware = await Category.create({
      name: 'Hardware',
      code: 'HW',
      description: 'Physical computers, servers, networking, and devices',
      defaultDiscountCeiling: 15,
      color: '#3b82f6',
    });
    const catServices = await Category.create({
      name: 'Services',
      code: 'SVC',
      description: 'Professional setup, deployment, on-site installation, and consulting',
      defaultDiscountCeiling: 10,
      color: '#10b981',
    });
    const catSubscriptions = await Category.create({
      name: 'Subscriptions & SaaS',
      code: 'SUB',
      description: 'Recurring software licenses, cloud compute, and managed support plans',
      defaultDiscountCeiling: 5,
      color: '#8b5cf6',
    });
    const catAccessories = await Category.create({
      name: 'Accessories',
      code: 'ACC',
      description: 'Peripherals, cables, monitors, and workspace additions',
      defaultDiscountCeiling: 12,
      color: '#f59e0b',
    });

    const categoryPool = [catHardware, catServices, catSubscriptions, catAccessories];

    // ==========================================
    // 3. WAREHOUSES
    // ==========================================
    console.log('[Seed] Creating Warehouses...');
    const whMain = await Warehouse.create({
      name: 'Main Warehouse',
      code: 'WH-MAIN',
      location: 'Bangalore Hub',
      address: 'Plot 45, Electronic City Phase 1, Bangalore, Karnataka',
      shippingCostWeight: 1.0,
      isDefault: true,
      isActive: true,
    });
    const whEast = await Warehouse.create({
      name: 'East Depot',
      code: 'WH-EAST',
      location: 'Kolkata Depot',
      address: 'Sector V, Salt Lake, Kolkata, West Bengal',
      shippingCostWeight: 1.2,
      isDefault: false,
      isActive: true,
    });
    const whWest = await Warehouse.create({
      name: 'West Distribution Center',
      code: 'WH-WEST',
      location: 'Mumbai Port',
      address: 'Bhiwandi Logistics Park, Mumbai, Maharashtra',
      shippingCostWeight: 1.1,
      isDefault: false,
      isActive: true,
    });
    const whNorth = await Warehouse.create({
      name: 'North Fulfillment Hub',
      code: 'WH-NORTH',
      location: 'Delhi NCR',
      address: 'Udyog Vihar Phase 4, Gurugram, Haryana',
      shippingCostWeight: 1.15,
      isDefault: false,
      isActive: true,
    });

    const warehousePool = [whMain, whEast, whWest, whNorth];

    // ==========================================
    // 4. JUDGE DEMO CORE PRODUCTS + EXTENDED CATALOG (150+ Products)
    // ==========================================
    console.log('[Seed] Creating Products Catalog...');
    // Demo Baseline Products:
    const prodLaptop = await Product.create({
      name: 'Enterprise Laptop Pro 16"',
      sku: 'HW-LAP-001',
      categoryId: catHardware._id,
      type: 'GOODS',
      billingType: 'ONE_TIME',
      unitPrice: 80000,
      unitCost: 60000,
      taxRate: 18,
      description: 'High-performance 16-core workstation laptop with 32GB RAM & 1TB SSD.',
      unitOfMeasure: 'Unit',
      maxDiscountCeiling: 15,
      isPromoted: true,
    });

    const prodInstallation = await Product.create({
      name: 'On-Site Installation & Setup Service',
      sku: 'SVC-INST-001',
      categoryId: catServices._id,
      type: 'SERVICE',
      billingType: 'ONE_TIME',
      unitPrice: 10000,
      unitCost: 5000,
      taxRate: 18,
      description: 'Complete on-site OS hardening, network mapping, and staging.',
      unitOfMeasure: 'Hours / Deployment',
      maxDiscountCeiling: 10,
      isPromoted: false,
    });

    const prodMonthlySupport = await Product.create({
      name: '24/7 Dedicated Cloud Support',
      sku: 'SUB-SUP-001',
      categoryId: catSubscriptions._id,
      type: 'SERVICE',
      billingType: 'RECURRING',
      unitPrice: 5000,
      unitCost: 2000,
      taxRate: 18,
      description: 'Round-the-clock SLA priority support with 15-minute response guarantee.',
      unitOfMeasure: 'Month',
      maxDiscountCeiling: 5,
      isPromoted: true,
    });

    const prodWarranty = await Product.create({
      name: '3-Year Complete Care Extended Warranty',
      sku: 'SVC-WAR-001',
      categoryId: catServices._id,
      type: 'SERVICE',
      billingType: 'ONE_TIME',
      unitPrice: 12000,
      unitCost: 4000,
      taxRate: 18,
      description: 'Comprehensive accidental damage protection and next-business-day on-site repair.',
      unitOfMeasure: 'Contract',
      maxDiscountCeiling: 12,
      isPromoted: true,
    });

    const prodMouse = await Product.create({
      name: 'Ergonomic Precision Wireless Mouse',
      sku: 'ACC-MOU-001',
      categoryId: catAccessories._id,
      type: 'GOODS',
      billingType: 'ONE_TIME',
      unitPrice: 3500,
      unitCost: 1800,
      taxRate: 18,
      description: 'Rechargeable wireless ergonomic mouse with customizable thumb scroll.',
      unitOfMeasure: 'Unit',
      maxDiscountCeiling: 15,
      isPromoted: true,
    });

    const prodKeyboard = await Product.create({
      name: 'Mechanical Backlit Office Keyboard',
      sku: 'ACC-KEY-001',
      categoryId: catAccessories._id,
      type: 'GOODS',
      billingType: 'ONE_TIME',
      unitPrice: 5500,
      unitCost: 2800,
      taxRate: 18,
      description: 'Quiet tactile mechanical switches with white LED backlight and wrist rest.',
      unitOfMeasure: 'Unit',
      maxDiscountCeiling: 15,
      isPromoted: false,
    });

    const prodServer = await Product.create({
      name: 'Enterprise Rack Server 2U Dual Xeon',
      sku: 'HW-SRV-001',
      categoryId: catHardware._id,
      type: 'GOODS',
      billingType: 'ONE_TIME',
      unitPrice: 250000,
      unitCost: 190000,
      taxRate: 18,
      description: 'Dual Intel Xeon Gold, 128GB ECC RAM, 8x 2TB NVMe hot-swappable storage.',
      unitOfMeasure: 'Unit',
      maxDiscountCeiling: 12,
      isPromoted: false,
    });

    const prodCloudBackup = await Product.create({
      name: 'Automated Hybrid Cloud Backup Service',
      sku: 'SUB-BAK-001',
      categoryId: catSubscriptions._id,
      type: 'SERVICE',
      billingType: 'RECURRING',
      unitPrice: 8000,
      unitCost: 2500,
      taxRate: 18,
      description: 'Immutable ransomware-proof backup with daily snapshots and instant failover.',
      unitOfMeasure: 'Month',
      maxDiscountCeiling: 8,
      isPromoted: true,
    });

    const createdProducts = [
      prodLaptop,
      prodInstallation,
      prodMonthlySupport,
      prodWarranty,
      prodMouse,
      prodKeyboard,
      prodServer,
      prodCloudBackup,
    ];

    // Generate up to 160 realistic products
    const productNouns = [
      'Monitor 27" 4K', 'Docking Station USB-C', 'Managed Switch 24-Port', 'Enterprise Router',
      'Wi-Fi 6 Access Point', 'VoIP Desk Phone', 'UPS 1500VA Smart Backup', 'Noise-Cancelling Headset',
      'Security Gateway Firewall', 'NAS Storage Array 4-Bay', 'Thermal Receipt Printer', 'Barcode Scanner 2D',
      'Video Conference Bar 4K', 'Standing Desk Converter', 'Security Camera PoE', 'Server Staging Service',
      'Disaster Recovery Audit', 'Penetration Testing Service', 'Cloud Migration Consulting', 'Annual Maintenance Contract'
    ];

    for (let i = 1; i <= 150; i++) {
      const noun = productNouns[i % productNouns.length];
      const cat = categoryPool[i % categoryPool.length];
      const isSub = cat.code === 'SUB' || (i % 5 === 0);
      const isService = cat.code === 'SVC' || (i % 4 === 0);
      const type = isService ? 'SERVICE' : (i % 7 === 0 ? 'COMBO' : 'GOODS');
      const billingType = isSub ? 'RECURRING' : 'ONE_TIME';
      const cost = Math.round((2000 + (i * 350) % 50000) / 100) * 100;
      const marginMulti = 1.25 + ((i % 5) * 0.1);
      const price = Math.round((cost * marginMulti) / 100) * 100;

      const p = await Product.create({
        name: `${noun} ${i > 20 ? `v${Math.floor(i / 10) + 1}` : 'Gen 2'} - Mod ${i}`,
        sku: `${cat.code}-${type.slice(0, 3)}-${String(100 + i).padStart(4, '0')}`,
        categoryId: cat._id,
        type,
        billingType,
        unitPrice: price,
        unitCost: cost,
        taxRate: 18,
        description: `Enterprise-grade ${noun.toLowerCase()} designed for scalable corporate deployments.`,
        unitOfMeasure: isSub ? 'Month' : 'Unit',
        maxDiscountCeiling: cat.defaultDiscountCeiling,
        isPromoted: i % 6 === 0,
      });
      createdProducts.push(p);
    }
    console.log(`[Seed] Created ${createdProducts.length} Products.`);

    // ==========================================
    // 5. WAREHOUSE STOCKS (CRITICAL DEMO DATA)
    // ==========================================
    console.log('[Seed] Setting up Warehouse Stocks...');
    // Exact Judge Demo Requirement:
    // Order = 10 Laptops -> Warehouse A (Main): 6, Warehouse B (East): 4
    await WarehouseStock.create({
      warehouseId: whMain._id,
      productId: prodLaptop._id,
      quantityOnHand: 6,
      quantityReserved: 0,
      quantityAvailable: 6,
      replenishmentThreshold: 3,
    });

    await WarehouseStock.create({
      warehouseId: whEast._id,
      productId: prodLaptop._id,
      quantityOnHand: 4,
      quantityReserved: 0,
      quantityAvailable: 4,
      replenishmentThreshold: 2,
    });

    await WarehouseStock.create({
      warehouseId: whWest._id,
      productId: prodLaptop._id,
      quantityOnHand: 0,
      quantityReserved: 0,
      quantityAvailable: 0,
      replenishmentThreshold: 2,
    });

    await WarehouseStock.create({
      warehouseId: whNorth._id,
      productId: prodLaptop._id,
      quantityOnHand: 0,
      quantityReserved: 0,
      quantityAvailable: 0,
      replenishmentThreshold: 2,
    });

    // Populate stock for all other physical products across warehouses
    for (const prod of createdProducts) {
      if (prod.type === 'GOODS' && prod._id.toString() !== prodLaptop._id.toString()) {
        for (const wh of warehousePool) {
          const qty = Math.floor(15 + Math.random() * 85);
          await WarehouseStock.create({
            warehouseId: wh._id,
            productId: prod._id,
            quantityOnHand: qty,
            quantityReserved: 0,
            quantityAvailable: qty,
            replenishmentThreshold: 5,
          });
        }
      }
    }
    console.log('[Seed] Warehouse Stock levels configured.');

    // ==========================================
    // 6. UPSELL & CROSS-SELL RULES
    // ==========================================
    console.log('[Seed] Creating Upsell & Cross-Sell Rules...');
    // Demo flow: Laptop -> Warranty / Mouse / Keyboard
    await UpsellRule.create({
      name: 'Laptop -> Extended Warranty',
      triggerProductId: prodLaptop._id,
      recommendedProductId: prodWarranty._id,
      reason: 'Clients purchasing enterprise laptops protect investment with 3-year comprehensive warranty.',
      marginBenefitNotes: 'Boosts deal gross margin by ₹8,000 (+66.7% line margin).',
      isPromoted: true,
      priority: 1,
    });

    await UpsellRule.create({
      name: 'Laptop -> Wireless Ergonomic Mouse',
      triggerProductId: prodLaptop._id,
      recommendedProductId: prodMouse._id,
      reason: 'Frequently bundled ergonomic accessory to improve employee desk productivity.',
      marginBenefitNotes: 'Adds ₹1,700 margin per unit with zero fulfillment friction.',
      isPromoted: true,
      priority: 2,
    });

    await CrossSellRule.create({
      name: 'Laptop -> Backlit Keyboard',
      triggerProductId: prodLaptop._id,
      recommendedProductId: prodKeyboard._id,
      reason: 'Recommended workspace keyboard for dual-screen setups.',
      priority: 3,
    });

    // Server -> Support / Backup Service
    await UpsellRule.create({
      name: 'Server -> 24/7 Cloud Support',
      triggerProductId: prodServer._id,
      recommendedProductId: prodMonthlySupport._id,
      reason: 'Mission-critical servers require continuous 24/7 SLA coverage.',
      marginBenefitNotes: 'Generates recurring monthly cash flow of ₹5,000/month.',
      isPromoted: true,
      priority: 1,
    });

    await CrossSellRule.create({
      name: 'Server -> Hybrid Cloud Backup',
      triggerProductId: prodServer._id,
      recommendedProductId: prodCloudBackup._id,
      reason: 'Automated disaster recovery storage paired with on-premise compute.',
      priority: 2,
    });

    // ==========================================
    // 7. APPROVAL RULES & DISCOUNT RULES
    // ==========================================
    console.log('[Seed] Creating Approval and Discount Governance Rules...');
    await ApprovalRule.create({
      name: 'Standard Manager Review',
      conditionType: 'DISCOUNT_EXCEEDED',
      minDiscountDeltaPct: 0.1,
      requiredRole: 'SALES_MANAGER',
      stepOrder: 1,
      description: 'Triggered when any item discount exceeds customer tier or category ceiling by up to 5%.',
    });

    await ApprovalRule.create({
      name: 'Executive Finance Approval',
      conditionType: 'RISK_LEVEL',
      minRiskLevel: 'HIGH',
      minDiscountDeltaPct: 5.0,
      requiredRole: 'FINANCE_OPS',
      stepOrder: 2,
      description: 'Triggered when discount violation exceeds 5% or order gross margin drops below 15%.',
    });

    // ==========================================
    // 8. SUBSCRIPTION PLANS
    // ==========================================
    console.log('[Seed] Creating Subscription Plans...');
    const planMonthly = await SubscriptionPlan.create({
      name: 'Monthly Flexible Plan',
      code: 'PLAN-M-01',
      billingFrequency: 'MONTHLY',
      durationMonths: 1,
      discountPct: 0,
      description: 'Month-to-month billed support and software subscription with standard cancellation terms.',
    });
    const planQuarterly = await SubscriptionPlan.create({
      name: 'Quarterly Business Plan',
      code: 'PLAN-Q-01',
      billingFrequency: 'QUARTERLY',
      durationMonths: 3,
      discountPct: 5,
      description: 'Billed every 3 months with 5% bundled discount.',
    });
    const planYearly = await SubscriptionPlan.create({
      name: 'Annual Enterprise Plan',
      code: 'PLAN-Y-01',
      billingFrequency: 'YEARLY',
      durationMonths: 12,
      discountPct: 15,
      description: 'Annual commitment billed upfront or monthly with 15% discount.',
    });

    // ==========================================
    // 9. CUSTOMERS (150+ Customers including ABC Corporation)
    // ==========================================
    console.log('[Seed] Creating Customers...');
    // Judge Demo Customer:
    const custAbc = await Customer.create({
      name: 'David Miller',
      code: 'CUST-ABC-01',
      email: 'david@abccorp.com',
      phone: '+91 98765 43210',
      companyName: 'ABC Corporation',
      tier: 'GOLD', // 15% limit
      industry: 'Enterprise Software & Cloud',
      creditLimit: 2500000,
      address: {
        street: 'Cyber City Tower B, Phase 2',
        city: 'Gurugram',
        state: 'Haryana',
        country: 'India',
        zipCode: '122002',
      },
      portalAccessEnabled: true,
      notes: 'Strategic Gold account. Evaluates hardware refresh and hybrid cloud services.',
    });

    const custBeta = await Customer.create({
      name: 'Sarah Jenkins',
      code: 'CUST-BETA-02',
      email: 'sarah@betaindustries.com',
      phone: '+91 98111 22334',
      companyName: 'Beta Industries Ltd',
      tier: 'SILVER', // 10% limit
      industry: 'Manufacturing & Logistics',
      creditLimit: 1200000,
      address: {
        street: 'MIDC Industrial Area, Turbhe',
        city: 'Navi Mumbai',
        state: 'Maharashtra',
        country: 'India',
        zipCode: '400705',
      },
      portalAccessEnabled: true,
    });

    const custAcme = await Customer.create({
      name: 'Robert Vance',
      code: 'CUST-ACME-03',
      email: 'robert@acmecorp.in',
      phone: '+91 99222 33445',
      companyName: 'Acme Technologies',
      tier: 'BRONZE', // 5% limit
      industry: 'FinTech Startup',
      creditLimit: 600000,
      address: {
        street: 'Koramangala 4th Block',
        city: 'Bangalore',
        state: 'Karnataka',
        country: 'India',
        zipCode: '560034',
      },
      portalAccessEnabled: true,
    });

    const createdCustomers = [custAbc, custBeta, custAcme];

    const companyNames = [
      'Apex Solutions', 'Nexus Dynamics', 'Zenith Logistics', 'Quantum Robotics',
      'Vanguard Health', 'Starlight Energy', 'Pinnacle Media', 'Titan Manufacturing',
      'BluePeak Capital', 'InfiniCloud Systems', 'Aegis Security', 'Horizon Retail',
      'Synapse Networks', 'Falcon Global', 'Radiant Biologics', 'Crestline Ventures'
    ];

    const tiersList: Array<'BRONZE' | 'SILVER' | 'GOLD'> = ['BRONZE', 'SILVER', 'GOLD'];

    for (let i = 1; i <= 150; i++) {
      const cName = `${companyNames[i % companyNames.length]} ${Math.floor(i / companyNames.length) > 0 ? (i + 1) : ''}`.trim();
      const tier = tiersList[i % tiersList.length];
      const customer = await Customer.create({
        name: `Contact Person ${i}`,
        code: `CUST-${String(100 + i).padStart(4, '0')}`,
        email: `contact${i}@${cName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
        phone: `+91 98${String(10000000 + i).slice(-8)}`,
        companyName: cName,
        tier,
        industry: ['Technology', 'Healthcare', 'Finance', 'Manufacturing', 'Logistics'][i % 5],
        creditLimit: tier === 'GOLD' ? 2000000 : (tier === 'SILVER' ? 1000000 : 500000),
        address: {
          street: `${i * 12} Industrial Boulevard`,
          city: ['Bangalore', 'Mumbai', 'Delhi', 'Hyderabad', 'Pune', 'Chennai'][i % 6],
          state: 'State',
          country: 'India',
          zipCode: String(500000 + i),
        },
        portalAccessEnabled: true,
      });
      createdCustomers.push(customer);
    }
    console.log(`[Seed] Created ${createdCustomers.length} Customers.`);

    // ==========================================
    // 10. USERS (ADMIN, SALES REP, MANAGER, FINANCE, CUSTOMER PORTAL + 150+ USERS)
    // ==========================================
    console.log('[Seed] Creating Users & RBAC Personas...');
    const userAdmin = await User.create({
      name: 'Alexander Cross',
      email: 'admin@dealflow360.com',
      passwordHash: defaultPasswordHash,
      role: 'ADMIN',
      department: 'Executive / Administration',
      isActive: true,
    });

    const userSalesRep = await User.create({
      name: 'Sarah Miller',
      email: 'sarah.rep@dealflow360.com',
      passwordHash: defaultPasswordHash,
      role: 'SALES_REP',
      department: 'Enterprise Sales',
      isActive: true,
    });

    const userSalesManager = await User.create({
      name: 'Marcus Sterling',
      email: 'marcus.mgr@dealflow360.com',
      passwordHash: defaultPasswordHash,
      role: 'SALES_MANAGER',
      department: 'Sales Leadership',
      isActive: true,
    });

    const userFinance = await User.create({
      name: 'Fiona Vance',
      email: 'fiona.fin@dealflow360.com',
      passwordHash: defaultPasswordHash,
      role: 'FINANCE_OPS',
      department: 'Finance & Supply Chain',
      isActive: true,
    });

    const userCustomer = await User.create({
      name: 'David Miller',
      email: 'david@abccorp.com',
      passwordHash: defaultPasswordHash,
      role: 'CUSTOMER',
      department: 'Procurement (External)',
      customerId: custAbc._id,
      isActive: true,
    });

    const createdUsers = [userAdmin, userSalesRep, userSalesManager, userFinance, userCustomer];

    for (let i = 1; i <= 150; i++) {
      const roles: Array<'SALES_REP' | 'SALES_MANAGER' | 'FINANCE_OPS' | 'CUSTOMER'> = [
        'SALES_REP', 'SALES_REP', 'SALES_MANAGER', 'FINANCE_OPS', 'CUSTOMER'
      ];
      const assignedRole = roles[i % roles.length];
      const u = await User.create({
        name: `User ${assignedRole} ${i}`,
        email: `user${i}.${assignedRole.toLowerCase()}@dealflow360.com`,
        passwordHash: defaultPasswordHash,
        role: assignedRole,
        department: assignedRole === 'SALES_REP' ? 'Field Sales' : (assignedRole === 'SALES_MANAGER' ? 'Regional Management' : 'Finance'),
        customerId: assignedRole === 'CUSTOMER' ? createdCustomers[i % createdCustomers.length]._id : undefined,
        isActive: true,
      });
      createdUsers.push(u);
    }
    console.log(`[Seed] Created ${createdUsers.length} Users.`);

    // ==========================================
    // 11. QUOTATIONS, APPROVALS, INVOICES, SUBSCRIPTIONS (150+ Records)
    // ==========================================
    console.log('[Seed] Creating Quotations, Approvals, Invoices & Subscriptions...');
    const createdQuotations = [];
    const stagesList = [
      'DRAFT',
      'SUBMITTED',
      'PENDING_APPROVAL',
      'APPROVED',
      'READY_FOR_FULFILLMENT',
      'FULFILLED',
      'BILLING_IN_PROGRESS',
      'CUSTOMER_CONFIRMED',
      'CLOSED',
    ];

    for (let i = 1; i <= 160; i++) {
      const cust = createdCustomers[i % createdCustomers.length];
      const stage = stagesList[i % stagesList.length] as any;
      const quoteNumber = `QT-${String(20000 + i)}`;

      // Generate 2 to 4 items
      const itemsCount = 2 + (i % 3);
      const items = [];
      let subtotal = 0;
      let totalDiscount = 0;
      let taxable = 0;
      let tax = 0;
      let cost = 0;

      for (let j = 0; j < itemsCount; j++) {
        const prod = createdProducts[(i + j) % createdProducts.length];
        const qty = 1 + ((i + j) % 8);
        const discountPct = (i % 4 === 0) ? 18 : ((i % 3 === 0) ? 8 : 4);
        const lineSubtotal = qty * prod.unitPrice;
        const lineDiscount = Math.round((lineSubtotal * (discountPct / 100)) * 100) / 100;
        const lineTaxable = lineSubtotal - lineDiscount;
        const lineTax = Math.round((lineTaxable * 0.18) * 100) / 100;
        const lineTotal = lineTaxable + lineTax;
        const lineCost = qty * prod.unitCost;
        const lineMargin = lineTotal - lineCost;
        const lineMarginPct = lineTotal > 0 ? Math.round((lineMargin / lineTotal) * 100) : 0;

        subtotal += lineSubtotal;
        totalDiscount += lineDiscount;
        taxable += lineTaxable;
        tax += lineTax;
        cost += lineCost;

        items.push({
          productId: prod._id,
          productName: prod.name,
          sku: prod.sku,
          categoryName: 'Hardware',
          type: prod.type,
          billingType: prod.billingType,
          quantity: qty,
          unitPrice: prod.unitPrice,
          unitCost: prod.unitCost,
          discountPct,
          discountAmount: lineDiscount,
          taxableAmount: lineTaxable,
          taxRate: 18,
          taxAmount: lineTax,
          lineTotal,
          lineCost,
          lineGrossMargin: lineMargin,
          lineMarginPct,
          allowedDiscountCeiling: 10,
          isDiscountViolated: discountPct > 10,
          discountDeltaPct: discountPct > 10 ? discountPct - 10 : 0,
        });
      }

      const totalAmount = taxable + tax;
      const grossMargin = totalAmount - cost;
      const grossMarginPct = totalAmount > 0 ? Math.round((grossMargin / totalAmount) * 100) : 0;
      const isHighRisk = totalDiscount > 30000 || grossMarginPct < 15;

      const quotation = await Quotation.create({
        quoteNumber,
        title: `Enterprise Quotation for ${cust.companyName}`,
        customerId: cust._id,
        salesRepId: userSalesRep._id,
        stage,
        items,
        subtotal: Math.round(subtotal),
        discountAmount: Math.round(totalDiscount),
        taxableAmount: Math.round(taxable),
        taxAmount: Math.round(tax),
        totalAmount: Math.round(totalAmount),
        totalCost: Math.round(cost),
        grossMarginAmount: Math.round(grossMargin),
        grossMarginPct,
        riskLevel: isHighRisk ? 'HIGH' : (totalDiscount > 10000 ? 'MEDIUM' : 'LOW'),
        riskScore: isHighRisk ? 78 : (totalDiscount > 10000 ? 55 : 20),
        riskReasons: isHighRisk ? ['Discount exceeds ceiling by +8%', 'Gross margin below 15%'] : [],
        approvalRequired: isHighRisk || totalDiscount > 10000,
        customerNotes: 'Standard 30-day payment terms.',
        internalNotes: 'Target closure in current quarter.',
        negotiationActive: i % 5 === 0,
        isCustomerConfirmed: stage === 'CUSTOMER_CONFIRMED' || stage === 'CLOSED',
      });
      createdQuotations.push(quotation);

      // If pending approval or approved, create Approval record
      if (quotation.approvalRequired) {
        const approval = await Approval.create({
          quotationId: quotation._id,
          customerId: cust._id,
          salesRepId: userSalesRep._id,
          status: stage === 'PENDING_APPROVAL' ? 'PENDING' : (stage === 'REJECTED' ? 'REJECTED' : 'APPROVED'),
          currentStepIndex: stage === 'PENDING_APPROVAL' ? 0 : 1,
          totalSteps: 2,
          steps: [
            {
              stepOrder: 1,
              role: 'SALES_MANAGER',
              status: stage === 'PENDING_APPROVAL' ? 'PENDING' : 'APPROVED',
              approverId: userSalesManager._id,
              approverName: userSalesManager.name,
              actionDate: new Date(),
              notes: 'Evaluated volume deal justification.',
            },
            {
              stepOrder: 2,
              role: 'FINANCE_OPS',
              status: stage === 'PENDING_APPROVAL' ? 'PENDING' : 'APPROVED',
              approverId: userFinance._id,
              approverName: userFinance.name,
              actionDate: new Date(),
              notes: 'Commercial terms verified.',
            },
          ],
          riskLevel: quotation.riskLevel,
          riskScore: quotation.riskScore,
          riskSummary: quotation.riskReasons.join('; '),
          violations: quotation.items.filter((it: any) => it.isDiscountViolated),
          requestedAt: new Date(Date.now() - (i % 5) * 24 * 60 * 60 * 1000),
          completedAt: stage === 'APPROVED' ? new Date() : undefined,
        });

        quotation.currentApprovalId = approval._id as any;
        await quotation.save();
      }

      // Create Invoices & Subscriptions for appropriate stages
      if (['READY_FOR_FULFILLMENT', 'FULFILLED', 'BILLING_IN_PROGRESS', 'CLOSED'].includes(stage)) {
        const isPaid = stage === 'CLOSED' || (i % 2 === 0);
        const inv = await Invoice.create({
          invoiceNumber: `INV-${String(30000 + i)}`,
          quotationId: quotation._id,
          customerId: cust._id,
          type: 'ONE_TIME',
          status: isPaid ? 'PAID' : 'ISSUED',
          items: quotation.items.map((it: any) => ({
            productId: it.productId,
            productName: it.productName,
            sku: it.sku,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            discountAmount: it.discountAmount,
            taxableAmount: it.taxableAmount,
            taxAmount: it.taxAmount,
            lineTotal: it.lineTotal,
            billingType: it.billingType,
          })),
          subtotal: quotation.subtotal,
          discountAmount: quotation.discountAmount,
          taxableAmount: quotation.taxableAmount,
          taxAmount: quotation.taxAmount,
          totalAmount: quotation.totalAmount,
          paidAmount: isPaid ? quotation.totalAmount : 0,
          dueBalance: isPaid ? 0 : quotation.totalAmount,
          issueDate: new Date(),
          paidDate: isPaid ? new Date() : undefined,
          dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        });

        if (isPaid) {
          await Payment.create({
            paymentNumber: `PAY-${String(50000 + i)}`,
            invoiceId: inv._id,
            customerId: cust._id,
            amount: inv.totalAmount,
            paymentMethod: 'BANK_TRANSFER',
            referenceNumber: `HDFC-NEFT-${100000 + i}`,
            recordedById: userFinance._id,
            paidAt: new Date(),
          });
        }

        // Create subscription if recurring items exist
        await Subscription.create({
          subscriptionNumber: `SUB-${String(70000 + i)}`,
          customerId: cust._id,
          quotationId: quotation._id,
          productId: prodMonthlySupport._id,
          productName: prodMonthlySupport.name,
          planId: planMonthly._id,
          billingFrequency: 'MONTHLY',
          quantity: 1,
          unitPrice: 5000,
          recurringAmount: 5000,
          taxAmount: 900,
          totalRecurringAmount: 5900,
          status: 'ACTIVE',
          startDate: new Date(),
          nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          renewalDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        });
      }

      // Create Audit Logs
      await AuditLog.create({
        actorId: userSalesRep._id,
        actorName: userSalesRep.name,
        actorRole: userSalesRep.role,
        action: 'QUOTATION_SYNC',
        entityType: 'QUOTATION',
        entityId: quotation._id.toString(),
        entityNumber: quotation.quoteNumber,
        afterState: { stage, totalAmount: quotation.totalAmount },
        notes: `Seed state transition for quotation ${quotation.quoteNumber}`,
        timestamp: new Date(Date.now() - (i % 10) * 24 * 60 * 60 * 1000),
      });
    }

    console.log(`[Seed] Created ${createdQuotations.length} Quotations with associated Approvals, Invoices & Subscriptions.`);

    // ==========================================
    // 12. BACKORDERS & DEAL HEALTH EVENTS
    // ==========================================
    console.log('[Seed] Creating Backorders and Deal Health Anomaly Events...');
    for (let i = 1; i <= 20; i++) {
      const q = createdQuotations[i];
      await Backorder.create({
        backorderNumber: `BO-${String(40000 + i)}`,
        quotationId: q._id,
        customerId: q.customerId,
        productId: prodLaptop._id,
        productName: prodLaptop.name,
        quantityBackordered: 5 + (i % 10),
        quantityFulfilled: 0,
        status: i % 3 === 0 ? 'RESOLVED' : 'OPEN',
        estimatedRestockDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        notes: 'Replenishment shipment expected from OEM regional facility.',
      });
    }

    // Deal Health Events
    await DealHealthEvent.create({
      quotationId: createdQuotations[1]._id,
      customerId: custAbc._id,
      eventType: 'STALLED',
      severity: 'HIGH',
      title: 'Quotation Stalled in Approval Queue',
      description: 'Pending Sales Manager approval for more than 48 hours.',
      metrics: { daysInactive: 2.5 },
      suggestedAction: 'Send automated escalation nudge to Sales Manager.',
      isResolved: false,
    });

    await DealHealthEvent.create({
      quotationId: createdQuotations[2]._id,
      customerId: custBeta._id,
      eventType: 'DISCOUNT_ANOMALY',
      severity: 'CRITICAL',
      title: 'Severe Discount Anomaly Detected',
      description: 'Applied discount of 18% is 8 points above customer Silver tier ceiling (10%).',
      metrics: { discountPct: 18, marginLossAmount: 42000 },
      suggestedAction: 'Require Executive Finance sign-off before dispatch.',
      isResolved: false,
    });

    await DealHealthEvent.create({
      quotationId: createdQuotations[3]._id,
      customerId: custAcme._id,
      eventType: 'DELIVERY_RISK',
      severity: 'HIGH',
      title: 'Fulfillment Delayed by Stock Shortfall',
      description: 'Order requires 15 units of Enterprise Laptops; warehouses have only 10 available.',
      metrics: { backorderedCount: 5 },
      suggestedAction: 'Authorize split fulfillment and expedite restock order.',
      isResolved: false,
    });

    await DealHealthEvent.create({
      quotationId: createdQuotations[4]._id,
      customerId: custAbc._id,
      eventType: 'NEGOTIATION_DELAY',
      severity: 'MEDIUM',
      title: 'Customer Counter-Discount Awaiting Response',
      description: 'Customer requested 20% discount on quotation lines 36 hours ago.',
      metrics: { daysInactive: 1.5 },
      suggestedAction: 'Review customer counter-offer and submit revision.',
      isResolved: false,
    });

    console.log('[Seed] Database seeding completed successfully! ✨');
    console.log('=======================================================');
    console.log(' SEED SUMMARY:');
    console.log(` - Users: ${await User.countDocuments()}`);
    console.log(` - Customers: ${await Customer.countDocuments()}`);
    console.log(` - Products: ${await Product.countDocuments()}`);
    console.log(` - Warehouses: ${await Warehouse.countDocuments()}`);
    console.log(` - Warehouse Stocks: ${await WarehouseStock.countDocuments()}`);
    console.log(` - Quotations: ${await Quotation.countDocuments()}`);
    console.log(` - Approvals: ${await Approval.countDocuments()}`);
    console.log(` - Invoices: ${await Invoice.countDocuments()}`);
    console.log(` - Subscriptions: ${await Subscription.countDocuments()}`);
    console.log(` - Backorders: ${await Backorder.countDocuments()}`);
    console.log(` - Audit Logs: ${await AuditLog.countDocuments()}`);
    console.log(` - Deal Health Events: ${await DealHealthEvent.countDocuments()}`);
    console.log('=======================================================');

    await disconnectDatabase();
    process.exit(0);
  } catch (error) {
    console.error('[Seed Error]:', error);
    await disconnectDatabase();
    process.exit(1);
  }
};

seedDatabase();
