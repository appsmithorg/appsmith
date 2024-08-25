import type { AppState } from "ee/reducers";
import { getAnvilSpaceDistributionStatus } from "layoutSystems/anvil/integrations/selectors";
import { useCallback, useEffect } from "react";
import { useSelector } from "react-redux";
import { combinedPreviewModeSelector } from "selectors/editorSelectors";
import { isWidgetFocused } from "selectors/widgetSelectors";
import { useWidgetSelection } from "utils/hooks/useWidgetSelection";

export const useAnvilWidgetHover = (
  widgetId: string,
  ref: React.RefObject<HTMLDivElement>, // Ref object to reference the AnvilFlexComponent
) => {
  // Retrieve state from the Redux store
  const isFocused = useSelector(isWidgetFocused(widgetId));
  const isPreviewMode = useSelector(combinedPreviewModeSelector);
  const isDistributingSpace = useSelector(getAnvilSpaceDistributionStatus);
  const isDragging = useSelector(
    (state: AppState) => state.ui.widgetDragResize.isDragging,
  );
  // Access the focusWidget function from the useWidgetSelection hook
  const { focusWidget } = useWidgetSelection();

  // Callback function for handling mouseover events
  const handleMouseOver = useCallback(
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (e: any) => {
      // Check conditions before focusing the widget on mouseover
      focusWidget &&
        !isFocused &&
        !isDistributingSpace &&
        !isDragging &&
        !isPreviewMode &&
        focusWidget(widgetId);

      // Prevent the event from propagating further
      e.stopPropagation();
    },
    [
      focusWidget,
      isFocused,
      isDistributingSpace,
      isPreviewMode,
      widgetId,
      isDragging,
    ],
  );

  // Effect hook to add and remove mouseover and mouseleave event listeners
  useEffect(() => {
    if (ref.current) {
      // Add mouseover and mouseleave event listeners
      ref.current.addEventListener("mouseover", handleMouseOver);
    }

    // Clean up event listeners when the component unmounts
    return () => {
      if (ref.current) {
        ref.current.removeEventListener("mouseover", handleMouseOver);
      }
    };
  }, [handleMouseOver]);
};
