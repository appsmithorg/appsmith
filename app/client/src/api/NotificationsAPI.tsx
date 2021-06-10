import { AxiosPromise } from "axios";
import Api from "./Api";
import { ApiResponse } from "./ApiResponses";

class NotificaitonsApi extends Api {
  static baseURL = "v1/notifications";

  static fetchNotifications(): AxiosPromise<ApiResponse> {
    return Api.get(NotificaitonsApi.baseURL);
  }

  // TODO update mark all as read notifications api
  static markAllNotificationsAsRead(): AxiosPromise<ApiResponse> {
    return Api.get(NotificaitonsApi.baseURL);
  }
}

export default NotificaitonsApi;
