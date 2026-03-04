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

  const utilPct = Math.round((data.outstanding_cents / data.approved_limit_cents) * 100);

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
          <div style={{ marginBottom: 20 }}>
            <p style={{ fontSize: 11, fontWeight: 600, opacity: 0.7, textTransform: 'uppercase', letterSpacing: '1px' }}>Skyro Credit Line</p>
            <p style={{ fontSize: 28, fontWeight: 800, marginTop: 4, letterSpacing: '-0.5px' }}>
              MYR {fmtMYR(data.approved_limit_cents)}
            </p>
            <p style={{ fontSize: 12, opacity: 0.7, marginTop: 2 }}>Approved Limit</p>
          </div>

          {/* Utilization bar */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 11, opacity: 0.7 }}>Utilization</span>
              <span style={{ fontSize: 11, fontWeight: 700 }}>{utilPct}%</span>
            </div>
            <div style={{ height: 6, background: 'rgba(255,255,255,0.25)', borderRadius: 3 }}>
              <div style={{
                height: '100%',
                width: `${Math.min(utilPct, 100)}%`,
                background: utilPct > 80 ? '#FCA5A5' : 'white',
                borderRadius: 3,
                transition: 'width 0.5s',
              }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 10, padding: '12px' }}>
              <p style={{ fontSize: 10, opacity: 0.7, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Outstanding</p>
              <p style={{ fontSize: 18, fontWeight: 700, marginTop: 4 }}>MYR {fmtMYR(data.outstanding_cents)}</p>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 10, padding: '12px' }}>
              <p style={{ fontSize: 10, opacity: 0.7, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Available</p>
              <p style={{ fontSize: 18, fontWeight: 700, marginTop: 4 }}>MYR {fmtMYR(data.available_cents)}</p>
            </div>
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

      {/* Quick Actions */}
      <div style={{ padding: '16px 20px' }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Quick Actions</p>
        <div className="quick-actions">
          <button className="quick-action" onClick={() => navigate('/refuel')}>
            <div className="quick-action-icon" style={{ background: '#EEF2FF' }}>⚡</div>
            <span>Refuel</span>
          </button>
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
