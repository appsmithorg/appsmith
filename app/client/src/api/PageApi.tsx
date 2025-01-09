import Api from "api/Api";
import type { ApiResponse } from "./ApiResponses";
import type { AxiosPromise, CancelTokenSource } from "axios";
import axios from "axios";
import type { FetchApplicationResponse } from "ee/api/ApplicationApi";
import type {
  FetchPageRequest,
  FetchPublishedPageRequest,
  SavePageRequest,
  PageLayout,
  PageLayoutsRequest,
  SavePageResponse,
  CreatePageRequest,
  UpdatePageRequest,
  UpdatePageResponse,
  SetPageOrderRequest,
  DeletePageRequest,
  ClonePageRequest,
  UpdateWidgetNameRequest,
  GenerateTemplatePageRequest,
  FetchPageResponse,
  FetchPublishedPageResponse,
  FetchPageListResponse,
  UpdateWidgetNameResponse,
  GenerateTemplatePageRequestResponse,
  FetchAppAndPagesRequest,
} from "./PageApi.types";

class PageApi extends Api {
  static url = "v1/pages";
  static pageUpdateCancelTokenSource?: CancelTokenSource = undefined;

  static getPublishedPageURL = (pageId: string, bustCache?: boolean) => {
    const url = `v1/pages/${pageId}/view`;

    return !!bustCache ? url + "?v=" + +new Date() : url;
  };

  static async fetchPage(
    pageRequest: FetchPageRequest,
  ): Promise<AxiosPromise<FetchPageResponse>> {
    const params = { migrateDsl: pageRequest.migrateDSL };

    return Api.get(PageApi.url + "/" + pageRequest.pageId, undefined, {
      params,
    });
  }

  static savePage(
    request: SavePageRequest,
  ): AxiosPromise<SavePageResponse> | undefined {
    if (PageApi.pageUpdateCancelTokenSource) {
      PageApi.pageUpdateCancelTokenSource.cancel();
    }

    const body = { dsl: request.dsl };

    PageApi.pageUpdateCancelTokenSource = axios.CancelToken.source();
    const { applicationId, layoutId, pageId } = request;

    return Api.put(
      `v1/layouts/${layoutId}/pages/${pageId}?applicationId=${applicationId}`,
      body,
      undefined,
      { cancelToken: PageApi.pageUpdateCancelTokenSource.token },
    );
  }

  static async saveAllPages(
    applicationId: string,
    pageLayouts: PageLayoutsRequest[],
  ) {
    return Api.put(`v1/layouts/application/${applicationId}`, {
      pageLayouts,
    });
  }

  static async fetchPublishedPage(
    pageRequest: FetchPublishedPageRequest,
  ): Promise<AxiosPromise<FetchPublishedPageResponse>> {
    return Api.get(
      PageApi.getPublishedPageURL(pageRequest.pageId, pageRequest.bustCache),
    );
  }

  static async createPage(
    request: CreatePageRequest,
  ): Promise<AxiosPromise<FetchPageResponse>> {
    return Api.post(PageApi.url, request);
  }

  static async updatePage(
    request: UpdatePageRequest,
  ): Promise<AxiosPromise<ApiResponse<UpdatePageResponse>>> {
    const { pageId, ...rest } = request;

    return Api.put(`${PageApi.url}/${pageId}`, rest);
  }

  static async generateTemplatePage(
    request: GenerateTemplatePageRequest,
  ): Promise<AxiosPromise<ApiResponse>> {
    const { pageId, ...rest } = request;

    if (pageId) {
      return Api.put(`${PageApi.url}/crud-page/${pageId}`, rest);
    } else {
      return Api.post(`${PageApi.url}/crud-page`, rest);
    }
  }

  static async deletePage(
    request: DeletePageRequest,
  ): Promise<AxiosPromise<ApiResponse>> {
    return Api.delete(`${PageApi.url}/${request.pageId}`);
  }

  static async clonePage(
    request: ClonePageRequest,
  ): Promise<AxiosPromise<FetchPageResponse>> {
    return Api.post(`${PageApi.url}/clone/${request.pageId}`);
  }

  static async updateWidgetName(
    request: UpdateWidgetNameRequest,
  ): Promise<AxiosPromise<UpdateWidgetNameResponse>> {
    return Api.put("v1/layouts/refactor", request);
  }

  static async setPageOrder(
    request: SetPageOrderRequest,
  ): Promise<AxiosPromise<FetchPageListResponse>> {
    const { applicationId, order, pageId } = request;

    return Api.put(
      `v1/applications/${applicationId}/page/${pageId}/reorder?order=${order}`,
    );
  }

  static async fetchAppAndPages(
    params: FetchAppAndPagesRequest,
  ): Promise<AxiosPromise<FetchApplicationResponse>> {
    return Api.get(PageApi.url, params);
  }
}

export default PageApi;
