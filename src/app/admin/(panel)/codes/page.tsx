import { createAdminClient } from "@/lib/supabase/admin";
import type { Voter } from "@/lib/types";
import { generateVoterCodes, deleteUnusedCode } from "@/app/actions/admin";
import GenerateCodesForm from "./generate-form";
import CodesList from "./codes-list";

export const dynamic = "force-dynamic";

export default async function CodesPage() {
  const supabase = createAdminClient();
  const { data: voters } = await supabase
    .from("voters")
    .select("*")
    .order("created_at", { ascending: false });

  const list = (voters || []) as Voter[];

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

      <CodesList initialCodes={list} deleteAction={deleteUnusedCode} />
    </div>
  );
}
