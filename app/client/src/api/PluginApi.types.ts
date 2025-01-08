import type { AxiosPromise } from "axios";
import type { ApiResponse } from "api/ApiResponses";
import type { PluginPackageName, PluginType } from "entities/Action";
import type { DependencyMap } from "utils/DynamicBindingUtils";

export type PluginId = string;
export type GenerateCRUDEnabledPluginMap = Record<PluginId, PluginPackageName>;

export enum UIComponentTypes {
  DbEditorForm = "DbEditorForm",
  UQIDbEditorForm = "UQIDbEditorForm",
  ApiEditorForm = "ApiEditorForm",
  JsEditorForm = "JsEditorForm",
  GraphQLEditorForm = "GraphQLEditorForm",
}

export enum DatasourceComponentTypes {
  RestAPIDatasourceForm = "RestAPIDatasourceForm",
  AutoForm = "AutoForm",
}

export interface Plugin {
  id: string;
  name: string;
  type: PluginType;
  packageName: PluginPackageName;
  iconLocation?: string;
  uiComponent: UIComponentTypes;
  datasourceComponent: DatasourceComponentTypes;
  allowUserDatasources?: boolean;
  templates: Record<string, string>;
  responseType?: "TABLE" | "JSON";
  documentationLink?: string;
  generateCRUDPageComponent?: string;
  requiresDatasource: boolean;
}

export interface PluginFormPayload {
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: any[];
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  editor: any[];
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setting: any[];
  dependencies: DependencyMap;
  formButton: string[];
}

export interface DefaultPlugin {
  id: string;
  name: string;
  packageName: string;
  iconLocation?: string;
  allowUserDatasources?: boolean;
}

// Re-export types for backward compatibility
export type { AxiosPromise, ApiResponse, PluginPackageName, PluginType, DependencyMap };
