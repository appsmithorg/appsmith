import { put } from "redux-saga/effects";
import { APP_LEVEL_SOCKET_EVENTS } from "./socketEvents";

import { collabSetAppEditors } from "actions/appCollabActions";
import {
  createMessage,
  INFO_VERSION_MISMATCH_FOUND_RELOAD_REQUEST,
} from "@appsmith/constants/messages";
import { getAppsmithConfigs } from "@appsmith/configs";
import { toast } from "design-system";

export default function* handleAppLevelSocketEvents(event: any) {
  switch (event.type) {
    // Collab V2 - Realtime Editing
    case APP_LEVEL_SOCKET_EVENTS.LIST_ONLINE_APP_EDITORS: {
      yield put(collabSetAppEditors(event.payload[0]));
      return;
    }
    // notification on release version
    case APP_LEVEL_SOCKET_EVENTS.RELEASE_VERSION_NOTIFICATION: {
      const { appVersion } = getAppsmithConfigs();
      if (appVersion.id && appVersion.id != event.payload[0]) {
        toast.show(createMessage(INFO_VERSION_MISMATCH_FOUND_RELOAD_REQUEST), {
          kind: "info",
          action: {
            text: "refresh",
            effect: () => location.reload(),
          },
        });
      }
      return;
    }
  }
}
