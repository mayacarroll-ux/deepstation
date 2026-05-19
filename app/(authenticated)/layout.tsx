import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { AppNav } from "@/components/navigation/app-nav";
import { isProduction } from "@/lib/config";
import { applicationName } from "@/lib/constants";

export default async function AuthenticatedLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  if (isProduction) {
    const session = await auth();

    if (!session?.user) {
      redirect("/login");
    }
  }

  return (
    <main className="min-h-screen bg-[var(--background)] px-6 py-6 text-[var(--foreground)]">
      <div className="mx-auto max-w-7xl">
        <header className="grid gap-5 border-b border-[var(--border)] pb-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm text-[var(--muted)]">{applicationName}</p>
              <h1 className="text-3xl font-semibold">Time tracking</h1>
            </div>
            <p className="text-sm font-semibold text-[var(--muted)]">Single-user MVP</p>
          </div>
          <AppNav />
        </header>
        {children}
      </div>
    </main>
  );
}
