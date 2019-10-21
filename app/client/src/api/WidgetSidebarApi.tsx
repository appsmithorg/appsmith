import Api from "./Api";
import { WidgetCardProps } from "../widgets/BaseWidget";

export interface WidgetSidebarResponse {
  cards: { [id: string]: WidgetCardProps[] };
}
// export interface WidgetCardsPaneRequest {}

class WidgetSidebarApi extends Api {
  static url = "/widgetCards";
  static fetchWidgetCards(): Promise<WidgetSidebarResponse> {
    return Api.get(WidgetSidebarApi.url);
  }
}

export default WidgetSidebarApi;
