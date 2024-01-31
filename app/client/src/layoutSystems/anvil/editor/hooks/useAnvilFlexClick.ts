import { SELECT_ANVIL_WIDGET_CUSTOM_EVENT } from "layoutSystems/anvil/utils/constants";
import { useCallback, useEffect } from "react";
import { useSelector } from "react-redux";
import { snipingModeSelector } from "selectors/editorSelectors";
import { isCurrentWidgetFocused } from "selectors/widgetSelectors";

export const useAnvilFlexClick = (
  widgetId: string,
  ref: React.RefObject<HTMLDivElement>,
) => {
  const isFocused = useSelector(isCurrentWidgetFocused(widgetId));
  const isSnipingMode = useSelector(snipingModeSelector);
  const stopEventPropagation = (e: MouseEvent) => {
    !isSnipingMode && e.stopPropagation();
  };
  const onClickFn = useCallback(
    function () {
      if (ref.current && isFocused) {
        ref.current.dispatchEvent(
          new CustomEvent(SELECT_ANVIL_WIDGET_CUSTOM_EVENT, {
            bubbles: true,
            cancelable: true,
            detail: { widgetId: widgetId },
          }),
        );
      }
    },
    [widgetId, isFocused],
  );

  useEffect(() => {
    if (ref.current) {
      ref.current.addEventListener("click", onClickFn, { capture: true });
      ref.current.addEventListener("click", stopEventPropagation, {
        capture: false,
      });
    }
    return () => {
      if (ref.current) {
        ref.current.removeEventListener("click", onClickFn, { capture: true });
        ref.current.removeEventListener("click", stopEventPropagation, {
          capture: false,
        });
      }
    };
  }, [onClickFn, stopEventPropagation]);
};
