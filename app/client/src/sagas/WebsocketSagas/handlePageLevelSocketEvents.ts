import { put } from "redux-saga/effects";
import { PAGE_LEVEL_SOCKET_EVENTS } from "./socketEvents";
import {
  collabSetEditorsPointersData,
  collabUnsetEditorsPointersData,
} from "actions/appCollabActions";

export default function* handlePageLevelSocketEvents(
  event: any,
  socketId?: string,
) {
  switch (event.type) {
    case PAGE_LEVEL_SOCKET_EVENTS.SHARE_USER_POINTER: {
      if (socketId !== event.payload[0].socketId) {
        yield put(collabSetEditorsPointersData(event.payload[0]));
      }
      return;
    }
    case PAGE_LEVEL_SOCKET_EVENTS.STOP_EDITING_APP: {
      yield put(collabUnsetEditorsPointersData(event.payload[0]));
      return;
    }
  }
}
