import { createImmerReducer } from "utils/ReducerUtils";
import type { ReduxAction } from "ee/constants/ReduxActionConstants";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import type { WidgetProps } from "widgets/BaseWidget";
import { uniq, get, set } from "lodash";
import type { Diff } from "deep-diff";
import { diff } from "deep-diff";
import {
  getCanvasBottomRow,
  getCanvasWidgetHeightsToUpdate,
} from "utils/WidgetSizeUtils";
import { klona } from "klona";
import type { UpdateCanvasPayload } from "actions/types/pageActions.types";
import type { SetWidgetDynamicPropertyPayload } from "actions/types/controlActions.types";

/* This type is an object whose keys are widgetIds and values are arrays with property paths
and property values
For example:
{ "xyz123": [{ propertyPath: "bottomRow", propertyValue: 20 }] }
*/
import type { UpdateWidgetsPayload, FlattenedWidgetProps, CanvasWidgetsReduxState } from "../types/canvasWidgets.types";

export const initialState: CanvasWidgetsReduxState = {};



/**
 *
 * @param updateLayoutDiff
 * @returns list of widgets that were updated
 */
function getUpdatedWidgetLists(
  updateLayoutDiff: Diff<
    CanvasWidgetsReduxState,
    {
      [widgetId: string]: WidgetProps;
    }
  >[],
) {
  return uniq(
    updateLayoutDiff
      .map((diff: Diff<CanvasWidgetsReduxState>) => diff.path?.[0])
      .filter((widgetId) => !!widgetId),
  );
}

const canvasWidgetsReducer = createImmerReducer(initialState, {
  [ReduxActionTypes.INIT_CANVAS_LAYOUT]: (
    state: CanvasWidgetsReduxState,
    action: ReduxAction<UpdateCanvasPayload>,
  ) => {
    const { widgets } = action.payload;

    for (const [widgetId, widgetProps] of Object.entries(widgets) as [string, WidgetProps][]) {
      if (widgetProps.type === "CANVAS_WIDGET") {
        const bottomRow = getCanvasBottomRow(widgetId, widgets);

        widgets[widgetId].bottomRow = bottomRow;
      }
    }

    return widgets;
  },
  [ReduxActionTypes.UPDATE_LAYOUT]: (
    state: CanvasWidgetsReduxState,
    action: ReduxAction<UpdateCanvasPayload>,
  ) => {
    let listOfUpdatedWidgets;

    // if payload has knowledge of which widgets were changed, use that
    if (action.payload.updatedWidgetIds) {
      listOfUpdatedWidgets = action.payload.updatedWidgetIds;
    } // else diff out the widgets that need to be updated
    else {
      const updatedLayoutDiffs = diff(state, action.payload.widgets);

      if (!updatedLayoutDiffs) return state;

      listOfUpdatedWidgets = getUpdatedWidgetLists(updatedLayoutDiffs);
    }

    //update only the widgets that need to be updated.
    for (const widgetId of listOfUpdatedWidgets) {
      const updatedWidget = action.payload.widgets[widgetId];

      if (updatedWidget) {
        state[widgetId] = updatedWidget;
      } else {
        delete state[widgetId];
      }
    }

    const canvasWidgetHeightsToUpdate: Record<string, number> =
      getCanvasWidgetHeightsToUpdate(listOfUpdatedWidgets, state);

    for (const widgetId in canvasWidgetHeightsToUpdate) {
      state[widgetId] = {
        ...state[widgetId],
        bottomRow: canvasWidgetHeightsToUpdate[widgetId],
      };
    }
  },
  [ReduxActionTypes.UPDATE_MULTIPLE_WIDGET_PROPERTIES]: (
    state: CanvasWidgetsReduxState,
    action: ReduxAction<{
      widgetsToUpdate: UpdateWidgetsPayload;
      shouldEval: boolean;
    }>,
  ) => {
    // For each widget whose properties we would like to update
    for (const [widgetId, propertyPathsToUpdate] of Object.entries(
      action.payload.widgetsToUpdate,
    )) {
      // Iterate through each property to update in `widgetId`
      propertyPathsToUpdate.forEach(({ propertyPath, propertyValue }) => {
        const path = `${widgetId}.${propertyPath}`;
        // Get original value in reducer
        const originalPropertyValue = get(state, path);

        // If the original and new values are different
        if (propertyValue !== originalPropertyValue)
          // Set the new values
          set(state, path, propertyValue);
      });
    }

    const canvasWidgetHeightsToUpdate: Record<string, number> =
      getCanvasWidgetHeightsToUpdate(
        Object.keys(action.payload.widgetsToUpdate),
        state,
      );

    for (const widgetId in canvasWidgetHeightsToUpdate) {
      state[widgetId].bottomRow = canvasWidgetHeightsToUpdate[widgetId];
    }
  },
  [ReduxActionTypes.RESET_EDITOR_REQUEST]: () => {
    return klona(initialState);
  },
  [ReduxActionTypes.SET_WIDGET_DYNAMIC_PROPERTY]: (
    state: CanvasWidgetsReduxState,
    action: ReduxAction<SetWidgetDynamicPropertyPayload>,
  ) => {
    const { isDynamic, propertyPath, widgetId } = action.payload;
    const widget = state[widgetId];

    // When options JS mode is disabled, reset the optionLabel and optionValue to standard values
    if (
      widget.type === "WDS_SELECT_WIDGET" &&
      propertyPath === "options" &&
      !isDynamic
    ) {
      set(state, `${widgetId}.optionLabel`, "label");
      set(state, `${widgetId}.optionValue`, "value");
    }

    return state;
  },
});



export default canvasWidgetsReducer;
