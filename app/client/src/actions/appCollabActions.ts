import { websocketWriteEvent } from "./websocketActions";
import { APP_COLLAB_EVENTS } from "constants/AppCollabConstants";
import { ReduxActionTypes } from "../constants/ReduxActionConstants";

export const collabStartEditingAppEvent = (appId: string) =>
  websocketWriteEvent({
    type: APP_COLLAB_EVENTS.START_EDITING_APP,
    payload: appId,
  });

export const collabStopEditingAppEvent = (appId: string) =>
  websocketWriteEvent({
    type: APP_COLLAB_EVENTS.STOP_EDITING_APP,
    payload: appId,
  });

export const collabListAppEditorsEvent = (payload: any) => ({
  type: ReduxActionTypes.APP_COLLAB_LIST_EDITORS,
  payload,
});

export const collabResetAppEditorsEvent = () => ({
  type: ReduxActionTypes.APP_COLLAB_RESET_EDITORS,
});
