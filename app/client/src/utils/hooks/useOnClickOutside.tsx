import { useEffect, RefObject } from "react";

type Event = MouseEvent | TouchEvent;

export const useOnClickOutside = <T extends HTMLElement = HTMLElement>(
  refs: RefObject<T>[],
  handler: (event: Event) => void,
) => {
  useEffect(() => {
    const listener = (event: Event) => {
      for (const ref of refs) {
        const el = ref?.current;
        if (!el || el.contains((event?.target as Node) || null)) {
          return;
        }
      }

      handler(event); // Call the handler only if the click is outside of the element passed.
    };

    document.body.addEventListener("mousedown", listener);
    document.body.addEventListener("touchstart", listener);

    return () => {
      document.body.removeEventListener("mousedown", listener);
      document.body.removeEventListener("touchstart", listener);
    };
  }, [refs.length, handler]); // Reload only if ref or handler changes
};
