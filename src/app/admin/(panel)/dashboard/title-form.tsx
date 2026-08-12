"use client";

import { useActionState } from "react";

type Action = (
  prevState: { error?: string; success?: boolean } | undefined,
  formData: FormData
) => Promise<{ error?: string; success?: boolean }>;

export default function ElectionTitleForm({
  action,
  currentTitle,
}: {
  action: Action;
  currentTitle: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="flex flex-col sm:flex-row gap-3">
      <input
        name="title"
        defaultValue={currentTitle}
        required
        className="flex-1 ballot-card px-4 py-2.5 focus:border-seal outline-none"
      />
      <button
        type="submit"
        disabled={pending}
        className="seal-button px-5 py-2.5 font-medium text-sm disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save"}
      </button>
      {state?.error && <p className="text-danger text-sm sm:self-center">{state.error}</p>}
      {state?.success && <p className="text-counted text-sm sm:self-center">Saved.</p>}
    </form>
  );
}
