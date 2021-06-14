import { ReduxAction, ReduxActionTypes } from "constants/ReduxActionConstants";
import { AppsmithNotification } from "entities/Notification";
import { uniqBy } from "lodash";
import { createReducer } from "utils/AppsmithUtils";

const initialState: NotificationReducerState = {
  unreadNotificationsCount: 0,
  showNotificationsMenu: false,
  notifications: [],
};

const tourReducer = createReducer(initialState, {
  [ReduxActionTypes.FETCH_NOTIFICATIONS_SUCCESS]: (
    state: NotificationReducerState,
    action: ReduxAction<{ notifications: Array<AppsmithNotification> }>,
  ) => ({
    ...state,
    notifications: action.payload.notifications,
  }),
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
    unreadNotificationsCount: action.payload
      ? 0
      : state.unreadNotificationsCount,
  }),
});

export type NotificationReducerState = {
  unreadNotificationsCount: number;
  notifications: Array<AppsmithNotification>;
  showNotificationsMenu: boolean;
};

export default tourReducer;
