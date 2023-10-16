import Api from "api/Api";
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
  RapidApiEditorForm = "RapidApiEditorForm",
  JsEditorForm = "JsEditorForm",
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
}

export interface PluginFormPayload {
  form: any[];
  editor: any[];
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

class PluginsApi extends Api {
  static url = "v1/plugins";
  static defaultDynamicTriggerURL(datasourceId: string): string {
    return `/v1/datasources/${datasourceId}/trigger`;
  }
  static async fetchPlugins(
    workspaceId: string,
  ): Promise<AxiosPromise<ApiResponse<Plugin[]>>> {
    return Api.get(PluginsApi.url, { workspaceId: workspaceId });
  }

  static async fetchFormConfig(
    id: string,
  ): Promise<AxiosPromise<ApiResponse<PluginFormPayload>>> {
    return Api.get(PluginsApi.url + `/${id}/form`);
  }

  // Definition to fetch the dynamic data via the URL passed in the config
  static async fetchDynamicFormValues(
    url: string,
    body: Record<string, any>,
  ): Promise<AxiosPromise<ApiResponse>> {
    return Api.post(url, body);
  }

  static async fetchDefaultPlugins(): Promise<
    AxiosPromise<ApiResponse<DefaultPlugin[]>>
  > {
    return Api.get(PluginsApi.url + `/default/icons`);
  }
}

export default PluginsApi;
