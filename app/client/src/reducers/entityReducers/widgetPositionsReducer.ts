import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import { createImmerReducer } from "utils/ReducerUtils";

export interface WidgetPositions {
  [widgetId: string]: {
    left: number;
    top: number;
    height: number;
    width: number;
  };
}

const initialState: WidgetPositions = {};

const widgetPositionsReducer = createImmerReducer(initialState, {
  [ReduxActionTypes.UPDATE_WIDGET_POSITIONS]: (
    state: WidgetPositions,
    action: ReduxAction<WidgetPositions>,
  ) => {
    const widgetPositions = action.payload;

    return { ...state, ...widgetPositions };
  },
});

export default widgetPositionsReducer;
