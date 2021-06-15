import { ReduxActionTypes } from "constants/ReduxActionConstants";
import { AppsmithNotification } from "entities/Notification";

export const fetchNotificationsRequest = () => ({
  type: ReduxActionTypes.FETCH_NOTIFICATIONS_REQUEST,
});

export const fetchNotificationsSuccess = (payload: {
  notifications: Array<AppsmithNotification>;
}) => ({
  type: ReduxActionTypes.FETCH_NOTIFICATIONS_SUCCESS,
  payload,
});

export const newNotificationEvent = (payload: Notification) => ({
  type: ReduxActionTypes.NEW_NOTIFICATION_EVENT,
  payload,
});

export const setIsNotificationsListVisible = (payload: boolean) => ({
  type: ReduxActionTypes.SET_IS_NOTIFICATIONS_LIST_VISIBLE,
  payload,
});

export const markAllNotificationsAsReadRequest = () => ({
  type: ReduxActionTypes.MARK_ALL_NOTIFICATIONS_AS_READ_REQUEST,
});

export const markAllNotificationsAsReadSuccess = () => ({
  type: ReduxActionTypes.MARK_ALL_NOTIFICATIONS_AS_READ_SUCCESS,
});
