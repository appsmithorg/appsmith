import type { ApplicationPagePayload, FetchApplicationResponse } from "../../ee/api/ApplicationApi";
import type { ApplicationPayload } from "../../entities/Application";
import type { Page } from "../../entities/Page";
import type { ApiResponse } from "../../api/ApiResponses";
import type { ProductAlert } from "../../reducers/uiReducers/usersReducer";
import type { FeatureFlags } from "../../ee/entities/FeatureFlag";
import type { Action, ActionViewMode } from "../../entities/Action";
import type { JSCollection } from "../../entities/JSCollection";
import type { FetchPageResponse, FetchPageResponseData } from "../../api/PageApi";
import type { AppTheme } from "../../entities/AppTheming";
import type { Datasource } from "../../entities/Datasource";
import type { Plugin, PluginFormPayload } from "../../api/PluginApi";
import type { PACKAGE_PULL_STATUS } from "../../ee/constants/ModuleConstants";
import { ReduxActionTypes } from "../../ee/constants/ReduxActionConstants";

// Types are already exported with their declarations

const URL_CHANGE_ACTIONS = [
  ReduxActionTypes.CURRENT_APPLICATION_NAME_UPDATE,
  ReduxActionTypes.UPDATE_PAGE_SUCCESS,
  ReduxActionTypes.UPDATE_APPLICATION_SUCCESS,
] as const;

export interface ReduxURLChangeAction {
  type: typeof URL_CHANGE_ACTIONS;
  payload: ApplicationPagePayload | ApplicationPayload | Page;
}

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
  packagePullStatus: ApiResponse<PACKAGE_PULL_STATUS>;
}

export type InitConsolidatedApi = DeployConsolidatedApi | EditConsolidatedApi;
