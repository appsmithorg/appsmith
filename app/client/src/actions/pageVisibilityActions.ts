import { APP_LEVEL_SOCKET_EVENTS } from "sagas/WebsocketSagas/socketEvents";

import { appLevelWebsocketWriteEvent } from "./websocketActions";

export const pageVisibilityAppEvent = (visibility: DocumentVisibilityState) =>
  appLevelWebsocketWriteEvent({
    type: APP_LEVEL_SOCKET_EVENTS.PAGE_VISIBILITY,
    payload: visibility,
  });
