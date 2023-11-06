import { AnvilReduxActionTypes } from "layoutSystems/anvil/integrations/actions/actionTypes";
import type { AnvilReduxAction } from "layoutSystems/anvil/integrations/actions/actionTypes";
import { createImmerReducer } from "utils/ReducerUtils";
import type { LayoutElementPositions } from "layoutSystems/common/types";

const initialState: LayoutElementPositions = {};

export type LayoutElementPositionsReduxState = typeof initialState;

/**
 * Reducer used for storing Position of all widgets in the current layout
 * This reducer is useful for all on canvas UI (Ex: Dropzone Highlights, Widget Name component position, etc)
 */
const widgetPositionsReducer = createImmerReducer(initialState, {
  [AnvilReduxActionTypes.UPDATE_LAYOUT_ELEMENT_POSITIONS]: (
    state: LayoutElementPositions,
    action: AnvilReduxAction<LayoutElementPositions>,
  ) => {
    const widgetPositions = action.payload;

    const widgetIds = Object.keys(widgetPositions);

    for (const widgetId of widgetIds) {
      const newPosition = widgetPositions[widgetId];
      if (state[widgetId] === undefined) {
        state[widgetId] = {
          height: 0,
          width: 0,
          left: 0,
          top: 0,
        };
      }
      state[widgetId].height = newPosition.height;
      state[widgetId].width = newPosition.width;
      state[widgetId].left = newPosition.left;
      state[widgetId].top = newPosition.top;
    }
  },
});

export default widgetPositionsReducer;
