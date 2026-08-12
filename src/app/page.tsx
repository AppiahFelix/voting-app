import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = createAdminClient();
  const { data: settings } = await supabase
    .from("election_settings")
    .select("title, is_open")
    .eq("id", 1)
    .single();

  const title = settings?.title || "Election 2026";
  const isOpen = settings?.is_open ?? true;

  return (
    <main className="flex-1 flex items-center justify-center px-6 py-16">
      <div className="max-w-xl w-full text-center">
        <p className="font-tally text-xs tracking-[0.3em] text-muted uppercase mb-4">
          Official Ballot
        </p>
        <h1 className="font-display text-5xl sm:text-6xl mb-4 leading-tight">
          {title}
        </h1>
        <p className="text-muted mb-10">
          {isOpen
            ? "Voting is open. Cast your ballot with your access code, or watch results come in live."
            : "Voting is currently closed. Results remain available to view."}
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {isOpen && (
            <Link
              href="/vote"
              className="seal-button font-display text-lg px-8 py-4 inline-flex items-center justify-center"
            >
              Cast your vote
            </Link>
          )}
          <Link
            href="/results"
            className="ballot-card px-8 py-4 font-medium inline-flex items-center justify-center hover:border-ink-soft transition-colors"
          >
            View live results
          </Link>
        </div>

        <div className="mt-16 perforated pt-6">
          <Link href="/admin/login" className="text-xs text-muted hover:text-ink underline underline-offset-4">
            Election administrator
          </Link>
        </div>
      </div>
    </main>
  );
}
