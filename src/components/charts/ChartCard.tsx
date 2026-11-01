import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Info } from "lucide-react";
import { DataDetails, cn } from "../ui";

export function ChartCard({
  title,
  subtitle,
  icon: Icon,
  interpretation,
  table,
  tableLabel = "Ver datos",
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  interpretation: ReactNode;
  table?: ReactNode;
  tableLabel?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("chart-card card p-4 sm:p-5", className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-base font-semibold leading-snug text-fg">{title}</h3>
          {subtitle ? <p className="mt-1 text-xs leading-relaxed text-muted">{subtitle}</p> : null}
        </div>
        {Icon ? (
          <span className="rounded-lg border border-border bg-surface-2 p-2 text-muted">
            <Icon aria-hidden="true" size={17} strokeWidth={1.8} />
          </span>
        ) : null}
      </div>

      <div className="mt-4 h-72 w-full sm:h-80">{children}</div>

      <div className="mt-4 flex items-start gap-2 border-t border-border pt-3">
        <Info aria-hidden="true" size={14} strokeWidth={2} className="mt-0.5 shrink-0 text-accent" />
        <p className="text-xs leading-relaxed text-muted">{interpretation}</p>
      </div>

      {table ? <DataDetails label={tableLabel}>{table}</DataDetails> : null}
    </div>
  );
}
