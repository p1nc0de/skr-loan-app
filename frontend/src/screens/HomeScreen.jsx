import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { CUSTOMER_ID } from '../App';
import LoadingSpinner from '../components/LoadingSpinner';
import AmountDisplay, { fmtMYR } from '../components/AmountDisplay';

export default function HomeScreen() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.getAccount(CUSTOMER_ID)
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="screen"><LoadingSpinner /></div>;
  if (!data) return <div className="screen"><div className="p-20 text-secondary">Failed to load account.</div></div>;

  const outstandingCents = data.approved_limit_cents - data.available_cents;

  return (
    <div className="screen">
      {/* Header */}
      <div style={{ padding: '20px 20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <p className="text-sm text-muted font-semibold" style={{ textTransform: 'uppercase', letterSpacing: '1px' }}>Welcome back</p>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>{data.customer_name}</h1>
        </div>
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          background: 'var(--primary)', color: 'white',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 700, fontSize: 16,
        }}>
          {data.customer_name[0]}
        </div>
      </div>

      {/* Credit Card */}
      <div style={{ padding: '16px 20px' }}>
        <div className="credit-card">
          {/* Available — hero number */}
          <div style={{ marginBottom: 24 }}>
            <p style={{ fontSize: 11, fontWeight: 600, opacity: 0.65, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 2 }}>Available</p>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 600, opacity: 0.75, marginTop: 10, lineHeight: 1 }}>MYR</span>
              <span style={{ fontSize: 52, fontWeight: 800, letterSpacing: '-2px', lineHeight: 1 }}>
                {fmtMYR(data.available_cents)}
              </span>
            </div>
          </div>

          {/* Credit utilization progress bar */}
          {(() => {
            const usedPct = data.approved_limit_cents > 0
              ? Math.min(100, (outstandingCents / data.approved_limit_cents) * 100)
              : 0;
            return (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, opacity: 0.7 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Used</span>
                  <span style={{ fontSize: 11, fontWeight: 600 }}>MYR {fmtMYR(data.approved_limit_cents)} limit</span>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 100, height: 6, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${usedPct}%`,
                    background: usedPct > 80 ? '#FF6B6B' : 'rgba(255,255,255,0.85)',
                    borderRadius: 100,
                    transition: 'width 0.5s ease',
                  }} />
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Next Payment Info */}
      {data.next_due_date && (
        <div style={{ padding: '0 20px' }}>
          <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p className="text-sm text-muted font-semibold">Next Payment Due</p>
              <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>
                {new Date(data.next_due_date + 'T00:00:00').toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p className="text-sm text-muted font-semibold">Min Payment</p>
              <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--primary)', marginTop: 2 }}>
                MYR {fmtMYR(data.min_payment_cents)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div style={{ padding: '12px 20px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Refuel — primary CTA */}
        <button
          onClick={() => navigate('/refuel')}
          style={{
            width: '100%',
            background: 'var(--text-primary)',
            border: 'none',
            borderRadius: 14,
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            transition: 'opacity 0.15s',
          }}
          onMouseDown={e => e.currentTarget.style.opacity = '0.85'}
          onMouseUp={e => e.currentTarget.style.opacity = '1'}
        >
          <span style={{ color: 'var(--bg)', fontSize: 17, fontWeight: 700 }}>⚡ Refuel Now</span>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
            <span style={{ color: 'var(--bg)', fontSize: 12, opacity: 0.6, fontWeight: 600 }}>up to MYR {fmtMYR(data.available_cents)}</span>
            <span style={{ color: 'var(--bg)', fontSize: 17, opacity: 0.5 }}>→</span>
          </div>
        </button>

        {/* Pay + Statements */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <button className="quick-action" onClick={() => navigate('/payment')}>
            <div className="quick-action-icon" style={{ background: '#F0FDF4' }}>💳</div>
            <span>Pay</span>
          </button>
          <button className="quick-action" onClick={() => navigate('/statements')}>
            <div className="quick-action-icon" style={{ background: '#FFF7ED' }}>📄</div>
            <span>Statements</span>
          </button>
        </div>
      </div>

      {/* Account info */}
      <div style={{ padding: '0 20px 20px' }}>
        <div className="card">
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Account Details</p>
          <div className="list-row">
            <span className="text-sm text-secondary">Segment</span>
            <span className="font-semibold text-sm">{data.risk_segment}</span>
          </div>
          <div className="list-row">
            <span className="text-sm text-secondary">Account ID</span>
            <span className="font-semibold text-sm">#{String(data.account_id).padStart(6, '0')}</span>
          </div>
          <div className="list-row">
            <span className="text-sm text-secondary">Status</span>
            <span className="badge badge-active">Active</span>
          </div>
        </div>
      </div>
    </div>
  );
}
