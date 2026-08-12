"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAdmin } from "@/app/actions/admin";

const NAV = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/aspirants", label: "Aspirants" },
  { href: "/admin/codes", label: "Voter codes" },
];

export default function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <header className="bg-ink text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-3">
          <span className="font-display text-lg shrink-0">Election Admin</span>

          {/* Desktop nav */}
          <nav className="hidden sm:flex items-center gap-4 text-sm ml-6 flex-1">
            {NAV.map((item) => (
              <Link key={item.href} href={item.href} className="opacity-80 hover:opacity-100">
                {item.label}
              </Link>
            ))}
            <Link href="/results" className="opacity-80 hover:opacity-100">
              View results ↗
            </Link>
          </nav>

          <form action={logoutAdmin} className="hidden sm:block">
            <button
              type="submit"
              className="text-sm opacity-80 hover:opacity-100 underline underline-offset-4 shrink-0"
            >
              Sign out
            </button>
          </form>

          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
            className="sm:hidden shrink-0 w-9 h-9 flex items-center justify-center"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              className="w-6 h-6"
            >
              {menuOpen ? (
                <path d="M6 6l12 12M18 6L6 18" />
              ) : (
                <>
                  <path d="M3 6h18" />
                  <path d="M3 12h18" />
                  <path d="M3 18h18" />
                </>
              )}
            </svg>
          </button>
        </div>

        {/* Mobile menu panel */}
        {menuOpen && (
          <nav className="sm:hidden border-t border-white/10 px-4 py-3 flex flex-col gap-1 text-sm">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className={`py-2 ${
                  pathname === item.href ? "opacity-100 font-medium" : "opacity-80"
                }`}
              >
                {item.label}
              </Link>
            ))}
            <Link href="/results" onClick={() => setMenuOpen(false)} className="py-2 opacity-80">
              View results ↗
            </Link>
            <form action={logoutAdmin} className="pt-1">
              <button type="submit" className="py-2 opacity-80 underline underline-offset-4">
                Sign out
              </button>
            </form>
          </nav>
        )}
      </header>
      <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-10 flex-1 min-w-0">{children}</div>
    </div>
  );
}
