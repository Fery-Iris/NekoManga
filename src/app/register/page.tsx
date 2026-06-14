'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Cat, Mail, Lock, User, ArrowRight } from 'lucide-react';
import ScrollReveal from '@/components/ScrollReveal';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Terjadi kesalahan');
      }

      // Automatically login after successful registration
      router.push('/login?registered=true');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container flex-center">
      <ScrollReveal animation="zoom-in" duration={600}>
        <div className="auth-card glass-panel">
          <div className="auth-header">
            <div className="auth-logo flex-center">
              <Cat size={32} />
            </div>
            <h2>Buat Akun Baru</h2>
            <p>Daftar sekarang untuk menyimpan progress membaca komikmu.</p>
          </div>

          {error && (
            <div className="auth-error" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', textAlign: 'center', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="auth-form">
            <div className="input-group">
              <label htmlFor="name">Nama Panggilan</label>
              <div className="input-wrapper">
                <User size={18} className="input-icon" />
                <input 
                  type="text" 
                  id="name"
                  placeholder="Neko Reader" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="email">Email</label>
              <div className="input-wrapper">
                <Mail size={18} className="input-icon" />
                <input 
                  type="email" 
                  id="email"
                  placeholder="nama@email.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="password">Password</label>
              <div className="input-wrapper">
                <Lock size={18} className="input-icon" />
                <input 
                  type="password" 
                  id="password"
                  placeholder="Minimal 6 karakter" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
            </div>

            <button type="submit" className="auth-submit-btn flex-center" disabled={isLoading}>
              <span>{isLoading ? 'Memproses...' : 'Daftar Sekarang'}</span>
              {!isLoading && <ArrowRight size={18} />}
            </button>
          </form>

          <p className="auth-footer-text">
            Sudah punya akun? <Link href="/login" className="register-link">Login di sini</Link>
          </p>
        </div>
      </ScrollReveal>
    </div>
  );
}
