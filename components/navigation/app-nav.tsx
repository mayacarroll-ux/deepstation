import Link from "next/link";

const navigationItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/time-entries", label: "Time entries" },
  { href: "/budget-key", label: "Budget key" },
  { href: "/recurring", label: "Recurring" },
  { href: "/weekly-summary", label: "Weekly summary" },
  { href: "/workday", label: "Workday" }
];

export function AppNav() {
  return (
    <nav className="flex flex-wrap gap-2">
      {navigationItems.map((navigationItem) => (
        <Link
          className="border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm font-semibold text-[var(--foreground)] transition-colors hover:border-[var(--accent)] hover:bg-[var(--surface-muted)]"
          href={navigationItem.href}
          key={navigationItem.href}
        >
          {navigationItem.label}
        </Link>
      ))}
    </nav>
  );
}
