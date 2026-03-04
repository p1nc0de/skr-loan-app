const express = require('express');
const router = express.Router();
const db = require('../db');
const { generateSchedule, calcMonthlyPayment } = require('../utils/finance');

// GET /api/tranches/:accountId — all tranches with their schedules
router.get('/:accountId', (req, res) => {
  const { accountId } = req.params;

  const tranches = db.prepare(`
    SELECT * FROM tranches
    WHERE credit_account_id = ?
    ORDER BY disbursed_at ASC
  `).all(accountId);

  const result = tranches.map(t => {
    const schedules = db.prepare(`
      SELECT * FROM tranche_schedules
      WHERE tranche_id = ?
      ORDER BY installment_no ASC
    `).all(t.id);
    return { ...t, schedules };
  });

  res.json(result);
});

// GET /api/tranches/:accountId/active — active tranche + schedule
router.get('/:accountId/active', (req, res) => {
  const { accountId } = req.params;

  const tranche = db.prepare(`
    SELECT * FROM tranches
    WHERE credit_account_id = ? AND status = 'ACTIVE'
    LIMIT 1
  `).get(accountId);

  if (!tranche) return res.json(null);

  const schedules = db.prepare(`
    SELECT * FROM tranche_schedules
    WHERE tranche_id = ?
    ORDER BY installment_no ASC
  `).all(tranche.id);

  res.json({ ...tranche, schedules });
});

// POST /api/tranches/refuel — atomic: settle old tranche, open new one
router.post('/refuel', (req, res) => {
  const { account_id, gross_amount_cents, apr_bps = 1800, term_months = 12 } = req.body;

  if (!account_id || !gross_amount_cents) {
    return res.status(400).json({ error: 'account_id and gross_amount_cents are required' });
  }

  const refuel = db.transaction(() => {
    // Get wallet account
    const account = db.prepare(`SELECT * FROM credit_accounts WHERE id = ?`).get(account_id);
    if (!account) throw new Error('Account not found');

    const walletAccount = db.prepare(`
      SELECT * FROM wallet_accounts WHERE customer_id = ?
    `).get(account.customer_id);
    if (!walletAccount) throw new Error('Wallet not found');

    // Check if there's an active tranche to settle
    const activeTranche = db.prepare(`
      SELECT * FROM tranches WHERE credit_account_id = ? AND status = 'ACTIVE'
    `).get(account_id);

    if (activeTranche) {
      // Calculate outstanding
      const unpaidRows = db.prepare(`
        SELECT * FROM tranche_schedules WHERE tranche_id = ? AND paid = 0
      `).all(activeTranche.id);

      const outstandingCents = unpaidRows.reduce((sum, r) => sum + r.total_cents, 0);

      if (outstandingCents > 0) {
        // Record settlement payment
        db.prepare(`
          INSERT INTO payments (credit_account_id, tranche_id, amount_cents, payment_type)
          VALUES (?, ?, ?, 'SETTLEMENT')
        `).run(account_id, activeTranche.id, outstandingCents);

        // Mark all unpaid rows paid
        db.prepare(`
          UPDATE tranche_schedules SET paid = 1, paid_at = datetime('now')
          WHERE tranche_id = ? AND paid = 0
        `).run(activeTranche.id);
      }

      // Close old tranche
      db.prepare(`
        UPDATE tranches SET status = 'SETTLED', closed_at = datetime('now') WHERE id = ?
      `).run(activeTranche.id);
    }

    // Insert new tranche
    const now = new Date().toISOString().split('T')[0];
    const newTranche = db.prepare(`
      INSERT INTO tranches (credit_account_id, status, gross_amount, apr_bps, term_months, disbursed_at)
      VALUES (?, 'ACTIVE', ?, ?, ?, ?)
    `).run(account_id, gross_amount_cents, apr_bps, term_months, now);
    const newTrancheId = newTranche.lastInsertRowid;

    // Generate and insert schedule
    const schedule = generateSchedule(gross_amount_cents, apr_bps, term_months, now);
    const insertSched = db.prepare(`
      INSERT INTO tranche_schedules (tranche_id, installment_no, due_date, principal_cents, interest_cents, total_cents)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    for (const row of schedule) {
      insertSched.run(newTrancheId, row.installment_no, row.due_date, row.principal_cents, row.interest_cents, row.total_cents);
    }

    // Disburse to wallet
    db.prepare(`
      INSERT INTO wallet_ledger (wallet_account_id, amount_cents, description, ref_type, ref_id)
      VALUES (?, ?, 'Tranche disbursal', 'TRANCHE_DISBURSE', ?)
    `).run(walletAccount.id, gross_amount_cents, newTrancheId);

    db.prepare(`
      UPDATE wallet_accounts SET balance_cents = balance_cents + ? WHERE id = ?
    `).run(gross_amount_cents, walletAccount.id);

    return {
      tranche_id: newTrancheId,
      gross_amount_cents,
      monthly_payment_cents: calcMonthlyPayment(gross_amount_cents, apr_bps, term_months),
    };
  });

  try {
    const result = refuel();
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
