import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import ThemeProvider from "@/components/ThemeProvider";
import MouseTrail from "@/components/MouseTrail";

export const metadata: Metadata = {
  title: "NekoMa - Baca Manga, Manhwa & Manhua Online",
  description: "Baca manga, manhwa, dan manhua online gratis dengan koleksi terlengkap. NekoMa menyediakan ribuan judul dengan update terbaru.",
  keywords: "manga, manhwa, manhua, baca komik, komik online, nekoma, neko manga",
  manifest: "/manifest.json",
  icons: {
    icon: '/icon.png',
    apple: '/icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon.png"></link>
        <meta name="theme-color" content="#0f172a" />
      </head>
      <body>
        <ThemeProvider>
          <MouseTrail />
          <Navbar />
          <main>{children}</main>
        </ThemeProvider>
        
        {/* Service Worker Registration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(
                    function(registration) {
                      console.log('Service Worker registration successful');
                    },
                    function(err) {
                      console.log('Service Worker registration failed: ', err);
                    }
                  );
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}

