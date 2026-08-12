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

export default function ChapterReaderPage({ params }: { params: Promise<{ endpoint: string[] }> }) {
  const { endpoint } = use(params);
  const fullEndpoint = decodeURIComponent(endpoint.join('/'));
  const router = useRouter();
  const searchParams = useSearchParams();
  const comicEndpoint = searchParams.get('comic');
  const chapterName = searchParams.get('cname');
  
  const [chapter, setChapter] = useState<ChapterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [readMode, setReadMode] = useState<'scroll' | 'single'>('scroll');
  const [currentPage, setCurrentPage] = useState(0);
  
  const { data: session } = useSession();

  // Save history
  useEffect(() => {
    if (session?.user && comicEndpoint && chapterName) {
      fetch('/api/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          comicEndpoint,
          chapterName,
          chapterEndpoint: fullEndpoint
        })
      }).catch(err => console.error('Failed to save history to DB', err));
    }
  }, [session, comicEndpoint, chapterName, fullEndpoint]);

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

  return (
    <div className="reader-container">
      <div className="reader-topbar glass-panel">
        <button onClick={() => router.back()} className="back-btn flex-center" id="back-btn">
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
          chapter.image?.map((imgUrl: string, idx: number) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img 
              key={idx} 
              src={`/api/proxy?url=${encodeURIComponent(imgUrl)}`} 
              alt={`${chapter.title} halaman ${idx + 1}`} 
              loading="lazy"
              className="reader-page"
            />
          ))
        ) : (
          // Single Page Mode: Show one image at a time
          <div className="single-page-wrapper">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={`/api/proxy?url=${encodeURIComponent(chapter.image[currentPage])}`} 
              alt={`${chapter.title} halaman ${currentPage + 1}`} 
              className="reader-page single"
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
      <ReactionSection endpoint={fullEndpoint} />
      
      <div className="reader-footer glass-panel">
        <p>Akhir dari {chapter.title}</p>
        <div className="chapter-navigation" style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', flexWrap: 'wrap', justifyContent: 'center', width: '100%', maxWidth: '600px' }}>
          {chapter.prev_chapter ? (
            <button onClick={() => router.push(`/chapter/${chapter.prev_chapter}${comicEndpoint ? `?comic=${comicEndpoint}` : ''}`)} className="reader-footer-btn flex-center" style={{ flex: 1, minWidth: '160px', gap: '0.5rem' }}>
              <ArrowLeft size={16} /> Sebelumnya
            </button>
          ) : (
             <div style={{ flex: 1, minWidth: '160px' }}></div>
          )}
          
          <button onClick={() => comicEndpoint ? router.push(`/comic/${comicEndpoint}`) : router.back()} className="reader-footer-btn" id="go-back-btn" style={{ flex: 1, minWidth: '160px' }}>
            Daftar Chapter
          </button>
          
          {chapter.next_chapter ? (
            <button onClick={() => router.push(`/chapter/${chapter.next_chapter}${comicEndpoint ? `?comic=${comicEndpoint}` : ''}`)} className="reader-footer-btn flex-center" style={{ flex: 1, minWidth: '160px', gap: '0.5rem', background: 'var(--primary-accent)' }}>
              Berikutnya <ArrowRight size={16} />
            </button>
          ) : (
             <div style={{ flex: 1, minWidth: '160px' }}></div>
          )}
        </div>
      </div>

      {/* Interactive Comment Section */}
      <CommentSection endpoint={fullEndpoint} />
    </div>
  );
}
