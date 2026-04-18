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

// (HERO_BG removed, using inline gradient)

// Professional Navy — live score app feel
const MINI_BG = {
  background: "rgba(15, 23, 42, 0.95)", // Slate 900
  borderBottom: "1px solid rgba(51, 65, 85, 0.6)",
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
      {/* ── Full premium hero ── */}
      <section
        ref={heroRef}
        className="-mt-8 -mx-4 sm:-mx-6 lg:-mx-8 relative overflow-hidden"
        style={{
          background: "linear-gradient(180deg, rgba(0, 255, 135, 0.05) 0%, rgba(15, 23, 42, 0) 100%)",
          borderBottom: "1px solid rgba(51, 65, 85, 0.4)",
        }}
      >
        <div className="px-4 sm:px-6 lg:px-8 pt-6 pb-6 relative z-10">
          <h1
            className="text-3xl sm:text-4xl font-black text-white leading-tight"
            style={{ letterSpacing: "-0.04em" }}
          >
            Football Scores, Stats &amp; Fixtures
          </h1>
          <p className="text-slate-400 text-sm mt-1.5 tracking-wide max-w-xl">{SUBTITLE}</p>

          {/* Quick nav & Integrated WC Pill */}
          <div className="flex items-center gap-2 mt-6 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden w-full pb-1">
            {/* Premium WC Action Pill */}
            <Link
              href="/leagues/world-cup"
              className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-black transition-colors whitespace-nowrap shadow-sm hover:opacity-80 shrink-0"
              style={{
                backgroundColor: "rgba(0, 255, 135, 0.12)",
                color: "#00FF87",
                border: "1px solid rgba(0, 255, 135, 0.25)",
              }}
            >
              <span className="text-base leading-none drop-shadow-sm">🏆</span>
              <span>World Cup 2026</span>
              <span className="opacity-70 mx-0.5">·</span>
              <span className="opacity-90">{wcStarted ? "Underway" : `${daysUntilWC}d left`}</span>
            </Link>

            {leagues.slice(0, 3).map((league) => (
              <Link
                key={league.slug}
                href={`/leagues/${league.slug}`}
                className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white transition-colors whitespace-nowrap shrink-0"
              >
                <div className="bg-slate-50 p-0.5 rounded flex items-center justify-center shrink-0">
                  <Image src={league.logo} alt={league.name} width={18} height={18} className="object-contain shrink-0" unoptimized />
                </div>
                {league.name}
              </Link>
            ))}
            <Link
              href="/leagues"
              className="text-xs font-bold whitespace-nowrap transition-opacity hover:opacity-70 ml-2 shrink-0"
              style={{ color: "#00FF87" }}
            >
              Browse all →
            </Link>
          </div>
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
