const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/wallet/:customerId — balance + recent ledger
router.get('/:customerId', (req, res) => {
  const { customerId } = req.params;

  const walletAccount = db.prepare(`
    SELECT * FROM wallet_accounts WHERE customer_id = ?
  `).get(customerId);

  if (!walletAccount) return res.status(404).json({ error: 'Wallet not found' });

  const ledger = db.prepare(`
    SELECT * FROM wallet_ledger
    WHERE wallet_account_id = ?
    ORDER BY created_at DESC
    LIMIT 20
  `).all(walletAccount.id);

  res.json({
    wallet_id: walletAccount.id,
    customer_id: Number(customerId),
    balance_cents: walletAccount.balance_cents,
    ledger,
  });
});

// POST /api/wallet/topup — add funds to wallet (for testing)
router.post('/topup', (req, res) => {
  const { customer_id, amount_cents } = req.body;

  if (!customer_id || !amount_cents) {
    return res.status(400).json({ error: 'customer_id and amount_cents are required' });
  }

  const topup = db.transaction(() => {
    const walletAccount = db.prepare(`
      SELECT * FROM wallet_accounts WHERE customer_id = ?
    `).get(customer_id);

    if (!walletAccount) throw new Error('Wallet not found');

    db.prepare(`
      UPDATE wallet_accounts SET balance_cents = balance_cents + ? WHERE id = ?
    `).run(amount_cents, walletAccount.id);

    db.prepare(`
      INSERT INTO wallet_ledger (wallet_account_id, amount_cents, description, ref_type)
      VALUES (?, ?, 'Wallet top-up', 'TOPUP')
    `).run(walletAccount.id, amount_cents);

    return { new_balance_cents: walletAccount.balance_cents + amount_cents };
  });

  try {
    const result = topup();
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
