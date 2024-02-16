import type { MouseEvent } from "react";
import type { AppState } from "@appsmith/reducers";
import { useSelector } from "react-redux";
import { useShowPropertyPane } from "utils/hooks/dragResizeHooks";
import { useWidgetSelection } from "utils/hooks/useWidgetSelection";
import { getAnvilSpaceDistributionStatus } from "../integrations/selectors";
import { AnvilCanvasClassName } from "widgets/anvil/constants";

/**
 * Custom hook to handle click events for clearing widget selections.
 * @param {string} widgetId - ID of the widget associated with the click event.
 * @returns {Function} - Click event handler function.
 */
export const useClickToClearSelections = (widgetId: string) => {
  const { focusWidget, goToWidgetAdd } = useWidgetSelection();

  // Function to show the property pane
  const showPropertyPane = useShowPropertyPane();

  const isDragging = useSelector(
    (state: AppState) => state.ui.widgetDragResize.isDragging,
  );
  const isCanvasResizing: boolean = useSelector(
    (state: AppState) => state.ui.widgetDragResize.isAutoCanvasResizing,
  );
  const isDistributingSpace: boolean = useSelector(
    getAnvilSpaceDistributionStatus,
  );

  // Click event handler function
  return (e: MouseEvent<HTMLElement>) => {
    // This feature is only relevant in the Anvil canvas
    const isTargetMainCanvas = (e.target as HTMLElement)?.classList.contains(
      AnvilCanvasClassName,
    );

    // Checking if there is no ongoing dragging, canvas resizing, or space distribution
    if (!(isDragging || isCanvasResizing || isDistributingSpace)) {
      // Check if the target is the MainCanvas
      if (isTargetMainCanvas) {
        // Deselect all widgets, focus on the clicked widget, show the property pane, and prevent the default click behavior
        goToWidgetAdd();
        focusWidget && focusWidget(widgetId);
        showPropertyPane && showPropertyPane();
        e.preventDefault();
      } else {
        // Prevent onClick from bubbling out of the canvas to the WidgetEditor for any other widget except the MainCanvas
        e.stopPropagation();
      }
    }
  };
};
