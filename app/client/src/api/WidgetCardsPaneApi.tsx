import Api from "./Api"
import { IWidgetCardProps } from "../widgets/BaseWidget"
import { IContainerWidgetProps } from "../widgets/ContainerWidget"
import { ApiResponse } from "./ApiResponses"

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
