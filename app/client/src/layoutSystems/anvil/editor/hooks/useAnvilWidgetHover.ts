import { getAnvilSpaceDistributionStatus } from "layoutSystems/anvil/integrations/selectors";
import { useCallback, useEffect } from "react";
import { useSelector } from "react-redux";
import { combinedPreviewModeSelector } from "selectors/editorSelectors";
import { isCurrentWidgetFocused } from "selectors/widgetSelectors";
import { useWidgetSelection } from "utils/hooks/useWidgetSelection";

export const useAnvilWidgetHover = (
  widgetId: string,
  ref: React.RefObject<HTMLDivElement>, // Ref object to reference the AnvilFlexComponent
) => {
  // Retrieve state from the Redux store
  const isFocused = useSelector(isCurrentWidgetFocused(widgetId));
  const isPreviewMode = useSelector(combinedPreviewModeSelector);
  const isDistributingSpace = useSelector(getAnvilSpaceDistributionStatus);

  // Access the focusWidget function from the useWidgetSelection hook
  const { focusWidget } = useWidgetSelection();

  // Callback function for handling mouseover events
  const handleMouseOver = useCallback(
    (e: any) => {
      // Check conditions before focusing the widget on mouseover
      focusWidget &&
        !isFocused &&
        !isDistributingSpace &&
        !isPreviewMode &&
        focusWidget(widgetId);

      // Prevent the event from propagating further
      e.stopPropagation();
    },
    [focusWidget, isFocused, isDistributingSpace, isPreviewMode, widgetId],
  );

  // Callback function for handling mouseleave events
  const handleMouseLeave = useCallback(() => {
    // On leaving a widget, reset the focused widget
    focusWidget && focusWidget();
  }, [focusWidget]);

  // Effect hook to add and remove mouseover and mouseleave event listeners
  useEffect(() => {
    if (ref.current) {
      // Add mouseover and mouseleave event listeners
      ref.current.addEventListener("mouseover", handleMouseOver);
      ref.current.addEventListener("mouseleave", handleMouseLeave);
    }

    // Clean up event listeners when the component unmounts
    return () => {
      if (ref.current) {
        ref.current.removeEventListener("mouseover", handleMouseOver);
        ref.current.removeEventListener("mouseleave", handleMouseLeave);
      }
    };
  }, [handleMouseOver, handleMouseLeave]);
};
