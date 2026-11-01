import { useEffect } from "react";
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import { formatNumber } from "../../lib/format";

export function AnimatedNumber({
  value,
  digits = 1,
  prefix = "",
  suffix = "",
  duration = 0.8,
  className,
}: {
  value: number | null | undefined;
  digits?: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  className?: string;
}) {
  const reduced = useReducedMotion() ?? false;
  const motionValue = useMotionValue(0);
  const text = useTransform(motionValue, (latest) => {
    if (value === null || value === undefined || !Number.isFinite(value)) return "s/d";
    return `${prefix}${formatNumber(latest, digits)}${suffix}`;
  });

  useEffect(() => {
    if (value === null || value === undefined || !Number.isFinite(value)) {
      motionValue.set(0);
      return;
    }
    if (reduced) {
      motionValue.set(value);
      return;
    }
    const controls = animate(motionValue, value, {
      duration,
      ease: [0.22, 1, 0.36, 1],
    });
    return () => controls.stop();
  }, [duration, motionValue, reduced, value]);

  return <motion.span className={className}>{text}</motion.span>;
}
