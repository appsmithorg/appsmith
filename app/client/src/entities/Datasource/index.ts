import type { APIResponseError } from "api/ApiResponses";
import type { ActionConfig, Property, StoredDatasource } from "entities/Action";
import { get, set, isString, isNil, isObject } from "lodash";
import type { SSL } from "./RestAPIForm";

export enum AuthType {
  OAUTH2 = "oAuth2",
  DBAUTH = "dbAuth",
}

export enum AuthenticationStatus {
  NONE = "NONE",
  IN_PROGRESS = "IN_PROGRESS",
  SUCCESS = "SUCCESS",
  FAILURE = "FAILURE",
  FAILURE_ACCESS_DENIED = "FAILURE_ACCESS_DENIED",
  FAILURE_FILE_NOT_SELECTED = "FAILURE_FILE_NOT_SELECTED",
  IN_PROGRESS_PERMISSIONS_GRANTED = "IN_PROGRESS_PERMISSIONS_GRANTED",
}

export enum FilePickerActionStatus {
  CANCEL = "cancel",
  PICKED = "picked",
  LOADED = "loaded",
}

export enum ActionType {
  AUTHORIZE = "authorize",
  DOCUMENTATION = "documentation",
}

/*
  Types of messages that can be shown in the toast of the datasource configuration page
  EMPTY_TOAST_MESSAGE: No message to be shown
  TEST_DATASOURCE_SUCCESS: Test datasource success message
  TEST_DATASOURCE_ERROR: Test datasource error message
*/
export enum ToastMessageType {
  EMPTY_TOAST_MESSAGE = "EMPTY_TOAST_MESSAGE",
  TEST_DATASOURCE_SUCCESS = "TEST_DATASOURCE_SUCCESS",
  TEST_DATASOURCE_ERROR = "TEST_DATASOURCE_ERROR",
}

export interface DatasourceAuthentication {
  authType?: string;
  username?: string;
  password?: string;
  label?: string;
  headerPrefix?: string;
  value?: string;
  addTo?: string;
  bearerToken?: string;
  authenticationStatus?: string;
  authenticationType?: string;
  secretExists?: Record<string, boolean>;
  isAuthorized?: boolean;
  scopeString?: string;
}

export interface DatasourceColumns {
  name: string;
  type: string;
}

export interface DatasourceKeys {
  name: string;
  type: string;
  columnNames: string[];
  fromColumns: string[];
}

export interface DatasourceStructure {
  tables?: DatasourceTable[];
  error?: APIResponseError;
}

export interface QueryTemplate {
  actionConfiguration?: ActionConfig;
  configuration: Record<string, unknown>;
  title: string;
  body: string;
  pluginSpecifiedTemplates?: Array<{ key?: string; value?: unknown }>;
  suggested: boolean;
}
export interface DatasourceTable {
  type: string;
  name: string;
  columns: DatasourceColumns[];
  keys: DatasourceKeys[];
  templates: QueryTemplate[];
}

// todo: check which fields are truly optional and move the common ones into base
interface BaseDatasource {
  pluginId: string;
  name: string;
  type?: string;
  workspaceId: string;
  userPermissions?: string[];
  isDeleting?: boolean;
  isMock?: boolean;
}

export const isEmbeddedAIDataSource = (datasource: StoredDatasource) => {
  return !datasource.id;
};

export const isEmbeddedRestDatasource = (
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  val: any,
): val is EmbeddedRestDatasource => {
  if (!isObject(val)) return false;

  if (!("datasourceConfiguration" in val)) return false;

  val = <EmbeddedRestDatasource>val;

  // Object should exist and have value
  if (!val.datasourceConfiguration) return false;

  //url might exist as a key but not have value, so we won't check value
  if (!("url" in val.datasourceConfiguration)) return false;

  return true;
};

export interface EmbeddedRestDatasource extends BaseDatasource {
  id?: string;
  datasourceConfiguration: { url: string };
  invalids: Array<string>;
  messages: Array<string>;
  isValid: boolean;
}

export enum DatasourceConnectionMode {
  READ_ONLY = "READ_ONLY",
  READ_WRITE = "READ_WRITE",
}

export interface DatasourceConfiguration {
  url: string;
  authentication?: ExternalSaasDSAuthentication | DatasourceAuthentication;
  properties?: Property[];
  headers?: Property[];
  queryParameters?: Property[];
  databaseName?: string;
  connection?: {
    mode: DatasourceConnectionMode;
    ssl: SSL;
  };
}

export interface Datasource extends BaseDatasource {
  id: string;
  // key in the map representation of environment id of type string
  datasourceStorages: Record<string, DatasourceStorage>;
  success?: boolean;
  isMock?: boolean;
  invalids?: string[];
  messages?: string[];
}

export interface DatasourceStorage {
  datasourceId: string;
  environmentId: string;
  datasourceConfiguration: DatasourceConfiguration;
  isValid: boolean;
  structure?: DatasourceStructure;
  isConfigured?: boolean;
  toastMessage?: string;
}

export interface TokenResponse {
  datasource: Datasource;
  token: string;
  projectID: string;
}

export interface MockDatasource {
  name: string;
  description: string;
  packageName: string;
  pluginType: string;
  pluginName?: string;
}

export const DEFAULT_DATASOURCE = (
  pluginId: string,
  workspaceId: string,
): EmbeddedRestDatasource => ({
  name: "DEFAULT_REST_DATASOURCE",
  datasourceConfiguration: {
    url: "",
  },
  invalids: [],
  isValid: true,
  pluginId,
  workspaceId,
  messages: [],
});

export enum DatasourceStructureContext {
  QUERY_EDITOR = "query-editor",
  DATASOURCE_VIEW_MODE = "datasource-view-mode",
  // this does not exist yet, but in case it does in the future.
  API_EDITOR = "api-editor",
}

export interface ExternalSaasDSAuthentication extends DatasourceAuthentication {
  integrationId: string;
  credentialId: string;
  integrationType: string;
  providerData?: { key: string; value: string | boolean | number }[];
}

export enum AuthenticationType {
  EXTERNAL_SAAS_AUTHENTICATION = "externalSaasAuth",
}
