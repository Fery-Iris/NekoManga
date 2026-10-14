'use client';

import { useEffect, useState, useCallback } from 'react';
import { fetchBrowse, fetchGenres } from '@/lib/api';
import ComicCard from '@/components/ComicCard';
import Loader from '@/components/Loader';
import ScrollReveal from '@/components/ScrollReveal';
import Pagination from '@/components/Pagination';

interface Comic {
  title: string;
  image: string;
  endpoint: string;
  type?: string;
}

interface Genre {
  title: string;
  endpoint: string;
}

const ORDER_OPTIONS = [
  { label: 'Chapter Terbaru', value: 'modified' },
  { label: 'Komik Terbaru', value: 'date' },
  { label: 'Peringkat', value: 'meta_value_num' },
  { label: 'Acak', value: 'rand' },
];

const TYPE_OPTIONS = [
  { label: 'Semua', value: '' },
  { label: 'Manga', value: 'manga' },
  { label: 'Manhwa', value: 'manhwa' },
  { label: 'Manhua', value: 'manhua' },
];

const STATUS_OPTIONS = [
  { label: 'Semua', value: '' },
  { label: 'Ongoing', value: 'ongoing' },
  { label: 'End', value: 'end' },
  { label: 'Hiatus', value: 'hiatus' },
];

