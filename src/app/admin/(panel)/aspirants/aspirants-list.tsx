"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Aspirant } from "@/lib/types";

type DeleteAction = (id: string) => Promise<void>;
type EditAction = (id: string, formData: FormData) => Promise<{ ok: boolean; error?: string }>;

export default function AspirantsList({
  initialAspirants,
  deleteAction,
  editAction,
}: {
  initialAspirants: Aspirant[];
  deleteAction: DeleteAction;
  editAction: EditAction;
}) {
  const router = useRouter();
  const [aspirants, setAspirants] = useState(initialAspirants);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const grouped = new Map<string, Aspirant[]>();
  for (const a of aspirants) {
    const list = grouped.get(a.position) || [];
    list.push(a);
    grouped.set(a.position, list);
  }

  function handleDelete(id: string) {
    if (deletingId || editingId) return;
    setDeletingId(id);
    setError(null);
    startTransition(async () => {
      await deleteAction(id);
      setAspirants((prev) => prev.filter((a) => a.id !== id));
      setDeletingId(null);
    });
  }

  function handleEditSubmit(id: string, formData: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await editAction(id, formData);
      if (!res.ok) {
        setError(res.error || "Couldn't save changes.");
        return;
      }
      setEditingId(null);
      router.refresh();
      // Refetch is async via server; do a light optimistic patch too so it feels instant.
      const name = String(formData.get("name") || "");
      const position = String(formData.get("position") || "");
      const sex = String(formData.get("sex") || "");
      setAspirants((prev) =>
        prev.map((a) => (a.id === id ? { ...a, name, position, sex } : a))
      );
    });
  }

  if (grouped.size === 0) {
    return <p className="text-muted">No aspirants yet. Add the first one above.</p>;
  }

  return (
    <div className="space-y-8">
      {error && (
        <p className="text-danger text-sm" role="alert">
          {error}
        </p>
      )}
      {Array.from(grouped.entries()).map(([position, list]) => (
        <section key={position}>
          <h2 className="font-display text-xl mb-3">{position}</h2>
          <div className="ballot-card divide-y divide-line">
            {list.map((a) => (
              <div key={a.id} className="p-4">
                {editingId === a.id ? (
                  <EditRow
                    aspirant={a}
                    isPending={isPending}
                    onCancel={() => {
                      setEditingId(null);
                      setError(null);
                    }}
                    onSubmit={(formData) => handleEditSubmit(a.id, formData)}
                  />
                ) : (
                  <div className="flex items-center justify-between gap-4">
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
                        <p className="text-xs text-muted">{a.sex || "—"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(a.id);
                          setError(null);
                        }}
                        disabled={isPending || deletingId === a.id}
                        className="text-sm text-ink-soft hover:underline underline-offset-4 disabled:opacity-50"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(a.id)}
                        disabled={isPending || deletingId === a.id}
                        className="text-sm text-danger hover:underline underline-offset-4 disabled:opacity-50"
                      >
                        {deletingId === a.id ? "Removing…" : "Remove"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function EditRow({
  aspirant,
  isPending,
  onCancel,
  onSubmit,
}: {
  aspirant: Aspirant;
  isPending: boolean;
  onCancel: () => void;
  onSubmit: (formData: FormData) => void;
}) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(new FormData(e.currentTarget));
      }}
      className="grid sm:grid-cols-2 gap-3"
    >
      <div>
        <label className="block text-xs font-medium mb-1">Full name</label>
        <input
          name="name"
          defaultValue={aspirant.name}
          required
          className="w-full ballot-card px-3 py-2 text-sm focus:border-seal outline-none"
        />
      </div>
      <div>
        <label className="block text-xs font-medium mb-1">Position</label>
        <input
          name="position"
          defaultValue={aspirant.position}
          required
          className="w-full ballot-card px-3 py-2 text-sm focus:border-seal outline-none"
        />
      </div>
      <div>
        <label className="block text-xs font-medium mb-1">Sex</label>
        <select
          name="sex"
          required
          defaultValue={aspirant.sex || ""}
          className="w-full ballot-card px-3 py-2 text-sm focus:border-seal outline-none"
        >
          <option value="" disabled>
            Select sex
          </option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium mb-1">Photo (optional — leave blank to keep current)</label>
        <input
          name="photo"
          type="file"
          accept="image/*"
          className="w-full text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:bg-line file:text-ink file:text-xs file:cursor-pointer cursor-pointer"
        />
      </div>
      <div className="sm:col-span-2 flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="seal-button px-4 py-2 text-sm font-medium disabled:opacity-60"
        >
          {isPending ? "Saving…" : "Save changes"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isPending}
          className="text-sm text-muted hover:underline underline-offset-4"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
