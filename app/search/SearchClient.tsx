"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

type SearchEntry =
  | { type: "team";   name: string; slug: string; league: string; leagueName: string; logo: string }
  | { type: "player"; name: string; slug: string; team: string; teamSlug: string; photo: string; league: string }
  | { type: "match";  name: string; slug: string; league: string; leagueName: string; date: string; leagueSeason: string };

function entryHref(e: SearchEntry): string {
  if (e.type === "team")   return `/leagues/${e.league}/teams/${e.slug}`;
  if (e.type === "player") return `/players/${e.slug}`;
  return `/leagues/${e.league}/matches/${e.slug}`;
}

function score(entry: SearchEntry, q: string): number {
  const lq = q.toLowerCase();
  const ln = entry.name.toLowerCase();
  if (ln === lq) return 3;
  if (ln.startsWith(lq)) return 2;
  if (ln.includes(lq)) return 1;
  if (entry.type !== "match") {
    const sub = entry.type === "player" ? entry.team.toLowerCase() : entry.leagueName.toLowerCase();
    if (sub.includes(lq)) return 0.5;
  }
  return 0;
}

function filterEntries(index: SearchEntry[], q: string): SearchEntry[] {
  if (q.length < 2) return [];
  return index
    .map((e) => ({ e, s: score(e, q) }))
    .filter(({ s }) => s > 0)
    .sort((a, b) => b.s - a.s || a.e.name.localeCompare(b.e.name))
    .slice(0, 60)
    .map(({ e }) => e);
}

const CATEGORY_ORDER = ["team", "player", "match"] as const;
const CATEGORY_LABEL: Record<string, string> = { team: "Teams", player: "Players", match: "Matches" };

export default function SearchClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQ = searchParams.get("q") ?? "";

  const [query, setQuery] = useState(initialQ);
  const [index, setIndex] = useState<SearchEntry[]>([]);
  const [loaded, setLoaded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load index once
  useEffect(() => {
    fetch("/search-index.json")
      .then((r) => r.json())
      .then((data: SearchEntry[]) => {
        setIndex(data);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  // Sync URL when query changes (debounced)
  useEffect(() => {
    const t = setTimeout(() => {
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      router.replace(`/search${query ? `?q=${encodeURIComponent(query)}` : ""}`, { scroll: false });
    }, 300);
    return () => clearTimeout(t);
  }, [query, router]);

  // Focus input on mount
  useEffect(() => { inputRef.current?.focus(); }, []);

  const results = filterEntries(index, query);

  // Group by type
  const grouped = CATEGORY_ORDER.reduce<Record<string, SearchEntry[]>>((acc, cat) => {
    acc[cat] = results.filter((e) => e.type === cat);
    return acc;
  }, {} as Record<string, SearchEntry[]>);

  return (
    <div className="space-y-6">
      {/* Search input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <svg className="w-5 h-5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search teams, players, matches…"
          className="w-full pl-12 pr-4 py-4 rounded-xl text-base font-medium text-white placeholder-zinc-600 outline-none focus:ring-2"
          style={{
            backgroundColor: "rgba(24,24,27,0.9)",
            border: "1px solid rgba(63,63,70,0.8)",
            focusRingColor: "#00FF87",
          } as React.CSSProperties}
          onFocus={(e) => { e.target.style.borderColor = "#00FF87"; e.target.style.boxShadow = "0 0 0 2px rgba(0,255,135,0.15)"; }}
          onBlur={(e)  => { e.target.style.borderColor = "rgba(63,63,70,0.8)"; e.target.style.boxShadow = "none"; }}
          autoComplete="off"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute inset-y-0 right-4 flex items-center text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* States */}
      {!loaded && (
        <p className="text-center text-zinc-500 text-sm py-8">Loading…</p>
      )}

      {loaded && !query && (
        <div className="text-center py-12 space-y-2">
          <p className="text-2xl">⚽</p>
          <p className="text-zinc-400 text-sm font-medium">Search teams, players, and matches</p>
          <p className="text-zinc-600 text-xs">Start typing to see results</p>
        </div>
      )}

      {loaded && query.length >= 2 && results.length === 0 && (
        <div className="text-center py-12 space-y-2">
          <p className="text-zinc-400 text-sm font-medium">No results for &ldquo;{query}&rdquo;</p>
          <p className="text-zinc-600 text-xs">Try a different search term</p>
        </div>
      )}

      {loaded && query.length === 1 && (
        <p className="text-center text-zinc-600 text-xs py-4">Keep typing…</p>
      )}

      {/* Results by category */}
      {results.length > 0 && CATEGORY_ORDER.map((cat) => {
        const items = grouped[cat];
        if (!items.length) return null;
        return (
          <section key={cat}>
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-3 px-1">
              {CATEGORY_LABEL[cat]} <span className="text-zinc-700 ml-1">{items.length}</span>
            </h2>
            <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(39,39,42,0.8)" }}>
              {items.map((entry, i) => (
                <Link
                  key={`${entry.type}-${entry.slug}-${i}`}
                  href={entryHref(entry)}
                  className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-white/[0.04] group"
                  style={{ borderBottom: i < items.length - 1 ? "1px solid rgba(39,39,42,0.5)" : "none" }}
                >
                  {/* Logo / photo */}
                  <div className="shrink-0 w-9 h-9 rounded-lg overflow-hidden flex items-center justify-center"
                    style={{ backgroundColor: "rgba(39,39,42,0.6)" }}>
                    {(entry.type === "team" || entry.type === "player") && (entry.type === "team" ? entry.logo : entry.photo) ? (
                      <Image
                        src={entry.type === "team" ? entry.logo : entry.photo}
                        alt={entry.name}
                        width={36}
                        height={36}
                        className="object-contain w-full h-full"
                        unoptimized
                      />
                    ) : entry.type === "match" ? (
                      <span className="text-base">⚽</span>
                    ) : (
                      <span className="text-xs text-zinc-500">{entry.name.slice(0, 2).toUpperCase()}</span>
                    )}
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">{entry.name}</p>
                    <p className="text-[11px] text-zinc-500 truncate mt-0.5">
                      {entry.type === "team"   && entry.leagueName}
                      {entry.type === "player" && entry.team}
                      {entry.type === "match"  && `${entry.leagueName} · ${new Date(entry.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`}
                    </p>
                  </div>

                  {/* Arrow */}
                  <span className="shrink-0 text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ color: "#00FF87" }}>→</span>
                </Link>
              ))}
            </div>
          </section>
        );
      })}

      {results.length > 0 && (
        <p className="text-center text-zinc-700 text-xs">{results.length} result{results.length !== 1 ? "s" : ""}</p>
      )}
    </div>
  );
}
