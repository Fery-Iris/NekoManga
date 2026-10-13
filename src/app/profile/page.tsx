'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { User, Bookmark, Clock, Settings, ChevronRight } from 'lucide-react';
import { useSession } from 'next-auth/react';

interface SavedComic {
  name?: string; // used for history
  endpoint?: string; // used for bookmark fallback
  comicEndpoint?: string; // used for db bookmark
  comicName?: string; // used for db bookmark
  comicThumbnail?: string;
  comicType?: string;
  chapterName?: string; // used for db history
  chapterEndpoint?: string; // used for db history
  title?: string; // fallback
  thumbnail?: string; // fallback
  type?: string; // fallback
}

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<'bookmark' | 'history'>('bookmark');
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const { data: session } = useSession();

  useEffect(() => {
    setIsMounted(true);

    const loadData = async () => {
      if (session?.user) {
        // Fetch from DB
        try {
          const [bmRes, histRes] = await Promise.all([
            fetch('/api/bookmark'),
            fetch('/api/history')
          ]);
          
          if (bmRes.ok) {
            setBookmarks(await bmRes.json());
          }
          if (histRes.ok) {
            setHistory(await histRes.json());
          }
        } catch (err) {
          console.error("Failed to fetch profile data from DB", err);
        }
      } else {
        // Fetch from LocalStorage
        const storedBookmarks = localStorage.getItem('nekoma_bookmarks');
        const storedHistory = localStorage.getItem('nekoma_history');

        if (storedBookmarks) {
          setBookmarks(JSON.parse(storedBookmarks));
        }
        if (storedHistory) {
          const parsed = JSON.parse(storedHistory);
          // Convert history object to array format to match DB structure conceptually
          const historyArray = Object.entries(parsed).map(([endpoint, data]: any) => ({
            comicEndpoint: endpoint,
            chapterName: data.name,
            chapterEndpoint: data.endpoint
          }));
          setHistory(historyArray);
        }
      }
    };

    loadData();
  }, [session]);

  if (!isMounted) return null; // Avoid hydration mismatch

  return (
    <div className="profile-container container" style={{ paddingTop: '6rem', paddingBottom: '4rem' }}>
      <div className="profile-header glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '2rem', padding: '2rem', borderRadius: '16px', marginBottom: '3rem' }}>
        <div className="profile-avatar-wrapper" style={{ width: '100px', height: '100px', borderRadius: '50%', overflow: 'hidden', border: '4px solid var(--primary-accent)' }}>
           <img src={session?.user?.image || "https://api.dicebear.com/7.x/avataaars/svg?seed=NekoReader"} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover', backgroundColor: '#cbd5e1' }} />
        </div>
        <div className="profile-info">
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>{session?.user?.name || "Neko Reader"}</h1>
          <p style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
             <User size={16} /> {session?.user ? "Pembaca Setia" : "Pembaca Guest"}
          </p>
        </div>
        <button className="btn-secondary" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
           <Settings size={18} /> Edit Profil
        </button>
      </div>

      <div className="profile-tabs" style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem' }}>
        <button 
          className={`tab-btn ${activeTab === 'bookmark' ? 'active' : ''}`}
          onClick={() => setActiveTab('bookmark')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'none', border: 'none', color: activeTab === 'bookmark' ? 'var(--primary-accent)' : 'var(--text-secondary)', fontSize: '1.1rem', fontWeight: 600, cursor: 'pointer', borderBottom: activeTab === 'bookmark' ? '2px solid var(--primary-accent)' : 'none' }}
        >
          <Bookmark size={20} /> Koleksi Bookmark ({bookmarks.length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'none', border: 'none', color: activeTab === 'history' ? 'var(--primary-accent)' : 'var(--text-secondary)', fontSize: '1.1rem', fontWeight: 600, cursor: 'pointer', borderBottom: activeTab === 'history' ? '2px solid var(--primary-accent)' : 'none' }}
        >
          <Clock size={20} /> Histori Baca ({history.length})
        </button>
      </div>

      <div className="profile-content">
        {activeTab === 'bookmark' && (
          <div className="grid-responsive">
            {bookmarks.length > 0 ? bookmarks.map((comic, idx) => {
              const endpoint = comic.comicEndpoint || comic.endpoint;
              const title = comic.comicName || comic.title;
              const thumbnail = comic.comicThumbnail || comic.thumbnail;
              const type = comic.comicType || comic.type;
              
              return (
                <Link key={idx} href={`/comic/${encodeURIComponent(endpoint)}`} className="comic-card">
                  <div className="comic-cover-wrapper">
                    <img 
                      src={thumbnail || "/icon.png"} 
                      alt={title} 
                      className="comic-cover" 
                      loading="lazy" 
                      referrerPolicy="no-referrer"
                      onError={(e) => { e.currentTarget.src = '/icon.png'; }}
                    />
                    {type && <div className="comic-type">{type}</div>}
                  </div>
                  <div className="comic-info">
                    <h3 className="comic-title">{title}</h3>
                  </div>
                </Link>
              );
            }) : (
              <div className="empty-state" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem 0', color: 'var(--text-secondary)' }}>
                <Bookmark size={48} style={{ margin: '0 auto 1rem auto', opacity: 0.5 }} />
                <p>Belum ada komik yang di-bookmark.</p>
                <Link href="/browse" className="btn-primary" style={{ display: 'inline-block', marginTop: '1rem' }}>Cari Manga</Link>
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="history-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {history.length > 0 ? history.map((item, idx) => {
              const cleanComic = (item.comicEndpoint || item.endpoint || '').replace(/^\/+|\/+$/g, '').replace(/^manga\//, '');
              const cleanChapter = (item.chapterEndpoint || item.endpoint || '').replace(/^\/+|\/+$/g, '');
              const chapterName = item.chapterName || item.name || 'Chapter';
              const comicTitle = cleanComic.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
              
              const targetLink = cleanChapter 
                ? `/chapter/${encodeURIComponent(cleanChapter)}?comic=${encodeURIComponent(cleanComic)}` 
                : `/comic/${encodeURIComponent(cleanComic)}`;

              return (
                <div key={idx} className="history-item glass-panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.5rem', borderRadius: '12px' }}>
                  <div>
                    <h3 style={{ color: 'var(--text-primary)', fontSize: '1.2rem', marginBottom: '0.2rem' }}>{comicTitle}</h3>
                    <p style={{ color: 'var(--primary-accent)', fontWeight: 600 }}>Terakhir dibaca: {chapterName}</p>
                  </div>
                  <Link href={targetLink} className="btn-primary flex-center" style={{ gap: '0.5rem', borderRadius: '8px', padding: '0.6rem 1.25rem' }}>
                    Lanjut Baca <ChevronRight size={18} />
                  </Link>
                </div>
              );
            }) : (
              <div className="empty-state" style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-secondary)' }}>
                <Clock size={48} style={{ margin: '0 auto 1rem auto', opacity: 0.5 }} />
                <p>Belum ada histori baca.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
