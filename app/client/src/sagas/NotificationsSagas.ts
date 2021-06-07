import { call, takeLatest, put, all } from "redux-saga/effects";
import NotificationApi from "api/NotificationsAPI";
import { ReduxActionTypes } from "constants/ReduxActionConstants";
import { validateResponse } from "./ErrorSagas";

// import { markAllNotificationsAsReadSuccess } from "actions/notificationActions";

export function* fetchNotifications() {
  try {
    const response = yield call(NotificationApi.fetchNotifications);
    const isValidResponse = yield validateResponse(response);
    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.FETCH_NOTIFICATIONS_SUCCESS,
        payload: { notifications: response.data },
      });
    }
  } catch (error) {
    console.log(error, "error");
  }
}

// TODO implement mark all notifications as read
function* markAllNotificationsAsRead() {
  // try {
  //   const response = yield call(NotificationApi.markAllNotificationsAsRead);
  //   const isValidResponse = yield validateResponse(response);
  //   if (isValidResponse) {
  //     yield put(markAllNotificationsAsReadSuccess());
  //   }
  // } catch (error) {
  //   console.log(error, "error");
  // }
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
  ]);
}
