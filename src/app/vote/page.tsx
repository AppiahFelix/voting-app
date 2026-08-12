"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { verifyVoterCode, submitVotes } from "@/app/actions/vote";
import type { Aspirant } from "@/lib/types";

type Step = "entry" | "ballot" | "done";

export default function VotePage() {
  const [step, setStep] = useState<Step>("entry");
  const [code, setCode] = useState("");
  const [positions, setPositions] = useState<{ position: string; aspirants: Aspirant[] }[]>([]);
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleVerify() {
    setError(null);
    startTransition(async () => {
      const res = await verifyVoterCode(code);
      if (!res.ok) {
        setError(res.error || "Something went wrong.");
        return;
      }
      setPositions(res.positions || []);
      setSelections({});
      setStep("ballot");
    });
  }

  function handleSubmit() {
    setError(null);
    const missing = positions.find((p) => !selections[p.position]);
    if (missing) {
      setError(`Select a candidate for ${missing.position} before submitting.`);
      return;
    }
    startTransition(async () => {
      const res = await submitVotes(code, selections);
      if (!res.ok) {
        setError(res.error || "Couldn't submit your vote.");
        return;
      }
      setStep("done");
    });
  }

  if (step === "done") {
    return (
      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="max-w-md w-full text-center ballot-card p-10">
          <div className="seal-button w-16 h-16 mx-auto mb-6 flex items-center justify-center font-display text-2xl">
            ✓
          </div>
          <h1 className="font-display text-3xl mb-3">Vote recorded</h1>
          <p className="text-muted mb-8">
            Your ballot has been counted. This access code is now used and can&apos;t vote again.
          </p>
          <Link href="/results" className="seal-button inline-flex px-6 py-3 font-medium">
            Watch results live
          </Link>
        </div>
      </main>
    );
  }

  if (step === "ballot") {
    return (
      <main className="flex-1 px-6 py-12">
        <div className="max-w-2xl mx-auto">
          <p className="font-tally text-xs tracking-[0.3em] text-muted uppercase mb-2">
            Official Ballot
          </p>
          <h1 className="font-display text-3xl mb-8">Make your selections</h1>

          <div className="space-y-8">
            {positions.map((p) => {
              const groups: Record<string, Aspirant[]> = {};
              for (const a of p.aspirants) {
                const key = a.sex === "Male" || a.sex === "Female" ? a.sex : "Other";
                groups[key] = groups[key] || [];
                groups[key].push(a);
              }
              const isSplit =
                (groups["Male"]?.length ?? 0) > 0 &&
                (groups["Female"]?.length ?? 0) > 0 &&
                !groups["Other"];

              const renderAspirant = (a: Aspirant) => {
                const checked = selections[p.position] === a.id;
                return (
                  <label
                    key={a.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      checked ? "border-seal bg-counted-soft/40" : "border-line hover:border-ink-soft"
                    }`}
                  >
                    <input
                      type="radio"
                      name={p.position}
                      value={a.id}
                      checked={checked}
                      onChange={() =>
                        setSelections((prev) => ({ ...prev, [p.position]: a.id }))
                      }
                      className="accent-[var(--seal)] w-4 h-4"
                    />
                    {a.photo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={a.photo_url}
                        alt=""
                        className="w-10 h-10 rounded-full object-cover border border-line shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-line shrink-0" aria-hidden />
                    )}
                    <span className="flex-1">
                      <span className="font-medium">{a.name}</span>
                      <span className="block text-xs text-muted">
                        {[a.category, a.sex].filter(Boolean).join(" · ") || undefined}
                      </span>
                    </span>
                  </label>
                );
              };

              return (
                <fieldset key={p.position} className="ballot-card p-5">
                  <legend className="font-display text-xl px-1">{p.position}</legend>
                  {isSplit ? (
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-muted mb-2">Male</p>
                        <div className="space-y-2">{groups["Male"].map(renderAspirant)}</div>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-muted mb-2">Female</p>
                        <div className="space-y-2">{groups["Female"].map(renderAspirant)}</div>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3 space-y-2">{p.aspirants.map(renderAspirant)}</div>
                  )}
                </fieldset>
              );
            })}
          </div>

          {error && (
            <p className="text-danger text-sm mt-6" role="alert">
              {error}
            </p>
          )}

          <button
            onClick={handleSubmit}
            disabled={isPending}
            className="seal-button w-full mt-8 py-4 font-display text-lg disabled:opacity-60"
          >
            {isPending ? "Submitting…" : "Cast your vote"}
          </button>
          <p className="text-xs text-muted text-center mt-3">
            Once submitted, your vote can&apos;t be changed.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 flex items-center justify-center px-6 py-16">
      <div className="max-w-sm w-full">
        <p className="font-tally text-xs tracking-[0.3em] text-muted uppercase mb-2 text-center">
          Official Ballot
        </p>
        <h1 className="font-display text-3xl mb-2 text-center">Enter your access code</h1>
        <p className="text-muted text-sm mb-8 text-center">
          You should have received a unique code from the election administrator.
        </p>

        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleVerify()}
          placeholder="e.g. K7QX2M9P"
          autoFocus
          className="w-full text-center font-tally text-xl tracking-[0.2em] uppercase ballot-card px-4 py-4 mb-4 focus:border-seal outline-none"
        />

        {error && (
          <p className="text-danger text-sm mb-4 text-center" role="alert">
            {error}
          </p>
        )}

        <button
          onClick={handleVerify}
          disabled={isPending || !code.trim()}
          className="seal-button w-full py-4 font-display text-lg disabled:opacity-60"
        >
          {isPending ? "Checking…" : "Continue"}
        </button>
      </div>
    </main>
  );
}
