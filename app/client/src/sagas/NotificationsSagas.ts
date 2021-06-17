import { call, takeLatest, put, all } from "redux-saga/effects";
import NotificationApi from "api/NotificationsAPI";
import { ReduxAction, ReduxActionTypes } from "constants/ReduxActionConstants";
import { validateResponse } from "./ErrorSagas";

import {
  markAllNotificationsAsReadSuccess,
  resetNotifications,
  fetchNotificationsSuccess,
  fetchUnreadNotificationsCountSuccess,
  fetchUnreadNotificationsCountRequest,
  markNotificationAsReadSuccess,
} from "actions/notificationActions";

export function* fetchNotifications(action: ReduxAction<string>) {
  try {
    const response = yield call(
      NotificationApi.fetchNotifications,
      action.payload,
    );
    const isValidResponse = yield validateResponse(response);
    if (isValidResponse) {
      yield put(fetchNotificationsSuccess({ notifications: response.data }));
    }
  } catch (error) {
    console.log(error, "error");
  }
}

/**
 * 1. mark all as read
 * 2. reset notifications
 * 3. reset unread notificaions count
 */
function* markAllNotificationsAsRead() {
  try {
    const response = yield call(NotificationApi.markAllNotificationsAsRead);
    const isValidResponse = yield validateResponse(response);
    if (isValidResponse) {
      yield put(markAllNotificationsAsReadSuccess());
      const response = yield call(NotificationApi.fetchNotifications);
      const isValidResponse = yield validateResponse(response);
      if (isValidResponse) {
        yield put(resetNotifications({ notifications: response.data }));
      }
      yield put(fetchUnreadNotificationsCountRequest());
    }
  } catch (error) {
    console.log(error, "error");
  }
}

function* fetchUnreadNotificationsCount() {
  try {
    const response = yield call(NotificationApi.fetchUnreadNotificationsCount);
    const isValidResponse = yield validateResponse(response);
    if (isValidResponse) {
      yield put(fetchUnreadNotificationsCountSuccess(response.data));
    }
  } catch (error) {
    console.log(error, "error");
  }
}

function* markNotificationAsRead(action: ReduxAction<string>) {
  try {
    const response = yield call(NotificationApi.markNotificationsAsRead, [
      action.payload,
    ]);
    const isValidResponse = yield validateResponse(response);
    if (isValidResponse) {
      yield put(fetchUnreadNotificationsCountSuccess(response.data));
      yield put(markNotificationAsReadSuccess(action.payload));
    }
  } catch (error) {
    console.log(error, "error");
  }
}

export default function* notificationsSagas() {
  yield all([
    takeLatest(
      ReduxActionTypes.FETCH_NOTIFICATIONS_REQUEST,
      fetchNotifications,
    ),
    takeLatest(
      ReduxActionTypes.MARK_ALL_NOTIFICATIONS_AS_READ_REQUEST,
      markAllNotificationsAsRead,
    ),
    takeLatest(
      ReduxActionTypes.FETCH_UNREAD_NOTIFICATIONS_COUNT_REQUEST,
      fetchUnreadNotificationsCount,
    ),
    takeLatest(
      ReduxActionTypes.MARK_NOTIFICATION_AS_READ_REQUEST,
      markNotificationAsRead,
    ),
  ]);
}
