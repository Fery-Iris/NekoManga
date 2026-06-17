'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { fetchSearch, fetchGenres } from '@/lib/api';
import ComicCard from '@/components/ComicCard';
import { SkeletonCard } from '@/components/Skeleton';
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
  const initialGenre = searchParams.get('genre') || '';

  const [query, setQuery] = useState(initialQuery);
  const [selectedGenre, setSelectedGenre] = useState(initialGenre);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [results, setResults] = useState<Comic[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    // Sync URL when query or genre changes
    const params = new URLSearchParams();
    if (debouncedQuery) params.set('q', debouncedQuery);
    if (selectedGenre) params.set('genre', selectedGenre);
    router.replace(`/search?${params.toString()}`);
  }, [debouncedQuery, selectedGenre, router]);

  useEffect(() => {
    fetchGenres().then(res => {
      if (res.success) {
        setGenres(res.data);
      }
    });
  }, []);

  useEffect(() => {
    const loadSearch = async () => {
      // Don't search if both are empty
      if (!debouncedQuery && !selectedGenre) {
        setResults([]);
        setInitialLoad(false);
        return;
      }
      
      setLoading(true);
      try {
        const res = await fetchSearch(debouncedQuery, selectedGenre);
        if (res.success) {
          setResults(res.data);
        } else {
          setResults([]);
        }
      } catch (error) {
        console.error('Error searching:', error);
        setResults([]);
      } finally {
        setLoading(false);
        setInitialLoad(false);
      }
    };
    
    loadSearch();
  }, [debouncedQuery, selectedGenre]);

  return (
    <div className="search-results-container container">
      <h2 className="section-title">Pencarian Manga</h2>

      <div className="search-filters" style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <input 
          type="text" 
          placeholder="Search Manga..." 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="search-input glass-panel"
          style={{ flex: '1', padding: '0.8rem 1rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--glass-bg)', color: 'var(--text-primary)' }}
        />
        
        <select 
          value={selectedGenre} 
          onChange={(e) => setSelectedGenre(e.target.value)}
          className="genre-select glass-panel"
          style={{ padding: '0.8rem 1rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--glass-bg)', color: 'var(--text-primary)', minWidth: '150px' }}
        >
          <option value="">Semua Genre</option>
          {genres.map(g => (
            <option key={g.endpoint} value={g.endpoint}>{g.title}</option>
          ))}
        </select>
      </div>
      
      {loading ? (
        <div className="grid-responsive">
          {Array.from({ length: 10 }).map((_, i) => (
             <SkeletonCard key={i} />
          ))}
        </div>
      ) : results.length > 0 ? (
        <>
          <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>Menampilkan {results.length} hasil</p>
          <div className="grid-responsive">
            {results.map((comic, idx) => (
              <ComicCard key={idx} {...comic} />
            ))}
          </div>
        </>
      ) : !initialLoad ? (
        <div className="no-results glass-panel" style={{ padding: '3rem', textAlign: 'center', borderRadius: '12px' }}>
          <h3>😔 Manga tidak ditemukan</h3>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Coba gunakan kata kunci atau genre lain.</p>
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
