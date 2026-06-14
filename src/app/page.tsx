'use client';

import { useEffect, useState } from 'react';
import { fetchPopular, fetchRecommended, fetchNewest } from '@/lib/api';
import ComicCard from '@/components/ComicCard';
import Loader from '@/components/Loader';
import ScrollReveal from '@/components/ScrollReveal';
import HeroCarousel from '@/components/HeroCarousel';
import HorizontalScrollRow from '@/components/HorizontalScrollRow';

interface Comic {
  title: string;
  image: string;
  endpoint: string;
  type?: string;
}

export default function Home() {
  const [popular, setPopular] = useState<Comic[]>([]);
  const [recommended, setRecommended] = useState<Comic[]>([]);
  const [newest, setNewest] = useState<Comic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [popData, recData, newData] = await Promise.all([
          fetchPopular(),
          fetchRecommended(),
          fetchNewest()
        ]);
        
        if (popData.success) setPopular(popData.data);
        if (recData.success) setRecommended(recData.data);
        if (newData.success) setNewest(newData.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="home-container-modern">
      {/* 1. Hero Carousel (Top 5 Popular Manga) */}
      <HeroCarousel comics={popular} />

      {/* 2. Popular Row */}
      <HorizontalScrollRow title="🔥 Popular Manga">
        {popular.slice(0, 15).map((comic, idx) => (
          <div key={idx} className="scroll-item">
            <ComicCard {...comic} />
          </div>
        ))}
      </HorizontalScrollRow>

      {/* 3. Recommended Row */}
      <HorizontalScrollRow title="⭐ Recommended">
        {recommended.slice(0, 15).map((comic, idx) => (
          <div key={idx} className="scroll-item">
            <ComicCard {...comic} />
          </div>
        ))}
      </HorizontalScrollRow>

      {/* 4. Newest Releases Row */}
      <HorizontalScrollRow title="🆕 Newest Releases">
        {newest.slice(0, 15).map((comic, idx) => (
          <div key={idx} className="scroll-item">
            <ComicCard {...comic} />
          </div>
        ))}
      </HorizontalScrollRow>
    </div>
  );
}

