import { put, select } from "redux-saga/effects";
import { APP_LEVEL_SOCKET_EVENTS } from "./socketEvents";

import {
  newCommentEvent,
  newCommentThreadEvent,
  updateCommentThreadEvent,
  updateCommentEvent,
  deleteCommentThreadEvent,
  deleteCommentEvent,
} from "actions/commentActions";
import { collabSetAppEditors } from "actions/appCollabActions";
import { newNotificationEvent } from "actions/notificationActions";
import { getCurrentUser } from "selectors/usersSelectors";
import { Toaster } from "components/ads/Toast";
import {
  createMessage,
  INFO_VERSION_MISMATCH_FOUND_RELOAD_REQUEST,
} from "@appsmith/constants/messages";
import { Variant } from "components/ads/common";
import React from "react";
import { getAppsmithConfigs } from "@appsmith/configs";

export default function* handleAppLevelSocketEvents(event: any) {
  const currentUser = yield select(getCurrentUser);

  switch (event.type) {
    // comments
    case APP_LEVEL_SOCKET_EVENTS.INSERT_COMMENT_THREAD: {
      const { thread } = event.payload[0];
      const isThreadFromEventViewed = thread?.viewedByUsers?.includes(
        currentUser?.username,
      );
      yield put(
        newCommentThreadEvent({
          ...thread,
          // This is necessary to be done from the start, as client depends on
          // these values to find if there is an unread thread.
          isViewed: isThreadFromEventViewed || thread?.resolvedState?.active,
        }),
      );
      return;
    }
    case APP_LEVEL_SOCKET_EVENTS.INSERT_COMMENT: {
      yield put(newCommentEvent(event.payload[0]));
      return;
    }
    case APP_LEVEL_SOCKET_EVENTS.REPLACE_COMMENT_THREAD:
    case APP_LEVEL_SOCKET_EVENTS.UPDATE_COMMENT_THREAD: {
      const { thread } = event.payload[0];

      const isThreadFromEventViewed = thread?.viewedByUsers?.includes(
        currentUser?.username,
      );

      yield put(
        updateCommentThreadEvent({
          ...thread,
          isViewed: isThreadFromEventViewed || thread?.resolvedState?.active, // resolved threads can't be unread
        }),
      );
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
    // notification on release version
    case APP_LEVEL_SOCKET_EVENTS.RELEASE_VERSION_NOTIFICATION: {
      const { appVersion } = getAppsmithConfigs();
      if (appVersion.id != event.payload[0]) {
        Toaster.show({
          text: createMessage(INFO_VERSION_MISMATCH_FOUND_RELOAD_REQUEST),
          variant: Variant.info,
          actionElement: (
            <span onClick={() => location.reload(true)}>REFRESH</span>
          ),
          autoClose: false,
        });
      }
      return;
    }
  }
}
