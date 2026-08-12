import Link from "next/link";
import { logoutAdmin } from "@/app/actions/admin";

const NAV = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/aspirants", label: "Aspirants" },
  { href: "/admin/codes", label: "Voter codes" },
];

export default function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 flex flex-col">
      <header className="bg-ink text-white">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-6">
            <span className="font-display text-lg">Election Admin</span>
            <nav className="flex items-center gap-4 text-sm">
              {NAV.map((item) => (
                <Link key={item.href} href={item.href} className="opacity-80 hover:opacity-100">
                  {item.label}
                </Link>
              ))}
              <Link href="/results" className="opacity-80 hover:opacity-100">
                View results ↗
              </Link>
            </nav>
          </div>
          <form action={logoutAdmin}>
            <button type="submit" className="text-sm opacity-80 hover:opacity-100 underline underline-offset-4">
              Sign out
            </button>
          </form>
        </div>
      </header>
      <div className="max-w-5xl mx-auto w-full px-6 py-10 flex-1">{children}</div>
    </div>
  );
}
