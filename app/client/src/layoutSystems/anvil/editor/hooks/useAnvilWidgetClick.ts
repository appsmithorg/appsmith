import { SELECT_ANVIL_WIDGET_CUSTOM_EVENT } from "layoutSystems/anvil/utils/constants";
import { useCallback, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { snipingModeSelector } from "selectors/editorSelectors";
import { isWidgetFocused } from "selectors/widgetSelectors";

export const useAnvilWidgetClick = (
  widgetId: string,
  ref: React.RefObject<HTMLDivElement>, // Ref object to reference the AnvilFlexComponent
) => {
  // Retrieve state from the Redux store
  const isFocused = useSelector(isWidgetFocused(widgetId));
  const isSnipingMode = useSelector(snipingModeSelector);
  const allowSelectionRef = useRef(false);

  useEffect(() => {
    allowSelectionRef.current = isFocused;
  }, [isFocused]);
  // Function to stop event propagation if not in sniping mode
  // Note: Sniping mode is irrelevant to the Anvil however it becomes relevant if we decide to make Anvil the default editor
  const onClickFn = useCallback(
    (e: MouseEvent) => {
      !isSnipingMode && e.stopPropagation();
    },
    [isSnipingMode],
  );

  // Callback function for handling click events on AnvilFlexComponent in Edit mode
  const onClickCaptureFn: React.MouseEventHandler = useCallback(
    function (e) {
      // Dispatch a custom event when the Anvil widget is clicked and focused
      if (ref.current && allowSelectionRef.current) {
        ref.current.dispatchEvent(
          new CustomEvent(SELECT_ANVIL_WIDGET_CUSTOM_EVENT, {
            bubbles: true,
            cancelable: true,
            detail: {
              widgetId,
              metaKey: e.metaKey,
              ctrlKey: e.ctrlKey,
              shiftKey: e.shiftKey,
            },
          }),
        );
      }
    },
    [widgetId],
  );

  return {
    onClickFn,
    onClickCaptureFn,
  };
};
