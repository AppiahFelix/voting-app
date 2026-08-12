import { createAdminClient } from "@/lib/supabase/admin";
import type { Aspirant } from "@/lib/types";
import { addAspirant, deleteAspirant } from "@/app/actions/admin";
import AddAspirantForm from "./add-form";

export const dynamic = "force-dynamic";

export default async function AspirantsPage() {
  const supabase = createAdminClient();
  const { data: aspirants } = await supabase
    .from("aspirants")
    .select("*")
    .order("position")
    .order("name");

  const grouped = new Map<string, Aspirant[]>();
  for (const a of (aspirants || []) as Aspirant[]) {
    const list = grouped.get(a.position) || [];
    list.push(a);
    grouped.set(a.position, list);
  }

  return (
    <div>
      <h1 className="font-display text-3xl mb-8">Aspirants</h1>

      <div className="ballot-card p-6 mb-10">
        <h2 className="font-display text-xl mb-4">Add an aspirant</h2>
        <AddAspirantForm action={addAspirant} />
      </div>

      {grouped.size === 0 && (
        <p className="text-muted">No aspirants yet. Add the first one above.</p>
      )}

      <div className="space-y-8">
        {Array.from(grouped.entries()).map(([position, list]) => (
          <section key={position}>
            <h2 className="font-display text-xl mb-3">{position}</h2>
            <div className="ballot-card divide-y divide-line">
              {list.map((a) => (
                <div key={a.id} className="flex items-center justify-between gap-4 p-4">
                  <div className="flex items-center gap-3">
                    {a.photo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={a.photo_url}
                        alt=""
                        className="w-10 h-10 rounded-full object-cover border border-line"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-line" aria-hidden />
                    )}
                    <div>
                      <p className="font-medium">{a.name}</p>
                      <p className="text-xs text-muted">
                        {[a.category, a.sex].filter(Boolean).join(" · ") || "—"}
                      </p>
                    </div>
                  </div>
                  <form
                    action={async () => {
                      "use server";
                      await deleteAspirant(a.id);
                    }}
                  >
                    <button
                      type="submit"
                      className="text-sm text-danger hover:underline underline-offset-4"
                    >
                      Remove
                    </button>
                  </form>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
