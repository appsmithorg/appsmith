import type { DefaultRootState } from "react-redux";
import { createSelector } from "reselect";
import { getIsAppSettingsPaneWithNavigationTabOpen } from "./appSettingsPaneSelectors";
import { snipingModeSelector } from "./editorSelectors";
import { getWidgetSelectionBlock } from "./ui";
import { selectCombinedPreviewMode } from "./gitModSelectors";

export const getIsDragging = (state: DefaultRootState) =>
  state.ui.widgetDragResize.isDragging;

export const getIsResizing = (state: DefaultRootState) =>
  state.ui.widgetDragResize.isResizing;

export const getIsDraggingDisabledInEditor = (state: DefaultRootState) =>
  state.ui.widgetDragResize.isDraggingDisabled;

/**
 * getShouldAllowDrag is a Selector that indicates if the widget could be dragged on canvas based on different states
 */
export const getShouldAllowDrag = createSelector(
  getIsResizing,
  getIsDragging,
  getIsDraggingDisabledInEditor,
  selectCombinedPreviewMode,
  snipingModeSelector,
  getIsAppSettingsPaneWithNavigationTabOpen,
  getWidgetSelectionBlock,
  (
    isResizing,
    isDragging,
    isDraggingDisabled,
    isPreviewMode,
    isSnipingMode,
    isAppSettingsPaneWithNavigationTabOpen,
    widgetSelectionIsBlocked,
  ) => {
    return (
      !isResizing &&
      !isDragging &&
      !isDraggingDisabled &&
      !isSnipingMode &&
      !isPreviewMode &&
      !isAppSettingsPaneWithNavigationTabOpen &&
      !widgetSelectionIsBlocked
    );
  },
);
