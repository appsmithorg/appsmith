import type { SetDraggingStateActionPayload } from "utils/hooks/dragResizeHooks";
import type { BaseWidgetProps } from "widgets/BaseWidgetHOC/withBaseWidgetHOC";

export const generateDragStateForFixedLayout = (
  e: React.DragEvent<Element>,
  draggableRef: HTMLElement,
  {
    bottomRow,
    leftColumn,
    parentColumnSpace,
    parentId,
    parentRowSpace,
    rightColumn,
    topRow,
    widgetId,
  }: Omit<BaseWidgetProps, "widgetName" | "type" | "isLoading" | "version">,
): SetDraggingStateActionPayload => {
  const widgetHeight = bottomRow - topRow;
  const widgetWidth = rightColumn - leftColumn;
  const bounds = draggableRef.getBoundingClientRect();
  const startPoints = {
    top: Math.min(
      Math.max((e.clientY - bounds.top) / parentRowSpace, 0),
      widgetHeight - 1,
    ),
    left: Math.min(
      Math.max((e.clientX - bounds.left) / parentColumnSpace, 0),
      widgetWidth - 1,
    ),
  };

  return {
    isDragging: true,
    dragGroupActualParent: parentId || "",
    draggingGroupCenter: { widgetId: widgetId },
    startPoints,
    draggedOn: parentId,
  };
};
