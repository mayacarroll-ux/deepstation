"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChartColumn,
  faClock,
  faFileInvoiceDollar
} from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils/cn";

const navigationItems = [
  { href: "/dashboard", icon: faChartColumn, label: "Dashboard" },
  { href: "/time-entries", icon: faClock, label: "Time entries" },
  { href: "/weekly-summary", icon: faFileInvoiceDollar, label: "Weekly summary" }
] as const;

export function AppNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-2">
      {navigationItems.map((navigationItem) => (
        <Link
          aria-current={isNavigationItemActive(pathname, navigationItem.href) ? "page" : undefined}
          className={cn(
            "border px-3 py-2 text-sm font-semibold transition-colors",
            isNavigationItemActive(pathname, navigationItem.href)
              ? "border-[var(--accent)] bg-[var(--accent)] !text-neutral-950 shadow-[0_0_0_1px_var(--accent)]"
              : "border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] hover:border-[var(--accent)] hover:bg-[var(--surface-muted)]"
          )}
          href={navigationItem.href}
          key={navigationItem.href}
        >
          <span className="flex items-center gap-2">
            <FontAwesomeIcon className="h-3.5 w-3.5" icon={navigationItem.icon} />
            <span>{navigationItem.label}</span>
          </span>
        </Link>
      ))}
    </nav>
  );
}

function isNavigationItemActive(pathname: string, navigationItemHref: string) {
  if (navigationItemHref === "/dashboard") {
    return pathname === "/dashboard";
  }

  if (navigationItemHref === "/time-entries") {
    return pathname === "/time-entries" || pathname.startsWith("/time-entries/");
  }

  if (navigationItemHref === "/weekly-summary") {
    return pathname === "/weekly-summary" || pathname.startsWith("/weekly-summary/");
  }

  return false;
}
