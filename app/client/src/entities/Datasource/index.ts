import { APIResponseError } from "api/ApiResponses";
import { ActionConfig, Property } from "entities/Action";
import _ from "lodash";

export enum AuthType {
  OAUTH2 = "oAuth2",
  DBAUTH = "dbAuth",
}

export enum AuthenticationStatus {
  NONE = "NONE",
  IN_PROGRESS = "IN_PROGRESS",
  SUCCESS = "SUCCESS",
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
}

export interface DatasourceColumns {
  name: string;
  type: string;
}

export interface DatasourceKeys {
  name: string;
  type: string;
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
  workspaceId: string;
  isValid: boolean;
  isConfigured?: boolean;
}

export const isEmbeddedRestDatasource = (
  val: any,
): val is EmbeddedRestDatasource => {
  if (!_.isObject(val)) return false;
  if (!("datasourceConfiguration" in val)) return false;
  val = <EmbeddedRestDatasource>val;
  // Object should exist and have value
  if (!val.datasourceConfiguration) return false;
  //url might exist as a key but not have value, so we won't check value
  if (!("url" in val.datasourceConfiguration)) return false;
  return true;
};

export interface EmbeddedRestDatasource extends BaseDatasource {
  datasourceConfiguration: { url: string };
  invalids: Array<string>;
  messages: Array<string>;
}

export interface DatasourceConfiguration {
  url: string;
  authentication?: DatasourceAuthentication;
  properties?: Property[];
  headers?: Property[];
  queryParameters?: Property[];
  databaseName?: string;
}

export interface Datasource extends BaseDatasource {
  id: string;
  datasourceConfiguration: DatasourceConfiguration;
  invalids?: string[];
  structure?: DatasourceStructure;
  messages?: string[];
  success?: boolean;
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
