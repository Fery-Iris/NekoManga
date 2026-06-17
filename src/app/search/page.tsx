'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { fetchSearch, fetchGenres } from '@/lib/api';
import ComicCard from '@/components/ComicCard';
import Loader from '@/components/Loader';
import { useDebounce } from '@/hooks/useDebounce';

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

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<Comic[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    // Sync URL when query changes
    const params = new URLSearchParams();
    if (debouncedQuery) params.set('q', debouncedQuery);
    router.replace(`/search?${params.toString()}`);
  }, [debouncedQuery, router]);

  useEffect(() => {
    const loadSearch = async () => {
      // Don't search if empty
      if (!debouncedQuery) {
        setResults([]);
        setInitialLoad(false);
        return;
      }
      
      setIsFetching(true);
      try {
        const res = await fetchSearch(debouncedQuery);
        if (res.success) {
          setResults(res.data);
        } else {
          setResults([]);
        }
      } catch (error) {
        console.error('Error searching:', error);
        setResults([]);
      } finally {
        setIsFetching(false);
        setInitialLoad(false);
      }
    };
    
    loadSearch();
  }, [debouncedQuery]);

  return (
    <div className="search-results-container container">
      <h2 className="section-title">Pencarian Manga</h2>

      <div className="search-filters" style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <input 
          type="text" 
          placeholder="Cari Manga..." 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="search-input glass-panel"
          style={{ flex: '1', padding: '0.8rem 1rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--glass-bg)', color: 'var(--text-primary)' }}
        />
      </div>
      
      {initialLoad && isFetching ? (
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4rem 0', gap: '1rem', borderRadius: '12px' }}>
           <Loader />
           <p style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Mencari komik terbaik untukmu...</p>
        </div>
      ) : results.length > 0 ? (
        <div style={{ opacity: isFetching ? 0.5 : 1, transition: 'opacity 0.3s ease', pointerEvents: isFetching ? 'none' : 'auto' }}>
          <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>Menampilkan {results.length} hasil</p>
          <div className="grid-responsive">
            {results.map((comic, idx) => (
              <ComicCard key={idx} {...comic} />
            ))}
          </div>
        </div>
      ) : !initialLoad && debouncedQuery ? (
        <div className="no-results glass-panel" style={{ padding: '3rem', textAlign: 'center', borderRadius: '12px', opacity: isFetching ? 0.5 : 1, transition: 'opacity 0.3s ease' }}>
          {isFetching ? (
            <h3>🔍 Sedang mencari...</h3>
          ) : (
            <>
              <h3>😔 Manga tidak ditemukan</h3>
              <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Coba gunakan kata kunci lain.</p>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="container" style={{paddingTop: '2rem'}}>Loading...</div>}>
      <SearchContent />
    </Suspense>
  );
}
