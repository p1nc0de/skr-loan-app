const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/accounts/:customerId
router.get('/:customerId', (req, res) => {
  const { customerId } = req.params;

  const account = db.prepare(`
    SELECT ca.*, c.name, c.risk_segment
    FROM credit_accounts ca
    JOIN customers c ON c.id = ca.customer_id
    WHERE ca.customer_id = ?
    LIMIT 1
  `).get(customerId);

  if (!account) return res.status(404).json({ error: 'Account not found' });

  // Outstanding = sum of unpaid schedule totals on ACTIVE tranche
  const activeTranche = db.prepare(`
    SELECT * FROM tranches
    WHERE credit_account_id = ? AND status = 'ACTIVE'
    LIMIT 1
  `).get(account.id);

  let outstandingCents = 0;
  let nextDueDate = null;
  let minPaymentCents = 0;

  if (activeTranche) {
    const unpaid = db.prepare(`
      SELECT * FROM tranche_schedules
      WHERE tranche_id = ? AND paid = 0
      ORDER BY installment_no ASC
    `).all(activeTranche.id);

    outstandingCents = unpaid.reduce((sum, row) => sum + row.total_cents, 0);

    if (unpaid.length > 0) {
      nextDueDate = unpaid[0].due_date;
      minPaymentCents = unpaid[0].total_cents;
    }
  }

  const availableCents = account.approved_limit - outstandingCents;

  res.json({
    account_id: account.id,
    customer_id: Number(customerId),
    customer_name: account.name,
    risk_segment: account.risk_segment,
    approved_limit_cents: account.approved_limit,
    outstanding_cents: outstandingCents,
    available_cents: availableCents,
    next_due_date: nextDueDate,
    min_payment_cents: minPaymentCents,
    active_tranche_id: activeTranche ? activeTranche.id : null,
  });
});

module.exports = router;
