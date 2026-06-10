import type { ComponentPropsWithoutRef, ReactNode } from "react"
import Link from "next/link"
import clsx from "clsx"

type ButtonVariant = "primary" | "secondary" | "ghost"

const base =
  "inline-flex items-center justify-center gap-2 rounded-[var(--radius-pill)] text-sm font-medium transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--text)] disabled:cursor-not-allowed disabled:opacity-50"

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--text)] px-5 py-2.5 text-white hover:bg-black hover:shadow-[var(--shadow-card)]",
  secondary:
    "border border-[var(--border)] bg-[var(--surface-strong)] px-5 py-2.5 text-[var(--text)] hover:border-[var(--muted-soft)]",
  ghost:
    "px-3 py-2 text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--text)]",
}

type ButtonProps = ComponentPropsWithoutRef<"button"> & {
  variant?: ButtonVariant
}

export function Button({ variant = "primary", className, ...props }: ButtonProps) {
  return <button className={clsx(base, variants[variant], className)} {...props} />
}

type ButtonLinkProps = {
  href: string
  variant?: ButtonVariant
  className?: string
  children: ReactNode
}

export function ButtonLink({
  href,
  variant = "primary",
  className,
  children,
}: ButtonLinkProps) {
  return (
    <Link className={clsx(base, variants[variant], className)} href={href}>
      {children}
    </Link>
  )
}
