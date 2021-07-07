import { createReducer } from "utils/AppsmithUtils";
import { ReduxAction, ReduxActionTypes } from "constants/ReduxActionConstants";

const initialState: WebsocketReduxState = {
  connected: false,
};

const websocketReducer = createReducer(initialState, {
  [ReduxActionTypes.SET_IS_WEBSOCKET_CONNECTED]: (
    state: WebsocketReduxState,
    action: ReduxAction<boolean>,
  ) => {
    return { ...state, connected: action.payload };
  },
});

export interface WebsocketReduxState {
  connected: boolean;
}

export default websocketReducer;
