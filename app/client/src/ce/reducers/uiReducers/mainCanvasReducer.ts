import { createImmerReducer } from "utils/ReducerUtils";
import type { ReduxAction } from "actions/ReduxActionTypes";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import {
  layoutConfigurations,
  MAIN_CONTAINER_WIDGET_ID,
} from "constants/WidgetConstants";
import type { UpdateCanvasLayoutPayload } from "actions/controlActions";
import type { UpdateCanvasPayload } from "actions/pageActions";
import { klona } from "klona";

export const initialState: MainCanvasReduxState = {
  initialized: false,
  width: 0,
  height: 0,
  isMobile: false,
};

export const handlers = {
  [ReduxActionTypes.INIT_CANVAS_LAYOUT]: (
    state: MainCanvasReduxState,
    action: ReduxAction<UpdateCanvasPayload>,
  ) => {
    if (state.initialized) return;

    const mainCanvas =
      action.payload.widgets &&
      action.payload.widgets[MAIN_CONTAINER_WIDGET_ID];

    state.width = mainCanvas?.rightColumn || state.width;
    state.height = mainCanvas?.minHeight || state.height;
  },
  [ReduxActionTypes.UPDATE_CANVAS_LAYOUT]: (
    state: MainCanvasReduxState,
    action: ReduxAction<UpdateCanvasLayoutPayload>,
  ) => {
    state.width = action.payload.width || state.width;
    state.initialized = true;
    state.isMobile =
      action.payload.width <= layoutConfigurations.MOBILE.maxWidth;
  },
  [ReduxActionTypes.RESET_EDITOR_REQUEST]: () => {
    return klona(initialState);
  },
};

const mainCanvasReducer = createImmerReducer(initialState, handlers);

export interface MainCanvasReduxState {
  initialized: boolean;
  width: number;
  height: number;
  isMobile: boolean;
}

export default mainCanvasReducer;
