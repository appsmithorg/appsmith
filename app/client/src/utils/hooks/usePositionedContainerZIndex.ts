import { Layers } from "constants/Layers";

import { useMemo } from "react";
import type { AppState } from "ee/reducers";
import { isWidgetSelected } from "selectors/widgetSelectors";
import { useSelector } from "react-redux";

export const usePositionedContainerZIndex = (
  droppableWidget: boolean,
  widgetId: string,
  focused?: boolean,
  selected?: boolean,
) => {
  const isDragging = useSelector(
    (state: AppState) => state.ui.widgetDragResize.isDragging,
  );
  const isSelected = useSelector(isWidgetSelected(widgetId));
  const isThisWidgetDragging = isDragging && isSelected;

  const zIndex = useMemo(() => {
    if (isDragging) {
      // dragging mode use cases
      if (!isThisWidgetDragging && droppableWidget) {
        return Layers.positionedWidget + 1;
      } else {
        // all non container widgets should go last into the background to not interfere with mouse move
        // since it is not technically dragged but just drawn on canvas as  the mouse moves.
        return -1;
      }
    } else {
      // common use case when nothing is dragged

      return focused
        ? Layers.focusedWidget
        : selected
          ? Layers.selectedWidget
          : Layers.positionedWidget;
    }
  }, [isDragging, isThisWidgetDragging, droppableWidget, selected, focused]);

  const zIndicesObj = useMemo(() => {
    const onHoverZIndex = isDragging ? zIndex : Layers.positionedWidget + 1;

    return { zIndex, onHoverZIndex };
  }, [isDragging, zIndex, Layers.positionedWidget]);

  return zIndicesObj;
};
