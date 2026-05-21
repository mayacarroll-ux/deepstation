"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils/cn";

const settingsNavigationItems = [
  {
    href: "/budget-key",
    label: "Budget key",
    matches: (pathname: string) => pathname === "/budget-key" || pathname.startsWith("/budget-key/")
  },
  {
    href: "/weekly-summary#email-settings",
    label: "Email settings",
    matches: (pathname: string) => pathname === "/weekly-summary"
  },
  {
    href: "/recurring",
    label: "Recurring settings",
    matches: (pathname: string) => pathname === "/recurring" || pathname.startsWith("/recurring/")
  }
] as const;

function MenuIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 16 16" fill="none">
      <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeLinecap="round" strokeWidth="1.75" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 16 16" fill="none">
      <path d="M3.5 3.5l9 9M12.5 3.5l-9 9" stroke="currentColor" strokeLinecap="round" strokeWidth="1.75" />
    </svg>
  );
}

export function SettingsDrawer() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Sheet onOpenChange={setIsOpen} open={isOpen}>
      <button
        className="inline-flex h-10 items-center gap-2 border border-[var(--border)] bg-[var(--surface)] px-3 text-sm font-semibold text-[var(--foreground)] transition-colors hover:border-[var(--accent)] hover:bg-[var(--surface-muted)]"
        onClick={() => setIsOpen(true)}
        type="button"
      >
        <MenuIcon />
        Menu
      </button>

      <SheetContent className="w-full sm:w-[min(100vw,22rem)]" side="left">
        <SheetHeader className="border-b border-[var(--border)] px-5 py-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <SheetTitle className="text-base font-semibold">Settings</SheetTitle>
              <SheetDescription className="mt-1 text-sm text-[var(--muted)]">
                Configuration pages and saved preferences.
              </SheetDescription>
            </div>
            <button
              aria-label="Close settings menu"
              className="inline-flex h-9 w-9 items-center justify-center border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] transition-colors hover:border-[var(--accent)] hover:bg-[var(--surface-muted)]"
              onClick={() => setIsOpen(false)}
              type="button"
            >
              <CloseIcon />
            </button>
          </div>
        </SheetHeader>

        <nav className="grid gap-2 p-4">
          {settingsNavigationItems.map((navigationItem) => {
            const isActive = navigationItem.matches(pathname);

            return (
              <Link
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "border px-4 py-3 text-sm font-semibold transition-colors",
                  isActive
                    ? "border-[var(--accent)] bg-[var(--accent)] !text-neutral-950 shadow-[0_0_0_1px_var(--accent)]"
                    : "border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] hover:border-[var(--accent)] hover:bg-[var(--surface-muted)]"
                )}
                href={navigationItem.href}
                key={navigationItem.href}
                onClick={() => setIsOpen(false)}
              >
                {navigationItem.label}
              </Link>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
