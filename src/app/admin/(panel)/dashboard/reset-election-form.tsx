"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type ResetAction = () => Promise<{ ok: boolean; error?: string }>;

const CONFIRM_PHRASE = "RESET";

export default function ResetElectionForm({ action }: { action: ResetAction }) {
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const canSubmit = confirmText.trim() === CONFIRM_PHRASE;

  function handleReset() {
    if (!canSubmit) return;
    setError(null);
    startTransition(async () => {
      const res = await action();
      if (!res.ok) {
        setError(res.error || "Something went wrong. Try again.");
        return;
      }
      setOpen(false);
      setConfirmText("");
      router.refresh();
    });
  }

  return (
    <div className="ballot-card p-6 border-danger/40">
      <h2 className="font-display text-xl mb-1 text-danger">Danger zone</h2>
      <p className="text-muted text-sm mb-4">
        Start a brand new election. This permanently deletes all aspirants, all voter codes, and
        all cast votes, and closes voting. This can&apos;t be undone.
      </p>

      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="px-5 py-2.5 rounded-full font-medium text-sm bg-danger text-white"
        >
          Start new election…
        </button>
      ) : (
        <div className="space-y-3">
          <p className="text-sm font-medium">
            Type <span className="font-tally">{CONFIRM_PHRASE}</span> below to confirm. This
            deletes everything and can&apos;t be undone.
          </p>
          <input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={CONFIRM_PHRASE}
            className="w-full ballot-card px-3 py-2.5 focus:border-danger outline-none font-tally tracking-wider"
          />
          {error && (
            <p className="text-danger text-sm" role="alert">
              {error}
            </p>
          )}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleReset}
              disabled={!canSubmit || isPending}
              className="px-5 py-2.5 rounded-full font-medium text-sm bg-danger text-white disabled:opacity-40"
            >
              {isPending ? "Resetting…" : "Permanently reset"}
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setConfirmText("");
                setError(null);
              }}
              disabled={isPending}
              className="text-sm text-muted hover:underline underline-offset-4"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
