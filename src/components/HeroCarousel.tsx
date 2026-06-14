'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Play, Info, ChevronLeft, ChevronRight } from 'lucide-react';

interface Comic {
  title: string;
  image: string;
  endpoint: string;
  type?: string;
  desc?: string; // Optional desc if we had it, but we'll fallback
}

export default function HeroCarousel({ comics }: { comics: Comic[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (comics.length === 0) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % Math.min(comics.length, 5));
    }, 5000); // Slide every 5 seconds
    return () => clearInterval(interval);
  }, [comics]);

  if (!comics || comics.length === 0) return null;

  const featuredComics = comics.slice(0, 5); // Take top 5
  const currentComic = featuredComics[currentIndex];
  const cleanEp = currentComic.endpoint.startsWith('/') ? currentComic.endpoint.slice(1) : currentComic.endpoint;

  const nextSlide = () => setCurrentIndex((prev) => (prev + 1) % featuredComics.length);
  const prevSlide = () => setCurrentIndex((prev) => (prev - 1 + featuredComics.length) % featuredComics.length);

  return (
    <div className="hero-carousel-container">
      {featuredComics.map((comic, idx) => {
        const itemEp = comic.endpoint.startsWith('/') ? comic.endpoint.slice(1) : comic.endpoint;
        
        return (
          <div 
            key={idx}
            className={`hero-slide ${idx === currentIndex ? 'active' : ''}`}
          >
            <div className="hero-bg-blur" style={{ backgroundImage: `url(${comic.image})` }} />
            <div className="hero-gradient-overlay" />
            
            <div className="hero-content container">
              <div className="hero-info">
                <span className="hero-badge">{comic.type || 'Manga'}</span>
                <h1 className="hero-title">{comic.title}</h1>
                <p className="hero-desc">
                  Ikuti kisah seru dan petualangan epik dalam {comic.title}. Baca chapter terbarunya sekarang juga secara gratis hanya di NekoMa.
                </p>
                <div className="hero-actions">
                  <Link href={`/comic/${encodeURIComponent(itemEp)}`} className="btn-hero primary">
                    <Play size={20} fill="currentColor" /> Mulai Baca
                  </Link>
                  <Link href={`/comic/${encodeURIComponent(itemEp)}`} className="btn-hero secondary">
                    <Info size={20} /> Detail Info
                  </Link>
                </div>
              </div>
              
              <div className="hero-image-wrapper">
                 <Link href={`/comic/${encodeURIComponent(itemEp)}`} style={{ display: 'block', width: '100%', height: '100%' }}>
                   {/* eslint-disable-next-line @next/next/no-img-element */}
                   <img src={comic.image} alt={comic.title} className="hero-main-img" />
                 </Link>
              </div>
            </div>
          </div>
        );
      })}

      <div className="hero-nav-buttons container">
        <button className="hero-nav-btn prev" onClick={prevSlide}><ChevronLeft size={24} /></button>
        <button className="hero-nav-btn next" onClick={nextSlide}><ChevronRight size={24} /></button>
      </div>

      <div className="hero-indicators">
        {featuredComics.map((_, idx) => (
          <button 
            key={idx}
            className={`indicator-dot ${idx === currentIndex ? 'active' : ''}`}
            onClick={() => setCurrentIndex(idx)}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
