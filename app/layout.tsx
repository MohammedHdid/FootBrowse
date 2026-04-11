import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "FootBrowse — World Cup 2026 Stats, Matches & Teams",
    template: "%s | FootBrowse",
  },
  description:
    "FootBrowse is your data-driven guide to World Cup 2026. Browse match previews, team profiles, stadium guides, and player stats.",
  metadataBase: new URL("https://footbrowse.com"),
  openGraph: {
    siteName: "FootBrowse",
    type: "website",
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
      <body className="min-h-screen flex flex-col">
        {/* ── Header ── */}
        <header className="border-b border-zinc-800 bg-zinc-900 sticky top-0 z-50">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 flex items-center justify-between h-14">
            <Link
              href="/"
              className="flex items-center gap-2 font-bold text-lg tracking-tight text-white hover:text-emerald-400 transition-colors"
            >
              <span className="text-emerald-400">⚽</span>
              FootBrowse
            </Link>
            <nav className="flex items-center gap-1 sm:gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="px-3 py-1.5 rounded text-sm font-medium text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>

        {/* ── Main content ── */}
        <main className="flex-1 mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>

        {/* ── Footer ── */}
        <footer className="border-t border-zinc-800 bg-zinc-900 mt-auto">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="font-bold text-white">
                  <span className="text-emerald-400">⚽</span> FootBrowse
                </p>
                <p className="text-xs text-zinc-500 mt-1">
                  Your data-driven guide to World Cup 2026.
                </p>
              </div>
              <nav className="flex flex-wrap gap-x-4 gap-y-1">
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
            <p className="mt-6 text-xs text-zinc-600">
              © {new Date().getFullYear()} FootBrowse. For informational
              purposes only. Not affiliated with FIFA or any football
              association.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
