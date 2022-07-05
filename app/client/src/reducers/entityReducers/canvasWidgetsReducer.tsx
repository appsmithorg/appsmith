import { createImmerReducer } from "utils/AppsmithUtils";
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
    if (action.payload.updatedWidgetIds) {
      listOfUpdatedWidgets = action.payload.updatedWidgetIds;
    } else {
      const updateLayoutDiff = diff(state, action.payload.widgets);
      if (!updateLayoutDiff) return state;

      listOfUpdatedWidgets = getUpdatedWidgetLists(updateLayoutDiff);
    }

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

const getUpdatedWidgetLists = (
  updateLayoutDiff: Diff<
    CanvasWidgetsReduxState,
    {
      [widgetId: string]: WidgetProps;
    }
  >[],
) => {
  return uniq(
    updateLayoutDiff
      .map((diff: Diff<CanvasWidgetsReduxState>) => diff.path?.[0])
      .filter((widgetId) => !!widgetId),
  );
};
export interface CanvasWidgetsReduxState {
  [widgetId: string]: FlattenedWidgetProps;
}

export default canvasWidgetsReducer;
