import type { DefaultRootState } from "react-redux";
import { LayoutComponentTypes, type LayoutProps } from "../utils/anvilTypes";
import { selectFeatureFlagCheck } from "ee/selectors/featureFlagsSelectors";
import { FEATURE_FLAG } from "ee/entities/FeatureFlag";
import { LayoutSystemTypes } from "layoutSystems/types";
import { getLayoutSystemType } from "selectors/layoutSystemSelectors";
import { createSelector } from "reselect";

export const getIsAnvilLayoutEnabled = (state: DefaultRootState) => {
  return selectFeatureFlagCheck(state, FEATURE_FLAG.release_anvil_enabled);
};

/**
 * A selector to verify if the current application is an Anvil application.
 * This is done by getting the layout system type of the current application (getLayoutSystemType)
 * and comparing with the expected value for ANVIL layout system
 * returns boolean
 */
export const getIsAnvilEnabledInCurrentApplication = createSelector(
  getLayoutSystemType,
  (layoutSystemType: LayoutSystemTypes) => {
    return layoutSystemType === LayoutSystemTypes.ANVIL;
  },
);

export const getIsAnvilLayout = (state: DefaultRootState) => {
  const layoutSystemType = getLayoutSystemType(state);

  return layoutSystemType === LayoutSystemTypes.ANVIL;
};

// ToDo: This is a placeholder implementation this is bound to change
export function getDropTargetLayoutId(
  state: DefaultRootState,
  canvasId: string,
) {
  const layout: LayoutProps[] = state.entities.canvasWidgets[canvasId].layout;

  return layout[0].layoutId;
}

/**
 * Returns a boolean indicating if space distribution is in progress
 */
export function getAnvilSpaceDistributionStatus(state: DefaultRootState) {
  return state.ui.widgetDragResize.anvil.spaceDistribution.isDistributingSpace;
}

export function getWidgetsDistributingSpace(state: DefaultRootState) {
  return state.ui.widgetDragResize.anvil.spaceDistribution.widgetsEffected;
}

/**
 * Returns the highlight info for the current drag
 */
export function getAnvilHighlightShown(state: DefaultRootState) {
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
  state: DefaultRootState,
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
