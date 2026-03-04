export function fmtMYR(cents) {
  const myr = (cents / 100).toFixed(2);
  return Number(myr).toLocaleString('en-MY', { minimumFractionDigits: 2 });
}

export default function AmountDisplay({ cents, size = 'md', className = '', prefix = 'MYR' }) {
  return (
    <span className={`${size === 'lg' ? 'amount-lg' : 'amount-md'} ${className}`}>
      {prefix && <span className="currency-label">{prefix}</span>}
      {fmtMYR(cents)}
    </span>
  );
}
