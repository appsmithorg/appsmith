import { put, select } from "redux-saga/effects";
import { APP_LEVEL_SOCKET_EVENTS } from "./socketEvents";

import {
  newCommentEvent,
  newCommentThreadEvent,
  updateCommentThreadEvent,
  updateCommentEvent,
  incrementThreadUnreadCount,
  decrementThreadUnreadCount,
  deleteCommentThreadEvent,
  deleteCommentEvent,
} from "actions/commentActions";
import { collabSetAppEditors } from "actions/appCollabActions";
import { newNotificationEvent } from "actions/notificationActions";
import { getCurrentUser } from "selectors/usersSelectors";
import { getCurrentApplication } from "selectors/applicationSelectors";
import { commentThreadsSelector } from "selectors/commentsSelectors";
import { AppState } from "reducers";
import { CommentThread } from "entities/Comments/CommentsInterfaces";

export default function* handleAppLevelSocketEvents(event: any) {
  const currentUser = yield select(getCurrentUser);
  const currentApplication = yield select(getCurrentApplication);

  switch (event.type) {
    // comments
    case APP_LEVEL_SOCKET_EVENTS.INSERT_COMMENT_THREAD: {
      yield put(newCommentThreadEvent(event.payload[0]));

      const { thread } = event.payload[0];
      const isForCurrentApplication =
        thread?.applicationId === currentApplication?.id;

      const isCreatedByMe = thread?.authorUsername === currentUser.username;
      if (!isCreatedByMe && isForCurrentApplication)
        yield put(incrementThreadUnreadCount());
      return;
    }
    case APP_LEVEL_SOCKET_EVENTS.INSERT_COMMENT: {
      yield put(newCommentEvent(event.payload[0]));
      return;
    }
    case APP_LEVEL_SOCKET_EVENTS.REPLACE_COMMENT_THREAD:
    case APP_LEVEL_SOCKET_EVENTS.UPDATE_COMMENT_THREAD: {
      const { thread } = event.payload[0];
      const threadInStore: CommentThread = yield select((state: AppState) =>
        commentThreadsSelector(thread?._id)(state),
      );

      const isThreadInStoreViewed = threadInStore?.isViewed;

      const isNowResolved =
        !threadInStore?.resolvedState?.active && thread?.resolvedState?.active;

      const isThreadFromEventViewed = thread?.viewedByUsers?.includes(
        currentUser?.username,
      );

      yield put(
        updateCommentThreadEvent({
          ...thread,
          isViewed: isThreadFromEventViewed || thread?.resolvedState?.active, // resolved threads can't be unread
        }),
      );

      if (isThreadInStoreViewed && !isThreadFromEventViewed) {
        yield put(incrementThreadUnreadCount());
      } else if (
        !isThreadInStoreViewed &&
        (isThreadFromEventViewed || isNowResolved)
      ) {
        yield put(decrementThreadUnreadCount());
      }

      return;
    }
    case APP_LEVEL_SOCKET_EVENTS.UPDATE_COMMENT: {
      yield put(updateCommentEvent(event.payload[0].comment));
      return;
    }
    case APP_LEVEL_SOCKET_EVENTS.DELETE_COMMENT_THREAD: {
      yield put(deleteCommentThreadEvent(event.payload[0].thread));
      return;
    }
    case APP_LEVEL_SOCKET_EVENTS.DELETE_COMMENT: {
      yield put(deleteCommentEvent(event.payload[0].comment));
      return;
    }
    // notifications
    case APP_LEVEL_SOCKET_EVENTS.INSERT_NOTIFICATION: {
      yield put(newNotificationEvent(event.payload[0].notification));
      return;
    }
    // Collab V2 - Realtime Editing
    case APP_LEVEL_SOCKET_EVENTS.LIST_ONLINE_APP_EDITORS: {
      yield put(collabSetAppEditors(event.payload[0]));
      return;
    }
  }
}
