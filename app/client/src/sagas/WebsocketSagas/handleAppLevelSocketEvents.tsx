import { put } from "redux-saga/effects";
import { APP_LEVEL_SOCKET_EVENTS } from "./socketEvents";

import { collabSetAppEditors } from "actions/appCollabActions";
import { getAppsmithConfigs } from "@appsmith/configs";
import { handleVersionUpdate } from "./versionUpdatePrompt";

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
      const [serverVersion] = event.payload;
      handleVersionUpdate(appVersion, serverVersion);
      return;
    }
  }
}
