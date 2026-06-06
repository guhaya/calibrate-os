"use client";

import { useEffect } from "react";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[AppError]", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <p className="text-xs font-semibold uppercase tracking-widest text-red-400">
        Error
      </p>
      <h2 className="mt-2 text-xl font-semibold tracking-tight text-white">
        Something went wrong
      </h2>
      <p className="mt-2 text-sm text-zinc-500">
        This page encountered an error. Your data is safe.
      </p>
      <button
        onClick={reset}
        className="mt-6 rounded-xl bg-emerald-400 px-6 py-2.5 text-sm font-semibold text-zinc-950 transition-colors hover:bg-emerald-300"
      >
        Try again
      </button>
    </div>
  );
}
