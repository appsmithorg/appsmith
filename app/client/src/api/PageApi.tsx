import Api from "api/Api";
import type { ApiResponse } from "./ApiResponses";
import type { AxiosPromise, CancelTokenSource } from "axios";
import axios from "axios";
import type {
  LayoutOnLoadActionErrors,
  PageAction,
} from "constants/AppsmithActionConstants/ActionConstants";
import type { DSLWidget } from "WidgetProvider/constants";
import type {
  ClonePageActionPayload,
  CreatePageActionPayload,
} from "actions/pageActions";
import type { FetchApplicationResponse } from "@appsmith/api/ApplicationApi";

export interface FetchPageRequest {
  id: string;
  isFirstLoad?: boolean;
  handleResponseLater?: boolean;
  migrateDSL?: boolean;
}

export interface FetchPublishedPageRequest {
  pageId: string;
  bustCache?: boolean;
}

export interface SavePageRequest {
  dsl: DSLWidget;
  layoutId: string;
  pageId: string;
  applicationId: string;
}

export interface PageLayout {
  id: string;
  dsl: Partial<DSLWidget>;
  layoutOnLoadActions: PageAction[][];
  layoutActions: PageAction[];
  layoutOnLoadActionErrors?: LayoutOnLoadActionErrors[];
}

export interface PageLayoutsRequest {
  layoutId: string;
  pageId: string;
  layout: {
    dsl: DSLWidget;
  };
}

export interface FetchPageResponseData {
  id: string;
  name: string;
  slug: string;
  applicationId: string;
  layouts: Array<PageLayout>;
  lastUpdatedTime: number;
  customSlug?: string;
  userPermissions?: string[];
  layoutOnLoadActionErrors?: LayoutOnLoadActionErrors[];
}

export type FetchPublishedPageResponseData = FetchPageResponseData;

export interface SavePageResponseData {
  id: string;
  layoutOnLoadActions: PageAction[][];
  dsl: Partial<DSLWidget>;
  messages: string[];
  actionUpdates: Array<{
    executeOnLoad: boolean;
    id: string;
    name: string;
    collectionId?: string;
  }>;
  layoutOnLoadActionErrors?: Array<LayoutOnLoadActionErrors>;
}

export type CreatePageRequest = Omit<
  CreatePageActionPayload,
  "blockNavigation"
>;

export interface UpdatePageRequest {
  id: string;
  name?: string;
  isHidden?: boolean;
  customSlug?: string;
}

export interface UpdatePageResponse {
  id: string;
  name: string;
  slug: string;
  customSlug?: string;
  applicationId: string;
  layouts: Array<PageLayout>;
  isHidden: boolean;
  lastUpdatedTime: number;
  defaultResources: unknown[];
}

export interface SetPageOrderRequest {
  order: number;
  pageId: string;
  applicationId: string;
}

export type CreatePageResponse = ApiResponse;

export interface FetchPageListResponseData {
  pages: Array<{
    id: string;
    name: string;
    isDefault: boolean;
    isHidden?: boolean;
    layouts: Array<PageLayout>;
    slug: string;
    userPermissions?: string[];
    description?: string;
  }>;
  workspaceId: string;
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

export interface GenerateTemplatePageResponseData {
  id: string;
  name: string;
  applicationId: string;
  layouts: Array<PageLayout>;
}

export type SavePageResponse = ApiResponse<SavePageResponseData>;

export type FetchPageListResponse = ApiResponse<FetchPageListResponseData>;

export type UpdateWidgetNameResponse = ApiResponse<PageLayout>;

export type GenerateTemplatePageRequestResponse =
  ApiResponse<GenerateTemplatePageResponseData>;

export type FetchPageResponse = ApiResponse<FetchPageResponseData>;

export type FetchPublishedPageResponse =
  ApiResponse<FetchPublishedPageResponseData>;

class PageApi extends Api {
  static url = "v1/pages";
  static refactorLayoutURL = "v1/layouts/refactor";
  static pageUpdateCancelTokenSource?: CancelTokenSource = undefined;
  static getLayoutUpdateURL = (
    applicationId: string,
    pageId: string,
    layoutId: string,
  ) => {
    return `v1/layouts/${layoutId}/pages/${pageId}?applicationId=${applicationId}`;
  };

