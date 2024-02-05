import { SELECT_ANVIL_WIDGET_CUSTOM_EVENT } from "layoutSystems/anvil/utils/constants";
import { useCallback, useEffect } from "react";
import { useSelector } from "react-redux";
import { snipingModeSelector } from "selectors/editorSelectors";
import { isCurrentWidgetFocused } from "selectors/widgetSelectors";

export const useAnvilWidgetClick = (
  widgetId: string,
  ref: React.RefObject<HTMLDivElement>, // Ref object to reference the AnvilFlexComponent
) => {
  // Retrieve state from the Redux store
  const isFocused = useSelector(isCurrentWidgetFocused(widgetId));
  const isSnipingMode = useSelector(snipingModeSelector);

  // Function to stop event propagation if not in sniping mode
  // Note: Sniping mode is irrelevant to the Anvil however it becomes relevant if we decide to make Anvil the default editor
  const stopEventPropagation = (e: MouseEvent) => {
    !isSnipingMode && e.stopPropagation();
  };

  // Callback function for handling click events on AnvilFlexComponent in Edit mode
  const onClickFn = useCallback(
    function () {
      // Dispatch a custom event when the Anvil widget is clicked and focused
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

  // Effect hook to add and remove click event listeners
  useEffect(() => {
    if (ref.current) {
      // Add click event listener to select the Anvil widget
      ref.current.addEventListener("click", onClickFn, { capture: true });

      // Add click event listener to stop event propagation in certain modes
      ref.current.addEventListener("click", stopEventPropagation, {
        capture: false,
      });
    }

    // Clean up event listeners when the component unmounts
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
