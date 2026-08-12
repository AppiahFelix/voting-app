import { createAdminClient } from "@/lib/supabase/admin";
import type { Aspirant } from "@/lib/types";
import { addAspirant, deleteAspirant, editAspirant } from "@/app/actions/admin";
import AddAspirantForm from "./add-form";
import AspirantsList from "./aspirants-list";

export const dynamic = "force-dynamic";

export default async function AspirantsPage() {
  const supabase = createAdminClient();
  const { data: aspirants } = await supabase
    .from("aspirants")
    .select("*")
    .order("position")
    .order("created_at");

  const list = (aspirants || []) as Aspirant[];

  return (
    <div>
      <h1 className="font-display text-3xl mb-8">Aspirants</h1>

      <div className="ballot-card p-6 mb-10">
        <h2 className="font-display text-xl mb-4">Add an aspirant</h2>
        <AddAspirantForm action={addAspirant} />
      </div>

      <AspirantsList initialAspirants={list} deleteAction={deleteAspirant} editAction={editAspirant} />
    </div>
  );
}
