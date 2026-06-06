export const metadata = { title: "Daily Brief — CALIBRATE OS" };

export default function BriefPage() {
  return (
    <div className="p-6 lg:p-10">
      <h1 className="text-2xl font-semibold tracking-tight text-white">
        Daily Brief
      </h1>
      <p className="mt-1 text-sm text-zinc-400">
        Your AI-generated performance brief for today.
      </p>
    </div>
  );
}
