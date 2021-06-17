import { ReduxActionTypes } from "constants/ReduxActionConstants";
import { AppsmithNotification } from "entities/Notification";

export const fetchNotificationsRequest = (beforeTime?: string) => ({
  type: ReduxActionTypes.FETCH_NOTIFICATIONS_REQUEST,
  payload: beforeTime,
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

export const resetNotifications = (payload: {
  notifications: Array<AppsmithNotification>;
}) => ({
  type: ReduxActionTypes.RESET_NOTIFICATIONS,
  payload,
});

export const fetchUnreadNotificationsCountRequest = () => ({
  type: ReduxActionTypes.FETCH_UNREAD_NOTIFICATIONS_COUNT_REQUEST,
});

export const fetchUnreadNotificationsCountSuccess = (payload: number) => ({
  type: ReduxActionTypes.FETCH_UNREAD_NOTIFICATIONS_COUNT_SUCCESS,
  payload,
});

export const markNotificationAsReadRequest = (payload: string) => ({
  type: ReduxActionTypes.MARK_NOTIFICATION_AS_READ_REQUEST,
  payload,
});

export const markNotificationAsReadSuccess = (payload: string) => ({
  type: ReduxActionTypes.MARK_NOTIFICATION_AS_READ_SUCCESS,
  payload,
});
