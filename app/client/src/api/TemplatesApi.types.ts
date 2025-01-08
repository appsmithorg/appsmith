import type { AxiosPromise } from "axios";
import type { ApiResponse } from "./ApiResponses";
import type { WidgetType } from "../constants/WidgetConstants";
import type {
  ApplicationResponsePayload,
  ApplicationPagePayload,
} from "../ee/api/ApplicationApi";
import type { Datasource } from "../entities/Datasource";

export interface Template {
  id: string;
  userPermissions: string[];
  title: string;
  description: string;
  appUrl: string;
  gifUrl: string;
  screenshotUrls: string[];
  widgets: WidgetType[];
  functions: string[];
  useCases: string[];
  datasources: string[];
  pages: ApplicationPagePayload[];
  allowPageImport: boolean;
  templateGridColumnSize?: number;
  templateGridRowSize?: number;
}

export type FetchTemplatesResponse = ApiResponse<Template[]>;
export type FilterKeys = "widgets" | "datasources";
export type FetchTemplateResponse = ApiResponse<Template>;

export type ImportTemplateResponse = ApiResponse<{
  isPartialImport: boolean;
  unConfiguredDatasourceList: Datasource[];
  application: ApplicationResponsePayload;
}>;

export interface TemplateFiltersResponse extends ApiResponse {
  data: {
    functions: string[];
    useCases?: string[];
  };
}

export interface PublishCommunityTemplateRequest {
  applicationId: string;
  workspaceId: string;
  branchName: string;
  title: string;
  headline: string;
  description: string;
  useCases: string[];
  authorEmail: string;
}

export type PublishCommunityTemplateResponse = ApiResponse<{
  isPublic: boolean;
  forkingEnabled: boolean;
  isCommunityTemplate: boolean;
  modifiedAt: string;
}>;

// Re-export imported types for backward compatibility
export type { AxiosPromise, ApiResponse, WidgetType, ApplicationResponsePayload, ApplicationPagePayload, Datasource };
