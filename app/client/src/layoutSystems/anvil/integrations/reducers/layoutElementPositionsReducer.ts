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
          offsetLeft: 0,
          offsetTop: 0,
        };
      }

      if (state[widgetId].height !== newPosition.height)
        state[widgetId].height = newPosition.height;

      if (state[widgetId].width !== newPosition.width)
        state[widgetId].width = newPosition.width;

      if (state[widgetId].left !== newPosition.left)
        state[widgetId].left = newPosition.left;

      if (state[widgetId].top !== newPosition.top)
        state[widgetId].top = newPosition.top;

      if (state[widgetId].offsetLeft !== newPosition.offsetLeft)
        state[widgetId].offsetLeft = newPosition.offsetLeft;

      if (state[widgetId].offsetTop !== newPosition.offsetTop)
        state[widgetId].offsetTop = newPosition.offsetTop;
    }
  },
  [AnvilReduxActionTypes.REMOVE_LAYOUT_ELEMENT_POSITIONS]: (
    state: LayoutElementPositions,
    action: AnvilReduxAction<string[]>,
  ) => {
    const elements = action.payload;

    for (const each of elements) {
      if (state[each]) {
        delete state[each];
      }
    }
  },
});

export default widgetPositionsReducer;
