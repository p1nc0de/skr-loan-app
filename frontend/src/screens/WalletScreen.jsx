import { useState, useEffect } from 'react';
import { api } from '../api';
import { CUSTOMER_ID } from '../App';
import LoadingSpinner from '../components/LoadingSpinner';
import { fmtMYR } from '../components/AmountDisplay';

export default function WalletScreen() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getWallet(CUSTOMER_ID)
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="screen"><LoadingSpinner /></div>;
  if (!data) return <div className="screen"><div className="p-20 text-secondary">Failed to load wallet.</div></div>;

  return (
    <div className="screen">
      {/* Header gradient */}
      <div style={{
        background: 'linear-gradient(135deg, #1E293B 0%, #334155 100%)',
        padding: '32px 20px 48px',
        color: 'white',
      }}>
        <p style={{ fontSize: 12, fontWeight: 600, opacity: 0.6, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 8 }}>
          Skyro Wallet
        </p>
        <p style={{ fontSize: 13, opacity: 0.6, marginBottom: 4 }}>Available Balance</p>
        <p style={{ fontSize: 42, fontWeight: 800, letterSpacing: '-1px' }}>
          <span style={{ fontSize: 20, fontWeight: 600, opacity: 0.7, marginRight: 4 }}>MYR</span>
          {fmtMYR(data.balance_cents)}
        </p>
      </div>

      {/* Ledger */}
      <div style={{ padding: '0 20px', marginTop: -24 }}>
        <div className="card">
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Recent Transactions
          </p>

          {data.ledger.length === 0 && (
            <p className="text-secondary text-sm text-center" style={{ padding: '20px 0' }}>No transactions yet.</p>
          )}

          {data.ledger.map(entry => (
            <div key={entry.id} className="list-row">
              <div>
                <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>{entry.description}</p>
                <p className="text-sm text-muted" style={{ marginTop: 2 }}>
                  {new Date(entry.created_at).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: entry.amount_cents >= 0 ? 'var(--success)' : 'var(--danger)',
                }}>
                  {entry.amount_cents >= 0 ? '+' : ''}MYR {fmtMYR(Math.abs(entry.amount_cents))}
                </p>
                {entry.ref_type && (
                  <p className="text-sm text-muted" style={{ marginTop: 2 }}>{entry.ref_type}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
