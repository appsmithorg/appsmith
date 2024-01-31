import { useSelector } from "react-redux";
import {
  isCurrentWidgetFocused,
  isWidgetSelected,
} from "selectors/widgetSelectors";
import { checkIsDropTarget } from "WidgetProvider/factory/helpers";
import { usePositionedContainerZIndex } from "utils/hooks/usePositionedContainerZIndex";

export const useAnvilFlexZIndex = (widgetId: string, widgetType: string) => {
  // Retrieve state from the Redux store
  const isFocused = useSelector(isCurrentWidgetFocused(widgetId));
  const isSelected = useSelector(isWidgetSelected(widgetId));

  // Check if the widget is a drop target based on its type
  const isDropTarget = checkIsDropTarget(widgetType);

  // Use another custom hook to calculate the z-index based on various factors
  const { onHoverZIndex } = usePositionedContainerZIndex(
    isDropTarget,
    widgetId,
    isFocused,
    isSelected,
  );

  // Return the calculated z-index value
  return onHoverZIndex;
};
