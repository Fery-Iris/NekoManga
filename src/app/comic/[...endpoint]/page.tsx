'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { fetchComicInfo } from '@/lib/api';
import Loader from '@/components/Loader';
import { Star, BookOpen, Clock, User, Bookmark, Play, History } from 'lucide-react';
import CommentSection from '@/components/CommentSection';
import ScrollReveal from '@/components/ScrollReveal';

interface Chapter {
  name: string;
  endpoint: string;
  date?: string;
}

interface ComicData {
  title: string;
  thumbnail: string;
  type: string;
  author: string;
  status: string;
  rating: string;
  genre: string[];
  synopsis: string;
  chapter_list: Chapter[];
}

export default function ComicDetailPage({ params }: { params: Promise<{ endpoint: string[] }> }) {
  const { endpoint } = use(params);
  const router = useRouter();
  const fullEndpoint = decodeURIComponent(endpoint.join('/'));
  const [comic, setComic] = useState<ComicData | null>(null);
  const [loading, setLoading] = useState(true);
  
  // LocalStorage States
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [recentChapter, setRecentChapter] = useState<{name: string, endpoint: string} | null>(null);

  useEffect(() => {
    const loadComic = async () => {
      try {
        const res = await fetchComicInfo(fullEndpoint);
        if (res.success) {
          setComic(res.data);
          
          // Check localStorage after fetching comic
          const bookmarks = JSON.parse(localStorage.getItem('nekoma_bookmarks') || '[]');
          setIsBookmarked(bookmarks.some((b: any) => b.endpoint === fullEndpoint));
          
          const history = JSON.parse(localStorage.getItem('nekoma_history') || '{}');
          if (history[fullEndpoint]) {
            setRecentChapter(history[fullEndpoint]);
          }
        }
      } catch (error) {
        console.error('Error fetching comic details:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadComic();
  }, [fullEndpoint]);

  const toggleBookmark = () => {
    if (!comic) return;
    const bookmarks = JSON.parse(localStorage.getItem('nekoma_bookmarks') || '[]');
    
    if (isBookmarked) {
      const newBookmarks = bookmarks.filter((b: any) => b.endpoint !== fullEndpoint);
      localStorage.setItem('nekoma_bookmarks', JSON.stringify(newBookmarks));
      setIsBookmarked(false);
    } else {
      bookmarks.push({
        title: comic.title,
        endpoint: fullEndpoint,
        thumbnail: comic.thumbnail,
        type: comic.type
      });
      localStorage.setItem('nekoma_bookmarks', JSON.stringify(bookmarks));
      setIsBookmarked(true);
    }
  };

  const handleRead = () => {
    if (!comic || comic.chapter_list.length === 0) return;
    
    let targetEndpoint = '';
    
    if (recentChapter) {
      targetEndpoint = recentChapter.endpoint;
    } else {
      // Baca dari awal (chapter paling bawah karena mangaku urutannya descending)
      const firstChapter = comic.chapter_list[comic.chapter_list.length - 1];
      targetEndpoint = firstChapter.endpoint;
    }

    const cleanEp = targetEndpoint.startsWith('/') ? targetEndpoint.slice(1) : targetEndpoint;
    router.push(`/chapter/${encodeURIComponent(cleanEp)}`);
  };

  if (loading) return <Loader />;
  if (!comic) return <div className="container" style={{ marginTop: '2rem' }}>Comic not found.</div>;

  const totalChapters = comic.chapter_list.length;
  const latestChapter = totalChapters > 0 ? comic.chapter_list[0].name : '-';

  return (
    <div className="comic-detail-wrapper">
      <div className="comic-hero-bg">
        <div 
          className="hero-blur" 
          style={{ backgroundImage: `url(${comic.thumbnail})` }}
        />
        <div className="hero-overlay" />
      </div>

      <div className="container comic-content-container">
        <ScrollReveal animation="fade-up" duration={600}>
          <div className="comic-hero-content">
            <div className="comic-cover-large">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={comic.thumbnail} alt={comic.title} />
            </div>

            <div className="comic-info-main">
              <div className="comic-eyebrow">
                <span className="eyebrow-type">{comic.type}</span>
                <span className="eyebrow-dot">•</span>
                <span className="eyebrow-status">{comic.status}</span>
              </div>

              <h1 className="comic-title-epic">{comic.title}</h1>
              
              <p className="comic-author-text">
                <strong>{comic.author.toLowerCase().startsWith('oleh') ? comic.author : `oleh ${comic.author}`}</strong>
              </p>

              <div className="comic-stats-bar glass-panel">
                <div className="stat-box">
                  <span className="stat-value">{totalChapters}</span>
                  <span className="stat-label">CHAPTER</span>
                </div>
                <div className="stat-divider" />
                <div className="stat-box">
                  <span className="stat-value">{comic.rating}</span>
                  <span className="stat-label">RATING</span>
                </div>
                <div className="stat-divider" />
                <div className="stat-box">
                  <span className="stat-value" style={{ fontSize: '1rem' }}>{latestChapter}</span>
                  <span className="stat-label">TERBARU</span>
                </div>
              </div>

              <div className="comic-genres-row">
                {comic.genre?.map((g: string, idx: number) => (
                  <span key={idx} className="genre-pill">{g}</span>
                ))}
              </div>

              <div className="comic-actions">
                <button className="action-btn btn-primary" onClick={handleRead}>
                  <Play size={18} fill="currentColor" />
                  <span>{recentChapter ? `Lanjutkan (${recentChapter.name})` : 'Mulai Baca'}</span>
                </button>

                <button 
                  className={`action-btn btn-secondary ${isBookmarked ? 'active' : ''}`}
                  onClick={toggleBookmark}
                >
                  <Bookmark size={18} fill={isBookmarked ? "currentColor" : "none"} />
                  <span>Bookmark</span>
                </button>
              </div>
            </div>
          </div>

          <div className="comic-synopsis-box" style={{ marginBottom: '4rem' }}>
            <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem', color: 'var(--text-primary)', fontWeight: 700 }}>Sinopsis</h3>
            <p>{comic.synopsis || 'Tidak ada sinopsis yang tersedia untuk komik ini.'}</p>
          </div>
        </ScrollReveal>

        <div className="chapters-section">
          <div className="section-header flex-between">
            <h2 className="section-title">Daftar Chapter</h2>
            <span className="chapter-count-badge">{totalChapters} Chapter</span>
          </div>

          <div className="chapters-list-epic">
            {comic.chapter_list?.map((chapter: Chapter, idx: number) => {
               const cleanEp = chapter.endpoint.startsWith('/') ? chapter.endpoint.slice(1) : chapter.endpoint;
               const isRead = recentChapter?.endpoint === chapter.endpoint;
               
               return (
                <div 
                  key={idx} 
                  onClick={() => {
                    const history = JSON.parse(localStorage.getItem('nekoma_history') || '{}');
                    history[fullEndpoint] = { name: chapter.name, endpoint: chapter.endpoint };
                    localStorage.setItem('nekoma_history', JSON.stringify(history));
                    router.push(`/chapter/${encodeURIComponent(cleanEp)}`);
                  }}
                  className={`chapter-row ${isRead ? 'is-read' : ''}`}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="chapter-row-left">
                    <span className="chapter-name">{chapter.name}</span>
                    {isRead && <span className="read-badge">Terakhir Dibaca</span>}
                  </div>
                  <span className="chapter-date">{chapter.date}</span>
                </div>
               );
            })}
          </div>
        </div>

        <div style={{ marginTop: '4rem' }}>
          <CommentSection />
        </div>
      </div>
    </div>
  );
}
