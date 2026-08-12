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
            ? "Voting is open. Cast your ballot with your access code."
            : "Voting is currently closed."}
        </p>

        {isOpen && (
          <div className="flex justify-center">
            <Link
              href="/vote"
              className="seal-button font-display text-lg px-8 py-4 inline-flex items-center justify-center"
            >
              Cast your vote
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
