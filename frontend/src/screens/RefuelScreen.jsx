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

  // Gross inflated so net disbursed = outstanding exactly
  const outstandingCents = account.approved_limit_cents - account.available_cents;
  const grossCents = Math.ceil(outstandingCents / (1 - ORIGINATION_FEE_PCT));
  const netCents = grossCents - Math.round(grossCents * ORIGINATION_FEE_PCT);
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
        {/* Net to Wallet */}
        <div className="card" style={{ textAlign: 'center', padding: '28px 20px' }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 8 }}>Net to Wallet</p>
          <p style={{ fontSize: 44, fontWeight: 800, color: 'var(--success)', letterSpacing: '-1px' }}>
            <span style={{ fontSize: 18, fontWeight: 600, opacity: 0.7, marginRight: 4 }}>MYR</span>
            {fmtMYR(netCents)}
          </p>
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
