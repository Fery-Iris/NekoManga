import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  hasMore: boolean; // Indicates if there is a next page
  onPageChange: (page: number) => void;
}

export default function Pagination({ currentPage, hasMore, onPageChange }: PaginationProps) {
  return (
    <div className="pagination-container flex-center" style={{ gap: '0.5rem', marginTop: '2rem', marginBottom: '2rem' }}>
      <button 
        className="pagination-btn glass-panel" 
        disabled={currentPage <= 1}
        onClick={() => onPageChange(currentPage - 1)}
        style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: '8px' }}
      >
        <ChevronLeft size={16} /> Prev
      </button>

      <div className="pagination-numbers flex-center" style={{ gap: '0.5rem' }}>
        {currentPage > 2 && (
          <>
            <button className="pagination-number glass-panel" onClick={() => onPageChange(1)}>1</button>
            {currentPage > 3 && <span className="pagination-ellipsis">...</span>}
          </>
        )}
        
        {currentPage > 1 && (
          <button className="pagination-number glass-panel" onClick={() => onPageChange(currentPage - 1)}>
            {currentPage - 1}
          </button>
        )}

        <button className="pagination-number glass-panel active" style={{ background: 'var(--primary-accent)', color: 'white' }}>
          {currentPage}
        </button>

        {hasMore && (
          <button className="pagination-number glass-panel" onClick={() => onPageChange(currentPage + 1)}>
            {currentPage + 1}
          </button>
        )}

        {/* If we have more, we can't definitively show the last page because we don't know total pages without a specific API, but we can just show next buttons. */}
      </div>

      <button 
        className="pagination-btn glass-panel" 
        disabled={!hasMore}
        onClick={() => onPageChange(currentPage + 1)}
        style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: '8px' }}
      >
        Next <ChevronRight size={16} />
      </button>
    </div>
  );
}
