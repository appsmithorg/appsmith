import Api from "api/Api";
import { ApiResponse } from "./ApiResponses";
import axios, { AxiosPromise, CancelTokenSource } from "axios";
import { PageAction } from "constants/AppsmithActionConstants/ActionConstants";
import { DSLWidget } from "widgets/constants";
import {
  ClonePageActionPayload,
  CreatePageActionPayload,
} from "actions/pageActions";

export interface FetchPageRequest {
  id: string;
  isFirstLoad?: boolean;
}

export interface FetchPublishedPageRequest {
  pageId: string;
  bustCache?: boolean;
}

export interface SavePageRequest {
  dsl: DSLWidget;
  layoutId: string;
  pageId: string;
}

export interface PageLayout {
  id: string;
  dsl: Partial<DSLWidget>;
  layoutOnLoadActions: PageAction[][];
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
    dsl: Partial<DSLWidget>;
    pageId: string;
  };
};

export interface SavePageResponse extends ApiResponse {
  data: {
    id: string;
    layoutOnLoadActions: PageAction[][];
    dsl: Partial<DSLWidget>;
    messages: string[];
    actionUpdates: Array<{
      executeOnLoad: boolean;
      id: string;
      name: string;
    }>;
  };
}

export type CreatePageRequest = Omit<
  CreatePageActionPayload,
  "blockNavigation"
>;

export interface UpdatePageRequest {
  id: string;
  name: string;
  isHidden?: boolean;
}

export interface SetPageOrderRequest {
  order: number;
  pageId: string;
  applicationId: string;
}

export interface CreatePageResponse extends ApiResponse {
  data: unknown;
}

export interface FetchPageListResponse extends ApiResponse {
  data: {
    pages: Array<{
      id: string;
      name: string;
      isDefault: boolean;
      isHidden?: boolean;
      layouts: Array<PageLayout>;
    }>;
    organizationId: string;
  };
}

export interface DeletePageRequest {
  id: string;
}

export type ClonePageRequest = Omit<ClonePageActionPayload, "blockNavigation">;

export interface UpdateWidgetNameRequest {
  pageId: string;
  layoutId: string;
  newName: string;
  oldName: string;
}

export interface UpdateWidgetNameResponse extends ApiResponse {
  data: PageLayout;
}

export interface GenerateTemplatePageRequest {
  pageId: string;
  tableName: string;
  datasourceId: string;
  applicationId: string;
  columns?: string[];
  searchColumn?: string;
  mode?: string;
  pluginSpecificParams?: Record<any, any>;
}

export type GenerateTemplatePageRequestResponse = ApiResponse & {
  data: {
    id: string;
    name: string;
    applicationId: string;
    layouts: Array<PageLayout>;
  };
};

class PageApi extends Api {
  static url = "v1/pages";
  static refactorLayoutURL = "v1/layouts/refactor";
  static pageUpdateCancelTokenSource?: CancelTokenSource = undefined;
  static getLayoutUpdateURL = (pageId: string, layoutId: string) => {
    return `v1/layouts/${layoutId}/pages/${pageId}`;
  };

  static getGenerateTemplateURL = (pageId?: string) => {
    return `${PageApi.url}/crud-page${pageId ? `/${pageId}` : ""}`;
  };

  static getPublishedPageURL = (pageId: string, bustCache?: boolean) => {
    const url = `v1/pages/${pageId}/view`;
    return !!bustCache ? url + "?v=" + +new Date() : url;
  };

  static updatePageUrl = (pageId: string) => `${PageApi.url}/${pageId}`;
  static setPageOrderUrl = (
    applicationId: string,
    pageId: string,
    order: number,
  ) => `v1/applications/${applicationId}/page/${pageId}/reorder?order=${order}`;

  static fetchPage(
    pageRequest: FetchPageRequest,
  ): AxiosPromise<FetchPageResponse> {
    return Api.get(PageApi.url + "/" + pageRequest.id);
  }

  static savePage(
    savePageRequest: SavePageRequest,
  ): AxiosPromise<SavePageResponse> | undefined {
    if (PageApi.pageUpdateCancelTokenSource) {
      PageApi.pageUpdateCancelTokenSource.cancel();
    }
    const body = { dsl: savePageRequest.dsl };
    PageApi.pageUpdateCancelTokenSource = axios.CancelToken.source();
    return Api.put(
      PageApi.getLayoutUpdateURL(
        savePageRequest.pageId,
        savePageRequest.layoutId,
      ),
      body,
      undefined,
      { cancelToken: PageApi.pageUpdateCancelTokenSource.token },
    );
  }

  static fetchPublishedPage(
    pageRequest: FetchPublishedPageRequest,
  ): AxiosPromise<FetchPublishedPageResponse> {
    return Api.get(
      PageApi.getPublishedPageURL(pageRequest.pageId, pageRequest.bustCache),
    );
  }

  static createPage(
    createPageRequest: CreatePageRequest,
  ): AxiosPromise<FetchPageResponse> {
    return Api.post(PageApi.url, createPageRequest);
  }

  static updatePage(request: UpdatePageRequest): AxiosPromise<ApiResponse> {
    return Api.put(PageApi.updatePageUrl(request.id), request);
  }

  static generateTemplatePage(
    request: GenerateTemplatePageRequest,
  ): AxiosPromise<ApiResponse> {
    if (request.pageId) {
      return Api.put(PageApi.getGenerateTemplateURL(request.pageId), request);
    } else {
      return Api.post(PageApi.getGenerateTemplateURL(), request);
    }
  }

  static fetchPageList(
    applicationId: string,
  ): AxiosPromise<FetchPageListResponse> {
    return Api.get(PageApi.url + "/application/" + applicationId);
  }

  static fetchPageListViewMode(
    applicationId: string,
  ): AxiosPromise<FetchPageListResponse> {
    return Api.get(PageApi.url + "/view/application/" + applicationId);
  }

  static deletePage(request: DeletePageRequest): AxiosPromise<ApiResponse> {
    return Api.delete(PageApi.url + "/" + request.id);
  }

  static clonePage(request: ClonePageRequest): AxiosPromise<ApiResponse> {
    return Api.post(PageApi.url + "/clone/" + request.id);
  }

  static updateWidgetName(
    request: UpdateWidgetNameRequest,
  ): AxiosPromise<UpdateWidgetNameResponse> {
    return Api.put(PageApi.refactorLayoutURL, request);
  }

  static setPageOrder(
    request: SetPageOrderRequest,
  ): AxiosPromise<FetchPageListResponse> {
    return Api.put(
      PageApi.setPageOrderUrl(
        request.applicationId,
        request.pageId,
        request.order,
      ),
    );
  }
}

export default PageApi;
