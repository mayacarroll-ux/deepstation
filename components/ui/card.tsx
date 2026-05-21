import { cn } from "@/lib/utils/cn";

export function Card({
  className,
  children
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <section className={cn("rounded-md border border-[var(--border)] bg-[var(--panel)]", className)}>{children}</section>;
}

export function CardHeader({
  className,
  children
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn("grid gap-1.5 p-5", className)}>{children}</div>;
}

export function CardTitle({
  className,
  children
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <h3 className={cn("text-lg font-semibold tracking-tight", className)}>{children}</h3>;
}

export function CardDescription({
  className,
  children
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <p className={cn("text-sm text-[var(--muted)]", className)}>{children}</p>;
}

export function CardContent({
  className,
  children
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn("p-5 pt-0", className)}>{children}</div>;
}

export function CardFooter({
  className,
  children
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn("flex items-center p-5 pt-0", className)}>{children}</div>;
}

