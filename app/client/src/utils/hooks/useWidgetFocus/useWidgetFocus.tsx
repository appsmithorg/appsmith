import { useCallback, useRef } from "react";
import { useSelector } from "react-redux";

import { getIsAutoLayout } from "selectors/canvasSelectors";
import { handleTab } from "./handleTab";
import { CANVAS_WIDGET } from "./tabbable";

function useWidgetFocus(): (instance: HTMLElement | null) => void {
  const ref = useRef<HTMLElement | null>();
  const isAutoLayout = useSelector(getIsAutoLayout);

  const attachEventListeners = useCallback(
    (element: HTMLElement) => {
      if (isAutoLayout) {
        return () => {}; // Return empty cleanup function
      }

      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === "Tab") {
          handleTab(event);
        }
      };

      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const handleClick = (event: any) => {
        const target = event.target as HTMLElement;

        if (target.matches(CANVAS_WIDGET)) {
          target.focus();
        }
      };

      element.addEventListener("keydown", handleKeyDown);
      element.addEventListener("click", handleClick);

      // Return cleanup function
      return () => {
        element.removeEventListener("keydown", handleKeyDown);
        element.removeEventListener("click", handleClick);
      };
    },
    [isAutoLayout],
  );

  // This is a callback that will be called when the ref is set
  const setRef = useCallback(
    (node: HTMLElement | null) => {
      if (node === null) {
        ref.current = null;

        return;
      }

      if (ref.current === node) {
        return;
      }

      ref.current = node;

      // Attach event listeners immediately when ref is set
      attachEventListeners(node);

      return ref;
    },
    [attachEventListeners],
  );

  return setRef;
}

export default useWidgetFocus;
