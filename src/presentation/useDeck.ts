import { useCallback, useState } from "react";

export function useDeck(sceneCount: number) {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);

  const goTo = useCallback(
    (nextIndex: number) => {
      const clamped = Math.max(0, Math.min(sceneCount - 1, nextIndex));
      setDirection(clamped >= index ? 1 : -1);
      setIndex(clamped);
    },
    [index, sceneCount],
  );

  const next = useCallback(() => {
    setDirection(1);
    setIndex((current) => Math.min(sceneCount - 1, current + 1));
  }, [sceneCount]);

  const prev = useCallback(() => {
    setDirection(-1);
    setIndex((current) => Math.max(0, current - 1));
  }, []);

  return { index, direction, goTo, next, prev };
}
