import { useEffect, useState } from "react";
import { NAV_ITEMS } from "./navigation";

function viewFromHash(): string {
  const id = window.location.hash.replace(/^#/, "");
  return NAV_ITEMS.some((item) => item.id === id) ? id : (NAV_ITEMS[0]?.id ?? "inicio");
}

export function useActiveSection(): string {
  const [active, setActive] = useState(viewFromHash);

  useEffect(() => {
    const update = () => setActive(viewFromHash());
    update();
    window.addEventListener("hashchange", update);
    return () => window.removeEventListener("hashchange", update);
  }, []);

  return active;
}