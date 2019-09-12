import Api from "./Api"
import { WidgetCardProps } from "../widgets/BaseWidget"

export interface WidgetCardsPaneResponse {
  cards: { [id: string]: WidgetCardProps[]}
}
export interface WidgetCardsPaneRequest {}

class WidgetCardsPaneApi extends Api {
  static url = "/widgetCards"
  static fetchWidgetCards(): Promise<WidgetCardsPaneResponse> {
    return Api.get(WidgetCardsPaneApi.url)
  }
}


export default WidgetCardsPaneApi
