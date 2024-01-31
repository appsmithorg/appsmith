import { generateDragStateForAnvilLayout } from "layoutSystems/anvil/utils/widgetUtils";
import { useCallback, useEffect } from "react";
import { useSelector } from "react-redux";
import { SelectionRequestType } from "sagas/WidgetSelectUtils";
import { getShouldAllowDrag } from "selectors/widgetDragSelectors";
import {
  isCurrentWidgetFocused,
  isWidgetSelected,
} from "selectors/widgetSelectors";
import { useWidgetDragResize } from "utils/hooks/dragResizeHooks";
import { useWidgetSelection } from "utils/hooks/useWidgetSelection";

export const useAnvilFlexDrag = (
  widgetId: string,
  layoutId: string,
  ref: React.RefObject<HTMLDivElement>,
) => {
  const isSelected = useSelector(isWidgetSelected(widgetId));
  const isFocused = useSelector(isCurrentWidgetFocused(widgetId));
  const shouldAllowDrag = useSelector(getShouldAllowDrag);
  const { selectWidget } = useWidgetSelection();
  const generateDragState = useCallback(() => {
    return generateDragStateForAnvilLayout({
      layoutId,
    });
  }, [layoutId]);
  const { setDraggingState } = useWidgetDragResize();
  const onDragStart = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (shouldAllowDrag && ref.current && !(e.metaKey || e.ctrlKey)) {
        if (!isFocused) return;

        if (!isSelected) {
          selectWidget(SelectionRequestType.One, [widgetId]);
        }
        const draggingState = generateDragState();
        setDraggingState(draggingState);
      }
    },
    [
      shouldAllowDrag,
      isFocused,
      isSelected,
      selectWidget,
      widgetId,
      generateDragState,
      setDraggingState,
    ],
  );
  useEffect(() => {
    if (ref.current) {
      ref.current.draggable = shouldAllowDrag;
      ref.current.style.cursor = shouldAllowDrag ? "grab" : "default";
      ref.current.addEventListener("dragstart", onDragStart);
    }
    return () => {
      if (ref.current) {
        ref.current.removeEventListener("dragstart", onDragStart);
      }
    };
  }, [onDragStart, shouldAllowDrag]);
};
