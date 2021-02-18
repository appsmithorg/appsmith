import { EmbeddedRestDatasource } from "entities/Datasource";
import { DynamicPath } from "../../utils/DynamicBindingUtils";
import _ from "lodash";

export enum PluginType {
  API = "API",
  DB = "DB",
}

export enum PaginationType {
  NONE = "NONE",
  PAGE_NO = "PAGE_NO",
  URL = "URL",
}

export interface ActionConfig {
  timeoutInMillisecond?: number;
  paginationType?: PaginationType;
}

export interface ActionProvider {
  name: string;
  imageUrl: string;
  url: string;
  description: string;
  credentialSteps: string;
}

export interface Property {
  key: string;
  value: string;
}

export interface BodyFormData {
  editable: boolean;
  mandatory: boolean;
  description: string;
  key: string;
  value?: string;
  type: string;
}

export interface ApiActionConfig extends ActionConfig {
  headers: Property[];
  httpMethod: string;
  path?: string;
  body?: JSON | string | Record<string, any> | null;
  encodeParamsToggle: boolean;
  queryParameters?: Property[];
  bodyFormData?: BodyFormData[];
}

export interface QueryActionConfig extends ActionConfig {
  body?: string;
}

export const isStoredDatasource = (val: any): val is StoredDatasource => {
  if (!_.isObject(val)) return false;
  if (!("id" in val)) return false;
  return true;
};
export interface StoredDatasource {
  id: string;
}

interface BaseAction {
  id: string;
  name: string;
  organizationId: string;
  pageId: string;
  collectionId?: string;
  pluginId: string;
  executeOnLoad: boolean;
  dynamicBindingPathList: DynamicPath[];
  isValid: boolean;
  invalids: string[];
  jsonPathKeys: string[];
  cacheResponse: string;
  confirmBeforeExecute?: boolean;
  eventData?: any;
}

interface BaseApiAction extends BaseAction {
  pluginType: PluginType.API;
  actionConfiguration: ApiActionConfig;
}

export interface EmbeddedApiAction extends BaseApiAction {
  datasource: EmbeddedRestDatasource;
}

export interface StoredDatasourceApiAction extends BaseApiAction {
  datasource: StoredDatasource;
}

export type ApiAction = EmbeddedApiAction | StoredDatasourceApiAction;

export type RapidApiAction = ApiAction & {
  templateId: string;
  proverId: string;
  provider: ActionProvider;
  pluginId: string;
  documentation: { text: string };
};

export interface QueryAction extends BaseAction {
  pluginType: PluginType.DB;
  actionConfiguration: QueryActionConfig;
  datasource: StoredDatasource;
}

export type ActionViewMode = {
  id: string;
  name: string;
  pageId: string;
  jsonPathKeys: string[];
  confirmBeforeExecute?: boolean;
  timeoutInMillisecond?: number;
};

export type Action = ApiAction | QueryAction;
