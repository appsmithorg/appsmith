import Api from "./Api"
import { IWidgetCardProps } from "../widgets/BaseWidget"

export interface WidgetCardsPaneResponse {
  cards : { [id: string]: IWidgetCardProps[]}
}
export interface WidgetCardsPaneRequest {}

class WidgetCardsPaneApi extends Api {
  static url: string = "/widgetCards"
  static fetchWidgetCards(): Promise<WidgetCardsPaneResponse> {
    return Api.get(WidgetCardsPaneApi.url, {})
  }
}


export default WidgetCardsPaneApi
