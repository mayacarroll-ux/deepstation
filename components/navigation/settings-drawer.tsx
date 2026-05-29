"use client";

import {
  faBars,
  faChevronLeft,
  faCalendarWeek,
  faEnvelope,
  faGear,
  faListCheck,
  faSuitcase
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
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
    href: "/workday",
    label: "Workday helper",
    matches: (pathname: string) => pathname === "/workday" || pathname.startsWith("/workday/")
  },
  {
    href: "/weekly-allocation",
    label: "Weekly allocation",
    matches: (pathname: string) =>
      pathname === "/weekly-allocation" || pathname.startsWith("/weekly-allocation/")
  },
  {
    href: "/weekly-summary#email-settings",
    label: "Email settings",
    matches: (pathname: string) => pathname === "/weekly-summary"
  },
  {
    href: "/recurring",
    label: "Recurring entries",
    matches: (pathname: string) => pathname === "/recurring" || pathname.startsWith("/recurring/")
  }
] as const;

function MenuIcon() {
  return (
    <FontAwesomeIcon className="h-4 w-4" icon={faBars} />
  );
}

function CloseIcon() {
  return (
    <FontAwesomeIcon className="h-4 w-4" icon={faChevronLeft} />
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
                <span className="flex items-center gap-2">
                  {navigationItem.href === "/budget-key" ? (
                    <FontAwesomeIcon className="h-3.5 w-3.5" icon={faGear} />
                  ) : navigationItem.href === "/workday" ? (
                    <FontAwesomeIcon className="h-3.5 w-3.5" icon={faSuitcase} />
                  ) : navigationItem.href === "/weekly-allocation" ? (
                    <FontAwesomeIcon className="h-3.5 w-3.5" icon={faCalendarWeek} />
                  ) : navigationItem.href === "/weekly-summary#email-settings" ? (
                    <FontAwesomeIcon className="h-3.5 w-3.5" icon={faEnvelope} />
                  ) : (
                    <FontAwesomeIcon className="h-3.5 w-3.5" icon={faListCheck} />
                  )}
                  <span>{navigationItem.label}</span>
                </span>
              </Link>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
