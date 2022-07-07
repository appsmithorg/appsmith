import {
  MutableRefObject,
  RefObject,
  useCallback,
  useRef,
  useState,
} from "react";

/**
 * There are certain situations where a ref might be set after the current render cycle for a
 * component has finished.  e.g. a forward ref from a conditionally rendered child component.
 * In these situations, we need to force a re-render, which is done here by the useState hook.
 * @type TRef The type of the RefObject which should be created.
 */
export function useRenderForcingRef<TRef>(value?: TRef) {
  const [refCurrent, setRefCurrent] = useState<TRef | null>(value || null);
  const ref = useRef<TRef>(null) as MutableRefObject<TRef | null>;
  ref.current = refCurrent;

  const setRef = useCallback(
    (newRef: TRef | null) => {
      ref.current = newRef;
      setRefCurrent(newRef);
    },
    [ref],
  );
  return [ref as RefObject<TRef>, setRef] as const;
}
