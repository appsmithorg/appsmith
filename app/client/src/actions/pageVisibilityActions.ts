import { appLevelWebsocketWriteEvent } from "./websocketActions";
import { APP_LEVEL_SOCKET_EVENTS } from "sagas/WebsocketSagas/socketEvents";

export const pageVisibilityAppEvent = (visibility: VisibilityState) =>
  appLevelWebsocketWriteEvent({
    type: APP_LEVEL_SOCKET_EVENTS.PAGE_VISIBILITY,
    payload: visibility,
  });
