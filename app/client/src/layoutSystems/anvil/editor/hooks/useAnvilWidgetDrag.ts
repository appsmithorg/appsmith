import type { WidgetType } from "WidgetProvider/factory";
import { generateDragStateForAnvilLayout } from "layoutSystems/anvil/utils/widgetUtils";
import { useCallback, useEffect } from "react";
import { useSelector } from "react-redux";
import { SelectionRequestType } from "sagas/WidgetSelectUtils";
import { getShouldAllowDrag } from "selectors/widgetDragSelectors";
import { isWidgetFocused, isWidgetSelected } from "selectors/widgetSelectors";
import { useWidgetDragResize } from "utils/hooks/dragResizeHooks";
import { useWidgetSelection } from "utils/hooks/useWidgetSelection";

export const useAnvilWidgetDrag = (
  widgetId: string,
  widgetType: WidgetType,
  layoutId: string,
  ref: React.RefObject<HTMLDivElement>, // Ref object to reference the AnvilFlexComponent
) => {
  // Retrieve state from the Redux store
  const isSelected = useSelector(isWidgetSelected(widgetId));
  const isFocused = useSelector(isWidgetFocused(widgetId));
  const shouldAllowDrag = useSelector(getShouldAllowDrag);
  const { selectWidget } = useWidgetSelection();
  const generateDragState = useCallback(() => {
    return generateDragStateForAnvilLayout({
      widgetType,
      layoutId,
    });
  }, [layoutId]);
  const { setDraggingState } = useWidgetDragResize();

  // Callback function for handling drag start events
  const onDragStart = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (shouldAllowDrag && ref.current && !(e.metaKey || e.ctrlKey)) {
        if (!isFocused) return;

        if (!isSelected) {
          // Select the widget if not already selected
          selectWidget(SelectionRequestType.One, [widgetId]);
        }

        // Generate and set the dragging state for the Anvil layout
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

  // Effect hook to add and remove drag start event listeners
  useEffect(() => {
    if (ref.current) {
      // Configure the draggable attribute and cursor style based on drag permission
      ref.current.draggable = shouldAllowDrag;
      ref.current.style.cursor = shouldAllowDrag ? "grab" : "default";

      // Add drag start event listener
      ref.current.addEventListener("dragstart", onDragStart);
    }

    // Clean up event listeners when the component unmounts
    return () => {
      if (ref.current) {
        ref.current.removeEventListener("dragstart", onDragStart);
      }
    };
  }, [onDragStart, shouldAllowDrag]);
};
