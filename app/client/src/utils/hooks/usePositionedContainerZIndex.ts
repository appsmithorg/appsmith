import { PositionedContainerProps } from "components/designSystems/appsmith/PositionedContainer";
import { Layers } from "constants/Layers";

import { useMemo } from "react";
import { AppState } from "@appsmith/reducers";
import { isWidgetSelected } from "selectors/widgetSelectors";
import { useSelector } from "store";

export const usePositionedContainerZIndex = (
  props: PositionedContainerProps,
  droppableWidget: boolean,
) => {
  const isDragging = useSelector(
    (state: AppState) => state.ui.widgetDragResize.isDragging,
  );
  const isSelected = useSelector(isWidgetSelected(props.widgetId));
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

      return props.focused
        ? Layers.focusedWidget
        : props.selected
        ? Layers.selectedWidget
        : Layers.positionedWidget;
    }
  }, [
    isDragging,
    isThisWidgetDragging,
    droppableWidget,
    props.selected,
    props.focused,
  ]);

  const zIndicesObj = useMemo(() => {
    const onHoverZIndex = isDragging ? zIndex : Layers.positionedWidget + 1;
    return { zIndex, onHoverZIndex };
  }, [isDragging, zIndex, Layers.positionedWidget]);

  return zIndicesObj;
};
