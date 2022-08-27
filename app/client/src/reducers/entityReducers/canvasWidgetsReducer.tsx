import { createImmerReducer } from "utils/ReducerUtils";
import {
  ReduxActionTypes,
  UpdateCanvasPayload,
  ReduxAction,
} from "@appsmith/constants/ReduxActionConstants";
import { WidgetProps } from "widgets/BaseWidget";
import { Diff, diff } from "deep-diff";
import { uniq } from "lodash";

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
    return action.payload.widgets;
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
  },
});
export interface CanvasWidgetsReduxState {
  [widgetId: string]: FlattenedWidgetProps;
}

export default canvasWidgetsReducer;
