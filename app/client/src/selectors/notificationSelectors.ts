import { AppState } from "reducers";

export const notificationsSelector = (state: AppState) =>
  state.ui.notifications.notifications;

export const unreadCountSelector = (state: AppState) =>
  state.ui.notifications.unreadNotificationsCount;

export const isNotificationsListVisibleSelector = (state: AppState) =>
  state.ui.notifications.showNotificationsMenu;

export const fetchingNotificationsSelector = (state: AppState) =>
  state.ui.notifications.fetchingNotifications;
