import Link from "next/link";

import { ButtonLink } from "@/components/ui/button";
import { applicationName } from "@/lib/constants";

export default function PublicHomePage() {
  return (
    <main className="min-h-screen px-6 py-8">
      <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl flex-col justify-between">
        <header className="flex items-center justify-between border-b border-[var(--border)] pb-5">
          <div className="text-lg font-semibold">{applicationName}</div>
          <Link className="text-sm text-[var(--muted)]" href="/dashboard">
            Open app
          </Link>
        </header>

        <div className="grid gap-10 py-16 md:grid-cols-[1.1fr_0.9fr] md:items-end">
          <div>
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
              Time tracking
            </p>
            <h1 className="max-w-3xl text-5xl font-semibold leading-tight md:text-7xl">
              {applicationName}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--muted)]">
              Replace spreadsheet time tracking with budget-key mappings,
              workbook-style entries, weekly billing summaries, and copy-ready
              client updates.
            </p>
            <div className="mt-8">
              <ButtonLink href="/dashboard">Open workspace</ButtonLink>
            </div>
          </div>

          <div className="border-l border-[var(--border)] pl-6">
            <dl className="grid gap-6">
              <div>
                <dt className="text-sm text-[var(--muted)]">Runtime</dt>
                <dd className="mt-1 text-2xl font-semibold">Workbook entries</dd>
              </div>
              <div>
                <dt className="text-sm text-[var(--muted)]">Data</dt>
                <dd className="mt-1 text-2xl font-semibold">Budget key mapping</dd>
              </div>
              <div>
                <dt className="text-sm text-[var(--muted)]">AI</dt>
                <dd className="mt-1 text-2xl font-semibold">Weekly summaries</dd>
              </div>
            </dl>
          </div>
        </div>
      </section>
    </main>
  );
}
