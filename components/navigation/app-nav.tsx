import Link from "next/link";

const navigationItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/time-entries", label: "Time entries" },
  { href: "/budget-key", label: "Budget key" },
  { href: "/weekly-summary", label: "Weekly summary" }
];

export function AppNav() {
  return (
    <nav className="flex flex-wrap gap-2">
      {navigationItems.map((navigationItem) => (
        <Link
          className="border border-[var(--border)] bg-[var(--panel)] px-3 py-2 text-sm font-semibold hover:bg-[#eef1eb]"
          href={navigationItem.href}
          key={navigationItem.href}
        >
          {navigationItem.label}
        </Link>
      ))}
    </nav>
  );
}
