import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { CUSTOMER_ID, ACCOUNT_ID } from '../App';
import LoadingSpinner from '../components/LoadingSpinner';
import { fmtMYR } from '../components/AmountDisplay';

const APR_BPS = 1800;
const TERM_MONTHS = 12;
const ORIGINATION_FEE_PCT = 0.02;

function calcMonthlyPayment(principalCents, aprBps, termMonths) {
  const r = (aprBps / 10000) / 12;
  if (r === 0) return Math.ceil(principalCents / termMonths);
  const factor = Math.pow(1 + r, termMonths);
  return Math.ceil(principalCents * r * factor / (factor - 1));
}

export default function RefuelScreen() {
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [eSigned, setESigned] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    api.getAccount(CUSTOMER_ID)
      .then(setAccount)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="screen"><LoadingSpinner /></div>;
  if (!account) return <div className="screen"><div className="p-20 text-secondary">Failed to load.</div></div>;

  const grossCents = account.approved_limit_cents - account.available_cents;
  const feeCents = Math.round(grossCents * ORIGINATION_FEE_PCT);
  const netCents = grossCents - feeCents;
  const monthlyPaymentCents = calcMonthlyPayment(grossCents, APR_BPS, TERM_MONTHS);

  const handleConfirm = async () => {
    if (!eSigned) return;
    setSubmitting(true);
    setError('');
    try {
      await api.refuel({
        account_id: ACCOUNT_ID,
        gross_amount_cents: grossCents,
        apr_bps: APR_BPS,
        term_months: TERM_MONTHS,
      });
      navigate('/home');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="screen">
      <div className="screen-header" style={{ marginBottom: 16 }}>
        <h1 className="screen-title">Refuel</h1>
        <p className="screen-subtitle">Draw from your available credit line</p>
      </div>

      <div style={{ padding: '0 20px' }}>
        {/* Breakdown */}
        <div className="card">
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Loan Summary
          </p>

          <div className="list-row">
            <span className="text-sm text-secondary">Gross Amount</span>
            <span className="font-semibold text-sm">MYR {fmtMYR(grossCents)}</span>
          </div>
          <div className="list-row">
            <span className="text-sm text-secondary">Origination Fee (2%)</span>
            <span className="font-semibold text-sm" style={{ color: 'var(--danger)' }}>− MYR {fmtMYR(feeCents)}</span>
          </div>
          <div className="list-row" style={{ borderBottom: '2px solid var(--border)' }}>
            <span className="text-sm text-secondary">Net to Wallet</span>
            <span className="font-bold" style={{ color: 'var(--success)', fontSize: 16 }}>MYR {fmtMYR(netCents)}</span>
          </div>

          <div style={{ marginTop: 12, background: 'var(--surface-2)', borderRadius: 10, padding: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p className="text-sm text-secondary font-semibold">Monthly Payment</p>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>18% APR · {TERM_MONTHS} months</p>
              </div>
              <p style={{ fontSize: 22, fontWeight: 800, color: 'var(--primary)' }}>
                MYR {fmtMYR(monthlyPaymentCents)}
              </p>
            </div>
          </div>
        </div>

        {/* E-sign */}
        <div className="card mt-12">
          <label className="checkbox-row" style={{ cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={eSigned}
              onChange={e => setESigned(e.target.checked)}
            />
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>I agree to the Loan Agreement</p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                I confirm this drawdown of MYR {fmtMYR(grossCents)} at 18% APR over {TERM_MONTHS} months,
                with monthly payments of MYR {fmtMYR(monthlyPaymentCents)}.
              </p>
            </div>
          </label>
        </div>

        {error && (
          <div style={{
            marginTop: 12,
            padding: '12px 16px',
            background: '#FEE2E2',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--danger)',
            fontSize: 13,
          }}>
            {error}
          </div>
        )}

        <button
          className="btn btn-primary btn-block mt-16"
          style={{ marginBottom: 20 }}
          disabled={!eSigned || submitting}
          onClick={handleConfirm}
        >
          {submitting ? 'Processing...' : `Confirm Refuel — MYR ${fmtMYR(grossCents)}`}
        </button>
      </div>
    </div>
  );
}
