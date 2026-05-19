import Link from "next/link";
import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils/cn";

const buttonBaseClassName =
  "inline-flex h-11 items-center justify-center border px-5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60";

const buttonVariantClassNames = {
  primary:
    "border-[var(--accent)] bg-[var(--accent)] !text-neutral-950 hover:bg-[var(--accent-hover)]",
  secondary:
    "border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] hover:bg-[var(--surface-muted)]"
};

type ButtonVariant = keyof typeof buttonVariantClassNames;

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

export function Button({
  className,
  variant = "primary",
  ...buttonProps
}: ButtonProps) {
  return (
    <button
      className={cn(buttonBaseClassName, buttonVariantClassNames[variant], className)}
      {...buttonProps}
    />
  );
}

export function ButtonLink({
  className,
  href,
  variant = "primary",
  children
}: {
  className?: string;
  href: string;
  variant?: ButtonVariant;
  children: React.ReactNode;
}) {
  return (
    <Link
      className={cn(buttonBaseClassName, buttonVariantClassNames[variant], className)}
      href={href}
    >
      {children}
    </Link>
  );
}
