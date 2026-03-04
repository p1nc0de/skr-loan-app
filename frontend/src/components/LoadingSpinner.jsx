export default function LoadingSpinner({ text = 'Loading...' }) {
  return (
    <div className="loading-center">
      <div className="spinner" />
      <span className="text-secondary text-sm">{text}</span>
    </div>
  );
}
