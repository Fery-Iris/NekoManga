'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { fetchComicInfo } from '@/lib/api';
import Loader from '@/components/Loader';
import { Star, BookOpen, Clock, User, Bookmark, Play, History } from 'lucide-react';
import { useSession } from 'next-auth/react';
import CommentSection from '@/components/CommentSection';
import ReactionSection from '@/components/ReactionSection';
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

function normalizeSlug(str: string | undefined | null): string {
  if (!str) return '';
  return str.replace(/^\/+|\/+$/g, '').replace(/^manga\//, '');
}

export default function ComicDetailPage({ params }: { params: Promise<{ endpoint: string[] }> }) {
  const { endpoint } = use(params);
  const router = useRouter();
  const fullEndpoint = decodeURIComponent(endpoint.join('/'));
  const cleanFullEndpoint = normalizeSlug(fullEndpoint);
  const [comic, setComic] = useState<ComicData | null>(null);
  const [loading, setLoading] = useState(true);
  
  // LocalStorage and DB States
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [recentChapter, setRecentChapter] = useState<{name: string, endpoint: string} | null>(null);
  const [currentChapterPage, setCurrentChapterPage] = useState(1);
  const chaptersPerPage = 30;
  
  const { data: session } = useSession();

  useEffect(() => {
    const loadComic = async () => {
      try {
        const res = await fetchComicInfo(fullEndpoint);
        if (res.success) {
          setComic(res.data);
          
          let foundHistory = false;
          if (session?.user) {
            // Fetch from database if logged in
            try {
              const [bmRes, histRes] = await Promise.all([
                fetch('/api/bookmark'),
                fetch('/api/history')
              ]);
              
              if (bmRes.ok) {
                const bookmarks = await bmRes.json();
                setIsBookmarked(bookmarks.some((b: any) => normalizeSlug(b.comicEndpoint) === cleanFullEndpoint));
              }
              
              if (histRes.ok) {
                const historyList = await histRes.json();
                const currentHist = historyList.find((h: any) => normalizeSlug(h.comicEndpoint) === cleanFullEndpoint);
                if (currentHist) {
                  setRecentChapter({ name: currentHist.chapterName, endpoint: normalizeSlug(currentHist.chapterEndpoint) });
                  foundHistory = true;
                }
              }
            } catch (err) {
              console.error('Failed to fetch DB data', err);
            }
          }

          // Fallback to LocalStorage (guest or if DB has no entry yet)
          if (!foundHistory) {
            try {
              const bookmarks = JSON.parse(localStorage.getItem('nekoma_bookmarks') || '[]');
              setIsBookmarked(bookmarks.some((b: any) => normalizeSlug(b.endpoint) === cleanFullEndpoint));
              
              const history = JSON.parse(localStorage.getItem('nekoma_history') || '{}');
              const localEntry = history[cleanFullEndpoint] || 
                history[`/${cleanFullEndpoint}/`] ||
                history[`/${cleanFullEndpoint}`] ||
                history[cleanFullEndpoint + '/'] ||
                Object.entries(history).find(([k]) => normalizeSlug(k) === cleanFullEndpoint)?.[1];

              if (localEntry) {
                setRecentChapter({
                  name: localEntry.name,
                  endpoint: normalizeSlug(localEntry.endpoint)
                });
              }
            } catch (err) {
              console.error('Failed to parse localStorage history', err);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching comic details:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadComic();
  }, [fullEndpoint, cleanFullEndpoint, session]);

  const toggleBookmark = async () => {
    if (!comic) return;
    
    if (session?.user) {
      // Logic for authenticated user
      try {
        if (isBookmarked) {
          await fetch(`/api/bookmark?endpoint=${encodeURIComponent(fullEndpoint)}`, { method: 'DELETE' });
          setIsBookmarked(false);
        } else {
          await fetch('/api/bookmark', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              comicEndpoint: fullEndpoint,
              comicName: comic.title,
              comicThumbnail: comic.thumbnail,
              comicType: comic.type
            })
          });
          setIsBookmarked(true);
        }
      } catch (error) {
        console.error('Failed to toggle bookmark', error);
      }
    } else {
      // Logic for guest
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
    }
  };

  const handleRead = () => {
    if (!comic || comic.chapter_list.length === 0) return;
    
    let targetEndpoint = '';
    let chapterName = '';
    
    if (recentChapter) {
      targetEndpoint = recentChapter.endpoint;
      chapterName = recentChapter.name;
    } else {
      // Baca dari awal (chapter paling bawah karena mangaku urutannya descending)
      const firstChapter = comic.chapter_list[comic.chapter_list.length - 1];
      targetEndpoint = firstChapter.endpoint;
      chapterName = firstChapter.name;
    }

    const cleanEp = normalizeSlug(targetEndpoint);
    router.push(`/chapter/${encodeURIComponent(cleanEp)}?comic=${encodeURIComponent(cleanFullEndpoint)}&cname=${encodeURIComponent(chapterName)}`);
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
              <img src={`/api/proxy?url=${encodeURIComponent(comic.thumbnail)}`} alt={comic.title} />
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
            {comic.chapter_list?.slice((currentChapterPage - 1) * chaptersPerPage, currentChapterPage * chaptersPerPage).map((chapter: Chapter, idx: number) => {
               const cleanEp = normalizeSlug(chapter.endpoint);
               const isRead = Boolean(
                 recentChapter && (
                   normalizeSlug(recentChapter.endpoint) === cleanEp ||
                   (recentChapter.name && chapter.name && recentChapter.name.trim().toLowerCase() === chapter.name.trim().toLowerCase())
                 )
               );
               
               return (
                 <Link 
                   href={`/chapter/${encodeURIComponent(cleanEp)}?comic=${encodeURIComponent(cleanFullEndpoint)}&cname=${encodeURIComponent(chapter.name)}`} 
                   className="chapter-item-epic glass-panel" 
                   key={idx}
                   onClick={() => {
                     try {
                       const history = JSON.parse(localStorage.getItem('nekoma_history') || '{}');
                       history[cleanFullEndpoint] = { name: chapter.name, endpoint: cleanEp };
                       localStorage.setItem('nekoma_history', JSON.stringify(history));
                     } catch {}
                     setRecentChapter({ name: chapter.name, endpoint: cleanEp });
                   }}
                 >
                   <div className="chapter-item-content">
                     <span className={`chapter-name ${isRead ? 'read' : ''}`}>
                       {chapter.name} {isRead && <span className="read-badge"><History size={12}/> Terakhir Dibaca</span>}
                     </span>
                     {chapter.date && <span className="chapter-date">{chapter.date}</span>}
                   </div>
                 </Link>
               );
            })}
          </div>

          {Math.ceil(totalChapters / chaptersPerPage) > 1 && (
            <div className="pagination-wrapper" style={{ display: 'flex', justifyContent: 'center', marginTop: '3rem', width: '100%' }}>
              <div className="glass-panel" style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '0.25rem', 
                padding: '0.35rem', 
                borderRadius: '16px',
                flexWrap: 'wrap',
                justifyContent: 'center',
                boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
              }}>
                <button 
                  className="action-btn" 
                  disabled={currentChapterPage === 1}
                  onClick={() => setCurrentChapterPage(p => Math.max(1, p - 1))}
                  style={{ 
                    minWidth: '80px', 
                    padding: '0.6rem 1.2rem', 
                    background: currentChapterPage === 1 ? 'transparent' : 'rgba(255,255,255,0.05)',
                    color: currentChapterPage === 1 ? 'rgba(255,255,255,0.2)' : 'var(--text-primary)',
                    borderRadius: '12px',
                    fontWeight: 600,
                    border: 'none',
                    cursor: currentChapterPage === 1 ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => { if (currentChapterPage !== 1) e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
                  onMouseLeave={(e) => { if (currentChapterPage !== 1) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                >
                  Prev
                </button>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0 1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  <span>Hal</span>
                  <input 
                    type="number"
                    min={1}
                    max={Math.ceil(totalChapters / chaptersPerPage)}
                    value={currentChapterPage}
                    onChange={(e) => {
                      let val = parseInt(e.target.value);
                      if (isNaN(val)) return;
                      const maxPage = Math.ceil(totalChapters / chaptersPerPage);
                      if (val < 1) val = 1;
                      if (val > maxPage) val = maxPage;
                      setCurrentChapterPage(val);
                    }}
                    style={{ 
                      padding: '0.5rem', 
                      borderRadius: '10px', 
                      background: 'rgba(0,0,0,0.3)', 
                      color: 'var(--primary-accent)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      outline: 'none',
                      width: '60px',
                      fontWeight: 'bold',
                      textAlign: 'center',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--primary-accent)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
                  />
                  <span>/ {Math.ceil(totalChapters / chaptersPerPage)}</span>
                </div>

                <button 
                  className="action-btn" 
                  disabled={currentChapterPage === Math.ceil(totalChapters / chaptersPerPage)}
                  onClick={() => setCurrentChapterPage(p => Math.min(Math.ceil(totalChapters / chaptersPerPage), p + 1))}
                  style={{ 
                    minWidth: '80px', 
                    padding: '0.6rem 1.2rem', 
                    background: currentChapterPage === Math.ceil(totalChapters / chaptersPerPage) ? 'transparent' : 'var(--primary-accent)',
                    color: currentChapterPage === Math.ceil(totalChapters / chaptersPerPage) ? 'rgba(255,255,255,0.2)' : 'white',
                    borderRadius: '12px',
                    fontWeight: 600,
                    border: 'none',
                    cursor: currentChapterPage === Math.ceil(totalChapters / chaptersPerPage) ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: currentChapterPage === Math.ceil(totalChapters / chaptersPerPage) ? 'none' : '0 4px 12px rgba(239, 71, 111, 0.3)'
                  }}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        <div style={{ marginTop: '4rem' }}>
          <ReactionSection endpoint={fullEndpoint} />
          <CommentSection endpoint={fullEndpoint} />
        </div>
      </div>
    </div>
  );
}
