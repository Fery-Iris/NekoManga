'use client';

import { useEffect, useState, use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { fetchChapterDetail } from '@/lib/api';
import Loader from '@/components/Loader';
import { ArrowLeft, ArrowRight, ScrollText, Image as ImageIcon } from 'lucide-react';
import { useSession } from 'next-auth/react';
import CommentSection from '@/components/CommentSection';
import ReactionSection from '@/components/ReactionSection';

interface ChapterData {
  title: string;
  image: string[];
  next_chapter?: string;
  prev_chapter?: string;
}

function normalizeSlug(str: string | undefined | null): string {
  if (!str) return '';
  return str.replace(/^\/+|\/+$/g, '').replace(/^manga\//, '');
}

function inferComicSlug(chEndpoint: string): string {
  const clean = normalizeSlug(chEndpoint);
  return clean
    .replace(/-chapter-[^-/]+.*$/i, '')
    .replace(/-ch-[^-/]+.*$/i, '');
}

export default function ChapterReaderPage({ params }: { params: Promise<{ endpoint: string[] }> }) {
  const { endpoint } = use(params);
  const fullEndpoint = decodeURIComponent(endpoint.join('/'));
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawComicEndpoint = searchParams.get('comic');
  const chapterName = searchParams.get('cname');
  
  const [chapter, setChapter] = useState<ChapterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [readMode, setReadMode] = useState<'scroll' | 'single'>('scroll');
  const [currentPage, setCurrentPage] = useState(0);
  
  const { data: session } = useSession();

  const cleanChapter = normalizeSlug(fullEndpoint);
  const cleanComic = normalizeSlug(rawComicEndpoint || inferComicSlug(fullEndpoint));

  // Save history both to localStorage and DB whenever chapter data is loaded or changes
  useEffect(() => {
    if (!cleanChapter || !cleanComic) return;

    const currentChapterName = chapterName || chapter?.title || `Chapter ${cleanChapter}`;

    // 1. Always update LocalStorage for instant and offline history
    try {
      const localHistory = JSON.parse(localStorage.getItem('nekoma_history') || '{}');
      localHistory[cleanComic] = {
        name: currentChapterName,
        endpoint: cleanChapter,
        date: new Date().toISOString()
      };
      localStorage.setItem('nekoma_history', JSON.stringify(localHistory));
    } catch (err) {
      console.error('Failed to save history to localStorage', err);
    }

    // 2. If user is logged in, sync to database
    if (session?.user) {
      fetch('/api/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          comicEndpoint: cleanComic,
          chapterName: currentChapterName,
          chapterEndpoint: cleanChapter
        })
      }).catch(err => console.error('Failed to save history to DB', err));
    }
  }, [cleanChapter, cleanComic, chapterName, chapter?.title, session]);

  useEffect(() => {
    const loadChapter = async () => {
      try {
        const res = await fetchChapterDetail(fullEndpoint);
        if (res.success) {
          setChapter(res.data);
        }
      } catch (error) {
        console.error('Error fetching chapter:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadChapter();
  }, [fullEndpoint]);

  if (loading) return <Loader />;
  if (!chapter) return <div className="container" style={{ marginTop: '2rem' }}>Chapter not found.</div>;

  const prevClean = chapter.prev_chapter ? normalizeSlug(chapter.prev_chapter) : null;
  const nextClean = chapter.next_chapter ? normalizeSlug(chapter.next_chapter) : null;

  return (
    <div className="reader-container">
      <div className="reader-topbar glass-panel">
        <button onClick={() => cleanComic ? router.push(`/comic/${encodeURIComponent(cleanComic)}`) : router.back()} className="back-btn flex-center" id="back-btn">
          <ArrowLeft size={20} />
          <span>Kembali</span>
        </button>
        <h2 className="reader-title">{chapter.title}</h2>
        <div className="reader-controls">
          <button 
            onClick={() => setReadMode(readMode === 'scroll' ? 'single' : 'scroll')}
            className="mode-toggle-btn flex-center"
            title={readMode === 'scroll' ? "Ubah ke Mode Halaman" : "Ubah ke Mode Scroll"}
          >
            {readMode === 'scroll' ? <ImageIcon size={20} /> : <ScrollText size={20} />}
          </button>
        </div>
      </div>

      <div className={`reader-images ${readMode}`}>
        {readMode === 'scroll' ? (
          // Scroll Mode: Show all images
          chapter.image?.map((imgUrl: string, idx: number) => {
            let cleanImg = imgUrl;
            if (cleanImg.includes('thumbnail.komiku.to')) {
              cleanImg = cleanImg.replace('thumbnail.komiku.to', 'thumbnail.komiku.org');
            }
            return (
              // eslint-disable-next-line @next/next/no-img-element
              <img 
                key={idx} 
                src={cleanImg} 
                alt={`${chapter.title} halaman ${idx + 1}`} 
                loading={idx < 3 ? 'eager' : 'lazy'}
                referrerPolicy="no-referrer"
                className="reader-page"
                onError={(e) => {
                  const currentSrc = e.currentTarget.src;
                  if (!e.currentTarget.dataset.retried) {
                    e.currentTarget.dataset.retried = '1';
                    if (currentSrc.includes('komiku.to')) {
                      e.currentTarget.src = currentSrc.replace('komiku.to', 'komiku.org');
                    } else if (currentSrc.includes('komiku.org')) {
                      e.currentTarget.src = currentSrc.replace('komiku.org', 'komiku.to');
                    } else {
                      e.currentTarget.src = `/api/proxy?url=${encodeURIComponent(cleanImg)}`;
                    }
                  }
                }}
              />
            );
          })
        ) : (
          // Single Page Mode: Show one image at a time
          <div className="single-page-wrapper">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={chapter.image[currentPage]} 
              alt={`${chapter.title} halaman ${currentPage + 1}`} 
              className="reader-page single"
              referrerPolicy="no-referrer"
              onError={(e) => {
                const currentSrc = e.currentTarget.src;
                if (!e.currentTarget.dataset.retried) {
                  e.currentTarget.dataset.retried = '1';
                  if (currentSrc.includes('komiku.to')) {
                    e.currentTarget.src = currentSrc.replace('komiku.to', 'komiku.org');
                  } else {
                    e.currentTarget.src = `/api/proxy?url=${encodeURIComponent(chapter.image[currentPage])}`;
                  }
                }
              }}
            />
            <div className="single-page-nav">
              <button 
                onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                disabled={currentPage === 0}
                className="page-nav-btn glass-panel flex-center"
              >
                <ArrowLeft size={24} />
              </button>
              <span className="page-indicator glass-panel">
                {currentPage + 1} / {chapter.image.length}
              </span>
              <button 
                onClick={() => setCurrentPage(p => Math.min(chapter.image.length - 1, p + 1))}
                disabled={currentPage === chapter.image.length - 1}
                className="page-nav-btn glass-panel flex-center"
              >
                <ArrowRight size={24} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Reaction Section */}
      <ReactionSection endpoint={cleanChapter} />
      
      <div className="reader-footer glass-panel">
        <p>Akhir dari {chapter.title}</p>
        <div className="chapter-navigation" style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', flexWrap: 'wrap', justifyContent: 'center', width: '100%', maxWidth: '600px' }}>
          {prevClean ? (
            <button 
              onClick={() => router.push(`/chapter/${encodeURIComponent(prevClean)}?comic=${encodeURIComponent(cleanComic)}`)} 
              className="reader-footer-btn flex-center" 
              style={{ flex: 1, minWidth: '160px', gap: '0.5rem' }}
            >
              <ArrowLeft size={16} /> Sebelumnya
            </button>
          ) : (
            <div style={{ flex: 1, minWidth: '160px' }}></div>
          )}
          
          <button 
            onClick={() => cleanComic ? router.push(`/comic/${encodeURIComponent(cleanComic)}`) : router.back()} 
            className="reader-footer-btn" 
            id="go-back-btn" 
            style={{ flex: 1, minWidth: '160px' }}
          >
            Daftar Chapter
          </button>
          
          {nextClean ? (
            <button 
              onClick={() => router.push(`/chapter/${encodeURIComponent(nextClean)}?comic=${encodeURIComponent(cleanComic)}`)} 
              className="reader-footer-btn flex-center" 
              style={{ flex: 1, minWidth: '160px', gap: '0.5rem', background: 'var(--primary-accent)' }}
            >
              Berikutnya <ArrowRight size={16} />
            </button>
          ) : (
            <div style={{ flex: 1, minWidth: '160px' }}></div>
          )}
        </div>
      </div>

      {/* Interactive Comment Section */}
      <CommentSection endpoint={cleanChapter} />
    </div>
  );
}
