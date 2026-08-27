import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-8">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-blue-400">
              AI REVENUE RECOVERY
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight">
              Recovery Intelligence
            </h1>

            <p className="mt-2 max-w-2xl text-slate-400">
              AI-powered payment recovery, policy
              enforcement, and revenue attribution.
            </p>
          </div>

          <Link
            href="/dashboard"
            className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold transition hover:bg-blue-500"
          >
            Open Dashboard
          </Link>
        </header>

        <section className="mt-16 grid gap-6 md:grid-cols-3">
          <FeatureCard
            title="AI Strategy"
            description="Generate recovery strategies based on payment failure context."
          />

          <FeatureCard
            title="Policy Engine"
            description="Validate AI decisions against merchant-defined recovery policies."
          />

          <FeatureCard
            title="Revenue Attribution"
            description="Track successfully recovered revenue back to recovery actions."
          />
        </section>

        <section className="mt-auto border-t border-slate-800 pt-8">
          <p className="text-sm text-slate-500">
            AI Revenue Recovery Engine
          </p>
        </section>
      </div>
    </main>
  );
}

function FeatureCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
      <h2 className="text-lg font-semibold">
        {title}
      </h2>

      <p className="mt-3 text-sm leading-6 text-slate-400">
        {description}
      </p>
    </div>
  );
}