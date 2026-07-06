import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { HeaderQuickTimer } from "@/components/navigation/header-quick-timer";
import { AppNav } from "@/components/navigation/app-nav";
import { SettingsDrawer } from "@/components/navigation/settings-drawer";
import { isAuthenticationTemporarilyDisabled, isProduction } from "@/lib/config";
import { getCurrentWorkbookOwnerId } from "@/lib/services/current-user";
import { getLifetimeHours, listBudgetMappings } from "@/lib/services/time-tracking";
import { formatHours } from "@/lib/utils/format";

import { createQuickTimerTimeEntryAction } from "./time-entries/actions";

export const dynamic = "force-dynamic";

export default async function AuthenticatedLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  if (isProduction && !isAuthenticationTemporarilyDisabled) {
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
    <main className="min-h-screen bg-[var(--background)] px-4 py-4 text-[var(--foreground)] sm:px-6 sm:py-6">
      <div className="mx-auto max-w-7xl">
        <header className="grid gap-4 border-b border-[var(--border)] pb-4 sm:gap-5 sm:pb-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <SettingsDrawer />
              <div className="grid gap-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)] sm:text-sm">
                  Maya Carroll
                </p>
                <h1 className="text-2xl font-semibold sm:text-3xl">Time tracking</h1>
              </div>
            </div>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:items-end">
              <p className="text-sm font-semibold text-[var(--muted)] sm:text-right">
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
