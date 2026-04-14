import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import Navbar from "@/components/Navbar";
import CookieConsent from "@/components/CookieConsent";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "FootBrowse — World Cup 2026 Stats, Matches & Teams",
    template: "%s | FootBrowse",
  },
  description:
    "FootBrowse is your data-driven guide to World Cup 2026. Browse match previews, team profiles, stadium guides, and player stats.",
  metadataBase: new URL("https://footbrowse.com"),
  icons: {
    icon: [
      { url: "/favicon-96x96.png", type: "image/png", sizes: "96x96" },
      { url: "/favicon.png", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", type: "image/png", sizes: "180x180" },
    ],
    shortcut: "/favicon.png",
    other: [
      { rel: "manifest", url: "/site.webmanifest" },
    ],
  },
  openGraph: {
    title: "FootBrowse — World Cup 2026 Stats, Matches & Teams",
    description: "Your data-driven guide to FIFA World Cup 2026. Browse match previews, team profiles, stadium guides, and player stats.",
    url: "https://footbrowse.com",
    siteName: "FootBrowse",
    images: [
      {
        url: "https://footbrowse.com/og-image.png",
        width: 1200,
        height: 630,
        alt: "FootBrowse — World Cup 2026",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FootBrowse — World Cup 2026 Stats, Matches & Teams",
    description: "Your data-driven guide to FIFA World Cup 2026.",
    images: ["https://footbrowse.com/og-image.png"],
  },
  other: {
    "google-adsense-account": "ca-pub-4267668572437273",
  },
};

const navLinks = [
  { href: "/matches", label: "Matches" },
  { href: "/teams", label: "Teams" },
  { href: "/stadiums", label: "Stadiums" },
  { href: "/players", label: "Players" },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Favicon */}
        <link rel="icon" href="/favicon-96x96.png" type="image/png" sizes="96x96" />
        <link rel="icon" type="image/png" href="/favicon.png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />

        {/* AdSense — must be a real <script> in <head> for Google's crawler */}
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4267668572437273"
          crossOrigin="anonymous"
        />
        {/* Travelpayouts verification */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var s=document.createElement("script");s.async=1;s.src="https://mn-tz.com/NTE3OTIy.js?t=517922";document.head.appendChild(s);})();`,
          }}
        />
      </head>
      <body className="min-h-screen flex flex-col">
        {process.env.NODE_ENV === "production" && process.env.NEXT_PUBLIC_GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga4-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}');
              `}
            </Script>
          </>
        )}

        {/* ── Header: backdrop-blur frosted glass ── */}
        <header
          className="sticky top-0 z-50 border-b"
          style={{
            backgroundColor: "rgba(10,10,10,0.82)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            borderBottomColor: "rgba(39,39,42,0.7)",
          }}
        >
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 flex items-center justify-between h-14">

            {/* Logo */}
            <Link
              href="/"
              className="flex items-center gap-2 font-black text-lg tracking-tight text-white transition-opacity hover:opacity-80"
              style={{ letterSpacing: "-0.03em" }}
            >
              <img
                src="/favicon.png"
                alt="FootBrowse Logo"
                className="w-7 h-7 rounded-md"
              />
              FootBrowse
            </Link>

            {/* Nav */}
            <Navbar />
          </div>
        </header>

        {/* ── Main content ── */}
        <main className="flex-1 mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>

        <CookieConsent />

        {/* ── Footer ── */}
        <footer
          className="mt-auto border-t"
          style={{
            backgroundColor: "rgba(12,12,12,0.95)",
            borderTopColor: "rgba(39,39,42,0.8)",
          }}
        >
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10">
            <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-8 text-center sm:text-left">

              {/* Brand */}
              <div>
                <p
                  className="font-black text-white text-lg"
                  style={{ letterSpacing: "-0.03em" }}
                >
                  <img
                    src="/favicon.png"
                    alt="FootBrowse Logo"
                    className="inline-block w-6 h-6 rounded mr-2 align-middle"
                  />
                  FootBrowse
                </p>
                <p className="text-xs text-zinc-500 mt-2 max-w-xs leading-relaxed mx-auto sm:mx-0">
                  Your data-driven guide to the FIFA World Cup 2026.
                  Stats, fixtures, and profiles for every match, team,
                  player, and stadium.
                </p>
              </div>

              {/* Links */}
              <div className="flex flex-row sm:flex-row gap-12 sm:gap-8">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.15em] text-zinc-600 font-bold mb-3">
                    Browse
                  </p>
                  <nav className="flex flex-col gap-2">
                    {navLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className="text-sm text-zinc-400 hover:text-white transition-colors"
                      >
                        {link.label}
                      </Link>
                    ))}
                  </nav>
                </div>

                <div>
                  <p className="text-[10px] uppercase tracking-[0.15em] text-zinc-600 font-bold mb-3">
                    Follow
                  </p>
                  <nav className="flex flex-col gap-2">
                    <a
                      href="#"
                      className="text-sm text-zinc-400 hover:text-white transition-colors"
                    >
                      X / Twitter
                    </a>
                    <a
                      href="#"
                      className="text-sm text-zinc-400 hover:text-white transition-colors"
                    >
                      Instagram
                    </a>
                    <a
                      href="#"
                      className="text-sm text-zinc-400 hover:text-white transition-colors"
                    >
                      YouTube
                    </a>
                  </nav>
                </div>
              </div>
            </div>

            <div
              className="mt-8 pt-6 flex flex-col sm:flex-row items-center sm:items-center justify-between gap-2 text-center sm:text-left"
              style={{ borderTop: "1px solid rgba(39,39,42,0.6)" }}
            >
              <p className="text-xs text-zinc-600">
                © 2026 FootBrowse. All rights reserved.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4">
                <Link href="/about" className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors">
                  About
                </Link>
                <Link href="/privacy" className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors">
                  Privacy Policy
                </Link>
                <Link href="/terms" className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors">
                  Terms of Service
                </Link>
                <p className="text-xs text-zinc-700">
                  Not affiliated with FIFA.
                </p>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
