import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About FootBrowse",
  description:
    "FootBrowse is an independent football data platform covering every match, team, stadium and player at the 2026 FIFA World Cup.",
};

const stats = [
  { value: "104", label: "Official WC 2026 matches" },
  { value: "48", label: "Qualified national teams" },
  { value: "19", label: "Host stadiums across 3 countries" },
  { value: "145", label: "Player profiles" },
  { value: "3", label: "Major bookmakers tracked" },
];

export default function AboutPage() {
  return (
    <article className="max-w-3xl mx-auto space-y-10 py-4">

      <header>
        <p className="text-xs uppercase tracking-[0.15em] text-zinc-500 font-bold mb-3">
          About
        </p>
        <h1
          className="text-3xl sm:text-4xl font-black text-white"
          style={{ letterSpacing: "-0.04em" }}
        >
          About FootBrowse
        </h1>
        <p className="mt-3 text-base text-zinc-400">
          Your data-driven guide to FIFA World Cup 2026
        </p>
      </header>

      {/* Section 1 — What we do */}
      <section className="section-block space-y-4">
        <h2 className="section-title text-xl">What We Do</h2>
        <p className="text-sm text-zinc-300 leading-relaxed">
          FootBrowse is an independent football data platform covering every match, team,
          stadium and player at the 2026 FIFA World Cup. We provide match previews,
          head-to-head statistics, betting odds comparisons, venue guides and travel
          information for all 104 official fixtures across 19 stadiums in the USA,
          Mexico and Canada.
        </p>
      </section>

      {/* Section 2 — Coverage stats */}
      <section className="section-block space-y-4">
        <h2 className="section-title text-xl">Our Coverage</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {stats.map((s) => (
            <div key={s.label} className="stat-card">
              <p
                className="text-2xl font-black"
                style={{ color: "#00FF87", letterSpacing: "-0.04em" }}
              >
                {s.value}
              </p>
              <p className="stat-label mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Section 3 — Affiliate disclosure */}
      <section className="section-block space-y-4">
        <h2 className="section-title text-xl">Affiliate Disclosure</h2>
        <div
          className="rounded-xl p-4 text-sm text-zinc-300 leading-relaxed"
          style={{
            backgroundColor: "rgba(0,255,135,0.05)",
            border: "1px solid rgba(0,255,135,0.15)",
          }}
        >
          FootBrowse contains affiliate links. When you click a hotel, flight or betting
          link and make a purchase, we may earn a small commission at no extra cost to
          you. This helps keep FootBrowse free for everyone.
        </div>
      </section>

      {/* Section 4 — Contact */}
      <section className="section-block space-y-4">
        <h2 className="section-title text-xl">Contact</h2>
        <p className="text-sm text-zinc-300 leading-relaxed">
          For partnerships and advertising inquiries, reach us at{" "}
          <a
            href="mailto:contact@footbrowse.com"
            className="underline text-zinc-200 hover:text-white transition-colors"
          >
            contact@footbrowse.com
          </a>
          .
        </p>
      </section>

      {/* Section 5 — Disclaimer */}
      <section className="section-block space-y-4">
        <h2 className="section-title text-xl">Disclaimer</h2>
        <p className="text-sm text-zinc-400 leading-relaxed">
          FootBrowse is an independent site not affiliated with FIFA, any national
          football association, or any bookmaker. Betting odds shown are for
          informational purposes only. Please gamble responsibly. 18+ only.
        </p>
      </section>

      <div className="pt-4">
        <Link
          href="/"
          className="text-sm font-bold transition-colors"
          style={{ color: "#00FF87" }}
        >
          ← Back to FootBrowse
        </Link>
      </div>

    </article>
  );
}
