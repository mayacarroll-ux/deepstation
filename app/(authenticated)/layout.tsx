import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { HeaderQuickTimer } from "@/components/navigation/header-quick-timer";
import { AppNav } from "@/components/navigation/app-nav";
import { SettingsDrawer } from "@/components/navigation/settings-drawer";
import { isProduction } from "@/lib/config";
import { getCurrentWorkbookOwnerId } from "@/lib/services/current-user";
import { getLifetimeHours, listBudgetMappings } from "@/lib/services/time-tracking";
import { formatHours } from "@/lib/utils/format";

import { createQuickTimerTimeEntryAction } from "./time-entries/actions";

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

  const ownerId = await getCurrentWorkbookOwnerId();
  const [lifetimeHours, budgetMappingRecords] = await Promise.all([
    getLifetimeHours(ownerId),
    listBudgetMappings(ownerId)
  ]);

  return (
    <main className="min-h-screen bg-[var(--background)] px-6 py-6 text-[var(--foreground)]">
      <div className="mx-auto max-w-7xl">
        <header className="grid gap-5 border-b border-[var(--border)] pb-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <SettingsDrawer />
              <div>
                <p className="text-sm text-[var(--muted)]">Maya Carroll</p>
                <h1 className="text-3xl font-semibold">Time tracking</h1>
              </div>
            </div>
            <div className="grid justify-items-end gap-3">
              <p className="text-sm font-semibold text-[var(--muted)]">
                Junior Achievement · {formatHours(lifetimeHours)} hrs
              </p>
              <HeaderQuickTimer
                budgetMappings={budgetMappingRecords}
                saveAction={createQuickTimerTimeEntryAction}
              />
            </div>
          </div>
          <AppNav />
        </header>
        {children}
      </div>
    </main>
  );
}
