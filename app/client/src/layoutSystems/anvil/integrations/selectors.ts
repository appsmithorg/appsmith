import type { AppState } from "@appsmith/reducers";
import { LayoutComponentTypes, type LayoutProps } from "../utils/anvilTypes";

// ToDo: This is a placeholder implementation this is bound to change
export function getDropTargetLayoutId(state: AppState, canvasId: string) {
  const layout: LayoutProps[] = state.entities.canvasWidgets[canvasId].layout;
  return layout[0].layoutId;
}

export function getAnvilSpaceDistributionStatus(state: AppState) {
  return state.ui.widgetDragResize.anvil.isDistributingSpace;
}

export function getAnvilHighlightShown(state: AppState) {
  return state.ui.widgetDragResize.anvil.highlightShown;
}
const layoutTypesWithWidgets = [
  LayoutComponentTypes.ALIGNED_WIDGET_COLUMN,
  LayoutComponentTypes.ALIGNED_WIDGET_ROW,
];

export function getShouldHighLightCellSelector(
  state: AppState,
  cellLayoutId: string,
  cellLayoutType: LayoutComponentTypes,
) {
  const validCell = layoutTypesWithWidgets.includes(cellLayoutType);
  const { isDragging } = state.ui.widgetDragResize;
  if (!isDragging || !validCell) {
    return false;
  }
  const { highlightShown } = state.ui.widgetDragResize.anvil;
  if (highlightShown) {
    const { isVertical, layoutId } = highlightShown;
    return isVertical && cellLayoutId === layoutId;
  }
  return false;
}
