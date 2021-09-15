import {
  ReduxActionTypes,
  WebsocketActionTypes,
} from "constants/ReduxActionConstants";
import { reconnectWebsocketEvent } from "constants/WebsocketConstants";

export const setIsAppEditWebsocketConnected = (payload: boolean) => ({
  type: ReduxActionTypes.SET_IS_APP_EDIT_WEBSOCKET_CONNECTED,
  payload,
});

export const setIsPageEditWebsocketConnected = (payload: boolean) => ({
  type: ReduxActionTypes.SET_IS_PAGE_EDIT_WEBSOCKET_CONNECTED,
  payload,
});

export const appEditwebsocketWriteEvent = (payload: {
  type: string;
  payload?: any;
}) => ({
  type: WebsocketActionTypes.WEBSOCKET_APP_EDIT_WRITE,
  payload,
});

export const pageEditwebsocketWriteEvent = (payload: {
  type: string;
  payload?: any;
}) => ({
  type: WebsocketActionTypes.WEBSOCKET_PAGE_EDIT_WRITE,
  payload,
});

export const reconnectWebsocket = () =>
  appEditwebsocketWriteEvent(reconnectWebsocketEvent());

export const retrySocketConnection = () => ({
  type: ReduxActionTypes.RETRY_WEBSOCKET_CONNECTION,
});

export const initAppEditSocketConnection = () => ({
  type: WebsocketActionTypes.WEBSOCKET_APP_EDIT_CONNECT,
});

export const initPageEditSocketConnection = () => ({
  type: WebsocketActionTypes.WEBSOCKET_PAGE_EDIT_RECONNECT,
});
