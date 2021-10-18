import { put } from "redux-saga/effects";
import { PAGE_LEVEL_SOCKET_EVENTS } from "./socketEvents";
import {
  collabSetEditorsPointersData,
  collabUnsetEditorsPointersData,
  collabConcurrentPageEditorsData,
} from "actions/appCollabActions";
import * as Sentry from "@sentry/react";

export default function* handlePageLevelSocketEvents(event: any, socket: any) {
  try {
    switch (event.type) {
      case PAGE_LEVEL_SOCKET_EVENTS.SHARE_USER_POINTER: {
        if (socket.id !== event.payload[0].socketId) {
          yield put(collabSetEditorsPointersData(event.payload[0]));
        }
        return;
      }
      case PAGE_LEVEL_SOCKET_EVENTS.STOP_EDITING_APP: {
        yield put(collabUnsetEditorsPointersData(event.payload[0]));
        return;
      }

      case PAGE_LEVEL_SOCKET_EVENTS.LIST_ONLINE_PAGE_EDITORS: {
        yield put(collabConcurrentPageEditorsData(event.payload[0]?.users));
        return;
      }
    }
  } catch (e) {
    Sentry.captureException(e);
  }
}
