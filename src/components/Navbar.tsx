'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Search, Library, Info, LogIn, Home, User, X, Loader2 } from 'lucide-react';
import ThemePicker from './ThemePicker';
import { useSession, signOut } from 'next-auth/react';

export default function Navbar() {
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const router = useRouter();
  const pathname = usePathname();
  const { data: session, status } = useSession();

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.trim().length >= 2) {
        setLoadingSuggestions(true);
        try {
          const res = await fetch(`/api/comic/search/${encodeURIComponent(query.trim())}`);
          const data = await res.json();
          if (data.success && data.data) {
            setSuggestions(data.data.slice(0, 5));
          } else {
            setSuggestions([]);
          }
          setShowSuggestions(true);
        } catch (error) {
          console.error('Failed to fetch suggestions', error);
        } finally {
          setLoadingSuggestions(false);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      setQuery('');
      setSearchOpen(false);
      setShowSuggestions(false);
    }
  };

  return (
    <>
      {/* ===== TOP NAVBAR ===== */}
      <nav className="navbar glass-panel">
        <div className="container flex-between nav-container">
          <div className="nav-left">
            <Link href="/" className="nav-logo flex-center" style={{ gap: '10px' }}>
              <img src="/icon.png" alt="NekoMa Logo" style={{ width: '32px', height: '32px', borderRadius: '8px' }} />
              <h1>NekoMa</h1>
            </Link>
            {/* Desktop-only nav links */}
            <Link href="/browse" className="nav-link nav-link-desktop flex-center">
              <Library size={18} />
              <span>Daftar A–Z</span>
            </Link>
            <Link href="/about" className="nav-link nav-link-desktop flex-center">
              <Info size={18} />
              <span>About</span>
            </Link>
            <Link href="/profile" className="nav-link nav-link-desktop flex-center">
              <User size={18} />
              <span>My Profile</span>
            </Link>
          </div>
          
          <div className="nav-right">
            {/* Desktop search */}
            <div style={{ position: 'relative' }}>
              <form onSubmit={handleSearch} className="search-form search-form-desktop flex-center">
                <Search size={16} className="search-icon" />
                <input 
                  type="text" 
                  placeholder="Cari manga..." 
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => { if (suggestions.length > 0 || query.trim().length >= 2) setShowSuggestions(true); }}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  className="search-input"
                />
                {loadingSuggestions && <Loader2 size={16} className="search-icon" style={{ animation: 'spin 1s linear infinite', marginLeft: 'auto' }} />}
              </form>
              
              {showSuggestions && query.trim().length >= 2 && (
                <div className="search-suggestions glass-panel search-form-desktop" style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '0.5rem', borderRadius: '12px', overflow: 'hidden', zIndex: 100, display: 'flex', flexDirection: 'column' }}>
                  {suggestions.map((item, idx) => (
                    <Link 
                      key={idx} 
                      href={`/comic/${item.endpoint}`} 
                      className="suggestion-item"
                      style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', borderBottom: idx === suggestions.length - 1 ? 'none' : '1px solid var(--glass-border)', textDecoration: 'none', color: 'var(--text-primary)', transition: 'background 0.2s' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-color-lighter)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      onClick={() => { setQuery(''); setShowSuggestions(false); setSearchOpen(false); }}
                    >
                      <img src={item.image} alt={item.title} style={{ width: '32px', height: '42px', objectFit: 'cover', borderRadius: '4px' }} />
                      <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.title}</span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{item.type || 'Manga'}</span>
                      </div>
                    </Link>
                  ))}
                  {suggestions.length === 0 && !loadingSuggestions && query.trim().length >= 2 && (
                    <div style={{ padding: '1rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Tidak ditemukan</div>
                  )}
                </div>
              )}
            </div>

            {/* Mobile search toggle */}
            <button 
              className="mobile-search-toggle flex-center" 
              onClick={() => setSearchOpen(!searchOpen)}
              aria-label="Search"
            >
              {searchOpen ? <X size={20} /> : <Search size={20} />}
            </button>

            <ThemePicker />

            {status === 'loading' ? (
              <div className="nav-btn-loading" style={{ width: '38px', height: '38px', borderRadius: '50%', backgroundColor: 'var(--glass-bg)', animation: 'pulse 1.5s infinite' }}></div>
            ) : session ? (
              <div className="user-menu" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Link href="/profile" className="user-avatar-link">
                  <img src={session.user?.image || "/icon.png"} alt="User" className="user-avatar-img" />
                </Link>
                <button onClick={() => signOut()} className="btn-secondary logout-btn-desktop flex-center">
                  Keluar
                </button>
              </div>
            ) : (
              <Link href="/login" className="btn-primary flex-center login-btn">
                <LogIn size={18} />
                <span>Masuk</span>
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Search Dropdown */}
        <div className={`mobile-search-dropdown ${searchOpen ? 'open' : ''}`} style={{ overflow: showSuggestions ? 'visible' : 'hidden' }}>
          <div style={{ position: 'relative' }}>
            <form onSubmit={handleSearch} className="mobile-search-form flex-center">
              <Search size={18} className="search-icon" />
              <input 
                type="text" 
                placeholder="Cari manga, manhwa, manhua..." 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => { if (suggestions.length > 0 || query.trim().length >= 2) setShowSuggestions(true); }}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                className="search-input"
                autoFocus={searchOpen}
              />
              {loadingSuggestions && <Loader2 size={16} className="search-icon" style={{ animation: 'spin 1s linear infinite', marginLeft: 'auto' }} />}
            </form>

            {showSuggestions && searchOpen && query.trim().length >= 2 && (
                <div className="search-suggestions glass-panel" style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '0.5rem', borderRadius: '12px', overflow: 'hidden', zIndex: 100, display: 'flex', flexDirection: 'column' }}>
                  {suggestions.map((item, idx) => (
                    <Link 
                      key={idx} 
                      href={`/comic/${item.endpoint}`} 
                      className="suggestion-item"
                      style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', borderBottom: idx === suggestions.length - 1 ? 'none' : '1px solid var(--glass-border)', textDecoration: 'none', color: 'var(--text-primary)', transition: 'background 0.2s' }}
                      onClick={() => { setQuery(''); setShowSuggestions(false); setSearchOpen(false); }}
                    >
                      <img src={item.image} alt={item.title} style={{ width: '32px', height: '42px', objectFit: 'cover', borderRadius: '4px' }} />
                      <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.title}</span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{item.type || 'Manga'}</span>
                      </div>
                    </Link>
                  ))}
                  {suggestions.length === 0 && !loadingSuggestions && query.trim().length >= 2 && (
                    <div style={{ padding: '1rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Tidak ditemukan</div>
                  )}
                </div>
            )}
          </div>
        </div>
      </nav>

      {/* ===== MOBILE BOTTOM NAV ===== */}
      {!pathname?.startsWith('/chapter') && (
        <nav className="mobile-bottom-nav glass-panel">
          <Link href="/" className={`bottom-nav-item ${pathname === '/' ? 'active' : ''}`}>
            <Home size={22} />
            <span>Beranda</span>
          </Link>
          <Link href="/browse" className={`bottom-nav-item ${pathname === '/browse' ? 'active' : ''}`}>
            <Library size={22} />
            <span>Daftar</span>
          </Link>
          <Link href="/search" className={`bottom-nav-item ${pathname === '/search' ? 'active' : ''}`}>
            <div className="bottom-nav-search-icon flex-center">
              <Search size={22} />
            </div>
            <span>Cari</span>
          </Link>
          <Link href="/about" className={`bottom-nav-item ${pathname === '/about' ? 'active' : ''}`}>
            <Info size={22} />
            <span>About</span>
          </Link>
          <Link href="/profile" className={`bottom-nav-item ${pathname === '/profile' ? 'active' : ''}`}>
            <User size={22} />
            <span>Profil</span>
          </Link>
        </nav>
      )}
    </>
  );
}
