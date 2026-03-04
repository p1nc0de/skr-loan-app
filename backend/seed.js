const db = require('./db');
const { generateSchedule } = require('./utils/finance');

// Only seed if DB is empty
const existing = db.prepare('SELECT COUNT(*) as cnt FROM customers').get();
if (existing.cnt > 0) {
  console.log('DB already seeded, skipping.');
  process.exit(0);
}

const insertCustomer = db.prepare(`INSERT INTO customers (name, risk_segment) VALUES (?, ?)`);
const insertAccount = db.prepare(`INSERT INTO credit_accounts (customer_id, approved_limit, status) VALUES (?, ?, ?)`);
const insertTranche = db.prepare(`INSERT INTO tranches (credit_account_id, status, gross_amount, apr_bps, term_months, disbursed_at, closed_at) VALUES (?, ?, ?, ?, ?, ?, ?)`);
const insertSchedule = db.prepare(`INSERT INTO tranche_schedules (tranche_id, installment_no, due_date, principal_cents, interest_cents, total_cents, paid, paid_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
const insertPayment = db.prepare(`INSERT INTO payments (credit_account_id, tranche_id, amount_cents, payment_type, applied_at) VALUES (?, ?, ?, ?, ?)`);
const insertWallet = db.prepare(`INSERT INTO wallet_accounts (customer_id, balance_cents) VALUES (?, ?)`);
const insertLedger = db.prepare(`INSERT INTO wallet_ledger (wallet_account_id, amount_cents, description, ref_type, ref_id, created_at) VALUES (?, ?, ?, ?, ?, ?)`);

const seed = db.transaction(() => {
  // Customer
  const custResult = insertCustomer.run('Ahmad Razif', 'STANDARD');
  const customerId = custResult.lastInsertRowid;

  // Credit account: 10,000 MYR = 1,000,000 cents
  const accResult = insertAccount.run(customerId, 1000000, 'ACTIVE');
  const accountId = accResult.lastInsertRowid;

  const APR_BPS = 1800; // 18%

  // Tranche 1: CLOSED, 300,000 cents, 6 months, disbursed 18 months ago
  const t1DisbursedAt = '2024-09-01';
  const t1Result = insertTranche.run(accountId, 'CLOSED', 300000, APR_BPS, 6, t1DisbursedAt, '2025-03-15');
  const t1Id = t1Result.lastInsertRowid;
  const t1Schedule = generateSchedule(300000, APR_BPS, 6, t1DisbursedAt);
  let t1Total = 0;
  for (const row of t1Schedule) {
    insertSchedule.run(t1Id, row.installment_no, row.due_date, row.principal_cents, row.interest_cents, row.total_cents, 1, '2025-03-10');
    t1Total += row.total_cents;
  }

  // Tranche 2: CLOSED, 500,000 cents, 6 months, disbursed 12 months ago
  const t2DisbursedAt = '2025-03-15';
  const t2Result = insertTranche.run(accountId, 'CLOSED', 500000, APR_BPS, 6, t2DisbursedAt, '2025-09-20');
  const t2Id = t2Result.lastInsertRowid;
  const t2Schedule = generateSchedule(500000, APR_BPS, 6, t2DisbursedAt);
  let t2Total = 0;
  for (const row of t2Schedule) {
    insertSchedule.run(t2Id, row.installment_no, row.due_date, row.principal_cents, row.interest_cents, row.total_cents, 1, '2025-09-15');
    t2Total += row.total_cents;
  }

  // Tranche 3: ACTIVE, 700,000 cents, 12 months, disbursed 3 months ago
  const t3DisbursedAt = '2025-12-01';
  const t3Result = insertTranche.run(accountId, 'ACTIVE', 700000, APR_BPS, 12, t3DisbursedAt, null);
  const t3Id = t3Result.lastInsertRowid;
  const t3Schedule = generateSchedule(700000, APR_BPS, 12, t3DisbursedAt);
  for (let i = 0; i < t3Schedule.length; i++) {
    const row = t3Schedule[i];
    const isPaid = i < 3 ? 1 : 0;
    const paidAt = i < 3 ? `2026-0${i + 1}-10` : null;
    insertSchedule.run(t3Id, row.installment_no, row.due_date, row.principal_cents, row.interest_cents, row.total_cents, isPaid, paidAt);
  }

  // Payments for tranche 3 (3 monthly payments)
  insertPayment.run(accountId, t3Id, t3Schedule[0].total_cents, 'INSTALLMENT', '2026-01-10');
  insertPayment.run(accountId, t3Id, t3Schedule[1].total_cents, 'INSTALLMENT', '2026-02-10');
  insertPayment.run(accountId, t3Id, t3Schedule[2].total_cents, 'INSTALLMENT', '2026-03-01');

  // Wallet: 400,000 cents = MYR 4,000 starting balance
  const walletResult = insertWallet.run(customerId, 400000);
  const walletId = walletResult.lastInsertRowid;

  // Wallet ledger entries
  insertLedger.run(walletId, 700000, 'Tranche disbursal', 'TRANCHE_DISBURSE', t3Id, '2025-12-01');
  insertLedger.run(walletId, -t3Schedule[0].total_cents, 'Installment 1 payment', 'PAYMENT', 1, '2026-01-10');
  insertLedger.run(walletId, -t3Schedule[1].total_cents, 'Installment 2 payment', 'PAYMENT', 2, '2026-02-10');
  insertLedger.run(walletId, -t3Schedule[2].total_cents, 'Installment 3 payment', 'PAYMENT', 3, '2026-03-01');
});

seed();
console.log('Seed complete. skyro.db is ready.');
