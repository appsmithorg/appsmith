import { createReducer } from "utils/ReducerUtils";
import {
  ReduxAction,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";

const initialState: WebsocketReducerState = {
  appLevelSocketConnected: false,
  pageLevelSocketConnected: false,
};

const websocketReducer = createReducer(initialState, {
  [ReduxActionTypes.SET_IS_APP_LEVEL_WEBSOCKET_CONNECTED]: (
    state: WebsocketReducerState,
    action: ReduxAction<boolean>,
  ) => {
    return { ...state, appLevelSocketConnected: action.payload };
  },
  [ReduxActionTypes.SET_IS_PAGE_LEVEL_WEBSOCKET_CONNECTED]: (
    state: WebsocketReducerState,
    action: ReduxAction<boolean>,
  ) => {
    return { ...state, pageLevelSocketConnected: action.payload };
  },
});

export interface WebsocketReducerState {
  appLevelSocketConnected: boolean;
  pageLevelSocketConnected: boolean;
}

export default websocketReducer;
