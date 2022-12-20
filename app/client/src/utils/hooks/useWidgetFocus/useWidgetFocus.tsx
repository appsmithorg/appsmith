import { MouseEvent, useCallback, useEffect, useRef } from "react";

import { scopeTab } from "./scopeTab";
import { CANVAS_WIDGET } from "./tabbable";

function useWidgetFocus(): (instance: HTMLElement | null) => void {
  const ref = useRef<HTMLElement | null>();

  // This is a callback that will be called when the ref is set
  const setRef = useCallback((node: HTMLElement | null) => {
    if (node === null) return;

    if (ref.current === node) return;

    if (node) {
      ref.current = node;
    } else {
      ref.current = null;
    }
  }, []);

  useEffect(() => {
    if (!ref.current) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Tab") scopeTab(event);
    };

    ref.current.addEventListener("keydown", handleKeyDown);

    // focus the current element on click inside the widget
    if (ref.current) {
      ref.current.addEventListener("click", (event: any) => {
        const target = event.target as HTMLElement;
        if (target.matches(CANVAS_WIDGET)) {
          target.focus();
        }
      });
    }

    return () => {
      ref?.current && ref.current.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return setRef;
}

export default useWidgetFocus;
