import type { MouseEvent } from "react";
import type { DefaultRootState } from "react-redux";
import { useSelector } from "react-redux";
import { useShowPropertyPane } from "utils/hooks/dragResizeHooks";
import { useWidgetSelection } from "utils/hooks/useWidgetSelection";
import { getAnvilSpaceDistributionStatus } from "layoutSystems/anvil/integrations/selectors";
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
    (state: DefaultRootState) => state.ui.widgetDragResize.isDragging,
  );
  const isCanvasResizing: boolean = useSelector(
    (state: DefaultRootState) => state.ui.widgetDragResize.isAutoCanvasResizing,
  );
  const isDistributingSpace: boolean = useSelector(
    getAnvilSpaceDistributionStatus,
  );

  // Click event handler function
  return (e: MouseEvent<HTMLElement>) => {
    // Checking if there is no ongoing dragging, canvas resizing, or space distribution
    if (!(isDragging || isCanvasResizing || isDistributingSpace)) {
      // Check if the target is the MainCanvas
      // Deselect all widgets, focus on the clicked widget, show the property pane, and prevent the default click behavior
      goToWidgetAdd();
      focusWidget && focusWidget(widgetId);
      showPropertyPane && showPropertyPane();
      e.preventDefault();
    }
  };
};
