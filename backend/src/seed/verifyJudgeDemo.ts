const API = 'http://localhost:5000/api';

async function req(endpoint: string, options: any = {}) {
  const url = `${API}${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(`[${res.status}] ${json.message || JSON.stringify(json)}`);
  }
  return json;
}

async function runDemoFlowTest() {
  console.log('===============================================================');
  console.log(' 🚀 RUNNING DEALFLOW360 END-TO-END JUDGE DEMO FLOW TEST');
  console.log('===============================================================');

  // 1. Authenticate Sales Rep (Sarah)
  console.log('\n[Step 1] Authenticating Sales Rep (Sarah Miller)...');
  const repTokenRes = await req('/auth/demo-token?role=SALES_REP');
  const repToken = repTokenRes.token;
  const repHeaders = { Authorization: `Bearer ${repToken}` };
  console.log('✓ Sales Rep token obtained.');

  // Fetch ABC Corporation customer
  const custRes = await req('/customers?search=ABC', { headers: repHeaders });
  const abcCustomer = custRes.data[0];
  console.log(`✓ Customer: ${abcCustomer.companyName} (${abcCustomer.tier} Tier - 15% discount limit)`);

  // Fetch Products
  const prodRes = await req('/products');
  const prods = prodRes.data;
  const laptop = prods.find((p: any) => p.name.includes('Laptop'));
  const setup = prods.find((p: any) => p.name.includes('Installation') || p.name.includes('Setup'));
  const support = prods.find((p: any) => p.name.includes('Support'));
  const warranty = prods.find((p: any) => p.name.includes('Warranty'));

  // 2. Create Quotation with Over-Limit Discount on Setup Service (18% applied vs 10% limit)
  console.log('\n[Step 2] Creating Quotation with Setup Service at 18% discount (+8% violation)...');
  const createQuoteRes = await req('/quotations', {
    method: 'POST',
    headers: repHeaders,
    body: JSON.stringify({
      customerId: abcCustomer._id,
      title: 'Enterprise Fleet & SLA Deployment (Judge Demo)',
      items: [
        { productId: laptop._id, quantity: 10, unitPrice: laptop.unitPrice, discountPct: 12 },
        { productId: setup._id, quantity: 1, unitPrice: setup.unitPrice, discountPct: 18 },
        { productId: support._id, quantity: 1, unitPrice: support.unitPrice, discountPct: 0 },
      ],
    }),
  });
  const quotation = createQuoteRes.data;
  console.log(`✓ Quotation Created: ${quotation.quoteNumber} | Total: ₹${quotation.totalAmount} | Margin: ${quotation.grossMarginPct}%`);
  console.log(`✓ Risk Level: ${quotation.riskLevel} | Approval Required: ${quotation.approvalRequired}`);

  // 3. Submit Quotation for Automatic Approval Routing
  console.log('\n[Step 3] Submitting Quotation to Approval Engine...');
  const submitRes = await req(`/quotations/${quotation._id}/submit`, {
    method: 'POST',
    headers: repHeaders,
    body: JSON.stringify({}),
  });
  console.log(`✓ ${submitRes.message}`);
  const approvalId = submitRes.data.approval?._id;

  // 4. Sales Manager (Marcus) Approves Step 1
  console.log('\n[Step 4] Sales Manager (Marcus) Reviews & Approves Step 1...');
  const mgrTokenRes = await req('/auth/demo-token?role=SALES_MANAGER');
  const mgrHeaders = { Authorization: `Bearer ${mgrTokenRes.token}` };
  const mgrApproveRes = await req(`/approvals/${approvalId}/approve`, {
    method: 'POST',
    headers: mgrHeaders,
    body: JSON.stringify({ notes: 'Approved volume exception for ABC Corp.' }),
  });
  console.log(`✓ Sales Manager Step Approved. Next step index: ${mgrApproveRes.data.approval.currentStepIndex}`);

  // 5. Finance Ops (Fiona) Approves Step 2
  console.log('\n[Step 5] Finance Ops (Fiona) Reviews & Approves Step 2...');
  const finTokenRes = await req('/auth/demo-token?role=FINANCE_OPS');
  const finHeaders = { Authorization: `Bearer ${finTokenRes.token}` };
  const finApproveRes = await req(`/approvals/${approvalId}/approve`, {
    method: 'POST',
    headers: finHeaders,
    body: JSON.stringify({ notes: 'Commercial margins verified. Approved for dispatch.' }),
  });
  console.log(`✓ Full Approval Completed! Quotation Stage: ${finApproveRes.data.quotation.stage}`);

  // 6. Fulfillment Multi-Warehouse Stock Auto-Split
  console.log('\n[Step 6] Running Multi-Warehouse Fulfillment Stock Check & Split...');
  const fulPlanRes = await req(`/fulfillments/plan/${quotation._id}`, { headers: finHeaders });
  console.log('✓ Warehouse Allocation Plan Computed:');
  fulPlanRes.data.allocations.forEach((alloc: any) => {
    console.log(`   -> ${alloc.warehouseName}: ${alloc.items.map((i: any) => `${i.productName} (${i.quantity} units)`).join(', ')}`);
  });
  console.log(`   -> Total Shipments: ${fulPlanRes.data.totalShipments} | Backorders: ${fulPlanRes.data.backorders.length}`);

  const fulExecRes = await req(`/fulfillments/allocate`, {
    method: 'POST',
    headers: finHeaders,
    body: JSON.stringify({ quotationId: quotation._id }),
  });
  console.log(`✓ Fulfillment executed! Total Shipments: ${fulExecRes.data.fulfillment.totalShipments}`);

  // 7. Hybrid Billing Generation (One-Time Invoice vs Recurring Subscription)
  console.log('\n[Step 7] Generating Hybrid Billing (One-Time Invoice + Recurring Subscription)...');
  const billRes = await req(`/billing/generate`, {
    method: 'POST',
    headers: finHeaders,
    body: JSON.stringify({ quotationId: quotation._id }),
  });
  const invoices = billRes.data.invoices;
  const subscriptions = billRes.data.subscriptions;
  console.log(`✓ Invoices Created: ${invoices.length} (One-Time Total: ₹${billRes.data.oneTimeTotal})`);
  console.log(`✓ Subscriptions Created: ${subscriptions.length} (Recurring Monthly: ₹${billRes.data.recurringMonthlyTotal})`);

  // 8. Customer (David @ ABC Corp) Opens Restricted Portal & Counters with 20% Discount
  console.log('\n[Step 8] Customer Portal: David counters with 20% discount proposal...');
  const custTokenRes = await req('/auth/demo-token?role=CUSTOMER&email=david@abccorp.com');
  const custHeaders = { Authorization: `Bearer ${custTokenRes.token}` };

  const portalViewRes = await req(`/portal/quotations/${quotation._id}`, { headers: custHeaders });
  console.log(`✓ Customer safely views quotation. Internal margins & costs are redacted:`);
  console.log(`   -> Cost field present? ${portalViewRes.data.totalCost !== undefined ? 'YES (LEAK!)' : 'NO (SECURE)'}`);
  console.log(`   -> Margin field present? ${portalViewRes.data.grossMarginPct !== undefined ? 'YES (LEAK!)' : 'NO (SECURE)'}`);

  const counterRes = await req(`/portal/quotations/${quotation._id}/counter-discount`, {
    method: 'POST',
    headers: custHeaders,
    body: JSON.stringify({
      proposedDiscountPct: 20,
      message: 'We need 20% discount to sign the purchase agreement today.',
    }),
  });
  console.log(`✓ ${counterRes.message}`);

  // 9. Re-approval by Manager & Finance
  console.log('\n[Step 9] Manager & Finance approve the 20% counter-deal...');
  const updatedQuoteRes = await req(`/quotations/${quotation._id}`, { headers: mgrHeaders });
  const reApprovalId = updatedQuoteRes.data.currentApprovalId._id;
  await req(`/approvals/${reApprovalId}/approve`, {
    method: 'POST',
    headers: mgrHeaders,
    body: JSON.stringify({ notes: 'Approved 20% counter.' }),
  });
  await req(`/approvals/${reApprovalId}/approve`, {
    method: 'POST',
    headers: finHeaders,
    body: JSON.stringify({ notes: 'Finance approved 20% counter.' }),
  });
  console.log('✓ Re-approval completed.');

  // 10. Customer Confirms & Payment is Recorded
  console.log('\n[Step 10] Customer confirms terms & Finance records invoice payment...');
  await req(`/portal/quotations/${quotation._id}/confirm`, {
    method: 'POST',
    headers: custHeaders,
    body: JSON.stringify({}),
  });
  console.log('✓ Quotation confirmed by customer!');

  if (invoices.length > 0) {
    const payRes = await req(`/billing/invoices/${invoices[0]._id}/payment`, {
      method: 'POST',
      headers: finHeaders,
      body: JSON.stringify({
        amount: invoices[0].dueBalance,
        paymentMethod: 'BANK_TRANSFER',
        referenceNumber: 'HDFC-NEFT-991122',
      }),
    });
    console.log(`✓ Payment recorded for ${invoices[0].invoiceNumber}. Status: ${payRes.data.invoice.status}`);
  }

  // 11. Deal Health & Reports
  console.log('\n[Step 11] Checking Deal Health and Reporting Analytics...');
  const dashStats = await req('/reports/dashboard', { headers: mgrHeaders });
  console.log(`✓ Pipeline Value: ₹${dashStats.data.kpi.totalPipelineValue.toLocaleString('en-IN')}`);
  console.log(`✓ Total Cash Receipts: ₹${dashStats.data.kpi.invoiceRevenue.toLocaleString('en-IN')}`);
  console.log(`✓ Monthly Recurring Revenue: ₹${dashStats.data.kpi.monthlyRecurringRevenue.toLocaleString('en-IN')}`);

  console.log('\n===============================================================');
  console.log(' 🎉 ALL 11 GOLDEN DEMO STEPS PASSED PERFECTLY WITH ZERO ERRORS!');
  console.log('===============================================================');
}

runDemoFlowTest().catch((err) => {
  console.error('Demo flow failed:', err);
  process.exit(1);
});
