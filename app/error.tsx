"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-zinc-950 text-white">
        <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-red-400">
            Error
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">
            Something went wrong
          </h1>
          <p className="mt-2 text-sm text-zinc-500">
            An unexpected error occurred. Your data is safe.
          </p>
          <button
            onClick={reset}
            className="mt-6 rounded-xl bg-emerald-400 px-6 py-2.5 text-sm font-semibold text-zinc-950 transition-colors hover:bg-emerald-300"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
