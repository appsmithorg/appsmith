import { useCallback, useRef } from "react";

export default function useGetSet<T>(
  initialValue: T,
): [() => T, (value: ((current: T) => T) | T) => T] {
  const ref = useRef(initialValue);
  const get = useCallback(() => ref.current, []);
  const set = useCallback((value: ((current: T) => T) | T) => {
    if (typeof value === "function") {
      ref.current = (value as (current: T) => T)(ref.current);
    } else {
      ref.current = value;
    }
    return ref.current;
  }, []);

  return [get, set];
}
