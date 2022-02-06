import { ReduxAction, ReduxActionTypes } from "constants/ReduxActionConstants";
import { AppsmithNotification } from "entities/Notification";
import { uniqBy } from "lodash";
import { createReducer } from "utils/AppsmithUtils";

const initialState: NotificationReducerState = {
  unreadNotificationsCount: 0,
  showNotificationsMenu: false,
  notifications: [],
  fetchingNotifications: false,
};

const tourReducer = createReducer(initialState, {
  [ReduxActionTypes.FETCH_NOTIFICATIONS_REQUEST]: (
    state: NotificationReducerState,
  ) => ({
    ...state,
    fetchingNotifications: true,
  }),
  [ReduxActionTypes.RESET_NOTIFICATIONS]: (
    state: NotificationReducerState,
    action: ReduxAction<{ notifications: Array<AppsmithNotification> }>,
  ) => {
    return {
      ...state,
      fetchingNotifications: false,
      notifications: action.payload.notifications,
    };
  },
  [ReduxActionTypes.FETCH_NOTIFICATIONS_SUCCESS]: (
    state: NotificationReducerState,
    action: ReduxAction<{ notifications: Array<AppsmithNotification> }>,
  ) => {
    return {
      ...state,
      fetchingNotifications: false,
      notifications: uniqBy(
        [...state.notifications, ...action.payload.notifications],
        "id",
      ),
    };
  },
  [ReduxActionTypes.NEW_NOTIFICATION_EVENT]: (
    state: NotificationReducerState,
    action: ReduxAction<AppsmithNotification>,
  ) => {
    if (!state.showNotificationsMenu) {
      state.unreadNotificationsCount += 1;
    }

    return {
      ...state,
      notifications: uniqBy(
        [{ ...action.payload, id: action.payload._id }, ...state.notifications],
        "id",
      ),
    };
  },
  [ReduxActionTypes.SET_IS_NOTIFICATIONS_LIST_VISIBLE]: (
    state: NotificationReducerState,
    action: ReduxAction<boolean>,
  ) => ({
    ...state,
    showNotificationsMenu: action.payload,
  }),
  [ReduxActionTypes.FETCH_UNREAD_NOTIFICATIONS_COUNT_SUCCESS]: (
    state: NotificationReducerState,
    action: ReduxAction<number>,
  ) => ({
    ...state,
    unreadNotificationsCount: action.payload,
  }),
  [ReduxActionTypes.MARK_NOTIFICATION_AS_READ_SUCCESS]: (
    state: NotificationReducerState,
    action: ReduxAction<string>,
  ) => {
    const notification = state.notifications.find(
      (notification: AppsmithNotification) => {
        const { _id, id } = notification;
        const notificationId = _id || id;
        return notificationId === action.payload;
      },
    );

    if (notification) {
      notification.isRead = true;
    }

    return {
      ...state,
      notifications: [...state.notifications],
    };
  },
});

export type NotificationReducerState = {
  unreadNotificationsCount: number;
  notifications: Array<AppsmithNotification>;
  showNotificationsMenu: boolean;
  fetchingNotifications: boolean;
};

export default tourReducer;
