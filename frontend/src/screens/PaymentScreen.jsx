import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { CUSTOMER_ID, ACCOUNT_ID } from '../App';
import LoadingSpinner from '../components/LoadingSpinner';
import { fmtMYR } from '../components/AmountDisplay';

export default function PaymentScreen() {
  const [account, setAccount] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [activeTranche, setActiveTranche] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState('min'); // 'min' | 'custom'
  const [customMYR, setCustomMYR] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      api.getAccount(CUSTOMER_ID),
      api.getWallet(CUSTOMER_ID),
      api.getActiveTranche(ACCOUNT_ID),
    ]).then(([acc, wal, tranche]) => {
      setAccount(acc);
      setWallet(wal);
      setActiveTranche(tranche);
    }).finally(() => setLoading(false));
  };

  useEffect(fetchData, []);

  if (loading) return <div className="screen"><LoadingSpinner /></div>;
  if (!account || !activeTranche) {
    return (
      <div className="screen">
        <div style={{ padding: 20 }}>
          <div className="card text-center" style={{ padding: '40px 20px' }}>
            <p style={{ fontSize: 32, marginBottom: 12 }}>✓</p>
            <p style={{ fontWeight: 600 }}>No outstanding balance</p>
            <p className="text-sm text-muted mt-8">All caught up! Refuel to draw more credit.</p>
          </div>
        </div>
      </div>
    );
  }

  const unpaid = activeTranche.schedules.filter(s => !s.paid);
  const minPaymentCents = unpaid.length > 0 ? unpaid[0].total_cents : 0;
  const totalOutstanding = unpaid.reduce((sum, s) => sum + s.total_cents, 0);

  const payAmountCents = mode === 'min'
    ? minPaymentCents
    : Math.round((parseFloat(customMYR) || 0) * 100);

  // Waterfall simulation: which rows will be marked paid
  let simRemaining = payAmountCents;
  const simRows = unpaid.map(row => {
    if (simRemaining >= row.total_cents) {
      simRemaining -= row.total_cents;
      return { ...row, willPay: true };
    }
    return { ...row, willPay: false };
  });

  const canPay = payAmountCents > 0
    && payAmountCents <= totalOutstanding
    && wallet && payAmountCents <= wallet.balance_cents;

  const handlePay = async () => {
    if (!canPay) return;
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      const result = await api.makePayment({
        credit_account_id: ACCOUNT_ID,
        amount_cents: payAmountCents,
      });
      setSuccess(`Payment of MYR ${fmtMYR(payAmountCents)} successful! ${result.installments_paid} installment(s) marked paid.`);
      fetchData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="screen">
      <div className="screen-header" style={{ marginBottom: 16 }}>
        <h1 className="screen-title">Make Payment</h1>
        <p className="screen-subtitle">Pay your loan installments</p>
      </div>

      <div style={{ padding: '0 20px' }}>
        {/* Wallet balance */}
        <div className="card" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="text-sm text-secondary font-semibold">Wallet Balance</span>
            <span style={{ fontSize: 18, fontWeight: 700, color: wallet && wallet.balance_cents < minPaymentCents ? 'var(--danger)' : 'var(--success)' }}>
              MYR {wallet ? fmtMYR(wallet.balance_cents) : '—'}
            </span>
          </div>
        </div>

        {/* Payment mode toggle */}
        <div className="toggle-group mb-12">
          <button
            className={`toggle-option ${mode === 'min' ? 'active' : ''}`}
            onClick={() => setMode('min')}
          >
            Min Payment
          </button>
          <button
            className={`toggle-option ${mode === 'custom' ? 'active' : ''}`}
            onClick={() => setMode('custom')}
          >
            Custom Amount
          </button>
        </div>

        {mode === 'min' ? (
          <div className="card mb-12" style={{ textAlign: 'center', padding: '24px' }}>
            <p className="text-sm text-muted font-semibold" style={{ marginBottom: 8 }}>Minimum Payment</p>
            <p style={{ fontSize: 36, fontWeight: 800, color: 'var(--primary)', letterSpacing: '-1px' }}>
              <span style={{ fontSize: 18, fontWeight: 600 }}>MYR </span>
              {fmtMYR(minPaymentCents)}
            </p>
            {unpaid.length > 1 && (
              <p className="text-sm text-muted" style={{ marginTop: 8 }}>
                Total outstanding: MYR {fmtMYR(totalOutstanding)}
              </p>
            )}
          </div>
        ) : (
          <div className="card mb-12">
            <p className="text-sm text-secondary font-semibold" style={{ marginBottom: 8 }}>Payment Amount (MYR)</p>
            <input
              type="number"
              className="input"
              placeholder="0.00"
              min="0"
              step="0.01"
              value={customMYR}
              onChange={e => setCustomMYR(e.target.value)}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
              <span className="text-sm text-muted">Min: MYR {fmtMYR(minPaymentCents)}</span>
              <span className="text-sm text-muted">Max: MYR {fmtMYR(totalOutstanding)}</span>
            </div>
          </div>
        )}

        {/* Waterfall preview */}
        {payAmountCents > 0 && (
          <div className="card mb-12">
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Installments to be paid
            </p>
            {simRows.map(row => (
              <div key={row.id} className="list-row" style={{ opacity: row.willPay ? 1 : 0.4 }}>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 500 }}>Installment #{row.installment_no}</p>
                  <p className="text-sm text-muted" style={{ marginTop: 2 }}>
                    Due {new Date(row.due_date + 'T00:00:00').toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: 15, fontWeight: 700 }}>MYR {fmtMYR(row.total_cents)}</p>
                  {row.willPay
                    ? <span className="badge badge-paid" style={{ marginTop: 4 }}>Will Pay</span>
                    : <span className="badge badge-due" style={{ marginTop: 4 }}>Remaining</span>
                  }
                </div>
              </div>
            ))}
          </div>
        )}

        {wallet && payAmountCents > wallet.balance_cents && (
          <div style={{
            padding: '12px 16px',
            background: '#FEE2E2',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--danger)',
            fontSize: 13,
            marginBottom: 12,
          }}>
            Insufficient wallet balance. Please top up your wallet first.
          </div>
        )}

        {error && (
          <div style={{
            padding: '12px 16px',
            background: '#FEE2E2',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--danger)',
            fontSize: 13,
            marginBottom: 12,
          }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{
            padding: '12px 16px',
            background: '#D1FAE5',
            borderRadius: 'var(--radius-sm)',
            color: '#065F46',
            fontSize: 13,
            fontWeight: 500,
            marginBottom: 12,
          }}>
            {success}
          </div>
        )}

        <button
          className="btn btn-primary btn-block"
          style={{ marginBottom: 20 }}
          disabled={!canPay || submitting}
          onClick={handlePay}
        >
          {submitting ? 'Processing...' : `Pay MYR ${payAmountCents > 0 ? fmtMYR(payAmountCents) : '0.00'}`}
        </button>
      </div>
    </div>
  );
}
