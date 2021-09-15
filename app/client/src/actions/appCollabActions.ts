import {
  appEditwebsocketWriteEvent,
  pageEditwebsocketWriteEvent,
} from "./websocketActions";
import { ReduxActionTypes } from "constants/ReduxActionConstants";
import { APP_MULTIPLAYER_SOCKET_EVENTS } from "middlewares/webSocket/constants";

export const collabStartEditingAppEvent = (appId: string) =>
  appEditwebsocketWriteEvent({
    type: APP_MULTIPLAYER_SOCKET_EVENTS.START_EDITING_APP,
    payload: appId,
  });

export const collabStopEditingAppEvent = (appId: string) =>
  appEditwebsocketWriteEvent({
    type: APP_MULTIPLAYER_SOCKET_EVENTS.STOP_EDITING_APP,
    payload: appId,
  });

export const collabStartEditingPageEvent = (pageId: string) =>
  pageEditwebsocketWriteEvent({
    type: APP_MULTIPLAYER_SOCKET_EVENTS.START_EDITING_APP,
    payload: pageId,
  });

export const collabStopEditingPageEvent = () =>
  pageEditwebsocketWriteEvent({
    type: APP_MULTIPLAYER_SOCKET_EVENTS.STOP_EDITING_APP,
  });

export const collabShareUserPointerEvent = (payload: any) =>
  pageEditwebsocketWriteEvent({
    type: APP_MULTIPLAYER_SOCKET_EVENTS.SHARE_USER_POINTER,
    payload,
  });

export const collabSetEditorsPointersData = (payload: any) => ({
  type: ReduxActionTypes.APP_COLLAB_SET_EDITORS_POINTER_DATA,
  payload,
});

export const collabUnSetEditorsPointersData = (payload: any) => ({
  type: ReduxActionTypes.APP_COLLAB_UNSET_EDITORS_POINTER_DATA,
  payload,
});

export const collabResetEditorsPointersData = () => ({
  type: ReduxActionTypes.APP_COLLAB_RESET_EDITORS_POINTER_DATA,
});

export const collabListAppEditorsEvent = (payload: any) => ({
  type: ReduxActionTypes.APP_COLLAB_LIST_EDITORS,
  payload,
});

export const collabResetAppEditorsEvent = () => ({
  type: ReduxActionTypes.APP_COLLAB_RESET_EDITORS,
});
