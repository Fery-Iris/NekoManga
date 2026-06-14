import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import ThemeProvider from "@/components/ThemeProvider";
import MouseTrail from "@/components/MouseTrail";
import AuthProvider from "@/components/AuthProvider";

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
        <link rel="icon" type="image/png" href="/icon.png" />
        <link rel="apple-touch-icon" href="/icon.png"></link>
        <meta name="theme-color" content="#0f172a" />
      </head>
      <body>
        <AuthProvider>
          <ThemeProvider>
            <MouseTrail />
            <Navbar />
            <main>{children}</main>
          </ThemeProvider>
        </AuthProvider>

        {/* Service Worker Removed */}
      </body>
    </html>
  );
}

