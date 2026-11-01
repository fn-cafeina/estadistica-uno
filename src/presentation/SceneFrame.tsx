import type { ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";

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
  title: ReactNode;
  insight?: string;
  children: ReactNode;
  titleClassName?: string;
  className?: string;
  footer?: ReactNode;
}) {
  const reduced = useReducedMotion() ?? false;

  return (
    <div className={cn("deck-scene", className)}>
      <header className="shrink-0">
        <motion.p
          className="deck-kicker"
          initial={reduced ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduced ? 0 : 0.32 }}
        >
          <span aria-hidden="true" className="text-accent-2">§</span>
          {kicker}
        </motion.p>
        <motion.div
          className="mt-2 h-px origin-left bg-border-strong"
          initial={reduced ? false : { scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: reduced ? 0 : 0.6, delay: reduced ? 0 : 0.03 }}
        />
        <motion.h2
          className={cn("deck-title", titleClassName)}
          initial={reduced ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduced ? 0 : 0.46, delay: reduced ? 0 : 0.04 }}
        >
          {title}
        </motion.h2>
        {insight ? (
          <motion.p
            className="deck-insight"
            initial={reduced ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduced ? 0 : 0.42, delay: reduced ? 0 : 0.11 }}
          >
            {insight}
          </motion.p>
        ) : null}
      </header>
      <div className="deck-scene-body mt-5 flex min-h-0 flex-1 flex-col">{children}</div>
      {footer ? <div className="deck-scene-footer mt-4 shrink-0">{footer}</div> : null}
    </div>
  );
}
