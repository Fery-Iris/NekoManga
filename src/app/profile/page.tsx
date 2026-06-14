'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { User, Bookmark, Clock, Settings, ChevronRight } from 'lucide-react';

interface SavedComic {
  name: string;
  endpoint: string;
  thumbnail?: string;
  type?: string;
}

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<'bookmark' | 'history'>('bookmark');
  const [bookmarks, setBookmarks] = useState<Record<string, SavedComic>>({});
  const [history, setHistory] = useState<Record<string, { name: string; endpoint: string }>>({});
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const storedBookmarks = localStorage.getItem('nekoma_bookmarks');
    const storedHistory = localStorage.getItem('nekoma_history');

    if (storedBookmarks) setBookmarks(JSON.parse(storedBookmarks));
    if (storedHistory) setHistory(JSON.parse(storedHistory));
  }, []);

  if (!isMounted) return null; // Avoid hydration mismatch

  const bookmarkList = Object.entries(bookmarks).map(([endpoint, data]) => ({ endpoint, ...data }));
  const historyList = Object.entries(history).map(([endpoint, data]) => ({ endpoint, ...data }));

  return (
    <div className="profile-container container" style={{ paddingTop: '6rem', paddingBottom: '4rem' }}>
      <div className="profile-header glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '2rem', padding: '2rem', borderRadius: '16px', marginBottom: '3rem' }}>
        <div className="profile-avatar-wrapper" style={{ width: '100px', height: '100px', borderRadius: '50%', overflow: 'hidden', border: '4px solid var(--primary-accent)' }}>
           <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=NekoReader" alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover', backgroundColor: '#cbd5e1' }} />
        </div>
        <div className="profile-info">
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Neko Reader</h1>
          <p style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
             <User size={16} /> Pembaca Pemula
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
          <Bookmark size={20} /> Koleksi Bookmark ({bookmarkList.length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'none', border: 'none', color: activeTab === 'history' ? 'var(--primary-accent)' : 'var(--text-secondary)', fontSize: '1.1rem', fontWeight: 600, cursor: 'pointer', borderBottom: activeTab === 'history' ? '2px solid var(--primary-accent)' : 'none' }}
        >
          <Clock size={20} /> Histori Baca ({historyList.length})
        </button>
      </div>

      <div className="profile-content">
        {activeTab === 'bookmark' && (
          <div className="grid-responsive">
            {bookmarkList.length > 0 ? bookmarkList.map((comic) => (
              <div key={comic.endpoint} className="comic-card-wrapper">
                <Link href={`/comic/${encodeURIComponent(comic.endpoint)}`} className="comic-card glass-panel" style={{ display: 'block', textDecoration: 'none' }}>
                  <div className="comic-thumbnail" style={{ height: '200px', backgroundColor: '#333' }}>
                    {/* Fallback image if no thumbnail was saved */}
                    <img src={comic.thumbnail || "/icon.png"} alt={comic.name} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <div className="comic-type-badge">{comic.type || 'Manga'}</div>
                  </div>
                  <div className="comic-info" style={{ padding: '1rem' }}>
                    <h3 className="comic-title" style={{ fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '0.5rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{comic.name}</h3>
                  </div>
                </Link>
              </div>
            )) : (
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
            {historyList.length > 0 ? historyList.map((item) => (
              <div key={item.endpoint} className="history-item glass-panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.5rem', borderRadius: '12px' }}>
                <div>
                  <h3 style={{ color: 'var(--text-primary)', fontSize: '1.2rem', marginBottom: '0.2rem' }}>{item.endpoint.replace(/-/g, ' ').toUpperCase()}</h3>
                  <p style={{ color: 'var(--primary-accent)', fontWeight: 600 }}>Terakhir dibaca: {item.name}</p>
                </div>
                <Link href={`/comic/${encodeURIComponent(item.endpoint)}`} className="btn-primary flex-center" style={{ gap: '0.5rem', borderRadius: '8px' }}>
                  Lanjutkan <ChevronRight size={18} />
                </Link>
              </div>
            )) : (
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
