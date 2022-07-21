import { call, takeLatest, put, all } from "redux-saga/effects";
import NotificationApi from "api/NotificationsAPI";
import {
  ReduxAction,
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import { validateResponse } from "./ErrorSagas";

import {
  markAllNotificationsAsReadSuccess,
  resetNotifications,
  fetchNotificationsSuccess,
  fetchUnreadNotificationsCountSuccess,
  fetchUnreadNotificationsCountRequest,
  markNotificationAsReadSuccess,
} from "actions/notificationActions";
import { ApiResponse } from "api/ApiResponses";

export function* fetchNotifications(action: ReduxAction<string>) {
  try {
    const response: ApiResponse = yield call(
      NotificationApi.fetchNotifications,
      action.payload,
    );
    const isValidResponse: boolean = yield validateResponse(response);
    if (isValidResponse) {
      //@ts-expect-error: response is of type unknown
      yield put(fetchNotificationsSuccess({ notifications: response.data }));
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.FETCH_NOTIFICATIONS_ERROR,
      payload: { error, logToSentry: true },
    });
  }
}

/**
 * 1. mark all as read
 * 2. reset notifications
 * 3. reset unread notificaions count
 */
function* markAllNotificationsAsRead() {
  try {
    const response: ApiResponse = yield call(
      NotificationApi.markAllNotificationsAsRead,
    );
    const isValidResponse: boolean = yield validateResponse(response);
    if (isValidResponse) {
      yield put(markAllNotificationsAsReadSuccess());
      const response: ApiResponse = yield call(
        NotificationApi.fetchNotifications,
      );
      const isValidResponse: boolean = yield validateResponse(response);
      if (isValidResponse) {
        //@ts-expect-error: response is of type unknown
        yield put(resetNotifications({ notifications: response.data }));
      }
      yield put(fetchUnreadNotificationsCountRequest());
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.MARK_ALL_NOTIFICAIONS_AS_READ_ERROR,
      payload: { error, logToSentry: true },
    });
  }
}

function* fetchUnreadNotificationsCount() {
  try {
    const response: ApiResponse = yield call(
      NotificationApi.fetchUnreadNotificationsCount,
    );
    const isValidResponse: boolean = yield validateResponse(response);
    if (isValidResponse) {
      //@ts-expect-error: response is of type unknown
      yield put(fetchUnreadNotificationsCountSuccess(response.data));
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.FETCH_UNREAD_NOTIFICATIONS_COUNT_ERROR,
      payload: { error, logToSentry: true },
    });
  }
}

function* markNotificationAsRead(action: ReduxAction<string>) {
  try {
    const response: ApiResponse = yield call(
      NotificationApi.markNotificationsAsRead,
      [action.payload],
    );
    const isValidResponse: boolean = yield validateResponse(response);
    if (isValidResponse) {
      //@ts-expect-error: response is of type unknown
      yield put(fetchUnreadNotificationsCountSuccess(response.data));
      yield put(markNotificationAsReadSuccess(action.payload));
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.MARK_NOTIFICATION_AS_READ_ERROR,
      payload: { error, logToSentry: true },
    });
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
