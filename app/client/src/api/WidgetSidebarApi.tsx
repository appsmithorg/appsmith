import Api from "api/Api";
import { WidgetCardProps } from "widgets/BaseWidget";
import { AxiosPromise } from "axios";

export interface WidgetSidebarResponse {
  cards: { [id: string]: WidgetCardProps[] };
}
// export interface WidgetCardsPaneRequest {}

class WidgetSidebarApi extends Api {
  static url = "/widgetCards";
  static fetchWidgetCards(): AxiosPromise<WidgetSidebarResponse> {
    return Api.get(WidgetSidebarApi.url);
  }
}

export default WidgetSidebarApi;
