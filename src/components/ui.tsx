import { useId, type ButtonHTMLAttributes, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { AlertTriangle, CheckCircle2, ChevronDown, Info, RotateCcw } from "lucide-react";

export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

type ButtonVariant = "primary" | "secondary" | "ghost";
type ButtonSize = "md" | "sm";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: LucideIcon;
  iconRight?: LucideIcon;
  children?: ReactNode;
}

export function Button({
  variant = "secondary",
  size = "md",
  icon: Icon,
  iconRight: IconRight,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "btn",
        variant === "primary" && "btn-primary",
        variant === "secondary" && "btn-secondary",
        variant === "ghost" && "btn-ghost",
        size === "sm" && "min-h-9 px-3 text-xs",
        className,
      )}
      {...props}
    >
      {Icon ? <Icon aria-hidden="true" size={16} strokeWidth={1.9} /> : null}
      {children}
      {IconRight ? <IconRight aria-hidden="true" size={16} strokeWidth={1.9} /> : null}
    </button>
  );
}

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon;
  label: string;
  variant?: ButtonVariant;
}

export function IconButton({ icon: Icon, label, variant = "ghost", className, ...props }: IconButtonProps) {
  return (
    <button
      aria-label={label}
      title={label}
      className={cn(
        "btn btn-icon",
        variant === "primary" && "btn-primary",
        variant === "secondary" && "btn-secondary",
        variant === "ghost" && "btn-ghost",
        className,
      )}
      {...props}
    >
      <Icon aria-hidden="true" size={18} strokeWidth={1.9} />
    </button>
  );
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("card", className)}>{children}</div>;
}

export function SectionHeader({
  number,
  icon: Icon,
  title,
  description,
  aside,
}: {
  number: string;
  icon: LucideIcon;
  title: string;
  description: string;
  aside?: ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-3xl">
        <div className="eyebrow">
          <Icon aria-hidden="true" size={14} strokeWidth={2.2} />
          Módulo {number}
        </div>
        <h2 className="mt-2 text-2xl font-semibold text-fg sm:text-3xl">{title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted sm:text-[0.95rem]">{description}</p>
      </div>
      {aside ? <div className="shrink-0">{aside}</div> : null}
    </header>
  );
}

type BadgeTone = "neutral" | "accent" | "success" | "warning" | "danger" | "purple";

export function Badge({
  children,
  tone = "neutral",
  icon: Icon,
}: {
  children: ReactNode;
  tone?: BadgeTone;
  icon?: LucideIcon;
}) {
  const styles: Record<BadgeTone, string> = {
    neutral: "bg-surface-3 text-muted",
    accent: "bg-accent/10 text-accent",
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
    danger: "bg-danger/10 text-danger",
    purple: "bg-accent-2/10 text-accent-2",
  };
  return (
    <span className={cn("badge", styles[tone])}>
      {Icon ? <Icon aria-hidden="true" size={12} strokeWidth={2.2} /> : null}
      {children}
    </span>
  );
}

type CalloutTone = "info" | "warning" | "success" | "danger";

export function Callout({
  tone = "info",
  title,
  children,
  icon,
}: {
  tone?: CalloutTone;
  title?: string;
  children: ReactNode;
  icon?: LucideIcon;
}) {
  const defaultIcons: Record<CalloutTone, LucideIcon> = {
    info: Info,
    warning: AlertTriangle,
    success: CheckCircle2,
    danger: AlertTriangle,
  };
  const IconComponent = icon ?? defaultIcons[tone];
  return (
    <div className={cn("callout", `callout-${tone}`)}>
      <div className="flex items-start gap-3">
        <IconComponent
          aria-hidden="true"
          size={17}
          strokeWidth={2}
          className={cn(
            "mt-0.5 shrink-0",
            tone === "info" && "text-accent",
            tone === "warning" && "text-warning",
            tone === "success" && "text-success",
            tone === "danger" && "text-danger",
          )}
        />
        <div className="min-w-0">
          {title ? <p className="mb-1 text-sm font-semibold text-fg">{title}</p> : null}
          <div className="text-sm leading-relaxed text-muted">{children}</div>
        </div>
      </div>
    </div>
  );
}

export function Metric({
  label,
  value,
  hint,
  icon: Icon,
  accent = false,
  valueClassName,
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: LucideIcon;
  accent?: boolean;
  valueClassName?: string;
}) {
  return (
    <div className="metric-card card p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[0.68rem] font-bold uppercase tracking-[0.1em] text-faint">{label}</p>
        {Icon ? (
          <Icon
            aria-hidden="true"
            size={16}
            strokeWidth={1.8}
            className={accent ? "text-accent" : "text-faint"}
          />
        ) : null}
      </div>
      <p className={cn("metric-value mt-3", accent ? "text-accent" : "text-fg", valueClassName)}>{value}</p>
      {hint ? <p className="mt-2 text-xs leading-relaxed text-muted">{hint}</p> : null}
    </div>
  );
}

export interface SelectOption {
  value: string;
  label: string;
}

export function SelectField({
  label,
  value,
  onChange,
  options,
  hint,
  className,
  id,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly SelectOption[];
  hint?: string;
  className?: string;
  id?: string;
}) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  return (
    <label className={cn("block", className)} htmlFor={fieldId}>
      <span className="mb-1.5 block text-xs font-semibold text-muted">{label}</span>
      <span className="relative block">
        <select
          id={fieldId}
          className="field appearance-none pr-9"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          aria-hidden="true"
          size={15}
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted"
        />
      </span>
      {hint ? <span className="mt-1 block text-[0.7rem] leading-relaxed text-faint">{hint}</span> : null}
    </label>
  );
}

export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: T;
  onChange: (value: T) => void;
  options: readonly { value: T; label: string }[];
  label: string;
}) {
  return (
    <div role="group" aria-label={label} className="inline-flex rounded-lg border border-border bg-surface-2 p-1">
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-semibold transition-colors",
              active ? "bg-accent text-bg" : "text-muted hover:text-fg",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="card flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
      <div className="rounded-full border border-border bg-surface-2 p-3 text-muted">
        <Icon aria-hidden="true" size={22} strokeWidth={1.7} />
      </div>
      <h3 className="text-base font-semibold text-fg">{title}</h3>
      <p className="max-w-md text-sm leading-relaxed text-muted">{description}</p>
      {action}
    </div>
  );
}

export function ResetFiltersButton({ onClick }: { onClick: () => void }) {
  return (
    <Button variant="secondary" size="sm" icon={RotateCcw} onClick={onClick}>
      Limpiar filtros
    </Button>
  );
}

export function DataDetails({ children, label = "Ver datos" }: { children: ReactNode; label?: string }) {
  return (
    <details className="group mt-4 border-t border-border pt-3">
      <summary className="flex cursor-pointer list-none items-center gap-2 text-xs font-semibold text-muted marker:hidden hover:text-fg">
        <ChevronDown
          aria-hidden="true"
          size={14}
          className="transition-transform group-open:rotate-180"
        />
        {label}
      </summary>
      <div className="mt-3">{children}</div>
    </details>
  );
}

export function KeyValue({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-border/70 py-2 last:border-0">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="text-right text-sm font-semibold text-fg">{value}</dd>
    </div>
  );
}
