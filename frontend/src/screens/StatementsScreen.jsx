import { useState, useEffect } from 'react';
import { api } from '../api';
import { ACCOUNT_ID } from '../App';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusBadge from '../components/StatusBadge';
import { fmtMYR } from '../components/AmountDisplay';

export default function StatementsScreen() {
  const [tranches, setTranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('schedule');

  useEffect(() => {
    api.getTranches(ACCOUNT_ID)
      .then(setTranches)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="screen"><LoadingSpinner /></div>;

  const activeTranche = tranches.find(t => t.status === 'ACTIVE');

  return (
    <div className="screen">
      <div className="screen-header" style={{ marginBottom: 16 }}>
        <h1 className="screen-title">Statements</h1>
        <p className="screen-subtitle">Loan history & payment schedule</p>
      </div>

      <div style={{ padding: '0 20px' }}>
        <div className="tabs">
          <button className={`tab ${activeTab === 'schedule' ? 'active' : ''}`} onClick={() => setActiveTab('schedule')}>
            Active Schedule
          </button>
          <button className={`tab ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
            All Tranches
          </button>
        </div>

        {activeTab === 'schedule' ? (
          <ScheduleTab tranche={activeTranche} />
        ) : (
          <HistoryTab tranches={tranches} />
        )}
      </div>
    </div>
  );
}

function ScheduleTab({ tranche }) {
  if (!tranche) {
    return (
      <div className="card text-center" style={{ padding: '40px 20px' }}>
        <p style={{ fontSize: 32, marginBottom: 12 }}>✓</p>
        <p style={{ fontWeight: 600 }}>No active tranche</p>
        <p className="text-sm text-muted mt-8">Refuel to start a new credit drawdown.</p>
      </div>
    );
  }

  const paidCount = tranche.schedules.filter(s => s.paid).length;
  const totalCount = tranche.schedules.length;
  const remaining = tranche.schedules.filter(s => !s.paid).reduce((sum, s) => sum + s.total_cents, 0);

  return (
    <>
      {/* Summary */}
      <div className="card mb-12">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div>
            <p className="text-sm text-muted font-semibold">Tranche #{tranche.id}</p>
            <p style={{ fontSize: 18, fontWeight: 700, marginTop: 2 }}>MYR {fmtMYR(tranche.gross_amount)}</p>
          </div>
          <StatusBadge status={tranche.status} />
        </div>
        <div className="stat-grid">
          <div className="stat-item">
            <p className="stat-label">Paid</p>
            <p className="stat-value">{paidCount}/{totalCount}</p>
          </div>
          <div className="stat-item">
            <p className="stat-label">Remaining</p>
            <p className="stat-value" style={{ fontSize: 15 }}>MYR {fmtMYR(remaining)}</p>
          </div>
          <div className="stat-item">
            <p className="stat-label">APR</p>
            <p className="stat-value">{(tranche.apr_bps / 100).toFixed(0)}%</p>
          </div>
          <div className="stat-item">
            <p className="stat-label">Term</p>
            <p className="stat-value">{tranche.term_months}mo</p>
          </div>
        </div>
      </div>

      {/* Schedule table */}
      <div className="card" style={{ padding: '16px', overflowX: 'auto' }}>
        <table className="schedule-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Due Date</th>
              <th style={{ textAlign: 'right' }}>Principal</th>
              <th style={{ textAlign: 'right' }}>Interest</th>
              <th style={{ textAlign: 'right' }}>Total</th>
              <th style={{ textAlign: 'center' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {tranche.schedules.map(row => (
              <tr key={row.id} className={row.paid ? 'paid' : ''}>
                <td>{row.installment_no}</td>
                <td>{new Date(row.due_date + 'T00:00:00').toLocaleDateString('en-MY', { day: 'numeric', month: 'short' })}</td>
                <td style={{ textAlign: 'right' }}>{fmtMYR(row.principal_cents)}</td>
                <td style={{ textAlign: 'right' }}>{fmtMYR(row.interest_cents)}</td>
                <td style={{ textAlign: 'right', fontWeight: 600 }}>{fmtMYR(row.total_cents)}</td>
                <td style={{ textAlign: 'center' }}>
                  {row.paid
                    ? <span className="badge badge-paid">Paid</span>
                    : <span className="badge badge-due">Due</span>
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function HistoryTab({ tranches }) {
  if (tranches.length === 0) {
    return <div className="card text-center text-secondary" style={{ padding: '40px 20px' }}>No tranches yet.</div>;
  }

  return (
    <>
      {[...tranches].reverse().map(t => {
        const paid = t.schedules.filter(s => s.paid).length;
        const total = t.schedules.length;
        const totalAmt = t.schedules.reduce((sum, s) => sum + s.total_cents, 0);
        const paidAmt = t.schedules.filter(s => s.paid).reduce((sum, s) => sum + s.total_cents, 0);

        return (
          <div key={t.id} className="card mb-12">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div>
                <p className="text-sm text-muted font-semibold">Tranche #{t.id}</p>
                <p style={{ fontSize: 20, fontWeight: 700, marginTop: 2 }}>MYR {fmtMYR(t.gross_amount)}</p>
              </div>
              <StatusBadge status={t.status} />
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
              <span style={{ fontSize: 12, padding: '3px 8px', background: 'var(--surface-2)', borderRadius: 4 }}>
                {(t.apr_bps / 100).toFixed(0)}% APR
              </span>
              <span style={{ fontSize: 12, padding: '3px 8px', background: 'var(--surface-2)', borderRadius: 4 }}>
                {t.term_months} months
              </span>
              <span style={{ fontSize: 12, padding: '3px 8px', background: 'var(--surface-2)', borderRadius: 4 }}>
                {paid}/{total} paid
              </span>
            </div>

            <div style={{ height: 4, background: 'var(--border)', borderRadius: 2 }}>
              <div style={{
                height: '100%',
                width: `${totalAmt > 0 ? Math.round((paidAmt / totalAmt) * 100) : 0}%`,
                background: 'var(--success)',
                borderRadius: 2,
              }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
              <span className="text-sm text-muted">
                Disbursed {new Date(t.disbursed_at).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
              {t.closed_at && (
                <span className="text-sm text-muted">
                  Closed {new Date(t.closed_at).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </>
  );
}
