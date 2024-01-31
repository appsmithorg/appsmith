import { usePositionedContainerZIndex } from "utils/hooks/usePositionedContainerZIndex";
import { checkIsDropTarget } from "WidgetProvider/factory/helpers";
import { useSelector } from "react-redux";
import {
  isCurrentWidgetFocused,
  isWidgetSelected,
} from "selectors/widgetSelectors";

export const useAnvilFlexZIndex = (widgetId: string, widgetType: string) => {
  const isFocused = useSelector(isCurrentWidgetFocused(widgetId));
  const isSelected = useSelector(isWidgetSelected(widgetId));
  const isDropTarget = checkIsDropTarget(widgetType);
  const { onHoverZIndex } = usePositionedContainerZIndex(
    isDropTarget,
    widgetId,
    isFocused,
    isSelected,
  );
  return onHoverZIndex;
};
