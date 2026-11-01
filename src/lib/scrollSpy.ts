import { useEffect, useState } from "react";

export function useActiveSection(sectionIds: readonly string[]): string {
  const [active, setActive] = useState(sectionIds[0] ?? "");

  useEffect(() => {
    let frame = 0;

    const update = () => {
      frame = 0;
      const marker = window.scrollY + Math.min(window.innerHeight * 0.3, 220);
      let current = sectionIds[0] ?? "";

      for (const id of sectionIds) {
        const element = document.getElementById(id);
        if (!element) continue;
        const top = element.getBoundingClientRect().top + window.scrollY;
        if (top <= marker) current = id;
      }

      setActive(current);
    };

    const schedule = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [sectionIds]);

  return active;
}