  static getGenerateTemplateURL = (pageId?: string) => {
    return `${PageApi.url}/crud-page${pageId ? `/${pageId}` : ""}`;
  };

  static getPublishedPageURL = (pageId: string, bustCache?: boolean) => {
    const url = `v1/pages/${pageId}/view`;
    return !!bustCache ? url + "?v=" + +new Date() : url;
  };

  static getSaveAllPagesURL = (applicationId: string) => {
    return `v1/layouts/application/${applicationId}`;
  };

  static updatePageUrl = (pageId: string) => `${PageApi.url}/${pageId}`;
  static setPageOrderUrl = (
    applicationId: string,
    pageId: string,
    order: number,
  ) => `v1/applications/${applicationId}/page/${pageId}/reorder?order=${order}`;

  static async fetchPage(
    pageRequest: FetchPageRequest,
  ): Promise<AxiosPromise<FetchPageResponse>> {
    const params = { migrateDsl: pageRequest.migrateDSL };
    return Api.get(PageApi.url + "/" + pageRequest.id, undefined, { params });
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
        savePageRequest.applicationId,
        savePageRequest.pageId,
        savePageRequest.layoutId,
      ),
      body,
      undefined,
      { cancelToken: PageApi.pageUpdateCancelTokenSource.token },
    );
  }

  static async saveAllPages(
    applicationId: string,
    pageLayouts: PageLayoutsRequest[],
  ) {
    return Api.put(PageApi.getSaveAllPagesURL(applicationId), {
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
    createPageRequest: CreatePageRequest,
  ): Promise<AxiosPromise<FetchPageResponse>> {
    return Api.post(PageApi.url, createPageRequest);
  }

  static async updatePage(
    request: UpdatePageRequest,
  ): Promise<AxiosPromise<ApiResponse<UpdatePageResponse>>> {
    return Api.put(PageApi.updatePageUrl(request.id), request);
  }

  static async generateTemplatePage(
    request: GenerateTemplatePageRequest,
  ): Promise<AxiosPromise<ApiResponse>> {
    if (request.pageId) {
      return Api.put(PageApi.getGenerateTemplateURL(request.pageId), request);
    } else {
      return Api.post(PageApi.getGenerateTemplateURL(), request);
    }
  }

  static async fetchPageList(
    applicationId: string,
  ): Promise<AxiosPromise<FetchPageListResponse>> {
    return Api.get(PageApi.url + "/application/" + applicationId);
  }

  static async fetchPageListViewMode(
    applicationId: string,
  ): Promise<AxiosPromise<FetchPageListResponse>> {
    return Api.get(PageApi.url + "/view/application/" + applicationId);
  }

  static async deletePage(
    request: DeletePageRequest,
  ): Promise<AxiosPromise<ApiResponse>> {
    return Api.delete(PageApi.url + "/" + request.id);
  }

  static async clonePage(
    request: ClonePageRequest,
  ): Promise<AxiosPromise<ApiResponse>> {
    return Api.post(PageApi.url + "/clone/" + request.id);
  }

  static async updateWidgetName(
    request: UpdateWidgetNameRequest,
  ): Promise<AxiosPromise<UpdateWidgetNameResponse>> {
    return Api.put(PageApi.refactorLayoutURL, request);
  }

  static async setPageOrder(
    request: SetPageOrderRequest,
  ): Promise<AxiosPromise<FetchPageListResponse>> {
    return Api.put(
      PageApi.setPageOrderUrl(
        request.applicationId,
        request.pageId,
        request.order,
      ),
    );
  }

  static async fetchAppAndPages(
    params: any,
  ): Promise<AxiosPromise<FetchApplicationResponse>> {
    return Api.get(PageApi.url, params);
  }
}

export default PageApi;
