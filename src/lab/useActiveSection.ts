import { useEffect, useState } from "react";
import { NAV_ITEMS, PROCEDURES, firstProcedure } from "./navigation";

export interface ActiveLocation {
  section: string;
  procedure: string | null;
}

function locationFromHash(): ActiveLocation {
  const [rawSection = "", rawProcedure] = window.location.hash.replace(/^#/, "").split("/");
  const item = NAV_ITEMS.find((nav) => nav.id === rawSection);
  if (!item) return { section: NAV_ITEMS[0]?.id ?? "inicio", procedure: null };

  const allowed = PROCEDURES[item.id];
  const procedure =
    rawProcedure && allowed?.some((nav) => nav.id === rawProcedure) ? rawProcedure : null;
  return { section: item.id, procedure: procedure ?? firstProcedure(item.id) };
}

export function useActiveSection(): ActiveLocation {
  const [active, setActive] = useState<ActiveLocation>(locationFromHash);

  useEffect(() => {
    const update = () => setActive(locationFromHash());
    update();
    window.addEventListener("hashchange", update);
    return () => window.removeEventListener("hashchange", update);
  }, []);

  return active;
}
