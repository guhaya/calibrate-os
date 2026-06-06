"use client";

import { useActionState } from "react";
import { resetPassword, type AuthState } from "@/app/actions/auth";

export default function ResetPasswordForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(
    resetPassword,
    null
  );

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-white">
          Set a new password
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          Choose a new password for your account.
        </p>
      </div>

      <form action={action} className="flex flex-col gap-5">
        {state?.error && (
          <div className="rounded-lg border border-red-900 bg-red-950/40 px-4 py-3 text-sm text-red-400">
            {state.error}
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="password"
            className="text-xs font-semibold uppercase tracking-wider text-zinc-500"
          >
            New password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            placeholder="At least 8 characters"
            className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 transition-colors focus:border-emerald-400 focus:outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-emerald-400 px-4 py-2.5 text-sm font-semibold text-zinc-950 transition-colors hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? "Updating…" : "Update password"}
        </button>
      </form>
    </>
  );
}
