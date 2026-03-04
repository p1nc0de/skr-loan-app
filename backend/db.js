const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'skyro.db');

const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    risk_segment TEXT NOT NULL DEFAULT 'STANDARD',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS credit_accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL REFERENCES customers(id),
    approved_limit INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS tranches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    credit_account_id INTEGER NOT NULL REFERENCES credit_accounts(id),
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    gross_amount INTEGER NOT NULL,
    apr_bps INTEGER NOT NULL,
    term_months INTEGER NOT NULL,
    disbursed_at TEXT NOT NULL DEFAULT (datetime('now')),
    closed_at TEXT
  );

  CREATE TABLE IF NOT EXISTS tranche_schedules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tranche_id INTEGER NOT NULL REFERENCES tranches(id),
    installment_no INTEGER NOT NULL,
    due_date TEXT NOT NULL,
    principal_cents INTEGER NOT NULL,
    interest_cents INTEGER NOT NULL,
    total_cents INTEGER NOT NULL,
    paid INTEGER NOT NULL DEFAULT 0,
    paid_at TEXT
  );

  CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    credit_account_id INTEGER NOT NULL REFERENCES credit_accounts(id),
    tranche_id INTEGER,
    amount_cents INTEGER NOT NULL,
    payment_type TEXT NOT NULL,
    applied_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS wallet_accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL REFERENCES customers(id),
    balance_cents INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS wallet_ledger (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    wallet_account_id INTEGER NOT NULL REFERENCES wallet_accounts(id),
    amount_cents INTEGER NOT NULL,
    description TEXT NOT NULL,
    ref_type TEXT,
    ref_id INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

module.exports = db;
