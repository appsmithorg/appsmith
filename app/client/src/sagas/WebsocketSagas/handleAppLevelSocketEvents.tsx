import { put } from "redux-saga/effects";
import { APP_LEVEL_SOCKET_EVENTS } from "./socketEvents";

import { collabSetAppEditors } from "actions/appCollabActions";
import { Toaster, Variant } from "design-system";
import {
  createMessage,
  INFO_VERSION_MISMATCH_FOUND_RELOAD_REQUEST,
} from "@appsmith/constants/messages";
import React from "react";
import { getAppsmithConfigs } from "@appsmith/configs";

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
      if (appVersion.id != event.payload[0]) {
        Toaster.show({
          text: createMessage(INFO_VERSION_MISMATCH_FOUND_RELOAD_REQUEST),
          variant: Variant.info,
          actionElement: <span onClick={() => location.reload()}>REFRESH</span>,
          autoClose: false,
        });
      }
      return;
    }
  }
}
