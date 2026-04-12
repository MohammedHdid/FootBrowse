import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "FootBrowse privacy policy — how we collect, use, and protect your data.",
};

export default function PrivacyPage() {
  return (
    <article className="max-w-3xl mx-auto space-y-10 py-4">

      <header>
        <p className="text-xs uppercase tracking-[0.15em] text-zinc-500 font-bold mb-3">Legal</p>
        <h1
          className="text-3xl sm:text-4xl font-black text-white"
          style={{ letterSpacing: "-0.04em" }}
        >
          Privacy Policy
        </h1>
        <p className="mt-3 text-sm text-zinc-500">Last updated: April 2026</p>
      </header>

      <section className="section-block space-y-4">
        <h2 className="section-title text-xl">Overview</h2>
        <p className="text-sm text-zinc-300 leading-relaxed">
          FootBrowse (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) operates the website{" "}
          <span className="text-white font-semibold">footbrowse.com</span>. This page explains what
          information we collect when you visit our site, how we use it, and your rights regarding
          that data. We are committed to protecting your privacy and complying with applicable data
          protection laws, including the General Data Protection Regulation (GDPR).
        </p>
      </section>

      <section className="section-block space-y-4">
        <h2 className="section-title text-xl">Data We Collect</h2>
        <div className="space-y-5 text-sm text-zinc-300 leading-relaxed">
          <div>
            <p className="font-bold text-white mb-1">Analytics data (Google Analytics 4)</p>
            <p>
              We use Google Analytics 4 to understand how visitors use our site. This service
              collects anonymised information such as pages visited, time spent on site, browser
              type, device type, and approximate geographic location (country/region level). No
              personally identifiable information is collected through analytics.
            </p>
          </div>
          <div>
            <p className="font-bold text-white mb-1">Advertising data (Google AdSense)</p>
            <p>
              We display advertisements through Google AdSense. Google may use cookies and similar
              tracking technologies to serve personalised ads based on your browsing history across
              sites. You can opt out of personalised advertising via{" "}
              <a
                href="https://www.google.com/settings/ads"
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-zinc-200 hover:text-white transition-colors"
              >
                Google&apos;s Ad Settings
              </a>
              .
            </p>
          </div>
          <div>
            <p className="font-bold text-white mb-1">No account or form data</p>
            <p>
              FootBrowse does not require registration, logins, or form submissions. We do not
              collect names, email addresses, or payment information directly.
            </p>
          </div>
        </div>
      </section>

      <section className="section-block space-y-4">
        <h2 className="section-title text-xl">Cookies</h2>
        <p className="text-sm text-zinc-300 leading-relaxed">
          Our site uses the following categories of cookies:
        </p>
        <ul className="space-y-3 text-sm text-zinc-300">
          <li className="flex items-start gap-3">
            <span
              className="mt-0.5 shrink-0 w-5 h-5 rounded flex items-center justify-center text-xs font-black"
              style={{ backgroundColor: "rgba(0,255,135,0.1)", color: "#00FF87", border: "1px solid rgba(0,255,135,0.2)" }}
            >
              1
            </span>
            <span>
              <span className="font-semibold text-white">Analytics cookies</span> — Set by Google
              Analytics to track usage patterns. These expire after 2 years.
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span
              className="mt-0.5 shrink-0 w-5 h-5 rounded flex items-center justify-center text-xs font-black"
              style={{ backgroundColor: "rgba(0,255,135,0.1)", color: "#00FF87", border: "1px solid rgba(0,255,135,0.2)" }}
            >
              2
            </span>
            <span>
              <span className="font-semibold text-white">Advertising cookies</span> — Set by Google
              AdSense and its advertising partners to serve relevant ads and measure ad performance.
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span
              className="mt-0.5 shrink-0 w-5 h-5 rounded flex items-center justify-center text-xs font-black"
              style={{ backgroundColor: "rgba(0,255,135,0.1)", color: "#00FF87", border: "1px solid rgba(0,255,135,0.2)" }}
            >
              3
            </span>
            <span>
              <span className="font-semibold text-white">Affiliate cookies</span> — Set by
              third-party affiliate partners (see below) when you click their links.
            </span>
          </li>
        </ul>
        <p className="text-sm text-zinc-400 leading-relaxed">
          You can control or disable cookies through your browser settings. Note that disabling
          cookies may affect the functionality of some features.
        </p>
      </section>

      <section className="section-block space-y-4">
        <h2 className="section-title text-xl">Third-Party Services</h2>
        <div className="space-y-4 text-sm text-zinc-300 leading-relaxed">
          <div
            className="rounded-xl p-4"
            style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <p className="font-bold text-white mb-1">Google Analytics &amp; AdSense</p>
            <p>
              Operated by Google LLC. Data may be processed in the United States. Google is
              certified under the EU–US Data Privacy Framework. See{" "}
              <a
                href="https://policies.google.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-zinc-200 hover:text-white transition-colors"
              >
                Google&apos;s Privacy Policy
              </a>
              .
            </p>
          </div>
          <div
            className="rounded-xl p-4"
            style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <p className="font-bold text-white mb-1">Booking.com</p>
            <p>
              We include affiliate links to Booking.com for hotel recommendations near World Cup
              venues. Clicking these links may set cookies from Booking.com. See{" "}
              <a
                href="https://www.booking.com/content/privacy.html"
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-zinc-200 hover:text-white transition-colors"
              >
                Booking.com&apos;s Privacy Policy
              </a>
              .
            </p>
          </div>
          <div
            className="rounded-xl p-4"
            style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <p className="font-bold text-white mb-1">Bet365 &amp; Betting Partners</p>
            <p>
              We display indicative betting odds and affiliate links to licensed bookmakers
              including Bet365. Clicking these links may set affiliate tracking cookies. Betting
              affiliate links are only shown to users in jurisdictions where online gambling is
              legal. Must be 18+.
            </p>
          </div>
        </div>
      </section>

      <section className="section-block space-y-4">
        <h2 className="section-title text-xl">How We Use Your Data</h2>
        <ul className="space-y-2 text-sm text-zinc-300 leading-relaxed list-none">
          {[
            "To understand how visitors use the site and improve content",
            "To serve relevant advertisements through Google AdSense",
            "To measure the performance of affiliate links",
            "We do not sell your data to third parties",
            "We do not use your data for automated decision-making or profiling",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2">
              <span style={{ color: "#00FF87" }} className="mt-0.5 shrink-0">+</span>
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section className="section-block space-y-4">
        <h2 className="section-title text-xl">Your Rights (GDPR)</h2>
        <p className="text-sm text-zinc-300 leading-relaxed">
          If you are located in the European Economic Area (EEA), you have the following rights
          regarding your personal data:
        </p>
        <ul className="space-y-2 text-sm text-zinc-300 leading-relaxed">
          {[
            "Right to access the data we hold about you",
            "Right to rectification of inaccurate data",
            "Right to erasure (\u201cright to be forgotten\u201d)",
            "Right to restrict or object to processing",
            "Right to data portability",
            "Right to withdraw consent at any time",
          ].map((right) => (
            <li key={right} className="flex items-start gap-2">
              <span style={{ color: "#00FF87" }} className="mt-0.5 shrink-0">+</span>
              {right}
            </li>
          ))}
        </ul>
        <p className="text-sm text-zinc-400 leading-relaxed">
          To exercise any of these rights, contact us at{" "}
          <a
            href="mailto:contact@footbrowse.com"
            className="underline text-zinc-200 hover:text-white transition-colors"
          >
            contact@footbrowse.com
          </a>
          .
        </p>
      </section>

      <section className="section-block space-y-4">
        <h2 className="section-title text-xl">Data Retention</h2>
        <p className="text-sm text-zinc-300 leading-relaxed">
          Analytics data is retained for 14 months via Google Analytics default settings. We do
          not store personal data on our own servers. Affiliate and advertising data retention is
          governed by the respective third-party providers.
        </p>
      </section>

      <section className="section-block space-y-4">
        <h2 className="section-title text-xl">Changes to This Policy</h2>
        <p className="text-sm text-zinc-300 leading-relaxed">
          We may update this privacy policy from time to time. Changes will be posted on this page
          with an updated date. Continued use of the site after changes constitutes acceptance of
          the updated policy.
        </p>
      </section>

      <section className="section-block space-y-4">
        <h2 className="section-title text-xl">Contact</h2>
        <p className="text-sm text-zinc-300 leading-relaxed">
          For any privacy-related questions or requests, contact us at{" "}
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
