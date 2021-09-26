import { createReducer } from "utils/AppsmithUtils";
import { ReduxAction, ReduxActionTypes } from "constants/ReduxActionConstants";

const initialState: WebsocketReduxState = {
  appLevelSocketConnected: false,
  pageLevelSocketConnected: false,
};

const websocketReducer = createReducer(initialState, {
  [ReduxActionTypes.SET_IS_APP_LEVEL_WEBSOCKET_CONNECTED]: (
    state: WebsocketReduxState,
    action: ReduxAction<boolean>,
  ) => {
    return { ...state, appLevelSocketConnected: action.payload };
  },
  [ReduxActionTypes.SET_IS_PAGE_LEVEL_WEBSOCKET_CONNECTED]: (
    state: WebsocketReduxState,
    action: ReduxAction<boolean>,
  ) => {
    return { ...state, pageLevelSocketConnected: action.payload };
  },
});

export interface WebsocketReduxState {
  appLevelSocketConnected: boolean;
  pageLevelSocketConnected: boolean;
}

export default websocketReducer;
