import {
  appLevelWebsocketWriteEvent,
  pageLevelWebsocketWriteEvent,
} from "./websocketActions";
import { ReduxActionTypes } from "../constants/ReduxActionConstants";
import { PAGE_LEVEL_SOCKET_EVENTS } from "../sagas/WebsocketSagas/socketEvents";

// App Editors presence Socket actions
export const collabStartEditingAppEvent = (appId: string) =>
  appLevelWebsocketWriteEvent({
    type: PAGE_LEVEL_SOCKET_EVENTS.START_EDITING_APP,
    payload: appId,
  });

export const collabStopEditingAppEvent = (appId: string) =>
  appLevelWebsocketWriteEvent({
    type: PAGE_LEVEL_SOCKET_EVENTS.STOP_EDITING_APP,
    payload: appId,
  });

// App Editor presence Redux actions
export const collabSetAppEditors = (payload: any) => ({
  type: ReduxActionTypes.APP_COLLAB_LIST_EDITORS,
  payload,
});

export const collabResetAppEditors = () => ({
  type: ReduxActionTypes.APP_COLLAB_RESET_EDITORS,
});

// Pointer Sharing Socket Events
export const collabStartSharingPointerEvent = (pageId: string) =>
  pageLevelWebsocketWriteEvent({
    type: PAGE_LEVEL_SOCKET_EVENTS.START_EDITING_APP,
    payload: pageId,
  });

export const collabStopSharingPointerEvent = (pageId?: string) =>
  pageLevelWebsocketWriteEvent({
    type: PAGE_LEVEL_SOCKET_EVENTS.STOP_EDITING_APP,
    payload: pageId,
  });

export const collabShareUserPointerEvent = (payload: any) =>
  pageLevelWebsocketWriteEvent({
    type: PAGE_LEVEL_SOCKET_EVENTS.SHARE_USER_POINTER,
    payload,
  });

// Pointer Sharing Redux actions
export const collabSetEditorsPointersData = (payload: any) => ({
  type: ReduxActionTypes.APP_COLLAB_SET_EDITORS_POINTER_DATA,
  payload,
});

export const collabUnsetEditorsPointersData = (payload: any) => ({
  type: ReduxActionTypes.APP_COLLAB_UNSET_EDITORS_POINTER_DATA,
  payload,
});

export const collabResetEditorsPointersData = () => ({
  type: ReduxActionTypes.APP_COLLAB_RESET_EDITORS_POINTER_DATA,
});

export const collabConcurrentPageEditorsData = (payload: any) => ({
  type: ReduxActionTypes.APP_COLLAB_SET_CONCURRENT_PAGE_EDITORS,
  payload,
});
