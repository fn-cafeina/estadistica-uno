import { useId, type ButtonHTMLAttributes, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { NAV_ITEMS, PROCEDURES } from "./navigation";

export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export function Section({
  id,
  number,
  icon: Icon,
  title,
  description,
  aside,
  children,
}: {
  id: string;
  number: string;
  icon: LucideIcon;
  title: ReactNode;
  description: ReactNode;
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section id={id} className="lab-section" aria-labelledby={`${id}-title`}>
      <header className="lab-section-head">
        <div className="lab-section-head-main">
          <p className="lab-kicker">
            <Icon aria-hidden="true" size={13} />
            {number}
          </p>
          <h2 id={`${id}-title`} className="lab-title">
            {title}
          </h2>
          <p className="lab-lede">{description}</p>
        </div>
        {aside ? <div className="lab-aside">{aside}</div> : null}
      </header>
      {children}
    </section>
  );
}

export function Panel({
  title,
  meta,
  children,
  className,
  active,
}: {
  title?: ReactNode;
  meta?: ReactNode;
  children: ReactNode;
  className?: string;
  /** Cuando se indica, el panel es un procedimiento: se oculta si no está activo. */
  active?: boolean;
}) {
  return (
    <div
      className={cn("lab-panel", active === undefined ? undefined : "lab-procedure", className)}
      data-active={active}
    >
      {title || meta ? (
        <div className="lab-panel-head">
          {title ? <h3 className="lab-panel-title">{title}</h3> : <span />}
          {meta ? <span className="lab-panel-meta">{meta}</span> : null}
        </div>
      ) : null}
      {children}
    </div>
  );
}

export function Metric({
  label,
  value,
  hint,
  accent = false,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  accent?: boolean;
}) {
  return (
    <div className="lab-metric">
      <p className="lab-metric-label">{label}</p>
      <p className="lab-metric-value" data-accent={accent}>
        {value}
      </p>
      {hint ? <p className="lab-metric-hint">{hint}</p> : null}
    </div>
  );
}

export function Button({
  variant = "secondary",
  icon: Icon,
  children,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary";
  icon?: LucideIcon;
}) {
  return (
    <button
      type="button"
      className={cn("lab-button", variant === "primary" && "lab-button-primary", className)}
      {...props}
    >
      {Icon ? <Icon aria-hidden="true" size={14} strokeWidth={1.9} /> : null}
      {children}
    </button>
  );
}

export function IconButton({
  icon: Icon,
  label,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: LucideIcon;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn("lab-icon-button", className)}
      {...props}
    >
      <Icon aria-hidden="true" size={16} strokeWidth={1.9} />
    </button>
  );
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "accent" | "warning";
}) {
  return (
    <span className={cn("lab-badge", tone === "accent" && "lab-badge-accent", tone === "warning" && "lab-badge-warning")}>
      {children}
    </span>
  );
}

