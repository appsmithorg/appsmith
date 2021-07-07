import { put, select } from "redux-saga/effects";
import { SOCKET_EVENTS } from "./constants";

import {
  newCommentEvent,
  newCommentThreadEvent,
  updateCommentThreadEvent,
  updateCommentEvent,
  incrementThreadUnreadCount,
} from "actions/commentActions";

import { newNotificationEvent } from "actions/notificationActions";
import { useSelector } from "react-redux";
import { getCurrentUser } from "selectors/usersSelectors";

export default function* handleSocketEvent(event: any) {
  const currentUser = yield select(getCurrentUser);

  switch (event.type) {
    // comments
    case SOCKET_EVENTS.INSERT_COMMENT_THREAD: {
      yield put(newCommentThreadEvent(event.payload[0]));

      const isCreatedByMe =
        event.payload[0].thread?.authorUsername === currentUser.username;
      if (!isCreatedByMe) yield put(incrementThreadUnreadCount());
      return;
    }
    case SOCKET_EVENTS.INSERT_COMMENT: {
      yield put(newCommentEvent(event.payload[0]));
      return;
    }
    case SOCKET_EVENTS.UPDATE_COMMENT_THREAD: {
      yield put(updateCommentThreadEvent(event.payload[0].thread));
      return;
    }
    case SOCKET_EVENTS.UPDATE_COMMENT: {
      yield put(updateCommentEvent(event.payload[0].comment));
      return;
    }
    // notifications
    case SOCKET_EVENTS.INSERT_NOTIFICATION: {
      yield put(newNotificationEvent(event.payload[0].notification));
      return;
    }
  }
}
