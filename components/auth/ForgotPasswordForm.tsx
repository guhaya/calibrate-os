"use client";

import { useActionState } from "react";
import Link from "next/link";
import { forgotPassword, type AuthState } from "@/app/actions/auth";

type ForgotState = { error?: string; success?: boolean } | null;

export default function ForgotPasswordForm() {
  const [state, action, pending] = useActionState<ForgotState, FormData>(
    forgotPassword,
    null
  );

  if (state?.success) {
    return (
      <div className="rounded-lg border border-emerald-900 bg-emerald-950/40 px-6 py-5 text-sm text-emerald-400">
        <p className="font-semibold">Check your email.</p>
        <p className="mt-1 text-emerald-500">
          We sent a password reset link. It may take a minute to arrive.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-white">
          Reset your password
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          Enter your email and we&apos;ll send a reset link.
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
            htmlFor="email"
            className="text-xs font-semibold uppercase tracking-wider text-zinc-500"
          >
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@example.com"
            className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 transition-colors focus:border-emerald-400 focus:outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-emerald-400 px-4 py-2.5 text-sm font-semibold text-zinc-950 transition-colors hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? "Sending…" : "Send reset link"}
        </button>

        <Link
          href="/login"
          className="text-center text-sm text-zinc-500 transition-colors hover:text-zinc-300"
        >
          Back to sign in
        </Link>
      </form>
    </>
  );
}
