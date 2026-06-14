import Link from 'next/link';
import { Home, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="not-found-container container flex-center" style={{ minHeight: '80vh', flexDirection: 'column', textAlign: 'center' }}>
      <div className="not-found-content">
        <h1 className="error-code" style={{ fontSize: '6rem', fontWeight: 900, color: 'var(--primary-accent)', marginBottom: '1rem', textShadow: '0 0 20px rgba(59, 130, 246, 0.5)' }}>404</h1>
        
        {/* Placeholder for a cool manga-style cat looking lost */}
        <div className="error-image-wrapper" style={{ margin: '2rem auto', maxWidth: '300px' }}>
          <img 
            src="/icon.png" 
            alt="Lost Neko" 
            style={{ width: '100%', height: 'auto', opacity: 0.8, filter: 'grayscale(0.5)' }} 
          />
        </div>

        <h2 style={{ fontSize: '2rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>Nyah? Halaman Tidak Ditemukan!</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2.5rem', maxWidth: '500px', margin: '0 auto 2.5rem auto', lineHeight: 1.6 }}>
          Sepertinya kucing kami tersesat membawa Anda ke halaman yang salah. 
          Atau mungkin chapter komik yang Anda cari sudah dihapus.
        </p>

        <div className="error-actions" style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/" className="btn-primary flex-center" style={{ gap: '0.5rem', padding: '0.8rem 1.5rem', borderRadius: '8px' }}>
            <Home size={20} /> Kembali ke Beranda
          </Link>
          <Link href="/browse" className="btn-secondary flex-center" style={{ gap: '0.5rem', padding: '0.8rem 1.5rem', borderRadius: '8px' }}>
            <Search size={20} /> Cari Manga Lain
          </Link>
        </div>
      </div>
    </div>
  );
}
