/* eslint-disable @typescript-eslint/no-unused-vars */
import type { AppState } from "@appsmith/reducers";
import type { NameComponentStates } from "./types";
import { EVAL_ERROR_PATH } from "utils/DynamicBindingUtils";
import get from "lodash/get";
import { createSelector } from "reselect";
import { getIsDragging, getIsResizing } from "selectors/widgetDragSelectors";
import { getAnvilHighlightShown } from "layoutSystems/anvil/integrations/selectors";
import {
  isCurrentWidgetFocused,
  isWidgetSelected,
} from "selectors/widgetSelectors";
import { combinedPreviewModeSelector } from "selectors/editorSelectors";
import { getAppMode } from "@appsmith/selectors/applicationSelectors";
import { APP_MODE } from "entities/App";

/**
 *
 * @param state AppState
 * @param widgetId WidgetId for which we need the error count
 * @returns The number of errors reported by evaluations for this error
 *
 * This function gets the widget entity from the state that has results of evaluations for each entity
 * It then gets the error object from the widget entity and returns the count of errors
 *
 * Note: The logic to count the number of errors has been copied to make it easier to remove the dependency on the Fixed mode code.
 */
export function getWidgetErrorCount(state: AppState, widgetId: string) {
  const widgetObj = Object.values(state.evaluations.tree).find(
    (entity) => entity.ENTITY_TYPE === "WIDGET" && entity.widgetId === widgetId,
  );
  const errorObj: Record<string, Array<unknown>> = get(
    widgetObj,
    EVAL_ERROR_PATH,
    {},
  );
  const errorCount = Object.values(errorObj).reduce(
    (prev, curr) => curr.length + prev,
    0,
  );

  return errorCount;
}

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
    isCurrentWidgetFocused(widgetId),
    (
      isEditorOpen,
      isDragging,
      isResizing,
      highlightShown,
      isWidgetSelected,
      isWidgetFocused,
    ) => {
      const baseCondition = isEditorOpen && !isDragging && !isResizing;
      let onCanvasUIState: NameComponentStates = "none";
      if (baseCondition) {
        if (isWidgetSelected) onCanvasUIState = "select";
        // A widget can be focused and selected at the same time.
        // I'm not sure if these should be mutually exclusive states.
        if (isWidgetFocused && !isWidgetSelected) onCanvasUIState = "focus";
      }
      if (highlightShown && highlightShown.canvasId === widgetId) {
        onCanvasUIState = "focus";
      }
      return onCanvasUIState;
    },
  );
}
