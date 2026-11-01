import type { ReactNode } from "react";

export interface SceneProps {
  onNext: () => void;
  onRestart?: () => void;
  onOpenData?: () => void;
}

export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export function SceneFrame({
  kicker,
  title,
  insight,
  children,
  titleClassName,
  className,
  footer,
}: {
  kicker: string;
  title: string;
  insight?: string;
  children: ReactNode;
  titleClassName?: string;
  className?: string;
  footer?: ReactNode;
}) {
  return (
    <div className={cn("deck-scene", className)}>
      <header className="shrink-0">
        <p className="deck-kicker">{kicker}</p>
        <h2 className={cn("deck-title", titleClassName)}>{title}</h2>
        {insight ? <p className="deck-insight">{insight}</p> : null}
      </header>
      <div className="mt-6 flex min-h-0 flex-1 flex-col">{children}</div>
      {footer ? <div className="mt-4 shrink-0">{footer}</div> : null}
    </div>
  );
}
