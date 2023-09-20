import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import { createImmerReducer } from "utils/ReducerUtils";

export type WidgetPosition = {
  left: number;
  top: number;
  height: number;
  width: number;
};
export interface WidgetPositions {
  [widgetId: string]: WidgetPosition;
}

const initialState: WidgetPositions = {};
/**
 * Reducer used for storing Position of all widgets in saga
 */
const widgetPositionsReducer = createImmerReducer(initialState, {
  [ReduxActionTypes.UPDATE_WIDGET_POSITIONS]: (
    WidgetPositionState: WidgetPositions,
    action: ReduxAction<WidgetPositions>,
  ) => {
    const widgetPositions = action.payload;

    const widgetIds = Object.keys(widgetPositions);

    for (const widgetId of widgetIds) {
      WidgetPositionState[widgetId] = { ...widgetPositions[widgetId] };
    }
  },
});

export default widgetPositionsReducer;
