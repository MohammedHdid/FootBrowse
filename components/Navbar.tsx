"use client";

import Link from "next/link";
import { useState } from "react";

const navLinks = [
  { href: "/leagues", label: "Leagues" },
  { href: "/matches", label: "Matches" },
  { href: "/teams", label: "Teams" },
  { href: "/stadiums", label: "Stadiums" },
  { href: "/players", label: "Players" },
];

function SearchIcon() {
  return (
    <Link
      href="/search"
      aria-label="Search"
      className="p-1.5 rounded-md text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-all duration-150"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    </Link>
  );
}

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <nav className="hidden sm:flex items-center gap-0.5">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="px-3 py-1.5 rounded-md text-sm font-semibold text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-all duration-150"
          >
            {link.label}
          </Link>
        ))}
        <SearchIcon />
      </nav>

      {/* Hamburger Menu (Mobile Only) */}
      <div className="sm:hidden flex items-center gap-1">
        <SearchIcon />
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-zinc-400 hover:text-white p-1 focus:outline-none transition-colors"
          aria-label="Toggle menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            {isOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>

        {isOpen && (
          <div 
            className="absolute top-14 left-0 w-full p-4 flex flex-col gap-2 shadow-xl"
            style={{
              backgroundColor: "rgba(10,10,10,0.95)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              borderBottom: "1px solid rgba(39,39,42,0.7)",
            }}
          >
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-4 py-3 rounded-md text-base font-semibold text-zinc-300 hover:text-white hover:bg-white/10 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/search"
              className="px-4 py-3 rounded-md text-base font-semibold text-zinc-300 hover:text-white hover:bg-white/10 transition-colors flex items-center gap-2"
              onClick={() => setIsOpen(false)}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Search
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
