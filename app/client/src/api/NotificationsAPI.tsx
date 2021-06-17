import { AxiosPromise } from "axios";
import Api from "./Api";
import { ApiResponse } from "./ApiResponses";

class NotificationsApi extends Api {
  static baseURL = "v1/notifications";
  static markAsReadURL = `${NotificationsApi.baseURL}/isRead`;
  static markAllAsReadURL = `${NotificationsApi.markAsReadURL}/all`;
  static fetchUnreadNotificationsCountURL = `${NotificationsApi.baseURL}/count/unread`;

  static fetchNotifications(beforeTime?: string): AxiosPromise<ApiResponse> {
    return Api.get(NotificationsApi.baseURL, { beforeTime });
  }

  static markAllNotificationsAsRead(): AxiosPromise<ApiResponse> {
    return Api.patch(NotificationsApi.markAllAsReadURL, { isRead: true });
  }

  static fetchUnreadNotificationsCount(): AxiosPromise<ApiResponse> {
    return Api.get(NotificationsApi.fetchUnreadNotificationsCountURL);
  }

  static markNotificationsAsRead(
    ids: Array<string>,
  ): AxiosPromise<ApiResponse> {
    return Api.patch(NotificationsApi.markAsReadURL, {
      isRead: true,
      idList: ids,
    });
  }
}

export default NotificationsApi;
