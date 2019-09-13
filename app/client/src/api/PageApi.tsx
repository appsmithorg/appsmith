import Api from "./Api"
import { ContainerWidgetProps } from "../widgets/ContainerWidget"
import { ApiResponse } from "./ApiResponses"
import { RenderMode } from "../constants/WidgetConstants";
import { PageAction } from '../constants/ActionConstants';

export interface PageRequest {
  pageId: string;
  renderMode: RenderMode;
}

export interface SavePageRequest {
  pageWidget: ContainerWidgetProps<any>;
}

export interface PageLayout {
  dsl: ContainerWidgetProps<any>
  actions: PageAction[]
}

export interface PageResponse extends ApiResponse {
  layout: PageLayout
}

export interface SavePageResponse {
  pageId: string;
}

class PageApi extends Api {
  static url = "/page"
  
  static fetchPage(pageRequest: PageRequest): Promise<PageResponse> {
    return Api.get(PageApi.url + "/" + pageRequest.pageId, pageRequest)
  }

  static savePage(savePageRequest: SavePageRequest): Promise<PageResponse> {
    return Api.post(PageApi.url, undefined, savePageRequest)
  }
}



export default PageApi
