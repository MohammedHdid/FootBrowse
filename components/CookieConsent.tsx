"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const STORAGE_KEY = "fb_cookie_consent";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      setVisible(true);
    }
  }, []);

  function accept() {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 sm:px-6"
      style={{ animation: "fb-fade-up 0.3s ease both" }}
    >
      <div
        className="mx-auto max-w-3xl rounded-xl px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-4"
        style={{
          backgroundColor: "rgba(18,18,18,0.97)",
          border: "1px solid rgba(255,255,255,0.1)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          boxShadow: "0 -4px 32px rgba(0,0,0,0.5)",
        }}
      >
        <p className="flex-1 text-sm text-zinc-400 leading-relaxed">
          We use cookies for analytics and personalised ads. By continuing you
          agree to our{" "}
          <Link
            href="/privacy"
            className="underline text-zinc-300 hover:text-white transition-colors"
          >
            cookie policy
          </Link>
          .
        </p>

        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/privacy"
            className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors font-semibold"
          >
            Learn more
          </Link>
          <button
            onClick={accept}
            className="rounded-lg px-5 py-2 text-sm font-bold transition-opacity hover:opacity-80"
            style={{ backgroundColor: "#00FF87", color: "#0a0a0a" }}
          >
            Accept
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fb-fade-up {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
