import { useRef, useEffect } from "react";

/**
 * Returns value from the previous render.
 */
export function usePrevious<T>(value: T) {
  const ref = useRef<T>(value);

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}
