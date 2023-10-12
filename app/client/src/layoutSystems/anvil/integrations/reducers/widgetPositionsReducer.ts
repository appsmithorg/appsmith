import { AnvilReduxActionTypes } from "layoutSystems/anvil/integrations/actions/actionTypes";
import type { AnvilReduxAction } from "layoutSystems/anvil/integrations/actions/actionTypes";
import { createImmerReducer } from "utils/ReducerUtils";
import type { WidgetPositions } from "layoutSystems/common/types";

const initialState: WidgetPositions = {};

export type WidgetPositionsReduxState = typeof initialState;

/**
 * Reducer used for storing Position of all widgets in the current layout
 * This reducer is useful for all on canvas UI (Ex: Dropzone Highlights, Widget Name component position, etc)
 */
const widgetPositionsReducer = createImmerReducer(initialState, {
  [AnvilReduxActionTypes.UPDATE_WIDGET_POSITIONS]: (
    WidgetPositionState: WidgetPositions,
    action: AnvilReduxAction<WidgetPositions>,
  ) => {
    const widgetPositions = action.payload;
    console.log("#### WidgetPositionsReducerPayload", { widgetPositions });

    const widgetIds = Object.keys(widgetPositions);

    for (const widgetId of widgetIds) {
      const newPosition = widgetPositions[widgetId];
      if (WidgetPositionState[widgetId] === undefined) {
        WidgetPositionState[widgetId] = {
          height: 0,
          width: 0,
          left: 0,
          top: 0,
        };
      }
      WidgetPositionState[widgetId].height = newPosition.height;
      WidgetPositionState[widgetId].width = newPosition.width;
      WidgetPositionState[widgetId].left = newPosition.left;
      WidgetPositionState[widgetId].top = newPosition.top;
    }
  },
});

export default widgetPositionsReducer;
