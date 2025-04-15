import Api from "api/Api";
import type { ApiResponse } from "./ApiResponses";
import type { AxiosPromise, CancelTokenSource } from "axios";
import axios from "axios";
import type {
  LayoutOnLoadActionErrors,
  PageAction,
} from "constants/AppsmithActionConstants/ActionConstants";
import type { DSLWidget } from "WidgetProvider/constants";
import type { FetchApplicationResponse } from "ee/api/ApplicationApi";
import type { APP_MODE } from "entities/App";

export interface FetchPageRequest {
  pageId: string;
  isFirstLoad?: boolean;
  handleResponseLater?: boolean;
  migrateDSL?: boolean;
  pageWithMigratedDsl?: FetchPageResponse;
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
  isDefault?: boolean;
  isHidden?: boolean;
  id: string;
  baseId: string;
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

export interface CreatePageRequest {
  applicationId: string;
  name: string;
  layouts: Partial<PageLayout>[];
}

export interface UpdatePageRequest {
  pageId: string;
  name?: string;
  isHidden?: boolean;
  customSlug?: string;
}

export interface UpdatePageResponse {
  id: string;
  baseId: string;
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
    baseId: string;
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
  pageId: string;
}

export interface ClonePageRequest {
  pageId: string;
}

export interface UpdateWidgetNameRequest {
  pageId?: string;
  layoutId: string;
  newName: string;
  oldName: string;
  moduleId?: string;
  contextType?: "MODULE" | "PAGE";
}

export interface GenerateTemplatePageRequest {
  pageId: string;
  tableName: string;
  datasourceId: string;
  applicationId: string;
  columns?: string[];
  searchColumn?: string;
  mode?: string;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

export interface FetchAppAndPagesRequest {
  applicationId?: string | null;
  pageId?: string | null;
  mode: APP_MODE;
}

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
