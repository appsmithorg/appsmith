import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
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
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload?: any;
}) => ({
  type: ReduxActionTypes.WEBSOCKET_APP_LEVEL_WRITE_CHANNEL,
  payload,
});
export const pageLevelWebsocketWriteEvent = (payload: {
  type: string;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload?: any;
}) => ({
  type: ReduxActionTypes.WEBSOCKET_PAGE_LEVEL_WRITE_CHANNEL,
  payload,
});

export const reconnectAppLevelWebsocket = () =>
  appLevelWebsocketWriteEvent(reconnectWebsocketEvent());

export const initAppLevelSocketConnection = () => ({
  type: ReduxActionTypes.INIT_APP_LEVEL_SOCKET_CONNECTION,
});

export const reconnectPageLevelWebsocket = () =>
  pageLevelWebsocketWriteEvent(reconnectWebsocketEvent());

export const initPageLevelSocketConnection = () => ({
  type: ReduxActionTypes.INIT_PAGE_LEVEL_SOCKET_CONNECTION,
});
