"use client";

import { useActionState } from "react";
import type { Voter } from "@/lib/types";

type Action = (
  prevState: { error?: string; success?: boolean; generated?: number } | undefined,
  formData: FormData
) => Promise<{ error?: string; success?: boolean; generated?: number }>;

export default function GenerateCodesForm({ action, codes }: { action: Action; codes: Voter[] }) {
  const [state, formAction, pending] = useActionState(action, undefined);

  function downloadCsv() {
    const header = "code,label,status\n";
    const rows = codes
      .map((v) => `${v.code},${v.label ?? ""},${v.is_used ? "used" : "unused"}`)
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "voter-codes.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <form action={formAction} className="flex flex-col sm:flex-row gap-3 items-end">
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="count">
            How many codes?
          </label>
          <input
            id="count"
            name="count"
            type="number"
            min={1}
            max={5000}
            defaultValue={20}
            required
            className="w-32 ballot-card px-3 py-2.5 focus:border-seal outline-none"
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium mb-1" htmlFor="labelPrefix">
            Label prefix (optional)
          </label>
          <input
            id="labelPrefix"
            name="labelPrefix"
            placeholder="e.g. Voter"
            className="w-full ballot-card px-3 py-2.5 focus:border-seal outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="seal-button px-6 py-2.5 font-medium disabled:opacity-60"
        >
          {pending ? "Generating…" : "Generate"}
        </button>
      </form>

      {state?.error && <p className="text-danger text-sm mt-3">{state.error}</p>}
      {state?.success && (
        <p className="text-counted text-sm mt-3">
          {state.generated} code{state.generated === 1 ? "" : "s"} generated.
        </p>
      )}

      {codes.length > 0 && (
        <button
          onClick={downloadCsv}
          className="mt-4 text-sm underline underline-offset-4 text-muted hover:text-ink"
        >
          Download all codes as CSV
        </button>
      )}
    </div>
  );
}
