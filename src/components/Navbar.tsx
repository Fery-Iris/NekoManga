'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Search, Library, Info, LogIn, Home, User, X } from 'lucide-react';
import ThemePicker from './ThemePicker';
import { useSession, signOut } from 'next-auth/react';

export default function Navbar() {
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, status } = useSession();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      setQuery('');
      setSearchOpen(false);
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
            <form onSubmit={handleSearch} className="search-form search-form-desktop flex-center">
              <Search size={16} className="search-icon" />
              <input 
                type="text" 
                placeholder="Cari manga..." 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="search-input"
              />
            </form>

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
        <div className={`mobile-search-dropdown ${searchOpen ? 'open' : ''}`}>
          <form onSubmit={handleSearch} className="mobile-search-form flex-center">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder="Cari manga, manhwa, manhua..." 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="search-input"
              autoFocus={searchOpen}
            />
          </form>
        </div>
      </nav>

      {/* ===== MOBILE BOTTOM NAV ===== */}
      <nav className="mobile-bottom-nav glass-panel">
        <Link href="/" className={`bottom-nav-item ${pathname === '/' ? 'active' : ''}`}>
          <Home size={22} />
          <span>Beranda</span>
        </Link>
        <Link href="/browse" className={`bottom-nav-item ${pathname === '/browse' ? 'active' : ''}`}>
          <Library size={22} />
          <span>Daftar</span>
        </Link>
        <button 
          className="bottom-nav-item bottom-nav-search"
          onClick={() => { setSearchOpen(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
        >
          <div className="bottom-nav-search-icon flex-center">
            <Search size={22} />
          </div>
          <span>Cari</span>
        </button>
        <Link href="/about" className={`bottom-nav-item ${pathname === '/about' ? 'active' : ''}`}>
          <Info size={22} />
          <span>About</span>
        </Link>
        <Link href="/profile" className={`bottom-nav-item ${pathname === '/profile' ? 'active' : ''}`}>
          <User size={22} />
          <span>Profil</span>
        </Link>
      </nav>
    </>
  );
}