export function SelectField({
  label,
  value,
  onChange,
  options,
  hint,
  className,
  id,
  active,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly { value: string; label: string }[];
  hint?: string;
  className?: string;
  id?: string;
  active?: boolean;
}) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  return (
    <label
      className={cn(
        "block",
        active === undefined ? undefined : "lab-procedure lab-procedure-control",
        className,
      )}
      data-active={active}
      htmlFor={fieldId}
    >
      <span className="lab-form-label">{label}</span>
      <select
        id={fieldId}
        className="lab-field"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {hint ? <span className="lab-form-hint">{hint}</span> : null}
    </label>
  );
}

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  inputMode,
  hint,
  className,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: "text" | "search" | "number";
  inputMode?: "text" | "decimal" | "numeric";
  hint?: string;
  className?: string;
}) {
  const id = useId();
  return (
    <label className={cn("block", className)} htmlFor={id}>
      <span className="lab-form-label">{label}</span>
      <input
        id={id}
        type={type}
        inputMode={inputMode}
        className="lab-field"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
      {hint ? <span className="lab-form-hint">{hint}</span> : null}
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
    <div className="inline-flex border border-border-strong" role="group" aria-label={label}>
      {options.map((option, index) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={cn(
              "px-3 py-1.5 font-mono text-label font-medium uppercase tracking-[0.08em] transition-colors",
              index > 0 && "border-l border-border-strong",
              active ? "bg-accent text-bg" : "text-muted hover:bg-surface-2 hover:text-fg",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export function Interpretation({ children }: { children: ReactNode }) {
  return (
    <div className="lab-interpretation">
      <p className="lab-label">¿Cómo se interpreta?</p>
      <div>{children}</div>
    </div>
  );
}

export function Callout({
  title,
  tone = "info",
  icon: Icon,
  children,
}: {
  title?: string;
  tone?: "info" | "warning" | "success" | "danger";
  icon?: LucideIcon;
  children: ReactNode;
}) {
  return (
    <div className="lab-callout" data-tone={tone}>
      {title ? (
        <p className="lab-callout-title">
          {Icon ? <Icon aria-hidden="true" size={15} strokeWidth={1.9} /> : null}
          {title}
        </p>
      ) : null}
      <div className="lab-callout-body">{children}</div>
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
    <div className="lab-empty">
      <Icon aria-hidden="true" size={20} strokeWidth={1.7} />
      <strong className="font-display text-xl font-normal text-fg">{title}</strong>
      <p>{description}</p>
      {action}
    </div>
  );
}

export function ResetFiltersButton({ onClick }: { onClick: () => void }) {
  return (
    <Button icon={RotateCcw} onClick={onClick}>
      Limpiar filtros
    </Button>
  );
}

export function TableWrap({
  children,
  className,
  hint,
}: {
  children: ReactNode;
  className?: string;
  hint?: string;
}) {
  return (
    <div className="min-w-0">
      {hint ? <p className="lab-scroll-hint">{hint}</p> : null}
      <div className={cn("lab-table-wrap", className)}>{children}</div>
    </div>
  );
}

export function DataDetails({ children, label = "Ver datos" }: { children: ReactNode; label?: string }) {
  return (
    <details className="lab-details">
      <summary>{label}</summary>
      <div className="lab-details-content">{children}</div>
    </details>
  );
}

export function KeyValue({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-border py-2 last:border-0">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="text-right text-sm font-semibold text-fg">{value}</dd>
    </div>
  );
}

export function ProcedureTabs({
  section,
  active,
}: {
  section: string;
  active: string | null;
}) {
  const items = PROCEDURES[section];
  if (!items || items.length === 0) return null;
  return (
    <nav className="lab-procedures" aria-label="Procedimientos de la sección">
      {items.map((item) => (
        <a
          key={item.id}
          href={`#${section}/${item.id}`}
          className="lab-procedure-link"
          aria-current={active === item.id ? "page" : undefined}
        >
          {item.label}
        </a>
      ))}
    </nav>
  );
}

// Procedimientos inactivos: quedan montados y ocultos para conservar su estado
// y para que la impresión siga sacando el informe completo.
export function ViewNav({ active }: { active: string }) {
  const index = NAV_ITEMS.findIndex((item) => item.id === active);
  const prev = index > 0 ? NAV_ITEMS[index - 1] : undefined;
  const next = index >= 0 && index < NAV_ITEMS.length - 1 ? NAV_ITEMS[index + 1] : undefined;

  return (
    <nav className="lab-view-nav no-print" aria-label="Navegación entre secciones">
      {prev ? (
        <a className="lab-view-nav-link" href={`#${prev.id}`}>
          <ChevronLeft aria-hidden="true" size={14} />
          <span>
            <span className="lab-view-nav-num">{prev.number}</span> {prev.label}
          </span>
        </a>
      ) : (
        <span />
      )}
      {next ? (
        <a className="lab-view-nav-link lab-view-nav-next" href={`#${next.id}`}>
          <span>
            <span className="lab-view-nav-num">{next.number}</span> {next.label}
          </span>
          <ChevronRight aria-hidden="true" size={14} />
        </a>
      ) : (
        <span />
      )}
    </nav>
  );
}

