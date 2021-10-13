import {
  ReduxActionTypes,
  ReduxSagaChannels,
} from "constants/ReduxActionConstants";
import { reconnectWebsocketEvent } from "constants/WebsocketConstants";

export const setIsAppLevelWebsocketConnected = (payload: boolean) => ({
  type: ReduxActionTypes.SET_IS_APP_LEVEL_WEBSOCKET_CONNECTED,
  payload,
});
export const setIsPageLevelWebsocketConnected = (payload: boolean) => ({
  type: ReduxActionTypes.SET_IS_PAGE_LEVEL_WEBSOCKET_CONNECTED,
  payload,
});

export const appLevelWebsocketWriteEvent = (payload: {
  type: string;
  payload?: any;
}) => ({
  type: ReduxSagaChannels.WEBSOCKET_APP_LEVEL_WRITE_CHANNEL,
  payload,
});
export const pageLevelWebsocketWriteEvent = (payload: {
  type: string;
  payload?: any;
}) => ({
  type: ReduxSagaChannels.WEBSOCKET_PAGE_LEVEL_WRITE_CHANNEL,
  payload,
});

export const reconnectAppLevelWebsocket = () =>
  appLevelWebsocketWriteEvent(reconnectWebsocketEvent());

export const retryAppLevelSocketConnection = () => ({
  type: ReduxActionTypes.RETRY_APP_LEVEL_WEBSOCKET_CONNECTION,
});

export const initAppLevelSocketConnection = () => ({
  type: ReduxActionTypes.INIT_APP_LEVEL_SOCKET_CONNECTION,
});

export const reconnectPageLevelWebsocket = () =>
  pageLevelWebsocketWriteEvent(reconnectWebsocketEvent());

export const retryPageLevelSocketConnection = () => ({
  type: ReduxActionTypes.RETRY_PAGE_LEVEL_WEBSOCKET_CONNECTION,
});

export const initPageLevelSocketConnection = () => ({
  type: ReduxActionTypes.INIT_PAGE_LEVEL_SOCKET_CONNECTION,
});
