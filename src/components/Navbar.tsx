'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Cat, Library, Info, LogIn } from 'lucide-react';
import ThemePicker from './ThemePicker';

export default function Navbar() {
  const [query, setQuery] = useState('');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      setQuery('');
    }
  };

  return (
    <nav className="navbar glass-panel">
      <div className="container flex-between nav-container">
        <div className="nav-left">
          <Link href="/" className="nav-logo flex-center" style={{ gap: '10px' }}>
            <img src="/icon.png" alt="NekoMa Logo" style={{ width: '32px', height: '32px', borderRadius: '8px' }} />
            <h1>NekoMa</h1>
          </Link>
          <Link href="/browse" className="nav-link flex-center">
            <Library size={18} />
            <span>Daftar A–Z</span>
          </Link>
          <Link href="/about" className="nav-link flex-center">
            <Info size={18} />
            <span>About</span>
          </Link>
          <Link href="/profile" className="nav-link flex-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            <span>My Profile</span>
          </Link>
        </div>
        
        <div className="nav-right">
          <form onSubmit={handleSearch} className="search-form flex-center">
            <input 
              type="text" 
              placeholder="Search manga..." 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="search-input"
              id="search-input"
            />
            <button type="submit" className="search-btn flex-center" id="search-btn">
              <Search size={20} />
            </button>
          </form>

          <Link href="/login" className="login-btn flex-center glass-panel" style={{ padding: '0.5rem 1rem', borderRadius: '12px', gap: '0.5rem', fontWeight: 600 }}>
            <LogIn size={18} />
            <span>Login</span>
          </Link>

          <ThemePicker />
        </div>
      </div>
    </nav>
  );
}
