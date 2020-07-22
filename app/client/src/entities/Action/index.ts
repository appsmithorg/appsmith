import { Datasource } from "api/DatasourcesApi";
import { DataTreeAction } from "../DataTree/dataTreeFactory";

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
  timeoutInMillisecond: number;
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
  queryParameters?: Property[];
  bodyFormData?: BodyFormData[];
}

export interface QueryActionConfig extends ActionConfig {
  body: string;
}

export interface Action {
  id: string;
  name: string;
  datasource: Partial<Datasource>;
  organizationId: string;
  pageId: string;
  collectionId?: string;
  actionConfiguration: Partial<ActionConfig>;
  pluginId: string;
  pluginType: PluginType;
  executeOnLoad: boolean;
  dynamicBindingPathList: Property[];
  isValid: boolean;
  invalids: string[];
  jsonPathKeys: string[];
  cacheResponse: string;
  templateId?: string;
  providerId?: string;
  provider?: ActionProvider;
  documentation?: { text: string };
}

export interface RestAction extends Action {
  actionConfiguration: Partial<ApiActionConfig>;
}

export interface RapidApiAction extends Action {
  actionConfiguration: Partial<ApiActionConfig>;
  templateId: string;
  proverId: string;
  provider: ActionProvider;
  pluginId: string;
  documentation: { text: string };
}

export interface QueryAction extends Action {
  actionConfiguration: Partial<QueryActionConfig>;
}

// export interface GenericAction {
//   isLoading: boolean;
//   config: RestAction | RapidApiAction | QueryAction;
//   data?: any;
// }

export type GenericAction = DataTreeAction;
