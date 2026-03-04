const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/payments/:accountId — payment history
router.get('/:accountId', (req, res) => {
  const { accountId } = req.params;

  const payments = db.prepare(`
    SELECT p.*, t.gross_amount, t.term_months
    FROM payments p
    LEFT JOIN tranches t ON t.id = p.tranche_id
    WHERE p.credit_account_id = ?
    ORDER BY p.applied_at DESC
    LIMIT 50
  `).all(accountId);

  res.json(payments);
});

// POST /api/payments — record payment, mark installments paid, update wallet
router.post('/', (req, res) => {
  const { credit_account_id, amount_cents } = req.body;

  if (!credit_account_id || !amount_cents) {
    return res.status(400).json({ error: 'credit_account_id and amount_cents are required' });
  }

  const makePayment = db.transaction(() => {
    // Get active tranche
    const activeTranche = db.prepare(`
      SELECT * FROM tranches WHERE credit_account_id = ? AND status = 'ACTIVE' LIMIT 1
    `).get(credit_account_id);

    if (!activeTranche) throw new Error('No active tranche found');

    // Get wallet
    const account = db.prepare(`SELECT * FROM credit_accounts WHERE id = ?`).get(credit_account_id);
    const walletAccount = db.prepare(`
      SELECT * FROM wallet_accounts WHERE customer_id = ?
    `).get(account.customer_id);

    if (!walletAccount) throw new Error('Wallet not found');
    if (walletAccount.balance_cents < amount_cents) {
      throw new Error('Insufficient wallet balance');
    }

    // Waterfall: mark installments paid
    const unpaid = db.prepare(`
      SELECT * FROM tranche_schedules
      WHERE tranche_id = ? AND paid = 0
      ORDER BY installment_no ASC
    `).all(activeTranche.id);

    let remaining = amount_cents;
    let installmentsPaid = 0;

    for (const row of unpaid) {
      if (remaining >= row.total_cents) {
        db.prepare(`
          UPDATE tranche_schedules SET paid = 1, paid_at = datetime('now') WHERE id = ?
        `).run(row.id);
        remaining -= row.total_cents;
        installmentsPaid++;
      } else {
        break; // partial payment — don't mark row paid
      }
    }

    // Record payment
    const payment = db.prepare(`
      INSERT INTO payments (credit_account_id, tranche_id, amount_cents, payment_type)
      VALUES (?, ?, ?, 'INSTALLMENT')
    `).run(credit_account_id, activeTranche.id, amount_cents);

    // Debit wallet
    db.prepare(`
      UPDATE wallet_accounts SET balance_cents = balance_cents - ? WHERE id = ?
    `).run(amount_cents, walletAccount.id);

    db.prepare(`
      INSERT INTO wallet_ledger (wallet_account_id, amount_cents, description, ref_type, ref_id)
      VALUES (?, ?, 'Loan payment', 'PAYMENT', ?)
    `).run(walletAccount.id, -amount_cents, payment.lastInsertRowid);

    // Check if all installments paid → close tranche
    const remaining_unpaid = db.prepare(`
      SELECT COUNT(*) as cnt FROM tranche_schedules WHERE tranche_id = ? AND paid = 0
    `).get(activeTranche.id);

    if (remaining_unpaid.cnt === 0) {
      db.prepare(`
        UPDATE tranches SET status = 'CLOSED', closed_at = datetime('now') WHERE id = ?
      `).run(activeTranche.id);
    }

    return {
      payment_id: payment.lastInsertRowid,
      installments_paid: installmentsPaid,
      new_wallet_balance_cents: walletAccount.balance_cents - amount_cents,
    };
  });

  try {
    const result = makePayment();
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
