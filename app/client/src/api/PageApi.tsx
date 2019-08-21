import Api from "./Api"
import { IContainerWidgetProps } from "../widgets/ContainerWidget"
import { ApiResponse } from "./ApiResponses"
import { RenderMode } from "../constants/WidgetConstants";

export interface PageRequest {
  pageId: string,
  renderMode: RenderMode
}

export interface SavePageRequest {
  pageWidget: IContainerWidgetProps<any>
}

export interface PageResponse extends ApiResponse {
  pageWidget: IContainerWidgetProps<any>
}

export interface SavePageResponse {
  pageId: string
}

class PageApi extends Api {
  static url: string = "/page"
  
  static fetchPage(pageRequest: PageRequest): Promise<PageResponse> {
    return Api.get(PageApi.url + "/" + pageRequest.pageId, pageRequest)
  }

  static savePage(savePageRequest: SavePageRequest): Promise<PageResponse> {
    return Api.post(PageApi.url, undefined, savePageRequest)
  }
}



export default PageApi
