import type { AppState } from "@appsmith/reducers";
import { LayoutComponentTypes, type LayoutProps } from "../utils/anvilTypes";

// ToDo: This is a placeholder implementation this is bound to change
export function getDropTargetLayoutId(state: AppState, canvasId: string) {
  const layout: LayoutProps[] = state.entities.canvasWidgets[canvasId].layout;
  return layout[0].layoutId;
}

/**
 * Returns a boolean indicating if space distribution is in progress
 */
export function getAnvilSpaceDistributionStatus(state: AppState) {
  return state.ui.widgetDragResize.anvil.isDistributingSpace;
}

/**
 * Returns the highlight info for the current drag
 */
export function getAnvilHighlightShown(state: AppState) {
  return state.ui.widgetDragResize.anvil.highlightShown;
}
const layoutTypesWithWidgets = [
  LayoutComponentTypes.ALIGNED_WIDGET_COLUMN,
  LayoutComponentTypes.ALIGNED_WIDGET_ROW,
];

/**
 * Determines whether a cell should be highlighted based on certain conditions.
 */
export function getShouldHighLightCellSelector(
  state: AppState,
  cellLayoutId: string,
  cellLayoutType: LayoutComponentTypes,
) {
  // Check if the given cell layout type is valid for highlighting
  const validCell = layoutTypesWithWidgets.includes(cellLayoutType);

  // Get the dragging state from the application state
  const { isDragging } = state.ui.widgetDragResize;

  // If dragging is not active or the cell type is not valid, no need to highlight
  if (!isDragging || !validCell) {
    return false;
  }

  // Extract the highlight information from the application state
  const { highlightShown } = state.ui.widgetDragResize.anvil;

  // If a highlight is shown, determine if the cell should be highlighted
  if (highlightShown) {
    const { isVertical, layoutId } = highlightShown;

    // Highlight the cell only if the highlight is vertical and matches the cell layout ID
    return isVertical && cellLayoutId === layoutId;
  }

  // If no highlight is shown, do not highlight the cell
  return false;
}
