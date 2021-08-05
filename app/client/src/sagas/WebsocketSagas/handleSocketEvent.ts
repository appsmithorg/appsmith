import { put, select } from "redux-saga/effects";
import { SOCKET_EVENTS } from "./constants";

import {
  newCommentEvent,
  newCommentThreadEvent,
  updateCommentThreadEvent,
  updateCommentEvent,
  incrementThreadUnreadCount,
  decrementThreadUnreadCount,
} from "actions/commentActions";

import { newNotificationEvent } from "actions/notificationActions";
import { getCurrentUser } from "selectors/usersSelectors";
import { getCurrentApplication } from "selectors/applicationSelectors";
import { commentThreadsSelector } from "selectors/commentsSelectors";
import { AppState } from "reducers";
import { CommentThread } from "entities/Comments/CommentsInterfaces";

export default function* handleSocketEvent(event: any) {
  const currentUser = yield select(getCurrentUser);
  const currentApplication = yield select(getCurrentApplication);

  switch (event.type) {
    // comments
    case SOCKET_EVENTS.INSERT_COMMENT_THREAD: {
      yield put(newCommentThreadEvent(event.payload[0]));

      const { thread } = event.payload[0];
      const isForCurrentApplication =
        thread?.applicationId === currentApplication.id;

      const isCreatedByMe = thread?.authorUsername === currentUser.username;
      if (!isCreatedByMe && isForCurrentApplication)
        yield put(incrementThreadUnreadCount());
      return;
    }
    case SOCKET_EVENTS.INSERT_COMMENT: {
      yield put(newCommentEvent(event.payload[0]));
      return;
    }
    case SOCKET_EVENTS.REPLACE_COMMENT_THREAD:
    case SOCKET_EVENTS.UPDATE_COMMENT_THREAD: {
      const { thread } = event.payload[0];
      const threadInStore: CommentThread = yield select((state: AppState) =>
        commentThreadsSelector(thread?._id)(state),
      );

      const isThreadInStoreViewed = threadInStore?.isViewed;
      const isThreadFromEventViewed = thread?.viewedByUsers?.includes(
        currentUser?.username,
      );

      yield put(
        updateCommentThreadEvent({
          ...thread,
          isViewed: isThreadFromEventViewed,
        }),
      );

      if (isThreadInStoreViewed && !isThreadFromEventViewed) {
        yield put(incrementThreadUnreadCount());
      } else if (!isThreadInStoreViewed && isThreadFromEventViewed) {
        yield put(decrementThreadUnreadCount());
      }

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
