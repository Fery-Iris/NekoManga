'use client';

import { ReactNode, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface HorizontalScrollRowProps {
  title: string;
  children: ReactNode;
  icon?: ReactNode;
}

export default function HorizontalScrollRow({ title, children, icon }: HorizontalScrollRowProps) {
  const rowRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (rowRef.current) {
      const { scrollLeft, clientWidth } = rowRef.current;
      const scrollAmount = clientWidth * 0.8; // Scroll 80% of container width
      
      rowRef.current.scrollTo({
        left: direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <section className="horizontal-section">
      <div className="section-header flex-between container">
        <h2 className="section-title">
          {icon && <span className="section-icon">{icon}</span>}
          {title}
        </h2>
        
        <div className="scroll-controls">
          <button className="scroll-btn" onClick={() => scroll('left')} aria-label="Scroll Left">
            <ChevronLeft size={20} />
          </button>
          <button className="scroll-btn" onClick={() => scroll('right')} aria-label="Scroll Right">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
      
      <div className="scroll-row-container">
        {/* We use a pseudo-element or padding to maintain container alignment, but the row itself scrolls freely */}
        <div className="scroll-row" ref={rowRef}>
          {children}
        </div>
      </div>
    </section>
  );
}
