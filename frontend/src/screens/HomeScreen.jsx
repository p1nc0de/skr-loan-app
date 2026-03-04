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
            <p style={{ fontSize: 11, fontWeight: 600, opacity: 0.65, textTransform: 'uppercase', letterSpacing: '1px' }}>Available</p>
            <p style={{ fontSize: 48, fontWeight: 800, marginTop: 4, letterSpacing: '-1.5px', lineHeight: 1.1 }}>
              <span style={{ fontSize: 20, fontWeight: 600, opacity: 0.8, marginRight: 4 }}>MYR</span>
              {fmtMYR(data.available_cents)}
            </p>
          </div>

          {/* Outstanding row */}
          <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 10, padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ fontSize: 11, opacity: 0.7, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Outstanding</p>
            <p style={{ fontSize: 16, fontWeight: 700 }}>MYR {fmtMYR(data.outstanding_cents)}</p>
          </div>
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

      {/* Refuel CTA */}
      <div style={{ padding: '16px 20px 8px' }}>
        <button
          onClick={() => navigate('/refuel')}
          style={{
            width: '100%',
            background: 'var(--primary)',
            border: 'none',
            borderRadius: 16,
            padding: '18px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(96,165,250,0.35)',
            transition: 'transform 0.15s, box-shadow 0.15s',
          }}
          onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
          onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          <div style={{ textAlign: 'left' }}>
            <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 4 }}>
              Available for top-up
            </p>
            <p style={{ color: 'white', fontSize: 24, fontWeight: 800, letterSpacing: '-0.5px' }}>
              MYR {fmtMYR(data.available_cents)}
            </p>
          </div>
          <div style={{
            width: 48, height: 48,
            background: 'rgba(255,255,255,0.2)',
            borderRadius: 12,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24,
          }}>
            ⚡
          </div>
        </button>
      </div>

      {/* Secondary actions */}
      <div style={{ padding: '8px 20px' }}>
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
