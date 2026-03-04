const STATUS_MAP = {
  ACTIVE: 'badge-active',
  CLOSED: 'badge-closed',
  SETTLED: 'badge-settled',
  PAID: 'badge-paid',
  DUE: 'badge-due',
  OVERDUE: 'badge-overdue',
};

export default function StatusBadge({ status }) {
  const cls = STATUS_MAP[status?.toUpperCase()] || 'badge-closed';
  return <span className={`badge ${cls}`}>{status}</span>;
}
