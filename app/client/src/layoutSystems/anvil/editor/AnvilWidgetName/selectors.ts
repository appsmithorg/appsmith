import type { AppState } from "ee/reducers";
import type { NameComponentStates } from "./types";
import { EVAL_ERROR_PATH } from "utils/DynamicBindingUtils";
import get from "lodash/get";
import { createSelector } from "reselect";
import { getIsDragging } from "selectors/widgetDragSelectors";
import {
  getAnvilHighlightShown,
  getAnvilSpaceDistributionStatus,
} from "layoutSystems/anvil/integrations/selectors";
import { isWidgetFocused, isWidgetSelected } from "selectors/widgetSelectors";
import { isEditOnlyModeSelector } from "selectors/editorSelectors";

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

/**
 * This selector checks if the widget should be selected or focused.
 * The widget can be selected, focused, or neither.
 *
 * We consider the base condition of the following:
 * - We're in the editor
 * - We're not dragging
 *
 * Then we check if we're distributing space or adding a new widget. In both these scenarios
 * the `highlightShown` flag is set to true. In this case, we return the widget as focused.
 *
 * return "none" by default
 *
 * @param widgetId The widgetId for which we need to check if it should be selected or focused.
 */
export function shouldSelectOrFocus(widgetId: string) {
  return createSelector(
    isEditOnlyModeSelector,
    getIsDragging,
    getAnvilHighlightShown,
    isWidgetSelected(widgetId),
    isWidgetFocused(widgetId),
    getAnvilSpaceDistributionStatus,
    (
      isEditorOpen,
      isDragging,
      highlightShown,
      isWidgetSelected,
      isWidgetFocused,
      isDistributingSpace,
    ) => {
      const baseCondition = isEditorOpen && !isDragging;
      let onCanvasUIState: NameComponentStates = "none";
      if (baseCondition) {
        if (isWidgetSelected) onCanvasUIState = "select";

        // when dragging the resizing handle, the action also makes
        // the widget selected but we want to show it as focused while distributing space
        if (isWidgetSelected && isDistributingSpace) onCanvasUIState = "focus";

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