export default function BrowsePage() {
  const [comics, setComics] = useState<Comic[]>([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  
  const [orderby, setOrderby] = useState('modified');
  const [tipe, setTipe] = useState('');
  const [genre, setGenre] = useState('');
  const [status, setStatus] = useState('');
  const [huruf, setHuruf] = useState('');
  
  const [genresList, setGenresList] = useState<Genre[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetchGenres().then(res => {
      if (res.success) setGenresList(res.data);
    });
  }, []);

  const loadComics = useCallback(async (h: string, o: string, t: string, g: string, s: string, pg: number) => {
    setIsFetching(true);
    try {
      const data = await fetchBrowse({ huruf: h, orderby: o, tipe: t, genre: g, status: s, page: pg });
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
      setIsFetching(false);
      setIsInitialLoad(false);
      
      // Smoothly scroll to results, offset by navbar height
      setTimeout(() => {
        const resultsEl = document.getElementById('browse-results');
        if (resultsEl) {
          const y = resultsEl.getBoundingClientRect().top + window.scrollY - 80;
          window.scrollTo({ top: y, behavior: 'smooth' });
        }
      }, 100);
    }
  }, []);

  useEffect(() => {
    setPage(1);
    loadComics(huruf, orderby, tipe, genre, status, 1);
  }, [huruf, orderby, tipe, genre, status, loadComics]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    loadComics(huruf, orderby, tipe, genre, status, newPage);
  };

  const handleAdvancedFilterChange = (setter: React.Dispatch<React.SetStateAction<string>>, value: string) => {
    setter(value);
  };

  const handleHurufChange = (newHuruf: string) => {
    setHuruf(newHuruf);
  };

  const handleResetFilters = () => {
    setHuruf('');
    setOrderby('modified');
    setTipe('');
    setGenre('');
    setStatus('');
    setPage(1);
  };

  const hasActiveFilters = Boolean(huruf || tipe || genre || status || orderby !== 'modified');

  return (
    <div className="browse-container container">
      <ScrollReveal animation="fade-down" duration={700}>
        <header className="browse-header">
          <h1 className="browse-title">🗂️ Koleksi Komik Online</h1>
          <p className="browse-subtitle">Telusuri ribuan judul komik berdasarkan huruf A-Z, tipe, genre, dan status.</p>
        </header>
      </ScrollReveal>

      {/* Alphabetical A-Z Navigation */}
      <div className="alphabet-nav glass-panel" style={{ padding: '1rem', marginBottom: '1.5rem', borderRadius: '12px', display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center' }}>
        <button className={`az-btn ${!huruf ? 'active' : ''}`} onClick={() => handleHurufChange('')}>Semua Huruf</button>
        <button className={`az-btn ${huruf === '#' ? 'active' : ''}`} onClick={() => handleHurufChange('#')}>#</button>
        {Array.from('ABCDEFGHIJKLMNOPQRSTUVWXYZ').map(char => (
          <button key={char} className={`az-btn ${huruf === char ? 'active' : ''}`} onClick={() => handleHurufChange(char)}>{char}</button>
        ))}
      </div>

      {/* Advanced Filter Controls */}
      <div className="advanced-filter-grid glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem', borderRadius: '12px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', alignItems: 'end' }}>
        <div className="filter-group">
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Urutkan</label>
          <select value={orderby} onChange={(e) => handleAdvancedFilterChange(setOrderby, e.target.value)} className="filter-select" style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--glass-bg)', color: 'var(--text-primary)' }}>
            {ORDER_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        </div>
        
        <div className="filter-group">
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Tipe</label>
          <select value={tipe} onChange={(e) => handleAdvancedFilterChange(setTipe, e.target.value)} className="filter-select" style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--glass-bg)', color: 'var(--text-primary)' }}>
            {TYPE_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        </div>
        
        <div className="filter-group">
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Genre {genre ? `(${genresList.find(g => g.endpoint === genre)?.title || genre})` : ''}
          </label>
          <select value={genre} onChange={(e) => handleAdvancedFilterChange(setGenre, e.target.value)} className="filter-select" style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--glass-bg)', color: 'var(--text-primary)' }}>
            <option value="">Semua Genre</option>
            {genresList.map(g => <option key={g.endpoint} value={g.endpoint}>{g.title}</option>)}
          </select>
        </div>
        
        <div className="filter-group">
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Status</label>
          <select value={status} onChange={(e) => handleAdvancedFilterChange(setStatus, e.target.value)} className="filter-select" style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--glass-bg)', color: 'var(--text-primary)' }}>
            {STATUS_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        </div>

        {hasActiveFilters && (
          <div className="filter-group" style={{ display: 'flex', alignItems: 'center' }}>
            <button
              onClick={handleResetFilters}
              style={{
                width: '100%',
                padding: '0.8rem',
                borderRadius: '8px',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                background: 'rgba(239, 68, 68, 0.1)',
                color: '#ef4444',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
              }}
            >
              ✕ Reset Filter
            </button>
          </div>
        )}
      </div>

      {/* Results */}
      <div id="browse-results" style={{ minHeight: '400px', position: 'relative' }}>
        {isInitialLoad ? (
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '5rem 0', gap: '1rem', borderRadius: '12px', marginTop: '2rem' }}>
           <Loader />
           <p style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Mengambil koleksi komik...</p>
        </div>
      ) : comics.length === 0 ? (
          <div className="browse-empty glass-panel" style={{ padding: '3rem', borderRadius: '12px', opacity: isFetching ? 0.5 : 1, transition: 'opacity 0.3s ease', textAlign: 'center', marginTop: '2rem' }}>
            {isFetching ? (
              <h3>🔍 Mengambil data komik...</h3>
            ) : (
              <>
                <h3>😔 Tidak ditemukan komik untuk filter ini.</h3>
                <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Coba ubah kombinasi filter Anda.</p>
              </>
            )}
          </div>
        ) : (
          <div style={{ opacity: isFetching ? 0.5 : 1, transition: 'opacity 0.3s ease', pointerEvents: isFetching ? 'none' : 'auto' }}>
            <div className="browse-count">
              Halaman {page} (Menampilkan {comics.length} komik)
            </div>
            <div className="grid-responsive">
              {comics.map((comic, idx) => (
                <ComicCard key={`${comic.endpoint}-${idx}-${page}`} {...comic} />
              ))}
            </div>
            
            <Pagination 
              currentPage={page} 
              hasMore={hasMore} 
              onPageChange={handlePageChange} 
            />
          </div>
        )}
      </div>
    </div>
  );
}
