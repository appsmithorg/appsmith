import { useSelector } from "react-redux";
import { useCallback, useEffect, useRef } from "react";

import { handleTab } from "./handleTab";
import { CANVAS_WIDGET } from "./tabbable";
import { getIsAutoLayout } from "selectors/canvasSelectors";

function useWidgetFocus(): (instance: HTMLElement | null) => void {
  const ref = useRef<HTMLElement | null>();
  const isAutoLayout = useSelector(getIsAutoLayout);

  // This is a callback that will be called when the ref is set
  const setRef = useCallback((node: HTMLElement | null) => {
    if (node === null) return;

    if (ref.current === node) return;

    ref.current = node;

    return ref;
  }, []);

  useEffect(() => {
    if (isAutoLayout) return;

    if (!ref.current) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Tab") handleTab(event);
    };

    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleClick = (event: any) => {
      const target = event.target as HTMLElement;

      if (target.matches(CANVAS_WIDGET)) {
        target.focus();
      }
    };

    ref.current.addEventListener("keydown", handleKeyDown);
    ref.current.addEventListener("click", handleClick);

    return () => {
      ref?.current && ref.current.removeEventListener("keydown", handleKeyDown);
      ref?.current && ref.current.removeEventListener("click", handleClick);
    };
  }, []);

  return setRef;
}

export default useWidgetFocus;
