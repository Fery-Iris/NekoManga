export default function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`skeleton ${className}`}></div>
  );
}

export function SkeletonCard() {
  return (
    <div className="comic-card skeleton-card">
      <div className="comic-cover skeleton"></div>
      <div className="comic-info" style={{ gap: '0.5rem' }}>
        <div className="skeleton" style={{ height: '20px', width: '80%', borderRadius: '4px' }}></div>
        <div className="skeleton" style={{ height: '14px', width: '50%', borderRadius: '4px' }}></div>
      </div>
    </div>
  );
}
