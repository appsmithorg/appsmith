import { createImmerReducer } from "utils/ReducerUtils";
import type {
  UpdateCanvasPayload,
  ReduxAction,
} from "@appsmith/constants/ReduxActionConstants";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import type { WidgetProps } from "widgets/BaseWidget";
import { uniq, get, set } from "lodash";
import type { Diff } from "deep-diff";
import { diff } from "deep-diff";
import {
  getCanvasBottomRow,
  getCanvasWidgetHeightsToUpdate,
} from "utils/WidgetSizeUtils";

/* This type is an object whose keys are widgetIds and values are arrays with property paths
and property values
For example:
{ "xyz123": [{ propertyPath: "bottomRow", propertyValue: 20 }] }
*/
export type UpdateWidgetsPayload = Record<
  string,
  Array<{
    propertyPath: string;
    propertyValue: unknown;
  }>
>;

export interface CrudWidgetsPayload {
  add?: Record<string, WidgetProps>;
  remove?: string[];
  update?: UpdateWidgetsPayload;
}

const initialState: CanvasWidgetsReduxState = {};

export type FlattenedWidgetProps<orType = never> =
  | (WidgetProps & {
      children?: string[];
    })
  | orType;

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
    for (const [widgetId, widgetProps] of Object.entries(widgets)) {
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
  [ReduxActionTypes.CRUD_MULTIPLE_WIDGETS_AND_PROPERTIES]: (
    state: CanvasWidgetsReduxState,
    action: ReduxAction<CrudWidgetsPayload>,
  ) => {
    const { add, remove, update }: CrudWidgetsPayload = action.payload;

    if (add && Object.keys(add).length) {
      for (const each of Object.keys(add)) {
        console.log("#### adding widget", { widgetId: each });
        state[each] = add[each];
      }
    }

    if (remove?.length) {
      for (const each of remove) {
        console.log("#### removing widget", { widgetId: each });
        delete state[each];
      }
    }

    if (update && Object.keys(update).length) {
      for (const each of Object.keys(update)) {
        const widgetUpdate = update[each];
        console.log("#### updating widget", { widgetId: each, widgetUpdate });
        widgetUpdate.forEach(({ propertyPath, propertyValue }) => {
          const path = `${each}.${propertyPath}`;
          // Get original value in reducer
          const originalPropertyValue = get(state, path);
          // If the original and new values are different
          if (propertyValue !== originalPropertyValue)
            // Set the new values
            set(state, path, propertyValue);
        });
      }
    }
  },
});

export interface CanvasWidgetsReduxState {
  [widgetId: string]: FlattenedWidgetProps;
}

export default canvasWidgetsReducer;
