'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { fetchSearch } from '@/lib/api';
import ComicCard from '@/components/ComicCard';
import Loader from '@/components/Loader';

interface Comic {
  title: string;
  image: string;
  endpoint: string;
  type?: string;
}

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const [results, setResults] = useState<Comic[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadSearch = async () => {
      if (!query) return;
      setLoading(true);
      try {
        const res = await fetchSearch(query);
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
      }
    };
    
    loadSearch();
  }, [query]);

  return (
    <div className="search-results-container container">
      <h2 className="section-title">Search Results for &quot;{query}&quot;</h2>
      
      {loading ? (
        <Loader />
      ) : results.length > 0 ? (
        <div className="grid-responsive">
          {results.map((comic, idx) => (
            <ComicCard key={idx} {...comic} />
          ))}
        </div>
      ) : (
        <div className="no-results glass-panel">
          <p>No comics found matching your query.</p>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<Loader />}>
      <SearchContent />
    </Suspense>
  );
}
