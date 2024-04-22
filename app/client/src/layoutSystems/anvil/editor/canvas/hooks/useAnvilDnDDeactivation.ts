import { useEffect } from "react";
import { useWidgetDragResize } from "utils/hooks/dragResizeHooks";
import { useSelector } from "react-redux";
import { getDragDetails } from "sagas/selectors";
import type { DragDetails } from "reducers/uiReducers/dragResizeReducer";
import type { AppState } from "@appsmith/reducers";

/**
 * This hook handles the activation and deactivation of the canvas(Drop targets) while dragging.
 */

export const useAnvilDnDDeactivation = () => {
  const dragDetails: DragDetails = useSelector(getDragDetails);
  const isDragging = useSelector(
    (state: AppState) => state.ui.widgetDragResize.isDragging,
  );

  const { dragGroupActualParent: dragParent, newWidget } = dragDetails;
  /**
   * boolean to indicate if the widget being dragged is a new widget
   */
  const isNewWidget = !!newWidget && !dragParent;
  // Destructuring hook functions for drag and resize functionality
  const { setDraggingNewWidget, setDraggingState } = useWidgetDragResize();

  // Callback function to handle mouse up events and reset dragging state
  const onMouseUp = () => {
    if (isDragging) {
      if (isNewWidget) {
        setDraggingNewWidget(false, undefined);
      } else {
        setDraggingState({
          isDragging: false,
        });
      }
    }
  };

  useEffect(() => {
    if (isDragging) {
      // Adding event listeners for mouse move and mouse up events
      document.body.addEventListener("mouseup", onMouseUp, false);
      window.addEventListener("mouseup", onMouseUp, false);

      // Removing event listeners when the component unmounts or when dragging ends
      return () => {
        document.body.removeEventListener("mouseup", onMouseUp);
        window.removeEventListener("mouseup", onMouseUp);
      };
    }
  }, [isDragging, onMouseUp]);
};
