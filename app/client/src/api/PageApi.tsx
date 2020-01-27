import Api from "./Api";
import { ContainerWidgetProps } from "widgets/ContainerWidget";
import { ApiResponse } from "./ApiResponses";
import { WidgetProps } from "widgets/BaseWidget";
import { AxiosPromise } from "axios";
import { PageAction } from "constants/ActionConstants";

export interface FetchPageRequest {
  pageId: string;
}

export interface FetchPublishedPageRequest {
  pageId: string;
}

export interface SavePageRequest {
  dsl: ContainerWidgetProps<WidgetProps>;
  layoutId: string;
  pageId: string;
}

export interface PageLayout {
  id: string;
  dsl: Partial<ContainerWidgetProps<any>>;
  layoutOnLoadActions: PageAction[];
  layoutActions: PageAction[];
}

export type FetchPageResponse = ApiResponse & {
  data: {
    id: string;
    name: string;
    applicationId: string;
    layouts: Array<PageLayout>;
  };
};

export type FetchPublishedPageResponse = ApiResponse & {
  data: {
    id: string;
    dsl: Partial<ContainerWidgetProps<any>>;
    pageId: string;
  };
};

export interface SavePageResponse extends ApiResponse {
  pageId: string;
}

export interface CreatePageRequest {
  applicationId: string;
  name: string;
}

export interface UpdatePageRequest {
  id: string;
  name: string;
}

export interface CreatePageResponse extends ApiResponse {
  data: {};
}

export interface FetchPageListResponse extends ApiResponse {
  data: Array<{
    id: string;
    name: string;
    isDefault: boolean;
    layouts: Array<PageLayout>;
  }>;
}

export interface DeletePageRequest {
  pageId: string;
}

class PageApi extends Api {
  static url = "v1/pages";
  static getLayoutUpdateURL = (pageId: string, layoutId: string) => {
    return `v1/layouts/${layoutId}/pages/${pageId}`;
  };

  static getPublishedPageURL = (pageId: string) => {
    return `v1/pages/${pageId}/view`;
  };

  static updatePageUrl = (pageId: string) => `${PageApi.url}/${pageId}`;

  static fetchPage(
    pageRequest: FetchPageRequest,
  ): AxiosPromise<FetchPageResponse> {
    return Api.get(PageApi.url + "/" + pageRequest.pageId);
  }

  static savePage(
    savePageRequest: SavePageRequest,
  ): AxiosPromise<SavePageResponse> {
    const body = { dsl: savePageRequest.dsl };
    return Api.put(
      PageApi.getLayoutUpdateURL(
        savePageRequest.pageId,
        savePageRequest.layoutId,
      ),
      body,
    );
  }

  static fetchPublishedPage(
    pageRequest: FetchPublishedPageRequest,
  ): AxiosPromise<FetchPublishedPageResponse> {
    return Api.get(PageApi.getPublishedPageURL(pageRequest.pageId));
  }

  static createPage(
    createPageRequest: CreatePageRequest,
  ): AxiosPromise<FetchPageResponse> {
    return Api.post(PageApi.url, createPageRequest);
  }

  static updatePage(request: UpdatePageRequest): AxiosPromise<ApiResponse> {
    return Api.put(PageApi.updatePageUrl(request.id), request);
  }

  static fetchPageList(
    applicationId: string,
  ): AxiosPromise<FetchPageListResponse> {
    return Api.get(PageApi.url + "/application/" + applicationId);
  }

  static deletePage(request: DeletePageRequest): AxiosPromise<ApiResponse> {
    return Api.delete(PageApi.url + "/" + request.pageId);
  }
}

export default PageApi;
