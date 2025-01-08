import type { ApiResponse } from "./ApiResponses";
import type { AxiosPromise } from "axios";
import type {
  LayoutOnLoadActionErrors,
  PageAction,
} from "../constants/AppsmithActionConstants/ActionConstants";
import type { DSLWidget } from "../WidgetProvider/constants";
import type { FetchApplicationResponse } from "../ee/api/ApplicationApi";
import type { APP_MODE } from "../entities/App";

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
export type GenerateTemplatePageRequestResponse = ApiResponse<GenerateTemplatePageResponseData>;
export type FetchPageResponse = ApiResponse<FetchPageResponseData>;
export type FetchPublishedPageResponse = ApiResponse<FetchPublishedPageResponseData>;

export interface FetchAppAndPagesRequest {
  applicationId?: string | null;
  pageId?: string | null;
  mode: APP_MODE;
}
