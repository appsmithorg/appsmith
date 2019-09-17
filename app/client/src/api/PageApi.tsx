import Api from "./Api";
import { ContainerWidgetProps } from "../widgets/ContainerWidget";
import { ApiResponse } from "./ApiResponses";
import { WidgetProps } from "../widgets/BaseWidget";
import { RenderMode } from "../constants/WidgetConstants";
import { PageAction } from "../constants/ActionConstants";

export interface FetchPageRequest {
  pageId: string;
  renderMode: RenderMode;
}

export interface SavePageRequest {
  pageWidget: ContainerWidgetProps<WidgetProps>;
}

export interface PageLayout {
  dsl: ContainerWidgetProps<any>;
  actions: PageAction[];
}

export interface FetchPageResponse extends ApiResponse {
  layout: PageLayout;
}

export interface SavePageResponse {
  pageId: string;
}

class PageApi extends Api {
  static url = "/page";

  static fetchPage(pageRequest: FetchPageRequest): Promise<FetchPageResponse> {
    return Api.get(PageApi.url + "/" + pageRequest.pageId, pageRequest);
  }

  static savePage(savePageRequest: SavePageRequest): Promise<SavePageResponse> {
    return Api.post(PageApi.url, undefined, savePageRequest);
  }
}

export default PageApi;
