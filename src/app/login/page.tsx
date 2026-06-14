'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Cat, Mail, Lock, Code, Globe, ArrowRight } from 'lucide-react';
import ScrollReveal from '@/components/ScrollReveal';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Ini masih halaman UI (Frontend Only). Nanti kita sambungkan ke Prisma & Database!");
  };

  return (
    <div className="auth-container flex-center">
      <ScrollReveal animation="zoom-in" duration={600}>
        <div className="auth-card glass-panel">
          <div className="auth-header">
            <div className="auth-logo flex-center">
              <Cat size={32} />
            </div>
            <h2>Selamat Datang Kembali!</h2>
            <p>Login ke NekoMa untuk berinteraksi dan menyimpan komik favoritmu.</p>
          </div>

          <form onSubmit={handleLogin} className="auth-form">
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
              <div className="label-row flex-between">
                <label htmlFor="password">Password</label>
                <a href="#" className="forgot-link">Lupa password?</a>
              </div>
              <div className="input-wrapper">
                <Lock size={18} className="input-icon" />
                <input 
                  type="password" 
                  id="password"
                  placeholder="••••••••" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button type="submit" className="auth-submit-btn flex-center">
              <span>Masuk Sekarang</span>
              <ArrowRight size={18} />
            </button>
          </form>

          <div className="auth-divider">
            <span>Atau masuk dengan</span>
          </div>

          <div className="auth-social">
            <button className="social-btn glass-panel" type="button" onClick={() => alert("UI Only")}>
              <Globe size={18} />
              <span>Google</span>
            </button>
            <button className="social-btn glass-panel" type="button" onClick={() => alert("UI Only")}>
              <Code size={18} />
              <span>GitHub</span>
            </button>
          </div>

          <p className="auth-footer-text">
            Belum punya akun? <Link href="/register" className="register-link">Daftar di sini</Link>
          </p>
        </div>
      </ScrollReveal>
    </div>
  );
}
