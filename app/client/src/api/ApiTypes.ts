import type { FetchApplicationResponse } from "@appsmith/api/ApplicationApi";
import type { FeatureFlags } from "@appsmith/entities/FeatureFlag";
import type { Action, ActionViewMode } from "entities/Action";
import type { AppTheme } from "entities/AppTheming";
import type { Datasource } from "entities/Datasource";
import type { JSCollection } from "entities/JSCollection";
import type { ProductAlert } from "reducers/uiReducers/usersReducer";
import type { ApiResponse } from "./ApiResponses";
import type { FetchPageResponse, FetchPageResponseData } from "./PageApi";
import type { PluginFormPayload } from "./PluginApi";
import type { Plugin } from "api/PluginApi";

export type InitConsolidatedApi = DeployConsolidatedApi | EditConsolidatedApi;

export interface DeployConsolidatedApi {
  productAlert: ApiResponse<ProductAlert>;
  tenantConfig: ApiResponse;
  featureFlags: ApiResponse<FeatureFlags>;
  userProfile: ApiResponse;
  pages: FetchApplicationResponse;
  publishedActions: ApiResponse<ActionViewMode[]>;
  publishedActionCollections: ApiResponse<JSCollection[]>;
  customJSLibraries: ApiResponse;
  pageWithMigratedDsl: FetchPageResponse;
  currentTheme: ApiResponse<AppTheme[]>;
  themes: ApiResponse<AppTheme>;
}

export interface EditConsolidatedApi {
  productAlert: ApiResponse<ProductAlert>;
  tenantConfig: ApiResponse;
  featureFlags: ApiResponse<FeatureFlags>;
  userProfile: ApiResponse;
  pages: FetchApplicationResponse;
  publishedActions: ApiResponse<ActionViewMode[]>;
  publishedActionCollections: ApiResponse<JSCollection[]>;
  customJSLibraries: ApiResponse;
  pageWithMigratedDsl: FetchPageResponse;
  currentTheme: ApiResponse<AppTheme[]>;
  themes: ApiResponse<AppTheme>;
  datasources: ApiResponse<Datasource[]>;
  pagesWithMigratedDsl: ApiResponse<FetchPageResponseData[]>;
  plugins: ApiResponse<Plugin[]>;
  mockDatasources: ApiResponse;
  pluginFormConfigs: ApiResponse<PluginFormPayload>[];
  unpublishedActions: ApiResponse<Action[]>;
  unpublishedActionCollections: ApiResponse<JSCollection[]>;
}
