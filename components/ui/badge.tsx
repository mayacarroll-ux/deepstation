import { cn } from "@/lib/utils/cn";

const badgeVariantClassNames = {
  default: "border-[var(--accent)] bg-[var(--accent)] !text-neutral-950",
  secondary: "border-[var(--border)] bg-[var(--surface-muted)] text-[var(--foreground)]",
  outline: "border-[var(--border)] bg-transparent text-[var(--muted)]"
};

type BadgeVariant = keyof typeof badgeVariantClassNames;

export function Badge({
  className,
  children,
  variant = "default"
}: {
  className?: string;
  children: React.ReactNode;
  variant?: BadgeVariant;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold",
        badgeVariantClassNames[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

