import { createAdminClient } from "@/lib/supabase/admin";
import { setElectionOpen, updateElectionTitle, resetElection } from "@/app/actions/admin";
import ElectionTitleForm from "./title-form";
import ResetElectionForm from "./reset-election-form";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const supabase = createAdminClient();

  const [{ count: aspirantCount }, { count: codeCount }, { count: usedCount }, { data: settings }] =
    await Promise.all([
      supabase.from("aspirants").select("*", { count: "exact", head: true }),
      supabase.from("voters").select("*", { count: "exact", head: true }),
      supabase.from("voters").select("*", { count: "exact", head: true }).eq("is_used", true),
      supabase.from("election_settings").select("title, is_open").eq("id", 1).single(),
    ]);

  const isOpen = settings?.is_open ?? true;

  return (
    <div>
      <h1 className="font-display text-3xl mb-8">Dashboard</h1>

      <div className="grid sm:grid-cols-3 gap-4 mb-10">
        <Stat label="Aspirants" value={aspirantCount ?? 0} />
        <Stat label="Codes issued" value={codeCount ?? 0} />
        <Stat label="Votes cast" value={usedCount ?? 0} />
      </div>

      <div className="ballot-card p-6 mb-8">
        <h2 className="font-display text-xl mb-1">Voting status</h2>
        <p className="text-muted text-sm mb-4">
          {isOpen
            ? "Voting is open — voters with a valid code can cast their ballot right now."
            : "Voting is closed — access codes will be rejected until you reopen it."}
        </p>
        <form
          action={async () => {
            "use server";
            await setElectionOpen(!isOpen);
          }}
        >
          <button
            type="submit"
            className={`px-5 py-2.5 rounded-full font-medium text-sm ${
              isOpen ? "bg-danger text-white" : "seal-button"
            }`}
          >
            {isOpen ? "Close voting" : "Open voting"}
          </button>
        </form>
      </div>

      <div className="ballot-card p-6 mb-8">
        <h2 className="font-display text-xl mb-1">Election title</h2>
        <p className="text-muted text-sm mb-4">Shown on the home page and results page.</p>
        <ElectionTitleForm action={updateElectionTitle} currentTitle={settings?.title || ""} />
      </div>

      <ResetElectionForm action={resetElection} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="ballot-card p-5">
      <p className="text-xs uppercase tracking-wide text-muted mb-1">{label}</p>
      <p className="font-tally text-3xl">{value}</p>
    </div>
  );
}
