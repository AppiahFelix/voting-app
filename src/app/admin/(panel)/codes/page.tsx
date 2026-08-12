import { createAdminClient } from "@/lib/supabase/admin";
import type { Voter } from "@/lib/types";
import { generateVoterCodes, deleteUnusedCode } from "@/app/actions/admin";
import GenerateCodesForm from "./generate-form";

export const dynamic = "force-dynamic";

export default async function CodesPage() {
  const supabase = createAdminClient();
  const { data: voters } = await supabase
    .from("voters")
    .select("*")
    .order("created_at", { ascending: false });

  const list = (voters || []) as Voter[];
  const used = list.filter((v) => v.is_used).length;

  return (
    <div>
      <h1 className="font-display text-3xl mb-8">Voter codes</h1>

      <div className="ballot-card p-6 mb-10">
        <h2 className="font-display text-xl mb-1">Generate codes</h2>
        <p className="text-muted text-sm mb-4">
          Each code can be used to cast one ballot. Distribute them to voters privately —
          anyone can vote once they know their code hasn&apos;t been used yet.
        </p>
        <GenerateCodesForm action={generateVoterCodes} codes={list} />
      </div>

      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display text-xl">
          All codes <span className="text-muted text-base">({used} of {list.length} used)</span>
        </h2>
      </div>

      {list.length === 0 ? (
        <p className="text-muted">No codes generated yet.</p>
      ) : (
        <div className="ballot-card divide-y divide-line max-h-[32rem] overflow-y-auto">
          {list.map((v) => (
            <div key={v.id} className="flex items-center justify-between gap-4 p-3">
              <div>
                <span className="font-tally tracking-wider">{v.code}</span>
                {v.label && <span className="text-xs text-muted ml-3">{v.label}</span>}
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`text-xs font-medium px-2 py-1 rounded-full ${
                    v.is_used ? "bg-counted-soft text-counted" : "bg-line text-muted"
                  }`}
                >
                  {v.is_used ? "Used" : "Unused"}
                </span>
                {!v.is_used && (
                  <form
                    action={async () => {
                      "use server";
                      await deleteUnusedCode(v.id);
                    }}
                  >
                    <button type="submit" className="text-xs text-danger hover:underline underline-offset-4">
                      Delete
                    </button>
                  </form>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
