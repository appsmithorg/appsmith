import { createReducer } from "utils/AppsmithUtils";
import { ReduxAction, ReduxActionTypes } from "constants/ReduxActionConstants";

const initialState: WebsocketReduxState = {
  appEditSocketConnected: false,
  pageEditSocketConnected: false,
};

const websocketReducer = createReducer(initialState, {
  [ReduxActionTypes.SET_IS_APP_EDIT_WEBSOCKET_CONNECTED]: (
    state: WebsocketReduxState,
    action: ReduxAction<boolean>,
  ) => {
    return { ...state, appEditSocketConnected: action.payload };
  },
  [ReduxActionTypes.SET_IS_PAGE_EDIT_WEBSOCKET_CONNECTED]: (
    state: WebsocketReduxState,
    action: ReduxAction<boolean>,
  ) => {
    return { ...state, pageEditSocketConnected: action.payload };
  },
});

export interface WebsocketReduxState {
  appEditSocketConnected: boolean;
  pageEditSocketConnected: boolean;
}

export default websocketReducer;
