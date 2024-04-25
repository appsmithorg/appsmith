import { getAppMode } from "@appsmith/selectors/applicationSelectors";
import { APP_MODE } from "entities/App";
import { createSelector } from "reselect";
import { combinedPreviewModeSelector } from "selectors/editorSelectors";
import { getIsDragging, getIsResizing } from "selectors/widgetDragSelectors";
import { isWidgetFocused, isWidgetSelected } from "selectors/widgetSelectors";
import { getAnvilHighlightShown } from "./selectors";

export const getIsEditorOpen = createSelector(
  combinedPreviewModeSelector,
  getAppMode,
  (isPreviewMode: boolean, appMode?: APP_MODE) => {
    return appMode === APP_MODE.EDIT && !isPreviewMode;
  },
);

export function shouldSelectOrFocus(widgetId: string) {
  return createSelector(
    getIsEditorOpen,
    getIsDragging,
    getIsResizing,
    getAnvilHighlightShown,
    isWidgetSelected(widgetId),
    isWidgetFocused(widgetId),
    (
      isEditorOpen,
      isDragging,
      isResizing,
      highlightShown,
      isWidgetSelected,
      isWidgetFocused,
    ) => {
      const baseCondition = isEditorOpen && !isDragging && !isResizing;
      let onCanvasUIState: "none" | "select" | "focus" = "none";
      if (baseCondition) {
        if (isWidgetSelected) onCanvasUIState = "select";
        if (isWidgetFocused && !isWidgetSelected) onCanvasUIState = "focus";
      }
      if (highlightShown && highlightShown.canvasId === widgetId) {
        onCanvasUIState = "focus";
      }
      return onCanvasUIState;
    },
  );
}
