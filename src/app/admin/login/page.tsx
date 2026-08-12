"use client";

import { useActionState } from "react";
import { loginAdmin } from "@/app/actions/admin";

export default function AdminLoginPage() {
  const [state, formAction, pending] = useActionState(loginAdmin, undefined);

  return (
    <main className="flex-1 flex items-center justify-center px-6 py-16">
      <form action={formAction} className="max-w-sm w-full">
        <p className="font-tally text-xs tracking-[0.3em] text-muted uppercase mb-2 text-center">
          Administrator
        </p>
        <h1 className="font-display text-3xl mb-8 text-center">Sign in</h1>

        <label className="block text-sm font-medium mb-2" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoFocus
          className="w-full ballot-card px-4 py-3 mb-4 focus:border-seal outline-none"
        />

        {state?.error && (
          <p className="text-danger text-sm mb-4" role="alert">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="seal-button w-full py-3 font-display text-lg disabled:opacity-60"
        >
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </main>
  );
}
