import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-6 text-center">
      <p className="font-mono text-6xl font-bold text-zinc-700">404</p>
      <h1 className="mt-4 text-xl font-semibold tracking-tight text-white">
        Page not found
      </h1>
      <p className="mt-2 text-sm text-zinc-500">
        This page doesn&apos;t exist or has been moved.
      </p>
      <Link
        href="/dashboard"
        className="mt-6 rounded-xl bg-emerald-400 px-6 py-2.5 text-sm font-semibold text-zinc-950 transition-colors hover:bg-emerald-300"
      >
        Go to dashboard
      </Link>
    </div>
  );
}
