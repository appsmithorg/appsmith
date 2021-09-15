import {
  setIsAppEditWebsocketConnected,
  setIsPageEditWebsocketConnected,
} from "../actions/websocketActions";
import { io, Socket } from "socket.io-client";
import { WebsocketActionTypes } from "../constants/ReduxActionConstants";
import {
  NAMESPACE_COLLAB_PAGE_EDIT,
  RTS_BASE_PATH,
} from "../constants/WebsocketConstants";
import {
  handleAppEditSocketEvent,
  handlePageEditSocketEvent,
} from "../sagas/WebsocketSagas/handleSocketEvent";

const socketMiddleware = () => {
  let appEditSocket: Socket | null = null;
  let pageEditSocket: Socket | null = null;

  return (store: any) => (next: any) => (action: any) => {
    switch (action.type) {
      case WebsocketActionTypes.WEBSOCKET_APP_EDIT_CONNECT:
      case WebsocketActionTypes.WEBSOCKET_APP_EDIT_RECONNECT:
        if (!!appEditSocket) {
          appEditSocket.disconnect();
        }
        // connect to the remote host
        appEditSocket = io({
          path: RTS_BASE_PATH,
        });
        store.dispatch(setIsAppEditWebsocketConnected(true));
        appEditSocket.onAny((event: any, ...args: any) =>
          handleAppEditSocketEvent({ type: event, payload: args }, store),
        );
        break;
      case WebsocketActionTypes.WEBSOCKET_APP_EDIT_DISCONNECT:
        if (!!appEditSocket) {
          appEditSocket.disconnect();
        }
        appEditSocket = null;
        store.dispatch(setIsAppEditWebsocketConnected(false));
        break;
      case WebsocketActionTypes.WEBSOCKET_APP_EDIT_WRITE:
        const { payload: appPayload, type: appEventType } = action.payload;
        if (!!appEditSocket) {
          appEditSocket.emit(appEventType, appPayload);
        }
        break;
      case WebsocketActionTypes.WEBSOCKET_PAGE_EDIT_CONNECT:
      case WebsocketActionTypes.WEBSOCKET_PAGE_EDIT_RECONNECT:
        if (!!pageEditSocket) {
          pageEditSocket.disconnect();
        }
        pageEditSocket = io(NAMESPACE_COLLAB_PAGE_EDIT, {
          path: RTS_BASE_PATH,
        });
        store.dispatch(setIsPageEditWebsocketConnected(true));
        const pageSocketId = pageEditSocket.id;
        pageEditSocket.onAny((event: any, ...args: any) =>
          handlePageEditSocketEvent(
            { type: event, payload: args },
            pageSocketId,
            store,
          ),
        );
        break;
      case WebsocketActionTypes.WEBSOCKET_PAGE_EDIT_DISCONNECT:
        if (!!pageEditSocket) {
          pageEditSocket.disconnect();
        }
        pageEditSocket = null;
        store.dispatch(setIsPageEditWebsocketConnected(false));
        break;
      case WebsocketActionTypes.WEBSOCKET_PAGE_EDIT_WRITE:
        const { payload: pagePayload, type: pageEventType } = action.payload;
        if (!!pageEditSocket) {
          pageEditSocket.emit(pageEventType, pagePayload);
        }
        break;
      default:
        return next(action);
    }
  };
};

export default socketMiddleware();
