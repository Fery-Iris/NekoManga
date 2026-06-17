'use client';

import { useEffect, useState, useCallback } from 'react';
import { fetchBrowse } from '@/lib/api';
import ComicCard from '@/components/ComicCard';
import Loader from '@/components/Loader';
import ScrollReveal from '@/components/ScrollReveal';
import Pagination from '@/components/Pagination';
import { SkeletonCard } from '@/components/Skeleton';

interface Comic {
  title: string;
  image: string;
  endpoint: string;
  type?: string;
}

const LETTERS = ['#', ...Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i))];
const TYPES = [
  { label: 'Semua', value: '' },
  { label: 'Manga', value: 'manga' },
  { label: 'Manhwa', value: 'manhwa' },
  { label: 'Manhua', value: 'manhua' },
];

export default function BrowsePage() {
  const [comics, setComics] = useState<Comic[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeLetter, setActiveLetter] = useState('');
  const [activeType, setActiveType] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const loadComics = useCallback(async (letter: string, tipe: string, pg: number) => {
    setLoading(true);
    try {
      const data = await fetchBrowse(letter, tipe, pg);
      if (data.success) {
        const newComics = data.data || [];
        setComics(newComics);
        setHasMore(newComics.length >= 20); // typical page size
      } else {
        setComics([]);
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error fetching browse data:', error);
      setComics([]);
      setHasMore(false);
    } finally {
      setLoading(false);
      // scroll to top after loading
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  useEffect(() => {
    setPage(1);
    loadComics(activeLetter, activeType, 1);
  }, [activeLetter, activeType, loadComics]);

  const handleLetterClick = (letter: string) => {
    setActiveLetter(letter === activeLetter ? '' : letter);
  };

  const handleTypeClick = (tipe: string) => {
    setActiveType(tipe);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    loadComics(activeLetter, activeType, newPage);
  };

  return (
    <div className="browse-container container">
      <ScrollReveal animation="fade-down" duration={700}>
        <header className="browse-header">
          <h1 className="browse-title">📚 Daftar Komik A–Z</h1>
          <p className="browse-subtitle">Telusuri seluruh koleksi manga, manhwa, dan manhua.</p>
        </header>
      </ScrollReveal>

      {/* Type Filter */}
      <div className="browse-type-bar" id="type-filter">
        {TYPES.map((t) => (
          <button
            key={t.value}
            className={`type-btn ${activeType === t.value ? 'active' : ''}`}
            onClick={() => handleTypeClick(t.value)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* A-Z Letter Bar */}
      <nav className="browse-az-bar" aria-label="Filter huruf" id="letter-filter">
        <button
          className={`az-btn ${activeLetter === '' ? 'active' : ''}`}
          onClick={() => handleLetterClick('')}
        >
          Semua
        </button>
        {LETTERS.map((letter) => (
          <button
            key={letter}
            className={`az-btn ${activeLetter === letter ? 'active' : ''}`}
            onClick={() => handleLetterClick(letter)}
          >
            {letter}
          </button>
        ))}
      </nav>

      {/* Active Filters Display */}
      {(activeLetter || activeType) && (
        <div className="browse-active-filters">
          <span className="filter-label">Filter aktif:</span>
          {activeLetter && (
            <span className="filter-tag">
              Huruf: {activeLetter}
              <button onClick={() => setActiveLetter('')} className="filter-remove">×</button>
            </span>
          )}
          {activeType && (
            <span className="filter-tag">
              Tipe: {activeType}
              <button onClick={() => setActiveType('')} className="filter-remove">×</button>
            </span>
          )}
        </div>
      )}

      {/* Results */}
      {loading ? (
        <div className="grid-responsive" style={{ marginTop: '2rem' }}>
          {Array.from({ length: 10 }).map((_, i) => (
             <SkeletonCard key={i} />
          ))}
        </div>
      ) : comics.length === 0 ? (
        <div className="browse-empty">
          <p>😔 Tidak ditemukan komik untuk filter ini.</p>
        </div>
      ) : (
        <>
          <div className="browse-count">
            Halaman {page} (Menampilkan {comics.length} komik)
          </div>
          <div className="grid-responsive">
            {comics.map((comic, idx) => (
              <ScrollReveal key={`${comic.endpoint}-${idx}`} animation="fade-up" delay={(idx % 5) * 50} duration={400}>
                <ComicCard {...comic} />
              </ScrollReveal>
            ))}
          </div>
          
          <Pagination 
            currentPage={page} 
            hasMore={hasMore} 
            onPageChange={handlePageChange} 
          />
        </>
      )}
    </div>
  );
}
