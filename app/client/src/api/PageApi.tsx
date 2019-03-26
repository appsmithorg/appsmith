import Api from "./Api"
import { IContainerWidgetProps } from "../widgets/ContainerWidget"
import { ApiResponse } from "./ApiResponses"

export interface PageRequest {
  pageId: string
}

export interface PageResponse extends ApiResponse {
  pageWidget: IContainerWidgetProps<any>
}

class PageApi extends Api {
  static url: string = "/page/"
  
  static fetchPage(pageRequest: PageRequest): Promise<PageResponse> {
    return Api.get(PageApi.url + pageRequest.pageId, pageRequest)
  }
}

export default PageApi
