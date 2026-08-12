"use client";

import { useState, useTransition } from "react";
import type { Voter } from "@/lib/types";

type DeleteAction = (id: string) => Promise<{ ok: boolean; error?: string }>;

export default function CodesList({
  initialCodes,
  deleteAction,
}: {
  initialCodes: Voter[];
  deleteAction: DeleteAction;
}) {
  const [codes, setCodes] = useState(initialCodes);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [errorId, setErrorId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const used = codes.filter((v) => v.is_used).length;

  function handleDelete(id: string) {
    if (pendingId) return; // ignore taps while a delete is already in flight
    setPendingId(id);
    setErrorId(null);
    setErrorMsg(null);

    startTransition(async () => {
      const res = await deleteAction(id);
      if (res.ok) {
        setCodes((prev) => prev.filter((c) => c.id !== id));
      } else {
        setErrorId(id);
        setErrorMsg(res.error || "Couldn't delete this code. Try again.");
      }
      setPendingId(null);
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display text-xl">
          All codes{" "}
          <span className="text-muted text-base">
            ({used} of {codes.length} used)
          </span>
        </h2>
      </div>

      {codes.length === 0 ? (
        <p className="text-muted">No codes generated yet.</p>
      ) : (
        <div className="ballot-card divide-y divide-line max-h-[32rem] overflow-y-auto">
          {codes.map((v) => (
            <div key={v.id}>
              <div className="flex items-center justify-between gap-4 p-3">
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
                    <button
                      type="button"
                      onClick={() => handleDelete(v.id)}
                      disabled={pendingId === v.id}
                      className="text-xs text-danger hover:underline underline-offset-4 disabled:opacity-50"
                    >
                      {pendingId === v.id ? "Deleting…" : "Delete"}
                    </button>
                  )}
                </div>
              </div>
              {errorId === v.id && (
                <p className="text-danger text-xs px-3 pb-2" role="alert">
                  {errorMsg}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
