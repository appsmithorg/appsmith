import type { ApiResponse } from "api/types";

export interface FetchStatusRequestParams {
  compareRemote?: boolean;
}
export interface FetchStatusResponseData {
  added: string[];
  aheadCount: number;
  behindCount: number;
  conflicting: string[];
  datasourcesAdded: string[];
  datasourcesModified: string[];
  datasourcesRemoved: string[];
  discardDocUrl: string;
  isClean: boolean;
  jsLibsAdded: string[];
  jsLibsModified: string[];
  jsLibsRemoved: string[];
  jsObjectsAdded: string[];
  jsObjectsModified: string[];
  jsObjectsRemoved: string[];
  migrationMessage: string;
  modified: string[];
  modifiedDatasources: number;
  modifiedJSLibs: number;
  modifiedJSObjects: number;
  modifiedPages: number;
  modifiedQueries: number;
  modifiedSourceModules: number;
  modifiedModuleInstances: number;
  pagesAdded: string[];
  pagesModified: string[];
  pagesRemoved: string[];
  queriesAdded: string[];
  queriesModified: string[];
  queriesRemoved: string[];
  remoteBranch: string;
  removed: string[];
}

export type FetchStatusResponse = ApiResponse<FetchStatusResponseData>;
