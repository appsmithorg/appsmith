import {
  ReduxActionTypes,
  ReduxSagaChannels,
} from "constants/ReduxActionConstants";
import { reconnectWebsocketEvent } from "constants/WebsocketConstants";

export const setIsWebsocketConnected = (payload: boolean) => ({
  type: ReduxActionTypes.SET_IS_WEBSOCKET_CONNECTED,
  payload,
});

export const websocketWriteEvent = (payload: {
  type: string;
  payload?: any;
}) => ({
  type: ReduxSagaChannels.WEBSOCKET_WRITE_CHANNEL,
  payload,
});

export const reconnectWebsocket = () =>
  websocketWriteEvent(reconnectWebsocketEvent());

export const retrySocketConnection = () => ({
  type: ReduxActionTypes.RETRY_WEBSOCKET_CONNECTION,
});
