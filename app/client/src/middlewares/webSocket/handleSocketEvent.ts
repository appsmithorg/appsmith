import {
  APP_COMMENTS_SOCKET_EVENTS,
  APP_MULTIPLAYER_SOCKET_EVENTS,
} from "./constants";

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

import { newNotificationEvent } from "actions/notificationActions";
import { getCurrentUser } from "selectors/usersSelectors";
import { getCurrentApplication } from "selectors/applicationSelectors";
import { commentThreadsSelector } from "selectors/commentsSelectors";
import { AppState } from "reducers";
import { CommentThread } from "entities/Comments/CommentsInterfaces";
import {
  collabListAppEditorsEvent,
  collabSetEditorsPointersData,
  collabUnSetEditorsPointersData,
} from "actions/appCollabActions";

export function handleAppEditSocketEvent(event: any, store: any) {
  const state: AppState = store.getState();
  const currentUser = getCurrentUser(state);
  const currentApplication = getCurrentApplication(state);

  switch (event.type) {
    // comments
    case APP_COMMENTS_SOCKET_EVENTS.INSERT_COMMENT_THREAD: {
      store.dispatch(newCommentThreadEvent(event.payload[0]));

      const { thread } = event.payload[0];
      const isForCurrentApplication =
        thread?.applicationId === currentApplication?.id;

      const isCreatedByMe = thread?.authorUsername === currentUser?.username;
      if (!isCreatedByMe && isForCurrentApplication)
        store.dispatch(incrementThreadUnreadCount());
      return;
    }
    case APP_COMMENTS_SOCKET_EVENTS.INSERT_COMMENT: {
      store.dispatch(newCommentEvent(event.payload[0]));
      return;
    }
    case APP_COMMENTS_SOCKET_EVENTS.REPLACE_COMMENT_THREAD:
    case APP_COMMENTS_SOCKET_EVENTS.UPDATE_COMMENT_THREAD: {
      const { thread } = event.payload[0];
      const threadInStore: CommentThread = commentThreadsSelector(thread?._id)(
        state,
      );

      const isThreadInStoreViewed = threadInStore?.isViewed;

      const isNowResolved =
        !threadInStore?.resolvedState?.active && thread?.resolvedState?.active;

      const isThreadFromEventViewed = thread?.viewedByUsers?.includes(
        currentUser?.username,
      );

      store.dispatch(
        updateCommentThreadEvent({
          ...thread,
          isViewed: isThreadFromEventViewed || thread?.resolvedState?.active, // resolved threads can't be unread
        }),
      );

      if (isThreadInStoreViewed && !isThreadFromEventViewed) {
        store.dispatch(incrementThreadUnreadCount());
      } else if (
        !isThreadInStoreViewed &&
        (isThreadFromEventViewed || isNowResolved)
      ) {
        store.dispatch(decrementThreadUnreadCount());
      }

      return;
    }
    case APP_COMMENTS_SOCKET_EVENTS.UPDATE_COMMENT: {
      store.dispatch(updateCommentEvent(event.payload[0].comment));
      return;
    }
    case APP_COMMENTS_SOCKET_EVENTS.DELETE_COMMENT_THREAD: {
      store.dispatch(deleteCommentThreadEvent(event.payload[0].thread));
      return;
    }
    case APP_COMMENTS_SOCKET_EVENTS.DELETE_COMMENT: {
      store.dispatch(deleteCommentEvent(event.payload[0].comment));
      return;
    }
    // notifications
    case APP_COMMENTS_SOCKET_EVENTS.INSERT_NOTIFICATION: {
      store.dispatch(newNotificationEvent(event.payload[0].notification));
      return;
    }
    // Collab V2 - Realtime Editing
    case APP_MULTIPLAYER_SOCKET_EVENTS.LIST_ONLINE_APP_EDITORS: {
      store.dispatch(collabListAppEditorsEvent(event.payload[0]));
      return;
    }
  }
}

type PointerEventDataType = {
  data: { x: number; y: number };
  socketId: string;
  user: any;
};

export function handlePageEditSocketEvent(
  event: any,
  store: any,
  socketId?: string,
) {
  switch (event.type) {
    case APP_MULTIPLAYER_SOCKET_EVENTS.SHARE_USER_POINTER: {
      if (socketId !== event.payload[0].socketId) {
        store.dispatch(
          collabSetEditorsPointersData(
            event.payload[0] as PointerEventDataType,
          ),
        );
      }
      return;
    }
    case APP_MULTIPLAYER_SOCKET_EVENTS.STOP_EDITING_APP: {
      store.dispatch(collabUnSetEditorsPointersData(socketId));
      return;
    }
  }
}
