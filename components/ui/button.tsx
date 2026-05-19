import Link from "next/link";
import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils/cn";

const buttonBaseClassName =
  "inline-flex h-11 items-center justify-center border px-5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60";

const buttonVariantClassNames = {
  primary:
    "border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-foreground)] hover:bg-[#0d5748]",
  secondary:
    "border-[var(--border)] bg-[var(--panel)] text-[var(--foreground)] hover:bg-[#eef1eb]"
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
