import { useEffect, useState } from "react";
import { NAV_ITEMS } from "./navigation";

export function useActiveSection(): string {
  const [active, setActive] = useState(NAV_ITEMS[0]?.id ?? "inicio");

  useEffect(() => {
    const update = () => {
      const offset = window.scrollY + 150;
      let current = NAV_ITEMS[0]?.id ?? "inicio";
      for (const item of NAV_ITEMS) {
        const element = document.getElementById(item.id);
        if (element && element.getBoundingClientRect().top + window.scrollY <= offset) {
          current = item.id;
        }
      }
      setActive(current);
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return active;
}
