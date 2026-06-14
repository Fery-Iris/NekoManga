'use client';

import { Cat, Shield, Globe, Server, Heart, ExternalLink, Mail } from 'lucide-react';
import ScrollReveal from '@/components/ScrollReveal';

export default function AboutPage() {
  return (
    <div className="about-container container">
      {/* Hero */}
      <ScrollReveal animation="fade-down" duration={700}>
        <div className="about-hero">
          <div className="about-hero-icon" style={{ overflow: 'hidden', borderRadius: '16px' }}>
            <img src="/icon.png" alt="NekoMa Logo" style={{ width: '80px', height: '80px', objectFit: 'cover' }} />
          </div>
          <h1 className="about-hero-title">Tentang <span className="about-accent">NekoMa</span></h1>
          <p className="about-hero-subtitle">
            Platform agregator manga, manhwa & manhua terlengkap — gratis dan tanpa iklan.
          </p>
        </div>
      </ScrollReveal>

      {/* Features */}
      <ScrollReveal animation="fade-up" duration={600} delay={100}>
        <div className="about-features">
          {[
            { icon: <Globe size={24} />, title: 'Agregator Konten', desc: 'Menampilkan konten yang tersedia secara publik di internet.' },
            { icon: <Server size={24} />, title: 'Tanpa Hosting', desc: 'Tidak menyimpan file gambar atau media di server kami.' },
            { icon: <Heart size={24} />, title: 'Untuk Komunitas', desc: 'Dibangun dengan cinta untuk para pecinta komik Indonesia.' },
          ].map((item, i) => (
            <ScrollReveal key={i} animation="zoom-in" delay={i * 120} duration={500}>
              <div className="about-feature-card glass-panel">
                <div className="about-feature-icon">{item.icon}</div>
                <h3>{item.title}</h3>
                <p>{item.desc}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </ScrollReveal>

      {/* Disclaimer */}
      <ScrollReveal animation="fade-up" duration={600} delay={200}>
        <div className="about-disclaimer glass-panel">
          <div className="about-disclaimer-header">
            <Shield size={24} />
            <h2>Disclaimer</h2>
          </div>
          <div className="about-disclaimer-body">
            <p>
              Semua konten yang ditampilkan di <strong>NekoMa</strong> tidak diunggah 
              atau dihosting secara langsung oleh kami.
            </p>
            <p>
              NekoMa berfungsi sebagai <strong>agregator dan penampil konten</strong> yang 
              tersedia secara publik di internet. Kami <strong>tidak menyimpan</strong> file 
              gambar, komik, atau media lainnya secara langsung di server kami.
            </p>
            <p>
              Jika Anda adalah pemilik hak cipta dan ingin konten Anda dihapus, silakan 
              hubungi kami dan kami akan segera memprosesnya.
            </p>
          </div>
        </div>
      </ScrollReveal>

      {/* Contact */}
      <ScrollReveal animation="fade-up" duration={600} delay={300}>
        <div className="about-contact">
          <h2>Ada Pertanyaan?</h2>
          <p>Hubungi kami melalui email atau buka issue di GitHub.</p>
          <div className="about-contact-links">
            <a href="mailto:contact@nekoma.id" className="about-link-btn glass-panel">
              <Mail size={18} />
              <span>Email Kami</span>
            </a>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="about-link-btn glass-panel">
              <ExternalLink size={18} />
              <span>GitHub</span>
            </a>
          </div>
        </div>
      </ScrollReveal>

      {/* Footer */}
      <ScrollReveal animation="fade-up" duration={400} delay={400}>
        <div className="about-footer">
          <Cat size={20} />
          <p>NekoMa © {new Date().getFullYear()} — Made with 💜 for manga lovers.</p>
        </div>
      </ScrollReveal>
    </div>
  );
}
