import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "FootBrowse terms of service — rules governing use of the site.",
};

export default function TermsPage() {
  return (
    <article className="max-w-3xl mx-auto space-y-10 py-4">

      <header>
        <p className="text-xs uppercase tracking-[0.15em] text-zinc-500 font-bold mb-3">Legal</p>
        <h1
          className="text-3xl sm:text-4xl font-black text-white"
          style={{ letterSpacing: "-0.04em" }}
        >
          Terms of Service
        </h1>
        <p className="mt-3 text-sm text-zinc-500">Last updated: April 2026</p>
      </header>

      <section className="section-block space-y-4">
        <h2 className="section-title text-xl">Acceptance of Terms</h2>
        <p className="text-sm text-zinc-300 leading-relaxed">
          By accessing and using FootBrowse (&quot;the Site&quot;), you accept and agree to be bound
          by these Terms of Service. If you do not agree, please do not use the Site.
        </p>
      </section>

      <section className="section-block space-y-4">
        <h2 className="section-title text-xl">Informational Purpose Only</h2>
        <p className="text-sm text-zinc-300 leading-relaxed">
          All content on FootBrowse — including match previews, team profiles, player statistics,
          stadium guides, predictions, and tournament information — is provided for{" "}
          <span className="font-bold text-white">general informational purposes only</span>. It
          does not constitute professional sports advice, financial advice, or any other form of
          regulated advice.
        </p>
        <p className="text-sm text-zinc-300 leading-relaxed">
          Statistics, fixtures, and other data are compiled from publicly available sources and
          may not be complete, current, or accurate. Always verify important information with
          official sources.
        </p>
      </section>

      <section className="section-block space-y-4">
        <h2 className="section-title text-xl">No Affiliation with FIFA</h2>
        <p className="text-sm text-zinc-300 leading-relaxed">
          FootBrowse is an independent website and is{" "}
          <span className="font-bold text-white">not affiliated with, endorsed by, or connected
          to FIFA</span>, any national football association, or any official World Cup 2026
          organisation. All trademarks, team names, player names, and tournament names referenced
          on this site are the property of their respective owners and are used for identification
          purposes only.
        </p>
      </section>

      <section className="section-block space-y-4">
        <h2 className="section-title text-xl">Betting &amp; Gambling Content</h2>
        <div
          className="rounded-xl p-4 mb-4"
          style={{
            backgroundColor: "rgba(239,68,68,0.06)",
            border: "1px solid rgba(239,68,68,0.2)",
          }}
        >
          <p className="text-sm font-bold text-red-400 mb-1">18+ Only</p>
          <p className="text-sm text-zinc-300 leading-relaxed">
            Betting and gambling content on this site is intended for adults aged 18 and over
            only. If you are under 18, you must not engage with any betting-related content on
            this site.
          </p>
        </div>
        <p className="text-sm text-zinc-300 leading-relaxed">
          All betting odds displayed on FootBrowse are{" "}
          <span className="font-bold text-white">indicative only</span>. Odds are sourced from
          third-party bookmakers and are subject to change without notice. We make no guarantee
          that the odds shown reflect current available prices. Always check directly with the
          bookmaker before placing a bet.
        </p>
        <p className="text-sm text-zinc-300 leading-relaxed">
          Betting affiliate links are provided as a convenience. FootBrowse does not encourage
          gambling and accepts no responsibility for any losses incurred as a result of betting
          decisions made based on content found on this site.
        </p>
        <p className="text-sm text-zinc-400 leading-relaxed">
          Gambling can be addictive. If you are concerned about your gambling, visit{" "}
          <a
            href="https://www.begambleaware.org"
            target="_blank"
            rel="noopener noreferrer"
            className="underline text-zinc-200 hover:text-white transition-colors"
          >
            BeGambleAware.org
          </a>{" "}
          or call the National Gambling Helpline: 0808 8020 133.
        </p>
      </section>

      <section className="section-block space-y-4">
        <h2 className="section-title text-xl">Affiliate Links</h2>
        <p className="text-sm text-zinc-300 leading-relaxed">
          FootBrowse contains affiliate links to third-party services including hotels, flights,
          and bookmakers. If you click an affiliate link and make a purchase or sign-up, we may
          receive a commission at no additional cost to you. This does not influence our editorial
          content.
        </p>
      </section>

      <section className="section-block space-y-4">
        <h2 className="section-title text-xl">Limitation of Liability</h2>
        <p className="text-sm text-zinc-300 leading-relaxed">
          To the fullest extent permitted by law, FootBrowse and its operators accept no liability
          for:
        </p>
        <ul className="space-y-2 text-sm text-zinc-300 leading-relaxed">
          {[
            "Inaccuracies or errors in match data, statistics, or predictions",
            "Losses arising from betting or gambling decisions",
            "Issues arising from use of third-party affiliate services",
            "Interruptions or unavailability of the Site",
            "Any indirect, incidental, or consequential damages",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2">
              <span className="text-red-500 mt-0.5 shrink-0">−</span>
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section className="section-block space-y-4">
        <h2 className="section-title text-xl">Intellectual Property</h2>
        <p className="text-sm text-zinc-300 leading-relaxed">
          All original content on FootBrowse, including written match previews, site design, and
          code, is the property of FootBrowse and may not be reproduced without permission.
          Third-party trademarks referenced on this site remain the property of their respective
          owners.
        </p>
      </section>

      <section className="section-block space-y-4">
        <h2 className="section-title text-xl">Governing Law</h2>
        <p className="text-sm text-zinc-300 leading-relaxed">
          These terms are governed by applicable law. Any disputes arising from use of the Site
          shall be subject to the exclusive jurisdiction of the competent courts.
        </p>
      </section>

      <section className="section-block space-y-4">
        <h2 className="section-title text-xl">Changes to These Terms</h2>
        <p className="text-sm text-zinc-300 leading-relaxed">
          We reserve the right to update these terms at any time. Changes will be posted on this
          page with an updated date. Continued use of the Site after changes constitutes acceptance
          of the revised terms.
        </p>
      </section>

      <section className="section-block space-y-4">
        <h2 className="section-title text-xl">Contact</h2>
        <p className="text-sm text-zinc-300 leading-relaxed">
          Questions about these terms? Contact us at{" "}
          <a
            href="mailto:contact@footbrowse.com"
            className="underline text-zinc-200 hover:text-white transition-colors"
          >
            contact@footbrowse.com
          </a>
          .
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
