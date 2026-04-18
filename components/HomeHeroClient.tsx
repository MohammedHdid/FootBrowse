"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";

export interface HeroLeague {
  slug: string;
  name: string;
  logo: string;
}

interface Props {
  leagues: HeroLeague[];
  wcStarted: boolean;
  daysUntilWC: number;
}

const HERO_BG = {
  background: "linear-gradient(135deg, rgba(0,255,135,0.09) 0%, rgba(0,255,135,0.03) 40%, transparent 70%)",
  borderBottom: "1px solid rgba(0,255,135,0.1)",
};

// Dark forest green — football-app feel
const MINI_BG = {
  background: "linear-gradient(135deg, #0d2318 0%, #071410 100%)",
  borderBottom: "1px solid rgba(0,255,135,0.25)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
} as React.CSSProperties;

const SUBTITLE = "Premier League · La Liga · Bundesliga · Champions League · World Cup 2026";

export default function HomeHeroClient({ leagues, wcStarted, daysUntilWC }: Props) {
  const heroRef = useRef<HTMLElement>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const threshold = heroRef.current ? heroRef.current.offsetHeight : 120;
      setScrolled(window.scrollY > threshold);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      {/* ── Full hero ── */}
      <section
        ref={heroRef}
        className="-mt-8 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 pt-4 pb-5"
        style={HERO_BG}
      >
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1
              className="text-2xl sm:text-3xl font-black text-white leading-tight"
              style={{ letterSpacing: "-0.04em" }}
            >
              Football Scores, Stats &amp; Fixtures
            </h1>
            <p className="text-zinc-500 text-xs mt-1 tracking-wide">{SUBTITLE}</p>
          </div>

          {/* WC countdown pill */}
          <Link
            href="/leagues/world-cup"
            className="shrink-0 flex items-center gap-2 rounded-xl px-3 py-2 transition-opacity hover:opacity-80"
            style={{
              backgroundColor: wcStarted ? "rgba(0,255,135,0.15)" : "rgba(0,255,135,0.08)",
              border: "1px solid rgba(0,255,135,0.25)",
            }}
          >
            <span className="text-base leading-none">🏆</span>
            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none">WC 2026</p>
              <p className="text-sm font-black leading-tight mt-0.5" style={{ color: "#00FF87" }}>
                {wcStarted ? "Underway" : `${daysUntilWC}d to go`}
              </p>
            </div>
          </Link>
        </div>

        {/* League quick-nav pills */}
        <div className="flex items-center gap-2 mt-4">
          {leagues.slice(0, 3).map((league) => (
            <Link
              key={league.slug}
              href={`/leagues/${league.slug}`}
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold text-zinc-400 border border-white/[0.08] hover:text-white hover:border-white/20 hover:bg-white/[0.04] transition-all whitespace-nowrap"
            >
              <Image src={league.logo} alt={league.name} width={14} height={14} className="object-contain shrink-0" unoptimized />
              {league.name}
            </Link>
          ))}
          <Link
            href="/leagues"
            className="text-xs font-bold whitespace-nowrap transition-opacity hover:opacity-70"
            style={{ color: "#00FF87" }}
          >
            All leagues →
          </Link>
        </div>
      </section>

      {/* ── Sticky mini bar ──
          height: 0 + overflow:hidden when not scrolled → zero gap in layout.
          Once user scrolls past full hero, sticks at top-14 and fades in. ── */}
      <div
        className="sticky top-14 z-40 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 overflow-hidden transition-all duration-200"
        style={{
          ...MINI_BG,
          paddingTop:    scrolled ? "10px" : 0,
          paddingBottom: scrolled ? "10px" : 0,
          opacity:       scrolled ? 1 : 0,
          maxHeight:     scrolled ? "80px" : 0,
          pointerEvents: scrolled ? "auto" : "none",
        }}
      >
        <p className="font-black text-white text-sm leading-tight" style={{ letterSpacing: "-0.03em" }}>
          Football Scores, Stats &amp; Fixtures
        </p>
        <p className="text-[10px] mt-0.5" style={{ color: "rgba(0,255,135,0.7)" }}>{SUBTITLE}</p>
      </div>
    </>
  );
}
